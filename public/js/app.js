const API = {
  async get(url) {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    if (res.status === 401) { window.location.href = '/'; return null; }
    if (!res.ok) { const d = await res.json(); throw new Error(d.msg); }
    return res.json();
  },
  async post(url, body) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(body) });
    if (res.status === 401) { window.location.href = '/'; return null; }
    if (!res.ok) { const d = await res.json(); throw new Error(d.msg); }
    return res.json();
  },
  async put(url, body) {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(body) });
    if (res.status === 401) { window.location.href = '/'; return null; }
    if (!res.ok) { const d = await res.json(); throw new Error(d.msg); }
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    if (res.status === 401) { window.location.href = '/'; return null; }
    if (!res.ok) { const d = await res.json(); throw new Error(d.msg); }
    return res.json();
  }
};

let carrito = [];
let ultimaVentaId = null;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/'; return; }
  const userData = JSON.parse(localStorage.getItem('usuario') || '{}');
  document.querySelector('#userInfo').innerHTML = `<strong>${userData.nombre || ''}</strong><span>${userData.rol || ''}</span>`;
  initNavigation();
  initPOS();
  initCopias();
  initInventario();
  document.getElementById('btnLogout').addEventListener('click', () => { localStorage.clear(); window.location.href = '/'; });
});

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const modules = document.querySelectorAll('.module');
  const moduleTitle = document.getElementById('moduleTitle');
  const titles = { pos: 'Punto de Venta', copias: 'Copias e Impresiones', inventario: 'Control de Inventario' };
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      modules.forEach(m => m.classList.remove('active'));
      document.getElementById(`mod-${btn.dataset.module}`).classList.add('active');
      moduleTitle.textContent = titles[btn.dataset.module];
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

function initPOS() {
  const inputBuscar = document.getElementById('buscarProducto');
  const btnAgregar = document.getElementById('btnAgregarProducto');
  const carritoBody = document.getElementById('carritoBody');
  const resumenSubtotal = document.getElementById('resumenSubtotal');
  const resumenTotal = document.getElementById('resumenTotal');
  const resumenVuelto = document.getElementById('resumenVuelto');
  const montoPago = document.getElementById('montoPago');
  const metodoPago = document.getElementById('metodoPago');

  let productosCache = [];

  async function buscarProductos(q) {
    try {
      const data = await API.get(`/api/productos?q=${encodeURIComponent(q)}`);
      productosCache = data || [];
      return productosCache;
    } catch { return []; }
  }

  btnAgregar.addEventListener('click', async () => {
    const q = inputBuscar.value.trim();
    if (!q) return;
    const productos = await buscarProductos(q);
    if (productos.length === 0) { alert('Producto no encontrado'); return; }
    const prod = productos[0];
    const existente = carrito.find(p => p._id === prod._id);
    if (existente) {
      if (existente.cantidad >= prod.stock_actual) { alert('Stock insuficiente'); return; }
      existente.cantidad++;
      existente.subtotal = existente.cantidad * existente.precio_venta;
    } else {
      if (prod.stock_actual < 1) { alert('Stock insuficiente'); return; }
      carrito.push({ ...prod, cantidad: 1, subtotal: prod.precio_venta });
    }
    inputBuscar.value = '';
    renderCarrito();
  });

  inputBuscar.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnAgregar.click(); });

  function renderCarrito() {
    carritoBody.innerHTML = '';
    let subtotal = 0;
    carrito.forEach((item, idx) => {
      subtotal += item.subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.nombre}</td>
        <td>$${item.precio_venta.toFixed(2)}</td>
        <td>
          <button class="btn-icon" onclick="cambiarCant(${idx},-1)">-</button>
          ${item.cantidad}
          <button class="btn-icon" onclick="cambiarCant(${idx},1)">+</button>
        </td>
        <td>$${item.subtotal.toFixed(2)}</td>
        <td><button class="btn-icon danger" onclick="eliminarDelCarrito(${idx})">✕</button></td>`;
      carritoBody.appendChild(tr);
    });
    resumenSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    resumenTotal.textContent = `$${subtotal.toFixed(2)}`;
    calcularVuelto();
  }

  window.cambiarCant = (idx, delta) => {
    const item = carrito[idx];
    const nueva = item.cantidad + delta;
    if (nueva < 1) { carrito.splice(idx, 1); }
    else if (nueva > item.stock_actual) { alert('Stock insuficiente'); return; }
    else { item.cantidad = nueva; item.subtotal = nueva * item.precio_venta; }
    renderCarrito();
  };

  window.eliminarDelCarrito = (idx) => { carrito.splice(idx, 1); renderCarrito(); };

  montoPago.addEventListener('input', calcularVuelto);

  function calcularVuelto() {
    const total = parseFloat(resumenTotal.textContent.replace('$', '')) || 0;
    const pago = parseFloat(montoPago.value) || 0;
    resumenVuelto.textContent = `$${Math.max(0, pago - total).toFixed(2)}`;
  }

  document.getElementById('btnConfirmarVenta').addEventListener('click', async () => {
    if (carrito.length === 0) { alert('Agregue productos al carrito'); return; }
    const total = parseFloat(resumenTotal.textContent.replace('$', '')) || 0;
    const pago = parseFloat(montoPago.value) || 0;
    if (pago < total) { alert('El monto recibido debe ser mayor o igual al total'); return; }
    try {
      const detalles = carrito.map(p => ({ producto_id: p._id, cantidad: p.cantidad, precio_unitario: p.precio_venta, subtotal: p.subtotal }));
      const venta = await API.post('/api/ventas', { total, metodo_pago: metodoPago.value, detalles });
      ultimaVentaId = venta._id;
      mostrarTicket(venta);
      carrito = [];
      renderCarrito();
      montoPago.value = '';
      cargarInventario();
    } catch (err) { alert(err.message); }
  });
}

function mostrarTicket(venta) {
  const modal = document.getElementById('ticketModal');
  const content = document.getElementById('ticketContent');
  const fecha = new Date(venta.fecha_hora).toLocaleString('es-MX');
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');
  let html = `${'='.repeat(32)}\n`;
  html += `   PAPELERIA SAMANTHA\n`;
  html += `   Ticket de Venta\n`;
  html += `${'='.repeat(32)}\n`;
  html += `Fecha: ${fecha}\n`;
  html += `Atendio: ${user.nombre}\n`;
  html += `Metodo: ${venta.metodo_pago}\n`;
  html += `${'-'.repeat(32)}\n`;
  html += `CANT  PRODUCTO       IMPORTE\n`;
  html += `${'-'.repeat(32)}\n`;
  venta.detalles.forEach(d => {
    const nombre = (d.producto_id && d.producto_id.nombre) || 'Servicio';
    html += `${String(d.cantidad).padStart(2)}   ${nombre.padEnd(15)} $${d.subtotal.toFixed(2)}\n`;
  });
  html += `${'-'.repeat(32)}\n`;
  html += `TOTAL:               $${venta.total.toFixed(2)}\n`;
  html += `${'='.repeat(32)}\n`;
  html += `   ¡Gracias por su compra!\n`;
  content.textContent = html;
  modal.classList.add('show');

  document.querySelector('#ticketModal .modal-close').onclick = () => modal.classList.remove('show');
  document.getElementById('btnPrintTicket').onclick = () => {
    const win = window.open('', '_blank');
    win.document.write(`<pre style="font-family:'Courier New';font-size:12px;">${html}</pre>`);
    win.document.close();
    win.print();
  };
}

async function initCopias() {
  const select = document.getElementById('tipoServicio');
  const numPaginas = document.getElementById('numPaginas');
  const tarifaSpan = document.getElementById('tarifaPagina');
  const totalSpan = document.getElementById('totalCopias');

  async function cargarServicios() {
    try {
      const res = await fetch('/api/servicios', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const servicios = await res.json();
        select.innerHTML = '<option value="">Seleccione...</option>';
        servicios.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s._id;
          opt.textContent = `${s.tipo_servicio} - $${s.tarifa_pagina.toFixed(2)}/pag`;
          opt.dataset.tarifa = s.tarifa_pagina;
          select.appendChild(opt);
        });
        return;
      }
    } catch {}
    const defaultServicios = [
      { _id: 'fotocopia-bn', tipo_servicio: 'Fotocopia B/N', tarifa_pagina: 0.05 },
      { _id: 'fotocopia-color', tipo_servicio: 'Fotocopia Color', tarifa_pagina: 0.15 },
      { _id: 'impresion-bn', tipo_servicio: 'Impresion B/N', tarifa_pagina: 0.10 },
      { _id: 'impresion-color', tipo_servicio: 'Impresion Color', tarifa_pagina: 0.25 }
    ];
    select.innerHTML = '<option value="">Seleccione...</option>';
    defaultServicios.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s._id;
      opt.textContent = `${s.tipo_servicio} - $${s.tarifa_pagina.toFixed(2)}/pag`;
      opt.dataset.tarifa = s.tarifa_pagina;
      select.appendChild(opt);
    });
  }

  cargarServicios();

  function calcular() {
    const opt = select.options[select.selectedIndex];
    const tarifa = parseFloat(opt.dataset?.tarifa) || 0;
    const pag = parseInt(numPaginas.value) || 1;
    tarifaSpan.textContent = `$${tarifa.toFixed(2)}`;
    totalSpan.textContent = `$${(tarifa * pag).toFixed(2)}`;
  }

  select.addEventListener('change', calcular);
  numPaginas.addEventListener('input', calcular);

  document.getElementById('btnCobrarCopias').addEventListener('click', async () => {
    const opt = select.options[select.selectedIndex];
    if (!opt.value) { alert('Seleccione un tipo de servicio'); return; }
    const tarifa = parseFloat(opt.dataset.tarifa) || 0;
    const pag = parseInt(numPaginas.value) || 1;
    const total = tarifa * pag;
    try {
      const venta = await API.post('/api/ventas', {
        total,
        metodo_pago: 'Efectivo',
        detalles: [{ servicio_id: opt.value, cantidad: pag, precio_unitario: tarifa, subtotal: total }]
      });
      mostrarTicket(venta);
      numPaginas.value = 1;
      select.value = '';
      calcular();
    } catch (err) { alert(err.message); }
  });
}

let inventarioData = [];

async function initInventario() {
  await cargarInventario();
  document.getElementById('buscarInventario').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderInventario(inventarioData.filter(p => p.codigo_barras.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)));
  });
  document.getElementById('btnNuevoProducto').addEventListener('click', () => abrirModalProducto());
  document.getElementById('productoForm').addEventListener('submit', guardarProducto);
  document.querySelector('#productoModal .modal-close').addEventListener('click', () => document.getElementById('productoModal').classList.remove('show'));
}

async function cargarInventario() {
  try {
    inventarioData = await API.get('/api/productos') || [];
    renderInventario(inventarioData);
  } catch { inventarioData = []; renderInventario([]); }
}

function renderInventario(productos) {
  const tbody = document.getElementById('inventarioBody');
  tbody.innerHTML = '';
  (productos || []).forEach(p => {
    const bajoStock = p.stock_actual <= p.stock_minimo;
    const tr = document.createElement('tr');
    if (bajoStock) tr.className = 'stock-bajo';
    tr.innerHTML = `
      <td>${p.codigo_barras}</td>
      <td>${p.nombre} ${bajoStock ? '⚠️' : ''}</td>
      <td>$${(p.precio_costo || 0).toFixed(2)}</td>
      <td>$${(p.precio_venta || 0).toFixed(2)}</td>
      <td>${p.stock_actual}</td>
      <td>${p.stock_minimo}</td>
      <td>${p.categoria || ''}</td>
      <td>
        <button class="btn-icon" onclick="editarProducto('${p._id}')">✏️</button>
        <button class="btn-icon danger" onclick="eliminarProducto('${p._id}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function abrirModalProducto(producto) {
  const modal = document.getElementById('productoModal');
  document.getElementById('modalTitle').textContent = producto ? 'Editar Producto' : 'Nuevo Producto';
  document.getElementById('prodId').value = producto ? producto._id : '';
  document.getElementById('prodCodigo').value = producto ? producto.codigo_barras : '';
  document.getElementById('prodNombre').value = producto ? producto.nombre : '';
  document.getElementById('prodPrecioCosto').value = producto ? producto.precio_costo : '';
  document.getElementById('prodPrecioVenta').value = producto ? producto.precio_venta : '';
  document.getElementById('prodStockActual').value = producto ? producto.stock_actual : '';
  document.getElementById('prodStockMinimo').value = producto ? producto.stock_minimo : '';
  document.getElementById('prodCategoria').value = producto ? (producto.categoria || '') : '';
  modal.classList.add('show');
}

window.editarProducto = async (id) => {
  const prod = inventarioData.find(p => p._id === id);
  if (prod) abrirModalProducto(prod);
};

window.eliminarProducto = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await API.delete(`/api/productos/${id}`);
    await cargarInventario();
  } catch (err) { alert(err.message); }
};

async function guardarProducto(e) {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const data = {
    codigo_barras: document.getElementById('prodCodigo').value.trim(),
    nombre: document.getElementById('prodNombre').value.trim(),
    precio_costo: parseFloat(document.getElementById('prodPrecioCosto').value),
    precio_venta: parseFloat(document.getElementById('prodPrecioVenta').value),
    stock_actual: parseInt(document.getElementById('prodStockActual').value),
    stock_minimo: parseInt(document.getElementById('prodStockMinimo').value),
    categoria: document.getElementById('prodCategoria').value.trim()
  };
  try {
    if (id) {
      await API.put(`/api/productos/${id}`, data);
    } else {
      await API.post('/api/productos', data);
    }
    document.getElementById('productoModal').classList.remove('show');
    await cargarInventario();
  } catch (err) { alert(err.message); }
}
