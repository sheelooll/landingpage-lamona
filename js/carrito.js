/*====================================
   CARRITO.JS
====================================*/

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
    if (item.precio != null) return item.precio;
    // Sin precio unitario: las unidades sueltas se cobran al precio
    // mayorista o al prorrateo del pack, según lo que tenga el producto
    if (item.precioMayorista) return item.precioMayorista;
    if (item.precioPromo && item.cantidadPromo) {
        return Math.round(item.precioPromo / item.cantidadPromo);
    }
    return 0;
}

/*============================
Promo por pack (ej: 3 x $1.000):
aplica si el ítem la tiene, alcanza la
cantidad y no rige el precio mayorista
(el mayoreo mantiene su prioridad).
============================*/

function promoAplica(item) {
    const esMayoreo = !!(item.precioMayorista && item.cantidadMayorista
                       && item.cantidad >= item.cantidadMayorista);
    return !esMayoreo && !!(item.precioPromo && item.cantidadPromo
                          && item.cantidad >= item.cantidadPromo);
}

/*============================
Subtotal de un ítem. Con promo:
packs completos al precio del pack,
unidades sueltas al precio unitario.
============================*/

function subtotalItem(item) {
    if (!promoAplica(item)) return precioEfectivo(item) * item.cantidad;
    const packs = Math.floor(item.cantidad / item.cantidadPromo);
    const resto = item.cantidad % item.cantidadPromo;
    return packs * item.precioPromo + resto * precioEfectivo(item);
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

function agregarAlCarrito(id, cantidad = 1, especificacion = '') {
    const producto = buscarProducto(id);
    if (!producto) return;
    cantidad = Math.max(1, Number(cantidad) || 1);

    // Productos por peso: cada especificación es un ítem único
    const existe = especificacion
        ? carrito.find(p => p.id === id && p.especificacion === especificacion)
        : carrito.find(p => p.id === id && !p.especificacion);

    if (existe) {
        if (especificacion) {
            // Para peso, agregar de nuevo con misma spec actualiza la spec (última pedida)
            existe.especificacion = especificacion;
        } else {
            existe.cantidad += cantidad;
        }
    } else {
        carrito.push({
            id:               producto.id,
            nombre:           producto.nombre,
            precio:           producto.precio,
            precioOferta:     producto.precioOferta     || null,
            enOferta:         !!(producto.enOferta && producto.precioOferta),
            precioMayorista:  producto.precioMayorista  || null,
            cantidadMayorista:producto.cantidadMayorista|| null,
            precioPromo:      producto.precioPromo      || null,
            cantidadPromo:    producto.cantidadPromo    || null,
            imagen:           producto.imagen,
            ventaPorPeso:     !!producto.ventaPorPeso,
            especificacion:   especificacion,
            cantidad:         cantidad
        });
    }

    guardarCarrito();
    renderizarCarrito();
    mostrarToast(especificacion
        ? `${escapeHTML(producto.nombre)} agregado al carrito`
        : cantidad > 1
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
        const esPromo    = promoAplica(producto);
        const esOfertaUI = !esMayoreo && !esPromo && !!(producto.enOferta && producto.precioOferta);

        // Etiqueta de precio especial
        let precioBadge = '';
        if (esMayoreo) {
            precioBadge = `<div class="cart-item__badge mayoreo-label">
                               <i class="ri-group-line"></i> precio mayoreo
                           </div>`;
        } else if (esPromo) {
            precioBadge = `<div class="cart-item__badge promo-label">
                               <i class="ri-price-tag-2-line"></i> promo ${producto.cantidadPromo} x $${Number(producto.precioPromo).toLocaleString('es-CL')}
                           </div>`;
        } else if (esOfertaUI) {
            precioBadge = `<div class="cart-item__badge oferta-label">
                               <i class="ri-price-tag-3-line"></i> en oferta
                           </div>`;
        }

        // Con promo el precio unitario no es uniforme: se muestra el subtotal
        const precioLinea = esPromo
            ? `$${subtotalItem(producto).toLocaleString('es-CL')}`
            : `$${pEfectivo.toLocaleString('es-CL')} c/u`;

        const especHTML = producto.especificacion
            ? `<div class="cart-item__spec"><i class="ri-scissors-cut-line"></i> ${escapeHTML(producto.especificacion)}</div>`
            : '';

        cartItems.innerHTML += `
        <article class="cart-item">
            <img src="${escapeHTML(producto.imagen)}" alt="${escapeHTML(producto.nombre)}">
            <div class="cart-item__info">
                <div>
                    <div class="cart-item__title">${escapeHTML(producto.nombre)}</div>
                    ${especHTML}
                    <div class="cart-item__price${esMayoreo ? ' mayoreo' : esPromo ? ' promo' : esOfertaUI ? ' oferta' : ''}">
                        ${precioLinea}
                    </div>
                    ${precioBadge}
                </div>
                <div class="cart-item__actions">
                    ${producto.ventaPorPeso ? '' : `
                    <div class="quantity">
                        <button onclick="disminuirCantidad(${producto.id})">-</button>
                        <span>${producto.cantidad}</span>
                        <button onclick="aumentarCantidad(${producto.id})">+</button>
                    </div>`}
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
    return carrito.reduce((total, p) => total + subtotalItem(p), 0);
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
                subtotal:  subtotalItem(p),
                mayoreo:   !!(p.precioMayorista && p.cantidadMayorista && p.cantidad >= p.cantidadMayorista),
                promo:     promoAplica(p),
                enOferta:  !!(p.enOferta && p.precioOferta)
            })),
            total: calcularTotal()
        });
    }

    // Armar mensaje WhatsApp: se escribe como texto plano (con los
    // emojis reales) y se codifica UNA sola vez al final. Codificar a
    // mano por partes provocaba dobles codificaciones y los emojis
    // llegaban como %F0%9F... en vez de mostrarse.
    let texto = 'Hola 👋\n\n';
    texto += `*Pedido de ${nombre}*\n\n`;
    texto += '📦 *Productos:*\n';
    carrito.forEach(p => {
        const esMayoreo = !!(p.precioMayorista && p.cantidadMayorista && p.cantidad >= p.cantidadMayorista);
        const tag = esMayoreo
            ? ' — precio mayoreo'
            : promoAplica(p)
                ? ` — promo ${p.cantidadPromo} x $${Number(p.precioPromo).toLocaleString('es-CL')}`
                : (p.enOferta && p.precioOferta ? ' — oferta' : '');
        if (p.ventaPorPeso && p.especificacion) {
            texto += `• ${p.nombre} — ${p.especificacion} → $${subtotalItem(p).toLocaleString('es-CL')}${tag}\n`;
        } else {
            texto += `• ${p.nombre} x${p.cantidad} → $${subtotalItem(p).toLocaleString('es-CL')}${tag}\n`;
        }
    });
    texto += `\n💵 *Total: $${calcularTotal().toLocaleString('es-CL')}*\n`;
    texto += `\n🚚 *Entrega:* ${entrega}\n`;
    if (direccion) {
        texto += `📍 *Dirección:* ${direccion}\n`;
    }
    if (horaRetiro) {
        texto += `⏰ *Hora de retiro:* ${horaRetiro}\n`;
    }
    texto += `💳 *Pago:* ${pago}`;

    // Número de WhatsApp configurable desde el panel admin (storage.js)
    const wsNum = encodeURIComponent(getContacto().whatsapp);
    window.open(`https://wa.me/${wsNum}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');

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
