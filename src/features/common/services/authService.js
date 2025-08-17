const { BrowserWindow, shell } = require('electron');
const fetch = require('node-fetch');
const encryptionService = require('./encryptionService');
const sessionRepository = require('../repositories/session');
const permissionService = require('./permissionService');



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

            // Clean up any zombie sessions from a previous run for this user.
            await sessionRepository.endAllActiveSessions();

            // Initialize encryption key for the logged-in user if permissions are already granted
            if (process.platform === 'darwin' && !(await permissionService.checkKeychainCompleted(this.currentUserId))) {
                console.warn('[AuthService] Keychain permission not yet completed for this user. Deferring key initialization.');
            } else {
                await encryptionService.initializeKey(this.currentUserId);
            }

            // Broadcast the new user state
            this.broadcastUserState();

            return { success: true, user: this.getCurrentUser() };

        } catch (error) {
            console.error('[AuthService] Kettle authentication failed:', error);
            return { success: false, error: error.message };
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

            // Reset encryption
            encryptionService.resetSessionKey();

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
            encryptionService.resetSessionKey();
            this.broadcastUserState();
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