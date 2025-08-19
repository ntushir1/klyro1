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

// Regenerate PlantUML diagram
window.regeneratePlantUMLDiagram = function(button) {
    console.log('regeneratePlantUMLDiagram called with:', button);
    const container = button.closest('.plantuml-container');
    const img = container.querySelector('img');
    
    if (!img || !img.dataset.plantumlCode) {
        console.warn('No PlantUML code available for regeneration');
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
    
    // Fallback: open in new browser tab
    window.open(imageUrl, '_blank');
    console.log('Opened in new tab');
};

console.log('Global PlantUML functions loaded successfully');
console.log('Available functions:');
console.log('- window.initializeDiagramPan:', typeof window.initializeDiagramPan);
console.log('- window.zoomDiagram:', typeof window.zoomDiagram);
console.log('- window.regeneratePlantUMLDiagram:', typeof window.regeneratePlantUMLDiagram);
console.log('- window.openPlantUMLInWindow:', typeof window.openPlantUMLInWindow);
