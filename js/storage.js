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
Categorías del catálogo, editables desde
el panel admin. localStorage es la caché;
la nube (config/categorias) es la fuente
de verdad vía firebase-db.js.
============================*/

function getCategorias() {
    const guardadas = JSON.parse(localStorage.getItem('categorias'));
    if (Array.isArray(guardadas)) return guardadas;
    // Sin lista guardada aún: se derivan de los productos existentes
    const productos = JSON.parse(localStorage.getItem('productos')) || [];
    return [...new Set(productos.map(p => p.categoria).filter(Boolean))];
}

function saveCategorias(lista) {
    const limpias = [...new Set(lista.map(c => String(c).trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'));
    localStorage.setItem('categorias', JSON.stringify(limpias));
    if (window.FirebaseDB) window.FirebaseDB.guardarCategorias(limpias);
    document.dispatchEvent(new Event('categoriasActualizadas'));
    return limpias;
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
