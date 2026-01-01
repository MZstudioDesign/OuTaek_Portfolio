/**
 * ========================================
 * App Bootstrap - Application Entry Point
 * ========================================
 * 
 * Architecture Note
 * -----------------
 * - This project uses a lightweight SPA architecture
 * - No framework (React/Vue/Angular) is used intentionally
 * - All modules export init() functions for controlled execution
 * - This file is the single source of truth for initialization order
 * 
 * Initialization Order:
 * 1. Global modules (always run once on DOMContentLoaded)
 * 2. Page-specific modules (run based on active page)
 * 
 * Module Execution Rules:
 * - Global modules: Run once, never re-run on page transition
 * - Page modules: Run once per page, tracked to prevent duplicates
 * 
 * @module core/app
 */

// Global Modules (run once)
import { initIntro } from '../modules/intro.js';
import { initCursor } from '../modules/cursor.js';
import { initStarField } from '../modules/star-field.js';
import { initPageTransitions } from '../modules/page-transitions.js';
import { initNavigation } from '../modules/navigation.js';

// Page Loader
import { initializeAllPages } from './page-loader.js';

/**
 * Bootstrap the entire application
 * Called once on DOMContentLoaded
 */
export function bootstrapApp() {
    console.log('[App] Bootstrapping...');

    // ===========================
    // 1. Global Modules
    // These run once and apply to the entire app
    // ===========================
    initIntro();
    initCursor();
    initStarField();
    initPageTransitions();
    initNavigation();

    // ===========================
    // 2. Page-Specific Modules
    // Each page initializes its own modules
    // ===========================
    initializeAllPages();

    console.log('[App] Bootstrap complete');
}

/**
 * Application entry point
 */
document.addEventListener('DOMContentLoaded', bootstrapApp);
