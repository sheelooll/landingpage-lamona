/*=========================================
   HERO-SLIDER.JS – Slider automático del hero
   (solo en index). Tres slides; cada imagen
   lleva su data-img-key y se cambia desde la
   sección Imágenes del panel admin.
   =========================================*/

document.addEventListener('DOMContentLoaded', () => {
    const INTERVALO_MS = 5000;
    const slides = [...document.querySelectorAll('.hero-slide')];
    const dotsBox = document.getElementById('heroSliderDots');
    if (slides.length === 0 || !dotsBox) return;

    let actual = 0;

    dotsBox.innerHTML = slides
        .map((_, i) => `<button data-dot="${i}" aria-label="Ir al slide ${i + 1}"></button>`)
        .join('');
    const dots = [...dotsBox.children];

    function mostrar(indice) {
        slides[actual].classList.remove('active');
        dots[actual].classList.remove('active');
        actual = (indice + slides.length) % slides.length;
        slides[actual].classList.add('active');
        dots[actual].classList.add('active');
    }

    setInterval(() => mostrar(actual + 1), INTERVALO_MS);

    dotsBox.addEventListener('click', e => {
        const dot = e.target.closest('button');
        if (dot) mostrar(Number(dot.dataset.dot));
    });

    mostrar(0);
});
