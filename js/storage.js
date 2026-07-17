/*=========================================
   STORAGE.JS – Capa de datos para pedidos.
   localStorage es la caché local; si FirebaseDB
   está disponible (firebase-db.js), cada pedido
   se replica también en Firestore.
   =========================================*/

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
