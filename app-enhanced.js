const STORAGE_KEY = 'nutriaula-session';
const SCHOOLS_STORAGE_KEY = 'nutriaula-schools';

const demoProducts = [
  { idProducto: 1, nombreProducto: 'Lácteo Líquido (Sabor Frutilla)', codigoProducto: 'LAC-FRU-001', categoria: 'Lácteos', stockActual: 420, stockMinimo: 600, alertaStock: true },
  { idProducto: 2, nombreProducto: 'Galleta de Quinua Integral', codigoProducto: 'GAL-QUI-002', categoria: 'Cereales', stockActual: 780, stockMinimo: 800, alertaStock: true },
  { idProducto: 3, nombreProducto: 'Pan de Trigo Fortificado', codigoProducto: 'PAN-TRI-003', categoria: 'Panificados', stockActual: 1350, stockMinimo: 900, alertaStock: false },
  { idProducto: 4, nombreProducto: 'Avena Instantánea Fortificada', codigoProducto: 'AVE-INS-004', categoria: 'Cereales', stockActual: 245, stockMinimo: 300, alertaStock: true },
  { idProducto: 5, nombreProducto: 'Banana de Temporada', codigoProducto: 'BAN-TEM-005', categoria: 'Frutas', stockActual: 1120, stockMinimo: 1000, alertaStock: false }
];

const demoMovements = [
  { producto: 'Lácteo Líquido (Sabor Frutilla)', escuela: 'Escuela Benito Juárez', tipo: 'Salida', cantidad: 320, fecha: '2026-08-28T10:42:00', referencia: 'ENT-028', observacion: 'Entrega completa' },
  { producto: 'Lácteo Líquido (Sabor Frutilla)', escuela: 'Almacén central', tipo: 'Entrada', cantidad: 1200, fecha: '2026-08-27T16:30:00', referencia: 'OC-109', observacion: 'Recepción conforme' },
  { producto: 'Pan de Trigo Fortificado', escuela: 'Escuela Sor Juana', tipo: 'Salida', cantidad: 190, fecha: '2026-08-27T14:05:00', referencia: 'ENT-027', observacion: 'Entrega completa' }
];

const demoSchools = [
  { nombre: 'Escuela Benito Juárez', zona: 'Centro', raciones: 320, fecha: '2026-08-28', estado: 'Entregada' },
  { nombre: 'Escuela Miguel Hidalgo', zona: 'Norte', raciones: 280, fecha: '2026-09-04', estado: 'Pendiente' },
  { nombre: 'Escuela Sor Juana', zona: 'Sur', raciones: 190, fecha: '2026-08-27', estado: 'Entregada' },
  { nombre: 'Unidad Educativa Oruro', zona: 'Este', raciones: 410, fecha: '2026-09-05', estado: 'Pendiente' }
];

const state = {
  session: loadSession(),
  products: [...demoProducts],
  customProducts: [],
  categories: [...new Set(demoProducts.map(product => product.categoria).concat(['General']))],
  movements: [...demoMovements],
  schools: [...demoSchools],
  reportData: []
};

const $ = (selector, root = document) => root.querySelector(selector);

function getAllProducts() {
  return [...state.products, ...state.customProducts];
}

function normalizeSelectionText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function findProductByReference(value) {
  const lookup = normalizeSelectionText(value);
  if (!lookup) return null;

  return getAllProducts().find(product => {
    const sku = normalizeSelectionText(product.codigoProducto || '');
    const name = normalizeSelectionText(product.nombreProducto || '');
    return sku === lookup || name === lookup || sku.includes(lookup) || name.includes(lookup);
  }) || null;
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(session) {
  state.session = session;
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function normalizeProduct(product) {
  return {
    idProducto: Number(product.idProducto ?? 0),
    nombreProducto: product.nombreProducto || product.nombre || '',
    codigoProducto: product.codigoProducto || product.codigo || '',
    categoria: product.categoria || 'General',
    stockActual: Number(product.stockActual ?? 0),
    stockMinimo: Number(product.stockMinimo ?? 0),
    alertaStock: Boolean(product.alertaStock ?? (Number(product.stockActual ?? 0) <= Number(product.stockMinimo ?? 0)))
  };
}

function normalizeSchool(school) {
  return {
    nombre: school.nombre || school.nombreEscuela || 'Escuela',
    zona: school.zona || 'Sin zona',
    tipoRacion: school.tipoRacion || school.producto || school.nombreProducto || 'Lácteo Líquido (Sabor Frutilla)',
    raciones: Number(school.raciones ?? school.racionesProgramadas ?? 0),
    fecha: school.fecha || school.fechaEntrega || new Date().toISOString(),
    estado: school.estado || 'Pendiente'
  };
}

function normalizeMovement(item) {
  return {
    producto: item.producto || item.nombreProducto || 'Producto',
    escuela: item.escuela || item.escuelaDestino || item.destino || 'Almacén central',
    tipo: item.tipo || item.tipoMovimiento || 'Entrada',
    cantidad: Number(item.cantidad ?? item.cantidadMov ?? 0),
    fecha: item.fecha || item.fechaHora || new Date().toISOString(),
    referencia: item.referencia || '—',
    observacion: item.observacion || 'Registrado'
  };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-BO');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function showToast(message, type = 'info') {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function canWrite(level = 3) {
  return Number(state.session?.user?.nivel ?? 99) <= Number(level);
}

function renderLogin() {
  if (state.session || $('#login-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-card">
      <div class="brand"><span class="brand-mark">N</span><span>nutriaula</span></div>
      <p class="eyebrow">CONTROL DE INVENTARIO</p>
      <h1>Accede a tu operación</h1>
      <p class="subheading">Ingresa con una cuenta autorizada para continuar.</p>
      <form id="login-form">
        <label>Usuario<input name="usuario" required placeholder="admin"></label>
        <label>Contraseña<input name="clave" type="password" required placeholder="••••••••"></label>
        <button class="primary-btn full" type="submit">Ingresar al sistema</button>
        <small id="login-message"></small>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  $('#login-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const roles = {
      admin: ['Administrador General', 'Director del programa', 1, 'Administrador'],
      supervisor: ['Supervisora de Operaciones', 'Supervisor regional', 2, 'Supervisor'],
      almacen: ['Encargado de Almacén', 'Responsable de almacén', 3, 'Encargado de almacén'],
      operador: ['Operador de Distribución', 'Operador de salidas', 4, 'Operador']
    };
    const role = roles[data.usuario];
    if (!role || data.clave !== data.usuario) {
      $('#login-message').textContent = 'Credenciales no válidas.';
      return;
    }
    saveSession({ token: 'demo', user: { nombre: role[0], cargo: role[1], nivel: role[2], rol: role[3] } });
    location.reload();
  });
}

function showView(view) {
  const sectionKey = view === 'dashboard' ? 'resumen' : view;

  document.querySelectorAll('.page-content').forEach(section => section.classList.add('hidden'));
  const target = $(`#seccion-${sectionKey}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  const title = $('#breadcrumb-title');
  if (title) {
    title.textContent = sectionKey === 'resumen' ? 'Resumen' : (sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1));
  }

  if (sectionKey === 'resumen') renderDashboard();
  if (view === 'insumos') renderInventory();
  if (view === 'entradas' || view === 'salidas') renderOperations(view);
  if (view === 'reportes') renderReport();
  if (view === 'escuelas') renderSchools();
  if (view === 'categorias') renderMenusView();
  if (view === 'ajustes') renderSettingsView();
}

function renderDashboard() {
  const alerts = getAllProducts().filter(product => product.alertaStock);
  const delivered = state.schools.filter(school => school.estado === 'Entregada');
  const pending = state.schools.filter(school => school.estado === 'Pendiente');
  const totalProgrammed = state.schools.reduce((sum, school) => sum + Number(school.raciones || 0), 0);

  const statValues = $('#seccion-resumen .stats-grid')?.querySelectorAll('.stat-value');
  if (statValues?.[0]) statValues[0].textContent = `${formatNumber(totalProgrammed)} raciones`;
  if (statValues?.[1]) statValues[1].textContent = formatNumber(delivered.reduce((sum, school) => sum + Number(school.raciones || 0), 0));
  if (statValues?.[2]) statValues[2].textContent = `${delivered.length}/${delivered.length + pending.length}`;
  if (statValues?.[3]) statValues[3].textContent = String(alerts.length);

  const lowStockList = $('#low-stock-list');
  if (lowStockList) {
    lowStockList.innerHTML = alerts.length
      ? alerts.slice(0, 4).map(product => `
        <div class="low-item alert-row">
          <div class="product-icon">◈</div>
          <div class="low-info">
            <strong>${product.nombreProducto}</strong>
            <small>${product.codigoProducto} · ${product.categoria}</small>
          </div>
          <div class="stock-count">
            <strong>${product.stockActual} uds.</strong>
            <span>mín. ${product.stockMinimo}</span>
          </div>
        </div>
      `).join('')
      : '<div class="empty-state">No hay insumos con stock bajo.</div>';
  }

  const movementsTable = $('#movements-table');
  if (movementsTable) {
    const rows = [...state.movements]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5);

    movementsTable.innerHTML = rows.map(item => `
      <tr>
        <td>${item.producto}</td>
        <td><span class="${item.tipo === 'Entrada' ? 'type-in' : 'type-out'}">${item.tipo}</span></td>
        <td>${formatNumber(item.cantidad)}</td>
        <td>${state.session?.user?.nombre || 'Sistema'}</td>
        <td>${formatDate(item.fecha)}</td>
        <td class="status">● Registrado</td>
      </tr>
    `).join('');
  }
}

function renderCategoryOptions() {
  const categoryFilter = $('#category-filter');
  if (categoryFilter) {
    const selected = categoryFilter.value || 'all';
    const options = ['<option value="all">Todas las categorías</option>']
      .concat(state.categories.map(category => `<option value="${category}">${category}</option>`));
    categoryFilter.innerHTML = options.join('');
    categoryFilter.value = selected && [...state.categories].includes(selected) ? selected : 'all';
  }
}

function renderInventory() {
  renderCategoryOptions();

  const query = ($('#search-input')?.value || '').toLowerCase();
  const category = $('#category-filter')?.value || 'all';
  const rows = getAllProducts().filter(product => {
    const searchable = `${product.nombreProducto} ${product.codigoProducto}`.toLowerCase();
    return searchable.includes(query) && (category === 'all' || product.categoria === category);
  });

  const inventoryTable = $('#inventory-table');
  if (!inventoryTable) return;

  inventoryTable.innerHTML = rows.length
    ? rows.map(product => `
      <tr class="${product.alertaStock ? 'fila-critica' : ''}">
        <td>
          <div class="product-cell">
            <span class="product-bullet ${product.alertaStock ? 'critical' : 'ok'}">${product.alertaStock ? '!' : '✓'}</span>
            <div>
              <strong>${product.nombreProducto}</strong>
              <small>${product.codigoProducto}</small>
            </div>
          </div>
        </td>
        <td>${product.codigoProducto}</td>
        <td>${product.categoria}</td>
        <td class="${product.alertaStock ? 'stock-low' : 'stock-good'}">${product.stockActual} uds. <small>/ mín. ${product.stockMinimo}</small></td>
        <td><span class="${product.alertaStock ? 'stock-low' : 'stock-good'}">● ${product.alertaStock ? 'Reponer' : 'En stock'}</span></td>
        <td>${canWrite() ? `<button class="row-action" data-view="${product.alertaStock ? 'salidas' : 'entradas'}" data-product="${product.idProducto}">${product.alertaStock ? 'Ir a salidas y alertas' : 'Ir a entradas y alertas'}</button>` : '<span class="muted">Solo lectura</span>'}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="6">No se encontraron insumos.</td></tr>';
}

function renderSchools() {
  const delivered = state.schools.filter(school => school.estado === 'Entregada');
  const pending = state.schools.filter(school => school.estado === 'Pendiente');

  const schoolsSummary = $('#schools-summary');
  if (schoolsSummary) {
    schoolsSummary.innerHTML = `
      <article class="stat-card"><div class="stat-top"><span>Entregadas</span></div><div class="stat-value">${delivered.length}</div><div class="stat-change positive">rutas completadas</div></article>
      <article class="stat-card alert-card"><div class="stat-top"><span>Pendientes</span></div><div class="stat-value">${pending.length}</div><div class="stat-change negative">requieren coordinación</div></article>
    `;
  }

  const schoolsTable = $('#schools-table');
  if (schoolsTable) {
    schoolsTable.innerHTML = state.schools.map(school => `
      <tr>
        <td><strong>${school.nombre}</strong><small class="table-subtext">${school.zona}</small></td>
        <td>${school.tipoRacion}</td>
        <td>${formatNumber(school.raciones)}</td>
        <td>${formatDate(school.fecha)}</td>
        <td><span class="${school.estado === 'Entregada' ? 'type-in' : 'type-out'}">${school.estado}</span></td>
        <td>${school.estado === 'Pendiente' && canWrite(4) ? `<button class="row-action" data-schedule-school="${school.nombre}">Programar</button>` : 'Actualizado'}</td>
      </tr>
    `).join('');
  }
}

function openScheduleModal(schoolName = '') {
  const school = state.schools.find(item => item.nombre === schoolName);
  const rationOptions = [50, 100, 150, 200, 250, 280, 300, 320, 400, 410, 500, 600];
  if (school?.raciones && !rationOptions.includes(school.raciones)) rationOptions.push(school.raciones);
  rationOptions.sort((first, second) => first - second);
  const rationTypes = getAllProducts().map(product => product.nombreProducto);
  const selectedRationType = school?.tipoRacion || rationTypes[0] || 'Lácteo Líquido (Sabor Frutilla)';
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <button class="close-modal" aria-label="Cerrar">×</button>
      <p class="eyebrow">DISTRIBUCIÓN</p>
      <h2>Programar entrega</h2>
      <form id="schedule-form">
        <label>Escuela<input name="nombre" required value="${school?.nombre || ''}" placeholder="Ej. Escuela 12 de Octubre"></label>
        <label>Zona<input name="zona" required value="${school?.zona || ''}" placeholder="Ej. Centro"></label>
        <label>Tipo de ración<select name="tipoRacion" required>${rationTypes.map(type => `<option value="${type}" ${type === selectedRationType ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
        <div class="form-row">
          <label>Raciones<select name="raciones" required>${rationOptions.map(amount => `<option value="${amount}" ${amount === school?.raciones ? 'selected' : ''}>${formatNumber(amount)} raciones</option>`).join('')}</select></label>
          <label>Fecha de entrega<input name="fecha" type="date" required value="${school?.fecha?.slice(0, 10) || ''}"></label>
        </div>
        <button class="primary-btn full" type="submit">Guardar programación</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#schedule-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const scheduledSchool = { nombre: data.nombre.trim(), zona: data.zona.trim(), tipoRacion: data.tipoRacion, raciones: Number(data.raciones), fecha: data.fecha, estado: 'Pendiente' };
    const existingIndex = state.schools.findIndex(item => item.nombre === schoolName);
    if (existingIndex >= 0) state.schools[existingIndex] = scheduledSchool;
    else state.schools.push(scheduledSchool);
    localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(state.schools));
    modal.remove();
    renderSchools();
    renderDashboard();
    showToast('Entrega programada correctamente.', 'success');
  });
}

function renderOperations(view) {
  const section = $(`#seccion-${view}`);
  const tableBody = section?.querySelector('#operations-table');
  if (!tableBody) return;

  const filtered = state.movements.filter(item => view === 'entradas' ? item.tipo === 'Entrada' : item.tipo === 'Salida');

  const isSalidaView = view === 'salidas';

  tableBody.innerHTML = filtered.length
    ? filtered.map(item => `
      <tr>
        <td>
          <div class="product-cell">
            <span class="product-bullet ${item.tipo === 'Entrada' ? 'ok' : 'critical'}">${item.tipo === 'Entrada' ? '✓' : '↧'}</span>
            <div>
              <strong>${item.producto}</strong>
              ${isSalidaView ? `<small>${item.escuela || 'Escuela no registrada'}</small>` : ''}
            </div>
          </div>
        </td>
        ${isSalidaView ? '<td><strong>' + (item.escuela || 'Almacén central') + '</strong></td>' : ''}
        <td><span class="${item.tipo === 'Entrada' ? 'type-in' : 'type-out'}">${item.tipo}</span></td>
        <td>${formatNumber(item.cantidad)} uds.</td>
        <td>${item.referencia}</td>
        <td>${formatDate(item.fecha)}</td>
        <td>${item.observacion}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="7">No hay operaciones registradas.</td></tr>';

  const thead = section?.querySelector('thead tr');
  if (thead) {
    const cells = thead.children;
    if (isSalidaView && cells.length >= 7) {
      cells[0].textContent = 'Producto';
      cells[1].textContent = 'Escuela';
      cells[2].textContent = 'Tipo';
      cells[3].textContent = 'Cantidad';
      cells[4].textContent = 'Referencia';
      cells[5].textContent = 'Fecha';
      cells[6].textContent = 'Observación';
    } else if (!isSalidaView && cells.length >= 6) {
      cells[0].textContent = 'Producto / escuela';
      cells[1].textContent = 'Tipo';
      cells[2].textContent = 'Cantidad';
      cells[3].textContent = 'Referencia';
      cells[4].textContent = 'Fecha';
      cells[5].textContent = 'Observación';
    }
  }
}

async function renderReport(showNotification = false) {
  const from = $('#report-from')?.value || '';
  const to = $('#report-to')?.value || '';

  state.reportData = state.movements.filter(item => {
    const itemDate = (item.fecha || '').slice(0, 10);
    return (!from || itemDate >= from) && (!to || itemDate <= to);
  });

  const range = state.reportData;
  const entradas = range.filter(item => item.tipo === 'Entrada').reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  const salidas = range.filter(item => item.tipo === 'Salida').reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

  const reportSummary = $('#report-summary');
  if (reportSummary) {
    reportSummary.innerHTML = `
      <article class="stat-card"><div class="stat-top"><span>Entradas</span></div><div class="stat-value">+${formatNumber(entradas)}</div><div class="stat-change positive">unidades recibidas</div></article>
      <article class="stat-card"><div class="stat-top"><span>Salidas</span></div><div class="stat-value">-${formatNumber(salidas)}</div><div class="stat-change negative">unidades distribuidas</div></article>
      <article class="stat-card"><div class="stat-top"><span>Operaciones</span></div><div class="stat-value">${range.length}</div><div class="stat-change neutral">movimientos registrados</div></article>
    `;
  }

  const reportTable = $('#report-table');
  if (reportTable) {
    reportTable.innerHTML = range.length
      ? range.map(item => `
        <tr>
          <td>${formatDate(item.fecha)}</td>
          <td>${item.producto}</td>
          <td>${item.escuela || 'Almacén central'}</td>
          <td><span class="${item.tipo === 'Entrada' ? 'type-in' : 'type-out'}">${item.tipo}</span></td>
          <td>${formatNumber(item.cantidad)}</td>
          <td>${item.referencia}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="6">No hay movimientos en este rango.</td></tr>';
  }

  if (showNotification) showToast('Reporte generado correctamente.', 'success');
}

async function ensurePdfLibrary() {
  if (window.jspdf?.jsPDF) return;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pdf-lib="jspdf"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.setAttribute('data-pdf-lib', 'jspdf');
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function exportReportPdf() {
  const from = $('#report-from')?.value || '';
  const to = $('#report-to')?.value || '';

  const rows = state.reportData.length ? state.reportData : state.movements;
  const filteredRows = rows.filter(item => {
    const itemDate = (item.fecha || '').slice(0, 10);
    return (!from || itemDate >= from) && (!to || itemDate <= to);
  });

  const dateLabel = from || to ? `${from || 'Inicio'} a ${to || 'Hoy'}` : 'Todo el historial';

  try {
    await ensurePdfLibrary();

    if (window.jspdf?.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 52;
      let y = 56;

      doc.setFillColor(25, 53, 93);
      doc.roundedRect(marginLeft, 32, pageWidth - marginLeft * 2, 52, 10, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Reporte NutriAula', marginLeft + 18, 56);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${dateLabel}`, marginLeft + 18, 70);
      doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageWidth - marginLeft - 120, 70);

      const totalEntradas = filteredRows.filter(item => item.tipo === 'Entrada').reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
      const totalSalidas = filteredRows.filter(item => item.tipo === 'Salida').reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

      doc.setTextColor(31, 41, 55);
      const cardsX = [marginLeft, marginLeft + 170, marginLeft + 340];
      const cardWidths = [140, 140, 140];
      const cardData = [
        { label: 'Entradas', value: `+${formatNumber(totalEntradas)}`, color: [214, 243, 230] },
        { label: 'Salidas', value: `-${formatNumber(totalSalidas)}`, color: [255, 234, 226] },
        { label: 'Movimientos', value: String(filteredRows.length), color: [232, 240, 255] }
      ];

      cardData.forEach((card, index) => {
        const x = cardsX[index];
        const w = cardWidths[index];
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.roundedRect(x, 100, w, 42, 8, 8, 'F');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(card.label, x + 14, 116);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(card.value, x + 14, 132);
      });

      y = 170;
      doc.setFillColor(244, 247, 251);
      doc.roundedRect(marginLeft, y, pageWidth - marginLeft * 2, 20, 6, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.text('Fecha', marginLeft + 12, y + 13);
      doc.text('Producto', marginLeft + 92, y + 13);
      doc.text('Escuela', marginLeft + 235, y + 13);
      doc.text('Tipo', marginLeft + 380, y + 13);
      doc.text('Cant.', marginLeft + 435, y + 13);
      doc.text('Ref.', marginLeft + 485, y + 13);
      y += 20;

      doc.setDrawColor(214, 221, 233);
      doc.setLineWidth(0.5);

      if (!filteredRows.length) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        doc.text('No hay movimientos para este rango.', marginLeft + 14, y + 18);
      } else {
        filteredRows.forEach((item, index) => {
          const rowY = y + index * 22;
          if (rowY > pageHeight - 80) {
            doc.addPage();
            y = 56;
            return;
          }

          doc.setFillColor(index % 2 === 0 ? 255 : 248, 250, 252);
          doc.rect(marginLeft, rowY, pageWidth - marginLeft * 2, 18, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(31, 41, 55);
          doc.setFontSize(8);
          doc.text(formatDate(item.fecha), marginLeft + 12, rowY + 12);
          doc.text(item.producto || 'Producto', marginLeft + 92, rowY + 12, { maxWidth: 110 });
          doc.text(item.escuela || 'Almacén central', marginLeft + 235, rowY + 12, { maxWidth: 120 });
          doc.text(item.tipo, marginLeft + 380, rowY + 12);
          doc.text(String(formatNumber(item.cantidad)), marginLeft + 435, rowY + 12);
          doc.text(item.referencia || '—', marginLeft + 485, rowY + 12, { maxWidth: 58 });
        });
      }

      doc.save(`reporte-nutriaula-${Date.now()}.pdf`);
      showToast('PDF descargado correctamente.', 'success');
      return;
    }
  } catch {
    // Si la librería no está disponible, se usa la vista de impresión como respaldo.
  }

  const printableWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printableWindow) {
    showToast('No se pudo abrir la vista de impresión. Habilita ventanas emergentes.', 'error');
    return;
  }

  const tableRows = filteredRows.length
    ? filteredRows.map(item => `
        <tr>
          <td>${formatDate(item.fecha)}</td>
          <td>${item.producto}</td>
          <td>${item.escuela || 'Almacén central'}</td>
          <td>${item.tipo}</td>
          <td>${formatNumber(item.cantidad)}</td>
          <td>${item.referencia}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="6">No hay movimientos para este rango.</td></tr>';

  printableWindow.document.write(`<!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte NutriAula</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #18212f; background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%); }
          .header { background: linear-gradient(135deg, #1d3557 0%, #2f6f9f 100%); color: white; padding: 26px 28px; border-radius: 16px; margin-bottom: 18px; }
          .header h1 { margin: 0 0 6px; font-size: 28px; }
          .meta { opacity: 0.9; font-size: 13px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
          .card { padding: 16px; border-radius: 12px; background: #f3f7ff; border: 1px solid #dfeaf9; }
          .card strong { display: block; font-size: 12px; color: #58667a; margin-bottom: 8px; }
          .card span { font-size: 22px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; background: white; border-radius: 12px; overflow: hidden; }
          th, td { border: 1px solid #e4ebf5; padding: 10px 12px; text-align: left; font-size: 12px; }
          th { background: #eef4ff; }
          @media print { body {margin:0;} }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte NutriAula</h1>
          <div class="meta">Período: ${dateLabel} · Generado el ${formatDate(new Date().toISOString())}</div>
        </div>
        <div class="summary">
          <div class="card"><strong>Entradas</strong><span>${formatNumber(filteredRows.filter(item => item.tipo === 'Entrada').reduce((sum, item) => sum + Number(item.cantidad || 0), 0))}</span></div>
          <div class="card"><strong>Salidas</strong><span>${formatNumber(filteredRows.filter(item => item.tipo === 'Salida').reduce((sum, item) => sum + Number(item.cantidad || 0), 0))}</span></div>
          <div class="card"><strong>Movimientos</strong><span>${filteredRows.length}</span></div>
        </div>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Producto</th><th>Escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);

  printableWindow.document.close();
  printableWindow.focus();
  printableWindow.print();
  setTimeout(() => printableWindow.close(), 1000);
}

function openProfile() {
  if (!state.session?.user) return;

  const existingProfile = document.querySelector('.profile-popover');
  if (existingProfile) {
    existingProfile.remove();
    return;
  }

  const profile = document.createElement('div');
  profile.className = 'profile-popover';
  profile.innerHTML = `
    <div class="profile-cover"></div>
    <div class="profile-avatar">${(state.session.user.nombre || 'AD').split(' ').map(part => part[0]).slice(0, 2).join('')}</div>
    <div class="profile-body">
      <h2>${state.session.user.nombre}</h2>
      <p>${state.session.user.cargo}</p>
      <span class="profile-role">${state.session.user.rol} · Nivel ${state.session.user.nivel}</span>
      <hr>
      <button class="profile-action" id="logout-btn">Cerrar sesión</button>
    </div>
  `;

  document.body.appendChild(profile);

  $('#logout-btn').addEventListener('click', event => {
    event.preventDefault();
    saveSession(null);
    profile.remove();
    location.reload();
  });

  profile.addEventListener('click', event => {
    if (event.target === profile) profile.remove();
  });
}

function openNewCategoryModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <button class="close-modal" aria-label="Cerrar">×</button>
      <p class="eyebrow">CATEGORÍAS</p>
      <h2>Nueva categoría</h2>
      <form id="new-category-form">
        <label>Nombre de la categoría<input name="nombreCategoria" required placeholder="Ej. Frutos secos"></label>
        <button class="primary-btn full" type="submit">Guardar categoría</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());

  modal.querySelector('#new-category-form').addEventListener('submit', event => {
    event.preventDefault();
    const nombre = new FormData(event.currentTarget).get('nombreCategoria')?.toString().trim();

    if (!nombre) {
      showToast('Escribe el nombre de la categoría.', 'error');
      return;
    }

    const normalized = nombre.trim();
    if (state.categories.some(item => item.toLowerCase() === normalized.toLowerCase())) {
      showToast('La categoría ya existe.', 'error');
      return;
    }

    state.categories.push(normalized);
    modal.remove();
    renderCategoryOptions();
    renderInventory();
    showToast('Categoría creada correctamente.', 'success');
  });
}

function openNewProductModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <button class="close-modal" aria-label="Cerrar">×</button>
      <p class="eyebrow">PRODUCTOS</p>
      <h2>Nuevo producto</h2>
      <form id="new-product-form">
        <label>Nombre del producto<input name="nombre" required placeholder="Ej. Yogur natural"></label>
        <div class="form-row">
          <label>SKU<input name="codigo" required placeholder="YOG-NAT-001"></label>
          <label>Categoría<select name="categoria">${state.categories.map(category => `<option value="${category}">${category}</option>`).join('')}</select></label>
        </div>
        <div class="form-row">
          <label>Stock mínimo<input name="stockMinimo" type="number" min="0" required value="0"></label>
          <label>Stock inicial<input name="stockActual" type="number" min="0" value="0"></label>
        </div>
        <button class="primary-btn full" type="submit">Guardar producto</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());

  modal.querySelector('#new-product-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    const nombre = data.nombre?.trim();
    const codigo = data.codigo?.trim();
    const stockActual = Number(data.stockActual || 0);
    const stockMinimo = Number(data.stockMinimo || 0);

    if (!nombre || !codigo) {
      showToast('Completa los campos obligatorios.', 'error');
      return;
    }

    state.customProducts.unshift({
      idProducto: Date.now(),
      nombreProducto: nombre,
      codigoProducto: codigo,
      categoria: data.categoria || 'General',
      stockActual,
      stockMinimo,
      alertaStock: stockActual <= stockMinimo,
      fuente: 'Producto personalizado'
    });

    modal.remove();
    renderInventory();
    renderDashboard();
    showToast('Producto agregado correctamente.', 'success');
  });
}

function openOperation(productId, type) {
  const initialProduct = getAllProducts().find(item => String(item.idProducto) === String(productId)) || getAllProducts()[0];
  if (!initialProduct) {
    showToast('No se encontró el producto seleccionado.', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <button class="close-modal" aria-label="Cerrar">×</button>
      <p class="eyebrow">${type === 'entrada' ? 'ABASTECIMIENTO' : 'DISTRIBUCIÓN'}</p>
      <h2>Registrar ${type}</h2>
      <p class="subheading" id="selected-product-name">${initialProduct.nombreProducto}</p>
      <form id="operation-form">
        <label>Código de referencia<input name="codigoReferencia" placeholder="Ej. ${initialProduct.codigoProducto}" required></label>
        <label>Nombre del producto<input name="nombreReferencia" placeholder="Ej. ${initialProduct.nombreProducto}" required></label>
        <label>Cantidad<input name="cantidad" type="number" min="1" required></label>
        ${type === 'salida' ? `<label>Escuela destinataria<select name="escuelaDestino">${state.schools.map(school => `<option value="${school.nombre}">${school.nombre}</option>`).join('')}</select></label>` : ''}
        ${type === 'entrada' ? `<label>Fecha de vencimiento<input name="fechaVencimiento" type="date" value="${new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}"></label>` : ''}
        <label>Observación<textarea name="observacion" rows="3"></textarea></label>
        <button class="primary-btn full" type="submit">Guardar operación</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());

  const form = modal.querySelector('#operation-form');
  const codigoInput = form.querySelector('[name="codigoReferencia"]');
  const nombreInput = form.querySelector('[name="nombreReferencia"]');
  const selectedProductName = modal.querySelector('#selected-product-name');
  let selectedProduct = initialProduct;

  const syncReferenceInputs = (source) => {
    const codigo = codigoInput.value.trim();
    const nombre = nombreInput.value.trim();
    const typedValue = source === 'codigo' ? codigo : nombre;
    const matched = findProductByReference(typedValue);

    if (!matched) {
      if (source === 'codigo' && !codigo) {
        selectedProduct = initialProduct;
        selectedProductName.textContent = initialProduct.nombreProducto;
      }
      return;
    }

    selectedProduct = matched;
    selectedProductName.textContent = matched.nombreProducto;

    if (source === 'codigo') {
      nombreInput.value = matched.nombreProducto;
    }
    if (source === 'nombre') {
      codigoInput.value = matched.codigoProducto;
    }
  };

  codigoInput.addEventListener('input', () => {
    const value = codigoInput.value.trim();
    if (!value) {
      selectedProduct = initialProduct;
      selectedProductName.textContent = initialProduct.nombreProducto;
      return;
    }
    syncReferenceInputs('codigo');
  });

  nombreInput.addEventListener('input', () => {
    const value = nombreInput.value.trim();
    if (!value) {
      selectedProduct = initialProduct;
      selectedProductName.textContent = initialProduct.nombreProducto;
      return;
    }
    syncReferenceInputs('nombre');
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const cantidad = Number(data.cantidad);

    if (!cantidad || cantidad <= 0) {
      showToast('La cantidad debe ser mayor a cero.', 'error');
      return;
    }

    const matchedProduct = findProductByReference(data.codigoReferencia || data.nombreReferencia) || selectedProduct || initialProduct;
    const referencia = data.codigoReferencia?.trim() || data.nombreReferencia?.trim() || matchedProduct.codigoProducto;
    const operationType = type === 'entrada' ? 'Entrada' : 'Salida';
    const escuelaDestino = (type === 'salida' ? data.escuelaDestino : 'Almacén central') || 'Almacén central';

    state.movements.unshift({
      producto: matchedProduct.nombreProducto,
      escuela: escuelaDestino,
      tipo: operationType,
      cantidad,
      fecha: new Date().toISOString(),
      referencia,
      observacion: data.observacion || 'Registrado'
    });

    if (type === 'entrada') {
      matchedProduct.stockActual = Number(matchedProduct.stockActual || 0) + cantidad;
    } else {
      matchedProduct.stockActual = Math.max(0, Number(matchedProduct.stockActual || 0) - cantidad);
    }

    matchedProduct.alertaStock = matchedProduct.stockActual <= matchedProduct.stockMinimo;
    modal.remove();
    renderInventory();
    renderDashboard();
    renderOperations('entradas');
    renderOperations('salidas');
    renderReport();
    showToast(`Operación de ${type === 'entrada' ? 'entrada' : 'salida'} registrada.`, 'success');
  });
}

function renderMenusView() {
  const panel = $('#menu-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-grid three-up">
      <article class="info-card">
        <p class="eyebrow">PLANIFICACIÓN</p>
        <h3>Menú escolar</h3>
        <p>Define comidas por categoría y asigna cobertura por escuela.</p>
        <button class="secondary-btn">Crear menú</button>
      </article>
      <article class="info-card">
        <p class="eyebrow">COBERTURA</p>
        <h3>Asignación</h3>
        <p>Visualiza qué escuelas reciben cada insumo y su volumen total.</p>
        <button class="secondary-btn">Ver distribución</button>
      </article>
      <article class="info-card">
        <p class="eyebrow">PRESUPUESTO</p>
        <h3>Costos</h3>
        <p>Revisa el costo estimado por menú semanal y por grupo.</p>
        <button class="secondary-btn">Calcular</button>
      </article>
    </div>
  `;
}

function renderSettingsView() {
  const panel = $('#settings-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="settings-grid">
      <div class="setting-item">
        <div><strong>Alertas de stock</strong><small>Notificar cuando un producto baja del mínimo.</small></div>
        <label class="switch"><input type="checkbox" checked><span></span></label>
      </div>
      <div class="setting-item">
        <div><strong>Reportes automáticos</strong><small>Enviar resúmenes diarios por correo.</small></div>
        <label class="switch"><input type="checkbox"><span></span></label>
      </div>
      <div class="setting-item">
        <div><strong>Sincronización local</strong><small>Guardar backups de inventario y movimientos.</small></div>
        <label class="switch"><input type="checkbox" checked><span></span></label>
      </div>
      <div class="setting-item">
        <div><strong>Modo de vista</strong><small>Formato claro o oscuro para la operación diaria.</small></div>
        <button class="secondary-btn">Cambiar</button>
      </div>
    </div>
  `;
}

function ensureDynamicViews() {
  const main = $('.main-content');
  if (!main || $('#seccion-entradas')) return;

  main.insertAdjacentHTML(
    'beforeend',
    `<section class="page-content hidden" id="seccion-entradas">
      <div class="page-heading">
        <div>
          <p class="eyebrow">ABASTECIMIENTO</p>
          <h1>Entradas y lotes</h1>
          <p class="subheading">Recepciones, lotes y fechas de vencimiento controlados por FEFO.</p>
        </div>
        <button class="primary-btn">＋ Registrar entrada</button>
      </div>
      <section class="panel">
        <div class="panel-header">
          <h2>Entradas y lotes</h2>
          <span class="status">● FEFO activo</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Producto / escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th><th>Fecha</th><th>Observación</th></tr>
            </thead>
            <tbody id="operations-table"></tbody>
          </table>
        </div>
      </section>
    </section>
    <section class="page-content hidden" id="seccion-salidas">
      <div class="page-heading">
        <div>
          <p class="eyebrow">DISTRIBUCIÓN</p>
          <h1>Salidas y alertas</h1>
          <p class="subheading">Distribuciones a escuelas y alertas de inventario pendientes.</p>
        </div>
        <button class="primary-btn">＋ Registrar salida</button>
      </div>
      <section class="panel">
        <div class="panel-header">
          <h2>Salidas y alertas</h2>
          <span class="stock-low">● Alertas activas</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Producto</th><th>Escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th><th>Fecha</th><th>Observación</th></tr>
            </thead>
            <tbody id="operations-table"></tbody>
          </table>
        </div>
      </section>
    </section>
    <section class="page-content hidden" id="seccion-reportes">
      <div class="page-heading">
        <div>
          <p class="eyebrow">AUDITORÍA</p>
          <h1>Reportes</h1>
          <p class="subheading">Consulta operaciones por fecha personalizada y exporta la vista a PDF.</p>
        </div>
      </div>
      <section class="panel report-filters">
        <label>Desde<input id="report-from" type="date"></label>
        <label>Hasta<input id="report-to" type="date"></label>
        <button class="primary-btn" id="run-report">Generar reporte</button>
        <button class="secondary-btn" id="pdf-report">▣ Descargar PDF</button>
      </section>
      <div class="stats-grid" id="report-summary"></div>
      <section class="panel">
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Escuela</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th></tr>
            </thead>
            <tbody id="report-table"></tbody>
          </table>
        </div>
      </section>
    </section>
    <section class="page-content hidden" id="seccion-escuelas">
      <div class="page-heading">
        <div>
          <p class="eyebrow">DISTRIBUCIÓN</p>
          <h1>Escuelas</h1>
          <p class="subheading">Consulta las entregas completadas y las rutas pendientes.</p>
        </div>
        <button class="primary-btn">＋ Programar entrega</button>
      </div>
      <div class="stats-grid" id="schools-summary"></div>
      <section class="panel">
        <div class="panel-header">
          <h2>Estado de entregas</h2>
          <span class="status">● Seguimiento activo</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Escuela</th><th>Tipo de ración</th><th>Raciones</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody id="schools-table"></tbody>
          </table>
        </div>
      </section>
    </section>
    <section class="page-content hidden" id="seccion-categorias">
      <div class="page-heading">
        <div>
          <p class="eyebrow">MENÚS</p>
          <h1>Programación de menús</h1>
          <p class="subheading">Organiza desayunos por tipo, dieta y distribución escolar.</p>
        </div>
        <button class="primary-btn">＋ Nuevo menú</button>
      </div>
      <section class="panel" id="menu-panel"></section>
    </section>
    <section class="page-content hidden" id="seccion-ajustes">
      <div class="page-heading">
        <div>
          <p class="eyebrow">CONFIGURACIÓN</p>
          <h1>Ajustes</h1>
          <p class="subheading">Controla notificaciones, alertas y permisos del sistema.</p>
        </div>
        <button class="secondary-btn">Guardar cambios</button>
      </div>
      <section class="panel" id="settings-panel"></section>
    </section>`
  );

  $('#run-report')?.addEventListener('click', () => renderReport(true));
  $('#pdf-report')?.addEventListener('click', exportReportPdf);
  $('#report-from')?.addEventListener('change', renderReport);
  $('#report-to')?.addEventListener('change', renderReport);

  const primaryEntryButton = $('#seccion-entradas .primary-btn');
  const primaryExitButton = $('#seccion-salidas .primary-btn');
  const primaryScheduleButton = $('#seccion-escuelas .primary-btn');

  primaryEntryButton?.addEventListener('click', () => {
    const product = state.products[0];
    if (product) openOperation(product.idProducto, 'entrada');
  });

  primaryExitButton?.addEventListener('click', () => {
    const product = state.products[0];
    if (product) openOperation(product.idProducto, 'salida');
  });

  primaryScheduleButton?.addEventListener('click', () => openScheduleModal());

  renderMenusView();
  renderSettingsView();
}

async function loadProducts() {
  state.products = [...demoProducts].map(normalizeProduct);
  renderInventory();
  renderDashboard();
}

async function loadSchools() {
  let savedSchools = [];
  try {
    savedSchools = JSON.parse(localStorage.getItem(SCHOOLS_STORAGE_KEY) || '[]');
  } catch {
    savedSchools = [];
  }
  state.schools = (savedSchools.length ? savedSchools : demoSchools).map(normalizeSchool);
  renderSchools();
  renderDashboard();
}

async function loadMovements() {
  state.movements = [...demoMovements].map(normalizeMovement);
  renderDashboard();
  renderOperations('entradas');
  renderOperations('salidas');
  renderReport();
}

function bindGlobalEvents() {
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-view]');
    if (link) {
      event.preventDefault();
      showView(link.dataset.view);
      $('.sidebar')?.classList.remove('open');
    }
  });

  document.addEventListener('click', event => {
    const sidebar = $('.sidebar');
    if (!sidebar?.classList.contains('open') || window.matchMedia('(min-width: 681px)').matches) return;
    if (!sidebar.contains(event.target) && !event.target.closest('.mobile-menu')) {
      sidebar.classList.remove('open');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') $('.sidebar')?.classList.remove('open');
  });

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-operation]');
    if (action) {
      openOperation(action.dataset.product, action.dataset.operation);
    }
  });

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-schedule-school]');
    if (action) openScheduleModal(action.dataset.scheduleSchool);
  });

  $('#search-input')?.addEventListener('input', renderInventory);
  $('#category-filter')?.addEventListener('change', renderInventory);
  $('.mobile-menu')?.addEventListener('click', () => $('.sidebar').classList.toggle('open'));
  $('#chart-period')?.addEventListener('change', renderDashboard);
}

function initializeAuthenticatedApp() {
  if (!state.session) return;

  ensureDynamicViews();

  const sidebarName = $('.sidebar-footer strong');
  const sidebarRole = $('.sidebar-footer small');
  if (sidebarName) sidebarName.textContent = state.session.user.nombre;
  if (sidebarRole) sidebarRole.textContent = state.session.user.cargo;

  $('#profile-trigger')?.addEventListener('click', openProfile);
  $('#new-product-btn')?.addEventListener('click', openNewProductModal);
  $('#new-product-btn-2')?.addEventListener('click', openNewProductModal);
  $('#new-category-btn')?.addEventListener('click', openNewCategoryModal);
  $('#new-category-btn-2')?.addEventListener('click', openNewCategoryModal);

  loadProducts();
  loadSchools();
  loadMovements();
}

bindGlobalEvents();
renderLogin();

if (state.session) {
  initializeAuthenticatedApp();
}
