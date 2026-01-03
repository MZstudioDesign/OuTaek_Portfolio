/**
 * Roots Page (Presentation Layer)
 * 
 * Clean Architecture:
 * - Orchestrates Data Loading (roots-data.js)
 * - Calculates Layout (mindmap-layout.js)
 * - Renders View (modal-renderer.js, beliefs-renderer.js)
 * - Handles User Interaction
 */

import { initCanvasInteraction, zoomToCoordinates, setSkipAutoFit } from '../modules/canvas-interaction.js';
import { loadPortfolioData } from '../modules/roots-data.js';
import { rootsStructure } from '../modules/roots-structure.js';
import { calculateMindmapLayout } from '../modules/mindmap-layout.js';
import { renderBeliefsContent } from '../modules/beliefs-renderer.js';
import {
    renderGalleryView,
    renderStandardLayout,
    getDetailedMap,
    initImageLightbox
} from '../modules/modal-renderer.js';

export async function initRootsPage() {
    console.log('[Roots Page] Initializing...');

    // 1. Initialize Interaction (Zoom/Pan)
    initCanvasInteraction();

    // 1.5 Initialize Image Lightbox
    initImageLightbox();

    // 2. Load Data
    const portfolioData = await loadPortfolioData();
    window.portfolioData = portfolioData; // Store for gallery back-navigation

    // 3. Prepare Data Map for quick lookup
    const dataMap = createDataMap(portfolioData);

    // 4. Calculate Layout positions
    const { nodes, links } = calculateMindmapLayout(rootsStructure, {
        radiusStep: 450,
        startAngle: 0,
        endAngle: 360
    });

    // 5. Render Mindmap
    renderMindmap(nodes, links, dataMap, portfolioData.detailedPortfolios || {});

    // 6. Init Modal Events
    initModalEvents(dataMap);

    // 7. Initial Zoom to \"My Beliefs\" - 처음부터 가운데에서 시작 (애니메이션 없음)
    const beliefsNode = nodes.find(n => n.data.name === '나의 신념' || n.data.name === 'My Beliefs');
    if (beliefsNode) {
        // Prevent auto fitToView from overriding our zoom
        setSkipAutoFit(true);
        // 애니메이션 없이 즉시 위치 설정 (animated=false)
        zoomToCoordinates(beliefsNode.x, beliefsNode.y, 1.2, false);
    }
}

// ===========================
// Data Helpers
// ===========================
function createDataMap(portfolioData) {
    const map = new Map();

    const addItems = (items) => {
        if (!items) return;
        items.forEach(item => {
            if (item.title) {
                map.set(item.title.trim(), item);
            }
        });
    };

    addItems(portfolioData.roots);
    addItems(portfolioData.stem);
    addItems(portfolioData.career);

    // CRITICAL FIX: Register Category Name itself so findItem("PPT...") succeeds
    const registerCategory = (key, items) => {
        addItems(items); // Register children items
        // Register the Category Key itself as a valid item
        map.set(key.trim(), {
            title: key,
            type: 'category',
            items: items // Attach items for easy access
        });
    };

    // 1. Process Root Level Arrays (The main detailed portfolios)
    const reserved = ['branches', 'stem', 'career', 'roots', 'beliefs', 'detailedPortfolios', 'rootsStructure'];
    Object.keys(portfolioData).forEach(key => {
        if (!reserved.includes(key) && Array.isArray(portfolioData[key])) {
            registerCategory(key, portfolioData[key]);
        }
    });

    // 2. Process Nested Arrays (Legacy/Fallback)
    if (portfolioData.detailedPortfolios) {
        Object.entries(portfolioData.detailedPortfolios).forEach(([key, items]) => {
            registerCategory(key, items);
        });
    }

    return map;
}

function findItem(name, map) {
    // Exact match first
    if (map.has(name)) return map.get(name);

    // Normalized exact match (trim whitespace)
    const normalizedName = name.trim().toLowerCase();
    for (const [key, val] of map) {
        if (key.trim().toLowerCase() === normalizedName) return val;
    }

    // No fuzzy matching - return null if no exact match
    return null;
}

// ===========================
// Mindmap Renderer (Optimized)
// ===========================
function renderMindmap(nodes, links, dataMap, detailedPortfolios = {}) {
    const target = document.querySelector('.canvas-content');
    if (!target) return;

    target.innerHTML = '';

    // Use DocumentFragment to batch DOM insertions (prevents reflow)
    const fragment = document.createDocumentFragment();

    // SVG Connections
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add('connections-layer');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;';

    links.forEach(link => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", `M ${link.source.x} ${link.source.y} L ${link.target.x} ${link.target.y}`);
        path.classList.add('connection-line');
        path.style.stroke = 'rgba(255,255,255,0.2)';
        path.style.strokeWidth = '1px';
        svg.appendChild(path);
    });
    fragment.appendChild(svg);

    // Store node-to-item mapping for event delegation
    const nodeItemMap = new Map();

    // DOM Nodes - append to fragment, not target
    nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = `canvas-node depth-${node.depth}`;
        if (node.depth === 0) el.classList.add('root-center');

        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;

        const item = findItem(node.data.name, dataMap);

        let innerHTML = '';

        // 1. Check for Direct Images
        let previewImg = null;
        if (item && item.images && item.images.length > 0) {
            previewImg = item.images[0].url || item.images[0];
        }
        // 2. Check for Category Items (Use first item's image as preview)
        else if (item && item.items && item.items.length > 0) {
            const firstItem = item.items[0];
            if (firstItem.images && firstItem.images.length > 0) {
                previewImg = firstItem.images[0].url || firstItem.images[0];
            }
        }

        if (previewImg) {
            innerHTML = `
                <div class="node-preview">
                    <img src="${previewImg}" alt="${node.data.name}" loading="lazy" decoding="async">
                </div>
                <div class="node-label has-image">${node.data.name}</div>
            `;
            el.dataset.hasImage = "true";
            if (item.id) el.dataset.itemId = item.id;
            el.dataset.nodeName = node.data.name;
            nodeItemMap.set(node.data.name, item);
        } else {
            innerHTML = `
                <div class="node-point"></div>
                <div class="node-label">${node.data.name}</div>
            `;
            el.dataset.nodeName = node.data.name;
        }
        el.innerHTML = innerHTML;

        fragment.appendChild(el);
    });

    // Single DOM insertion (1 reflow instead of 300+)
    target.appendChild(fragment);

    // Event Delegation: Single listener on parent instead of 300+ on nodes
    target.addEventListener('click', (e) => {
        const nodeEl = e.target.closest('.canvas-node');
        if (!nodeEl) return;

        const nodeName = nodeEl.dataset.nodeName;
        const item = nodeItemMap.get(nodeName) || findItem(nodeName, dataMap);

        // Allow if it has images, content, OR is a Category with items
        if (!item || (!item.images?.length && !item.richContent?.length && !item.content?.length && !item.items?.length)) {
            console.log('[Roots] Empty node clicked:', nodeName);
            return;
        }
        openModal(item);
    }, { once: false });
}

// ===========================
// Modal Logic
// ===========================
function initModalEvents(dataMap) {
    const modal = document.getElementById('page-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
    const toasts = modal.querySelector('.link-toast-container');
    if (toasts) toasts.remove();
}

function openModal(item) {
    const modal = document.getElementById('page-modal');
    if (!modal) return;

    modal.querySelector('.modal-title').textContent = item.title;

    // 1. Special Layout: My Beliefs
    if (item.title === '나의 신념' || item.title === 'My Beliefs') {
        renderBeliefsContent(modal, item);
        modal.classList.add('active');
        initCloseEvents(modal);
        return;
    }

    // 2. Detailed Portfolio Gallery
    let detailedItems = [];

    if (item.title.includes('상세 포트폴리오')) {
        const title = item.title.trim();

        // 1. Try finding in detailedPortfolios (Nested)
        if (window.portfolioData?.detailedPortfolios) {
            const nestedKey = Object.keys(window.portfolioData.detailedPortfolios)
                .find(k => k.trim() === title);
            if (nestedKey) detailedItems = window.portfolioData.detailedPortfolios[nestedKey];
        }

        // 2. Try finding in ROOT (This is where they actually are!)
        if (!detailedItems.length && window.portfolioData) {
            const rootKey = Object.keys(window.portfolioData)
                .find(k => k.trim() === title);
            if (rootKey) {
                console.log(`[Modal] Found data in ROOT: "${rootKey}"`);
                detailedItems = window.portfolioData[rootKey];
            }
        }
    }

    if (detailedItems.length > 0) {
        renderGalleryView(modal, detailedItems, item);
        modal.classList.add('active');
        initCloseEvents(modal);
        return;
    }

    // 3. Standard Layout
    renderStandardLayout(modal, item);
    modal.classList.add('active');
    initCloseEvents(modal);
}

function initCloseEvents(modal) {
    const onClose = () => {
        modal.classList.remove('active');
        const toasts = modal.querySelector('.link-toast-container');
        if (toasts) toasts.remove();
        document.removeEventListener('keydown', onEsc);
        modal.removeEventListener('click', onOverlay);
    };

    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    const onOverlay = (e) => { if (e.target === modal) onClose(); };

    document.addEventListener('keydown', onEsc);
    modal.addEventListener('click', onOverlay);

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.onclick = onClose;
}
