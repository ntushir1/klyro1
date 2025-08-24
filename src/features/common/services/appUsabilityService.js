/**
 * App Usability Service
 * Manages whether the app is usable based on user authentication and token availability
 */

class AppUsabilityService {
    constructor() {
        this.isUsable = true;
        this.reason = 'App is usable';
        this.tokenStatus = null;
    }

    /**
     * Check if the app is currently usable
     * @returns {boolean} True if app is usable, false otherwise
     */
    isAppUsable() {
        return this.isUsable;
    }

    /**
     * Get detailed app usability status
     * @returns {Object} App usability information
     */
    getAppUsabilityStatus() {
        return {
            usable: this.isUsable,
            reason: this.reason,
            tokenStatus: this.tokenStatus
        };
    }

    /**
     * Update app usability status
     * @param {boolean} usable - Whether the app is usable
     * @param {string} reason - Reason for the status
     * @param {Object} tokenStatus - Current token status
     */
    updateAppUsability(usable, reason, tokenStatus = null) {
        this.isUsable = usable;
        this.reason = reason;
        this.tokenStatus = tokenStatus;
        
        console.log(`[AppUsabilityService] App usability updated: ${usable} - ${reason}`);
        
        // Emit event for other components to listen to
        if (typeof window !== 'undefined' && window.api) {
            window.api.common.emitAppUsabilityChanged({ usable, reason, tokenStatus });
        }
    }

    /**
     * Check if a specific operation is allowed
     * @param {string} operation - Operation name (e.g., 'ask', 'listen', 'summary')
     * @param {number} requiredTokens - Tokens required for the operation
     * @returns {Object} Operation permission result
     */
    canPerformOperation(operation, requiredTokens = 1) {
        if (!this.isUsable) {
            return {
                allowed: false,
                reason: this.reason,
                operation,
                requiredTokens
            };
        }

        if (this.tokenStatus && this.tokenStatus.remaining < requiredTokens) {
            return {
                allowed: false,
                reason: `Insufficient tokens for ${operation}. Required: ${requiredTokens}, Available: ${this.tokenStatus.remaining}`,
                operation,
                requiredTokens,
                availableTokens: this.tokenStatus.remaining
            };
        }

        return {
            allowed: true,
            operation,
            requiredTokens,
            availableTokens: this.tokenStatus?.remaining || 'unlimited'
        };
    }

    /**
     * Get a user-friendly message about why the app is not usable
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage() {
        if (this.isUsable) {
            return 'App is ready to use';
        }

        if (this.reason.includes('No tokens remaining')) {
            return 'You have no tokens remaining. Please purchase more tokens to continue using the app.';
        }

        if (this.reason.includes('Insufficient tokens')) {
            return 'You don\'t have enough tokens for this operation. Please purchase more tokens.';
        }

        return this.reason || 'App is currently not usable';
    }
}

// Create singleton instance
const appUsabilityService = new AppUsabilityService();

module.exports = appUsabilityService;
