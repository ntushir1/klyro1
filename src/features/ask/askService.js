const { BrowserWindow } = require('electron');
const { createStreamingLLM } = require('../common/ai/factory');
// Lazy require helper to avoid circular dependency issues
const getWindowManager = () => require('../../window/windowManager');
const internalBridge = require('../../bridge/internalBridge');

const getWindowPool = () => {
    try {
        return getWindowManager().windowPool;
    } catch {
        return null;
    }
};

const sessionRepository = require('../common/repositories/session');
const askRepository = require('./repositories');
const { getSystemPrompt } = require('../common/prompts/promptBuilder');
const path = require('node:path');
const fs = require('node:fs');
const os = require('os');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const { desktopCapturer } = require('electron');
const modelStateService = require('../common/services/modelStateService');

// Try to load sharp, but don't fail if it's not available
let sharp;
try {
    sharp = require('sharp');
    console.log('[AskService] Sharp module loaded successfully');
} catch (error) {
    console.warn('[AskService] Sharp module not available:', error.message);
    console.warn('[AskService] Screenshot functionality will work with reduced image processing capabilities');
    sharp = null;
}
let lastScreenshot = null;

async function captureScreenshot(options = {}) {
    if (process.platform === 'darwin') {
        try {
            const tempPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.jpg`);

            await execFile('screencapture', ['-x', '-t', 'jpg', tempPath]);

            const imageBuffer = await fs.promises.readFile(tempPath);
            await fs.promises.unlink(tempPath);

            if (sharp) {
                try {
                    // Try using sharp for optimal image processing
                    const resizedBuffer = await sharp(imageBuffer)
                        .resize({ height: 384 })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    const base64 = resizedBuffer.toString('base64');
                    const metadata = await sharp(resizedBuffer).metadata();

                    lastScreenshot = {
                        base64,
                        width: metadata.width,
                        height: metadata.height,
                        timestamp: Date.now(),
                    };

                    return { success: true, base64, width: metadata.width, height: metadata.height };
                } catch (sharpError) {
                    console.warn('Sharp module failed, falling back to basic image processing:', sharpError.message);
                }
            }
            
            // Fallback: Return the original image without resizing
            console.log('[AskService] Using fallback image processing (no resize/compression)');
            const base64 = imageBuffer.toString('base64');
            
            lastScreenshot = {
                base64,
                width: null, // We don't have metadata without sharp
                height: null,
                timestamp: Date.now(),
            };

            return { success: true, base64, width: null, height: null };
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            return { success: false, error: error.message };
        }
    }

    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: 1920,
                height: 1080,
            },
        });

        if (sources.length === 0) {
            throw new Error('No screen sources available');
        }
        const source = sources[0];
        const buffer = source.thumbnail.toJPEG(70);
        const base64 = buffer.toString('base64');
        const size = source.thumbnail.getSize();

        return {
            success: true,
            base64,
            width: size.width,
            height: size.height,
        };
    } catch (error) {
        console.error('Failed to capture screenshot using desktopCapturer:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * @class
 * @description
 */
class AskService {
    constructor() {
        this.abortController = null;
        this.state = {
            isVisible: false,
            isLoading: false,
            isStreaming: false,
            currentQuestion: '',
            currentResponse: '',
            showTextInput: true,
        };
        console.log('[AskService] Service instance created.');
    }

    _broadcastState() {
        const askWindow = getWindowPool()?.get('ask');
        if (askWindow && !askWindow.isDestroyed()) {
            askWindow.webContents.send('ask:stateUpdate', this.state);
        }
    }

    async toggleAskButton(inputScreenOnly = false) {
        const askWindow = getWindowPool()?.get('ask');

        let shouldSendScreenOnly = false;
        if (inputScreenOnly && this.state.showTextInput && askWindow && askWindow.isVisible()) {
            shouldSendScreenOnly = true;
            await this.sendMessage('', []);
            return;
        }

        const hasContent = this.state.isLoading || this.state.isStreaming || (this.state.currentResponse && this.state.currentResponse.length > 0);

        if (askWindow && askWindow.isVisible() && hasContent) {
            this.state.showTextInput = !this.state.showTextInput;
            this._broadcastState();
        } else {
            if (askWindow && askWindow.isVisible()) {
                internalBridge.emit('window:requestVisibility', { name: 'ask', visible: false });
                this.state.isVisible = false;
            } else {
                console.log('[AskService] Showing hidden Ask window');
                internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
                this.state.isVisible = true;
            }
            if (this.state.isVisible) {
                this.state.showTextInput = true;
                this._broadcastState();
            }
        }
    }

    async closeAskWindow () {
            if (this.abortController) {
                this.abortController.abort('Window closed by user');
                this.abortController = null;
            }
    
            this.state = {
                isVisible      : false,
                isLoading      : false,
                isStreaming    : false,
                currentQuestion: '',
                currentResponse: '',
                showTextInput  : true,
            };
            this._broadcastState();
    
            internalBridge.emit('window:requestVisibility', { name: 'ask', visible: false });
    
            return { success: true };
        }
    

    /**
     * 
     * @param {string[]} conversationTexts
     * @returns {string}
     * @private
     */
    _formatConversationForPrompt(conversationHistory) {
        if (!conversationHistory || conversationHistory.length === 0) {
            return 'No conversation history available.';
        }
        
        // Check if this is transcript format (from Live Insights) or conversation format
        if (typeof conversationHistory[0] === 'string' && conversationHistory[0].includes(':')) {
            // This is transcript format: ["Speaker: Text", "Speaker: Text", ...]
            return conversationHistory.join('\n');
        } else {
            // This is conversation format: [{question, response}, ...]
            const formattedHistory = conversationHistory.slice(-5).map(item => {
                return `Previous Question: ${item.question}\nPrevious Response: ${item.response}`;
            }).join('\n\n');
            
            return `Conversation Context:\n${formattedHistory}\n\nPlease continue the conversation based on this context.`;
        }
    }

    /**
     * 
     * @param {string} userPrompt
     * @param {object} options - Optional parameters
     * @param {string[]} options.conversationHistoryRaw - Conversation history
     * @param {boolean} options.fromCamera - Whether this is a camera-triggered request
     * @returns {Promise<{success: boolean, response?: string, error?: string}>}
     */
    async sendMessage(userPrompt, options = {}) {
        const { conversationHistoryRaw = [], fromCamera = false } = options;
        return this._processMessage(userPrompt, conversationHistoryRaw, fromCamera, null, null, null, options);
    }

    async sendMessageWithSettings(userPrompt, userMode, careerProfile, conversationHistory = [], screenshotData = null) {
        return this._processMessage(userPrompt, conversationHistory, false, userMode, careerProfile, screenshotData, {});
    }

    async _processMessage(userPrompt, conversationHistoryRaw = [], fromCamera = false, userMode = null, careerProfile = null, screenshotData = null, options = {}) {
        // Check if user is authenticated
        const authService = require('../common/services/authService');
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser.isLoggedIn) {
            console.error('[AskService] User not authenticated. Request blocked.');
            return { success: false, error: 'Authentication required. Please log in through Settings.' };
        }

        internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
        this.state = {
            ...this.state,
            isLoading: true,
            isStreaming: false,
            currentQuestion: userPrompt,
            currentResponse: '',
            showTextInput: false,
        };
        this._broadcastState();

        if (this.abortController) {
            this.abortController.abort('New request received.');
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;


        let sessionId;

        try {
            console.log(`[AskService] 🤖 Processing message: ${userPrompt.substring(0, 50)}...`);

            sessionId = await sessionRepository.getOrCreateActive('ask');
            await askRepository.addAiMessage({ sessionId, role: 'user', content: userPrompt.trim() });
            console.log(`[AskService] DB: Saved user prompt to session ${sessionId}`);
            
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('AI model or API key not configured.');
            }
            console.log(`[AskService] Using model: ${modelInfo.model} for provider: ${modelInfo.provider}`);

            // Only use screenshot if explicitly provided by camera button
            let screenshotBase64 = null;
            if (screenshotData && screenshotData.base64) {
                screenshotBase64 = screenshotData.base64;
                console.log('[AskService] Using provided screenshot from camera button');
            } else {
                console.log('[AskService] No screenshot provided - sending text-only request');
            }

            const conversationHistory = this._formatConversationForPrompt(conversationHistoryRaw);
            console.log('[AskService] Conversation history length:', conversationHistoryRaw.length);
            console.log('[AskService] Formatted conversation history length:', conversationHistory.length);
            console.log('[AskService] First few conversation items:', conversationHistoryRaw.slice(0, 3));

            // Determine the appropriate prompt mode and system prompt
            let promptMode, systemPrompt;
            
            // Check if this is conversation text from STT (contains speaker prefixes like "me:", "them:")
            const isConversationText = userPrompt.includes('me:') || userPrompt.includes('them:') || 
                                     userPrompt.includes('Me:') || userPrompt.includes('Them:') ||
                                     (userPrompt.includes(':') && userPrompt.split('\n').length > 1);
            
            // Check if this is a question from Live Insights (Action Items or Follow-ups)
            const isFromLiveInsights = options.fromLiveInsights || userPrompt.includes('❓') || userPrompt.includes('✨') || userPrompt.includes('💬') || 
                                     userPrompt.includes('✉️') || userPrompt.includes('✅') || userPrompt.includes('📝');
            
            if (isConversationText) {
                // Use specialized conversation analysis prompt for selected conversation texts
                promptMode = 'conversation_analysis';
                systemPrompt = `You are an expert AI analyst specializing in conversation analysis. Your role is to analyze the selected conversation text and provide direct, insightful answers followed by detailed elaboration. If it's a coding question then respond with a working code and time and space complexity.

**CONVERSATION TEXT TO ANALYZE:**
${userPrompt}

**ANALYSIS REQUIREMENTS:**
1. **DIRECT ANSWER**: Start with a clear, direct answer to what was discussed or asked in the conversation
2. **ELABORATION**: Provide comprehensive elaboration explaining the context, implications, and details
3. **INSIGHTS**: Extract key insights, patterns, or observations from the conversation
4. **CONTEXT**: Provide relevant background information or industry context when applicable

**RESPONSE FORMAT:**
- **Direct Answer**: [One clear sentence answering the main point]
- **Elaboration**: [Detailed explanation and analysis]
- **Key Insights**: [What can be learned from this conversation]
- **Context**: [Relevant background or industry information]

**IMPORTANT**: Always start with a direct answer, then elaborate. Make your response conversational and insightful.`;
            } else if (isFromLiveInsights) {
                // Use specialized transcript analysis prompt for Live Insights questions
                promptMode = 'transcript_analysis';
                systemPrompt = `You are an expert AI analyst specializing in conversation transcript analysis. Your role is to analyze conversation transcripts and provide insightful, actionable responses.

**CRITICAL INSTRUCTION:**
Answer the question in few sentences in plain spoken english, then proceed with elaborating the answer. You should try to base your response on the actual conversation transcript provided below. If the transcript is empty or doesn't contain relevant information and question seems complete in itself, then answer it directly without basing it on the transcript. If it is some industry specific question, answer it wihtin one line and then proceed with elaborating the answer.
If it some coding question, start with brute force, then space time complextiy, then optimize the solution.
If it some system design question, state the functional requriements, then non functional requriements, then back of the envelope calculation, then start with high level design, then go to low level design, then go to trade offs, then go to scalability, then go to cost, then go to security, then go to deployment.

**CONVERSATION TRANSCRIPT:**
${conversationHistory}

**USER QUESTION:**
${userPrompt}

**RESPONSE FORMAT:**
- Answer the question in few sentences in plain spoken english, then proceed with elaborating the answer.
- If the transcript doesn't contain relevant information, state this clearly and proceed with answering the question
- If it some one liner direct question, answer it in one line and then proceed with elaborating the answer.
- If it some coding question, start with brute force, then space time complextiy, then optimize the solution.
- If it some system design question, state the functional requriements, then non functional requriements, then back of the envelope calculation, then start with high level design, then go to low level design, then go to trade offs, then go to scalability, then go to cost, then go to security, then go to deployment.
- Provide specific examples from the conversation when possible`;
            } else {
                // Use standard prompt for regular questions
                promptMode = fromCamera ? 'camera_analysis' : (userMode || 'pickle_glass');
                systemPrompt = getSystemPrompt(promptMode, conversationHistory, false, careerProfile);
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `User Request: ${userPrompt.trim()}` },
                    ],
                },
            ];

            if (screenshotBase64) {
                messages[1].content.push({
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` },
                });
            }
            
            const streamingLLM = createStreamingLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.7,
                maxTokens: 2048,
                usePortkey: modelInfo.provider === 'openai-glass',
                portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
            });

            try {
                const response = await streamingLLM.streamChat(messages);
                const askWin = getWindowPool()?.get('ask');

                if (!askWin || askWin.isDestroyed()) {
                    console.error("[AskService] Ask window is not available to send stream to.");
                    response.body.getReader().cancel();
                    return { success: false, error: 'Ask window is not available.' };
                }

                const reader = response.body.getReader();
                signal.addEventListener('abort', () => {
                    console.log(`[AskService] Aborting stream reader. Reason: ${signal.reason}`);
                    reader.cancel(signal.reason).catch(() => { /* 이미 취소된 경우의 오류는 무시 */ });
                });

                await this._processStream(reader, askWin, sessionId, signal);
                return { success: true };

            } catch (multimodalError) {
                // 멀티모달 요청이 실패했고 스크린샷이 포함되어 있다면 텍스트만으로 재시도
                if (screenshotBase64 && this._isMultimodalError(multimodalError)) {
                    console.log(`[AskService] Multimodal request failed, retrying with text-only: ${multimodalError.message}`);
                    
                    // 텍스트만으로 메시지 재구성
                    const textOnlyMessages = [
                        { role: 'system', content: systemPrompt },
                        {
                            role: 'user',
                            content: `User Request: ${userPrompt.trim()}`
                        }
                    ];

                    const fallbackResponse = await streamingLLM.streamChat(textOnlyMessages);
                    const askWin = getWindowPool()?.get('ask');

                    if (!askWin || askWin.isDestroyed()) {
                        console.error("[AskService] Ask window is not available for fallback response.");
                        fallbackResponse.body.getReader().cancel();
                        return { success: false, error: 'Ask window is not available.' };
                    }

                    const fallbackReader = fallbackResponse.body.getReader();
                    signal.addEventListener('abort', () => {
                        console.log(`[AskService] Aborting fallback stream reader. Reason: ${signal.reason}`);
                        fallbackReader.cancel(signal.reason).catch(() => {});
                    });

                    await this._processStream(fallbackReader, askWin, sessionId, signal);
                    
                    // Note: Token updating will be handled in _processStream for the fallback response
                    return { success: true };
                } else {
                    // 다른 종류의 에러이거나 스크린샷이 없었다면 그대로 throw
                    throw multimodalError;
                }
            }

        } catch (error) {
            console.error('[AskService] Error during message processing:', error);
            this.state = {
                ...this.state,
                isLoading: false,
                isStreaming: false,
                showTextInput: true,
            };
            this._broadcastState();

            const askWin = getWindowPool()?.get('ask');
            if (askWin && !askWin.isDestroyed()) {
                const streamError = error.message || 'Unknown error occurred';
                askWin.webContents.send('ask-response-stream-error', { error: streamError });
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * 
     * @param {ReadableStreamDefaultReader} reader
     * @param {BrowserWindow} askWin
     * @param {number} sessionId 
     * @param {AbortSignal} signal
     * @returns {Promise<void>}
     * @private
     */
    async _processStream(reader, askWin, sessionId, signal) {
        const decoder = new TextDecoder();
        let fullResponse = '';
        let usageInfo = null;

        try {
            this.state.isLoading = false;
            this.state.isStreaming = true;
            this._broadcastState();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') {
                            return; 
                        }
                        try {
                            const json = JSON.parse(data);
                            
                            // Check for usage information
                            if (json.choices[0]?.delta?.usage) {
                                usageInfo = json.choices[0].delta.usage;
                                console.log('[AskService] Captured token usage:', usageInfo);
                                continue;
                            }
                            

                            
                            // Process content tokens
                            const token = json.choices[0]?.delta?.content || '';
                            if (token) {
                                fullResponse += token;
                                this.state.currentResponse = fullResponse;
                                this._broadcastState();
                            }
                        } catch (error) {
                        }
                    }
                }
            }
        } catch (streamError) {
            if (signal.aborted) {
                console.log(`[AskService] Stream reading was intentionally cancelled. Reason: ${signal.reason}`);
            } else {
                console.error('[AskService] Error while processing stream:', streamError);
                if (askWin && !askWin.isDestroyed()) {
                    askWin.webContents.send('ask-response-stream-error', { error: streamError.message });
                }
            }
        } finally {
            this.state.isStreaming = false;
            this.state.currentResponse = fullResponse;
            this._broadcastState();
            
            // Update tokens after stream completion if usage info is available
            console.log('[AskService] Stream completed. Usage info:', usageInfo);
            if (usageInfo && usageInfo.total_tokens) {
                console.log(`[AskService] Attempting to update tokens: ${usageInfo.total_tokens} tokens used`);
                try {
                    const result = await this._updateTokensAfterResponse(usageInfo.total_tokens);
                    console.log(`[AskService] Token update result:`, result);
                    
                    // Notify the UI about the token update
                    if (result.success && typeof window !== 'undefined' && window.api) {
                        try {
                            await window.api.common.emitAppUsabilityChanged({
                                usable: true,
                                reason: 'Tokens updated after AI operation',
                                tokenStatus: result.newTokenStatus
                            });
                        } catch (notifyError) {
                            console.warn('[AskService] Failed to notify UI about token update:', notifyError);
                        }
                    }
                } catch (tokenError) {
                    console.error('[AskService] Failed to update tokens after response:', tokenError);
                }
            } else {
                console.log('[AskService] No usage info or total_tokens available for token update');
            }
            
            if (fullResponse) {
                 try {
                    await askRepository.addAiMessage({ sessionId, role: 'assistant', content: fullResponse });
                    console.log(`[AskService] DB: Saved partial or full assistant response to session ${sessionId} after stream ended.`);
                } catch(dbError) {
                    console.error("[AskService] DB: Failed to save assistant response after stream ended:", dbError);
                }
            }
        }
    }

    /**
     * Update tokens after AI response using Kettle API
     * @param {number} tokensUsed - Number of tokens consumed in the response
     * @private
     */
    async _updateTokensAfterResponse(tokensUsed) {
        try {
            // Check if we have access to the auth service
            if (typeof window !== 'undefined' && window.api) {
                // Try to update tokens through the frontend API
                const result = await window.api.settingsView.updateTokensAfterOperation(tokensUsed);
                if (result.success) {
                    console.log(`[AskService] Successfully updated tokens through frontend: ${tokensUsed} tokens used`);
                    return result;
                }
            }
            
            // Fallback: Try to update tokens directly through the backend
            const authService = require('../common/services/authService');
            if (authService && typeof authService.updateTokensAfterOperation === 'function') {
                const result = await authService.updateTokensAfterOperation(tokensUsed);
                if (result.success) {
                    console.log(`[AskService] Successfully updated tokens through backend: ${tokensUsed} tokens used`);
                    return result;
                }
            }
            
            console.warn('[AskService] Could not update tokens - no available method');
            return { success: false, error: 'No token update method available' };
            
        } catch (error) {
            console.error('[AskService] Error updating tokens after response:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 멀티모달 관련 에러인지 판단
     * @private
     */
    _isMultimodalError(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        return (
            errorMessage.includes('vision') ||
            errorMessage.includes('image') ||
            errorMessage.includes('multimodal') ||
            errorMessage.includes('unsupported') ||
            errorMessage.includes('image_url') ||
            errorMessage.includes('400') ||  // Bad Request often for unsupported features
            errorMessage.includes('invalid') ||
            errorMessage.includes('not supported')
        );
    }



}

const askService = new AskService();

// Export the service instance and make captureScreenshot available
module.exports = askService;
module.exports.captureScreenshot = captureScreenshot;