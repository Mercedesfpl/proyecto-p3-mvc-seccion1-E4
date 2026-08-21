// frontend/static/js/pages/flota.js

let editandoIdUnidad = null;
let loadingUnidad = false;
let todosLosBuses = [];
let busesFiltrados = [];
let paginaActual = 1;
const registrosPorPagina = 5;

// ========== TOAST ==========

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-message ${type} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ========== MODAL ==========

function abrirModalUnidad(titulo = 'Nueva Unidad', data = null) {
    const modal = document.getElementById('modalNuevaUnidad');
    if (!modal) return;

    document.getElementById('modalUnidadTitle').textContent = titulo;
    document.getElementById('formNuevaUnidad').reset();
    document.getElementById('status').value = 'activa';
    editandoIdUnidad = null;

    cargarSelectoresUnidad();

    if (data) {
        document.getElementById('placa').value = data.placa || '';
        document.getElementById('id_linea').value = data.id_linea || '';
        document.getElementById('id_ruta').value = data.id_ruta || '';
        document.getElementById('status').value = data.status || 'activa';
        editandoIdUnidad = data.id_vehiculo || null;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    const btnGuardar = document.getElementById('guardarUnidadBtn');
    if (btnGuardar) btnGuardar.disabled = false;
}

function cerrarModalUnidad() {
    const modal = document.getElementById('modalNuevaUnidad');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    editandoIdUnidad = null;
    const btnGuardar = document.getElementById('guardarUnidadBtn');
    if (btnGuardar) btnGuardar.disabled = false;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModalUnidad();
});

// ========== CARGAR SELECTORES ==========

async function cargarSelectoresUnidad() {
    try {
        const respLineas = await fetch('/admin/lineas', { credentials: 'include' });
        const dataLineas = await respLineas.json();
        if (dataLineas.success) {
            const select = document.getElementById('id_linea');
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Seleccione una línea...</option>';
                dataLineas.data.forEach(linea => {
                    const opt = document.createElement('option');
                    opt.value = linea.id;
                    opt.textContent = linea.nombre;
                    select.appendChild(opt);
                });
                if (currentValue) select.value = currentValue;
            }
        }

        const respRutas = await fetch('/admin/rutas/api', { credentials: 'include' });
        const dataRutas = await respRutas.json();
        if (dataRutas.success) {
            const select = document.getElementById('id_ruta');
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Sin ruta asignada</option>';
                dataRutas.data.forEach(ruta => {
                    const opt = document.createElement('option');
                    opt.value = ruta.id;
                    opt.textContent = ruta.nombre;
                    select.appendChild(opt);
                });
                if (currentValue) select.value = currentValue;
            }
        }

    } catch (error) {
        console.error('Error al cargar selectores:', error);
        showToast('Error al cargar datos del formulario', 'error');
    }
}

// ========== PAGINACION Y BUSQUEDA ==========

function filtrarBuses() {
    const busqueda = document.getElementById('searchUnidad')?.value?.toLowerCase() || '';
    const filterLinea = document.getElementById('filterLinea')?.value || '';
    const filterEstado = document.getElementById('filterEstado')?.value || '';

    busesFiltrados = todosLosBuses.filter(bus => {
        const placa = (bus.placa || '').toLowerCase();
        const linea = bus.linea_nombre || '';
        const estado = bus.status || '';

        let coincide = true;
        if (busqueda && !placa.includes(busqueda) && !linea.toLowerCase().includes(busqueda)) coincide = false;
        if (filterLinea && linea !== filterLinea) coincide = false;
        if (filterEstado && estado !== filterEstado) coincide = false;
        return coincide;
    });

    paginaActual = 1;
    renderizarTabla();
    actualizarPaginacion();
}

function renderizarTabla() {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const busesPagina = busesFiltrados.slice(inicio, fin);

    const container = document.getElementById('tablaUnidades');
    if (!container) return;

    if (busesFiltrados.length === 0) {
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Placa</th>
                        <th>Línea</th>
                        <th>Ruta</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 30px; color: var(--texto-claro);">
                            No hay unidades que coincidan con la búsqueda
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Placa</th>
                    <th>Línea</th>
                    <th>Ruta</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    busesPagina.forEach(bus => {
        const codigo = `BUS-${String(bus.id_vehiculo).padStart(3, '0')}`;
        const statusClass = bus.status === 'activa' ? 'status-active' : 'status-inactive';
        const statusText = bus.status === 'activa' ? 'Activa' : 'Inactiva';
        const nombreLinea = bus.linea_nombre || 'Sin línea';
        const nombreRuta = bus.ruta_nombre || 'Sin ruta';

        html += `
            <tr>
                <td><strong>${codigo}</strong></td>
                <td>${bus.placa}</td>
                <td>${nombreLinea}</td>
                <td>${nombreRuta}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-edit" onclick="editarUnidad(${bus.id_vehiculo})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="eliminarUnidad(${bus.id_vehiculo})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(busesFiltrados.length / registrosPorPagina) || 1;
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const infoPagina = document.getElementById('infoPagina');

    if (btnAnterior) btnAnterior.disabled = paginaActual <= 1;
    if (btnSiguiente) btnSiguiente.disabled = paginaActual >= totalPaginas;
    if (infoPagina) infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
}

function irPagina(direccion) {
    const totalPaginas = Math.ceil(busesFiltrados.length / registrosPorPagina) || 1;
    const nuevaPagina = paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        renderizarTabla();
        actualizarPaginacion();
    }
}

// ========== CRUD ==========

async function cargarBuses() {
    try {
        const response = await fetch('/admin/buses', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.success && data.data) {
            todosLosBuses = data.data || [];
        } else {
            todosLosBuses = [];
        }

        busesFiltrados = [...todosLosBuses];
        renderizarTabla();
        actualizarPaginacion();

    } catch (error) {
        console.error('Error al cargar buses:', error);
        showToast('Error al cargar unidades', 'error');
    }
}

async function editarUnidad(id) {
    try {
        const response = await fetch(`/admin/buses/${id}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.data) throw new Error('Datos inválidos');

        await cargarSelectoresUnidad();
        abrirModalUnidad('Editar Unidad', data.data);

    } catch (error) {
        console.error('Error al cargar unidad:', error);
        showToast('Error al cargar la unidad', 'error');
    }
}

async function eliminarUnidad(id) {
    if (!id) {
        showToast('ID de unidad inválido', 'error');
        return;
    }

    const confirmado = await confirmDelete(
        '¿Eliminar unidad?',
        'Esta acción eliminará la unidad del sistema y no se podrá deshacer.',
        'Sí, eliminar'
    );

    if (!confirmado) return;

    try {
        const response = await fetch(`/admin/buses/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            showToast('Unidad eliminada exitosamente', 'success');
            cargarBuses();
        } else {
            showToast(data.error || data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión al servidor', 'error');
    }
}

// ========== INICIALIZACION ==========

document.addEventListener('DOMContentLoaded', function() {
    cargarSelectoresUnidad();

    document.getElementById('searchUnidad')?.addEventListener('input', filtrarBuses);
    document.getElementById('filterLinea')?.addEventListener('change', filtrarBuses);
    document.getElementById('filterEstado')?.addEventListener('change', filtrarBuses);

    document.getElementById('btnAnterior')?.addEventListener('click', function() { irPagina(-1); });
    document.getElementById('btnSiguiente')?.addEventListener('click', function() { irPagina(1); });

    const form = document.getElementById('formNuevaUnidad');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (loadingUnidad) return;
            loadingUnidad = true;
            const btnGuardar = document.getElementById('guardarUnidadBtn');
            if (btnGuardar) btnGuardar.disabled = true;

            const datos = {
                placa: document.getElementById('placa').value.trim().toUpperCase(),
                id_linea: parseInt(document.getElementById('id_linea').value),
                id_ruta: document.getElementById('id_ruta').value ? parseInt(document.getElementById('id_ruta').value) : null,
                status: document.getElementById('status').value
            };

            if (!datos.placa) {
                showToast('La placa es obligatoria', 'error');
                loadingUnidad = false;
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }

            if (!datos.id_linea) {
                showToast('Debes seleccionar una línea', 'error');
                loadingUnidad = false;
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }

            const url = editandoIdUnidad ? `/admin/buses/${editandoIdUnidad}` : '/admin/buses';
            const method = editandoIdUnidad ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(datos)
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(editandoIdUnidad ? 'Unidad actualizada' : 'Unidad creada exitosamente', 'success');
                    cerrarModalUnidad();
                    cargarBuses();
                } else {
                    showToast(data.error || data.message || 'Error al guardar', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error de conexión al servidor', 'error');
            } finally {
                loadingUnidad = false;
                if (btnGuardar) btnGuardar.disabled = false;
            }
        });
    }

    const btnNueva = document.getElementById('btnNuevaUnidad');
    if (btnNueva) {
        btnNueva.addEventListener('click', function() {
            editandoIdUnidad = null;
            cargarSelectoresUnidad();
            abrirModalUnidad('Nueva Unidad');
        });
    }

    window.onclick = function(event) {
        const modal = document.getElementById('modalNuevaUnidad');
        if (event.target === modal) {
            cerrarModalUnidad();
        }
    };

    cargarBuses();
});