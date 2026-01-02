/**
 * ========================================
 * Page Loader - Dynamic Page Loading
 * ========================================
 * 
 * Architecture Note
 * -----------------
 * - This project uses a lightweight SPA architecture
 * - Pages are dynamically loaded from /pages/*.html
 * - Shared UI components are injected from /components/*.html
 * - No framework (React/Vue) is used intentionally
 * - All pages are pre-rendered in index.html for SEO
 * - This loader handles page-specific JS initialization
 * 
 * Page Loading Strategy:
 * - HTML: Pre-rendered in index.html (no dynamic fetch)
 * - CSS: Loaded via main.css imports
 * - JS: Dynamically initialized based on active page
 * 
 * @module core/page-loader
 */

import { initBranchesPage } from '../pages/branches.page.js';
import { initStemPage } from '../pages/stem.page.js';
import { initRootsPage } from '../pages/roots.page.js';

/**
 * Page initialization registry
 * Maps page names to their initialization functions
 */
const pageInitializers = {
    branches: initBranchesPage,
    stem: initStemPage,
    roots: initRootsPage
};

/**
 * Tracks which pages have been initialized
 * Prevents duplicate initialization
 */
const initializedPages = new Set();

/**
 * Initialize a specific page's JavaScript
 * @param {string} pageName - Name of the page (branches, stem, roots)
 */
export function initializePage(pageName) {
    if (initializedPages.has(pageName)) {
        console.log(`[PageLoader] Page "${pageName}" already initialized`);
        return;
    }

    const initializer = pageInitializers[pageName];
    if (initializer) {
        initializer();
        initializedPages.add(pageName);
        console.log(`[PageLoader] Page "${pageName}" initialized`);
    } else {
        console.warn(`[PageLoader] No initializer found for page "${pageName}"`);
    }
}

/**
 * Initialize all pages with lazy loading
 * - Branches: Immediate (user sees this first)
 * - Stem/Roots: Deferred until browser is idle
 * 
 * This prevents animation frame drops during intro transition
 */
export function initializeAllPages() {
    // Priority 1: Branches (visible immediately)
    initializePage('branches');

    // Priority 2: Stem (deferred, but soon)
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => initializePage('stem'), { timeout: 1000 });
        requestIdleCallback(() => initializePage('roots'), { timeout: 2000 });
    } else {
        // Fallback for Safari
        setTimeout(() => initializePage('stem'), 500);
        setTimeout(() => initializePage('roots'), 1000);
    }
}

/**
 * Reset page initialization state
 * Useful for hot-reloading during development
 */
export function resetPageInitialization() {
    initializedPages.clear();
}
