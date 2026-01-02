/**
 * Page Transitions Module
 * 페이지 간 전환 애니메이션 처리
 * 
 * @module modules/page-transitions
 */

import { DebugLogger } from './debug-logger.js';
import { initializePage } from '../core/page-loader.js';

let currentPage = 'branches';
let isTransitioning = false;
let autoResetTimer = null;

export function initPageTransitions() {
    const pages = document.querySelectorAll('.page');
    // Ensure we select by ID to match HTML, even if checking class later
    const transition = document.getElementById('page-transition');
    const navItems = document.querySelectorAll('.page-nav .nav-item');

    // Robust selector check (Diagnosis A)
    if (transition && !transition.classList.contains('page-transition')) {
        console.warn('[PageTransitions] #page-transition missing class .page-transition. Fixing...');
        transition.classList.add('page-transition');
    }

    function transitionToPage(targetPage) {
        if (targetPage === currentPage) return;
        if (isTransitioning) {
            console.log('[PageTransitions] Transition blocked: already transitioning');
            return;
        }

        const targetElement = document.getElementById(`page-${targetPage}`);
        if (!targetElement) return;

        DebugLogger.log('TransitionStart', { from: currentPage, to: targetPage });
        isTransitioning = true;

        // Force Reflow / State Reset (Diagnosis C)
        transition.classList.remove('active');
        void transition.offsetWidth; // Force reflow

        // Trigger transition animation (Vertical blocks slide up)
        transition.classList.add('active');

        // Clear any previous safety resets
        if (autoResetTimer) clearTimeout(autoResetTimer);

        // Swap Content Timing
        // CSS Animation Duration: 1.4s + Max Delay 0.32s = ~1.72s
        // We swap at 850ms (Diagnosis B - slightly later than 800ms) to ensure full cover.
        setTimeout(() => {
            DebugLogger.log('TransitionSwap', { target: targetPage });

            // Note: JIT Initialization was moved to TransitionEnd to prevent stutter.
            // At this point, we only swap visibility.

            // Hide all pages
            pages.forEach(p => p.classList.remove('active'));

            // Show target page
            targetElement.classList.add('active');
            currentPage = targetPage;

            // Update nav
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelector(`[data-page="${targetPage}"]`)?.classList.add('active');
        }, 850);

        // Cleanup Timing (Diagnosis B)
        // Must wait until CSS animation finishes (> 1.72s).
        // Set to 1800ms for safety.
        setTimeout(() => {
            DebugLogger.log('TransitionEnd');
            transition.classList.remove('active');
            isTransitioning = false;

            // Delayed Initialization: Run heavy JS only after visual transition finishes (Diagnosis C/E)
            // This ensures the transition animation is buttery smooth.
            initializePage(targetPage);
        }, 1800);

        // Safety fallback in case something goes wrong
        autoResetTimer = setTimeout(() => {
            if (isTransitioning) {
                console.warn('[PageTransitions] Safety reset triggered');
                transition.classList.remove('active');
                isTransitioning = false;
            }
        }, 3000);
    }

    // Button click handlers
    document.querySelectorAll('.page-transition-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            transitionToPage(target);
        });
    });

    // Nav click handlers
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.page;
            transitionToPage(target);
        });
    });

    // Expose for other uses
    window.transitionToPage = transitionToPage;
    window.getCurrentPage = () => currentPage;
}

export function getCurrentPage() {
    return currentPage;
}
