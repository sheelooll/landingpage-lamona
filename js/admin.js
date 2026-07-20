/*=========================================
   ADMIN.JS
   =========================================*/

/*============================
Auth (Firebase Auth)

El panel NO renderiza ni carga datos de gestión
hasta que Firebase confirma una sesión válida
(onAuthStateChanged). La barrera real son las
reglas de Firestore; esto es la capa de UI.
============================*/

let datosCargados = false;

function mostrarPanel() {
    document.getElementById('authOverlay').style.display = 'none';
    document.querySelector('.admin').style.display = 'grid';
    // Cargar los datos sensibles solo una vez, ya autenticados.
    if (!datosCargados) {
        datosCargados = true;
        cargarTabla();
        renderizarPedidos();
        renderizarImagenes();
        cargarFormularioContacto();
        renderizarCategoriasAdmin();
        cargarSelectCategorias();
    }
}

function mostrarLogin() {
    document.getElementById('authOverlay').style.display = 'flex';
    document.querySelector('.admin').style.display = 'none';
}

// Fuente de verdad de la sesión: onAuthStateChanged.
if (window.FirebaseAuth && window.FirebaseAuth.disponible) {
    window.FirebaseAuth.onChange(user => {
        if (user) mostrarPanel();
        else mostrarLogin();
    });
} else {
    // Sin SDK de Auth no se puede validar: se bloquea el panel.
    mostrarLogin();
    const err = document.getElementById('authError');
    if (err) {
        err.textContent = 'Servicio de autenticación no disponible. Revisa tu conexión.';
        err.style.display = 'block';
    }
}

document.getElementById('authForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const pass  = document.getElementById('authPass').value;
    const err   = document.getElementById('authError');

    if (!window.FirebaseAuth || !window.FirebaseAuth.disponible) return;

    window.FirebaseAuth.login(email, pass)
        .then(() => { /* onAuthStateChanged mostrará el panel */ })
        .catch(() => {
            if (err) {
                err.textContent = 'Credenciales incorrectas. Intenta de nuevo.';
                err.style.display = 'block';
            }
            document.getElementById('authPass').value = '';
        });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (window.FirebaseAuth && window.FirebaseAuth.disponible) {
        window.FirebaseAuth.logout().finally(() => { window.location.href = 'index.html'; });
    } else {
        window.location.href = 'index.html';
    }
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
const cantidadPromo     = document.getElementById('cantidadPromo');
const precioPromo       = document.getElementById('precioPromo');

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

// Subida de archivo → base64 redimensionado.
// Las fotos de celular pesan varios MB y superan el límite de
// 1 MB por documento de Firestore (por eso "no quedaban guardadas"):
// se comprimen igual que las fotos de portada antes de usarlas.
imagenFile.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const dataUrl = await redimensionarFoto(file);
        imagen.value = dataUrl;
        preview.src = dataUrl;
        preview.style.display = 'block';
    } catch {
        alert('No se pudo leer la imagen. Intenta con otro archivo.');
        imagenFile.value = '';
    }
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
    const promoTxt = (producto.precioPromo && producto.cantidadPromo)
        ? `<br><small style="color:#16a34a;font-weight:700;">${producto.cantidadPromo} x $${Number(producto.precioPromo).toLocaleString('es-CL')}</small>`
        : '';
    return `
    <tr>
        <td><img src="${escapeHTML(producto.imagen)}" alt="${escapeHTML(producto.nombre)}"></td>
        <td>${escapeHTML(producto.nombre)}${producto.destacado ? ' <span class="badge">Destacado</span>' : ''}${producto.enOferta ? ' <span class="badge badge--oferta">Oferta</span>' : ''}</td>
        <td>${escapeHTML(producto.categoria)}</td>
        <td>${producto.precio != null ? '$' + Number(producto.precio).toLocaleString('es-CL') : '—'}${ofertaTxt}${promoTxt}${mayoristaTxt}</td>
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
    // Las categorías dependen de los productos (conteo de usos y
    // categorías derivadas), así que se refrescan junto con la tabla
    renderizarCategoriasAdmin();
    cargarSelectCategorias();
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

    // La promo por pack necesita ambos datos para funcionar
    if ((cantidadPromo.value.trim() === '') !== (precioPromo.value.trim() === '')) {
        alert('Para la promo por pack completa la cantidad Y el precio, o deja ambos en blanco.');
        return;
    }

    // El precio mayorista también necesita ambos datos
    if ((cantidadMayorista.value.trim() === '') !== (precioMayorista.value.trim() === '')) {
        alert('Para el precio mayorista completa la cantidad Y el precio, o deja ambos en blanco.');
        return;
    }

    // Basta con que exista al menos un tipo de precio (unitario, mayoreo o pack)
    const tieneUnitario = precio.value.trim() !== '';
    const tieneMayoreo  = precioMayorista.value.trim() !== '';
    const tienePromo    = precioPromo.value.trim() !== '';
    if (!tieneUnitario && !tieneMayoreo && !tienePromo) {
        alert('Ingresa al menos un precio: normal, mayorista o promo por pack.');
        return;
    }

    const producto = {
        id: productId.value === '' ? generarId() : Number(productId.value),
        nombre: nombre.value.trim(),
        categoria: categoria.value.trim(),
        precio: precio.value.trim() === '' ? null : Number(precio.value),
        stock: stockInput.value.trim() === '' ? null : Number(stockInput.value),
        imagen: imagen.value.trim(),
        descripcion: descripcion.value.trim(),
        destacado: destacado.checked,
        enOferta: enOferta.checked,
        precioOferta: precioOferta.value.trim() === '' ? null : Number(precioOferta.value),
        precioMayorista: precioMayorista.value.trim() === '' ? null : Number(precioMayorista.value),
        cantidadMayorista: cantidadMayorista.value.trim() === '' ? null : Number(cantidadMayorista.value),
        precioPromo: precioPromo.value.trim() === '' ? null : Number(precioPromo.value),
        cantidadPromo: cantidadPromo.value.trim() === '' ? null : Number(cantidadPromo.value)
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
    precio.value             = producto.precio ?? '';
    stockInput.value         = (producto.stock === null || producto.stock === undefined) ? '' : producto.stock;
    imagen.value             = producto.imagen || '';
    descripcion.value        = producto.descripcion || '';
    destacado.checked        = !!producto.destacado;
    enOferta.checked         = !!producto.enOferta;
    precioOferta.value       = producto.precioOferta || '';
    document.getElementById('precioOfertaGroup').style.display = producto.enOferta ? 'block' : 'none';
    cantidadMayorista.value  = producto.cantidadMayorista || '';
    precioMayorista.value    = producto.precioMayorista || '';
    cantidadPromo.value      = producto.cantidadPromo || '';
    precioPromo.value        = producto.precioPromo || '';

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
Categorías (crear / eliminar).
La lista vive en localStorage 'categorias'
y se sincroniza con Firestore (config/categorias).
El catálogo público arma sus chips de filtro
a partir de esta misma lista.
============================*/

// Lista guardada + categorías que aún usan los productos
// (por si quedó alguna antigua no registrada)
function todasLasCategorias() {
    return [...new Set([
        ...getCategorias(),
        ...productos.map(p => p.categoria).filter(Boolean)
    ])].sort((a, b) => a.localeCompare(b, 'es'));
}

function renderizarCategoriasAdmin() {
    const lista = document.getElementById('listaCategorias');
    if (!lista) return;

    const cats = todasLasCategorias();
    if (cats.length === 0) {
        lista.innerHTML = '<p class="categorias-vacio">Aún no hay categorías. Crea la primera con el formulario de arriba.</p>';
        return;
    }

    lista.innerHTML = cats.map(cat => {
        const usos = productos.filter(p => p.categoria === cat).length;
        return `
        <div class="categoria-item">
            <span class="categoria-item__nombre"><i class="ri-price-tag-3-line"></i> ${escapeHTML(cat)}</span>
            <small class="categoria-item__usos">${usos} producto${usos === 1 ? '' : 's'}</small>
            <button class="btn-delete" data-cat="${escapeHTML(cat)}" title="Eliminar categoría">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>`;
    }).join('');
}

// Select de categoría del formulario de producto
function cargarSelectCategorias() {
    if (!categoria) return;
    const seleccionada = categoria.value;
    const cats = todasLasCategorias();
    categoria.innerHTML = '<option value="" disabled selected>Categoría…</option>' +
        cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if (seleccionada && cats.includes(seleccionada)) categoria.value = seleccionada;
}

document.getElementById('categoriaForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('categoriaNueva');
    const nombreCat = input.value.trim();
    if (!nombreCat) return;

    const existentes = todasLasCategorias();
    if (existentes.some(c => c.toLowerCase() === nombreCat.toLowerCase())) {
        alert('Esa categoría ya existe.');
        return;
    }
    // Se guardan también las derivadas de los productos para que
    // la primera escritura deje la lista completa en la nube
    saveCategorias([...existentes, nombreCat]);
    input.value = '';
    input.focus();
});

document.getElementById('listaCategorias')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    const cat = btn.dataset.cat;

    const usos = productos.filter(p => p.categoria === cat).length;
    if (usos > 0) {
        alert(`No se puede eliminar "${cat}": la usan ${usos} producto${usos === 1 ? '' : 's'}.\nCambia primero esos productos a otra categoría.`);
        return;
    }
    if (!confirm(`¿Eliminar la categoría "${cat}"?`)) return;
    saveCategorias(todasLasCategorias().filter(c => c !== cat));
});

// saveCategorias y la sincronización con Firestore disparan este evento
document.addEventListener('categoriasActualizadas', () => {
    renderizarCategoriasAdmin();
    cargarSelectCategorias();
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
    productos:  document.getElementById('productosSection'),
    categorias: document.getElementById('categoriasSection'),
    pedidos:    document.getElementById('pedidosSection'),
    imagenes:   document.getElementById('imagenesSection'),
    contacto:   document.getElementById('contactoSection')
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
        // Los pedidos los crea el cliente anónimo: todo campo de texto
        // se escapa para evitar XSS almacenado contra el panel admin.
        const prods = order.productos
            .map(p => `${escapeHTML(p.nombre)} ×${escapeHTML(p.cantidad)}`)
            .join(', ');
        tbody.innerHTML += `
        <tr>
            <td>${escapeHTML(order.fecha)}</td>
            <td>${escapeHTML(order.cliente)}</td>
            <td style="max-width:260px;font-size:.88rem;">${prods}</td>
            <td><strong>$${Number(order.total).toLocaleString('es-CL')}</strong></td>
            <td>${escapeHTML(order.entrega)}${order.direccion ? `<br><small>${escapeHTML(order.direccion)}</small>` : ''}${order.horaRetiro ? `<br><small>⏰ Retiro: ${escapeHTML(order.horaRetiro)}</small>` : ''}</td>
            <td>${escapeHTML(order.pago)}</td>
        </tr>`;
    });
}

function limpiarPedidos() {
    if (!confirm('¿Limpiar todos los pedidos? Esta acción no se puede deshacer.')) return;
    clearOrders();
    renderizarPedidos();
}

/*============================
Imágenes del index: las 3 fotos del
slider principal y las 2 del slider
de la sección "Nosotros". Cada una
declara su archivo original propio.
============================*/

const FOTOS_PORTADA = [
    { clave: 'hero-slide-1',     titulo: 'Foto principal 1',   original: 'hero1.png' },
    { clave: 'hero-slide-2',     titulo: 'Foto 2',             original: 'hero1.png' },
    { clave: 'hero-slide-3',     titulo: 'Foto 3',             original: 'hero1.png' },
    { clave: 'nosotros-slide-1', titulo: 'Nosotros — foto 1',  original: 'logo2.png' },
    { clave: 'nosotros-slide-2', titulo: 'Nosotros — foto 2',  original: 'logo3.JPG' }
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
    const item = FOTOS_PORTADA.find(f => f.clave === clave);
    return obtenerImagenesSitio()[clave] || (item && item.original) || FOTO_ORIGINAL;
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
Datos de contacto
(WhatsApp y email del sitio)
============================*/

function cargarFormularioContacto() {
    const contacto = getContacto();
    const ws = document.getElementById('contactoWhatsapp');
    const em = document.getElementById('contactoEmail');
    if (ws) ws.value = contacto.whatsapp;
    if (em) em.value = contacto.email;
}

document.getElementById('contactoForm')?.addEventListener('submit', e => {
    e.preventDefault();
    saveContacto({
        whatsapp: document.getElementById('contactoWhatsapp').value,
        email: document.getElementById('contactoEmail').value
    });
    cargarFormularioContacto();
    alert('Datos de contacto guardados. La tienda ya usa los nuevos datos.');
});

/*============================
Inicializar
============================*/

document.addEventListener('DOMContentLoaded', () => {
    // No se cargan datos aquí: mostrarPanel() lo hace solo tras
    // confirmar la sesión de Firebase (onAuthStateChanged).
});

// Sincronización en tiempo real desde Firestore (firebase-db.js)
document.addEventListener('productosActualizados', cargarTabla);
document.addEventListener('pedidosActualizados', renderizarPedidos);
document.addEventListener('imagenesActualizadas', renderizarImagenes);
document.addEventListener('contactoActualizado', cargarFormularioContacto);

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
