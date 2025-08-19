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

// Regenerate PlantUML diagram
window.regeneratePlantUMLDiagram = function(button) {
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img || !img.dataset.plantumlCode) {
        showRegenerateFeedback(button, 'No code available');
        return;
    }
    
    // Show loading state
    button.disabled = true;
    button.style.opacity = '0.5';
    
    // Force image reload by adding timestamp
    const originalSrc = img.src;
    const separator = originalSrc.includes('?') ? '&' : '?';
    img.src = originalSrc + separator + 't=' + Date.now();
    
    // Reset zoom and pan
    img.dataset.zoom = '1';
    img.dataset.panX = '0';
    img.dataset.panY = '0';
    updateImageTransform(img);
    
    // Re-enable button after a delay
    setTimeout(() => {
        button.disabled = false;
        button.style.opacity = '1';
    }, 3000);
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
    const diagramTitle = 'PlantUML Diagram';
    
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
