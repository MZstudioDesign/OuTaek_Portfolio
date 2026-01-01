/**
 * Navigation Module
 * 키보드 네비게이션 단축키 처리 + 모바일 네비게이션
 * 
 * @module modules/navigation
 */

export function initNavigation() {
    // Keyboard shortcuts for page navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === '1') {
            window.transitionToPage?.('branches');
        } else if (e.key === '2') {
            window.transitionToPage?.('stem');
        } else if (e.key === '3') {
            window.transitionToPage?.('roots');
        }
    });

    // Mobile Navigation
    initMobileNav();
}

function initMobileNav() {
    const mobileNavBtn = document.getElementById('mobile-nav-btn');
    const mobileNavPopup = document.getElementById('mobile-nav-popup');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (!mobileNavBtn || !mobileNavPopup) return;

    // Open popup
    mobileNavBtn.addEventListener('click', () => {
        mobileNavPopup.classList.add('active');
    });

    // Close popup
    const closePopup = () => {
        mobileNavPopup.classList.remove('active');
    };

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closePopup);
    }

    // Close on backdrop click
    mobileNavPopup.addEventListener('click', (e) => {
        if (e.target === mobileNavPopup) {
            closePopup();
        }
    });

    // Page navigation links
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            const page = link.dataset.page;
            closePopup();
            if (window.transitionToPage) {
                window.transitionToPage(page);
            }
        });
    });

    // Update active state when page changes
    const updateActiveLink = () => {
        const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
        mobileNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === activePage);
        });
    };

    // Observe page changes
    const observer = new MutationObserver(updateActiveLink);
    document.querySelectorAll('.page').forEach(page => {
        observer.observe(page, { attributes: true, attributeFilter: ['class'] });
    });

    // Initial update
    updateActiveLink();
}

