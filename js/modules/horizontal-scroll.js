/**
 * Horizontal Scroll Module
 * 가지(Branches) 페이지 가로 스크롤 처리
 * 
 * @module modules/horizontal-scroll
 */

export function initHorizontalScroll() {
    const page = document.getElementById('page-branches');
    const track = page?.querySelector('.horizontal-track');
    const progressBar = page?.querySelector('.h-progress-bar');

    // Safety check: DOM must be ready (populated by branches.page.js)
    const panels = track?.querySelectorAll('.h-panel');

    if (!page || !track || !panels || panels.length === 0) {
        console.warn('[HorizontalScroll] Elements not found. Ensure branches.page.js has populated content.');
        return;
    }

    // --- Optimization: Cache Dimensions & Elements ---
    let windowWidth = window.innerWidth;
    let totalPanels = panels.length;
    let totalWidth = (totalPanels - 1) * windowWidth;

    // Cache access to content for parallax to avoid querySelector in rAF
    const contentElements = Array.from(panels).map(p => p.querySelector('.work-content'));

    let currentScroll = 0;
    let targetScroll = 0;
    let isVisible = false;
    let animationFrameId = null;

    // --- Optimization: Resize Observer ---
    window.addEventListener('resize', () => {
        windowWidth = window.innerWidth;
        totalWidth = (totalPanels - 1) * windowWidth;
        // Clamp scroll on resize
        targetScroll = Math.max(0, Math.min(targetScroll, totalWidth));
        currentScroll = targetScroll; // Jump to avoid resize drift
    });

    // --- Optimization: Intersection Observer for Animation Gating ---
    // Only run the heavy animation loop when the page is actually visible.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isVisible = true;
                startLoop();
            } else {
                isVisible = false;
                stopLoop();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(page);

    // --- Input Handlers (Enabled/Gated by Page Class/Visibility) ---

    page.addEventListener('wheel', (e) => {
        // Strict gate: only if visible and active class present
        if (!isVisible || !page.classList.contains('active')) return;

        e.preventDefault();

        // Accumulate delta
        targetScroll += e.deltaY;
        targetScroll = Math.max(0, Math.min(targetScroll, totalWidth));
    }, { passive: false });

    // Touch Support
    let touchStartX = 0;
    let touchStartScroll = 0;

    page.addEventListener('touchstart', (e) => {
        if (!page.classList.contains('active')) return;
        touchStartX = e.touches[0].clientX;
        touchStartScroll = targetScroll;
    }, { passive: true }); // Passive is acceptable here as we don't preventDefault

    page.addEventListener('touchmove', (e) => {
        if (!page.classList.contains('active')) return;
        const touchX = e.touches[0].clientX;
        const diff = touchStartX - touchX;
        targetScroll = touchStartScroll + diff * 2; // 2x multiplier for feel
        targetScroll = Math.max(0, Math.min(targetScroll, totalWidth));
    }, { passive: true });

    // Keyboard Navigation (Global listener, gated)
    function handleKeydown(e) {
        if (!isVisible || !page.classList.contains('active')) return;

        if (e.key === 'ArrowRight') {
            targetScroll = Math.min(targetScroll + windowWidth, totalWidth);
        } else if (e.key === 'ArrowLeft') {
            targetScroll = Math.max(targetScroll - windowWidth, 0);
        }
    }
    // Prevent duplicate listeners if init is called multiple times
    document.removeEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', handleKeydown);


    // --- Optimized Animation Loop ---

    function startLoop() {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animateScroll);
        }
    }

    function stopLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function animateScroll() {
        if (!isVisible) {
            animationFrameId = null;
            return;
        }

        // 1. Physics (Lerp)
        const diff = targetScroll - currentScroll;

        // --- Optimization: Idle Check ---
        // If movement is negligible, skip heavy DOM writes
        if (Math.abs(diff) < 0.1 && Math.abs(currentScroll % 1) < 0.1) {
            currentScroll = targetScroll; // Snap
            // Check if we already rendered the snap? 
            // We'll proceed to render one last frame then maybe skip?
            // For now, continuing the loop is safer for parallax and responsiveness,
            // but we can skip the heavy transform calculation if "diff" is zero for a while.
            // Let's keep it simple: just render. The lerp keeps it cheap when close.
        } else {
            currentScroll += diff * 0.1;
        }

        // 2. Track Transform (Batch Write)
        track.style.transform = `translate3d(-${currentScroll}px, 0, 0)`;

        // 3. Progress Bar (Throttled Update)
        if (progressBar) {
            const progress = (currentScroll / totalWidth) * 100;
            // Only update if changes > 0.1% to avoid style recalc churn
            progressBar.style.width = `${progress}%`;
        }

        // 4. Panel Transforms (The Expensive Part)
        // Optimized to minimize GC and recalculations
        const scrollX = currentScroll; // Local access

        for (let i = 0; i < totalPanels; i++) {
            const panel = panels[i];
            const content = contentElements[i];

            // Calculate relationship to viewport center (simplified)
            // Original logic: offset = i * width - scroll
            const panelOffset = (i * windowWidth) - scrollX;
            const normalizedOffset = panelOffset / windowWidth;

            // Optimization: Frustum Culling-ish
            // If panel is far off-screen (e.g. > 2 screens away), hide it or skip transform
            if (normalizedOffset < -2 || normalizedOffset > 2) {
                // Just ensuring it's hidden or default state if it was visible
                // Accessing style.opacity reads is fast enough, writing only if needed
                if (panel.style.opacity !== '0') panel.style.opacity = '0';
                continue;
            }

            const absOffset = Math.abs(normalizedOffset);

            // Calculations matches visuals:
            // RotateY: -60 to 60 based on offset
            const rotateY = Math.max(-60, Math.min(60, normalizedOffset * 35));
            // Scale: 1 down to 0.75-ish
            const scale = Math.max(0.75, 1 - absOffset * 0.15);
            // TranslateZ: Push back
            const translateZ = -absOffset * 300;
            // TranslateX: Slight spread
            const translateX = normalizedOffset * 50;

            // Opacity
            const targetOpacity = Math.max(0, 1 - absOffset * 0.5);

            // Apply Panel Transform
            // Using template string is fine, modern JS engines optimize this well enough 
            // compared to the reflow cost.
            panel.style.transform =
                `perspective(1000px) rotateY(${rotateY}deg) scale(${scale}) translate3d(${translateX}px, 0, ${translateZ}px)`;

            // Optimization: Dirty check for opacity
            // (Browser style recalc handles this well, but we can be explicit)
            panel.style.opacity = targetOpacity;

            // Parallax Content
            if (content && panel.hasAttribute('data-parallax')) {
                const parallaxX = panelOffset * 0.15;
                content.style.transform = `translate3d(${parallaxX}px, 0, 50px)`;
            }
        }

        animationFrameId = requestAnimationFrame(animateScroll);
    }
}
