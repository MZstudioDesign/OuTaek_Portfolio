/**
 * Intro Loader Module
 * 로딩 화면 애니메이션 및 카운터 제어
 * 
 * @module modules/intro
 */

import { preloadJsonData, preloadRemainingData } from './data-preloader.js';
import { DebugLogger } from './debug-logger.js';

export function initIntro() {
    const intro = document.getElementById('intro-loader');
    const counter = document.querySelector('.counter-number');
    const pageNav = document.getElementById('page-nav');
    const particlesContainer = document.getElementById('intro-particles');

    // Create floating particles
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'intro-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `-${Math.random() * 8}s`;
            particle.style.animationDuration = `${6 + Math.random() * 4}s`;
            particlesContainer.appendChild(particle);
        }
    }

    let progress = 0;
    const duration = 3000;
    const startTime = Date.now();
    let currentDisplay = 0;

    // Wait for fonts before starting counter loop to ensure smooth text reveal (Diagnosis D)
    document.fonts.ready.then(() => {
        DebugLogger.log('IntroStart');
        requestAnimationFrame(updateCounter);
    });

    // Defer heavy data loading to avoid blocking "LOADING" text animation (Diagnosis D)
    // The text reveal happens 0.2s - 0.8s. We start loading after 1.2s to be safe.
    setTimeout(() => {
        DebugLogger.log('PreloadStart');

        // Use requestIdleCallback if available, otherwise just run
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                preloadJsonData().then(() => DebugLogger.log('PreloadComplete'));
            });
        } else {
            preloadJsonData().then(() => DebugLogger.log('PreloadComplete'));
        }
    }, 1200);

    function updateCounter() {
        const elapsed = Date.now() - startTime;
        progress = Math.min((elapsed / duration) * 100, 100);

        // Optimization: Only touch DOM if value actually changed
        const nextDisplay = Math.floor(progress);
        if (counter && nextDisplay !== currentDisplay) {
            counter.textContent = nextDisplay;
            currentDisplay = nextDisplay;
        }

        if (progress < 100) {
            requestAnimationFrame(updateCounter);
        } else {
            // Start transition animation
            intro.classList.add('transitioning');
            DebugLogger.log('IntroTransitioning');

            // Defer heavy remaining data normalization to avoid jank during the wipe animation (Diagnosis D)
            // The wipe animation is critical right now. We do this when idle or after a delay.
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => {
                    preloadRemainingData();
                }, { timeout: 2000 });
            } else {
                setTimeout(() => {
                    preloadRemainingData();
                }, 1000);
            }

            // While screen is covered, hide content behind wipe
            setTimeout(() => {
                intro.classList.add('revealing');
            }, 900);

            // Wait for transition to complete, then hide intro
            setTimeout(() => {
                intro.classList.add('hidden');
                if (pageNav) pageNav.classList.add('visible');
                // Show shooting stars after intro completes
                document.body.classList.add('intro-complete');

                // 🚀 Dispatch event for deferred page initialization
                DebugLogger.log('IntroComplete');
                window.dispatchEvent(new CustomEvent('introComplete'));
            }, 1800);
        }
    }
}

