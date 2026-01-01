/**
 * Intro Loader Module
 * 로딩 화면 애니메이션 및 카운터 제어
 * 
 * @module modules/intro
 */

import { preloadJsonData, preloadRemainingData } from './data-preloader.js';

export function initIntro() {
    const intro = document.getElementById('intro-loader');
    const counter = document.querySelector('.counter-number');
    const pageNav = document.getElementById('page-nav');
    const particlesContainer = document.getElementById('intro-particles');

    // Start JSON fetch immediately (runs in parallel with intro animation)
    preloadJsonData();

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

    function updateCounter() {
        const elapsed = Date.now() - startTime;
        progress = Math.min((elapsed / duration) * 100, 100);

        if (counter) {
            counter.textContent = Math.floor(progress);
        }

        if (progress < 100) {
            requestAnimationFrame(updateCounter);
        } else {
            // Start transition animation
            intro.classList.add('transitioning');

            // Preload remaining data in background while transition plays
            preloadRemainingData();

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
            }, 1800);
        }
    }

    updateCounter();
}

