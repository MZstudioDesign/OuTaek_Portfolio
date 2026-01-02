/**
 * Custom Cursor Module
 * 커스텀 마우스 커서 및 호버 효과
 * 
 * @module modules/cursor
 */

export function initCursor() {
    // Disable on touch devices or small screens
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth <= 1024) {
        return;
    }

    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(animate);
    }
    animate();

    // Hover states
    document.querySelectorAll('a, button, .work-panel, .canvas-node').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
            follower.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            follower.classList.remove('active');
        });
    });

    document.querySelectorAll('.page-transition-btn').forEach(el => {
        el.addEventListener('mouseenter', () => {
            follower.classList.add('button');
        });
        el.addEventListener('mouseleave', () => {
            follower.classList.remove('button');
        });
    });
}
