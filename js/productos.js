function obtenerProductos() {
    return JSON.parse(localStorage.getItem('productos')) || [];
}

function guardarProductos(lista) {
    try {
        localStorage.setItem('productos', JSON.stringify(lista));
    } catch (e) {
        // Cuota de localStorage llena (demasiadas imágenes en base64):
        // se avisa en vez de fallar en silencio; la nube igual se intenta.
        alert('No se pudo guardar la caché local (espacio lleno). Los cambios se intentarán guardar en la nube igualmente.');
        console.error('[productos] localStorage lleno:', e);
    }
    if (window.FirebaseDB) window.FirebaseDB.guardarProductos(lista);
}

function cargarProductosIniciales() {
    if (obtenerProductos().length > 0) return;
    guardarProductos([
        {
            id: 1,
            nombre: 'Aceite Maravilla 1L',
            categoria: 'Alimentos',
            precio: 2490,
            stock: 48,
            imagen: 'https://placehold.co/300x300/8D6E63/white?text=Aceite',
            descripcion: 'Aceite de maravilla ideal para cocinar y frituras.',
            destacado: true,
            precioMayorista: 2100,
            cantidadMayorista: 6
        },
        {
            id: 2,
            nombre: 'Arroz Grado 1 – 1 kg',
            categoria: 'Alimentos',
            precio: 1590,
            stock: 100,
            imagen: 'https://placehold.co/300x300/A5956B/white?text=Arroz',
            descripcion: 'Arroz grado 1, ideal para todo tipo de preparaciones.',
            destacado: false,
            precioMayorista: 1300,
            cantidadMayorista: 10
        },
        {
            id: 3,
            nombre: 'Leche Entera 1L',
            categoria: 'Lácteos',
            precio: 1290,
            stock: 60,
            imagen: 'https://placehold.co/300x300/D4C5A9/333?text=Leche',
            descripcion: 'Leche entera pasteurizada. Ideal para el desayuno.',
            destacado: false,
            precioMayorista: 1050,
            cantidadMayorista: 12
        },
        {
            id: 4,
            nombre: 'Yogur Natural 1 kg',
            categoria: 'Lácteos',
            precio: 2200,
            stock: 30,
            imagen: 'https://placehold.co/300x300/F5F0E8/8D6E63?text=Yogur',
            descripcion: 'Yogur natural cremoso, ideal para desayunos y snacks.',
            destacado: false,
            precioMayorista: null,
            cantidadMayorista: null
        },
        {
            id: 5,
            nombre: 'Jamón de Pavo 100 g',
            categoria: 'Fiambres',
            precio: 990,
            stock: 40,
            imagen: 'https://placehold.co/300x300/C49A6C/white?text=Jamon',
            descripcion: 'Jamón de pavo laminado, bajo en grasa. Ideal para sándwiches.',
            destacado: true,
            precioMayorista: 800,
            cantidadMayorista: 5
        },
        {
            id: 6,
            nombre: 'Coca-Cola 1.5L',
            categoria: 'Bebidas',
            precio: 1890,
            precioOferta: 1490,
            enOferta: true,
            stock: 72,
            imagen: 'https://placehold.co/300x300/C0392B/white?text=Coca-Cola',
            descripcion: 'Bebida Coca-Cola, botella 1.5 litros.',
            destacado: false,
            precioMayorista: 1200,
            cantidadMayorista: 6
        },
        {
            id: 7,
            nombre: 'Agua Mineral 500 ml',
            categoria: 'Bebidas',
            precio: 590,
            stock: null,
            imagen: 'https://placehold.co/300x300/87CEEB/white?text=Agua',
            descripcion: 'Agua mineral sin gas, 500 ml. Fresca y natural.',
            destacado: false,
            precioMayorista: 450,
            cantidadMayorista: 24
        },
        {
            id: 8,
            nombre: 'Alfajor Chocolate',
            categoria: 'Dulces',
            precio: 490,
            stock: 200,
            imagen: 'https://placehold.co/300x300/6B3A2A/white?text=Alfajor',
            descripcion: 'Alfajor bañado en chocolate con manjar.',
            destacado: false,
            precioMayorista: 380,
            cantidadMayorista: 12
        },
        {
            id: 9,
            nombre: 'Galletas Chocolate 150 g',
            categoria: 'Dulces',
            precio: 1190,
            stock: 80,
            imagen: 'https://placehold.co/300x300/5C3317/white?text=Galletas',
            descripcion: 'Galletas crocantes con trozos de chocolate, 150 g.',
            destacado: false,
            precioMayorista: 950,
            cantidadMayorista: 6
        },
        {
            id: 10,
            nombre: 'Queso Gauda Laminado 150 g',
            categoria: 'Lácteos',
            precio: 1890,
            stock: 25,
            imagen: 'https://placehold.co/300x300/F4D03F/333?text=Queso',
            descripcion: 'Queso gauda en láminas, ideal para sándwiches.',
            destacado: true,
            precioMayorista: 1600,
            cantidadMayorista: 4
        }
    ]);
}

// Seed sincrónico: corre antes de cualquier DOMContentLoaded
cargarProductosIniciales();
