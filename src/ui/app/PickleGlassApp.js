import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { ListenView } from '../listen/ListenView.js';
import { AskView } from '../ask/AskView.js';
import { SettingsView } from '../settings/SettingsView.js';
import { ShortcutSettingsView } from '../settings/ShortCutSettingsView.js';

import '../listen/audioCore/renderer.js';

export class PickleGlassApp extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            color: var(--text-color);
            background: transparent;
            border-radius: 7px;
        }

        listen-view {
            display: block;
            width: 100%;
            height: 100%;
        }

        ask-view, settings-view, history-view, help-view, setup-view {
            display: block;
            width: 100%;
            height: 100%;
        }

        .auth-overlay {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 7px;
        }

        .auth-content {
            text-align: center;
            color: white;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .auth-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }

        .auth-content h2 {
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 600;
        }

        .auth-content p {
            margin: 0 0 24px 0;
            font-size: 16px;
            opacity: 0.9;
            line-height: 1.5;
        }

        .auth-button {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .auth-button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.4);
        }

    `;

    static properties = {
        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        currentResponseIndex: { type: Number },
        isMainViewVisible: { type: Boolean },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },
        isClickThrough: { type: Boolean, state: true },
        layoutMode: { type: String },
        _viewInstances: { type: Object, state: true },
        _isClickThrough: { state: true },
        structuredData: { type: Object },
        isAuthenticated: { type: Boolean, state: true },
        currentUser: { type: Object, state: true },
    };

    constructor() {
        super();
        const urlParams = new URLSearchParams(window.location.search);
        this.currentView = urlParams.get('view') || 'listen';
        this.currentResponseIndex = -1;
        this.selectedProfile = localStorage.getItem('selectedProfile') || 'interview';
        
        // Language format migration for legacy users
        let lang = localStorage.getItem('selectedLanguage') || 'en';
        if (lang.includes('-')) {
            const newLang = lang.split('-')[0];
            console.warn(`[Migration] Correcting language format from "${lang}" to "${newLang}".`);
            localStorage.setItem('selectedLanguage', newLang);
            lang = newLang;
        }
        this.selectedLanguage = lang;

        this.selectedScreenshotInterval = localStorage.getItem('selectedScreenshotInterval') || '5';
        this.selectedImageQuality = localStorage.getItem('selectedImageQuality') || 'medium';
        this._isClickThrough = false;
        
        // Authentication state
        this.isAuthenticated = false;
        this.currentUser = null;

    }

    connectedCallback() {
        super.connectedCallback();
        
        if (window.api) {
            window.api.pickleGlassApp.onClickThroughToggled((_, isEnabled) => {
                this._isClickThrough = isEnabled;
            });
            
            // Listen for authentication state changes
            window.api.common.onUserStateChanged((_, userState) => {
                this.isAuthenticated = userState.isLoggedIn;
                this.currentUser = userState;
                console.log('[PickleGlassApp] Authentication state changed:', userState);
                this.requestUpdate();
            });
            
            // Initialize authentication state
            this.initializeAuthState();
        }
    }

    async initializeAuthState() {
        try {
            const userState = await window.api.common.getCurrentUser();
            this.isAuthenticated = userState.isLoggedIn;
            this.currentUser = userState;
            console.log('[PickleGlassApp] Initial auth state:', userState);
            this.requestUpdate();
        } catch (error) {
            console.error('[PickleGlassApp] Failed to initialize auth state:', error);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.api) {
            window.api.pickleGlassApp.removeAllClickThroughListeners();
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('currentView')) {
            const viewContainer = this.shadowRoot?.querySelector('.view-container');
            if (viewContainer) {
                viewContainer.classList.add('entering');
                requestAnimationFrame(() => {
                    viewContainer.classList.remove('entering');
                });
            }
        }

        // Only update localStorage when these specific properties change
        if (changedProperties.has('selectedProfile')) {
            localStorage.setItem('selectedProfile', this.selectedProfile);
        }
        if (changedProperties.has('selectedLanguage')) {
            localStorage.setItem('selectedLanguage', this.selectedLanguage);
        }
        if (changedProperties.has('selectedScreenshotInterval')) {
            localStorage.setItem('selectedScreenshotInterval', this.selectedScreenshotInterval);
        }
        if (changedProperties.has('selectedImageQuality')) {
            localStorage.setItem('selectedImageQuality', this.selectedImageQuality);
        }
        if (changedProperties.has('layoutMode')) {
            this.updateLayoutMode();
        }
    }

    async handleClose() {
        if (window.api) {
            await window.api.common.quitApplication();
        }
    }




    render() {
        switch (this.currentView) {
            case 'listen':
                return html`<listen-view
                    .currentResponseIndex=${this.currentResponseIndex}
                    .selectedProfile=${this.selectedProfile}
                    .structuredData=${this.structuredData}
                    .isAuthenticated=${this.isAuthenticated}
                    @response-index-changed=${e => (this.currentResponseIndex = e.detail.index)}
                    @switch-to-settings=${() => this.currentView = 'settings'}
                ></listen-view>`;
            case 'ask':
                return html`<ask-view 
                    .isAuthenticated=${this.isAuthenticated}
                    @switch-to-settings=${() => this.currentView = 'settings'}
                ></ask-view>`;
            case 'settings':
                return html`<settings-view
                    @close-settings=${() => this.currentView = 'listen'}
                ></settings-view>`;
            case 'shortcut-settings':
                return html`<shortcut-settings-view></shortcut-settings-view>`;
            case 'history':
                return html`<history-view></history-view>`;
            case 'help':
                return html`<help-view></help-view>`;
            case 'setup':
                return html`<setup-view></setup-view>`;
            default:
                // If not authenticated and no specific view, show auth prompt
                if (!this.isAuthenticated) {
                    return html`
                        <div class="auth-overlay">
                            <div class="auth-content">
                                <div class="auth-icon">🔒</div>
                                <h2>Welcome to Glass</h2>
                                <p>Please log in through Settings to access app features.</p>
                                <button class="auth-button" @click=${() => this.currentView = 'settings'}>
                                    Go to Settings
                                </button>
                            </div>
                        </div>
                    `;
                }
                return html`<div>Unknown view: ${this.currentView}</div>`;
        }
    }
}

customElements.define('pickle-glass-app', PickleGlassApp);
