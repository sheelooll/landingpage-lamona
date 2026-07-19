/*=========================================
CATALOGO.JS
=========================================*/

let productos = [];
let productosFiltrados = [];
let categoriaActual = 'Todos';
let textoBusqueda = '';

// Paginación
const PRODUCTOS_POR_PAGINA = 20;
let paginaActual = 1;

const productsContainer  = document.getElementById('productsContainer');
const searchInput        = document.getElementById('searchInput');
const chipsContainer     = document.getElementById('chipsContainer');
const resultCount        = document.getElementById('resultCount');
const emptyProducts      = document.getElementById('emptyProducts');
const paginationControls = document.getElementById('paginationControls');
const paginationInfo     = document.getElementById('paginationInfo');

/*============================
Cargar productos
============================*/

function cargarProductos() {
    productos = obtenerProductos();
    if (!Array.isArray(productos)) productos = [];
    productosFiltrados = [...productos];
}

/*============================
Render principal
============================*/

function renderizarProductos(lista = productosFiltrados) {
    if (!productsContainer) return;
    productsContainer.innerHTML = '';

    if (lista.length === 0) {
        mostrarSinResultados();
        renderizarPaginacion(0);
        return;
    }

    ocultarSinResultados();

    // Solo se pinta la página actual (20 productos)
    const totalPaginas = Math.ceil(lista.length / PRODUCTOS_POR_PAGINA);
    paginaActual = Math.min(Math.max(paginaActual, 1), totalPaginas);
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const visibles = lista.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    visibles.forEach(p => { productsContainer.innerHTML += crearTarjetaProducto(p); });
    actualizarContadorCatalogo(lista.length, inicio + 1, inicio + visibles.length);
    renderizarPaginacion(totalPaginas);
    agregarEventosProductos();
    iniciarAnimaciones();
}

/*============================
Paginación (20 por página, sin recargar)
============================*/

function renderizarPaginacion(totalPaginas) {
    if (!paginationControls) return;

    if (totalPaginas <= 1) {
        paginationControls.innerHTML = '';
        if (paginationInfo) paginationInfo.textContent = '';
        return;
    }

    // Números visibles: primera, última y una ventana alrededor de la actual
    const nums = new Set([1, totalPaginas]);
    for (let n = paginaActual - 2; n <= paginaActual + 2; n++) {
        if (n >= 1 && n <= totalPaginas) nums.add(n);
    }
    const ordenados = [...nums].sort((a, b) => a - b);

    let html = `<button data-action="prev" ${paginaActual === 1 ? 'disabled' : ''}>
                    <i class="ri-arrow-left-s-line"></i> Anterior
                </button>`;
    let anterior = 0;
    for (const n of ordenados) {
        if (n - anterior > 1) html += '<span class="pagination__ellipsis">…</span>';
        html += `<button data-page="${n}" class="${n === paginaActual ? 'active' : ''}">${n}</button>`;
        anterior = n;
    }
    html += `<button data-action="next" ${paginaActual === totalPaginas ? 'disabled' : ''}>
                Siguiente <i class="ri-arrow-right-s-line"></i>
             </button>`;
    paginationControls.innerHTML = html;

    if (paginationInfo) {
        paginationInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    }
}

function irAPagina(pagina) {
    paginaActual = pagina;
    renderizarProductos(productosFiltrados);
    const catalogo = document.getElementById('catalogo');
    if (catalogo) catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (paginationControls) {
    paginationControls.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;
        if (btn.dataset.action === 'prev') irAPagina(paginaActual - 1);
        else if (btn.dataset.action === 'next') irAPagina(paginaActual + 1);
        else if (btn.dataset.page) irAPagina(Number(btn.dataset.page));
    });
}

/*============================
Tarjeta de producto
============================*/

function crearTarjetaProducto(producto) {
    // Stock: null/undefined/'' = ilimitado
    const stockNum = (producto.stock === null || producto.stock === undefined || producto.stock === '')
        ? null : Number(producto.stock);
    const agotado  = stockNum !== null && stockNum <= 0;
    const esOferta = !!(producto.enOferta && producto.precioOferta);

    // Badge: OFERTA tiene prioridad visual sobre Destacado
    const badge = esOferta
        ? `<span class="product__badge product__badge--oferta">OFERTA</span>`
        : producto.destacado
            ? `<span class="product__badge">Destacado</span>` : '';

    const stockLabel = agotado
        ? `<span class="product__stock agotado">Agotado</span>`
        : stockNum !== null
            ? `<small class="product__stock-count">Stock: ${stockNum}</small>`
            : '';

    const promo = (producto.precioPromo && producto.cantidadPromo)
        ? `<div class="product__promo">
               <i class="ri-price-tag-2-line"></i>
               ${producto.cantidadPromo} x <strong>$${Number(producto.precioPromo).toLocaleString('es-CL')}</strong>
           </div>`
        : '';

    const mayorista = (producto.precioMayorista && producto.cantidadMayorista)
        ? `<div class="product__mayorista">
               <i class="ri-group-line"></i>
               ${producto.cantidadMayorista} unid. → <strong>$${Number(producto.precioMayorista).toLocaleString('es-CL')}</strong> c/u
           </div>`
        : '';

    const precioHTML = esOferta
        ? `<div class="product__price-group">
               <del class="product__price-old">$${Number(producto.precio).toLocaleString('es-CL')}</del>
               <div class="product__price product__price--oferta">$${Number(producto.precioOferta).toLocaleString('es-CL')}</div>
           </div>`
        : `<div class="product__price">$${Number(producto.precio).toLocaleString('es-CL')}</div>`;

    return `
    <article class="product fade-up">
        <div class="product__image">
            ${badge}
            <img src="${escapeHTML(producto.imagen)}" alt="${escapeHTML(producto.nombre)}" data-producto-id="${producto.id}" loading="lazy">
        </div>
        <div class="product__content">
            <span class="product__category">${escapeHTML(producto.categoria)}</span>
            <h3 class="product__title">${escapeHTML(producto.nombre)}</h3>
            <p class="product__description">${escapeHTML(producto.descripcion)}</p>
            <div class="product__bottom">
                <div>
                    ${precioHTML}
                    ${promo}
                    ${mayorista}
                    ${stockLabel}
                </div>
                <div class="product__cart-area" data-id="${producto.id}">
                    ${controlCarritoHTML(producto)}
                </div>
            </div>
        </div>
    </article>`;
}

/*============================
Control de carrito en la tarjeta:
selector de cantidad (local) +
botón que envía esa cantidad
============================*/

function controlCarritoHTML(producto) {
    const stockNum = (producto.stock === null || producto.stock === undefined || producto.stock === '')
        ? null : Number(producto.stock);
    const agotado = stockNum !== null && stockNum <= 0;

    if (agotado) {
        return `
        <button class="product__button" disabled>
            <i class="ri-close-line"></i>
        </button>`;
    }

    return `
    <div class="product__qty">
        <button class="qty-minus" aria-label="Menos cantidad">−</button>
        <span class="qty-value">1</span>
        <button class="qty-plus" aria-label="Más cantidad">+</button>
    </div>
    <button class="product__button add-cart-btn" data-id="${producto.id}" title="Agregar al carrito">
        <i class="ri-shopping-cart-2-line"></i>
    </button>`;
}

/*============================
Eventos botones
============================*/

let eventosProductosListos = false;

function agregarEventosProductos() {
    // Delegación: un solo listener sirve para los botones de agregar
    // y los steppers +/− aunque se refresquen dinámicamente
    if (eventosProductosListos || !productsContainer) return;
    eventosProductosListos = true;

    productsContainer.addEventListener('click', e => {
        const area = e.target.closest('.product__cart-area');
        if (!area) return;

        const valor = area.querySelector('.qty-value');

        // +/− solo cambian el selector local de la tarjeta
        if (e.target.closest('.qty-plus') && valor) {
            const producto = productos.find(p => p.id === Number(area.dataset.id));
            const max = (producto && producto.stock !== null && producto.stock !== undefined)
                ? Number(producto.stock) : Infinity;
            valor.textContent = Math.min(Number(valor.textContent) + 1, max);
            return;
        }
        if (e.target.closest('.qty-minus') && valor) {
            valor.textContent = Math.max(Number(valor.textContent) - 1, 1);
            return;
        }

        // El botón de carrito envía la cantidad seleccionada y resetea a 1
        const add = e.target.closest('.add-cart-btn');
        if (add && window.carrito) {
            const cantidad = valor ? Number(valor.textContent) : 1;
            window.carrito.agregar(Number(add.dataset.id), cantidad);
            if (valor) valor.textContent = '1';
        }
    });
}

/*============================
Skeleton loading
============================*/

function mostrarSkeleton(cantidad = 8) {
    if (!productsContainer) return;
    productsContainer.innerHTML = '';
    for (let i = 0; i < cantidad; i++) {
        productsContainer.innerHTML += `
        <article class="skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>
        </article>`;
    }
}

/*============================
Contador
============================*/

function actualizarContadorCatalogo(total, desde, hasta) {
    if (!resultCount) return;
    if (total === 0) { resultCount.textContent = 'Mostrando 0 productos'; return; }
    if (total === 1) { resultCount.textContent = 'Mostrando 1 producto'; return; }
    resultCount.textContent = (desde && hasta && total > PRODUCTOS_POR_PAGINA)
        ? `Mostrando ${desde}–${hasta} de ${total} productos`
        : `Mostrando ${total} productos`;
}

/*============================
Sin resultados
============================*/

function mostrarSinResultados() {
    if (!productsContainer) return;
    productsContainer.style.display = 'none';
    if (emptyProducts) emptyProducts.classList.add('show');
    actualizarContadorCatalogo(0);
}

function ocultarSinResultados() {
    if (!productsContainer) return;
    productsContainer.style.display = 'grid';
    if (emptyProducts) emptyProducts.classList.remove('show');
}

/*============================
Búsqueda
============================*/

function buscarProductos(texto) {
    textoBusqueda = texto.toLowerCase().trim();
    paginaActual = 1;
    aplicarFiltros();
}

/*============================
Filtro de categoría
============================*/

function filtrarCategoria(categoria) {
    categoriaActual = categoria;
    paginaActual = 1;
    actualizarCategoriaActiva();
    aplicarFiltros();
}

/*============================
Aplicar filtros
============================*/

function aplicarFiltros() {
    productosFiltrados = productos.filter(p => {
        const coincideBusqueda = p.nombre.toLowerCase().includes(textoBusqueda)
            || p.descripcion.toLowerCase().includes(textoBusqueda);
        const coincideCategoria = categoriaActual === 'Todos' || p.categoria === categoriaActual;
        return coincideBusqueda && coincideCategoria;
    });
    renderizarProductos(productosFiltrados);
}

/*============================
Chips de categoría (dentro del catálogo)
============================*/

function renderizarCategorias() {
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';
    // Categorías administradas desde el panel admin (storage.js) más las
    // que aún usen los productos, por si quedó alguna antigua sin registrar
    const administradas = typeof getCategorias === 'function' ? getCategorias() : [];
    const cats = ['Todos', ...new Set([
        ...administradas,
        ...productos.map(p => p.categoria).filter(Boolean)
    ])];
    // Si la categoría filtrada ya no existe (la eliminaron), se vuelve a 'Todos'
    if (!cats.includes(categoriaActual)) {
        categoriaActual = 'Todos';
        aplicarFiltros();
    }
    cats.forEach(cat => {
        chipsContainer.innerHTML += `
        <button class="chip ${cat === categoriaActual ? 'active' : ''}" data-categoria="${escapeHTML(cat)}">
            ${escapeHTML(cat)}
        </button>`;
    });
    agregarEventosCategorias();
}

function agregarEventosCategorias() {
    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrarCategoria(btn.dataset.categoria);
        });
    });
}

function actualizarCategoriaActiva() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.categoria === categoriaActual);
    });
}

/*============================
Ordenar
============================*/

function ordenarPrecio(modo = 'asc') {
    productosFiltrados.sort((a, b) => modo === 'asc' ? a.precio - b.precio : b.precio - a.precio);
    renderizarProductos(productosFiltrados);
}

function ordenarNombre() {
    productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    renderizarProductos(productosFiltrados);
}

function ordenarStock() {
    productosFiltrados.sort((a, b) => (b.stock ?? Infinity) - (a.stock ?? Infinity));
    renderizarProductos(productosFiltrados);
}

/*============================
Animaciones IntersectionObserver
============================*/

function iniciarAnimaciones() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
    }, { threshold: 0.12 });

    document.querySelectorAll('.fade-up,.fade-left,.fade-right,.zoom').forEach(el => {
        observer.observe(el);
    });
}

/*============================
Recargar catálogo
============================*/

function recargarCatalogo() {
    cargarProductos();
    renderizarCategorias();
    aplicarFiltros();
}

/*============================
Escuchar cambios externos
============================*/

window.addEventListener('storage', recargarCatalogo);
document.addEventListener('productosActualizados', recargarCatalogo);
document.addEventListener('categoriasActualizadas', renderizarCategorias);

/*============================
Búsqueda: evento input
============================*/

if (searchInput) {
    searchInput.addEventListener('input', e => buscarProductos(e.target.value));
}

/*============================
Inicializar
============================*/

function initCatalogo() {
    // En páginas sin catálogo (p. ej. index) solo se cargan los datos
    // para que el carrito y otras utilidades funcionen
    if (!productsContainer) {
        cargarProductos();
        return;
    }
    mostrarSkeleton();
    setTimeout(() => {
        cargarProductos();
        renderizarCategorias();
        renderizarProductos();
    }, 300);
}

document.addEventListener('DOMContentLoaded', initCatalogo);

/*============================
Utilidades
============================*/

function obtenerProducto(id)    { return productos.find(p => p.id === id); }
function obtenerDestacados()    { return productos.filter(p => p.destacado); }
function obtenerUltimos(n = 8)  { return [...productos].reverse().slice(0, n); }
function obtenerDisponibles()   { return productos.filter(p => p.stock === null || p.stock > 0); }
function obtenerAgotados()      { return productos.filter(p => p.stock !== null && p.stock <= 0); }

/*============================
API pública
============================*/

window.catalogo = {
    recargar: recargarCatalogo,
    renderizar: renderizarProductos,
    buscar: buscarProductos,
    filtrar: filtrarCategoria,
    ordenarNombre,
    ordenarPrecio,
    ordenarStock,
    obtenerProducto
};
