/**
 * Page Transitions Module
 * 페이지 간 전환 애니메이션 처리
 * 
 * @module modules/page-transitions
 */

let currentPage = 'branches';


export function initPageTransitions() {
    const pages = document.querySelectorAll('.page');
    const transition = document.getElementById('page-transition');
    const navItems = document.querySelectorAll('.page-nav .nav-item');

    function transitionToPage(targetPage) {
        if (targetPage === currentPage) return;

        const targetElement = document.getElementById(`page-${targetPage}`);
        if (!targetElement) return;

        // Trigger transition animation
        transition.classList.add('active');

        setTimeout(() => {
            // Hide all pages
            pages.forEach(p => p.classList.remove('active'));

            // Show target page
            targetElement.classList.add('active');
            currentPage = targetPage;

            // Update nav
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelector(`[data-page="${targetPage}"]`)?.classList.add('active');
        }, 700);

        setTimeout(() => {
            transition.classList.remove('active');
        }, 1600);
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
}

export function getCurrentPage() {
    return currentPage;
}
