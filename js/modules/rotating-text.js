/**
 * Rotating Text Module
 * 3D 플립 텍스트 애니메이션 및 조사 자동 처리
 * 
 * @module modules/rotating-text
 */

export function initRotatingText() {
    const wrapper = document.querySelector('.rotating-text-wrapper');
    const items = document.querySelectorAll('.rotate-item');
    const particleText = document.querySelector('.particle-text');

    if (!wrapper || !items.length) return;

    let currentIndex = 0;
    const intervalTime = 2000;

    // Korean Particle Logic (을/를)
    function getParticle(word) {
        if (!word) return '';
        const lastChar = word.charCodeAt(word.length - 1);
        const hasBatchim = (lastChar - 0xAC00) % 28 > 0;
        return hasBatchim ? '을' : '를';
    }

    function updateWidthAndParticle() {
        const activeItem = items[currentIndex];
        if (!activeItem) return;

        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.style.font = getComputedStyle(activeItem).font;
        tempSpan.style.letterSpacing = getComputedStyle(activeItem).letterSpacing;
        tempSpan.style.fontWeight = getComputedStyle(activeItem).fontWeight;
        tempSpan.style.fontSize = getComputedStyle(activeItem).fontSize;
        tempSpan.style.fontFamily = getComputedStyle(activeItem).fontFamily;
        tempSpan.innerText = activeItem.innerText;
        document.body.appendChild(tempSpan);

        const width = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);

        if (width > 10) {
            wrapper.style.width = (width + 2) + 'px';
        }

        const word = activeItem.dataset.word;
        if (particleText && word) {
            particleText.textContent = getParticle(word) + ' ';  // Add space after particle
        }
    }

    function cycle() {
        const prevIndex = currentIndex;
        currentIndex = (currentIndex + 1) % items.length;

        const prevItem = items[prevIndex];
        const nextItem = items[currentIndex];

        prevItem.classList.remove('active');
        prevItem.classList.add('exit');
        nextItem.classList.remove('exit');
        nextItem.classList.add('active');

        updateWidthAndParticle();

        setTimeout(() => {
            prevItem.classList.remove('exit');
        }, 500);
    }

    setTimeout(updateWidthAndParticle, 100);

    const stemPage = document.getElementById('page-stem');
    if (stemPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    setTimeout(updateWidthAndParticle, 50);
                }
            });
        });
        observer.observe(stemPage, { attributes: true, attributeFilter: ['class'] });
    }

    setInterval(cycle, intervalTime);
}
