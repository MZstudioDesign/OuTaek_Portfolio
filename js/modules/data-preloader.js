/**
 * Data Preloader Module
 * 
 * Implements priority-based background loading:
 * - Branches data loads immediately (shown first)
 * - Stem/Roots/Career load in background while user views Branches
 */

let rawData = null;
let portfolioData = null;
let isFullyLoaded = false;

// Normalization helper
function normalizeItems(items) {
    if (!items) return [];
    return items.map(item => {
        const newItem = { ...item };

        // Ensure images is an array of objects and force .webp extension
        if (Array.isArray(newItem.images) && newItem.images.length > 0) {
            newItem.images = newItem.images.map(img => {
                const url = typeof img === 'string' ? img : img.url;
                // Force .webp extension for local portfolio images (BUT keep GIFs)
                if (url.includes('assets/images/portfolio/')) {
                    return { url: url.replace(/\.(png|jpg|jpeg)$/i, '.webp') };
                }
                return { url };
            });
        }

        // Also fix the primary imageUrl if it exists
        if (newItem.imageUrl && newItem.imageUrl.includes('assets/images/portfolio/')) {
            newItem.imageUrl = newItem.imageUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        }

        if (Array.isArray(newItem.content) && !newItem.rawTexts) {
            newItem.rawTexts = newItem.content;
        }
        return newItem;
    });
}

/**
 * Preload JSON data (called early during intro)
 */
export async function preloadJsonData() {
    if (rawData) return rawData;

    try {
        console.log('[Preloader] Fetching portfolio.json...');
        const response = await fetch(`data/portfolio.json?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        rawData = await response.json();
        console.log('[Preloader] JSON loaded');
        return rawData;
    } catch (error) {
        console.error('[Preloader] Failed to load JSON:', error);
        return null;
    }
}

/**
 * Get Branches data immediately (priority)
 */
export function getBranchesData() {
    if (!rawData) return [];
    return normalizeItems(rawData.branches);
}

/**
 * Get Career data (for Stem page)
 */
export function getCareerData() {
    if (!rawData) return [];
    return normalizeItems(rawData.career);
}

/**
 * Preload and normalize all remaining data in background
 */
export async function preloadRemainingData() {
    if (isFullyLoaded) return portfolioData;
    if (!rawData) await preloadJsonData();

    console.log('[Preloader] Normalizing all data in background...');

    portfolioData = {
        ...rawData,
        roots: normalizeItems(rawData.roots),
        branches: normalizeItems(rawData.branches),
        stem: normalizeItems(rawData.stem),
        career: normalizeItems(rawData.career),
    };

    if (rawData.detailedPortfolios) {
        portfolioData.detailedPortfolios = {};
        Object.keys(rawData.detailedPortfolios).forEach(key => {
            portfolioData.detailedPortfolios[key] = normalizeItems(rawData.detailedPortfolios[key]);
        });
    }

    isFullyLoaded = true;
    window.portfolioData = portfolioData; // Store globally for modal access
    console.log('[Preloader] All data normalized and ready');
    return portfolioData;
}

/**
 * Get full portfolio data (waits if not ready)
 */
export async function getPortfolioData() {
    if (isFullyLoaded) return portfolioData;
    return await preloadRemainingData();
}

/**
 * Check if data is fully loaded
 */
export function isDataReady() {
    return isFullyLoaded;
}
