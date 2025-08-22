const fetch = require('node-fetch');

class KettleApiKeyService {
    constructor() {
        this.baseUrl = 'https://www.isotryon.com/api';
    }

    /**
     * Fetch the OpenAI API key from Kettle app's ConfigDump system
     * @param {string} kettleToken - JWT token from successful Kettle authentication
     * @returns {Promise<{success: boolean, apiKey?: string, error?: string}>}
     */
    async fetchOpenAIApiKey(kettleToken) {
        try {
            console.log('[KettleApiKeyService] Fetching OpenAI API key from Kettle app ConfigDump...');
            
            // Call the ConfigDump endpoint to get the OPEN_AI_API_KEY
            const response = await fetch(`${this.baseUrl}/config/OPEN_AI_API_KEY`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kettleToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed - invalid or expired token');
                } else if (response.status === 403) {
                    throw new Error('Active subscription required to access API keys');
                } else if (response.status === 404) {
                    throw new Error('OpenAI API key not found in Kettle app');
                } else {
                    throw new Error(`HTTP ${response.status}: Failed to fetch API key`);
                }
            }

            const data = await response.json();
            //console.log('[KettleApiKeyService] Raw response from Kettle app:', JSON.stringify(data, null, 2));
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch API key from Kettle app');
            }

            if (!data.dumpvalue) {
                console.log('[KettleApiKeyService] Response structure:', Object.keys(data));
                throw new Error('No API key value found in response');
            }

            console.log('[KettleApiKeyService] Successfully fetched OpenAI API key from Kettle app');
            return {
                success: true,
                apiKey: data.dumpvalue
            };

        } catch (error) {
            console.error('[KettleApiKeyService] Error fetching OpenAI API key:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if the user has access to API keys in Kettle app
     * @param {string} kettleToken - JWT token from successful Kettle authentication
     * @returns {Promise<{success: boolean, hasAccess: boolean, error?: string}>}
     */
    async checkApiKeyAccess(kettleToken) {
        try {
            console.log('[KettleApiKeyService] Checking API key access in Kettle app...');
            
            // Try to fetch any config to check access
            const response = await fetch(`${this.baseUrl}/config/OPEN_AI_API_KEY`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kettleToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return { success: true, hasAccess: false, error: 'Authentication failed' };
            } else if (response.status === 403) {
                return { success: true, hasAccess: false, error: 'Active subscription required' };
            } else if (response.ok) {
                return { success: true, hasAccess: true };
            } else {
                return { success: true, hasAccess: false, error: `HTTP ${response.status}` };
            }

        } catch (error) {
            console.error('[KettleApiKeyService] Error checking API key access:', error);
            return {
                success: false,
                hasAccess: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's subscription status from Kettle app
     * @param {string} kettleToken - JWT token from successful Kettle authentication
     * @returns {Promise<{success: boolean, subscription?: object, error?: string}>}
     */
    async getUserSubscription(kettleToken) {
        try {
            console.log('[KettleApiKeyService] Fetching user subscription from Kettle app...');
            
            const response = await fetch(`${this.baseUrl}/subscription/current`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${kettleToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch subscription`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch subscription');
            }

            console.log('[KettleApiKeyService] Successfully fetched user subscription');
            return {
                success: true,
                subscription: data.subscription
            };

        } catch (error) {
            console.error('[KettleApiKeyService] Error fetching user subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const kettleApiKeyService = new KettleApiKeyService();
module.exports = kettleApiKeyService;
