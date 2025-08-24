import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
// import { getOllamaProgressTracker } from '../../features/common/services/localProgressTracker.js'; // 제거됨

export class SettingsView extends LitElement {
    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 240px;
            height: 100%;
            color: white;
        }

        .settings-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background: rgba(20, 20, 20, 0.8);
            border-radius: 12px;
            outline: 0.5px rgba(255, 255, 255, 0.2) solid;
            outline-offset: -1px;
            box-sizing: border-box;
            position: relative;
            overflow-y: auto;
            padding: 12px 12px;
            z-index: 1000;
        }

        .settings-container::-webkit-scrollbar {
            width: 6px;
        }

        .settings-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .settings-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .settings-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .settings-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.15);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            filter: blur(10px);
            z-index: -1;
        }
            
        .settings-button[disabled],
        .api-key-section input[disabled] {
            opacity: 0.4;
            cursor: not-allowed;
            pointer-events: none;
        }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 1;
        }

        .title-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }

        .app-title {
            font-size: 13px;
            font-weight: 500;
            color: white;
            margin: 0 0 4px 0;
        }

        .exit-button {
            background: rgba(255, 59, 48, 0.2);
            border: 1px solid rgba(255, 59, 48, 0.4);
            color: rgba(255, 59, 48, 0.9);
            border-radius: 3px;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.15s ease;
            margin-left: auto;
        }

        .exit-button:hover {
            background: rgba(255, 59, 48, 0.3);
            border-color: rgba(255, 59, 48, 0.6);
            color: rgba(255, 59, 48, 1);
        }

        .exit-button:active {
            transform: scale(0.95);
        }

        .account-info {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
        }

        .invisibility-icon {
            padding-top: 2px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .invisibility-icon.visible {
            opacity: 1;
        }

        .invisibility-icon svg {
            width: 16px;
            height: 16px;
        }

        .shortcuts-section {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 4px 0;
            position: relative;
            z-index: 1;
        }

        .shortcut-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            color: white;
            font-size: 11px;
        }

        .shortcut-name {
            font-weight: 300;
        }

        .shortcut-keys {
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .cmd-key, .shortcut-key {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
        }

        /* Buttons Section */
        .buttons-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 1;
            flex: 1;
        }

        .settings-button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: white;
            padding: 5px 10px;
            font-size: 11px;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
        }

        .settings-button:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .settings-button:active {
            transform: translateY(1px);
        }

        .settings-button.full-width {
            width: 100%;
        }

        .settings-button.half-width {
            flex: 1;
        }

        .settings-button.danger {
            background: rgba(255, 59, 48, 0.1);
            border-color: rgba(255, 59, 48, 0.3);
            color: rgba(255, 59, 48, 0.9);
        }

        .settings-button.danger:hover {
            background: rgba(255, 59, 48, 0.15);
            border-color: rgba(255, 59, 48, 0.4);
        }

        .move-buttons, .bottom-buttons {
            display: flex;
            gap: 4px;
        }

        .api-key-section {
            padding: 6px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .api-key-section input {
            width: 100%;
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            border-radius: 4px;
            padding: 4px;
            font-size: 11px;
            margin-bottom: 4px;
            box-sizing: border-box;
        }

        .api-key-section input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        /* Preset Management Section */
        .preset-section {
            padding: 6px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preset-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }

        .preset-title {
            font-size: 11px;
            font-weight: 500;
            color: white;
        }

        .preset-count {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.5);
            margin-left: 4px;
        }

        .preset-toggle {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 2px;
            transition: background-color 0.15s ease;
        }

        .preset-toggle:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .preset-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            max-height: 120px;
            overflow-y: auto;
        }

        .preset-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 6px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 11px;
            border: 1px solid transparent;
        }

        .preset-item:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.1);
        }

        .preset-item.selected {
            background: rgba(0, 122, 255, 0.25);
            border-color: rgba(0, 122, 255, 0.6);
            box-shadow: 0 0 0 1px rgba(0, 122, 255, 0.3);
        }

        .preset-name {
            color: white;
            flex: 1;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            font-weight: 300;
        }

        .preset-item.selected .preset-name {
            font-weight: 500;
        }

        .preset-status {
            font-size: 9px;
            color: rgba(0, 122, 255, 0.8);
            font-weight: 500;
            margin-left: 6px;
        }

        .no-presets-message {
            padding: 12px 8px;
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
            font-size: 10px;
            line-height: 1.4;
        }

        .no-presets-message .web-link {
            color: rgba(0, 122, 255, 0.8);
            text-decoration: underline;
            cursor: pointer;
        }

        .no-presets-message .web-link:hover {
            color: rgba(0, 122, 255, 1);
        }

        .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 11px;
        }

        .loading-spinner {
            width: 12px;
            height: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 6px;
        }

        .hidden {
            display: none;
        }

        .api-key-section, .model-selection-section {
            padding: 8px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .provider-key-group, .model-select-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        label {
            font-size: 11px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
            margin-left: 2px;
        }
        label > strong {
            color: white;
            font-weight: 600;
        }
        .provider-key-group input {
            width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2);
            color: white; border-radius: 4px; padding: 5px 8px; font-size: 11px; box-sizing: border-box;
        }
        .key-buttons { display: flex; gap: 4px; }
        .key-buttons .settings-button { flex: 1; padding: 4px; }
        .model-list {
            display: flex; flex-direction: column; gap: 2px; max-height: 120px;
            overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 4px;
            padding: 4px; margin-top: 4px;
        }
        .model-item { 
            padding: 5px 8px; 
            font-size: 11px; 
            border-radius: 3px; 
            cursor: pointer; 
            transition: background-color 0.15s; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        .model-item:hover { background-color: rgba(255,255,255,0.1); }
        .model-item.selected { background-color: rgba(0, 122, 255, 0.4); font-weight: 500; }
        .model-status { 
            font-size: 9px; 
            color: rgba(255,255,255,0.6); 
            margin-left: 8px; 
        }
        .model-status.installed { color: rgba(0, 255, 0, 0.8); }
        .model-status.not-installed { color: rgba(255, 200, 0, 0.8); }
        .install-progress {
            flex: 1;
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            margin-left: 8px;
            overflow: hidden;
        }
        .install-progress-bar {
            height: 100%;
            background: rgba(0, 122, 255, 0.8);
            transition: width 0.3s ease;
        }
        
        /* Dropdown styles */
        select.model-dropdown {
            background: rgba(0,0,0,0.2);
            color: white;
            cursor: pointer;
        }
        
        select.model-dropdown option {
            background: #1a1a1a;
            color: white;
        }
        
        select.model-dropdown option:disabled {
            color: rgba(255,255,255,0.4);
        }

        /* Career Settings Styles */
        .career-settings-section {
            padding: 12px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 1;
        }

        /* Mode Settings Styles */
        .mode-settings-section {
            padding: 12px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 1;
        }

        .section-title {
            font-size: 13px;
            font-weight: 600;
            color: white;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .form-group {
            margin-bottom: 12px;
        }

        .form-group:last-child {
            margin-bottom: 0;
        }

        .form-label {
            font-size: 11px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 4px 0;
            display: block;
        }

        .form-control {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 11px;
            box-sizing: border-box;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .form-control:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(0, 0, 0, 0.4);
        }

        .form-control:focus {
            outline: none;
            border-color: rgba(0, 122, 255, 0.6);
            background: rgba(0, 0, 0, 0.5);
        }

        .form-control option {
            background: #1a1a1a;
            color: white;
            padding: 8px;
        }

        .form-control option:disabled {
            color: rgba(255, 255, 255, 0.4);
        }

        .custom-role-input {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 11px;
            box-sizing: border-box;
            transition: all 0.15s ease;
        }

        .custom-role-input:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(0, 0, 0, 0.4);
        }

        .custom-role-input:focus {
            outline: none;
            border-color: rgba(0, 122, 255, 0.6);
            background: rgba(0, 0, 0, 0.5);
        }

        .custom-role-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        /* Authentication Styles */
        .auth-section {
            padding: 12px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 1;
        }

        .auth-buttons {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .auth-button {
            flex: 1;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: center;
        }

        .auth-button:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(0, 0, 0, 0.4);
        }

        .auth-button.signin {
            background: rgba(0, 122, 255, 0.2);
            border-color: rgba(0, 122, 255, 0.4);
        }

        .auth-button.signin:hover {
            background: rgba(0, 122, 255, 0.3);
            border-color: rgba(0, 122, 255, 0.6);
        }

        .auth-button.signup {
            background: rgba(88, 86, 214, 0.2);
            border-color: rgba(88, 86, 214, 0.4);
        }

        .auth-button.signup:hover {
            background: rgba(88, 86, 214, 0.3);
            border-color: rgba(88, 86, 214, 0.6);
        }

        .auth-button.logout {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
        }

        .auth-button.logout:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.6);
        }

        .user-info {
            padding: 12px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-email {
            font-size: 12px;
            font-weight: 500;
            color: white;
            margin-bottom: 4px;
        }

        .user-mode {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 12px;
            text-transform: capitalize;
        }

        .token-status-section {
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 12px;
        }

        .token-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }

        .token-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
        }

        .token-count {
            font-size: 12px;
            color: #22c55e;
            font-weight: 600;
        }

        .token-details {
            text-align: center;
        }

        .token-details small {
            color: rgba(255, 255, 255, 0.5);
            font-size: 10px;
        }

        .token-status-section.no-tokens {
            border-color: rgba(239, 68, 68, 0.4);
            background: rgba(239, 68, 68, 0.1);
        }

        .token-status-section.low-tokens {
            border-color: rgba(245, 158, 11, 0.4);
            background: rgba(245, 158, 11, 0.1);
        }

        .token-count.no-tokens {
            color: #ef4444;
        }

        .token-count.low-tokens {
            color: #f59e0b;
        }

        .token-warning-small {
            margin-top: 4px;
            text-align: center;
        }

        .token-warning-small small {
            color: #f59e0b;
            font-size: 9px;
        }

        .token-warning-banner {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .warning-icon {
            font-size: 20px;
            flex-shrink: 0;
        }

        .warning-content {
            flex: 1;
        }

        .warning-title {
            font-size: 13px;
            font-weight: 600;
            color: #ef4444;
            margin-bottom: 4px;
        }

        .warning-message {
            font-size: 11px;
            color: rgba(239, 68, 68, 0.8);
            line-height: 1.4;
        }

        .warning-action {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.5);
            color: #ef4444;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        .warning-action:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.7);
        }
            
        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            will-change: auto !important;
        }

        :host-context(body.has-glass) * {
            background: transparent !important;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
            border-radius: 0 !important;
            transition: none !important;
            animation: none !important;
        }

        :host-context(body.has-glass) .settings-container::before {
            display: none !important;
        }
    `;


    //////// after_modelStateService ////////
    static properties = {
        shortcuts: { type: Object, state: true },
        currentUser: { type: Object, state: true },
        isLoading: { type: Boolean, state: true },
        isContentProtectionOn: { type: Boolean, state: true },
        saving: { type: Boolean, state: true },
        providerConfig: { type: Object, state: true },
        apiKeys: { type: Object, state: true },
        availableLlmModels: { type: Array, state: true },
        availableSttModels: { type: Array, state: true },
        selectedLlm: { type: String, state: true },
        selectedStt: { type: String, state: true },
        isLlmListVisible: { type: Boolean },
        isSttListVisible: { type: Boolean },
        presets: { type: Array, state: true },
        selectedPreset: { type: Object, state: true },
        showPresets: { type: Boolean, state: true },
        autoUpdateEnabled: { type: Boolean, state: true },
        autoUpdateLoading: { type: Boolean, state: true },
        // Ollama related properties
        ollamaStatus: { type: Object, state: true },
        ollamaModels: { type: Array, state: true },
        installingModels: { type: Object, state: true },
        // Whisper related properties
        whisperModels: { type: Array, state: true },
        // Career settings properties
        selectedIndustry: { type: String, state: true },
        selectedRole: { type: String, state: true },
        experienceRange: { type: String, state: true },
        selectedProgrammingLanguage: { type: String, state: true },
        customRole: { type: String, state: true },
        showCustomRoleInput: { type: Boolean, state: true },
        // Mode settings properties
        selectedMode: { type: String, state: true },
        // Authentication properties
        authEmail: { type: String, state: true },
        authPassword: { type: String, state: true },
    };
    //////// after_modelStateService ////////

    constructor() {
        super();
        //////// after_modelStateService ////////
        this.shortcuts = {};
        this.currentUser = null;
        this.apiKeys = { openai: '', gemini: '', anthropic: '', whisper: '' };
        this.providerConfig = {};
        this.isLoading = true;
        this.isContentProtectionOn = true;
        this.saving = false;
        this.availableLlmModels = [];
        this.availableSttModels = [];
        this.selectedLlm = null;
        this.selectedStt = null;
        this.isLlmListVisible = false;
        this.isSttListVisible = false;
        this.presets = [];
        this.selectedPreset = null;
        this.showPresets = false;
        // Ollama related
        this.ollamaStatus = { installed: false, running: false };
        this.ollamaModels = [];
        this.installingModels = {}; // { modelName: progress }
        // Whisper related
        this.whisperModels = [];
        this.whisperProgressTracker = null; // Will be initialized when needed

        this.autoUpdateEnabled = true;
        this.autoUpdateLoading = true;
        // Career settings initialization
        this.selectedIndustry = '';
        this.selectedRole = '';
        this.experienceRange = '';
        this.selectedProgrammingLanguage = '';
        this.customRole = '';
        this.showCustomRoleInput = false;
        // Mode settings initialization
        this.selectedMode = '';
        // Authentication initialization
        this.authEmail = '';
        this.authPassword = '';
        this.tokenStatus = null;
        this.appUsable = true;
        this.tokenCheckInterval = null;
        this.loadInitialData();
        this.loadCareerSettings();
        //////// after_modelStateService ////////
    }

    async loadAutoUpdateSetting() {
        if (!window.api) return;
        this.autoUpdateLoading = true;
        try {
            const enabled = await window.api.settingsView.getAutoUpdate();
            this.autoUpdateEnabled = enabled;
            console.log('Auto-update setting loaded:', enabled);
        } catch (e) {
            console.error('Error loading auto-update setting:', e);
            this.autoUpdateEnabled = true; // fallback
        }
        this.autoUpdateLoading = false;
        this.requestUpdate();
    }

    async handleToggleAutoUpdate() {
        if (!window.api || this.autoUpdateLoading) return;
        this.autoUpdateLoading = true;
        this.requestUpdate();
        try {
            const newValue = !this.autoUpdateEnabled;
            const result = await window.api.settingsView.setAutoUpdate(newValue);
            if (result && result.success) {
                this.autoUpdateEnabled = newValue;
            } else {
                console.error('Failed to update auto-update setting');
            }
        } catch (e) {
            console.error('Error toggling auto-update:', e);
        }
        this.autoUpdateLoading = false;
        this.requestUpdate();
    }

    async loadLocalAIStatus() {
        try {
            // Load Ollama status
            const ollamaStatus = await window.api.settingsView.getOllamaStatus();
            if (ollamaStatus?.success) {
                this.ollamaStatus = { installed: ollamaStatus.installed, running: ollamaStatus.running };
                this.ollamaModels = ollamaStatus.models || [];
            }
            
            // Load Whisper models status only if Whisper is enabled
            if (this.apiKeys?.whisper === 'local') {
                const whisperModelsResult = await window.api.settingsView.getWhisperInstalledModels();
                if (whisperModelsResult?.success) {
                    const installedWhisperModels = whisperModelsResult.models;
                    if (this.providerConfig?.whisper) {
                        this.providerConfig.whisper.sttModels.forEach(m => {
                            const installedInfo = installedWhisperModels.find(i => i.id === m.id);
                            if (installedInfo) {
                                m.installed = installedInfo.installed;
                            }
                        });
                    }
                }
            }
            
            // Trigger UI update
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading LocalAI status:', error);
        }
    }

    //////// after_modelStateService ////////
    async loadInitialData() {
        if (!window.api) return;
        this.isLoading = true;
        try {
            // Load essential data first
            const [userState, modelSettings, presets, contentProtection, shortcuts] = await Promise.all([
                window.api.settingsView.getCurrentUser(),
                window.api.settingsView.getModelSettings(), // Facade call
                window.api.settingsView.getPresets(),
                window.api.settingsView.getContentProtectionStatus(),
                window.api.settingsView.getCurrentShortcuts()
            ]);
            
            if (userState && userState.isLoggedIn) this.currentUser = userState;
            
            if (modelSettings.success) {
                const { config, storedKeys, availableLlm, availableStt, selectedModels } = modelSettings.data;
                this.providerConfig = config;
                this.apiKeys = storedKeys;
                this.availableLlmModels = availableLlm;
                this.availableSttModels = availableStt;
                this.selectedLlm = selectedModels.llm;
                this.selectedStt = selectedModels.stt;
            }

            this.presets = presets || [];
            this.isContentProtectionOn = contentProtection;
            this.shortcuts = shortcuts || {};
            if (this.presets.length > 0) {
                const firstUserPreset = this.presets.find(p => p.is_default === 0);
                if (firstUserPreset) this.selectedPreset = firstUserPreset;
            }
            
            // Load LocalAI status asynchronously to improve initial load time
            this.loadLocalAIStatus();
        } catch (error) {
            console.error('Error loading initial settings data:', error);
        } finally {
            this.isLoading = false;
        }
    }


    async handleSaveKey(provider) {
        const input = this.shadowRoot.querySelector(`#key-input-${provider}`);
        if (!input) return;
        const key = input.value;
        
        // For Ollama, we need to ensure it's ready first
        if (provider === 'ollama') {
        this.saving = true;
            
            // First ensure Ollama is installed and running
            const ensureResult = await window.api.settingsView.ensureOllamaReady();
            if (!ensureResult.success) {
                alert(`Failed to setup Ollama: ${ensureResult.error}`);
                this.saving = false;
                return;
            }
            
            // Now validate (which will check if service is running)
            const result = await window.api.settingsView.validateKey({ provider, key: 'local' });
            
            if (result.success) {
                await this.refreshModelData();
                await this.refreshOllamaStatus();
            } else {
                alert(`Failed to connect to Ollama: ${result.error}`);
            }
            this.saving = false;
            return;
        }
        
        // For Whisper, just enable it
        if (provider === 'whisper') {
            this.saving = true;
            const result = await window.api.settingsView.validateKey({ provider, key: 'local' });
            
            if (result.success) {
                await this.refreshModelData();
            } else {
                alert(`Failed to enable Whisper: ${result.error}`);
            }
            this.saving = false;
            return;
        }
        
        // For other providers, use the normal flow
        this.saving = true;
        const result = await window.api.settingsView.validateKey({ provider, key });
        
        if (result.success) {
            await this.refreshModelData();
        } else {
            alert(`Failed to save ${provider} key: ${result.error}`);
            input.value = this.apiKeys[provider] || '';
        }
        this.saving = false;
    }
    
    async handleClearKey(provider) {
        console.log(`[SettingsView] handleClearKey: ${provider}`);
        this.saving = true;
        await window.api.settingsView.removeApiKey(provider);
        this.apiKeys = { ...this.apiKeys, [provider]: '' };
        await this.refreshModelData();
        this.saving = false;
    }

    async refreshModelData() {
        const [availableLlm, availableStt, selected, storedKeys] = await Promise.all([
            window.api.settingsView.getAvailableModels({ type: 'llm' }),
            window.api.settingsView.getAvailableModels({ type: 'stt' }),
            window.api.settingsView.getSelectedModels(),
            window.api.settingsView.getAllKeys()
        ]);
        this.availableLlmModels = availableLlm;
        this.availableSttModels = availableStt;
        this.selectedLlm = selected.llm;
        this.selectedStt = selected.stt;
        this.apiKeys = storedKeys;
        this.requestUpdate();
    }
    
    async toggleModelList(type) {
        const visibilityProp = type === 'llm' ? 'isLlmListVisible' : 'isSttListVisible';

        if (!this[visibilityProp]) {
            this.saving = true;
            this.requestUpdate();
            
            await this.refreshModelData();

            this.saving = false;
        }

        // 데이터 새로고침 후, 목록의 표시 상태를 토글합니다.
        this[visibilityProp] = !this[visibilityProp];
        this.requestUpdate();
    }
    
    async selectModel(type, modelId) {
        // Check if this is an Ollama model that needs to be installed
        const provider = this.getProviderForModel(type, modelId);
        if (provider === 'ollama') {
            const ollamaModel = this.ollamaModels.find(m => m.name === modelId);
            if (ollamaModel && !ollamaModel.installed && !ollamaModel.installing) {
                // Need to install the model first
                await this.installOllamaModel(modelId);
                return;
            }
        }
        
        // Check if this is a Whisper model that needs to be downloaded
        if (provider === 'whisper' && type === 'stt') {
            const isInstalling = this.installingModels[modelId] !== undefined;
            const whisperModelInfo = this.providerConfig.whisper.sttModels.find(m => m.id === modelId);
            
            if (whisperModelInfo && !whisperModelInfo.installed && !isInstalling) {
                await this.downloadWhisperModel(modelId);
                return;
            }
        }
        
        this.saving = true;
        await window.api.settingsView.setSelectedModel({ type, modelId });
        if (type === 'llm') this.selectedLlm = modelId;
        if (type === 'stt') this.selectedStt = modelId;
        this.isLlmListVisible = false;
        this.isSttListVisible = false;
        this.saving = false;
        this.requestUpdate();
    }
    
    async refreshOllamaStatus() {
        const ollamaStatus = await window.api.settingsView.getOllamaStatus();
        if (ollamaStatus?.success) {
            this.ollamaStatus = { installed: ollamaStatus.installed, running: ollamaStatus.running };
            this.ollamaModels = ollamaStatus.models || [];
        }
    }
    
    async installOllamaModel(modelName) {
        try {
            // Ollama 모델 다운로드 시작
            this.installingModels = { ...this.installingModels, [modelName]: 0 };
            this.requestUpdate();

            // 진행률 이벤트 리스너 설정 - 통합 LocalAI 이벤트 사용
            const progressHandler = (event, data) => {
                if (data.service === 'ollama' && data.model === modelName) {
                    this.installingModels = { ...this.installingModels, [modelName]: data.progress || 0 };
                    this.requestUpdate();
                }
            };

            // 통합 LocalAI 이벤트 리스너 등록
            window.api.settingsView.onLocalAIInstallProgress(progressHandler);

            try {
                const result = await window.api.settingsView.pullOllamaModel(modelName);
                
                if (result.success) {
                    console.log(`[SettingsView] Model ${modelName} installed successfully`);
                    delete this.installingModels[modelName];
                    this.requestUpdate();
                    
                    // 상태 새로고침
                    await this.refreshOllamaStatus();
                    await this.refreshModelData();
                } else {
                    throw new Error(result.error || 'Installation failed');
                }
            } finally {
                // 통합 LocalAI 이벤트 리스너 제거
                window.api.settingsView.removeOnLocalAIInstallProgress(progressHandler);
            }
        } catch (error) {
            console.error(`[SettingsView] Error installing model ${modelName}:`, error);
            delete this.installingModels[modelName];
            this.requestUpdate();
        }
    }
    
    async downloadWhisperModel(modelId) {
        // Mark as installing
        this.installingModels = { ...this.installingModels, [modelId]: 0 };
        this.requestUpdate();
        
        try {
            // Set up progress listener - 통합 LocalAI 이벤트 사용
            const progressHandler = (event, data) => {
                if (data.service === 'whisper' && data.model === modelId) {
                    this.installingModels = { ...this.installingModels, [modelId]: data.progress || 0 };
                    this.requestUpdate();
                }
            };
            
            window.api.settingsView.onLocalAIInstallProgress(progressHandler);
            
            // Start download
            const result = await window.api.settingsView.downloadWhisperModel(modelId);
            
            if (result.success) {
                // Update the model's installed status
                if (this.providerConfig?.whisper?.sttModels) {
                    const modelInfo = this.providerConfig.whisper.sttModels.find(m => m.id === modelId);
                    if (modelInfo) {
                        modelInfo.installed = true;
                    }
                }
                
                // Remove from installing models
                delete this.installingModels[modelId];
                this.requestUpdate();
                
                // Reload LocalAI status to get fresh data
                await this.loadLocalAIStatus();
                
                // Auto-select the model after download
                await this.selectModel('stt', modelId);
            } else {
                // Remove from installing models on failure too
                delete this.installingModels[modelId];
                this.requestUpdate();
                alert(`Failed to download Whisper model: ${result.error}`);
            }
            
            // Cleanup
            window.api.settingsView.removeOnLocalAIInstallProgress(progressHandler);
        } catch (error) {
            console.error(`[SettingsView] Error downloading Whisper model ${modelId}:`, error);
            // Remove from installing models on error
            delete this.installingModels[modelId];
            this.requestUpdate();
            alert(`Error downloading ${modelId}: ${error.message}`);
        }
    }
    
    getProviderForModel(type, modelId) {
        for (const [providerId, config] of Object.entries(this.providerConfig)) {
            const models = type === 'llm' ? config.llmModels : config.sttModels;
            if (models?.some(m => m.id === modelId)) {
                return providerId;
            }
        }
        return null;
    }

    // Career Settings Methods
    loadCareerSettings() {
        try {
            this.selectedIndustry = localStorage.getItem('careerIndustry') || '';
            this.selectedRole = localStorage.getItem('careerRole') || '';
            this.experienceRange = localStorage.getItem('careerExperience') || '';
            this.selectedProgrammingLanguage = localStorage.getItem('careerProgrammingLanguage') || '';
            this.customRole = localStorage.getItem('careerCustomRole') || '';
            this.showCustomRoleInput = this.selectedRole === 'custom';
            // Load mode settings
            this.selectedMode = localStorage.getItem('careerMode') || 'klyro';
        } catch (error) {
            console.error('Error loading career settings:', error);
        }
    }

    saveCareerSettings() {
        try {
            localStorage.setItem('careerIndustry', this.selectedIndustry);
            localStorage.setItem('careerRole', this.selectedRole);
            localStorage.setItem('careerExperience', this.experienceRange);
            localStorage.setItem('careerProgrammingLanguage', this.selectedProgrammingLanguage);
            localStorage.setItem('careerCustomRole', this.customRole);
            // Save mode settings
            localStorage.setItem('careerMode', this.selectedMode);
        } catch (error) {
            console.error('Error saving career settings:', error);
        }
    }

    getIndustries() {
        return [
            'Technology',
            'Healthcare',
            'Finance',
            'Education',
            'Manufacturing',
            'Retail',
            'Consulting',
            'Media & Entertainment',
            'Government',
            'Non-profit',
            'Other'
        ];
    }

    getJobRoles() {
        const roles = {
            'Technology': [
                'Software Engineer',
                'Data Scientist',
                'Product Manager',
                'DevOps Engineer',
                'UX/UI Designer',
                'QA Engineer',
                'System Administrator',
                'Network Engineer',
                'Security Engineer',
                'Machine Learning Engineer',
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'Mobile Developer',
                'Cloud Engineer',
                'custom'
            ],
            'Healthcare': [
                'Physician',
                'Nurse',
                'Pharmacist',
                'Medical Researcher',
                'Healthcare Administrator',
                'Medical Technologist',
                'Physical Therapist',
                'custom'
            ],
            'Finance': [
                'Financial Analyst',
                'Investment Banker',
                'Accountant',
                'Risk Manager',
                'Portfolio Manager',
                'Financial Advisor',
                'Quantitative Analyst',
                'custom'
            ],
            'Education': [
                'Teacher',
                'Professor',
                'Educational Administrator',
                'Curriculum Developer',
                'Educational Researcher',
                'Librarian',
                'custom'
            ],
            'Manufacturing': [
                'Production Manager',
                'Quality Engineer',
                'Industrial Engineer',
                'Manufacturing Engineer',
                'Operations Manager',
                'Supply Chain Manager',
                'custom'
            ],
            'Retail': [
                'Store Manager',
                'Buyer',
                'Merchandiser',
                'Retail Analyst',
                'Customer Service Manager',
                'E-commerce Manager',
                'custom'
            ],
            'Consulting': [
                'Management Consultant',
                'Strategy Consultant',
                'IT Consultant',
                'Business Analyst',
                'Process Consultant',
                'custom'
            ],
            'Media & Entertainment': [
                'Content Creator',
                'Producer',
                'Editor',
                'Marketing Manager',
                'Creative Director',
                'Journalist',
                'custom'
            ],
            'Government': [
                'Policy Analyst',
                'Program Manager',
                'Administrative Officer',
                'Legislative Assistant',
                'Public Affairs Officer',
                'custom'
            ],
            'Non-profit': [
                'Program Director',
                'Grant Writer',
                'Volunteer Coordinator',
                'Development Officer',
                'Executive Director',
                'custom'
            ],
            'Other': [
                'Project Manager',
                'Business Owner',
                'Entrepreneur',
                'Researcher',
                'Analyst',
                'custom'
            ]
        };

        return roles[this.selectedIndustry] || roles['Technology'];
    }

    getExperienceRanges() {
        return [
            '0-2 years',
            '3-5 years',
            '6-10 years',
            '11-15 years',
            '16-20 years',
            '20+ years'
        ];
    }

    getProgrammingLanguages() {
        return [
            'JavaScript/TypeScript',
            'Python',
            'Java',
            'C++',
            'C#',
            'Go',
            'Rust',
            'PHP',
            'Ruby',
            'Swift',
            'Kotlin',
            'Scala',
            'R',
            'MATLAB',
            'Other'
        ];
    }

    handleIndustrySelect(e) {
        this.selectedIndustry = e.target.value;
        this.selectedRole = '';
        this.customRole = '';
        this.showCustomRoleInput = false;
        this.saveCareerSettings();
    }

    handleRoleSelect(e) {
        this.selectedRole = e.target.value;
        this.showCustomRoleInput = this.selectedRole === 'custom';
        if (this.selectedRole !== 'custom') {
            this.customRole = '';
        }
        this.saveCareerSettings();
    }

    handleExperienceSelect(e) {
        this.experienceRange = e.target.value;
        this.saveCareerSettings();
    }

    handleProgrammingLanguageSelect(e) {
        this.selectedProgrammingLanguage = e.target.value;
        this.saveCareerSettings();
    }

    handleModeSelect(e) {
        this.selectedMode = e.target.value;
        this.saveCareerSettings();
    }

    handleCustomRoleInput(e) {
        this.customRole = e.target.value;
        this.saveCareerSettings();
    }

    // Authentication methods
    handleAuthEmailInput(e) {
        this.authEmail = e.target.value;
    }

    handleAuthPasswordInput(e) {
        this.authPassword = e.target.value;
    }

    async handleSignIn() {
        if (!this.authEmail || !this.authPassword) {
            alert('Please enter both email and password');
            return;
        }

        // Get button reference and store original state BEFORE any async operations
        const signInButton = this.shadowRoot.querySelector('.auth-button.signin');
        if (!signInButton) {
            console.error('Sign in button not found');
            return;
        }

        const originalText = signInButton.textContent;
        const originalDisabled = signInButton.disabled;

        try {
            // Show loading state
            signInButton.textContent = 'Signing In...';
            signInButton.disabled = true;

            // Add timeout to prevent indefinite loading state
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Authentication timeout - please try again')), 30000); // 30 second timeout
            });

            // Call the main process to authenticate with Kettle app
            const authPromise = window.api.settingsView.authenticateWithKettle({
                email: this.authEmail,
                password: this.authPassword
            });

            // Race between authentication and timeout
            const result = await Promise.race([authPromise, timeoutPromise]);

            if (result.success) {
                // Set user context for token tracking
                if (result.user && result.user.id && result.token) {
                    try {
                        await window.api.settingsView.setCurrentUserContext(result.user.id, result.token);
                        console.log('[SettingsView] User context set for token tracking');
                    } catch (contextError) {
                        console.error('[SettingsView] Failed to set user context:', contextError);
                    }
                }
                
                // Clear password field for security
                this.authPassword = '';
                this.requestUpdate();
                

            } else {
                alert(`Sign in failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Sign in error:', error);
            alert(`Sign in error: ${error.message}`);
        } finally {
            // Always restore button state, even if there were errors
            try {
                if (signInButton) {
                    signInButton.textContent = originalText;
                    signInButton.disabled = originalDisabled;
                }
            } catch (restoreError) {
                console.error('Error restoring button state:', restoreError);
                // Fallback: try to restore with default values
                try {
                    if (signInButton) {
                        signInButton.textContent = 'Sign In';
                        signInButton.disabled = false;
                    }
                } catch (fallbackError) {
                    console.error('Fallback button restoration failed:', fallbackError);
                }
            }
        }
    }

    handleSignUp() {
        // Redirect to Kettle app sign up page
        window.open('https://www.isotryon.com/register', '_blank');
    }

    async handleLogout() {
        try {
            if (this.currentUser?.mode === 'kettle') {
                // Logout from Kettle app
                await window.api.settingsView.kettleLogout();
            }
            
            // Clear user context for token tracking
            try {
                await window.api.settingsView.setCurrentUserContext(null, null);
                console.log('[SettingsView] User context cleared for token tracking');
            } catch (contextError) {
                console.error('[SettingsView] Failed to clear user context:', contextError);
            }
            
            // Clear local auth fields
            this.authEmail = '';
            this.authPassword = '';
            this.requestUpdate();
        } catch (error) {
            console.error('Logout error:', error);
            alert(`Logout error: ${error.message}`);
        }
    }

    handleExitApp() {
        try {
            console.log('[SettingsView] Exiting application...');
            window.api.common.quitApplication();
        } catch (error) {
            console.error('Exit app error:', error);
            // Fallback: try to close the window
            if (window.api && window.api.settingsView && window.api.settingsView.quitApplication) {
                window.api.settingsView.quitApplication();
            }
        }
    }

    async loadTokenStatus() {
        try {
            if (window.api && this.currentUser) {
                const tokenStatus = await window.api.settingsView.getCurrentTokenStatus();
                this.tokenStatus = tokenStatus;
                this.requestUpdate();
                console.log('[SettingsView] Token status loaded:', tokenStatus);
            }
        } catch (error) {
            console.error('[SettingsView] Error loading token status:', error);
            this.tokenStatus = null;
        }
    }

    handlePurchaseTokens() {
        // Redirect to Kettle app subscription page
        window.open('https://www.isotryon.com/subscription', '_blank');
    }

    async checkAppUsability() {
        try {
            if (window.api) {
                const isUsable = await window.api.settingsView.isAppUsable();
                const usabilityStatus = await window.api.settingsView.getAppUsabilityStatus();
                
                this.appUsable = isUsable;
                
                if (!isUsable) {
                    console.warn('[SettingsView] App is not usable:', usabilityStatus.reason);
                    
                    // Check if current user should be blocked
                    const shouldBlock = await window.api.settingsView.shouldBlockCurrentUser();
                    if (shouldBlock) {
                        console.log('[SettingsView] Enforcing token restrictions - logging out user');
                        await window.api.settingsView.enforceTokenRestrictions();
                        // Force a page refresh or redirect to login
                        this.currentUser = null;
                        this.tokenStatus = null;
                        this.appUsable = false;
                    }
                }
                
                this.requestUpdate();
            }
        } catch (error) {
            console.error('[SettingsView] Error checking app usability:', error);
            this.appUsable = true; // Default to usable on error
        }
    }

    /**
     * Handle app usability changes (including token updates)
     */
    _handleAppUsabilityChange(data) {
        try {
            console.log('[SettingsView] Handling app usability change:', data);
            
            // Update app usability status
            this.appUsable = data.usable;
            
            // If tokens were updated, refresh the token status
            if (data.tokenStatus) {
                this.tokenStatus = data.tokenStatus;
                console.log('[SettingsView] Token status updated from app usability change:', data.tokenStatus);
            }
            
            // Handle forced logout due to token exhaustion
            if (!data.usable && data.reason && data.reason.includes('forced logout')) {
                console.log('[SettingsView] Handling forced logout due to token exhaustion');
                this.currentUser = null;
                this.tokenStatus = null;
                this.appUsable = false;
                
                // Show alert to user
                alert('You have been logged out due to insufficient tokens. Please purchase more tokens to continue.');
            }
            
            // Update the UI
            this.requestUpdate();
            
        } catch (error) {
            console.error('[SettingsView] Error handling app usability change:', error);
        }
    }

    startTokenMonitoring() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
        }
        
        // Check tokens every 30 seconds for authenticated users
        this.tokenCheckInterval = setInterval(async () => {
            if (this.currentUser && window.api) {
                await this.checkAppUsability();
            }
        }, 30000); // 30 seconds
        
        console.log('[SettingsView] Started token monitoring');
    }

    stopTokenMonitoring() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
            console.log('[SettingsView] Stopped token monitoring');
        }
    }


    //////// after_modelStateService ////////

    openShortcutEditor() {
        window.api.settingsView.openShortcutSettingsWindow();
    }

    connectedCallback() {
        super.connectedCallback();
        
        this.setupEventListeners();
        this.setupIpcListeners();
        this.setupWindowResize();
        this.loadAutoUpdateSetting();
        // Force one height calculation immediately (innerHeight may be 0 at first)
        setTimeout(() => this.updateScrollHeight(), 0);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.cleanupEventListeners();
        this.cleanupIpcListeners();
        this.cleanupWindowResize();
        this.stopTokenMonitoring();
        
        // Cancel any ongoing Ollama installations when component is destroyed
        const installingModels = Object.keys(this.installingModels);
        if (installingModels.length > 0) {
            installingModels.forEach(modelName => {
                window.api.settingsView.cancelOllamaInstallation(modelName);
            });
        }
    }

    setupEventListeners() {
        this.addEventListener('mouseenter', this.handleMouseEnter);
        this.addEventListener('mouseleave', this.handleMouseLeave);
    }

    cleanupEventListeners() {
        this.removeEventListener('mouseenter', this.handleMouseEnter);
        this.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    setupIpcListeners() {
        if (!window.api) return;
        
        this._userStateListener = (event, userState) => {
            console.log('[SettingsView] Received user-state-changed:', userState);
            if (userState && userState.isLoggedIn) {
                this.currentUser = userState;
                // Load token status for authenticated users
                this.loadTokenStatus();
                // Check app usability
                this.checkAppUsability();
                // Start token monitoring
                this.startTokenMonitoring();
            } else {
                this.currentUser = null;
                this.tokenStatus = null;
                this.appUsable = true;
                // Stop token monitoring
                this.stopTokenMonitoring();
            }
            this.loadAutoUpdateSetting();
            // Reload model settings when user state changes
            this.loadInitialData();
        };
        
        this._settingsUpdatedListener = (event, settings) => {
            console.log('[SettingsView] Received settings-updated');
            this.settings = settings;
            this.requestUpdate();
        };

        // 프리셋 업데이트 리스너 추가
        this._presetsUpdatedListener = async (event) => {
            console.log('[SettingsView] Received presets-updated, refreshing presets');
            try {
                const presets = await window.api.settingsView.getPresets();
                this.presets = presets || [];
                
                // 현재 선택된 프리셋이 삭제되었는지 확인 (사용자 프리셋만 고려)
                const userPresets = this.presets.filter(p => p.is_default === 0);
                if (this.selectedPreset && !userPresets.find(p => p.id === this.selectedPreset.id)) {
                    this.selectedPreset = userPresets.length > 0 ? userPresets[0] : null;
                }
                
                this.requestUpdate();
            } catch (error) {
                console.error('[SettingsView] Failed to refresh presets:', error);
            }
        };
        this._shortcutListener = (event, keybinds) => {
            console.log('[SettingsView] Received updated shortcuts:', keybinds);
            this.shortcuts = keybinds;
        };
        
        this._appUsabilityChangeListener = (event, data) => {
            console.log('[SettingsView] Received app-usability-changed:', data);
            this._handleAppUsabilityChange(data);
        };
        
        window.api.settingsView.onUserStateChanged(this._userStateListener);
        window.api.settingsView.onSettingsUpdated(this._settingsUpdatedListener);
        window.api.settingsView.onPresetsUpdated(this._presetsUpdatedListener);
        window.api.settingsView.onShortcutsUpdated(this._shortcutListener);
        
        // Listen for app usability changes (including token updates)
        window.api.settingsView.onAppUsabilityChanged(this._appUsabilityChangeListener);
    }

    cleanupIpcListeners() {
        if (!window.api) return;
        
        if (this._userStateListener) {
            window.api.settingsView.removeOnUserStateChanged(this._userStateListener);
        }
        if (this._settingsUpdatedListener) {
            window.api.settingsView.removeOnSettingsUpdated(this._settingsUpdatedListener);
        }
        if (this._presetsUpdatedListener) {
            window.api.settingsView.removeOnPresetsUpdated(this._presetsUpdatedListener);
        }
        if (this._shortcutListener) {
            window.api.settingsView.removeOnShortcutsUpdated(this._shortcutListener);
        }
        if (this._appUsabilityChangeListener) {
            window.api.settingsView.removeOnAppUsabilityChanged(this._appUsabilityChangeListener);
        }
    }

    setupWindowResize() {
        this.resizeHandler = () => {
            this.requestUpdate();
            this.updateScrollHeight();
        };
        window.addEventListener('resize', this.resizeHandler);
        
        // Initial setup
        setTimeout(() => this.updateScrollHeight(), 100);
    }

    cleanupWindowResize() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
    }

    updateScrollHeight() {
        // Electron 일부 시점에서 window.innerHeight 가 0 으로 보고되는 버그 보호
        const rawHeight = window.innerHeight || (window.screen ? window.screen.height : 0);
        const MIN_HEIGHT = 300; // 최소 보장 높이
        const maxHeight = Math.max(MIN_HEIGHT, rawHeight);

        this.style.maxHeight = `${maxHeight}px`;

        const container = this.shadowRoot?.querySelector('.settings-container');
        if (container) {
            container.style.maxHeight = `${maxHeight}px`;
        }
    }

    handleMouseEnter = () => {
        window.api.settingsView.cancelHideSettingsWindow();
        // Recalculate height in case it was set to 0 before
        this.updateScrollHeight();
    }

    handleMouseLeave = () => {
        window.api.settingsView.hideSettingsWindow();
    }


    getMainShortcuts() {
        return [
            { name: 'Show / Hide', accelerator: this.shortcuts.toggleVisibility },
            { name: 'Ask Anything', accelerator: this.shortcuts.nextStep },
            { name: 'Scroll Up Response', accelerator: this.shortcuts.scrollUp },
            { name: 'Scroll Down Response', accelerator: this.shortcuts.scrollDown },
        ];
    }

    renderShortcutKeys(accelerator) {
        if (!accelerator) return html`N/A`;
        
        const keyMap = {
            'Cmd': '⌘', 'Command': '⌘', 'Ctrl': '⌃', 'Alt': '⌥', 'Shift': '⇧', 'Enter': '↵',
            'Up': '↑', 'Down': '↓', 'Left': '←', 'Right': '→'
        };

        // scrollDown/scrollUp의 특수 처리
        if (accelerator.includes('↕')) {
            const keys = accelerator.replace('↕','').split('+');
            keys.push('↕');
             return html`${keys.map(key => html`<span class="shortcut-key">${keyMap[key] || key}</span>`)}`;
        }

        const keys = accelerator.split('+');
        return html`${keys.map(key => html`<span class="shortcut-key">${keyMap[key] || key}</span>`)}`;
    }

    togglePresets() {
        this.showPresets = !this.showPresets;
    }

    async handlePresetSelect(preset) {
        this.selectedPreset = preset;
        // Here you could implement preset application logic
        console.log('Selected preset:', preset);
    }

    handleMoveLeft() {
        console.log('Move Left clicked');
        window.api.settingsView.moveWindowStep('left');
    }

    handleMoveRight() {
        console.log('Move Right clicked');
        window.api.settingsView.moveWindowStep('right');
    }

    async handlePersonalize() {
        console.log('Personalize clicked');
        try {
            await window.api.settingsView.openPersonalizePage();
        } catch (error) {
            console.error('Failed to open personalize page:', error);
        }
    }

    async handleToggleInvisibility() {
        console.log('Toggle Invisibility clicked');
        this.isContentProtectionOn = await window.api.settingsView.toggleContentProtection();
        this.requestUpdate();
    }

    async handleSaveApiKey() {
        const input = this.shadowRoot.getElementById('api-key-input');
        if (!input || !input.value) return;

        const newApiKey = input.value;
        try {
            const result = await window.api.settingsView.saveApiKey(newApiKey);
            if (result.success) {
                console.log('API Key saved successfully via IPC.');
                this.apiKey = newApiKey;
                this.requestUpdate();
            } else {
                 console.error('Failed to save API Key via IPC:', result.error);
            }
        } catch(e) {
            console.error('Error invoking save-api-key IPC:', e);
        }
    }

    handleQuit() {
        console.log('Quit clicked');
        window.api.settingsView.quitApplication();
    }



    async handleOllamaShutdown() {
        console.log('[SettingsView] Shutting down Ollama service...');
        
        if (!window.api) return;
        
        try {
            // Show loading state
            this.ollamaStatus = { ...this.ollamaStatus, running: false };
            this.requestUpdate();
            
            const result = await window.api.settingsView.shutdownOllama(false); // Graceful shutdown
            
            if (result.success) {
                console.log('[SettingsView] Ollama shut down successfully');
                // Refresh status to reflect the change
                await this.refreshOllamaStatus();
            } else {
                console.error('[SettingsView] Failed to shutdown Ollama:', result.error);
                // Restore previous state on error
                await this.refreshOllamaStatus();
            }
        } catch (error) {
            console.error('[SettingsView] Error during Ollama shutdown:', error);
            // Restore previous state on error
            await this.refreshOllamaStatus();
        }
    }

    //////// after_modelStateService ////////
    render() {
        if (this.isLoading) {
            return html`
                <div class="settings-container">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            `;
        }

        const loggedIn = !!this.currentUser;

        const apiKeyManagementHTML = html`
            <div class="api-key-section">
                ${Object.entries(this.providerConfig)
                    .filter(([id, config]) => !id.includes('-klyro'))
                    .map(([id, config]) => {
                        if (id === 'ollama') {
                            // Special UI for Ollama
                            return html`
                                <div class="provider-key-group">
                                    <label>${config.name} (Local)</label>
                                    ${this.ollamaStatus.installed && this.ollamaStatus.running ? html`
                                        <div style="padding: 8px; background: rgba(0,255,0,0.1); border-radius: 4px; font-size: 11px; color: rgba(0,255,0,0.8);">
                                            ✓ Ollama is running
                                        </div>
                                        <button class="settings-button full-width danger" @click=${this.handleOllamaShutdown}>
                                            Stop Ollama Service
                                        </button>
                                    ` : this.ollamaStatus.installed ? html`
                                        <div style="padding: 8px; background: rgba(255,200,0,0.1); border-radius: 4px; font-size: 11px; color: rgba(255,200,0,0.8);">
                                            ⚠ Ollama installed but not running
                                        </div>
                                        <button class="settings-button full-width" @click=${() => this.handleSaveKey(id)}>
                                            Start Ollama
                                        </button>
                                    ` : html`
                                        <div style="padding: 8px; background: rgba(255,100,100,0.1); border-radius: 4px; font-size: 11px; color: rgba(255,100,100,0.8);">
                                            ✗ Ollama not installed
                                        </div>
                                        <button class="settings-button full-width" @click=${() => this.handleSaveKey(id)}>
                                            Install & Setup Ollama
                                        </button>
                                    `}
                                </div>
                            `;
                        }
                        
                        if (id === 'whisper') {
                            // Simplified UI for Whisper without model selection
                            return html`
                                <div class="provider-key-group">
                                    <label>${config.name} (Local STT)</label>
                                    ${this.apiKeys[id] === 'local' ? html`
                                        <div style="padding: 8px; background: rgba(0,255,0,0.1); border-radius: 4px; font-size: 11px; color: rgba(0,255,0,0.8); margin-bottom: 8px;">
                                            ✓ Whisper is enabled
                                        </div>
                                        <button class="settings-button full-width danger" @click=${() => this.handleClearKey(id)}>
                                            Disable Whisper
                                        </button>
                                    ` : html`
                                        <button class="settings-button full-width" @click=${() => this.handleSaveKey(id)}>
                                            Enable Whisper STT
                                        </button>
                                    `}
                                </div>
                            `;
                        }
                        
                        // Regular providers
                        return html`
                        <div class="provider-key-group">
                            <label for="key-input-${id}">${config.name} API Key</label>
                            <input type="password" id="key-input-${id}"
                                placeholder=${loggedIn ? "Using Klyro's Key" : `Enter ${config.name} API Key`} 
                                .value=${this.apiKeys[id] || ''}
                            >
                            <div class="key-buttons">
                               <button class="settings-button" @click=${() => this.handleSaveKey(id)} >Save</button>
                               <button class="settings-button danger" @click=${() => this.handleClearKey(id)} }>Clear</button>
                            </div>
                        </div>
                        `;
                    })}
            </div>
        `;
        
        const getModelName = (type, id) => {
            const models = type === 'llm' ? this.availableLlmModels : this.availableSttModels;
            const model = models.find(m => m.id === id);
            return model ? model.name : id;
        }

        const modelSelectionHTML = html`
            <div class="model-selection-section">
                <div class="model-select-group">
                    <label>LLM Model: <strong>${getModelName('llm', this.selectedLlm) || 'Not Set'}</strong></label>
                    <button class="settings-button full-width" @click=${() => this.toggleModelList('llm')} ?disabled=${this.saving || this.availableLlmModels.length === 0}>
                        Change LLM Model
                    </button>
                    ${this.isLlmListVisible ? html`
                        <div class="model-list">
                            ${this.availableLlmModels.map(model => {
                                const isOllama = this.getProviderForModel('llm', model.id) === 'ollama';
                                const ollamaModel = isOllama ? this.ollamaModels.find(m => m.name === model.id) : null;
                                const isInstalling = this.installingModels[model.id] !== undefined;
                                const installProgress = this.installingModels[model.id] || 0;
                                
                                return html`
                                    <div class="model-item ${this.selectedLlm === model.id ? 'selected' : ''}" 
                                         @click=${() => this.selectModel('llm', model.id)}>
                                        <span>${model.name}</span>
                                        ${isOllama ? html`
                                            ${isInstalling ? html`
                                                <div class="install-progress">
                                                    <div class="install-progress-bar" style="width: ${installProgress}%"></div>
                                </div>
                                            ` : ollamaModel?.installed ? html`
                                                <span class="model-status installed">✓ Installed</span>
                                            ` : html`
                                                <span class="model-status not-installed">Click to install</span>
                                            `}
                                        ` : ''}
                                    </div>
                                `;
                            })}
                        </div>
                    ` : ''}
                </div>
                <div class="model-select-group">
                    <label>STT Model: <strong>${getModelName('stt', this.selectedStt) || 'Not Set'}</strong></label>
                    <button class="settings-button full-width" @click=${() => this.toggleModelList('stt')} ?disabled=${this.saving || this.availableSttModels.length === 0}>
                        Change STT Model
                    </button>
                    ${this.isSttListVisible ? html`
                        <div class="model-list">
                            ${this.availableSttModels.map(model => {
                                const isWhisper = this.getProviderForModel('stt', model.id) === 'whisper';
                                const whisperModel = isWhisper && this.providerConfig?.whisper?.sttModels 
                                    ? this.providerConfig.whisper.sttModels.find(m => m.id === model.id) 
                                    : null;
                                const isInstalling = this.installingModels[model.id] !== undefined;
                                const installProgress = this.installingModels[model.id] || 0;
                                
                                return html`
                                    <div class="model-item ${this.selectedStt === model.id ? 'selected' : ''}" 
                                         @click=${() => this.selectModel('stt', model.id)}>
                                        <span>${model.name}</span>
                                        ${isWhisper ? html`
                                            ${isInstalling ? html`
                                                <div class="install-progress">
                                                    <div class="install-progress-bar" style="width: ${installProgress}%"></div>
                                                </div>
                                            ` : whisperModel?.installed ? html`
                                                <span class="model-status installed">✓ Installed</span>
                                            ` : html`
                                                <span class="model-status not-installed">Not Installed</span>
                                            `}
                                        ` : ''}
                                    </div>
                                `;
                            })}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        return html`
            <div class="settings-container">
                ${this.tokenStatus && this.tokenStatus.remaining <= 0 ? html`
                    <div class="token-warning-banner">
                        <div class="warning-icon">⚠️</div>
                        <div class="warning-content">
                            <div class="warning-title">No Tokens Remaining</div>
                            <div class="warning-message">This app is currently unusable. Please purchase more tokens or wait for your next billing cycle.</div>
                        </div>
                        <button class="warning-action" @click=${this.handlePurchaseTokens}>Purchase Tokens</button>
                    </div>
                ` : ''}
                
                <div class="header-section">
                    <div class="title-line">
                        <h1 class="app-title">Klyro</h1>
                        <button class="exit-button" @click=${this.handleExitApp} title="Exit Application">×</button>
                    </div>
                </div>

                <div class="auth-section">
                    <h3 class="section-title">Authentication</h3>
                    
                    ${this.currentUser ? html`
                        <div class="token-status-section ${this.tokenStatus?.remaining <= 0 ? 'no-tokens' : this.tokenStatus?.remaining <= 10 ? 'low-tokens' : ''}">
                            <div class="token-info">
                                <span class="token-label">Tokens:</span>
                                <span class="token-count ${this.tokenStatus?.remaining <= 0 ? 'no-tokens' : this.tokenStatus?.remaining <= 10 ? 'low-tokens' : ''}">${this.tokenStatus?.remaining || 0} remaining</span>
                            </div>
                            <div class="token-details">
                                <small>${this.tokenStatus?.used || 0} used / ${this.tokenStatus?.total || 0} total</small>
                            </div>
                            ${this.tokenStatus?.remaining <= 10 && this.tokenStatus?.remaining > 0 ? html`
                                <div class="token-warning-small">
                                    <small>⚠️ Low tokens - consider purchasing more</small>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    ${!this.currentUser ? html`
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input 
                                type="email" 
                                class="form-control" 
                                placeholder="Enter your email"
                                .value=${this.authEmail}
                                @input=${this.handleAuthEmailInput}
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input 
                                type="password" 
                                class="form-control" 
                                placeholder="Enter your password"
                                .value=${this.authPassword}
                                @input=${this.handleAuthPasswordInput}
                            >
                        </div>
                        <div class="auth-buttons">
                            <button class="auth-button signin" @click=${this.handleSignIn}>
                                Sign In
                            </button>
                            <button class="auth-button signup" @click=${this.handleSignUp}>
                                Sign Up
                            </button>
                        </div>
                    ` : html`
                        <div class="user-info">
                            <div class="user-email">${this.currentUser.email}</div>
                            <button class="auth-button logout" @click=${this.handleLogout}>
                                Sign Out
                            </button>
                        </div>
                    `}
                </div>

                <div class="mode-settings-section">
                    <h3 class="section-title">Mode</h3>
                    <div class="form-group">
                        <label class="form-label">AI Mode</label>
                        <select class="form-control" @change=${this.handleModeSelect} .value=${this.selectedMode}>
                            <option value="">Select Mode</option>
                            <option value="klyro" ?selected=${this.selectedMode === 'klyro'}>General Assistant</option>
                            <option value="interview" ?selected=${this.selectedMode === 'interview'}>Interview</option>
                            <option value="sales" ?selected=${this.selectedMode === 'sales'}>Sales</option>
                            <option value="meeting" ?selected=${this.selectedMode === 'meeting'}>Meeting</option>
                            <option value="presentation" ?selected=${this.selectedMode === 'presentation'}>Presentation</option>
                            <option value="negotiation" ?selected=${this.selectedMode === 'negotiation'}>Negotiation</option>
                        </select>
                    </div>
                </div>

                <div class="career-settings-section">
                    <h3 class="section-title">Career Profile</h3>
                    <div class="form-group">
                        <label class="form-label">Industry</label>
                        <select class="form-control" @change=${this.handleIndustrySelect} .value=${this.selectedIndustry}>
                            <option value="">Select Industry</option>
                            ${this.getIndustries().map(industry => html`
                                <option value="${industry}" ?selected=${this.selectedIndustry === industry}>
                                    ${industry}
                                </option>
                            `)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Job Role</label>
                        <select class="form-control" @change=${this.handleRoleSelect} .value=${this.selectedRole} ?disabled=${!this.selectedIndustry}>
                            <option value="">Select Role</option>
                            ${this.getJobRoles().map(role => html`
                                <option value="${role}" ?selected=${this.selectedRole === role}>
                                    ${role === 'custom' ? 'Custom Role...' : role}
                                </option>
                            `)}
                        </select>
                        ${this.showCustomRoleInput ? html`
                            <input 
                                type="text" 
                                class="custom-role-input" 
                                placeholder="Enter your custom role"
                                .value=${this.customRole}
                                @input=${this.handleCustomRoleInput}
                                style="margin-top: 8px;"
                            >
                        ` : ''}
                    </div>
                    <div class="form-group">
                        <label class="form-label">Experience</label>
                        <select class="form-control" @change=${this.handleExperienceSelect} .value=${this.experienceRange}>
                            <option value="">Select Experience</option>
                            ${this.getExperienceRanges().map(exp => html`
                                <option value="${exp}" ?selected=${this.experienceRange === exp}>
                                    ${exp}
                                </option>
                            `)}
                        </select>
                    </div>
                    ${this.selectedIndustry === 'Technology' ? html`
                        <div class="form-group">
                            <label class="form-label">Programming Language</label>
                            <select class="form-control" @change=${this.handleProgrammingLanguageSelect} .value=${this.selectedProgrammingLanguage}>
                                <option value="">Select Language</option>
                                ${this.getProgrammingLanguages().map(lang => html`
                                    <option value="${lang}" ?selected=${this.selectedProgrammingLanguage === lang}>
                                        ${lang}
                                    </option>
                                `)}
                            </select>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    //////// after_modelStateService ////////
}

customElements.define('settings-view', SettingsView);