/*====================================
   CARRITO.JS
====================================*/

const TELEFONO = '56991024435';

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

const cart        = document.getElementById('cart');
const cartItems   = document.getElementById('cartItems');
const cartTotal   = document.getElementById('cartTotal');
const cartCounter = document.getElementById('cartCounter');
const checkoutBtn = document.getElementById('checkoutBtn');
const closeCart   = document.getElementById('closeCart');
const openCart    = document.getElementById('openCart');

/*============================
Guardar
============================*/

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

/*============================
Overlay helper
============================*/

function setOverlay(active) {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.toggle('active', active);
}

/*============================
Abrir / Cerrar carrito
============================*/

function abrirCarrito() {
    if (cart) cart.classList.add('active');
    setOverlay(true);
}

function cerrarCarrito() {
    if (cart) cart.classList.remove('active');
    setOverlay(false);
}

/*============================
Toast "producto agregado"
============================*/

function mostrarToast(msg) {
    const toast = document.getElementById('addToCartToast');
    if (!toast) return;
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

/*============================
Precio efectivo por unidad
(mayoreo > oferta > normal)
============================*/

function precioEfectivo(item) {
    if (item.precioMayorista && item.cantidadMayorista && item.cantidad >= item.cantidadMayorista) {
        return item.precioMayorista;
    }
    if (item.enOferta && item.precioOferta) {
        return item.precioOferta;
    }
    return item.precio;
}

/*============================
Buscar producto en localStorage
============================*/

function buscarProducto(id) {
    return obtenerProductos().find(p => p.id === id);
}

/*============================
Cantidad de un producto en el carrito
(la usan las tarjetas del catálogo)
============================*/

function cantidadEnCarrito(id) {
    const p = carrito.find(p => p.id === id);
    return p ? p.cantidad : 0;
}

/*============================
Agregar producto
(NO abre el carrito automáticamente)
============================*/

function agregarAlCarrito(id, cantidad = 1) {
    const producto = buscarProducto(id);
    if (!producto) return;
    cantidad = Math.max(1, Number(cantidad) || 1);

    const existe = carrito.find(p => p.id === id);
    if (existe) {
        existe.cantidad += cantidad;
    } else {
        carrito.push({
            id:               producto.id,
            nombre:           producto.nombre,
            precio:           producto.precio,
            precioOferta:     producto.precioOferta     || null,
            enOferta:         !!(producto.enOferta && producto.precioOferta),
            precioMayorista:  producto.precioMayorista  || null,
            cantidadMayorista:producto.cantidadMayorista|| null,
            imagen:           producto.imagen,
            cantidad:         cantidad
        });
    }

    guardarCarrito();
    renderizarCarrito();
    mostrarToast(cantidad > 1
        ? `${cantidad} productos agregados al carrito`
        : 'Producto agregado al carrito');
    // NO se llama abrirCarrito(): el cliente decide cuándo abrirlo
}

/*============================
Vaciar carrito
============================*/

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
}

/*============================
Render
============================*/

function renderizarCarrito() {
    if (!cartItems) return;
    cartItems.innerHTML = '';

    if (carrito.length === 0) {
        cartItems.innerHTML = `
        <div class="cart-empty">
            <i class="ri-shopping-cart-line"></i>
            <h3>Tu carrito está vacío</h3>
            <p>Agrega productos para comenzar.</p>
        </div>`;
        actualizarTotal();
        actualizarContador();
        document.dispatchEvent(new Event('carritoActualizado'));
        return;
    }

    carrito.forEach(producto => {
        const pEfectivo  = precioEfectivo(producto);
        const esMayoreo  = !!(producto.precioMayorista && producto.cantidadMayorista
                            && producto.cantidad >= producto.cantidadMayorista);
        const esOfertaUI = !esMayoreo && !!(producto.enOferta && producto.precioOferta);

        // Etiqueta de precio especial
        let precioBadge = '';
        if (esMayoreo) {
            precioBadge = `<div class="cart-item__badge mayoreo-label">
                               <i class="ri-group-line"></i> precio mayoreo
                           </div>`;
        } else if (esOfertaUI) {
            precioBadge = `<div class="cart-item__badge oferta-label">
                               <i class="ri-price-tag-3-line"></i> en oferta
                           </div>`;
        }

        cartItems.innerHTML += `
        <article class="cart-item">
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <div class="cart-item__info">
                <div>
                    <div class="cart-item__title">${producto.nombre}</div>
                    <div class="cart-item__price${esMayoreo ? ' mayoreo' : esOfertaUI ? ' oferta' : ''}">
                        $${pEfectivo.toLocaleString('es-CL')} c/u
                    </div>
                    ${precioBadge}
                </div>
                <div class="cart-item__actions">
                    <div class="quantity">
                        <button onclick="disminuirCantidad(${producto.id})">-</button>
                        <span>${producto.cantidad}</span>
                        <button onclick="aumentarCantidad(${producto.id})">+</button>
                    </div>
                    <button class="remove-item" onclick="eliminarDelCarrito(${producto.id})">Eliminar</button>
                </div>
            </div>
        </article>`;
    });

    actualizarTotal();
    actualizarContador();

    // Notifica a las tarjetas del catálogo para que
    // actualicen sus steppers de cantidad
    document.dispatchEvent(new Event('carritoActualizado'));
}

/*============================
Cantidad + / -
============================*/

function aumentarCantidad(id) {
    const p = carrito.find(p => p.id === id);
    if (!p) return;
    p.cantidad++;
    guardarCarrito();
    renderizarCarrito();
}

function disminuirCantidad(id) {
    const p = carrito.find(p => p.id === id);
    if (!p) return;
    p.cantidad--;
    if (p.cantidad <= 0) { eliminarDelCarrito(id); return; }
    guardarCarrito();
    renderizarCarrito();
}

/*============================
Eliminar producto
============================*/

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id !== id);
    guardarCarrito();
    renderizarCarrito();
}

/*============================
Totales
============================*/

function calcularTotal() {
    return carrito.reduce((total, p) => total + precioEfectivo(p) * p.cantidad, 0);
}

function actualizarTotal() {
    if (cartTotal) cartTotal.textContent = '$' + calcularTotal().toLocaleString('es-CL');
}

function actualizarContador() {
    if (!cartCounter) return;
    cartCounter.textContent = carrito.reduce((t, p) => t + p.cantidad, 0);
}

/*============================
Checkout modal
============================*/

function mostrarCheckoutModal() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }
    cerrarCarrito();
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('active');
        setOverlay(true);
    }
}

function procesarCheckout(e) {
    e.preventDefault();

    const nombre   = document.getElementById('clienteNombre').value.trim();
    const entrega  = document.getElementById('metodoEntrega').value;
    const direccion = entrega === 'Delivery'
        ? (document.getElementById('direccionEnvio')?.value.trim() || '')
        : '';
    const horaRetiro = entrega === 'Retiro en tienda'
        ? (document.getElementById('horaRetiro')?.value.trim() || '')
        : '';
    const pago     = document.getElementById('metodoPago').value;

    // Guardar pedido
    if (typeof saveOrder === 'function') {
        saveOrder({
            cliente: nombre,
            entrega,
            direccion,
            horaRetiro,
            pago,
            productos: carrito.map(p => ({
                nombre:    p.nombre,
                cantidad:  p.cantidad,
                precio:    precioEfectivo(p),
                subtotal:  precioEfectivo(p) * p.cantidad,
                mayoreo:   !!(p.precioMayorista && p.cantidadMayorista && p.cantidad >= p.cantidadMayorista),
                enOferta:  !!(p.enOferta && p.precioOferta)
            })),
            total: calcularTotal()
        });
    }

    // Armar mensaje WhatsApp
    let msg = `Hola%20%F0%9F%91%8B%0A%0A`;
    msg += `*Pedido%20de%20${encodeURIComponent(nombre)}*%0A%0A`;
    msg += `%F0%9F%93%A6%20*Productos:*%0A`;
    carrito.forEach(p => {
        const pe = precioEfectivo(p);
        const tag = (p.precioMayorista && p.cantidadMayorista && p.cantidad >= p.cantidadMayorista)
            ? '%20%E2%80%94%20precio%20mayoreo'
            : (p.enOferta && p.precioOferta ? '%20%E2%80%94%20oferta' : '');
        msg += `%E2%80%A2%20${encodeURIComponent(p.nombre)}%20x${p.cantidad}%20%E2%86%92%20%24${(pe * p.cantidad).toLocaleString('es-CL')}${tag}%0A`;
    });
    msg += `%0A%F0%9F%92%B5%20*Total:%20%24${calcularTotal().toLocaleString('es-CL')}*%0A`;
    msg += `%0A%F0%9F%9A%9A%20*Entrega:*%20${encodeURIComponent(entrega)}%0A`;
    if (direccion) {
        msg += `%F0%9F%93%8D%20*Direcci%C3%B3n:*%20${encodeURIComponent(direccion)}%0A`;
    }
    if (horaRetiro) {
        msg += `%E2%8F%B0%20*Hora%20de%20retiro:*%20${encodeURIComponent(horaRetiro)}%0A`;
    }
    msg += `%F0%9F%92%B3%20*Pago:*%20${encodeURIComponent(pago)}`;

    window.open(`https://wa.me/${TELEFONO}?text=${msg}`, '_blank');

    document.getElementById('checkoutModal').classList.remove('active');
    setOverlay(false);
    vaciarCarrito();
    e.target.reset();
    const dg = document.getElementById('direccionGroup');
    if (dg) dg.style.display = 'none';
    const hg = document.getElementById('horaRetiroGroup');
    if (hg) hg.style.display = 'none';
}

/*============================
Eventos
============================*/

if (closeCart) closeCart.addEventListener('click', cerrarCarrito);
if (openCart)  openCart.addEventListener('click', abrirCarrito);
if (checkoutBtn) checkoutBtn.addEventListener('click', mostrarCheckoutModal);

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) checkoutForm.addEventListener('submit', procesarCheckout);

    const metodoEntrega   = document.getElementById('metodoEntrega');
    const direccionGroup  = document.getElementById('direccionGroup');
    const horaRetiroGroup = document.getElementById('horaRetiroGroup');
    if (metodoEntrega) {
        metodoEntrega.addEventListener('change', () => {
            const esDelivery = metodoEntrega.value === 'Delivery';
            const esRetiro   = metodoEntrega.value === 'Retiro en tienda';
            if (direccionGroup) direccionGroup.style.display = esDelivery ? 'block' : 'none';
            const dir = document.getElementById('direccionEnvio');
            if (dir) dir.required = esDelivery;
            if (horaRetiroGroup) horaRetiroGroup.style.display = esRetiro ? 'block' : 'none';
            const hora = document.getElementById('horaRetiro');
            if (hora) hora.required = esRetiro;
        });
    }

    const closeCheckout = document.getElementById('closeCheckoutModal');
    if (closeCheckout) {
        closeCheckout.addEventListener('click', () => {
            document.getElementById('checkoutModal').classList.remove('active');
            setOverlay(false);
        });
    }
});

/*============================
API pública
============================*/

window.carrito = {
    agregar:    agregarAlCarrito,
    eliminar:   eliminarDelCarrito,
    aumentar:   aumentarCantidad,
    disminuir:  disminuirCantidad,
    cantidadDe: cantidadEnCarrito,
    vaciar:     vaciarCarrito,
    abrir:      abrirCarrito,
    cerrar:     cerrarCarrito,
    renderizar: renderizarCarrito
};
