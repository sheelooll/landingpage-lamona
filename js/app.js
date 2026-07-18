/*=========================================
   APP.JS
   Comportamiento general: overlay, scroll,
   WhatsApp, redes sociales, menú móvil,
   modal de login admin desde index.
   =========================================*/

const TELEFONO_WS = '56991024435';
const TIKTOK_URL  = 'https://www.tiktok.com/@comercializadora.lamona';
const IG_URL      = 'https://www.instagram.com/comercializadoralamona/';
const FB_URL      = 'https://www.facebook.com/search/top?q=comercializadora%20la%20mona';

document.addEventListener('DOMContentLoaded', () => {

    /* ── Overlay: cierra cualquier panel activo ── */
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (window.carrito) window.carrito.cerrar();
            document.getElementById('checkoutModal')?.classList.remove('active');
            document.getElementById('adminLoginModal')?.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    /* ── Scroll top ── */
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('show', window.scrollY > 500);
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ── WhatsApp flotante ── */
    const floatingWa = document.getElementById('floatingWhatsapp');
    if (floatingWa) {
        floatingWa.href   = `https://wa.me/${TELEFONO_WS}`;
        floatingWa.target = '_blank';
    }

    /* ── Botón WhatsApp en sección Contacto ── */
    const btnWa = document.getElementById('btnWhatsapp');
    if (btnWa) {
        btnWa.href   = `https://wa.me/${TELEFONO_WS}`;
        btnWa.target = '_blank';
    }

    /* ── Teléfono de contacto ── */
    const telEl = document.getElementById('telefonoEmpresa');
    if (telEl) telEl.textContent = '+56 9 9102 4435';

    /* ── Redes sociales ── */
    const setLink = (id, url) => {
        const el = document.getElementById(id);
        if (el) { el.href = url; el.target = '_blank'; el.rel = 'noopener'; }
    };
    setLink('tiktokLink',    TIKTOK_URL);
    setLink('instagramLink', IG_URL);
    setLink('facebookLink',  FB_URL);

    /* ── Header scroll ── */
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 80);
        });
    }

    /* ── Menú móvil ── */
    const menuBtn = document.getElementById('menuButton');
    const navMenu = document.querySelector('.nav__menu');
    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => navMenu.classList.toggle('active'));
        navMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navMenu.classList.remove('active'));
        });
    }

    /* ── Modal de login Admin desde index ── */
    const adminBtn        = document.getElementById('adminLoginBtn');
    const adminModal      = document.getElementById('adminLoginModal');
    const adminModalClose = document.getElementById('adminModalClose');
    const adminLoginForm  = document.getElementById('adminLoginForm');

    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', () => {
            adminModal.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.getElementById('adminPassInput')?.focus();
        });

        adminModalClose.addEventListener('click', () => {
            adminModal.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });

        adminLoginForm.addEventListener('submit', e => {
            e.preventDefault();
            const pass = document.getElementById('adminPassInput').value;
            if (pass === 'lamona2026') {
                sessionStorage.setItem('adminAuth', 'true');
                window.location.href = 'admin.html';
            } else {
                const err = document.getElementById('adminPassError');
                if (err) err.style.display = 'block';
                document.getElementById('adminPassInput').value = '';
            }
        });
    }
});
