/**
 * PlantUML Control Functions
 * 
 * This file contains all the JavaScript functions needed for the advanced PlantUML container controls.
 * These functions are attached to the window object for global access.
 */

// Initialize pan functionality for a PlantUML diagram
window.initializeDiagramPan = function(img) {
    let isDragging = false;
    let startX, startY, startPanX, startPanY;
    
    img.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPanX = parseFloat(img.dataset.panX) || 0;
        startPanY = parseFloat(img.dataset.panY) || 0;
        img.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newPanX = startPanX + deltaX;
        const newPanY = startPanY + deltaY;
        
        img.dataset.panX = newPanX;
        img.dataset.panY = newPanY;
        
        updateImageTransform(img);
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = 'grab';
        }
    });
};

// Update image transform based on zoom and pan values
function updateImageTransform(img) {
    const zoom = parseFloat(img.dataset.zoom) || 1;
    const panX = parseFloat(img.dataset.panX) || 0;
    const panY = parseFloat(img.dataset.panY) || 0;
    
    // Ensure transform origin is top left
    img.style.transformOrigin = 'top left';
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

// Zoom functionality for PlantUML diagrams
window.zoomDiagram = function(button, direction) {
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    const wrapper = container.querySelector('.diagram-wrapper');
    
    if (!img || !wrapper) return;
    
    let currentZoom = parseFloat(img.dataset.zoom) || 1;
    
    if (direction === 'in') {
        currentZoom = Math.min(currentZoom * 1.2, 5); // Max zoom 5x
    } else if (direction === 'out') {
        currentZoom = Math.max(currentZoom / 1.2, 0.2); // Min zoom 0.2x
    }
    
    img.dataset.zoom = currentZoom;
    updateImageTransform(img);
    
    // Always keep top-left view after zoom
    wrapper.scrollLeft = 0;
    wrapper.scrollTop = 0;
    
    // Update button states
    const zoomInBtn = container.querySelector('.zoom-in-btn');
    const zoomOutBtn = container.querySelector('.zoom-out-btn');
    
    if (zoomInBtn) zoomInBtn.disabled = currentZoom >= 5;
    if (zoomOutBtn) zoomOutBtn.disabled = currentZoom <= 0.2;
};

// Copy PlantUML code to clipboard
window.copyPlantUMLCode = function(button) {
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img || !img.dataset.plantumlCode) {
        showCopyFeedback(button, 'No code available');
        return;
    }
    
    const code = decodeURIComponent(img.dataset.plantumlCode);
    
    navigator.clipboard.writeText(code).then(() => {
        showCopyFeedback(button, 'Copied!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyFeedback(button, 'Copied!');
    });
};

// Show copy feedback
function showCopyFeedback(button, message) {
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = message;
    button.style.background = 'linear-gradient(135deg, #34c759 0%, #28a745 100%)';
    
    setTimeout(() => {
        button.querySelector('span').textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #007aff 0%, #0056cc 100%)';
    }, 2000);
}

// PlantUML encoder function using HEX format (guaranteed to work)
function encodePlantUML(code) {
    try {
        // Remove markdown code block markers if present
        let cleanCode = code.trim();
        if (cleanCode.startsWith('```')) {
            cleanCode = cleanCode.replace(/^```(plantuml|puml)?\n/, '').replace(/\n```$/, '');
        }
        
        // Use HEX encoding as specified in PlantUML documentation
        // This is simpler and guaranteed to work with PlantUML servers
        let hexString = '';
        for (let i = 0; i < cleanCode.length; i++) {
            hexString += cleanCode.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hexString;
    } catch (error) {
        console.error('[PlantUML] Encoding failed:', error);
        // Final fallback to HEX encoding
        let hexString = '';
        for (let i = 0; i < code.length; i++) {
            hexString += code.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hexString;
    }
}

// Regenerate PlantUML diagram
window.regeneratePlantUMLDiagram = async function(button) {
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img || !img.dataset.plantumlCode) {
        showRegenerateFeedback(button, 'No code available');
        return;
    }
    
    // Get context information from container data attributes
    const requestTitle = decodeURIComponent(container.dataset.requestTitle || 'PlantUML Request');
    const imageTitle = decodeURIComponent(container.dataset.imageTitle || 'Diagram');
    
    // Extract current PlantUML code from the image data attribute
    const currentPlantUMLCode = decodeURIComponent(img.dataset.plantumlCode || '');
    
    console.log('[PlantUML] Regenerating diagram with context:', { requestTitle, imageTitle, currentPlantUMLCode });
    
    // Show loading state
    button.disabled = true;
    button.style.opacity = '0.5';
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="15 5"/>
        </svg>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    
    try {
        // Check if we have access to the API
        if (window.api && window.api.askView && window.api.askView.regeneratePlantUML) {
            // Call the LLM to generate new PlantUML code with the current code for improvement
            const result = await window.api.askView.regeneratePlantUML(requestTitle, imageTitle, currentPlantUMLCode);
            
            if (result && result.success && result.plantUMLCode) {
                console.log('[PlantUML] Received new PlantUML code from LLM');
                
                // Encode the new PlantUML code and update the image directly
                const encoded = encodePlantUML(result.plantUMLCode);
                const newImageUrl = `https://www.plantuml.com/plantuml/png/~h${encoded}`;

                console.log('[PlantUML21312432] Received new PlantUML code from LLM', newImageUrl);
                console.log('newImageUrl###########################################\n', newImageUrl);
                // Update the image source and data attributes
                img.src = newImageUrl;
                img.dataset.plantumlCode = encodeURIComponent(result.plantUMLCode);
                
                // Reset zoom and pan
                img.dataset.zoom = '1';
                img.dataset.panX = '0';
                img.dataset.panY = '0';
                updateImageTransform(img);
                
                console.log('[PlantUML] Updated diagram with new PlantUML code');
                
                // Show success feedback
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    // Restore original refresh icon
                    button.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12c0 4.97-4.03 9-9 9-2.83 0-5.35-1.3-7-3.35l2-1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3 12c0-4.97 4.03-9 9-9 2.83 0 5.35 1.3 7 3.35l-2 1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    button.disabled = false;
                    button.style.opacity = '1';
                }, 2000);
            } else {
                throw new Error(result?.error || 'Failed to regenerate diagram');
            }
        } else {
            // Fallback to old behavior if API is not available
            console.warn('[PlantUML] API not available, falling back to image reload');
            
            // Force image reload by adding timestamp
            const originalSrc = img.src;
            const separator = originalSrc.includes('?') ? '&' : '?';
            img.src = originalSrc + separator + 't=' + Date.now();
            
            // Reset zoom and pan
            img.dataset.zoom = '1';
            img.dataset.panX = '0';
            img.dataset.panY = '0';
            updateImageTransform(img);
            
            // Restore button after delay
            setTimeout(() => {
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12c0 4.97-4.03 9-9 9-2.83 0-5.35-1.3-7-3.35l2-1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 12c0-4.97 4.03-9 9-9 2.83 0 5.35 1.3 7 3.35l-2 1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                button.disabled = false;
                button.style.opacity = '1';
            }, 3000);
        }
    } catch (error) {
        console.error('[PlantUML] Error regenerating diagram:', error);
        
        // Show error feedback
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
        
        setTimeout(() => {
            // Restore original refresh icon
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12c0 4.97-4.03 9-9 9-2.83 0-5.35-1.3-7-3.35l2-1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 12c0-4.97 4.03-9 9-9 2.83 0 5.35 1.3 7 3.35l-2 1.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        button.disabled = false;
        button.style.opacity = '1';
    }, 3000);
    }
};

// Show regenerate feedback (no longer needed with icon-only buttons)
function showRegenerateFeedback(button, message) {
    // Icon-only buttons don't need text feedback
    console.log('Regenerate feedback:', message);
}

// Open PlantUML diagram in new window
window.openPlantUMLInWindow = function(button) {
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img) {
        showOpenWindowFeedback(button, 'No image available');
        return;
    }
    
    const imageUrl = img.src;
    const diagramTitle = 'Design Diagram';
    
    // Use the existing window management system
    if (window.api && window.api.openDiagramWindow) {
        window.api.openDiagramWindow(imageUrl, diagramTitle).then(result => {
            if (result.success) {
                showOpenWindowFeedback(button, 'Opened!');
            } else {
                showOpenWindowFeedback(button, 'Failed to open');
            }
        }).catch(error => {
            console.error('Error opening diagram window:', error);
            showOpenWindowFeedback(button, 'Error');
        });
    } else {
        // Fallback: open in new browser tab
        window.open(imageUrl, '_blank');
        showOpenWindowFeedback(button, 'Opened!');
    }
};

// Show open window feedback (no longer needed with icon-only buttons)
function showOpenWindowFeedback(button, message) {
    // Icon-only buttons don't need text feedback
    console.log('Open window feedback:', message);
}

// Reset all diagrams to default zoom and pan
window.resetAllDiagrams = function() {
    const diagrams = document.querySelectorAll('.plantuml-container img');
    diagrams.forEach(img => {
        img.dataset.zoom = '1';
        img.dataset.panX = '0';
        img.dataset.panY = '0';
        updateImageTransform(img);
    });
};

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDiagramPan: window.initializeDiagramPan,
        zoomDiagram: window.zoomDiagram,
        copyPlantUMLCode: window.copyPlantUMLCode,
        regeneratePlantUMLDiagram: window.regeneratePlantUMLDiagram,
        openPlantUMLInWindow: window.openPlantUMLInWindow,
        resetAllDiagrams: window.resetAllDiagrams
    };
}

// Debug: Log when functions are loaded
console.log('PlantUML functions loaded successfully:', {
    initializeDiagramPan: typeof window.initializeDiagramPan,
    zoomDiagram: typeof window.zoomDiagram,
    regeneratePlantUMLDiagram: typeof window.regeneratePlantUMLDiagram,
    openPlantUMLInWindow: typeof window.openPlantUMLInWindow,
    resetAllDiagrams: typeof window.resetAllDiagrams
});
