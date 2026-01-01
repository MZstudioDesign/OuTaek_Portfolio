/**
 * Roots Data Module
 * Manages loading and accessing portfolio data for the Roots page
 * 
 * Uses shared data-preloader for efficient background loading.
 * 
 * @module modules/roots-data
 */

import { getPortfolioData, isDataReady } from './data-preloader.js';

/**
 * Load portfolio data (uses preloader if already loaded)
 */
export async function loadPortfolioData() {
    return await getPortfolioData();
}

export function getRootItems() {
    if (!isDataReady()) return [];
    return window.portfolioData?.roots || [];
}

export function getItemById(id) {
    if (!window.portfolioData) return null;

    // Search roots
    let item = (window.portfolioData.roots || []).find(i => i.id === id);
    if (item) return item;

    // Search branches
    item = (window.portfolioData.branches || []).find(i => i.id === id);
    if (item) return item;

    // Search stem/career
    item = (window.portfolioData.stem || []).find(i => i.id === id);
    if (item) return item;

    item = (window.portfolioData.career || []).find(i => i.id === id);
    return item;
}
