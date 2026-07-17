/*=========================================
   IMAGENES-SITIO.JS – Aplica en la tienda
   pública las imágenes del sitio guardadas
   desde el panel admin (sección Imágenes).

   Fuente: colección 'imagenes' de Firestore,
   cacheada en localStorage 'imagenesSitio'
   por firebase-db.js. Cada <img data-img-key>
   toma su versión guardada si existe.
   =========================================*/

(function () {

    function aplicarImagenesSitio() {
        const imagenes = JSON.parse(localStorage.getItem('imagenesSitio')) || {};
        document.querySelectorAll('img[data-img-key]').forEach(img => {
            const url = imagenes[img.dataset.imgKey];
            if (url) img.src = url;
        });
    }

    document.addEventListener('DOMContentLoaded', aplicarImagenesSitio);
    document.addEventListener('imagenesActualizadas', aplicarImagenesSitio);

    window.ImagenesSitio = { aplicar: aplicarImagenesSitio };

})();
