/*=========================================
   HERO-SLIDER.JS – Slider automático del hero
   (solo en index). Tres slides; cada imagen
   lleva su data-img-key y se cambia desde la
   sección Imágenes del panel admin (Firestore).

   Animación por CSS puro: el slide activo está
   en translateX(0) y los inactivos salen según
   la dirección (exit-left al avanzar, exit-right
   al retroceder).
   =========================================*/

document.addEventListener('DOMContentLoaded', () => {
    const INTERVALO_MS = 6000;

    const slides  = [...document.querySelectorAll('.hero-slide')];
    const dotsBox = document.getElementById('heroSliderDots');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    if (slides.length === 0 || !dotsBox) return;

    let actual    = 0;
    let direccion = 1;   // 1 = avanza (derecha), -1 = retrocede (izquierda)
    let autoId    = null;

    /* ── Puntos de paginación ── */
    dotsBox.innerHTML = slides
        .map((_, i) => `<button data-dot="${i}" aria-label="Ir al slide ${i + 1}"></button>`)
        .join('');
    const dots = [...dotsBox.children];

    /* ── Actualiza estados de slides y puntos ── */
    function actualizar() {
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'exit-left', 'exit-right');
            if (i === actual) {
                slide.classList.add('active');
            } else {
                slide.classList.add(direccion === 1 ? 'exit-left' : 'exit-right');
            }
        });
        dots.forEach((dot, i) => dot.classList.toggle('active', i === actual));
    }

    /* ── Navegación (avance infinito) ── */
    function avanzar() {
        direccion = 1;
        actual = (actual + 1) % slides.length;
        actualizar();
    }

    function retroceder() {
        direccion = -1;
        actual = (actual - 1 + slides.length) % slides.length;
        actualizar();
    }

    // Salto directo desde un punto: la dirección se calcula según el destino.
    function irA(indice) {
        if (indice === actual) return;
        direccion = indice > actual ? 1 : -1;
        actual = indice;
        actualizar();
        reiniciarAuto();
    }

    /* ── Autoplay (reiniciable al interactuar) ── */
    function iniciarAuto()   { autoId = setInterval(avanzar, INTERVALO_MS); }
    function reiniciarAuto() { clearInterval(autoId); iniciarAuto(); }

    /* ── Controles ── */
    dotsBox.addEventListener('click', e => {
        const dot = e.target.closest('button');
        if (dot) irA(Number(dot.dataset.dot));
    });
    if (nextBtn) nextBtn.addEventListener('click', () => { avanzar();    reiniciarAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { retroceder(); reiniciarAuto(); });

    /* ── Init ── */
    actualizar();
    iniciarAuto();
});
