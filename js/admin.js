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
const filtroCategoria   = document.getElementById('filtroCategoria');
const filtroEstado      = document.getElementById('filtroEstado');
const productId         = document.getElementById('productId');
const nombre            = document.getElementById('nombre');
const categoria         = document.getElementById('categoria');
const precio            = document.getElementById('precio');
const stockInput        = document.getElementById('stock');
const imagen            = document.getElementById('imagen');
const imagenFile        = document.getElementById('imagenFile');
const cameraFile        = document.getElementById('cameraFile');
const descripcion       = document.getElementById('descripcion');
const destacado         = document.getElementById('destacado');
const enOferta          = document.getElementById('enOferta');
const precioOferta      = document.getElementById('precioOferta');
const cantidadMayorista = document.getElementById('cantidadMayorista');
const precioMayorista   = document.getElementById('precioMayorista');
const cantidadPromo     = document.getElementById('cantidadPromo');
const precioPromo       = document.getElementById('precioPromo');
const ventaPorPeso      = document.getElementById('ventaPorPeso');

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
async function aplicarFotoProducto(file, inputRef) {
    try {
        const dataUrl = await redimensionarFoto(file);
        imagen.value = dataUrl;
        preview.src = dataUrl;
        preview.style.display = 'block';
    } catch {
        alert('No se pudo leer la imagen. Intenta con otro archivo.');
        inputRef.value = '';
    }
}

imagenFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) aplicarFotoProducto(file, imagenFile);
});

cameraFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) aplicarFotoProducto(file, cameraFile);
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
        ? `<br><small style="color:#800020">${producto.cantidadMayorista} unid → $${Number(producto.precioMayorista).toLocaleString('es-CL')} c/u</small>`
        : '';
    const promoTxt = (producto.precioPromo && producto.cantidadPromo)
        ? `<br><small style="color:#16a34a;font-weight:700;">${producto.cantidadPromo} x $${Number(producto.precioPromo).toLocaleString('es-CL')}</small>`
        : '';
    return `
    <tr>
        <td><img src="${escapeHTML(producto.imagen)}" alt="${escapeHTML(producto.nombre)}"></td>
        <td>${escapeHTML(producto.nombre)}${producto.destacado ? ' <span class="badge">Destacado</span>' : ''}${producto.enOferta ? ' <span class="badge badge--oferta">Oferta</span>' : ''}${producto.ventaPorPeso ? ' <span class="badge badge--peso">Por peso</span>' : ''}</td>
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
Migración: activa "venta por peso" en todos
los fiambres que aún no lo tengan. Idempotente:
si ya están migrados, no hace nada.
============================*/

function migrarFiambresAPorPeso() {
    // Solo se puede escribir en Firestore con sesión activa.
    // datosCargados se pone en true solo después de que onAuthStateChanged
    // confirma al usuario, así que es el guard correcto.
    if (!datosCargados) return;
    const prods = obtenerProductos();
    const necesita = prods.some(
        p => p.categoria.toLowerCase() === 'fiambres' && !p.ventaPorPeso
    );
    if (!necesita) return;
    const actualizados = prods.map(p =>
        p.categoria.toLowerCase() === 'fiambres' ? { ...p, ventaPorPeso: true } : p
    );
    guardarProductos(actualizados);
}

/*============================
Cargar tabla
============================*/

let _debounceTabla = null;

function cargarTabla() {
    migrarFiambresAPorPeso();
    productos = obtenerProductos();
    cargarFiltroCategoria(); // actualiza el dropdown de filtro
    filtrarTabla();          // renderiza respetando los filtros activos
    renderizarCategoriasAdmin();
    cargarSelectCategorias();
}

// Versión con debounce para los eventos de Firestore:
// si llegan varios seguidos (productos + categorías), se colapsan en un render
function cargarTablaDebounced() {
    clearTimeout(_debounceTabla);
    _debounceTabla = setTimeout(cargarTabla, 60);
}

/*============================
Limpiar formulario
============================*/

function limpiarFormulario() {
    productForm.reset();
    productId.value = '';
    preview.style.display = 'none';
    imagenFile.value = '';
    cameraFile.value = '';
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
        cantidadPromo: cantidadPromo.value.trim() === '' ? null : Number(cantidadPromo.value),
        ventaPorPeso: ventaPorPeso.checked
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
Modal de edición — referencias
============================*/

const editModal           = document.getElementById('editModal');
const editProductForm     = document.getElementById('editProductForm');
const editProductId       = document.getElementById('editProductId');
const editNombre          = document.getElementById('editNombre');
const editCategoriaSelect = document.getElementById('editCategoriaSelect');
const editPrecio          = document.getElementById('editPrecio');
const editStock           = document.getElementById('editStock');
const editCantMayorista   = document.getElementById('editCantidadMayorista');
const editPrcMayorista    = document.getElementById('editPrecioMayorista');
const editCantPromo       = document.getElementById('editCantidadPromo');
const editPrcPromo        = document.getElementById('editPrecioPromo');
const editImagen          = document.getElementById('editImagen');
const editImagenFile      = document.getElementById('editImagenFile');
const editCameraFile      = document.getElementById('editCameraFile');
const editImagenPreview   = document.getElementById('editImagenPreview');
const editDescripcion     = document.getElementById('editDescripcion');
const editDestacado       = document.getElementById('editDestacado');
const editVentaPorPeso    = document.getElementById('editVentaPorPeso');
const editEnOferta        = document.getElementById('editEnOferta');
const editPrecioOferta    = document.getElementById('editPrecioOferta');

function abrirEditModal(producto) {
    // Poblar select de categorías
    const cats = todasLasCategorias();
    editCategoriaSelect.innerHTML = cats
        .map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
        .join('');

    // Llenar campos
    editProductId.value        = producto.id;
    editNombre.value           = producto.nombre;
    editCategoriaSelect.value  = producto.categoria;
    editPrecio.value           = producto.precio ?? '';
    editStock.value            = (producto.stock === null || producto.stock === undefined) ? '' : producto.stock;
    editImagen.value           = producto.imagen || '';
    editDescripcion.value      = producto.descripcion || '';
    editDestacado.checked      = !!producto.destacado;
    editVentaPorPeso.checked   = !!producto.ventaPorPeso;
    editEnOferta.checked       = !!producto.enOferta;
    editPrecioOferta.value     = producto.precioOferta || '';
    editCantMayorista.value    = producto.cantidadMayorista || '';
    editPrcMayorista.value     = producto.precioMayorista || '';
    editCantPromo.value        = producto.cantidadPromo || '';
    editPrcPromo.value         = producto.precioPromo || '';

    document.getElementById('editPrecioOfertaGroup').style.display =
        producto.enOferta ? 'block' : 'none';

    // Header: miniatura y nombre
    const thumb = document.getElementById('editModalThumb');
    thumb.src = producto.imagen || '';
    thumb.style.display = producto.imagen ? 'block' : 'none';
    document.getElementById('editModalTitle').textContent = producto.nombre;
    document.getElementById('editModalCatTag').textContent = producto.categoria;

    // Preview imagen
    if (producto.imagen) {
        editImagenPreview.src = producto.imagen;
        editImagenPreview.style.display = 'block';
    } else {
        editImagenPreview.style.display = 'none';
    }

    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    editNombre.focus();
}

function cerrarEditModal() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    editImagenFile.value = '';
    editCameraFile.value = '';
}

// Mostrar/ocultar precio oferta en modal
editEnOferta.addEventListener('change', () => {
    document.getElementById('editPrecioOfertaGroup').style.display =
        editEnOferta.checked ? 'block' : 'none';
    if (!editEnOferta.checked) editPrecioOferta.value = '';
});

// Preview de imagen por URL en modal
editImagen.addEventListener('input', () => {
    const url = editImagen.value.trim();
    editImagenPreview.style.display = url ? 'block' : 'none';
    if (url) editImagenPreview.src = url;
    const thumb = document.getElementById('editModalThumb');
    if (url) { thumb.src = url; thumb.style.display = 'block'; }
});

editImagenPreview.onerror = () => { editImagenPreview.style.display = 'none'; };

// Subida de imagen en modal (galería o cámara)
async function aplicarFotoModal(file, inputRef) {
    try {
        const dataUrl = await redimensionarFoto(file);
        editImagen.value = dataUrl;
        editImagenPreview.src = dataUrl;
        editImagenPreview.style.display = 'block';
        const thumb = document.getElementById('editModalThumb');
        thumb.src = dataUrl;
        thumb.style.display = 'block';
    } catch {
        alert('No se pudo leer la imagen. Intenta con otro archivo.');
        inputRef.value = '';
    }
}

editImagenFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) aplicarFotoModal(file, editImagenFile);
});

editCameraFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) aplicarFotoModal(file, editCameraFile);
});

// Cerrar: botón X, botón Cancelar, backdrop, Escape
document.getElementById('closeEditModal').addEventListener('click', cerrarEditModal);
document.getElementById('editModalCancelBtn').addEventListener('click', cerrarEditModal);
document.getElementById('editModalBackdrop').addEventListener('click', cerrarEditModal);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) cerrarEditModal();
});

// Guardar edición desde el modal
editProductForm.addEventListener('submit', e => {
    e.preventDefault();

    if ((editCantPromo.value.trim() === '') !== (editPrcPromo.value.trim() === '')) {
        alert('Para la promo por pack completa la cantidad Y el precio, o deja ambos en blanco.');
        return;
    }
    if ((editCantMayorista.value.trim() === '') !== (editPrcMayorista.value.trim() === '')) {
        alert('Para el precio mayorista completa la cantidad Y el precio, o deja ambos en blanco.');
        return;
    }
    if (!editPrecio.value.trim() && !editPrcMayorista.value.trim() && !editPrcPromo.value.trim()) {
        alert('Ingresa al menos un precio: normal, mayorista o promo por pack.');
        return;
    }

    const idEditar = Number(editProductId.value);

    const editado = {
        id:                idEditar,
        nombre:            editNombre.value.trim(),
        categoria:         editCategoriaSelect.value.trim(),
        precio:            editPrecio.value.trim() === '' ? null : Number(editPrecio.value),
        stock:             editStock.value.trim() === '' ? null : Number(editStock.value),
        imagen:            editImagen.value.trim(),
        descripcion:       editDescripcion.value.trim(),
        destacado:         editDestacado.checked,
        enOferta:          editEnOferta.checked,
        precioOferta:      editPrecioOferta.value.trim() === '' ? null : Number(editPrecioOferta.value),
        precioMayorista:   editPrcMayorista.value.trim() === '' ? null : Number(editPrcMayorista.value),
        cantidadMayorista: editCantMayorista.value.trim() === '' ? null : Number(editCantMayorista.value),
        precioPromo:       editPrcPromo.value.trim() === '' ? null : Number(editPrcPromo.value),
        cantidadPromo:     editCantPromo.value.trim() === '' ? null : Number(editCantPromo.value),
        ventaPorPeso:      editVentaPorPeso.checked
    };

    // Lee siempre desde localStorage (fuente fresca) para no depender
    // de que el array en memoria esté sincronizado. Compara como Number
    // para tolerar IDs guardados como string en versiones anteriores.
    const lista = obtenerProductos();
    const idx   = lista.findIndex(p => Number(p.id) === idEditar);

    if (idx === -1) {
        alert('No se encontró el producto. Recarga la página e intenta de nuevo.');
        return;
    }

    lista[idx] = editado;
    productos   = lista; // sincroniza el array en memoria
    guardarProductos(lista);
    cargarTabla();
    actualizarCatalogo();
    cerrarEditModal();
});

/*============================
Editar producto (abre modal)
============================*/

function editarProducto(id) {
    const nId = Number(id);
    const producto = productos.find(p => Number(p.id) === nId);
    if (!producto) return;
    abrirEditModal(producto);
}

/*============================
Eliminar producto
============================*/

function eliminarProducto(id) {
    const nId = Number(id);
    const producto = productos.find(p => Number(p.id) === nId);
    if (!producto) return;
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return;
    productos = productos.filter(p => Number(p.id) !== nId);
    guardarProductos(productos);
    cargarTabla();
    actualizarCatalogo();
}

/*============================
Filtrar tabla (texto + categoría + estado)
============================*/

function filtrarTabla() {
    const texto  = buscar.value.toLowerCase().trim();
    const cat    = filtroCategoria ? filtroCategoria.value : '';
    const estado = filtroEstado    ? filtroEstado.value    : '';

    const filtrados = productos.filter(p => {
        if (texto && !(
            p.nombre.toLowerCase().includes(texto) ||
            p.categoria.toLowerCase().includes(texto) ||
            (p.descripcion || '').toLowerCase().includes(texto)
        )) return false;
        if (cat    && p.categoria !== cat)                              return false;
        if (estado === 'destacado' && !p.destacado)                    return false;
        if (estado === 'oferta'    && !(p.enOferta && p.precioOferta)) return false;
        if (estado === 'peso'      && !p.ventaPorPeso)                 return false;
        if (estado === 'sinstock'  && (p.stock === null || p.stock === undefined || p.stock > 0)) return false;
        return true;
    });

    tablaProductos.innerHTML = filtrados.map(filaHTML).join('');
}

buscar.addEventListener('input', filtrarTabla);
if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarTabla);
if (filtroEstado)    filtroEstado.addEventListener('change',    filtrarTabla);

/*============================
Categorías (crear / renombrar / eliminar).
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

// Actualiza el select de filtro de la barra de búsqueda
function cargarFiltroCategoria() {
    if (!filtroCategoria) return;
    const seleccionada = filtroCategoria.value;
    const cats = todasLasCategorias();
    filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' +
        cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if (seleccionada && cats.includes(seleccionada)) filtroCategoria.value = seleccionada;
}

// Renombra una categoría: actualiza todos los productos + la lista de categorías
function renombrarCategoria(antigua, nueva) {
    nueva = nueva.trim();
    if (!nueva || nueva === antigua) { renderizarCategoriasAdmin(); return; }
    const existentes = todasLasCategorias();
    if (existentes.some(c => c.toLowerCase() === nueva.toLowerCase() && c !== antigua)) {
        alert(`Ya existe una categoría llamada "${nueva}".`);
        renderizarCategoriasAdmin();
        return;
    }
    const lista = obtenerProductos().map(p =>
        p.categoria === antigua ? { ...p, categoria: nueva } : p
    );
    guardarProductos(lista);
    productos = lista;
    saveCategorias(existentes.map(c => c === antigua ? nueva : c));
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
            <button class="btn-edit btn-rename-cat" data-cat="${escapeHTML(cat)}" title="Renombrar">
                <i class="ri-edit-line"></i>
            </button>
            <button class="btn-delete btn-delete-cat" data-cat="${escapeHTML(cat)}" title="Eliminar">
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
    // Renombrar → activa edición inline
    const renameBtn = e.target.closest('.btn-rename-cat');
    if (renameBtn) {
        const cat  = renameBtn.dataset.cat;
        const item = renameBtn.closest('.categoria-item');
        item.innerHTML = `
            <i class="ri-price-tag-3-line" style="color:#800020;font-size:1.1rem;flex-shrink:0;"></i>
            <input class="rename-cat-input" value="${escapeHTML(cat)}" maxlength="40">
            <button class="btn-confirm-rename" data-oldcat="${escapeHTML(cat)}" title="Guardar">
                <i class="ri-check-line"></i>
            </button>
            <button class="btn-cancel-rename" title="Cancelar">
                <i class="ri-close-line"></i>
            </button>`;
        const inp = item.querySelector('.rename-cat-input');
        inp.focus();
        inp.select();
        return;
    }

    // Confirmar renombrado
    const confirmBtn = e.target.closest('.btn-confirm-rename');
    if (confirmBtn) {
        const item   = confirmBtn.closest('.categoria-item');
        const oldCat = confirmBtn.dataset.oldcat;
        const newCat = item.querySelector('.rename-cat-input').value;
        renombrarCategoria(oldCat, newCat);
        return;
    }

    // Cancelar renombrado
    if (e.target.closest('.btn-cancel-rename')) {
        renderizarCategoriasAdmin();
        return;
    }

    // Eliminar
    const deleteBtn = e.target.closest('.btn-delete-cat');
    if (!deleteBtn) return;
    const cat  = deleteBtn.dataset.cat;
    const usos = productos.filter(p => p.categoria === cat).length;
    if (usos > 0) {
        alert(`No se puede eliminar "${cat}": la usan ${usos} producto${usos === 1 ? '' : 's'}.\nCambia primero esos productos a otra categoría.`);
        return;
    }
    if (!confirm(`¿Eliminar la categoría "${cat}"?`)) return;
    saveCategorias(todasLasCategorias().filter(c => c !== cat));
});

// Enter / Escape en el input de renombrar
document.getElementById('listaCategorias')?.addEventListener('keydown', e => {
    if (!e.target.classList.contains('rename-cat-input')) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        e.target.closest('.categoria-item').querySelector('.btn-confirm-rename')?.click();
    } else if (e.key === 'Escape') {
        renderizarCategoriasAdmin();
    }
});

// saveCategorias y la sincronización con Firestore disparan este evento
document.addEventListener('categoriasActualizadas', () => {
    renderizarCategoriasAdmin();
    cargarSelectCategorias();
    cargarFiltroCategoria();
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

    // Los pedidos los crea el cliente anónimo: todo campo de texto
    // se escapa para evitar XSS almacenado contra el panel admin.
    tbody.innerHTML = orders.map(order => {
        const prods = order.productos
            .map(p => `${escapeHTML(p.nombre)} ×${escapeHTML(p.cantidad)}`)
            .join(', ');
        return `
        <tr>
            <td>${escapeHTML(order.fecha)}</td>
            <td>${escapeHTML(order.cliente)}</td>
            <td style="max-width:260px;font-size:.88rem;">${prods}</td>
            <td><strong>$${Number(order.total).toLocaleString('es-CL')}</strong></td>
            <td>${escapeHTML(order.entrega)}${order.direccion ? `<br><small>${escapeHTML(order.direccion)}</small>` : ''}${order.horaRetiro ? `<br><small>⏰ Retiro: ${escapeHTML(order.horaRetiro)}</small>` : ''}</td>
            <td>${escapeHTML(order.pago)}</td>
        </tr>`;
    }).join('');
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
document.addEventListener('productosActualizados', cargarTablaDebounced);
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
