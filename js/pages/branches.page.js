/**
 * Branches Page Module
 * 가지(Branches) 페이지 전용 인터랙션
 * 
 * @module pages/branches.page
 */

import { initHorizontalScroll } from '../modules/horizontal-scroll.js';
import { loadPortfolioData } from '../modules/roots-data.js';

export async function initBranchesPage() {
    // 1. Data Load
    try {
        const data = await loadPortfolioData();
        if (data && data.branches) {
            updateBranchesContent(data.branches);
        }
    } catch (e) {
        console.error('[Branches Page] Failed to load data:', e);
    }

    // 2. Initialize Interaction (Horizontal Scroll)
    initHorizontalScroll();

    console.log('[Branches Page] Initialized');
}

/**
 * Update work panels with data from Notion
 * @param {Array} items - branches items from portfolio.json
 */
function updateBranchesContent(items) {
    const panels = document.querySelectorAll('.work-panel');

    // Sort items by the number prefix in title (e.g., "01 편집 디자인" -> 01)
    const sortedItems = [...items].sort((a, b) => {
        const numA = parseInt(a.title.match(/^(\d+)/)?.[1] || '99', 10);
        const numB = parseInt(b.title.match(/^(\d+)/)?.[1] || '99', 10);
        return numA - numB;
    });

    // Match panels by index (01 = first item, 02 = second, etc.)
    panels.forEach((panel, index) => {
        const item = sortedItems[index];
        if (!item) return;

        // Update image
        const imageFrame = panel.querySelector('.image-frame');
        if (imageFrame && item.imageUrl) {
            imageFrame.innerHTML = '';
            const img = document.createElement('img');
            img.src = item.imageUrl; // Direct URL string
            img.alt = item.title || '';
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            imageFrame.appendChild(img);
        }

        // Update title (strip number prefix like "01 " from display)
        const titleEl = panel.querySelector('.work-title');
        if (titleEl && item.title) {
            // Remove leading number and space (e.g., "01 편집 디자인" -> "편집 디자인")
            const displayTitle = item.title.replace(/^\d+\s*/, '');
            titleEl.textContent = displayTitle;
        }

        // Update description
        const descEl = panel.querySelector('.work-desc');
        if (descEl && item.description) {
            descEl.textContent = item.description;
        }
    });

    console.log(`[Branches Page] Updated ${Math.min(panels.length, items.length)} panels with Notion data.`);
}
