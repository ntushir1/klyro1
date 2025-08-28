/**
 * Global PlantUML Control Functions
 * 
 * This file defines all PlantUML control functions in the global window scope.
 * It should be loaded before any PlantUML rendering happens.
 */

console.log('Loading global PlantUML functions...');

// Initialize pan functionality for a PlantUML diagram
window.initializeDiagramPan = function(img) {
    console.log('initializeDiagramPan called with:', img);
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
    
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

// Zoom functionality for PlantUML diagrams
window.zoomDiagram = function(button, direction) {
    console.log('zoomDiagram called with:', button, direction);
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img) {
        console.warn('No image found for zoom');
        return;
    }
    
    let currentZoom = parseFloat(img.dataset.zoom) || 1;
    
    if (direction === 'in') {
        currentZoom = Math.min(currentZoom * 1.2, 5); // Max zoom 5x
    } else if (direction === 'out') {
        currentZoom = Math.max(currentZoom / 1.2, 0.2); // Min zoom 0.2x
    }
    
    img.dataset.zoom = currentZoom;
    updateImageTransform(img);
    
    // Update button states
    const zoomInBtn = container.querySelector('.zoom-in-btn');
    const zoomOutBtn = container.querySelector('.zoom-out-btn');
    
    if (zoomInBtn) zoomInBtn.disabled = currentZoom >= 5;
    if (zoomOutBtn) zoomOutBtn.disabled = currentZoom <= 0.2;
    
    console.log('Zoom applied:', currentZoom);
};

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
    console.log('regeneratePlantUMLDiagram called with:', button);
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img || !img.dataset.plantumlCode) {
        console.warn('No PlantUML code available for regeneration');
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

// Open PlantUML diagram in new window
window.openPlantUMLInWindow = function(button) {
    console.log('openPlantUMLInWindow called with:', button);
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img) {
        console.log('No image available');
        return;
    }
    
    const imageUrl = img.src;
    
    // Create stealth Electron window instead of browser tab
    if (window.api && window.api.common && window.api.common.createPlantUMLWindow) {
        try {
            // Extract title from the diagram if available
            const title = container.querySelector('.diagram-title')?.textContent || 'Design Diagram';
            
            window.api.common.createPlantUMLWindow(imageUrl, title).then(result => {
                if (result.success) {
                    console.log('PlantUML diagram opened in stealth window:', result.windowId);
                } else {
                    console.error('Failed to create PlantUML window:', result.error);
                    // Fallback to browser tab
                    window.open(imageUrl, '_blank');
                }
            }).catch(error => {
                console.error('Error creating PlantUML window:', error);
                // Fallback to browser tab
                window.open(imageUrl, '_blank');
            });
        } catch (error) {
            console.error('Error calling createPlantUMLWindow:', error);
            // Fallback to browser tab
            window.open(imageUrl, '_blank');
        }
    } else {
        console.warn('PlantUML window API not available, falling back to browser tab');
        // Fallback: open in new browser tab
        window.open(imageUrl, '_blank');
    }
};

console.log('Global PlantUML functions loaded successfully');
console.log('Available functions:');
console.log('- window.initializeDiagramPan:', typeof window.initializeDiagramPan);
console.log('- window.zoomDiagram:', typeof window.zoomDiagram);
console.log('- window.regeneratePlantUMLDiagram:', typeof window.regeneratePlantUMLDiagram);
console.log('- window.openPlantUMLInWindow:', typeof window.openPlantUMLInWindow);
