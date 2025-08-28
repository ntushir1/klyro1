/**
 * PlantUML Extension for Marked.js
 * 
 * This extension automatically detects PlantUML code blocks and converts them
 * to image URLs that render beautiful diagrams with advanced controls.
 */

import { marked } from './marked-4.3.0.min.js';

// PlantUML encoder function
function encodePlantUML(code) {
    try {
        // Remove markdown code block markers if present
        let cleanCode = code.trim();
        if (cleanCode.startsWith('```')) {
            cleanCode = cleanCode.replace(/^```(plantuml|puml)?\n/, '').replace(/\n```$/, '');
        }
        
        // Use the plantuml-encoder package for proper encoding
        const { encode } = require('plantuml-encoder');
        return encode(cleanCode);
    } catch (error) {
        console.error('[Marked PlantUML] Encoding failed:', error);
        // Fallback to basic encoding
        return btoa(unescape(encodeURIComponent(code)));
    }
}

// Generate advanced PlantUML container with controls
function generatePlantUMLContainer(imageUrl, plantUMLCode = null, requestTitle = '', imageTitle = '') {
    return `<div class="plantuml-container" 
                 data-request-title="${encodeURIComponent(requestTitle || '')}"
                 data-image-title="${encodeURIComponent(imageTitle || '')}"
                 style="background: var(--main-content-background, #ffffff); border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 16px; margin: 1em 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div class="diagram-controls" style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <button class="regenerate-diagram-btn" 
                    onclick="window.regeneratePlantUMLDiagram(this)"
                    style="background: #f8f9fa; 
                           color: #6c757d; 
                           border: 1px solid #dee2e6; 
                           padding: 8px; 
                           border-radius: 6px; 
                           cursor: pointer; 
                           transition: all 0.2s ease;
                           display: flex;
                           align-items: center;
                           justify-content: center;
                           width: 32px;
                           height: 32px;"
                    onmouseover="this.style.background='#e9ecef'; this.style.borderColor='#adb5bd'"
                    onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'"
                    title="Regenerate diagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12c0 4.97-4.03 9-9 9-2.83 0-5.35-1.3-7-3.35l2-1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 12c0-4.97 4.03-9 9-9 2.83 0 5.35 1.3 7 3.35l-2 1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div style="display: flex; gap: 8px;">
                <button class="zoom-out-btn" 
                        onclick="window.zoomDiagram(this, 'out')"
                        style="background: #f8f9fa; 
                               color: #6c757d; 
                               border: 1px solid #dee2e6; 
                               padding: 8px; 
                               border-radius: 6px; 
                               cursor: pointer; 
                               transition: all 0.2s ease;
                               display: flex;
                               align-items: center;
                               justify-content: center;
                               width: 32px;
                               height: 32px;"
                        onmouseover="this.style.background='#e9ecef'; this.style.borderColor='#adb5bd'"
                        onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'"
                        title="Zoom out">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                        <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <button class="zoom-in-btn" 
                        onclick="window.zoomDiagram(this, 'in')"
                        style="background: #f8f9fa; 
                               color: #6c757d; 
                               border: 1px solid #dee2e6; 
                               padding: 8px; 
                               border-radius: 6px; 
                               cursor: pointer; 
                               transition: all 0.2s ease;
                               display: flex;
                               align-items: center;
                               justify-content: center;
                               width: 32px;
                               height: 32px;"
                        onmouseover="this.style.background='#e9ecef'; this.style.borderColor='#adb5bd'"
                        onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'"
                        title="Zoom in">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                        <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M11 8v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <button class="open-window-btn" 
                        onclick="window.openPlantUMLInWindow(this)"
                        style="background: #f8f9fa; 
                               color: #6c757d; 
                               border: 1px solid #dee2e6; 
                               padding: 8px; 
                               border-radius: 6px; 
                               cursor: pointer; 
                               transition: all 0.2s ease;
                               display: flex;
                               align-items: center;
                               justify-content: center;
                               width: 32px;
                               height: 32px;"
                        onmouseover="this.style.background='#e9ecef'; this.style.borderColor='#adb5bd'"
                        onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'"
                        title="Open in new window">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2"/>
                        <polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2"/>
                        <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="diagram-wrapper" style="overflow: scroll; display: block; max-height: 70vh; border-radius: 4px; border: 1px solid var(--border-color, #e0e0e0);">
            <img src="${imageUrl}" alt="PlantUML Diagram" 
                 class="plantuml-image"
                 style="transform-origin: top left; display: block; cursor: grab; transition: transform 0.2s ease;"
                 data-zoom="1"
                 data-pan-x="0"
                 data-pan-y="0"
                 data-plantuml-code="${plantUMLCode ? encodeURIComponent(plantUMLCode) : ''}"
                 onload="window.initializeDiagramPan(this);"
                 onerror="this.parentElement.innerHTML='<p style=\\'color: #ff3b30; padding: 12px; background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.3); border-radius: 6px;\\'>Failed to load PlantUML diagram</p>'">
        </div>
    </div>`;
}

// Custom renderer that handles PlantUML
const renderer = new marked.Renderer();

// Override the code block renderer
renderer.code = function(code, language) {
    // Check if this is a PlantUML code block
    //console.log('###################[Marked PlantUML] Rendering code block: ', language);
    if (language === 'plantuml' || language === 'puml' || language === 'plant' || (code.includes('@startuml') && code.includes('@enduml'))) {
        // Check if it contains PlantUML syntax
        if (code.includes('@startuml') && code.includes('@enduml')) {
            try {
                const encoded = encodePlantUML(code);
                const imageUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
                
                console.log('[Marked PlantUML] Generated image URL:', imageUrl);
                
                // Extract title information from the current context
                // Try to get request title from the current question or context
                const requestTitle = window.currentRequestTitle || 'PlantUML Request';
                const imageTitle = 'Diagram'; // Default title, could be enhanced to extract from code comments
                

                
                // Return the advanced container instead of a simple image
                return generatePlantUMLContainer(imageUrl, code, requestTitle, imageTitle);
            } catch (error) {
                console.error('[Marked PlantUML] Error processing PlantUML:', error);
                // Fallback to showing the code
                return `<pre><code class="language-plantuml">${code}</code></pre>`;
            }
        } else if (code.includes('@startuml') && !code.includes('@enduml')) {
            // PlantUML code is incomplete (still streaming) - show a loader
            return `<div class="plantuml-loader" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px dashed #dee2e6; text-align: center; margin: 10px 0;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 10px; color: #6c757d; font-size: 14px;">Generating Diagram...</div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>`;
        }
    }
    
    // Default code block rendering for non-PlantUML or invalid PlantUML
    return `<pre><code class="language-${language || ''}">${code}</code></pre>`;
};

// Configure marked with our custom renderer
marked.setOptions({
    renderer: renderer,
    gfm: true, // GitHub Flavored Markdown
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
});

export { marked as markedWithPlantUML };
