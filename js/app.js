/*=========================================
   APP.JS
   Comportamiento general: overlay, scroll,
   WhatsApp, redes sociales, menú móvil,
   modal de login admin desde index.
   =========================================*/

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

    /* ── Contacto (WhatsApp y email, editables desde el admin) ── */
    function aplicarContacto() {
        const contacto = getContacto();

        // encodeURIComponent evita que un número manipulado rompa la URL
        const wsNum = encodeURIComponent(contacto.whatsapp);

        const floatingWa = document.getElementById('floatingWhatsapp');
        if (floatingWa) {
            floatingWa.href   = `https://wa.me/${wsNum}`;
            floatingWa.target = '_blank';
            floatingWa.rel    = 'noopener noreferrer';
        }

        const btnWa = document.getElementById('btnWhatsapp');
        if (btnWa) {
            btnWa.href   = `https://wa.me/${wsNum}`;
            btnWa.target = '_blank';
            btnWa.rel    = 'noopener noreferrer';
        }

        const emailEl = document.getElementById('emailEmpresa');
        if (emailEl) emailEl.textContent = contacto.email;

        // El teléfono de contacto es el MISMO número de WhatsApp
        // (así siempre coinciden y se actualiza desde el admin).
        const telEl = document.getElementById('telefonoEmpresa');
        if (telEl) telEl.textContent = formatearTelefono(contacto.whatsapp);
    }
    aplicarContacto();
    document.addEventListener('contactoActualizado', aplicarContacto);

    /* ── Formatea un número de WhatsApp para mostrarlo como teléfono ──
       Chile: 56 + 9 + 8 dígitos → +56 9 XXXX XXXX */
    function formatearTelefono(numero) {
        const d = String(numero || '').replace(/\D/g, '');
        if (d.length === 11 && d.startsWith('56')) {
            return `+56 ${d[2]} ${d.slice(3, 7)} ${d.slice(7)}`;
        }
        return d ? '+' + d : '';
    }

    /* ── Redes sociales ── */
    const setLink = (id, url) => {
        const el = document.getElementById(id);
        if (el) { el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
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
            const email = document.getElementById('adminEmailInput').value.trim();
            const pass  = document.getElementById('adminPassInput').value;
            const err   = document.getElementById('adminPassError');

            if (!window.FirebaseAuth || !window.FirebaseAuth.disponible) {
                if (err) {
                    err.textContent = 'Servicio de autenticación no disponible. Revisa tu conexión.';
                    err.style.display = 'block';
                }
                return;
            }

            // Firebase Auth valida las credenciales; la sesión persiste
            // (LOCAL) y admin.html la reconoce sin volver a pedir clave.
            window.FirebaseAuth.login(email, pass)
                .then(() => { window.location.href = 'admin.html'; })
                .catch(() => {
                    if (err) {
                        err.textContent = 'Credenciales incorrectas. Intenta de nuevo.';
                        err.style.display = 'block';
                    }
                    document.getElementById('adminPassInput').value = '';
                });
        });
    }
});
