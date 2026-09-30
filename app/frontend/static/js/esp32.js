// frontend/static/js/esp32.js

let esp32EditandoId = null;
let esp32Loading = false;
let todosLosEsp32 = [];
let esp32Filtrados = [];
let esp32PaginaActual = 1;
const esp32ItemsPorPagina = 10;
let esp32IdViendo = null;

// Datos simulados mientras no hay backend
let dispositivos = [
    { id: 1, mac: 'AA:BB:CC:11:22:33', tipo: 'bus', firmware: '1.0.2', status: 'activo' },
    { id: 2, mac: 'DD:EE:FF:44:55:66', tipo: 'parada', firmware: '1.0.0', status: 'activo' },
    { id: 3, mac: '11:22:33:44:55:66', tipo: 'bus', firmware: '0.9.8', status: 'inactivo' }
];

// ========== MODAL NUEVA/EDITAR ==========
function abrirModal(titulo = 'Nuevo ESP32', data = null) {
    const modal = document.getElementById('modalEsp32');
    const form = document.getElementById('formEsp32');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('esp32Id').value = '';
    document.getElementById('modalTitle').textContent = titulo;

    const passInput = document.getElementById('password');
    if (passInput) passInput.required = true;

    if (data) {
        document.getElementById('esp32Id').value = data.id;
        document.getElementById('mac').value = data.mac || '';
        document.getElementById('tipo_dispositivo').value = data.tipo || '';
        document.getElementById('version_firmware').value = data.firmware || '';
        document.getElementById('status').value = data.status || 'activo';
        if (passInput) passInput.required = false;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('btnGuardar').disabled = false;
}

function cerrarModal() {
    const modal = document.getElementById('modalEsp32');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    esp32EditandoId = null;
    const btn = document.getElementById('btnGuardar');
    if (btn) btn.disabled = false;
}

// ========== CARGAR DATOS ==========
function cargarEsp32() {
    // Mientras no exista endpoint real, usamos los datos simulados
    todosLosEsp32 = [...dispositivos];
    esp32Filtrados = [...todosLosEsp32];
    esp32PaginaActual = 1;
    renderizarPaginaEsp32();

    /* Cuando tengas backend:
    fetch('/api/esp32', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
            todosLosEsp32 = data.data || [];
            esp32Filtrados = [...todosLosEsp32];
            esp32PaginaActual = 1;
            renderizarPaginaEsp32();
        })
        .catch(err => {
            console.error('Error al cargar ESP32:', err);
            if (typeof showToast === 'function') showToast('Error al cargar dispositivos', 'error');
        });
    */
}

// ========== RENDERIZAR PÁGINA ==========
function renderizarPaginaEsp32() {
    const tbody = document.getElementById('esp32TableBody');
    if (!tbody) return;

    if (esp32Filtrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-vacia">No hay dispositivos ESP32 registrados</td>
            </tr>`;
        actualizarControlesPaginacionEsp32(0);
        return;
    }

    const inicio = (esp32PaginaActual - 1) * esp32ItemsPorPagina;
    const fin = inicio + esp32ItemsPorPagina;
    const pagina = esp32Filtrados.slice(inicio, fin);

    tbody.innerHTML = '';
    pagina.forEach((disp) => {
        const statusClass = disp.status === 'activo' ? 'status-active' : 'status-inactive';
        const statusText = disp.status === 'activo' ? 'Activo' : 'Inactivo';
        const tipoLabel = disp.tipo === 'bus' ? 'Bus' : 'Parada';
        const tipoIcon = disp.tipo === 'bus' ? 'fa-bus' : 'fa-map-marker-alt';

        const tr = document.createElement('tr');
        tr.setAttribute('data-tipo', disp.tipo);
        tr.setAttribute('data-status', disp.status);
        tr.innerHTML = `
            <td><strong>ESP32-${String(disp.id).padStart(3, '0')}</strong></td>
            <td>${disp.mac}</td>
            <td><i class="fas ${tipoIcon}" style="color: var(--azul); margin-right: 6px;"></i>${tipoLabel}</td>
            <td>${disp.firmware || 'N/A'}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas fa-circle"></i> ${statusText}
                </span>
            </td>
            <td class="action-buttons">
                <button class="action-btn view" data-id="${disp.id}" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${disp.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${disp.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    asignarEventosTablaEsp32();
    actualizarControlesPaginacionEsp32(esp32Filtrados.length);
}

function actualizarControlesPaginacionEsp32(totalItems) {
    const totalPaginas = Math.max(1, Math.ceil(totalItems / esp32ItemsPorPagina));
    const info = document.getElementById('infoPagina');
    const btnPrev = document.getElementById('btnAnterior');
    const btnNext = document.getElementById('btnSiguiente');

    if (info) info.textContent = `Página ${esp32PaginaActual} de ${totalPaginas}`;
    if (btnPrev) btnPrev.disabled = esp32PaginaActual === 1;
    if (btnNext) btnNext.disabled = esp32PaginaActual >= totalPaginas;
}

// ========== EVENTOS TABLA ==========
function asignarEventosTablaEsp32() {
    document.querySelectorAll('.action-btn.view').forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            verEsp32(this.getAttribute('data-id'));
        };
    });
    document.querySelectorAll('.action-btn.edit').forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            editarEsp32(this.getAttribute('data-id'));
        };
    });
    document.querySelectorAll('.action-btn.delete').forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            eliminarEsp32(this.getAttribute('data-id'));
        };
    });
}

// ========== VER ==========
function verEsp32(id) {
    const disp = todosLosEsp32.find((d) => String(d.id) === String(id));
    if (!disp) return;

    esp32IdViendo = id;
    const statusClass = disp.status === 'activo' ? 'status-active' : 'status-inactive';
    const statusText = disp.status === 'activo' ? 'Activo' : 'Inactivo';
    const tipoLabel = disp.tipo === 'bus' ? 'Bus' : 'Parada';

    document.getElementById('verEsp32Id').textContent = `ESP32-${String(disp.id).padStart(3, '0')}`;
    document.getElementById('verEsp32Mac').textContent = disp.mac || '-';
    document.getElementById('verEsp32Tipo').textContent = tipoLabel;
    document.getElementById('verEsp32Firmware').textContent = disp.firmware || 'N/A';
    document.getElementById('verEsp32Estado').textContent = statusText;

    const badge = document.getElementById('verEsp32EstadoBadge');
    badge.className = 'status-badge';
    badge.classList.add(statusClass);

    document.getElementById('modalVerEsp32').classList.add('show');
}

function cerrarModalVerEsp32() {
    document.getElementById('modalVerEsp32').classList.remove('show');
    esp32IdViendo = null;
}

function editarDesdeVerEsp32() {
    const id = esp32IdViendo;
    cerrarModalVerEsp32();
    if (id) editarEsp32(id);
}

// ========== EDITAR ==========
function editarEsp32(id) {
    const disp = todosLosEsp32.find((d) => String(d.id) === String(id));
    if (!disp) return;
    esp32EditandoId = id;
    abrirModal('Editar ESP32', disp);
}

// ========== ELIMINAR ==========
async function eliminarEsp32(id) {
    let confirmado = false;
    if (typeof confirmDelete === 'function') {
        confirmado = await confirmDelete(
            '¿Eliminar dispositivo ESP32?',
            'El dispositivo dejará de enviar lecturas al sistema.'
        );
    } else {
        confirmado = confirm('¿Eliminar dispositivo ESP32?');
    }
    if (!confirmado) return;

    // Cuando tengas backend:
    // const csrfToken = getCookie('csrf_access_token');
    // const response = await fetch(`/api/esp32/${id}`, {
    //     method: 'DELETE',
    //     credentials: 'include',
    //     headers: { 'X-CSRF-TOKEN': csrfToken }
    // });
    // if (response.ok) { ... }

    dispositivos = dispositivos.filter((d) => String(d.id) !== String(id));
    cargarEsp32();
    if (typeof showToast === 'function') showToast('Dispositivo eliminado correctamente', 'success');
}

// ========== FILTROS ==========
function aplicarFiltrosEsp32() {
    const searchTerm = document.getElementById('searchEsp32')?.value?.toLowerCase() || '';
    const filterTipo = document.getElementById('filterTipo')?.value || '';
    const filterStatus = document.getElementById('filterStatus')?.value || '';

    esp32Filtrados = todosLosEsp32.filter((disp) => {
        const mac = (disp.mac || '').toLowerCase();
        const tipo = disp.tipo || '';
        const status = disp.status || '';

        if (searchTerm && !mac.includes(searchTerm)) return false;
        if (filterTipo && tipo !== filterTipo) return false;
        if (filterStatus && status !== filterStatus) return false;
        return true;
    });

    esp32PaginaActual = 1;
    renderizarPaginaEsp32();
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnNuevoEsp32')?.addEventListener('click', () => {
        esp32EditandoId = null;
        abrirModal('Nuevo ESP32');
    });

    const form = document.getElementById('formEsp32');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (esp32Loading) return;
            esp32Loading = true;
            document.getElementById('btnGuardar').disabled = true;

            const id = document.getElementById('esp32Id').value;
            const mac = document.getElementById('mac').value.trim();
            const tipo = document.getElementById('tipo_dispositivo').value;
            const firmware = document.getElementById('version_firmware').value.trim();
            const status = document.getElementById('status').value;

            if (!mac || !tipo) {
                if (typeof showToast === 'function') showToast('MAC y tipo son obligatorios', 'warning');
                esp32Loading = false;
                document.getElementById('btnGuardar').disabled = false;
                return;
            }

            if (id) {
                // Editar
                const disp = dispositivos.find((d) => String(d.id) === String(id));
                if (disp) {
                    disp.mac = mac;
                    disp.tipo = tipo;
                    disp.firmware = firmware;
                    disp.status = status;
                }
                if (typeof showToast === 'function') showToast('Dispositivo actualizado con éxito', 'success');
            } else {
                // Crear
                const nuevo = {
                    id: Date.now(),
                    mac: mac,
                    tipo: tipo,
                    firmware: firmware || '1.0.0',
                    status: status,
                };
                dispositivos.unshift(nuevo);
                if (typeof showToast === 'function') showToast('Nuevo ESP32 registrado', 'success');
            }

            cerrarModal();
            cargarEsp32();
            esp32Loading = false;
            document.getElementById('btnGuardar').disabled = false;
        });
    }

    // Cerrar modales
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalEsp32');
        if (event.target === modal) cerrarModal();

        const modalVer = document.getElementById('modalVerEsp32');
        if (event.target === modalVer) cerrarModalVerEsp32();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalEsp32');
            if (modal && modal.classList.contains('show')) cerrarModal();

            const modalVer = document.getElementById('modalVerEsp32');
            if (modalVer && modalVer.classList.contains('show')) cerrarModalVerEsp32();
        }
    });

    // Filtros
    document.getElementById('searchEsp32')?.addEventListener('input', aplicarFiltrosEsp32);
    document.getElementById('filterTipo')?.addEventListener('change', aplicarFiltrosEsp32);
    document.getElementById('filterStatus')?.addEventListener('change', aplicarFiltrosEsp32);

    // Paginación
    document.getElementById('btnAnterior')?.addEventListener('click', () => {
        if (esp32PaginaActual > 1) {
            esp32PaginaActual--;
            renderizarPaginaEsp32();
        }
    });
    document.getElementById('btnSiguiente')?.addEventListener('click', () => {
        const totalPaginas = Math.max(1, Math.ceil(esp32Filtrados.length / esp32ItemsPorPagina));
        if (esp32PaginaActual < totalPaginas) {
            esp32PaginaActual++;
            renderizarPaginaEsp32();
        }
    });

    cargarEsp32();
});