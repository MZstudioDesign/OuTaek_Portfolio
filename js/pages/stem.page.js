/**
 * Stem Page Module
 * 줄기(Stem) 페이지 전용 인터랙션
 * 
 * @module pages/stem.page
 */

import { initCareerSlider } from '../modules/career-slider.js';
import { initRotatingText } from '../modules/rotating-text.js';
import { loadPortfolioData } from '../modules/roots-data.js';

export async function initStemPage() {
    // 1. Load Notion data and update career section
    try {
        const data = await loadPortfolioData();
        if (data && data.career) {
            updateCareerContent(data.career);
        }
    } catch (e) {
        console.error('[Stem Page] Failed to load career data:', e);
    }

    // 2. Initialize career slider (after data update)
    initCareerSlider();

    // 3. Initialize rotating text
    initRotatingText();

    // 4. Initialize scroll reveal for about points
    initScrollReveal();

    // 5. Initialize mobile career UI (header, arrows)
    if (window.innerWidth <= 768) {
        // Delay to ensure cards are rendered in DOM
        setTimeout(() => initMobileCareerUI(), 150);
    }

    console.log('[Stem Page] Initialized');
}

/**
 * Initialize mobile-specific UI for career section
 */
function initMobileCareerUI() {
    const careerRightArea = document.querySelector('.career-right-area');
    const careerSection = document.getElementById('career-section');
    if (!careerRightArea || !careerSection) return;

    const cards = document.querySelectorAll('.career-card');
    if (cards.length === 0) return;

    let currentIndex = 0;
    let autoScrollInterval = null;
    let pauseTimeout = null;
    let swipeHintShown = false;

    // Create swipe hint overlay
    const swipeHint = document.createElement('div');
    swipeHint.className = 'mobile-swipe-hint';
    swipeHint.innerHTML = `
        <div class="swipe-hint-content">
            <span class="swipe-hint-arrow">›</span>
            <span class="swipe-hint-arrow">›</span>
            <span class="swipe-hint-arrow">›</span>
        </div>
        <div class="swipe-hint-text">스와이프하여 넘기기</div>
    `;
    careerSection.appendChild(swipeHint);

    // Auto-scroll function
    function scrollToNext() {
        currentIndex = (currentIndex + 1) % cards.length;
        const targetCard = cards[currentIndex];
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
    }

    // Start auto-scroll
    function startAutoScroll() {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(scrollToNext, 1000);
    }

    // Pause auto-scroll for 5 seconds on user interaction
    function pauseAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
        if (pauseTimeout) clearTimeout(pauseTimeout);
        pauseTimeout = setTimeout(startAutoScroll, 5000);

        // Hide swipe hint on user interaction
        swipeHint.classList.remove('visible');
    }

    // Show swipe hint once when entering career section
    function showSwipeHint() {
        if (swipeHintShown) return;
        swipeHintShown = true;

        swipeHint.classList.add('visible');

        // Hide after 2.5 seconds
        setTimeout(() => {
            swipeHint.classList.remove('visible');
        }, 2500);
    }

    // Listen for user scroll/touch on career area
    careerRightArea.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    careerRightArea.addEventListener('scroll', () => {
        // Update current index based on scroll position
        const scrollLeft = careerRightArea.scrollLeft;
        const cardWidth = window.innerWidth;
        currentIndex = Math.round(scrollLeft / cardWidth);
    }, { passive: true });

    // Start auto-scroll when career section is visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                startAutoScroll();
                showSwipeHint(); // Show hint when section becomes visible
            } else {
                if (autoScrollInterval) {
                    clearInterval(autoScrollInterval);
                    autoScrollInterval = null;
                }
            }
        });
    }, { threshold: [0.3] });

    observer.observe(careerSection);
}

/**
 * Update career section with data from Notion
 * @param {Array} items - career items from portfolio.json
 */
function updateCareerContent(items) {
    // Sort items by number prefix in title
    const sortedItems = [...items].sort((a, b) => {
        const numA = parseInt(a.title.match(/^(\d+)/)?.[1] || '99', 10);
        const numB = parseInt(b.title.match(/^(\d+)/)?.[1] || '99', 10);
        return numA - numB;
    });

    // Parse each item to extract period, role, description
    const parsedItems = sortedItems.map(item => {
        const content = item.content || [];
        let period = '';
        let role = '';
        let description = '';

        // Extract from content array
        for (const block of content) {
            // Period pattern: 2024.07 – 2024.12 or 2023 – 2024 or Present (handles leading newline)
            // Supports both YYYY.MM and YYYY formats
            const periodMatch = block.match(/\s*(\d{4}(?:\.\d{2})?\s*[–-]\s*(?:\d{4}(?:\.\d{2})?|현재|Present))/i);
            if (periodMatch) period = periodMatch[1].trim();

            // Role from "좌하단 제목 : ..." pattern
            const roleMatch = block.match(/좌하단 제목\s*:\s*(.+?)(?:\n|$)/);
            if (roleMatch) role = roleMatch[1].trim();

            // Description is the longest text block that's not a label
            if (!block.includes('좌하단') && block.length > 50) {
                description = block.trim();
            }
        }

        return {
            ...item,
            displayTitle: item.title.replace(/^\d+\s*/, ''),
            period,
            role,
            description,
            images: item.images || []
        };
    });

    // Update navigation list
    const navList = document.querySelector('.career-nav-list');
    if (navList) {
        navList.innerHTML = parsedItems.map((item, index) => {
            return `<div class="nav-item${index === 0 ? ' active' : ''}" data-index="${index}">${item.title}</div>`;
        }).join('');
    }

    // Update career cards - use scattered/floating layout for multiple images
    const scrollTrack = document.querySelector('.career-scroll-track');
    if (scrollTrack) {
        scrollTrack.innerHTML = parsedItems.map((item, index) => {
            let cardContent = '';

            // Multiple images: Scattered/Floating Layout
            if (item.images.length > 1) {
                const count = Math.min(item.images.length, 4); // Max 4 presets defined

                const imagesHtml = item.images.slice(0, 4).map((imgObj, idx) => `
                    <img src="${imgObj.url || imgObj}" 
                         alt="${item.displayTitle} ${idx + 1}" 
                         loading="lazy" 
                         class="scatter-item scatter-pos-${idx}">
                `).join('');

                cardContent = `
                    <div class="career-image-scatter">
                        ${imagesHtml}
                    </div>
                `;
            } else {
                // Single image or no image
                const hasImage = item.images.length > 0;
                // Handle object or string (fallback)
                const imgUrl = hasImage ? (item.images[0].url || item.images[0]) : '';

                cardContent = hasImage
                    ? `<div class="career-image-scatter">
                        <img src="${imgUrl}" class="scatter-item scatter-single" alt="${item.displayTitle}" loading="lazy">
                       </div>`
                    : `<span>${item.displayTitle}</span>`;
            }

            // Mobile info overlay (shown on mobile only via CSS)
            const mobileInfoHtml = `
                <div class="mobile-card-info">
                    <div class="mobile-card-number">${String(index + 1).padStart(2, '0')}</div>
                    <div class="mobile-card-title">${item.displayTitle}</div>
                    <div class="mobile-card-role">${item.role || ''}</div>
                    <div class="mobile-card-period">${item.period || ''}</div>
                    <div class="mobile-card-desc">${item.description || ''}</div>
                </div>
            `;

            // Large background number (mobile only via CSS)
            const bgNumberHtml = `<div class="mobile-bg-number">${String(index + 1).padStart(2, '0')}</div>`;

            return `<div class="career-card" data-title="${item.displayTitle}" data-role="${item.role}" data-period="${item.period}" data-desc="${item.description}">
                ${bgNumberHtml}
                <div class="card-inner">${cardContent}${mobileInfoHtml}</div>
            </div>`;
        }).join('');
    }

    // Update initial info
    const infoTitle = document.querySelector('.career-info-title');
    const infoRole = document.querySelector('.career-info-role');
    const infoPeriod = document.querySelector('.career-info-period');
    const infoDesc = document.querySelector('.career-info-desc');
    const bigNumber = document.querySelector('.career-big-number');

    if (parsedItems.length > 0) {
        const first = parsedItems[0];
        if (infoTitle) infoTitle.textContent = first.displayTitle;
        if (infoRole) infoRole.textContent = first.role || first.displayTitle;
        if (infoPeriod) infoPeriod.textContent = first.period || '';
        if (infoDesc) infoDesc.textContent = first.description || '';
        if (bigNumber) bigNumber.textContent = '01';
    }

    console.log(`[Stem Page] Updated career section with ${parsedItems.length} items from Notion.`);
}


function initScrollReveal() {
    const stemPage = document.getElementById('page-stem');
    if (!stemPage) return;

    const wrapper = stemPage.querySelector('.vertical-wrapper');
    const revealElements = stemPage.querySelectorAll('.point-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.3, root: wrapper });

    revealElements.forEach(el => observer.observe(el));
}
