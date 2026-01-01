/**
 * Roots Modal Renderer Module
 * 
 * Clean Architecture: Presentation Layer
 * Handles all modal rendering logic for the Roots page.
 * 
 * Features:
 * - Gallery View with search
 * - Detail View for sub-items
 * - Standard Layout with floating toasts
 * - YouTube video modal overlay
 */

// ===========================
// Gallery View Renderer
// ===========================
export function renderGalleryView(modal, detailedItems, parentItem) {
    modal.querySelector('.modal-images').innerHTML = '';
    const textContainer = modal.querySelector('.modal-text');
    textContainer.innerHTML = '';

    // Search Bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'gallery-search-container';
    searchContainer.innerHTML = `
        <input type="text" class="gallery-search-input" placeholder="${parentItem.title} 검색..." />
    `;
    textContainer.appendChild(searchContainer);

    // Grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'gallery-grid';
    textContainer.appendChild(gridContainer);

    const renderGallery = (items) => {
        gridContainer.innerHTML = '';
        if (items.length === 0) {
            gridContainer.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            return;
        }

        items.forEach(subItem => {
            const card = document.createElement('div');
            card.className = 'gallery-item';

            let imgUrl = '';
            if (subItem.images && subItem.images.length > 0) {
                imgUrl = subItem.images[0].url || subItem.images[0];
            }

            card.innerHTML = `
                <div class="gallery-thumb" style="background-image: url('${imgUrl}')"></div>
                <div class="gallery-title">${subItem.title}</div>
            `;

            card.onclick = () => renderDetailView(subItem, textContainer, parentItem, modal);
            gridContainer.appendChild(card);
        });
    };

    renderGallery(detailedItems);

    const searchInput = searchContainer.querySelector('input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = detailedItems.filter(i => i.title.toLowerCase().includes(query));
        renderGallery(filtered);
    });
}

// ===========================
// Detail View Renderer
// ===========================
function renderDetailView(subItem, container, parentItem, modal) {
    container.innerHTML = '';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'detail-back-btn';
    backBtn.textContent = `← ${parentItem.title}`;
    backBtn.onclick = () => {
        if (window.portfolioData && window.portfolioData.detailedPortfolios) {
            const DETAILED_MAP = getDetailedMap();
            let detailedKey = null;
            Object.keys(DETAILED_MAP).forEach(key => {
                if (parentItem.title.includes(key)) {
                    detailedKey = DETAILED_MAP[key];
                }
            });
            const detailedItems = window.portfolioData.detailedPortfolios[detailedKey] || [];
            renderGalleryView(modal, detailedItems, parentItem);
        }
    };
    container.appendChild(backBtn);

    // Title
    const title = document.createElement('h2');
    title.className = 'detail-title';
    title.textContent = subItem.title;
    container.appendChild(title);

    // Images
    if (subItem.images && subItem.images.length > 0) {
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'detail-images';
        subItem.images.forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = img.url || img;
            imgEl.className = 'detail-img';
            imagesDiv.appendChild(imgEl);
        });
        container.appendChild(imagesDiv);
    }

    // Text content (excluding bookmarks - they go to toast only)
    if (subItem.content && subItem.content.length > 0) {
        subItem.content.forEach(text => {
            const p = document.createElement('p');
            p.textContent = text;
            container.appendChild(p);
        });
    }
}

// ===========================
// Standard Layout Renderer
// ===========================
export function renderStandardLayout(modal, item) {
    const imagesContainer = modal.querySelector('.modal-images');
    imagesContainer.innerHTML = '';

    if (item.images && item.images.length > 0) {
        item.images.forEach(img => {
            const imgEl = document.createElement('img');
            const url = img.url || img;
            imgEl.src = url;
            imgEl.className = 'modal-img';
            imagesContainer.appendChild(imgEl);
        });
    }

    const textContainer = modal.querySelector('.modal-text');
    textContainer.innerHTML = '';

    const collectedLinks = [];

    const processContent = (contentArray) => {
        if (!contentArray) return;
        contentArray.forEach(block => {
            if (typeof block === 'string') {
                const p = document.createElement('p');
                p.textContent = block;
                textContainer.appendChild(p);
                return;
            }
            if (block.type === 'paragraph') {
                const text = block.text?.trim();
                // Skip paragraphs that are just URLs (they become toasts instead)
                if (text && /^https?:\/\/\S+$/.test(text)) {
                    return; // Don't render pure URL text in body
                }
                const p = document.createElement('p');
                p.innerHTML = block.text.replace(/\n/g, '<br>');
                textContainer.appendChild(p);
            }
            else if (block.type === 'heading') {
                const h = document.createElement(block.level);
                h.textContent = block.text;
                textContainer.appendChild(h);
            }
            else if (block.type === 'video' || block.type === 'embed') {
                let url = block.url;
                if (block.type === 'video') url = block.video?.external?.url || block.video?.file?.url || block.url;
                if (block.type === 'embed') url = block.embed?.url || block.url;

                const ytId = getYoutubeId(url);
                if (ytId) {
                    // YouTube -> collect for toast, don't render in body
                    collectedLinks.push({ type: 'youtube', url, ytId });
                } else if (url) {
                    // Non-YouTube embed -> render in body
                    const div = document.createElement('div');
                    div.className = 'video-container';
                    div.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
                    textContainer.appendChild(div);
                }
            }
            else if (block.type === 'bookmark') {
                // Check if bookmark URL is YouTube
                const ytId = getYoutubeId(block.url);
                if (ytId) {
                    // YouTube bookmark -> treat as video toast
                    collectedLinks.push({ type: 'youtube', url: block.url, ytId });
                } else {
                    // Regular bookmarks go to toasts, NOT rendered in body
                    collectedLinks.push(block);
                }
            }
        });
    };

    if (item.richContent && item.richContent.length > 0) {
        processContent(item.richContent);
    } else if (item.rawTexts && item.rawTexts.length > 0) {
        processContent(item.rawTexts);
    } else if (item.textPreview) {
        const p = document.createElement('p');
        p.textContent = item.textPreview;
        textContainer.appendChild(p);
    }

    // Render Floating Toasts
    renderFloatingToasts(modal, collectedLinks);
}

// ===========================
// Floating Toast Renderer (Redesigned)
// ===========================
export function renderFloatingToasts(modal, collectedLinks) {
    if (collectedLinks.length === 0) return;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'link-toast-container';

    collectedLinks.forEach(link => {
        if (link.type === 'youtube') {
            // YouTube Toast - Large vertical card with thumbnail
            const toast = document.createElement('div');
            toast.className = 'link-toast video-toast-card';
            const thumbUrl = `https://img.youtube.com/vi/${link.ytId}/maxresdefault.jpg`;

            toast.innerHTML = `
                <div class="video-toast-preview" style="background-image: url('${thumbUrl}')">
                    <div class="video-play-overlay">
                        <div class="video-play-btn">▶</div>
                    </div>
                </div>
                <div class="video-toast-label">YouTube 영상 보기</div>
            `;

            // Click opens nested video modal
            toast.addEventListener('click', () => {
                openVideoModal(link.ytId);
            });

            toastContainer.appendChild(toast);
        } else {
            // Regular link toast -> opens in new tab
            const toast = document.createElement('a');
            toast.href = link.url;
            toast.target = '_blank';
            toast.className = 'link-toast';

            const meta = link.meta || {};
            let domain = '';
            try { domain = new URL(link.url).hostname; } catch (e) { domain = 'Link'; }

            toast.innerHTML = `
                <div class="link-toast-thumb" style="background-image: url('${meta.image || ''}')"></div>
                <div class="link-toast-content">
                    <div class="link-toast-title">${meta.title || link.url}</div>
                    <div class="link-toast-domain">${domain}</div>
                </div>
            `;
            toastContainer.appendChild(toast);
        }
    });
    modal.appendChild(toastContainer);
}

// ===========================
// YouTube Video Modal (Nested)
// ===========================
function openVideoModal(ytId) {
    // Remove existing video modal if any
    const existing = document.getElementById('video-overlay-modal');
    if (existing) existing.remove();

    const videoModal = document.createElement('div');
    videoModal.id = 'video-overlay-modal';
    videoModal.className = 'video-overlay-modal';

    videoModal.innerHTML = `
        <div class="video-overlay-backdrop"></div>
        <div class="video-overlay-content">
            <button class="video-overlay-close">✕</button>
            <div class="video-iframe-wrapper">
                <iframe 
                    src="https://www.youtube.com/embed/${ytId}?autoplay=1" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media; fullscreen" 
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    `;

    document.body.appendChild(videoModal);

    // Animate in
    requestAnimationFrame(() => {
        videoModal.classList.add('active');
    });

    // Close handlers
    const closeVideoModal = () => {
        videoModal.classList.remove('active');
        setTimeout(() => videoModal.remove(), 300);
    };

    videoModal.querySelector('.video-overlay-close').onclick = closeVideoModal;
    videoModal.querySelector('.video-overlay-backdrop').onclick = closeVideoModal;

    // ESC key closes video modal only (not parent modal)
    const onEsc = (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
            document.removeEventListener('keydown', onEsc);
        }
    };
    document.addEventListener('keydown', onEsc);
}

// ===========================
// Utility Functions
// ===========================
function getYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function getDetailedMap() {
    return {
        '현수막': '현수막 상세 포트폴리오',
        '배너': ' 배너 상세 포트폴리오',
        '카드뉴스': '카드뉴스 상세 포트폴리오',
        '전단지': ' 포스터 / 전단지 상세 포트폴리오',
        '포스터': ' 포스터 / 전단지 상세 포트폴리오',
        '메뉴판': '메뉴판 상세 포트폴리오',
        '블로그': '블로그 스킨 상세 포트폴리오',
        'PPT': 'PPT / 상세페이지 상세 포트폴리오',
        '상세페이지': 'PPT / 상세페이지 상세 포트폴리오',
    };
}
