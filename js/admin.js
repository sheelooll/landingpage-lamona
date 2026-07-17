/*=========================================
   ADMIN.JS
   =========================================*/

const ADMIN_PASS = 'lamona2026';

/*============================
Auth
============================*/

function checkAdminAuth() {
    if (sessionStorage.getItem('adminAuth') !== 'true') {
        document.getElementById('authOverlay').style.display = 'flex';
        document.querySelector('.admin').style.display = 'none';
    }
}

document.getElementById('authForm').addEventListener('submit', e => {
    e.preventDefault();
    const pass = document.getElementById('authPass').value;
    if (pass === ADMIN_PASS) {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById('authOverlay').style.display = 'none';
        document.querySelector('.admin').style.display = 'grid';
        cargarTabla();
        renderizarPedidos();
    } else {
        document.getElementById('authError').style.display = 'block';
        document.getElementById('authPass').value = '';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');
    window.location.href = 'index.html';
});

/*============================
Elementos del formulario
============================*/

let productos = obtenerProductos();

const tablaProductos    = document.getElementById('tablaProductos');
const productForm       = document.getElementById('productForm');
const buscar            = document.getElementById('buscar');
const productId         = document.getElementById('productId');
const nombre            = document.getElementById('nombre');
const categoria         = document.getElementById('categoria');
const precio            = document.getElementById('precio');
const stockInput        = document.getElementById('stock');
const imagen            = document.getElementById('imagen');
const imagenFile        = document.getElementById('imagenFile');
const descripcion       = document.getElementById('descripcion');
const destacado         = document.getElementById('destacado');
const enOferta          = document.getElementById('enOferta');
const precioOferta      = document.getElementById('precioOferta');
const cantidadMayorista = document.getElementById('cantidadMayorista');
const precioMayorista   = document.getElementById('precioMayorista');

/*============================
Vista previa imagen
============================*/

const preview = document.createElement('img');
preview.style.cssText = 'width:150px;height:150px;object-fit:cover;border-radius:10px;margin-top:15px;display:none;';
imagen.insertAdjacentElement('afterend', preview);

imagen.addEventListener('input', () => {
    preview.style.display = imagen.value.trim() ? 'block' : 'none';
    if (imagen.value.trim()) preview.src = imagen.value;
});

preview.onerror = () => { preview.style.display = 'none'; };

// Subida de archivo → base64
imagenFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        imagen.value = ev.target.result;
        preview.src = ev.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// Mostrar/ocultar precio de oferta según checkbox
enOferta.addEventListener('change', () => {
    document.getElementById('precioOfertaGroup').style.display = enOferta.checked ? 'block' : 'none';
    if (!enOferta.checked) precioOferta.value = '';
});

/*============================
Fila de tabla (helper compartido)
============================*/

function filaHTML(producto) {
    const stockLabel = (producto.stock === null || producto.stock === undefined)
        ? '<em>Ilimitado</em>'
        : producto.stock;
    const ofertaTxt = (producto.enOferta && producto.precioOferta)
        ? `<br><small style="color:#dc2626;font-weight:700;">OFERTA $${Number(producto.precioOferta).toLocaleString('es-CL')}</small>`
        : '';
    const mayoristaTxt = (producto.precioMayorista && producto.cantidadMayorista)
        ? `<br><small style="color:#8D6E63">${producto.cantidadMayorista} unid → $${Number(producto.precioMayorista).toLocaleString('es-CL')} c/u</small>`
        : '';
    return `
    <tr>
        <td><img src="${producto.imagen}" alt="${producto.nombre}"></td>
        <td>${producto.nombre}${producto.destacado ? ' <span class="badge">Destacado</span>' : ''}${producto.enOferta ? ' <span class="badge badge--oferta">Oferta</span>' : ''}</td>
        <td>${producto.categoria}</td>
        <td>$${producto.precio.toLocaleString('es-CL')}${ofertaTxt}${mayoristaTxt}</td>
        <td>${stockLabel}</td>
        <td>
            <div class="actions">
                <button class="btn-edit" onclick="editarProducto(${producto.id})"><i class="ri-edit-line"></i></button>
                <button class="btn-delete" onclick="eliminarProducto(${producto.id})"><i class="ri-delete-bin-line"></i></button>
            </div>
        </td>
    </tr>`;
}

/*============================
Cargar tabla
============================*/

function cargarTabla() {
    productos = obtenerProductos();
    tablaProductos.innerHTML = '';
    productos.forEach(p => { tablaProductos.innerHTML += filaHTML(p); });
}

/*============================
Limpiar formulario
============================*/

function limpiarFormulario() {
    productForm.reset();
    productId.value = '';
    preview.style.display = 'none';
    imagenFile.value = '';
    document.getElementById('precioOfertaGroup').style.display = 'none';
}

/*============================
Guardar / Editar producto
============================*/

productForm.addEventListener('submit', e => {
    e.preventDefault();

    const producto = {
        id: productId.value === '' ? generarId() : Number(productId.value),
        nombre: nombre.value.trim(),
        categoria: categoria.value.trim(),
        precio: Number(precio.value),
        stock: stockInput.value.trim() === '' ? null : Number(stockInput.value),
        imagen: imagen.value.trim(),
        descripcion: descripcion.value.trim(),
        destacado: destacado.checked,
        enOferta: enOferta.checked,
        precioOferta: precioOferta.value.trim() === '' ? null : Number(precioOferta.value),
        precioMayorista: precioMayorista.value.trim() === '' ? null : Number(precioMayorista.value),
        cantidadMayorista: cantidadMayorista.value.trim() === '' ? null : Number(cantidadMayorista.value)
    };

    if (productId.value === '') {
        productos.push(producto);
    } else {
        const idx = productos.findIndex(p => p.id === producto.id);
        if (idx !== -1) productos[idx] = producto;
    }

    guardarProductos(productos);
    cargarTabla();
    actualizarCatalogo();
    limpiarFormulario();
});

/*============================
Editar producto
============================*/

function editarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    productId.value          = producto.id;
    nombre.value             = producto.nombre;
    categoria.value          = producto.categoria;
    precio.value             = producto.precio;
    stockInput.value         = (producto.stock === null || producto.stock === undefined) ? '' : producto.stock;
    imagen.value             = producto.imagen || '';
    descripcion.value        = producto.descripcion || '';
    destacado.checked        = !!producto.destacado;
    enOferta.checked         = !!producto.enOferta;
    precioOferta.value       = producto.precioOferta || '';
    document.getElementById('precioOfertaGroup').style.display = producto.enOferta ? 'block' : 'none';
    cantidadMayorista.value  = producto.cantidadMayorista || '';
    precioMayorista.value    = producto.precioMayorista || '';

    if (producto.imagen) {
        preview.src = producto.imagen;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/*============================
Eliminar producto
============================*/

function eliminarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return;
    productos = productos.filter(p => p.id !== id);
    guardarProductos(productos);
    cargarTabla();
    actualizarCatalogo();
}

/*============================
Buscar
============================*/

buscar.addEventListener('input', function () {
    const texto = this.value.toLowerCase().trim();
    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto) ||
        (p.descripcion || '').toLowerCase().includes(texto)
    );
    tablaProductos.innerHTML = '';
    filtrados.forEach(p => { tablaProductos.innerHTML += filaHTML(p); });
});

/*============================
Generar ID
============================*/

function generarId() {
    if (productos.length === 0) return 1;
    return Math.max(...productos.map(p => Number(p.id))) + 1;
}

/*============================
Actualizar catálogo (evento)
============================*/

function actualizarCatalogo() {
    document.dispatchEvent(new Event('productosActualizados'));
}

/*============================
Nuevo Producto (botón)
============================*/

const nuevoProducto = document.getElementById('nuevoProducto');
if (nuevoProducto) {
    nuevoProducto.addEventListener('click', () => {
        limpiarFormulario();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/*============================
Sidebar navigation
============================*/

const secciones = {
    productos: document.getElementById('productosSection'),
    pedidos:   document.getElementById('pedidosSection'),
    imagenes:  document.getElementById('imagenesSection')
};

document.querySelectorAll('.sidebar li[data-section]').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');
        Object.values(secciones).forEach(s => { if (s) s.style.display = 'none'; });
        const sec = secciones[item.dataset.section];
        if (sec) sec.style.display = 'block';
        if (item.dataset.section === 'pedidos') renderizarPedidos();
    });
});

/*============================
Pedidos
============================*/

function renderizarPedidos() {
    const orders = getOrders();
    const tbody  = document.getElementById('tablaPedidos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#666;">No hay pedidos registrados aún.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const prods = order.productos.map(p => `${p.nombre} ×${p.cantidad}`).join(', ');
        tbody.innerHTML += `
        <tr>
            <td>${order.fecha}</td>
            <td>${order.cliente}</td>
            <td style="max-width:260px;font-size:.88rem;">${prods}</td>
            <td><strong>$${order.total.toLocaleString('es-CL')}</strong></td>
            <td>${order.entrega}${order.direccion ? `<br><small>${order.direccion}</small>` : ''}${order.horaRetiro ? `<br><small>⏰ Retiro: ${order.horaRetiro}</small>` : ''}</td>
            <td>${order.pago}</td>
        </tr>`;
    });
}

function limpiarPedidos() {
    if (!confirm('¿Limpiar todos los pedidos? Esta acción no se puede deshacer.')) return;
    clearOrders();
    renderizarPedidos();
}

/*============================
Imágenes de la portada
(las 3 fotos del slider del index)
============================*/

const FOTOS_PORTADA = [
    { clave: 'hero-slide-1', titulo: 'Foto principal 1' },
    { clave: 'hero-slide-2', titulo: 'Foto 2' },
    { clave: 'hero-slide-3', titulo: 'Foto 3' }
];
const FOTO_ORIGINAL = 'hero1.png';
const FOTO_MAX_LADO = 1000;
const FOTO_CALIDAD  = 0.82;

// Cambios elegidos pero aún no guardados: clave → dataURL
const fotosPendientes = {};

function obtenerImagenesSitio() {
    return JSON.parse(localStorage.getItem('imagenesSitio')) || {};
}

function fotoActual(clave) {
    return obtenerImagenesSitio()[clave] || FOTO_ORIGINAL;
}

function redimensionarFoto(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => {
            const img = new Image();
            img.onload = () => {
                const escala = Math.min(1, FOTO_MAX_LADO / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', FOTO_CALIDAD));
            };
            img.onerror = reject;
            img.src = lector.result;
        };
        lector.onerror = reject;
        lector.readAsDataURL(archivo);
    });
}

function renderizarImagenes() {
    const grid = document.getElementById('imagenesGrid');
    if (!grid) return;

    grid.innerHTML = FOTOS_PORTADA.map(({ clave, titulo }) => {
        const pendiente = fotosPendientes[clave];
        const personalizada = !!obtenerImagenesSitio()[clave];
        return `
        <article class="imagen-card ${pendiente ? 'pendiente' : ''}" data-clave="${clave}">
            <header>
                <h3>${titulo}</h3>
                ${pendiente
                    ? '<span class="imagen-badge imagen-badge--pendiente">Vista previa — sin guardar</span>'
                    : personalizada
                        ? '<span class="imagen-badge">Personalizada</span>'
                        : '<span class="imagen-badge imagen-badge--original">Original</span>'}
            </header>
            <div class="imagen-preview">
                <img src="${pendiente || fotoActual(clave)}" alt="${titulo}">
            </div>
            <div class="imagen-actions">
                ${pendiente ? `
                    <button class="btn btn-primary" data-accion="guardar">
                        <i class="ri-save-line"></i> Guardar
                    </button>
                    <button class="btn-cancelar" data-accion="cancelar">
                        <i class="ri-close-line"></i> Cancelar
                    </button>
                ` : `
                    <label class="btn btn-primary imagen-cambiar">
                        <i class="ri-image-add-line"></i> Cambiar foto
                        <input type="file" accept="image/*" data-accion="elegir" hidden>
                    </label>
                    ${personalizada ? `
                    <button class="btn-cancelar" data-accion="restaurar">
                        <i class="ri-arrow-go-back-line"></i> Restaurar original
                    </button>` : ''}
                `}
            </div>
        </article>`;
    }).join('');
}

document.getElementById('imagenesGrid')?.addEventListener('change', async e => {
    const input = e.target.closest('input[data-accion="elegir"]');
    if (!input || !input.files[0]) return;
    const clave = input.closest('.imagen-card').dataset.clave;
    try {
        fotosPendientes[clave] = await redimensionarFoto(input.files[0]);
        renderizarImagenes();
    } catch {
        alert('No se pudo leer la imagen. Intenta con otro archivo.');
    }
});

document.getElementById('imagenesGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn || btn.dataset.accion === 'elegir') return;
    const clave = btn.closest('.imagen-card').dataset.clave;

    if (btn.dataset.accion === 'guardar') {
        const imagenes = obtenerImagenesSitio();
        imagenes[clave] = fotosPendientes[clave];
        localStorage.setItem('imagenesSitio', JSON.stringify(imagenes));
        if (window.FirebaseDB) window.FirebaseDB.guardarImagen(clave, fotosPendientes[clave]);
        delete fotosPendientes[clave];
    }

    if (btn.dataset.accion === 'cancelar') {
        delete fotosPendientes[clave];
    }

    if (btn.dataset.accion === 'restaurar') {
        if (!confirm('¿Volver a la foto original?')) return;
        const imagenes = obtenerImagenesSitio();
        delete imagenes[clave];
        localStorage.setItem('imagenesSitio', JSON.stringify(imagenes));
        if (window.FirebaseDB) window.FirebaseDB.eliminarImagen(clave);
    }

    renderizarImagenes();
});

/*============================
Inicializar
============================*/

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    cargarTabla();
    renderizarPedidos();
    renderizarImagenes();
});

// Sincronización en tiempo real desde Firestore (firebase-db.js)
document.addEventListener('productosActualizados', cargarTabla);
document.addEventListener('pedidosActualizados', renderizarPedidos);
document.addEventListener('imagenesActualizadas', renderizarImagenes);

/*============================
API pública
============================*/

window.admin = {
    cargarTabla,
    editarProducto,
    eliminarProducto,
    limpiarFormulario,
    actualizarCatalogo,
    renderizarPedidos,
    limpiarPedidos
};
