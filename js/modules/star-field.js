/**
 * Star Field Module
 * 인터랙티브 별 필드 캔버스 애니메이션
 * 
 * @module modules/star-field
 */

export function initStarField() {
    const canvas = document.getElementById('star-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let stars = [];
    let mouseX = -1000, mouseY = -1000;

    const STAR_COUNT = 400;
    const BASE_SPEED = 0.05;
    const MOUSE_RADIUS = 200;

    class Star {
        constructor() {
            this.reset(true);
        }

        reset(randomY = false) {
            this.x = Math.random() * width;
            this.y = randomY ? Math.random() * height : height + 10;
            this.size = Math.random() * 1.5 + 0.5;
            this.baseAlpha = Math.random() * 0.5 + 0.1;

            const cx = width / 2;
            const cy = height * 2;

            this.angle = Math.atan2(this.y - cy, this.x - cx);
            this.radius = Math.sqrt(Math.pow(this.x - cx, 2) + Math.pow(this.y - cy, 2));
            this.speed = (Math.random() * 0.0002 + 0.00005) * (this.size * 0.5);

            this.currentSize = this.size;
            this.currentAlpha = this.baseAlpha;
        }

        update() {
            this.angle += this.speed;

            const cx = width / 2;
            const cy = height * 2;

            this.x = cx + Math.cos(this.angle) * this.radius;
            this.y = cy + Math.sin(this.angle) * this.radius;

            const mdx = mouseX - this.x;
            const mdy = mouseY - this.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (mdist < MOUSE_RADIUS) {
                const interactFactor = 1 - (mdist / MOUSE_RADIUS);
                const targetSize = this.size * (1 + interactFactor * 0.8);
                const targetAlpha = Math.min(0.8, this.baseAlpha + interactFactor * 0.3);
                this.currentSize += (targetSize - this.currentSize) * 0.1;
                this.currentAlpha += (targetAlpha - this.currentAlpha) * 0.1;
            } else {
                this.currentSize += (this.size - this.currentSize) * 0.1;
                this.currentAlpha += (this.baseAlpha - this.currentAlpha) * 0.1;
            }

            const buffer = 100;
            if (this.x > width + buffer) {
                const targetX = -buffer;
                const cosA = (targetX - cx) / this.radius;
                if (cosA >= -1 && cosA <= 1) {
                    this.angle = -Math.acos(cosA);
                    this.x = cx + Math.cos(this.angle) * this.radius;
                    this.y = cy + Math.sin(this.angle) * this.radius;
                } else {
                    this.reset();
                    this.x = -buffer;
                    this.angle = Math.atan2(this.y - cy, this.x - cx);
                }
            } else if (this.y > height + buffer) {
                this.reset();
            }
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.currentAlpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        resize();
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }
        animate();
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        const branchesActive = document.getElementById('page-branches')?.classList.contains('active');
        const stemActive = document.getElementById('page-stem')?.classList.contains('active');

        if (branchesActive || stemActive) {
            stars.forEach(star => {
                star.update();
                star.draw();
            });
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    init();
}
