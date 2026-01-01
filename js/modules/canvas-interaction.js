/**
 * Canvas Interaction Module
 * 뿌리(Roots) 페이지 캔버스 줌/팬 인터랙션
 * 
 * @module modules/canvas-interaction
 */

// State (Module Scope for Shared Access)
let scale = 0.6;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;
let lastTranslateX, lastTranslateY;
let skipAutoFit = false; // Flag to skip auto fitToView when programmatic zoom is scheduled

export function initCanvasInteraction() {
    const wrapper = document.getElementById('canvas-wrapper');
    const content = document.getElementById('canvas-content');
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    const zoomFitBtn = document.querySelector('.zoom-fit');
    const zoomLevel = document.querySelector('.zoom-level');

    if (!wrapper || !content) return;

    function updateTransform(smooth = false) {
        if (smooth) {
            content.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        } else {
            content.style.transition = 'none';
        }
        content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(scale * 100)}%`;
        }
    }

    function centerContent() {
        const wrapperRect = wrapper.getBoundingClientRect();
        const scaledWidth = content.offsetWidth * scale;
        const scaledHeight = content.offsetHeight * scale;
        translateX = (wrapperRect.width - scaledWidth) / 2;
        translateY = (wrapperRect.height - scaledHeight) / 2;
        updateTransform(true);
    }

    function fitToView() {
        const wrapperRect = wrapper.getBoundingClientRect();
        const contentWidth = content.offsetWidth;
        const contentHeight = content.offsetHeight;
        const scaleX = (wrapperRect.width * 0.9) / contentWidth;
        const scaleY = (wrapperRect.height * 0.9) / contentHeight;
        scale = Math.min(scaleX, scaleY, 1);
        centerContent();
    }

    function zoomToCenter(newScale) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const centerX = wrapperRect.width / 2;
        const centerY = wrapperRect.height / 2;
        const contentCenterX = (centerX - translateX) / scale;
        const contentCenterY = (centerY - translateY) / scale;
        scale = Math.max(0.2, Math.min(2, newScale));
        translateX = centerX - contentCenterX * scale;
        translateY = centerY - contentCenterY * scale;
        updateTransform(true);
    }

    // Initialize when page becomes active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('active')) {
                // Skip auto fitToView if programmatic zoom is scheduled
                if (skipAutoFit) {
                    console.log('[Canvas] Skipping auto fitToView (programmatic zoom scheduled)');
                    return;
                }
                setTimeout(fitToView, 100);
            }
        });
    });

    const rootsPage = document.getElementById('page-roots');
    if (rootsPage) {
        observer.observe(rootsPage, { attributes: true, attributeFilter: ['class'] });
    }

    // Mouse drag to pan
    wrapper.addEventListener('mousedown', (e) => {
        if (e.target.closest('.canvas-node')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastTranslateX = translateX;
        lastTranslateY = translateY;
        wrapper.style.cursor = 'grabbing';
        content.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = lastTranslateX + (e.clientX - startX);
        translateY = lastTranslateY + (e.clientY - startY);
        updateTransform(false);
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            wrapper.style.cursor = 'grab';
        }
    });

    // Mouse wheel zoom
    wrapper.addEventListener('wheel', (e) => {
        const rootsPage = document.getElementById('page-roots');
        if (!rootsPage?.classList.contains('active')) return;

        e.preventDefault();
        const wrapperRect = wrapper.getBoundingClientRect();
        const zoomSpeed = 0.001;
        const delta = -e.deltaY * zoomSpeed;
        const newScale = Math.max(0.2, Math.min(2, scale + delta));
        const mouseX = e.clientX - wrapperRect.left;
        const mouseY = e.clientY - wrapperRect.top;
        const contentX = (mouseX - translateX) / scale;
        const contentY = (mouseY - translateY) / scale;
        scale = newScale;
        translateX = mouseX - contentX * scale;
        translateY = mouseY - contentY * scale;
        updateTransform(false);
    }, { passive: false });

    // Zoom buttons
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => zoomToCenter(scale + 0.15));
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => zoomToCenter(scale - 0.15));
    }
    if (zoomFitBtn) {
        zoomFitBtn.addEventListener('click', () => fitToView());
    }

    // Touch support
    let lastTouchDistance = 0;

    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            if (e.target.closest('.canvas-node')) return;
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            lastTranslateX = translateX;
            lastTranslateY = translateY;
            content.style.transition = 'none';
        } else if (e.touches.length === 2) {
            isDragging = false;
            lastTouchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    });

    wrapper.addEventListener('touchmove', (e) => {
        const rootsPage = document.getElementById('page-roots');
        if (!rootsPage?.classList.contains('active')) return;
        e.preventDefault();

        if (e.touches.length === 1 && isDragging) {
            translateX = lastTranslateX + (e.touches[0].clientX - startX);
            translateY = lastTranslateY + (e.touches[0].clientY - startY);
            updateTransform(false);
        } else if (e.touches.length === 2) {
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const center = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            const scaleChange = distance / lastTouchDistance;
            const newScale = Math.max(0.2, Math.min(2, scale * scaleChange));
            const wrapperRect = wrapper.getBoundingClientRect();
            const pinchX = center.x - wrapperRect.left;
            const pinchY = center.y - wrapperRect.top;
            const contentX = (pinchX - translateX) / scale;
            const contentY = (pinchY - translateY) / scale;
            scale = newScale;
            translateX = pinchX - contentX * scale;
            translateY = pinchY - contentY * scale;
            lastTouchDistance = distance;
            updateTransform(false);
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Double click to reset view
    wrapper.addEventListener('dblclick', (e) => {
        if (e.target.closest('.canvas-node')) return;
        fitToView();
    });
}

/**
 * Set skipAutoFit flag to prevent auto fitToView
 */
export function setSkipAutoFit(value) {
    skipAutoFit = value;
    console.log('[Canvas] skipAutoFit set to:', value);
}

/**
 * Programmatically zoom to specific coordinates
 */
export function zoomToCoordinates(targetX, targetY, targetScale = 1.0) {
    const wrapper = document.getElementById('canvas-wrapper');
    const content = document.getElementById('canvas-content');

    if (!wrapper || !content) return;

    // Calculate center of wrapper
    const wrapperRect = wrapper.getBoundingClientRect();
    const centerX = wrapperRect.width / 2;
    const centerY = wrapperRect.height / 2;

    // Set scale
    scale = targetScale;

    // Calculate translate to put targetX, targetY at center
    translateX = centerX - targetX * scale;
    translateY = centerY - targetY * scale;

    // Update Transform logic
    const zoomLevel = document.querySelector('.zoom-level');
    content.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
    content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    }
}

