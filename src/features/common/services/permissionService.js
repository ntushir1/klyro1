const { systemPreferences, shell, desktopCapturer } = require('electron');
const permissionRepository = require('../repositories/permission');

/**
 * PermissionService - macOS Screen Recording Permission Best Practices
 * 
 * Apple requires that screen recording permissions are checked and managed via native APIs
 * and only granted through system preferences on macOS 10.15+:
 * 
 * 1. Use systemPreferences.getMediaAccessStatus('screen') to check permission state
 * 2. If permission is not granted, request user to manually enable it via System Preferences
 * 3. Use shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')
 * 4. The permission only takes effect after user adds the app in Security & Privacy > Screen Recording and restarts the app
 * 5. There is NO programmatic way to grant screen recording permission - it must be done manually by the user
 * 
 * Reference: https://developer.apple.com/documentation/avfoundation/avcapturesession/1385665-addinput
 */

class PermissionService {
  _getAuthService() {
    return require('./authService');
  }

  async checkSystemPermissions() {
    const permissions = {
      microphone: 'unknown',
      screen: 'unknown',
      needsSetup: true
    };

    try {
      if (process.platform === 'darwin') {
        // Check microphone permission
        permissions.microphone = systemPreferences.getMediaAccessStatus('microphone');
        
        // Check screen recording permission using the new dedicated method
        const screenPermission = await this.checkScreenRecordingPermission();
        permissions.screen = screenPermission.status;
        
        // Determine if setup is needed
        permissions.needsSetup = permissions.microphone !== 'granted' || permissions.screen !== 'granted';
        
        // Add additional screen permission details
        permissions.screenDetails = {
          requiresRestart: screenPermission.requiresRestart,
          message: screenPermission.message,
          platform: screenPermission.platform
        };
      } else {
        permissions.microphone = 'granted';
        permissions.screen = 'granted';
        permissions.needsSetup = false;
      }

      console.log('[Permissions] System permissions status:', permissions);
      return permissions;
    } catch (error) {
      console.error('[Permissions] Error checking permissions:', error);
      return {
        microphone: 'unknown',
        screen: 'unknown',
        keychain: 'unknown',
        needsSetup: true,
        error: error.message
      };
    }
  }

  async requestMicrophonePermission() {
    if (process.platform !== 'darwin') {
      return { success: true };
    }

    try {
      const status = systemPreferences.getMediaAccessStatus('microphone');
      console.log('[Permissions] Microphone status:', status);
      if (status === 'granted') {
        return { success: true, status: 'granted' };
      }

      const granted = await systemPreferences.askForMediaAccess('microphone');
      return {
        success: granted,
        status: granted ? 'granted' : 'denied'
      };
    } catch (error) {
      console.error('[Permissions] Error requesting microphone permission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check screen recording permission status using macOS native APIs
   * This follows Apple's best practices for screen recording permissions
   */
  async checkScreenRecordingPermission() {
    if (process.platform !== 'darwin') {
      return { success: true, status: 'granted', platform: 'unsupported' };
    }

    try {
      // Use systemPreferences.getMediaAccessStatus('screen') as recommended by Apple
      const status = systemPreferences.getMediaAccessStatus('screen');
      console.log('[Permissions] Screen recording permission status:', status);
      
      return {
        success: true,
        status: status,
        platform: 'darwin',
        requiresRestart: status === 'granted' ? false : true,
        message: this._getScreenPermissionMessage(status)
      };
    } catch (error) {
      console.error('[Permissions] Error checking screen recording permission:', error);
      return {
        success: false,
        status: 'unknown',
        error: error.message,
        platform: 'darwin'
      };
    }
  }

  /**
   * Get user-friendly message for screen recording permission status
   */
  _getScreenPermissionMessage(status) {
    switch (status) {
      case 'granted':
        return 'Screen recording permission granted';
      case 'denied':
        return 'Screen recording permission denied. Please enable in System Preferences > Security & Privacy > Screen Recording';
      case 'not-determined':
        return 'Screen recording permission not determined. Please enable in System Preferences > Security & Privacy > Screen Recording';
      case 'restricted':
        return 'Screen recording permission restricted by system policy';
      case 'unknown':
        return 'Screen recording permission status unknown';
      default:
        return 'Screen recording permission status unclear';
    }
  }

  async openSystemPreferences(section) {
    if (process.platform !== 'darwin') {
      return { success: false, error: 'Not supported on this platform' };
    }

    try {
      if (section === 'screen-recording') {
        // Step 1: Trigger a screen capture request to register the app
        // This is required to make the app appear in System Preferences > Security & Privacy > Screen Recording
        try {
          console.log('[Permissions] Triggering screen capture request to register app...');
          await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1, height: 1 }
          });
          console.log('[Permissions] App registered for screen recording');
        } catch (captureError) {
          // This error is expected and desired - it means the app is now registered
          console.log('[Permissions] Screen capture request triggered (expected to fail):', captureError.message);
        }
        
        // Step 2: Open System Preferences to the Screen Recording section
        // Users must manually enable the permission here - there's no programmatic way to grant it
        console.log('[Permissions] Opening System Preferences > Security & Privacy > Screen Recording...');
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        
        console.log('[Permissions] System Preferences opened. User must manually enable screen recording permission.');
        console.log('[Permissions] IMPORTANT: App restart required after permission is granted.');
      }
      return { success: true };
    } catch (error) {
      console.error('[Permissions] Error opening system preferences:', error);
      return { success: false, error: error.message };
    }
  }

  async markKeychainCompleted() {
    try {
      await permissionRepository.markKeychainCompleted(this._getAuthService().getCurrentUserId());
      console.log('[Permissions] Marked keychain as completed');
      return { success: true };
    } catch (error) {
      console.error('[Permissions] Error marking keychain as completed:', error);
      return { success: false, error: error.message };
    }
  }

  async checkKeychainCompleted(uid) {
    if (uid === "default_user") {
      return true;
    }
    try {
      const completed = permissionRepository.checkKeychainCompleted(uid);
      console.log('[Permissions] Keychain completed status:', completed);
      return completed;
    } catch (error) {
      console.error('[Permissions] Error checking keychain completed status:', error);
      return false;
    }
  }
}

const permissionService = new PermissionService();
module.exports = permissionService; 