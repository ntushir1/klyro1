import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class SttView extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
        }

        /* Inherit font styles from parent */

        .transcription-container {
            overflow-y: auto;
            padding: 12px 12px 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-height: 150px;
            max-height: 600px;
            position: relative;
            z-index: 1;
            flex: 1;
        }

        /* Visibility handled by parent component */

        .transcription-container::-webkit-scrollbar {
            width: 8px;
        }
        .transcription-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }
        .transcription-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        .transcription-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        .stt-message {
            padding: 8px 12px;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
            word-break: break-word;
            line-height: 1.5;
            font-size: 13px;
            margin-bottom: 4px;
            box-sizing: border-box;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            transition: background-color 0.2s ease;
        }

        .stt-message:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }

        .stt-message.selected {
            background-color: rgba(0, 122, 255, 0.2);
            border: 1px solid rgba(0, 122, 255, 0.5);
        }

        .stt-message.them {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            margin-right: auto;
        }

        .stt-message.me {
            background: rgba(0, 122, 255, 0.8);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            margin-left: auto;
        }

        .stt-message.them.selected {
            background: rgba(0, 122, 255, 0.3);
            border: 1px solid rgba(0, 122, 255, 0.6);
        }

        .stt-message.me.selected {
            background: rgba(0, 122, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .message-checkbox {
            margin: 0;
            cursor: pointer;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .message-text {
            flex: 1;
            min-width: 0;
        }

        .selection-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            margin: 8px 12px 0 12px;
        }

        .selection-info {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }

        .send-selected-btn {
            background: rgba(0, 122, 255, 0.8);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .send-selected-btn:hover {
            background: rgba(0, 122, 255, 1);
        }

        .send-selected-btn:disabled {
            background: rgba(128, 128, 128, 0.5);
            cursor: not-allowed;
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            font-style: italic;
        }
    `;

    static properties = {
        sttMessages: { type: Array },
        isVisible: { type: Boolean },
        selectedMessages: { type: Array },
    };

    constructor() {
        super();
        this.sttMessages = [];
        this.isVisible = true;
        this.messageIdCounter = 0;
        this._shouldScrollAfterUpdate = false;
        this.selectedMessages = [];

        this.handleSttUpdate = this.handleSttUpdate.bind(this);
        this.handleMessageSelect = this.handleMessageSelect.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleDeselectAll = this.handleDeselectAll.bind(this);
        this.handleSendSelected = this.handleSendSelected.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.api) {
            window.api.sttView.onSttUpdate(this.handleSttUpdate);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.api) {
            window.api.sttView.removeOnSttUpdate(this.handleSttUpdate);
        }
    }

    // Handle session reset from parent
    resetTranscript() {
        this.sttMessages = [];
        this.selectedMessages = [];
        this.requestUpdate();
    }

    handleSttUpdate(event, { speaker, text, isFinal, isPartial }) {
        if (text === undefined) return;

        const container = this.shadowRoot.querySelector('.transcription-container');
        this._shouldScrollAfterUpdate = container ? container.scrollTop + container.clientHeight >= container.scrollHeight - 10 : false;

        const findLastPartialIdx = spk => {
            for (let i = this.sttMessages.length - 1; i >= 0; i--) {
                const m = this.sttMessages[i];
                if (m.speaker === spk && m.isPartial) return i;
            }
            return -1;
        };

        const newMessages = [...this.sttMessages];
        const targetIdx = findLastPartialIdx(speaker);

        if (isPartial) {
            if (targetIdx !== -1) {
                newMessages[targetIdx] = {
                    ...newMessages[targetIdx],
                    text,
                    isPartial: true,
                    isFinal: false,
                };
            } else {
                newMessages.push({
                    id: this.messageIdCounter++,
                    speaker,
                    text,
                    isPartial: true,
                    isFinal: false,
                });
            }
        } else if (isFinal) {
            if (targetIdx !== -1) {
                newMessages[targetIdx] = {
                    ...newMessages[targetIdx],
                    text,
                    isPartial: false,
                    isFinal: true,
                };
            } else {
                newMessages.push({
                    id: this.messageIdCounter++,
                    speaker,
                    text,
                    isPartial: false,
                    isFinal: true,
                });
            }
        }

        this.sttMessages = newMessages;
        
        // Notify parent component about message updates
        this.dispatchEvent(new CustomEvent('stt-messages-updated', {
            detail: { 
                messages: this.sttMessages,
                hasContent: this.sttMessages.length > 0
            },
            bubbles: true
        }));
    }

    handleMessageSelect(messageId, checked) {
        if (checked) {
            if (!this.selectedMessages.includes(messageId)) {
                this.selectedMessages = [...this.selectedMessages, messageId];
            }
        } else {
            this.selectedMessages = this.selectedMessages.filter(id => id !== messageId);
        }
        this.requestUpdate();
    }

    handleSelectAll() {
        this.selectedMessages = this.sttMessages
            .filter(msg => msg.isFinal) // Only select final messages
            .map(msg => msg.id);
        this.requestUpdate();
    }

    handleDeselectAll() {
        this.selectedMessages = [];
        this.requestUpdate();
    }

    async handleSendSelected() {
        if (this.selectedMessages.length === 0) return;

        const selectedTexts = this.sttMessages
            .filter(msg => this.selectedMessages.includes(msg.id))
            .map(msg => `${msg.speaker}: ${msg.text}`)
            .join('\n');

        if (window.api && window.api.sttView) {
            try {
                const result = await window.api.sttView.sendSelectedConversationToLLM(selectedTexts);
                if (result.success) {
                    console.log('✅ Selected conversation sent to LLM successfully');
                    // Clear selection after sending
                    this.selectedMessages = [];
                    this.requestUpdate();
                } else {
                    console.error('❌ Failed to send selected conversation to LLM:', result.error);
                }
            } catch (error) {
                console.error('❌ Error sending selected conversation to LLM:', error);
            }
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const container = this.shadowRoot.querySelector('.transcription-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    getSpeakerClass(speaker) {
        return speaker.toLowerCase() === 'me' ? 'me' : 'them';
    }

    getTranscriptText() {
        return this.sttMessages.map(msg => `${msg.speaker}: ${msg.text}`).join('\n');
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('sttMessages')) {
            if (this._shouldScrollAfterUpdate) {
                this.scrollToBottom();
                this._shouldScrollAfterUpdate = false;
            }
        }
    }

    render() {
        if (!this.isVisible) {
            return html`<div style="display: none;"></div>`;
        }

        const hasSelection = this.selectedMessages.length > 0;
        const finalMessagesCount = this.sttMessages.filter(msg => msg.isFinal).length;

        return html`
            ${this.sttMessages.length > 0 ? html`
                <div class="selection-controls">
                    <div class="selection-info">
                        ${this.selectedMessages.length} of ${finalMessagesCount} messages selected
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button 
                            class="send-selected-btn" 
                            ?disabled=${!hasSelection}
                            @click=${this.handleSendSelected}
                        >
                            Send Selected to LLM
                        </button>
                        <button 
                            class="send-selected-btn" 
                            style="background: rgba(255, 255, 255, 0.2);"
                            @click=${this.handleSelectAll}
                        >
                            Select All
                        </button>
                        <button 
                            class="send-selected-btn" 
                            style="background: rgba(255, 255, 255, 0.2);"
                            @click=${this.handleDeselectAll}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            ` : ''}
            <div class="transcription-container">
                ${this.sttMessages.length === 0
                    ? html`<div class="empty-state">Waiting for speech...</div>`
                    : this.sttMessages.map(msg => html`
                        <div class="stt-message ${this.getSpeakerClass(msg.speaker)} ${this.selectedMessages.includes(msg.id) ? 'selected' : ''}">
                            ${msg.isFinal ? html`
                                <input 
                                    type="checkbox" 
                                    class="message-checkbox"
                                    ?checked=${this.selectedMessages.includes(msg.id)}
                                    @change=${(e) => this.handleMessageSelect(msg.id, e.target.checked)}
                                />
                            ` : ''}
                            <div class="message-text">
                                ${msg.text}
                            </div>
                        </div>
                    `)
                }
            </div>
        `;
    }
}

customElements.define('stt-view', SttView); 