const API_BASE_URL = 'http://localhost:5000';
const demoProducts = [
  { idProducto: 1, nombreProducto: 'Lácteo Líquido (Sabor Frutilla)', codigoProducto: 'LAC-FRU-001', categoria: 'Lácteos', stockActual: 420, stockMinimo: 600, alertaStock: true },
  { idProducto: 2, nombreProducto: 'Galleta de Quinua Integral', codigoProducto: 'GAL-QUI-002', categoria: 'Cereales', stockActual: 780, stockMinimo: 800, alertaStock: true },
  { idProducto: 3, nombreProducto: 'Pan de Trigo Fortificado', codigoProducto: 'PAN-TRI-003', categoria: 'Panificados', stockActual: 1350, stockMinimo: 900, alertaStock: false },
  { idProducto: 4, nombreProducto: 'Avena Instantánea Fortificada', codigoProducto: 'AVE-INS-004', categoria: 'Cereales', stockActual: 245, stockMinimo: 300, alertaStock: true },
  { idProducto: 5, nombreProducto: 'Banana de Temporada', codigoProducto: 'BAN-TEM-005', categoria: 'Frutas', stockActual: 1120, stockMinimo: 1000, alertaStock: false }
];
const demoMovements = [
  { producto: 'Escuela Benito Juárez', tipo: 'Salida', cantidad: 320, fecha: '2026-08-28T10:42:00', referencia: 'ENT-028', observacion: 'Entrega completa' },
  { producto: 'Lácteo Líquido', tipo: 'Entrada', cantidad: 1200, fecha: '2026-08-27T16:30:00', referencia: 'OC-109', observacion: 'Recepción conforme' },
  { producto: 'Escuela Sor Juana', tipo: 'Salida', cantidad: 190, fecha: '2026-08-27T14:05:00', referencia: 'ENT-027', observacion: 'Entrega completa' }
];
const demoSchools = [
  { nombre: 'Escuela Benito Juárez', zona: 'Centro', raciones: 320, fecha: '2026-08-28', estado: 'Entregada' },
  { nombre: 'Escuela Miguel Hidalgo', zona: 'Norte', raciones: 280, fecha: '2026-09-04', estado: 'Pendiente' },
  { nombre: 'Escuela Sor Juana', zona: 'Sur', raciones: 190, fecha: '2026-08-27', estado: 'Entregada' },
  { nombre: 'Unidad Educativa Oruro', zona: 'Este', raciones: 410, fecha: '2026-09-05', estado: 'Pendiente' }
];
let products = demoProducts;
let movements = demoMovements;
let schools = demoSchools;
let session = JSON.parse(localStorage.getItem('nutriaula-session') || 'null');
const $ = selector => document.querySelector(selector);
const dateText = value => new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function renderLogin() {
  if (session) return;
  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.innerHTML = `<div class="login-card"><div class="brand"><span class="brand-mark">N</span><span>nutriaula</span></div><p class="eyebrow">CONTROL DE INVENTARIO</p><h1>Accede a tu operación</h1><p class="subheading">Ingresa con tu cargo para ver los módulos autorizados.</p><form id="login-form"><label>Usuario<input name="usuario" required placeholder="admin"></label><label>Contraseña<input name="clave" type="password" required placeholder="••••••••"></label><button class="primary-btn full" type="submit">Ingresar al sistema</button><div class="demo-credentials"><strong>Credenciales de prueba</strong><span>admin / admin · Administrador</span><span>supervisor / supervisor · Supervisor</span><span>almacen / almacen · Encargado de almacén</span><span>operador / operador · Operador</span></div><small id="login-message"></small></form></div>`;
  document.body.append(overlay);
  $('#login-form').onsubmit = login;
}
async function login(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error();
    session = await response.json();
  } catch {
    const roles = { admin: ['Administrador General', 'Director del programa', 1, 'Administrador'], supervisor: ['Supervisora de Operaciones', 'Supervisor regional', 2, 'Supervisor'], almacen: ['Encargado de Almacén', 'Responsable de almacén', 3, 'Encargado de almacén'], operador: ['Operador de Distribución', 'Operador de salidas', 4, 'Operador'] };
    const role = roles[data.usuario];
    if (!role || data.clave !== data.usuario) { $('#login-message').textContent = 'Credenciales no válidas.'; return; }
    session = { token: 'demo', user: { nombre: role[0], cargo: role[1], nivel: role[2], rol: role[3] } };
  }
  localStorage.setItem('nutriaula-session', JSON.stringify(session));
  location.reload();
}
function showView(view) {
  document.querySelectorAll('.page-content').forEach(section => section.classList.add('hidden'));
  $(`#seccion-${view}`)?.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  $('#breadcrumb-title').textContent = view.charAt(0).toUpperCase() + view.slice(1);
  if (view === 'insumos') renderInventory();
  if (view === 'entradas' || view === 'salidas') renderOperations(view);
  if (view === 'reportes') renderReport();
  if (view === 'escuelas') renderSchools();
}
function canWrite(level = 3) { return session?.user?.nivel <= level; }
function renderDashboard() {
  const alerts = products.filter(product => product.alertaStock).length;
  const delivered = schools.filter(school => school.estado === 'Entregada').length;
  const pending = schools.filter(school => school.estado === 'Pendiente').length;
  const values = document.querySelectorAll('#seccion-resumen .stat-value');
  if (values[1]) values[1].textContent = schools.filter(school => school.estado === 'Entregada').reduce((sum, school) => sum + school.raciones, 0).toLocaleString();
  if (values[2]) values[2].textContent = `${delivered}/${delivered + pending}`;
  if (values[3]) values[3].textContent = alerts;
  $('#low-stock-list').innerHTML = products.filter(product => product.alertaStock).map(product => `<div class="low-item alert-row"><div class="product-icon">◈</div><div class="low-info"><strong>${product.nombreProducto}</strong><small>${product.codigoProducto} · ${product.categoria}</small></div><div class="stock-count"><strong>${product.stockActual} uds.</strong><span>mín. ${product.stockMinimo}</span></div></div>`).join('');
  $('#movements-table').innerHTML = movements.slice(0, 5).map(item => `<tr><td>${item.producto}</td><td><span class="${item.tipo === 'Entrada' ? 'type-in' : 'type-out'}">${item.tipo}</span></td><td>${item.cantidad.toLocaleString()}</td><td>${session?.user?.nombre || 'Sistema'}</td><td>${dateText(item.fecha)}</td><td class="status">● Registrado</td></tr>`).join('');
}
function renderInventory() {
  const query = ($('#search-input')?.value || '').toLowerCase();
  const category = $('#category-filter')?.value || 'all';
  const rows = products.filter(product => `${product.nombreProducto} ${product.codigoProducto}`.toLowerCase().includes(query) && (category === 'all' || product.categoria === category));
  $('#inventory-table').innerHTML = rows.map(product => `<tr class="${product.alertaStock ? 'fila-critica' : ''}"><td>◈ &nbsp;${product.nombreProducto}</td><td>${product.codigoProducto}</td><td>${product.categoria}</td><td class="${product.alertaStock ? 'stock-low' : 'stock-good'}">${product.stockActual} uds. <small>/ mín. ${product.stockMinimo}</small></td><td><span class="${product.alertaStock ? 'stock-low' : 'stock-good'}">● ${product.alertaStock ? 'Reponer' : 'En stock'}</span></td><td>${canWrite() ? `<button class="row-action" data-operation="${product.alertaStock ? 'salida' : 'entrada'}" data-product="${product.idProducto}">${product.alertaStock ? 'Registrar salida' : 'Registrar entrada'}</button>` : '<span class="muted">Solo lectura</span>'}</td></tr>`).join('') || '<tr><td colspan="6">No se encontraron insumos.</td></tr>';
}
function renderSchools() {
  const delivered = schools.filter(school => school.estado === 'Entregada');
  const pending = schools.filter(school => school.estado === 'Pendiente');
  $('#schools-summary').innerHTML = `<article class="stat-card"><div class="stat-top"><span>Entregadas</span></div><div class="stat-value">${delivered.length}</div><div class="stat-change positive">rutas completadas</div></article><article class="stat-card alert-card"><div class="stat-top"><span>Pendientes</span></div><div class="stat-value">${pending.length}</div><div class="stat-change negative">requieren coordinación</div></article>`;
  $('#schools-table').innerHTML = schools.map(school => `<tr><td><strong>${school.nombre}</strong><small class="table-subtext">${school.zona}</small></td><td>${school.raciones.toLocaleString()}</td><td>${dateText(school.fecha)}</td><td><span class="${school.estado === 'Entregada' ? 'type-in' : 'type-out'}">${school.estado}</span></td><td>${school.estado === 'Pendiente' && canWrite(4) ? '<button class="row-action">Programar</button>' : 'Actualizado'}</td></tr>`).join('');
}
function openOperation(productId, type) {
  const product = products.find(item => String(item.idProducto) === String(productId));
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<div class="modal"><button class="close-modal" aria-label="Cerrar">×</button><p class="eyebrow">${type === 'entrada' ? 'ABASTECIMIENTO' : 'DISTRIBUCIÓN'}</p><h2>Registrar ${type}</h2><p class="subheading">${product?.nombreProducto || 'Producto'}</p><form id="operation-form"><label>Cantidad<input name="cantidad" type="number" min="1" required></label><label>Referencia<input name="referencia" required placeholder="OC-110 / ENT-029"></label><label>Observación<textarea name="observacion" rows="3"></textarea></label><button class="primary-btn full" type="submit">Guardar operación</button></form></div>`;
  document.body.append(modal);
  modal.querySelector('.close-modal').onclick = () => modal.remove();
  modal.querySelector('form').onsubmit = async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const endpoint = type === 'entrada' ? 'entradas' : 'salidas'; const payload = type === 'entrada' ? { idProducto: Number(productId), codigoLote: data.referencia, fechaVencimiento: new Date(Date.now() + 90 * 86400000).toISOString(), cantidad: Number(data.cantidad), referencia: data.referencia, observacion: data.observacion } : { idProducto: Number(productId), cantidad: Number(data.cantidad), referencia: data.referencia, observacion: data.observacion }; try { await fetch(`${API_BASE_URL}/api/operaciones/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Session-Token': session.token }, body: JSON.stringify(payload) }); } catch { /* El modo demo mantiene la operación visible sin API. */ } movements.unshift({ producto: product?.nombreProducto || 'Producto', tipo: type === 'entrada' ? 'Entrada' : 'Salida', cantidad: Number(data.cantidad), fecha: new Date().toISOString(), referencia: data.referencia, observacion: data.observacion || 'Registrado' }); if (type === 'entrada') product.stockActual += Number(data.cantidad); else product.stockActual = Math.max(0, product.stockActual - Number(data.cantidad)); product.alertaStock = product.stockActual <= product.stockMinimo; modal.remove(); renderInventory(); renderDashboard(); renderOperations(type === 'entrada' ? 'entradas' : 'salidas'); };
}
function openProfile() {
  const profile = document.createElement('div');
  profile.className = 'profile-popover';
  profile.innerHTML = `<div class="profile-cover"></div><div class="profile-avatar">${(session.user.nombre || 'AD').split(' ').map(part => part[0]).slice(0, 2).join('')}</div><div class="profile-body"><h2>${session.user.nombre}</h2><p>${session.user.cargo}</p><span class="profile-role">${session.user.rol} · Nivel ${session.user.nivel}</span><hr><button class="profile-action" id="logout-btn">Cerrar sesión</button></div>`;
  document.body.append(profile);
  $('#logout-btn').onclick = async () => { if (session.token !== 'demo') await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', headers: { 'X-Session-Token': session.token } }).catch(() => {}); localStorage.removeItem('nutriaula-session'); location.reload(); };
  profile.onclick = event => { if (event.target === profile) profile.remove(); };
}
function exportReportPdf() { document.title = `Reporte NutriAula ${$('#report-from').value} a ${$('#report-to').value}`; window.print(); setTimeout(() => { document.title = 'NutriAula | Desayunos escolares'; }, 1000); }
function renderOperations(view) {
  const filtered = movements.filter(item => view === 'entradas' ? item.tipo === 'Entrada' : item.tipo === 'Salida');
  $(`#seccion-${view} #operations-table`).innerHTML = filtered.map(item => `<tr><td>${item.producto}</td><td><span class="${item.tipo === 'Entrada' ? 'type-in' : 'type-out'}">${item.tipo}</span></td><td>${item.cantidad.toLocaleString()} uds.</td><td>${item.referencia}</td><td>${dateText(item.fecha)}</td><td>${item.observacion}</td></tr>`).join('') || '<tr><td colspan="6">No hay operaciones registradas.</td></tr>';
}
function renderReport() {
  const from = $('#report-from').value;
  const to = $('#report-to').value;
  const range = movements.filter(item => item.fecha.slice(0, 10) >= from && item.fecha.slice(0, 10) <= to);
  const entradas = range.filter(item => item.tipo === 'Entrada').reduce((sum, item) => sum + item.cantidad, 0);
  const salidas = range.filter(item => item.tipo === 'Salida').reduce((sum, item) => sum + item.cantidad, 0);
  $('#report-summary').innerHTML = `<article class="stat-card"><div class="stat-top"><span>Entradas</span></div><div class="stat-value">+${entradas.toLocaleString()}</div><div class="stat-change positive">unidades recibidas</div></article><article class="stat-card"><div class="stat-top"><span>Salidas</span></div><div class="stat-value">-${salidas.toLocaleString()}</div><div class="stat-change negative">unidades distribuidas</div></article><article class="stat-card"><div class="stat-top"><span>Operaciones</span></div><div class="stat-value">${range.length}</div><div class="stat-change neutral">movimientos registrados</div></article>`;
  $('#report-table').innerHTML = range.map(item => `<tr><td>${dateText(item.fecha)}</td><td>${item.producto}</td><td><span class="${item.tipo === 'Entrada' ? 'type-in' : 'type-out'}">${item.tipo}</span></td><td>${item.cantidad.toLocaleString()}</td><td>${item.referencia}</td></tr>`).join('') || '<tr><td colspan="5">No hay movimientos en este rango.</td></tr>';
}
function addDynamicViews() {
  const main = $('.main-content');
  main.insertAdjacentHTML('beforeend', `<section class="page-content hidden" id="seccion-entradas"><div class="page-heading"><div><p class="eyebrow">ABASTECIMIENTO</p><h1>Entradas y lotes</h1><p class="subheading">Recepciones, lotes y fechas de vencimiento controlados por FEFO.</p></div><button class="primary-btn">＋ Registrar entrada</button></div><section class="panel"><div class="panel-header"><h2>Entradas y lotes</h2><span class="status">● FEFO activo</span></div><div class="table-scroll"><table><thead><tr><th>Producto / escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th><th>Fecha</th><th>Observación</th></tr></thead><tbody id="operations-table"></tbody></table></div></section></section><section class="page-content hidden" id="seccion-salidas"><div class="page-heading"><div><p class="eyebrow">DISTRIBUCIÓN</p><h1>Salidas y alertas</h1><p class="subheading">Distribuciones a escuelas y alertas de inventario pendientes.</p></div><button class="primary-btn">＋ Registrar salida</button></div><section class="panel"><div class="panel-header"><h2>Salidas y alertas</h2><span class="stock-low">● Alertas activas</span></div><div class="table-scroll"><table><thead><tr><th>Producto / escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th><th>Fecha</th><th>Observación</th></tr></thead><tbody id="operations-table"></tbody></table></div></section></section><section class="page-content hidden" id="seccion-reportes"><div class="page-heading"><div><p class="eyebrow">AUDITORÍA</p><h1>Reportes</h1><p class="subheading">Consulta operaciones entre cualquier fecha, incluso en meses diferentes.</p></div></div><section class="panel report-filters"><label>Desde<input id="report-from" type="date" value="2026-08-01"></label><label>Hasta<input id="report-to" type="date" value="2026-09-30"></label><button class="primary-btn" id="run-report">Generar reporte</button></section><div class="stats-grid" id="report-summary"></div><section class="panel"><div class="table-scroll"><table><thead><tr><th>Fecha</th><th>Producto / escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th></tr></thead><tbody id="report-table"></tbody></table></div></section></section>`);
  main.insertAdjacentHTML('beforeend', `<section class="page-content hidden" id="seccion-escuelas"><div class="page-heading"><div><p class="eyebrow">DISTRIBUCIÓN</p><h1>Escuelas</h1><p class="subheading">Consulta las entregas completadas y las rutas pendientes.</p></div><button class="primary-btn">＋ Programar entrega</button></div><div class="stats-grid" id="schools-summary"></div><section class="panel"><div class="panel-header"><h2>Estado de entregas</h2><span class="status">● Seguimiento activo</span></div><div class="table-scroll"><table><thead><tr><th>Escuela</th><th>Raciones</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="schools-table"></tbody></table></div></section></section>`);
  $('.report-filters').insertAdjacentHTML('beforeend', '<button class="secondary-btn" id="pdf-report">▣ Descargar PDF</button>');
  $('#run-report').onclick = renderReport;
  $('#pdf-report').onclick = exportReportPdf;
}
async function loadProducts() {
  try { const response = await fetch(`${API_BASE_URL}/api/inventario/productos`); if (!response.ok) throw new Error(); products = await response.json(); } catch { /* Permite revisar la UI sin una instancia local de SQL Server. */ }
  renderInventory();
  renderDashboard();
}
async function loadSchools() {
  try { const response = await fetch(`${API_BASE_URL}/api/escuelas`); if (!response.ok) throw new Error(); schools = (await response.json()).map(school => ({ nombre: school.nombreEscuela, zona: school.zona, raciones: school.racionesProgramadas, fecha: school.fechaEntrega, estado: school.estado })); } catch { /* Usa el conjunto local mientras SQL Server no esté disponible. */ }
  renderSchools();
  renderDashboard();
}
if (session) { addDynamicViews(); $('.sidebar-footer strong').textContent = session.user.nombre; $('.sidebar-footer small').textContent = session.user.cargo; $('#profile-trigger').onclick = openProfile; $('#new-product-btn')?.addEventListener('click', () => openOperation(products[0]?.idProducto, 'entrada')); $('#new-product-btn-2')?.addEventListener('click', () => openOperation(products[0]?.idProducto, 'entrada')); loadProducts(); loadSchools(); }
renderLogin();
document.addEventListener('click', event => { const link = event.target.closest('[data-view]'); if (link) { event.preventDefault(); showView(link.dataset.view); } });
document.addEventListener('click', event => { const action = event.target.closest('[data-operation]'); if (action) openOperation(action.dataset.product, action.dataset.operation); });
$('#search-input')?.addEventListener('input', renderInventory);
$('#category-filter')?.addEventListener('change', renderInventory);
$('.mobile-menu')?.addEventListener('click', () => $('.sidebar').classList.toggle('open'));