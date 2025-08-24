const { BrowserWindow, shell } = require('electron');
const fetch = require('node-fetch');

const sessionRepository = require('../repositories/session');
const permissionService = require('./permissionService');
const kettleApiKeyService = require('./kettleApiKeyService');
const appUsabilityService = require('./appUsabilityService');



class AuthService {
    constructor() {
        this.currentUserId = 'default_user';
        this.currentUserMode = 'local'; // 'local' or 'kettle'
        this.currentUser = null;
        this.isInitialized = false;
        this.kettleToken = null;

        sessionRepository.setAuthService(this);
    }

    initialize() {
        if (this.isInitialized) return Promise.resolve();

        this.isInitialized = true;
        console.log('[AuthService] Initialized successfully.');
        return Promise.resolve();
    }



    async authenticateWithKettle(credentials) {
        try {
            console.log('[AuthService] Authenticating with Kettle app...');
            
            // Call Kettle app login endpoint
            const response = await fetch('https://www.isotryon.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Login failed`);
            }

            if (!data.success || !data.token) {
                throw new Error(data.message || 'Invalid response from Kettle app');
            }

            // Extract user information from response
            const { token, user } = data;
            console.log('[AuthService] Successfully authenticated with Kettle app:', user.email);
            console.log('[AuthService] Full user response:', JSON.stringify(user, null, 2));
            console.log('[AuthService] User tokens object:', user.tokens);
            console.log('[AuthService] User subscription object:', user.subscription);

            // Check if user has sufficient tokens for AI operations
            // Handle different possible token response structures
            let tokenInfo = null;
            
            // Check for tokens in user.tokens (expected format)
            if (user.tokens) {
                // Handle both possible token field names
                if (user.tokens.remaining !== undefined) {
                    tokenInfo = {
                        total: user.tokens.total || user.tokens.totalTokens || 0,
                        used: user.tokens.used || user.tokens.usedTokens || 0,
                        remaining: user.tokens.remaining || user.tokens.remainingTokens || 0
                    };
                } else if (user.tokens.remainingTokens !== undefined) {
                    tokenInfo = {
                        total: user.tokens.totalTokens || 0,
                        used: user.tokens.usedTokens || 0,
                        remaining: user.tokens.remainingTokens
                    };
                }
            }
            // Check for tokens directly in user object (alternative format)
            else if (user.totalTokens !== undefined && user.remainingTokens !== undefined) {
                tokenInfo = {
                    total: user.totalTokens,
                    used: user.usedTokens || 0,
                    remaining: user.remainingTokens
                };
            }
            // Check for tokens in subscription object
            else if (user.subscription && user.subscription.tokens) {
                tokenInfo = user.subscription.tokens;
            }

            if (tokenInfo && tokenInfo.remaining !== undefined) {
                const remainingTokens = tokenInfo.remaining;
                console.log(`[AuthService] Token information found:`, tokenInfo);
                console.log(`[AuthService] User has ${remainingTokens} tokens remaining`);
                
                // Store token information for future validation
                this.userTokens = {
                    total: tokenInfo.total || 0,
                    used: tokenInfo.used || 0,
                    remaining: remainingTokens
                };

                // Update app usability based on token availability
                if (remainingTokens <= 0) {
                    appUsabilityService.updateAppUsability(false, 'No tokens remaining', this.userTokens);
                    throw new Error('Access denied: You have no tokens remaining. Please purchase more tokens or wait for your next billing cycle.');
                } else {
                    appUsabilityService.updateAppUsability(true, `App usable with ${remainingTokens} tokens remaining`, this.userTokens);
                }
            } else {
                console.warn('[AuthService] No token information available in user response');
                this.userTokens = null;
                appUsabilityService.updateAppUsability(false, 'No token information available');
                throw new Error('No token information available. Please contact support.');
            }

            // Only proceed with user state update if tokens are sufficient
            // Update local user state
            this.currentUser = {
                uid: user.id || user.uid,
                email: user.email,
                displayName: user.username || user.displayName || user.name,
                photoURL: user.avatar || user.photoURL
            };
            this.currentUserId = this.currentUser.uid;
            this.currentUserMode = 'kettle'; // New mode for Kettle app users

            // Store the JWT token for future API calls
            this.kettleToken = token;

            // Store the user ID from Kettle app response
            if (user && user.id) {
                this.currentUserId = user.id;
                console.log('[AuthService] Stored Kettle user ID:', this.currentUserId);
            }

            // Fetch OpenAI API key from Kettle app's ConfigDump system
            console.log('[AuthService] Fetching OpenAI API key from Kettle app...');
            const openaiApiKeyResult = await kettleApiKeyService.fetchOpenAIApiKey(token);
            
            if (openaiApiKeyResult.success && openaiApiKeyResult.apiKey) {
                console.log('[AuthService] Successfully fetched OpenAI API key from Kettle app');
                // Store the OpenAI API key in provider settings
                await this.storeKettleApiKey(openaiApiKeyResult.apiKey);
            } else if (openaiApiKeyResult.success && !openaiApiKeyResult.apiKey) {
                console.log('[AuthService] No OpenAI API key available from Kettle app:', openaiApiKeyResult.error);
            } else {
                console.warn('[AuthService] Failed to fetch OpenAI API key from Kettle app:', openaiApiKeyResult.error);
            }

            console.log('[AuthService] Fetching Anthropic API key from Kettle app...');
            const anthropicApiKeyResult = await kettleApiKeyService.fetchAnthropicApiKey(token);
            
            if (anthropicApiKeyResult.success && anthropicApiKeyResult.apiKey) {
                console.log('[AuthService] Successfully fetched Anthropic API key from Kettle app');
                // Store the Anthropic API key in provider settings
                await this.storeKettleAnthropicApiKey(anthropicApiKeyResult.apiKey);
            } else if (anthropicApiKeyResult.success && !anthropicApiKeyResult.apiKey) {
                console.log('[AuthService] No Anthropic API key available from Kettle app:', anthropicApiKeyResult.error);
            } else {
                console.warn('[AuthService] Failed to fetch Anthropic API key from Kettle app:', anthropicApiKeyResult.error);
            }

            // Clean up any zombie sessions from a previous run for this user.
            await sessionRepository.endAllActiveSessions();

            // Encryption service removed - no longer needed

            // Broadcast the new user state
            this.broadcastUserState();

            return { success: true, user: this.getCurrentUser() };

        } catch (error) {
            console.error('[AuthService] Kettle authentication failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate if user has sufficient tokens for AI operations
     * @param {number} requiredTokens - Number of tokens required for the operation
     * @param {string} requiredPlan - Minimum subscription plan required (optional)
     * @returns {Object} Validation result
     */
    async validateTokensForOperation(requiredTokens = 1, requiredPlan = 'free') {
        try {
            if (!this.kettleToken) {
                throw new Error('Not authenticated with Kettle app');
            }

            if (!this.userTokens) {
                throw new Error('No token information available');
            }

            const { remaining } = this.userTokens;
            
            if (remaining < requiredTokens) {
                return {
                    success: false,
                    valid: false,
                    error: 'INSUFFICIENT_TOKENS',
                    message: `Insufficient tokens for this operation. Required: ${requiredTokens}, Available: ${remaining}`,
                    required: requiredTokens,
                    available: remaining
                };
            }

            return {
                success: true,
                valid: true,
                tokens: this.userTokens,
                willHaveAfterOperation: remaining - requiredTokens
            };
        } catch (error) {
            console.error('[AuthService] Token validation failed:', error);
            return {
                success: false,
                valid: false,
                error: 'VALIDATION_ERROR',
                message: error.message
            };
        }
    }

    /**
     * Check if app is usable (user has tokens)
     * @returns {boolean} True if app is usable, false if no tokens
     */
    isAppUsable() {
        if (this.currentUserMode !== 'kettle') {
            return true; // Local mode is always usable
        }
        
        if (!this.userTokens) {
            return false; // No token info means not usable
        }
        
        return this.userTokens.remaining > 0;
    }

    /**
     * Check if current user should be blocked due to insufficient tokens
     * @returns {boolean} True if user should be blocked, false otherwise
     */
    shouldBlockCurrentUser() {
        if (this.currentUserMode !== 'kettle') {
            return false; // Local mode users are never blocked
        }
        
        if (!this.userTokens) {
            return true; // No token info means blocked
        }
        
        return this.userTokens.remaining <= 0;
    }

    /**
     * Get app usability status with details
     * @returns {Object} App usability information
     */
    getAppUsabilityStatus() {
        if (this.currentUserMode !== 'kettle') {
            return {
                usable: true,
                reason: 'Local mode - no token restrictions'
            };
        }
        
        if (!this.userTokens) {
            return {
                usable: false,
                reason: 'No token information available',
                error: 'NO_TOKEN_INFO'
            };
        }
        
        if (this.userTokens.remaining <= 0) {
            return {
                usable: false,
                reason: 'No tokens remaining',
                error: 'NO_TOKENS_REMAINING',
                tokens: this.userTokens
            };
        }
        
        return {
            usable: true,
            reason: `App usable with ${this.userTokens.remaining} tokens remaining`,
            tokens: this.userTokens
        };
    }

    /**
     * Force logout user if they have insufficient tokens
     * This ensures users with 0 tokens cannot use the app
     */
    async enforceTokenRestrictions() {
        if (this.shouldBlockCurrentUser()) {
            console.log('[AuthService] Enforcing token restrictions - user has insufficient tokens');
            await this.logoutFromKettle();
            return false; // User was logged out
        }
        return true; // User can continue
    }

    /**
     * Get current user's token status
     * @returns {Object|null} Token information or null if not available
     */
    getCurrentTokenStatus() {
        return this.userTokens;
    }

    /**
     * Set current user context for token tracking
     * @param {string} userId - User ID from kettle service
     * @param {string} token - JWT token for authentication
     */
    setCurrentUserContext(userId, token) {
        this.currentUserId = userId;
        this.currentUserToken = token;
        console.log(`[AuthService] Current user context set for token tracking: ${userId ? 'Logged in' : 'Logged out'}`);
    }

    /**
     * Update user tokens after AI operation
     * @param {number} tokensUsed - Number of tokens used in the operation
     * @returns {Object} Update result
     */
    async updateTokensAfterOperation(tokensUsed) {
        console.log('[AuthService] updateTokensAfterOperation called with:', tokensUsed);
        try {
            if ((!this.kettleToken && !this.currentUserToken) || !this.userTokens) {
                console.log('[AuthService] Missing authentication token or userTokens:', { 
                    hasKettleToken: !!this.kettleToken,
                    hasCurrentUserToken: !!this.currentUserToken,
                    hasUserTokens: !!this.userTokens 
                });
                throw new Error('Not authenticated or no token information available');
            }

            // Update local token count
            this.userTokens.used += tokensUsed;
            this.userTokens.remaining = Math.max(0, this.userTokens.remaining - tokensUsed);

            console.log(`[AuthService] Updated tokens after operation. Used: ${tokensUsed}, Remaining: ${this.userTokens.remaining}`);

            // Update app usability based on new token count
            if (this.userTokens.remaining <= 0) {
                appUsabilityService.updateAppUsability(false, 'No tokens remaining after operation', this.userTokens);
                
                // Force logout when tokens are exhausted
                console.log('[AuthService] Tokens exhausted, forcing logout');
                this.forceLogoutDueToTokenExhaustion();
            } else if (this.userTokens.remaining <= 10) {
                appUsabilityService.updateAppUsability(true, `Low tokens remaining: ${this.userTokens.remaining}`, this.userTokens);
            } else {
                appUsabilityService.updateAppUsability(true, `App usable with ${this.userTokens.remaining} tokens remaining`, this.userTokens);
            }

            // Sync with Kettle app using the appropriate token
            const authToken = this.currentUserToken || this.kettleToken;
            try {
                await fetch('https://www.isotryon.com/api/user/update-tokens', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        userId: this.currentUserId,
                        tokensConsumed: tokensUsed,
                        operation: 'add'
                    })
                });
            } catch (syncError) {
                console.warn('[AuthService] Failed to sync tokens with Kettle app:', syncError.message);
                // Continue with local update even if sync fails
            }

            return {
                success: true,
                tokensUsed,
                remainingTokens: this.userTokens.remaining,
                newTokenStatus: this.userTokens
            };
        } catch (error) {
            console.error('[AuthService] Failed to update tokens after operation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Force logout when tokens are exhausted
     */
    async forceLogoutDueToTokenExhaustion() {
        try {
            console.log('[AuthService] Force logout due to token exhaustion');
            
            // Send notification to renderer about forced logout
            if (typeof window !== 'undefined' && window.api) {
                window.api.common.emitAppUsabilityChanged({
                    usable: false,
                    reason: 'Tokens exhausted - forced logout',
                    tokenStatus: this.userTokens
                });
            }
            
            // Perform the logout
            await this.logoutFromKettle();
            
        } catch (error) {
            console.error('[AuthService] Error during force logout:', error);
            // Even if there's an error, try to clear local state
            this.currentUser = null;
            this.currentUserId = 'default_user';
            this.currentUserMode = 'local';
            this.kettleToken = null;
            this.currentUserToken = null;
            this.userTokens = null;
            this.broadcastUserState();
        }
    }

    async logoutFromKettle() {
        try {
            if (this.currentUserMode === 'kettle' && this.kettleToken) {
                // Call Kettle app logout endpoint
                await fetch('https://www.isotryon.com/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.kettleToken}`
                    }
                });
            }

            // Clear local state
            this.currentUser = null;
            this.currentUserId = 'default_user';
            this.currentUserMode = 'local';
            this.kettleToken = null;

            // End active sessions
            await sessionRepository.endAllActiveSessions();

            // Encryption service removed - no longer needed

            // Broadcast the new user state
            this.broadcastUserState();

            console.log('[AuthService] Successfully logged out from Kettle app');
        } catch (error) {
            console.error('[AuthService] Error during Kettle logout:', error);
            // Even if the API call fails, clear local state
            this.currentUser = null;
            this.currentUserId = 'default_user';
            this.currentUserMode = 'local';
            this.kettleToken = null;
            await sessionRepository.endAllActiveSessions();
            // Encryption service removed - no longer needed
            this.broadcastUserState();
        }
    }

    /**
     * Store the OpenAI API key fetched from Kettle app in local provider settings
     * @param {string} apiKey - The OpenAI API key to store
     */
    async storeKettleApiKey(apiKey) {
        try {
            console.log('[AuthService] Storing OpenAI API key from Kettle app in local settings...');
            
            // Import the provider settings repository
            const providerSettingsRepository = require('../repositories/providerSettings');
            
            // Store the API key for OpenAI provider
            await providerSettingsRepository.upsert('openai', {
                api_key: apiKey,
                selected_llm_model: 'gpt-4.1', // Default model
                selected_stt_model: 'gpt-4o-mini-transcribe', // Force STT model
                created_at: Date.now()
            });

            // Set OpenAI as the active provider for both LLM and STT
            await providerSettingsRepository.setActiveProvider('openai', 'llm');
            await providerSettingsRepository.setActiveProvider('openai', 'stt');
            
            // Refresh the model state to ensure STT is properly configured
            const modelStateService = require('./modelStateService');
            await modelStateService.forceSttToGpt4oMini();
            
            console.log('[AuthService] Successfully stored OpenAI API key from Kettle app and set as active for both LLM and STT');
            
        } catch (error) {
            console.error('[AuthService] Error storing OpenAI API key from Kettle app:', error);
        }
    }

    /**
     * Store Anthropic API key from Kettle app in local settings
     * @param {string} apiKey - The Anthropic API key from Kettle
     */
    async storeKettleAnthropicApiKey(apiKey) {
        try {
            console.log('[AuthService] Storing Anthropic API key from Kettle app in local settings...');
            
            // Import the provider settings repository
            const providerSettingsRepository = require('../repositories/providerSettings');
            
            // Store the API key for Anthropic provider
            await providerSettingsRepository.upsert('anthropic', {
                api_key: apiKey,
                selected_llm_model: 'claude-3-7-sonnet-20250219', // Force Claude 3.7 Sonnet
                created_at: Date.now()
            });

            // Set Anthropic as the active LLM provider
            await providerSettingsRepository.setActiveProvider('anthropic', 'llm');
            
            console.log('[AuthService] Successfully stored Anthropic API key from Kettle app');
            
        } catch (error) {
            console.error('[AuthService] Error storing Anthropic API key from Kettle app:', error);
        }
    }

    /**
     * Sync local OpenAI API key back to Kettle app
     * @param {string} apiKey - The OpenAI API key to sync
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async syncApiKeyToKettle(apiKey) {
        try {
            if (!this.kettleToken) {
                throw new Error('No Kettle authentication token available');
            }

            console.log('[AuthService] Syncing OpenAI API key to Kettle app...');
            
            // Note: This would require a new endpoint in Kettle app to store API keys
            // For now, we'll just log that this would be synced
            console.log('[AuthService] API key sync to Kettle app not yet implemented - would sync:', apiKey.substring(0, 10) + '...');
            
            return { success: true };
            
        } catch (error) {
            console.error('[AuthService] Error syncing API key to Kettle app:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Refresh API keys from Kettle app
     * @returns {Promise<{success: boolean, openaiApiKey?: string, anthropicApiKey?: string, error?: string}>}
     */
    async refreshApiKeysFromKettle() {
        try {
            if (!this.kettleToken) {
                throw new Error('No Kettle authentication token available');
            }

            console.log('[AuthService] Refreshing API keys from Kettle app...');
            
            // Refresh OpenAI API key
            const openaiApiKeyResult = await kettleApiKeyService.fetchOpenAIApiKey(this.kettleToken);
            let openaiApiKey = null;
            
            if (openaiApiKeyResult.success && openaiApiKeyResult.apiKey) {
                await this.storeKettleApiKey(openaiApiKeyResult.apiKey);
                openaiApiKey = openaiApiKeyResult.apiKey;
                console.log('[AuthService] Successfully refreshed OpenAI API key');
            } else {
                console.warn('[AuthService] Failed to refresh OpenAI API key:', openaiApiKeyResult.error);
            }

            // Refresh Anthropic API key
            const anthropicApiKeyResult = await kettleApiKeyService.fetchAnthropicApiKey(this.kettleToken);
            let anthropicApiKey = null;
            
            if (anthropicApiKeyResult.success && anthropicApiKeyResult.apiKey) {
                await this.storeKettleAnthropicApiKey(anthropicApiKeyResult.apiKey);
                anthropicApiKey = anthropicApiKeyResult.apiKey;
                console.log('[AuthService] Successfully refreshed Anthropic API key');
            } else {
                console.warn('[AuthService] Failed to refresh Anthropic API key:', anthropicApiKeyResult.error);
            }

            const success = openaiApiKey || anthropicApiKey;
            return { 
                success: !!success, 
                openaiApiKey, 
                anthropicApiKey,
                error: success ? null : 'Failed to refresh any API keys'
            };
            
        } catch (error) {
            console.error('[AuthService] Error refreshing API keys from Kettle app:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user has access to API keys in Kettle app
     * @returns {Promise<{success: boolean, hasAccess: boolean, error?: string}>}
     */
    async checkKettleApiKeyAccess() {
        try {
            if (!this.kettleToken) {
                return { success: true, hasAccess: false, error: 'No Kettle authentication token' };
            }

            console.log('[AuthService] Checking API key access in Kettle app...');
            
            const accessResult = await kettleApiKeyService.checkApiKeyAccess(this.kettleToken);
            return accessResult;
            
        } catch (error) {
            console.error('[AuthService] Error checking API key access:', error);
            return { success: false, hasAccess: false, error: error.message };
        }
    }

    /**
     * Get user's subscription status from Kettle app
     * @returns {Promise<{success: boolean, subscription?: object, error?: string}>}
     */
    async getKettleSubscription() {
        try {
            if (!this.kettleToken) {
                return { success: true, subscription: null, error: 'No Kettle authentication token' };
            }

            console.log('[AuthService] Getting subscription status from Kettle app...');
            
            const subscriptionResult = await kettleApiKeyService.getUserSubscription(this.kettleToken);
            return subscriptionResult;
            
        } catch (error) {
            console.error('[AuthService] Error getting subscription status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate subscription status before AI operation
     * @param {number} requiredTokens - Number of tokens required for the operation
     * @param {string} requiredPlan - Minimum plan required (optional)
     * @returns {Promise<{success: boolean, valid: boolean, error?: string, subscription?: object}>}
     */
    async validateSubscriptionForOperation(requiredTokens = 1, requiredPlan = 'free') {
        try {
            if (!this.kettleToken) {
                return { success: true, valid: false, error: 'No Kettle authentication token' };
            }

            console.log('[AuthService] Validating subscription for operation...');
            
            // Call Kettle app's validate-subscription endpoint
            const response = await fetch('https://www.isotryon.com/api/auth/validate-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.kettleToken}`
                },
                body: JSON.stringify({
                    requiredTokens,
                    requiredPlan
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Subscription validation failed`);
            }

            const data = await response.json();
            
            if (!data.success) {
                return { success: true, valid: false, error: data.message, subscription: data.subscription };
            }

            console.log('[AuthService] Subscription validation successful');
            return {
                success: true,
                valid: data.valid,
                subscription: data.subscription,
                tokens: data.tokens
            };
            
        } catch (error) {
            console.error('[AuthService] Error validating subscription:', error);
            return { success: false, valid: false, error: error.message };
        }
    }

    /**
     * Use tokens after AI operation
     * @param {number} amount - Number of tokens used
     * @returns {Promise<{success: boolean, error?: string, tokensUsed?: number, remainingTokens?: number}>}
     */
    async useTokens(amount = 1) {
        try {
            if (!this.kettleToken) {
                return { success: false, error: 'No Kettle authentication token' };
            }

            console.log('[AuthService] Using tokens after AI operation...');
            
            // Call Kettle app's use-tokens endpoint
            const response = await fetch('https://www.isotryon.com/api/subscription/use-tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.kettleToken}`
                },
                body: JSON.stringify({ amount })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Token usage failed`);
            }

            const data = await response.json();
            
            if (!data.success) {
                return { success: false, error: data.message };
            }

            console.log('[AuthService] Tokens used successfully');
            return {
                success: true,
                tokensUsed: data.tokensUsed,
                remainingTokens: data.remainingTokens
            };
            
        } catch (error) {
            console.error('[AuthService] Error using tokens:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update user tokens in Kettle app
     * @param {string} userId - User ID
     * @param {number} tokensConsumed - Number of tokens consumed
     * @param {string} operation - Operation type: 'add', 'subtract', or 'set'
     * @returns {Promise<{success: boolean, error?: string, previousTokens?: object, newTokens?: object}>}
     */
    async updateUserTokens(userId, tokensConsumed, operation = 'add') {
        try {
            if (!this.kettleToken) {
                return { success: false, error: 'No Kettle authentication token' };
            }

            console.log('[AuthService] Updating user tokens in Kettle app...');
            
            // Call Kettle app's update-tokens endpoint
            const response = await fetch('https://www.isotryon.com/api/user/update-tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.kettleToken}`
                },
                body: JSON.stringify({
                    userId,
                    tokensConsumed,
                    operation
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Token update failed`);
            }

            const data = await response.json();
            
            if (!data.success) {
                return { success: false, error: data.message };
            }

            console.log('[AuthService] User tokens updated successfully');
            return {
                success: true,
                previousTokens: data.previousTokens,
                newTokens: data.newTokens,
                operation: data.operation
            };
            
        } catch (error) {
            console.error('[AuthService] Error updating user tokens:', error);
            return { success: false, error: error.message };
        }
    }
    
    broadcastUserState() {
        const userState = this.getCurrentUser();
        console.log('[AuthService] Broadcasting user state change:', userState);
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
                win.webContents.send('user-state-changed', userState);
            }
        });
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    /**
     * Get the current user's Kettle ID for API calls
     * @returns {string|null} The Kettle user ID or null if not available
     */
    getKettleUserId() {
        if (this.currentUserMode === 'kettle' && this.currentUserId && this.currentUserId !== 'default_user') {
            return this.currentUserId;
        }
        return null;
    }

    /**
     * Check if the current user is authenticated with Kettle
     * @returns {boolean} True if user is authenticated with Kettle
     */
    isKettleAuthenticated() {
        return this.currentUserMode === 'kettle' && !!this.kettleToken;
    }

    /**
     * Get the current user's subscription plan from Kettle app
     * @returns {Promise<string|null>} The subscription plan or null if not available
     */
    async getCurrentUserSubscriptionPlan() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.plan || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan:', error);
            return null;
        }
    }

    /**
     * Get the current user's remaining tokens from Kettle app
     * @returns {Promise<number|null>} The remaining tokens or null if not available
     */
    async getCurrentUserRemainingTokens() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.remainingTokens || 0;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting remaining tokens:', error);
            return null;
        }
    }

    /**
     * Get the current user's total tokens from Kettle app
     * @returns {Promise<number|null>} The total tokens or null if not available
     */
    async getCurrentUserTotalTokens() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.totalTokens || 0;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting total tokens:', error);
            return null;
        }
    }

    /**
     * Get the current user's used tokens from Kettle app
     * @returns {Promise<number|null>} The used tokens or null if not available
     */
    async getCurrentUserUsedTokens() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.usedTokens || 0;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting used tokens:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription status from Kettle app
     * @returns {Promise<string|null>} The subscription status or null if not available
     */
    async getCurrentUserSubscriptionStatus() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.status || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription status:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription end date from Kettle app
     * @returns {Promise<string|null>} The subscription end date or null if not available
     */
    async getCurrentUserSubscriptionEndDate() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.currentPeriodEnd || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription end date:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription start date from Kettle app
     * @returns {Promise<string|null>} The subscription start date or null if not available
     */
    async getCurrentUserSubscriptionStartDate() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.currentPeriodStart || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription start date:', error);
            return null;
        }
    }

    /**
     * Check if the current user's subscription is set to cancel at period end
     * @returns {Promise<boolean|null>} True if subscription will cancel, false if not, null if not available
     */
    async isCurrentUserSubscriptionCancelling() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.cancelAtPeriodEnd || false;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error checking subscription cancel status:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription price from Kettle app
     * @returns {Promise<number|null>} The subscription price in cents or null if not available
     */
    async getCurrentUserSubscriptionPrice() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.price || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription price:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription duration from Kettle app
     * @returns {Promise<string|null>} The subscription duration or null if not available
     */
    async getCurrentUserSubscriptionDuration() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.duration || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription duration:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription features from Kettle app
     * @returns {Promise<Array|null>} The subscription features or null if not available
     */
    async getCurrentUserSubscriptionFeatures() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.features || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription features:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan name from Kettle app
     * @returns {Promise<string|null>} The subscription plan name or null if not available
     */
    async getCurrentUserSubscriptionPlanName() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planName || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan name:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan description from Kettle app
     * @returns {Promise<string|null>} The subscription plan description or null if not available
     */
    async getCurrentUserSubscriptionPlanDescription() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planDescription || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan description:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan features from Kettle app
     * @returns {Promise<Array|null>} The subscription plan features or null if not available
     */
    async getCurrentUserSubscriptionPlanFeatures() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planFeatures || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan features:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan price from Kettle app
     * @returns {Promise<number|null>} The subscription plan price in cents or null if not available
     */
    async getCurrentUserSubscriptionPlanPrice() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planPrice || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan price:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan duration from Kettle app
     * @returns {Promise<string|null>} The subscription plan duration or null if not available
     */
    async getCurrentUserSubscriptionPlanDuration() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planDuration || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan duration:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan tokens from Kettle app
     * @returns {Promise<number|null>} The subscription plan tokens or null if not available
     */
    async getCurrentUserSubscriptionPlanTokens() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planTokens || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan tokens:', error);
            return null;
        }
    }

    /**
     * Get the current user's subscription plan features from Kettle app
     * @returns {Promise<Array|null>} The subscription plan features or null if not available
     */
    async getCurrentUserSubscriptionPlanFeatures() {
        try {
            if (!this.isKettleAuthenticated()) {
                return null;
            }

            const subscriptionResult = await this.getKettleSubscription();
            if (subscriptionResult.success && subscriptionResult.subscription) {
                return subscriptionResult.subscription.planFeatures || null;
            }
            return null;
        } catch (error) {
            console.error('[AuthService] Error getting subscription plan features:', error);
            return null;
        }
    }

    getCurrentUser() {
        const isLoggedIn = !!(this.currentUserMode === 'kettle') && this.currentUser;

        if (isLoggedIn) {
            return {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                mode: 'kettle',
                isLoggedIn: true,
            };
        }
        return {
            uid: this.currentUserId, // returns 'default_user'
            email: 'contact@pickle.com',
            displayName: 'Default User',
            mode: 'local',
            isLoggedIn: false,
        };
    }
}

const authService = new AuthService();
module.exports = authService; 