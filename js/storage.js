/*=========================================
   STORAGE.JS – Capa de datos para pedidos.
   localStorage es la caché local; si FirebaseDB
   está disponible (firebase-db.js), cada pedido
   se replica también en Firestore.
   =========================================*/

/*============================
Escape de HTML (anti-XSS).
Todo dato de producto/pedido/contacto que se
inyecte con innerHTML debe pasar por aquí para
neutralizar <, >, &, comillas. Evita XSS
almacenado si un valor malicioso entra a Firestore.
============================*/

function escapeHTML(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getOrders() {
    return JSON.parse(localStorage.getItem('pedidos')) || [];
}

function saveOrder(order) {
    const orders = getOrders();
    const saved = Object.assign({}, order, {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-CL')
    });
    orders.unshift(saved);
    localStorage.setItem('pedidos', JSON.stringify(orders));
    if (window.FirebaseDB) window.FirebaseDB.guardarPedido(saved);
    return saved;
}

function clearOrders() {
    localStorage.removeItem('pedidos');
    if (window.FirebaseDB) window.FirebaseDB.limpiarPedidos();
}

/*============================
Datos de contacto (WhatsApp y email),
editables desde el panel admin.
============================*/

const CONTACTO_DEFAULT = {
    whatsapp: '56966030724',
    email: 'contacto@lamona.cl'
};

function getContacto() {
    const guardado = JSON.parse(localStorage.getItem('contactoSitio')) || {};
    return Object.assign({}, CONTACTO_DEFAULT, guardado);
}

function saveContacto(datos) {
    const contacto = {
        whatsapp: (datos.whatsapp || '').replace(/[\s+\-().]/g, ''),
        email: (datos.email || '').trim()
    };
    localStorage.setItem('contactoSitio', JSON.stringify(contacto));
    if (window.FirebaseDB) window.FirebaseDB.guardarContacto(contacto);
    document.dispatchEvent(new Event('contactoActualizado'));
    return contacto;
}
