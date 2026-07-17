/*=========================================
   FIREBASE-DB.JS – Sincronización con Firestore.

   Firestore es la fuente de verdad; localStorage
   queda como caché para que el resto del código
   (obtenerProductos, getOrders…) siga siendo síncrono.

   Colecciones:
   - productos: un doc por producto, id = String(producto.id)
   - pedidos:   un doc por pedido,  id = String(pedido.id)

   Si Firestore no está disponible (sin red, reglas
   cerradas, base no creada), el sitio sigue
   funcionando solo con localStorage.
   =========================================*/

(function () {

    const firebaseConfig = {
        apiKey: "AIzaSyDIzufZUrwNKaMmCvWeIL4XJpdBRSjgrTc",
        authDomain: "comercializadora-lamona.firebaseapp.com",
        projectId: "comercializadora-lamona",
        storageBucket: "comercializadora-lamona.firebasestorage.app",
        messagingSenderId: "1031308422883",
        appId: "1:1031308422883:web:8ede8f0c3a0314c8a6dfd6",
        measurementId: "G-2P21S6WSH0"
    };

    if (typeof firebase === 'undefined') {
        console.warn('[FirebaseDB] SDK de Firebase no cargado; se usa solo localStorage.');
        return;
    }

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const esAdmin = !!document.getElementById('tablaPedidos');
    let nubeSembrada = false;

    function avisarErrorAdmin(accion, error) {
        console.error(`[FirebaseDB] Error al ${accion}:`, error);
        if (esAdmin) alert(`No se pudo ${accion} en la nube: ${error.message}\nEl cambio quedó guardado solo en este navegador.`);
    }

    /*============================
    Productos: nube → caché local
    ============================*/

    db.collection('productos').onSnapshot(snapshot => {
        const locales = JSON.parse(localStorage.getItem('productos')) || [];

        // Primera conexión con la colección vacía: se migra
        // lo que ya existe en este navegador (incluye el seed)
        if (snapshot.empty) {
            if (!nubeSembrada && locales.length > 0) {
                nubeSembrada = true;
                guardarProductosNube(locales);
            }
            return;
        }

        const productos = snapshot.docs
            .map(d => d.data())
            .sort((a, b) => Number(a.id) - Number(b.id));

        localStorage.setItem('productos', JSON.stringify(productos));
        document.dispatchEvent(new Event('productosActualizados'));
    }, error => {
        console.warn('[FirebaseDB] Sin conexión a Firestore (productos):', error.message);
    });

    /*============================
    Productos: local → nube
    ============================*/

    function guardarProductosNube(lista) {
        const coleccion = db.collection('productos');
        return coleccion.get().then(snapshot => {
            const batch = db.batch();
            const idsNuevos = new Set(lista.map(p => String(p.id)));
            snapshot.docs.forEach(doc => {
                if (!idsNuevos.has(doc.id)) batch.delete(doc.ref);
            });
            lista.forEach(p => batch.set(coleccion.doc(String(p.id)), p));
            return batch.commit();
        }).catch(err => avisarErrorAdmin('guardar los productos', err));
    }

    /*============================
    Pedidos (solo en el panel admin
    se leen; guardar es global)
    ============================*/

    function guardarPedidoNube(pedido) {
        return db.collection('pedidos').doc(String(pedido.id)).set(pedido)
            .catch(err => console.error('[FirebaseDB] Error al guardar pedido:', err));
    }

    function limpiarPedidosNube() {
        return db.collection('pedidos').get().then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            return batch.commit();
        }).catch(err => avisarErrorAdmin('limpiar los pedidos', err));
    }

    if (esAdmin) {
        db.collection('pedidos').onSnapshot(snapshot => {
            const pedidos = snapshot.docs
                .map(d => d.data())
                .sort((a, b) => Number(b.id) - Number(a.id));
            localStorage.setItem('pedidos', JSON.stringify(pedidos));
            document.dispatchEvent(new Event('pedidosActualizados'));
        }, error => {
            console.warn('[FirebaseDB] Sin conexión a Firestore (pedidos):', error.message);
        });
    }

    /*============================
    Imágenes del sitio (hero, logo…):
    un doc por imagen, id = clave.
    Nube → caché local + evento, igual
    que los productos.
    ============================*/

    db.collection('imagenes').onSnapshot(snapshot => {
        const imagenes = {};
        snapshot.docs.forEach(d => { imagenes[d.id] = d.data().url; });
        localStorage.setItem('imagenesSitio', JSON.stringify(imagenes));
        document.dispatchEvent(new Event('imagenesActualizadas'));
    }, error => {
        console.warn('[FirebaseDB] Sin conexión a Firestore (imagenes):', error.message);
    });

    function guardarImagenNube(clave, url) {
        return db.collection('imagenes').doc(clave).set({ url })
            .catch(err => avisarErrorAdmin('guardar la imagen', err));
    }

    function eliminarImagenNube(clave) {
        return db.collection('imagenes').doc(clave).delete()
            .catch(err => avisarErrorAdmin('restaurar la imagen', err));
    }

    function restaurarImagenesNube() {
        return db.collection('imagenes').get().then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            return batch.commit();
        }).catch(err => avisarErrorAdmin('restaurar las imágenes', err));
    }

    /*============================
    API pública
    ============================*/

    window.FirebaseDB = {
        guardarProductos: guardarProductosNube,
        guardarPedido: guardarPedidoNube,
        limpiarPedidos: limpiarPedidosNube,
        guardarImagen: guardarImagenNube,
        eliminarImagen: eliminarImagenNube,
        restaurarImagenes: restaurarImagenesNube
    };

})();
