/**
 * Horizontal Scroll Module
 * 가지(Branches) 페이지 가로 스크롤 처리
 * 
 * @module modules/horizontal-scroll
 */

export async function initHorizontalScroll() {
    const page = document.getElementById('page-branches');
    const track = page?.querySelector('.horizontal-track');
    const progressBar = page?.querySelector('.h-progress-bar');

    if (!page || !track) return;

    // --- Dynamic Content Loading ---
    try {
        const response = await fetch('data/portfolio.json');
        if (response.ok) {
            const items = await response.json();
            if (items && items.length > 0) {
                const existingPanels = Array.from(track.querySelectorAll('.h-panel'));
                const heroPanel = existingPanels.find(p => p.classList.contains('hero-panel'));
                const ctaPanel = existingPanels.find(p => p.classList.contains('cta-panel'));

                track.innerHTML = '';
                if (heroPanel) track.appendChild(heroPanel);

                items.forEach((item, index) => {
                    const numStr = (index + 1).toString().padStart(2, '0');
                    const panel = document.createElement('section');
                    panel.className = 'h-panel work-panel';
                    panel.setAttribute('data-parallax', '');

                    panel.innerHTML = `
                        <div class="work-bg">
                            <div class="work-number">${numStr}</div>
                        </div>
                        <div class="work-content">
                            <div class="work-image">
                                <div class="image-frame">
                                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}">` : ''}
                                </div>
                            </div>
                            <div class="work-info">
                                <h2 class="work-title">${item.title}</h2>
                                <p class="work-desc">${item.description || ''}</p>
                                <span class="work-stat">${item.year || 'CLICK HERE'}</span>
                            </div>
                        </div>
                    `;
                    track.appendChild(panel);
                });

                if (ctaPanel) track.appendChild(ctaPanel);
            }
        }
    } catch (e) {
        console.warn('Failed to load portfolio data, using default content.', e);
    }

    const panels = track.querySelectorAll('.h-panel');
    const totalPanels = panels.length;
    let currentScroll = 0;
    let targetScroll = 0;

    function getTotalWidth() {
        return (totalPanels - 1) * window.innerWidth;
    }

    page.addEventListener('wheel', (e) => {
        if (!page.classList.contains('active')) return;
        e.preventDefault();
        targetScroll += e.deltaY;
        targetScroll = Math.max(0, Math.min(targetScroll, getTotalWidth()));
    }, { passive: false });

    function animateScroll() {
        currentScroll += (targetScroll - currentScroll) * 0.1;
        track.style.transform = `translateX(-${currentScroll}px)`;

        const progress = (currentScroll / getTotalWidth()) * 100;
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        panels.forEach((panel, i) => {
            const panelOffset = i * window.innerWidth - currentScroll;
            const rotateY = (panelOffset / window.innerWidth) * 35;
            const scale = 1 - Math.abs(panelOffset / window.innerWidth) * 0.15;
            const translateZ = -Math.abs(panelOffset / window.innerWidth) * 300;
            const translateX = (panelOffset / window.innerWidth) * 50;
            const opacity = Math.max(0.2, 1 - Math.abs(panelOffset / window.innerWidth) * 0.7);

            panel.style.transform = `
                perspective(1000px)
                rotateY(${rotateY}deg) 
                scale(${Math.max(0.75, scale)}) 
                translateZ(${translateZ}px)
                translateX(${translateX}px)
            `;
            panel.style.opacity = opacity;

            if (panel.hasAttribute('data-parallax')) {
                const parallaxAmount = panelOffset * 0.15;
                const content = panel.querySelector('.work-content');
                if (content) {
                    content.style.transform = `translateX(${parallaxAmount}px) translateZ(50px)`;
                }
            }
        });

        requestAnimationFrame(animateScroll);
    }
    animateScroll();

    // Touch support
    let touchStartX = 0;
    let touchStartScroll = 0;

    page.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartScroll = targetScroll;
    });

    page.addEventListener('touchmove', (e) => {
        if (!page.classList.contains('active')) return;
        const touchX = e.touches[0].clientX;
        const diff = touchStartX - touchX;
        targetScroll = touchStartScroll + diff * 2;
        targetScroll = Math.max(0, Math.min(targetScroll, getTotalWidth()));
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!page.classList.contains('active')) return;
        if (e.key === 'ArrowRight') {
            targetScroll = Math.min(targetScroll + window.innerWidth, getTotalWidth());
        } else if (e.key === 'ArrowLeft') {
            targetScroll = Math.max(targetScroll - window.innerWidth, 0);
        }
    });
}
