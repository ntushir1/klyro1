/**
 * PlantUML Extension for Marked.js
 * 
 * This extension automatically detects PlantUML code blocks and converts them
 * to image URLs that render beautiful diagrams.
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

// Custom renderer that handles PlantUML
const renderer = new marked.Renderer();

// Override the code block renderer
renderer.code = function(code, language) {
    // Check if this is a PlantUML code block
    if (language === 'plantuml' || language === 'puml') {
        // Check if it contains PlantUML syntax
        if (code.includes('@startuml') && code.includes('@enduml')) {
            try {
                const encoded = encodePlantUML(code);
                const imageUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
                
                console.log('[Marked PlantUML] Generated image URL:', imageUrl);
                
                // Return an image element instead of a code block
                return `<div class="plantuml-diagram">
                    <img src="${imageUrl}" 
                         alt="PlantUML Diagram" 
                         style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="plantuml-fallback" style="display: none; background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; border: 1px solid #ddd;">
                        <strong>PlantUML Code:</strong><br>
                        ${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                </div>`;
            } catch (error) {
                console.error('[Marked PlantUML] Error processing PlantUML:', error);
                // Fallback to showing the code
                return `<pre><code class="language-plantuml">${code}</code></pre>`;
            }
        } else if (code.includes('@startuml') && !code.includes('@enduml')) {
            // PlantUML code is incomplete (still streaming) - show a loader
            return `<div class="plantuml-loader" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px dashed #dee2e6; text-align: center; margin: 10px 0;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 10px; color: #6c757d; font-size: 14px;">Generating PlantUML Diagram...</div>
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
