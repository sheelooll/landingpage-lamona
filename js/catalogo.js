/*=========================================
CATALOGO.JS
=========================================*/

let productos = [];
let productosFiltrados = [];
let categoriaActual = 'Todos';
let textoBusqueda = '';

const productsContainer = document.getElementById('productsContainer');
const searchInput       = document.getElementById('searchInput');
const chipsContainer    = document.getElementById('chipsContainer');
const resultCount       = document.getElementById('resultCount');
const emptyProducts     = document.getElementById('emptyProducts');

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
    productsContainer.innerHTML = '';

    if (lista.length === 0) {
        mostrarSinResultados();
        return;
    }

    ocultarSinResultados();
    lista.forEach(p => { productsContainer.innerHTML += crearTarjetaProducto(p); });
    actualizarContadorCatalogo(lista.length);
    agregarEventosProductos();
    iniciarAnimaciones();
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
            <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
        </div>
        <div class="product__content">
            <span class="product__category">${producto.categoria}</span>
            <h3 class="product__title">${producto.nombre}</h3>
            <p class="product__description">${producto.descripcion}</p>
            <div class="product__bottom">
                <div>
                    ${precioHTML}
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

function actualizarContadorCatalogo(total) {
    if (!resultCount) return;
    resultCount.textContent = total === 1 ? 'Mostrando 1 producto' : `Mostrando ${total} productos`;
}

/*============================
Sin resultados
============================*/

function mostrarSinResultados() {
    productsContainer.style.display = 'none';
    if (emptyProducts) emptyProducts.classList.add('show');
    actualizarContadorCatalogo(0);
}

function ocultarSinResultados() {
    productsContainer.style.display = 'grid';
    if (emptyProducts) emptyProducts.classList.remove('show');
}

/*============================
Búsqueda
============================*/

function buscarProductos(texto) {
    textoBusqueda = texto.toLowerCase().trim();
    aplicarFiltros();
}

/*============================
Filtro de categoría
============================*/

function filtrarCategoria(categoria) {
    categoriaActual = categoria;
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
    const cats = ['Todos', ...new Set(productos.map(p => p.categoria))];
    cats.forEach(cat => {
        chipsContainer.innerHTML += `
        <button class="chip ${cat === categoriaActual ? 'active' : ''}" data-categoria="${cat}">
            ${cat}
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
    // También actualizar los botones de categoría de la sección visual
    document.querySelectorAll('.category[data-category]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === categoriaActual);
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
    mostrarSkeleton();
    setTimeout(() => {
        cargarProductos();
        renderizarCategorias();
        renderizarProductos();

        // Botones de la sección visual de categorías
        document.querySelectorAll('.category[data-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                filtrarCategoria(btn.dataset.category);
                const catalogo = document.getElementById('catalogo');
                if (catalogo) catalogo.scrollIntoView({ behavior: 'smooth' });
            });
        });
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
