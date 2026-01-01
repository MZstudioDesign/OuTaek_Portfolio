/**
 * Career Slider Module
 * 경력 섹션 슬라이드 네비게이션
 * 
 * @module modules/career-slider
 */

export function initCareerSlider() {
    const careerSection = document.getElementById('career-section');
    if (!careerSection) return;

    const navItems = careerSection.querySelectorAll('.career-nav-list .nav-item');
    const cards = careerSection.querySelectorAll('.career-card');
    const scrollTrack = careerSection.querySelector('.career-scroll-track');
    const bigNumber = careerSection.querySelector('.career-big-number');
    const infoTitle = careerSection.querySelector('.career-info-title');
    const infoRole = careerSection.querySelector('.career-info-role');
    const infoPeriod = careerSection.querySelector('.career-info-period');
    const infoDesc = careerSection.querySelector('.career-info-desc');

    if (!scrollTrack || cards.length === 0) return;

    const careerData = Array.from(cards).map((card, index) => ({
        number: String(index + 1).padStart(2, '0'),
        title: card.dataset.title || '',
        role: card.dataset.role || '',
        period: card.dataset.period || '',
        desc: card.dataset.desc || ''
    }));

    let currentIndex = 0;

    function updateCareer(index) {
        if (index === currentIndex) return;
        currentIndex = index;

        navItems.forEach((item, i) => {
            item.classList.toggle('active', i === currentIndex);
        });

        if (bigNumber) {
            bigNumber.style.transition = 'opacity 0.3s ease';
            bigNumber.style.opacity = '0';
            setTimeout(() => {
                bigNumber.textContent = careerData[currentIndex].number;
                bigNumber.style.opacity = '1';
            }, 150);
        }

        // Update all info elements
        const fadeOut = [infoTitle, infoRole, infoPeriod, infoDesc].filter(Boolean);
        fadeOut.forEach(el => {
            el.style.transition = 'opacity 0.3s ease';
            el.style.opacity = '0';
        });

        setTimeout(() => {
            if (infoTitle) infoTitle.textContent = careerData[currentIndex].title;
            if (infoRole) infoRole.textContent = careerData[currentIndex].role;
            if (infoPeriod) infoPeriod.textContent = careerData[currentIndex].period;
            if (infoDesc) infoDesc.textContent = careerData[currentIndex].desc;
            fadeOut.forEach(el => el.style.opacity = '1');
        }, 150);

        // Skip JS transform on mobile - use native CSS scroll instead
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            const translateX = -currentIndex * 110;
            scrollTrack.style.transform = `translateX(${translateX}vw)`;
        }
    }

    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            const dataIndex = parseInt(item.dataset.index);
            if (isNaN(dataIndex)) return;

            const maxScroll = careerSection.offsetHeight - window.innerHeight;
            const cardScrollRange = maxScroll / cards.length;
            const targetScroll = careerSection.offsetTop + (cardScrollRange * dataIndex) + (cardScrollRange * 0.5);

            const stemPage = document.getElementById('page-stem');
            if (stemPage) {
                stemPage.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        });
    });

    const stemPage = document.getElementById('page-stem');
    if (!stemPage) return;

    stemPage.addEventListener('scroll', () => {
        const sectionTop = careerSection.offsetTop;
        const sectionHeight = careerSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollY = stemPage.scrollTop;

        const startScroll = sectionTop;
        const endScroll = sectionTop + sectionHeight - viewportHeight;
        const scrollRange = endScroll - startScroll;

        if (scrollY >= startScroll && scrollY <= endScroll) {
            const relativeScroll = scrollY - startScroll;
            const progress = relativeScroll / scrollRange;
            let cardIndex = Math.floor(progress * cards.length);
            cardIndex = Math.min(Math.max(cardIndex, 0), cards.length - 1);
            updateCareer(cardIndex);
        } else if (scrollY < startScroll) {
            updateCareer(0);
        } else if (scrollY > endScroll) {
            updateCareer(cards.length - 1);
        }
    });

    updateCareer(0);
}
