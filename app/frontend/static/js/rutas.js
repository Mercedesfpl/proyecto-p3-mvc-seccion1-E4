// frontend/static/js/pages/rutas.js

let editandoId = null;
let loading = false;
let paradasDisponibles = [];
let paradasSeleccionadas = [];

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

function actualizarListaParadas() {
    const list = document.getElementById('paradasList');
    const select = document.getElementById('paradas_select');

    // Limpiar lista
    list.innerHTML = '';

    if (paradasSeleccionadas.length === 0) {
        list.innerHTML = '<li style="color: var(--texto-claro); font-style: italic;">No hay paradas seleccionadas</li>';
        return;
    }

    paradasSeleccionadas.forEach((id, index) => {
        const parada = paradasDisponibles.find(p => p.id === id);
        if (parada) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <span class="orden-numero">${index + 1}</span>
                    ${parada.nombre}
                </span>
                <button class="btn-remove-parada" data-id="${id}" title="Quitar parada">
                    <i class="fas fa-times"></i>
                </button>
            `;
            list.appendChild(li);
        }
    });

    // Eventos para eliminar paradas
    document.querySelectorAll('.btn-remove-parada').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            removerParada(id);
        });
    });
}

function removerParada(id) {
    paradasSeleccionadas = paradasSeleccionadas.filter(p => p !== id);
    actualizarListaParadas();
    actualizarSelectParadas();
}

function actualizarSelectParadas() {
    const select = document.getElementById('paradas_select');
    // Resetear selección
    Array.from(select.options).forEach(opt => opt.selected = false);
    // Marcar las seleccionadas
    Array.from(select.options).forEach(opt => {
        if (paradasSeleccionadas.includes(parseInt(opt.value))) {
            opt.selected = true;
        }
    });
}

async function cargarSelectores() {
    try {
        // Cargar líneas
        const responseLineas = await fetch('/admin/lineas-disponibles', {
            credentials: 'include'
        });
        const dataLineas = await responseLineas.json();
        const lineas = dataLineas.data || [];

        const selectLinea = document.getElementById('id_linea');
        selectLinea.innerHTML = '<option value="">Seleccione una línea...</option>';
        lineas.forEach(l => {
            const option = document.createElement('option');
            option.value = l.id;
            option.textContent = l.nombre;
            selectLinea.appendChild(option);
        });

        // Cargar paradas disponibles
        const responseParadas = await fetch('/admin/paradas-disponibles', {
            credentials: 'include'
        });
        const dataParadas = await responseParadas.json();
        paradasDisponibles = dataParadas.data || [];

        const selectParadas = document.getElementById('paradas_select');
        selectParadas.innerHTML = '';
        paradasDisponibles.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            selectParadas.appendChild(option);
        });

        // Evento para agregar paradas al seleccionar
        selectParadas.addEventListener('change', function() {
            const selectedOptions = Array.from(this.selectedOptions);
            const ids = selectedOptions.map(opt => parseInt(opt.value));

            // Agregar solo las nuevas (que no estén ya seleccionadas)
            ids.forEach(id => {
                if (!paradasSeleccionadas.includes(id)) {
                    paradasSeleccionadas.push(id);
                }
            });

            actualizarListaParadas();
            actualizarSelectParadas();
        });

    } catch (error) {
        console.error('Error al cargar selectores:', error);
        showToast('Error al cargar líneas y paradas', 'error');
    }
}

function abrirModal(titulo, data = null) {
    const modal = document.getElementById('rutaModal');
    document.getElementById('modalTitle').textContent = titulo;

    // Resetear formulario
    document.getElementById('rutaForm').reset();
    document.getElementById('paradas_select').value = '';
    paradasSeleccionadas = [];
    actualizarListaParadas();

    if (data) {
        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('id_linea').value = data.id_linea || '';
        document.getElementById('status').value = data.status || 'activa';

        // Cargar paradas seleccionadas
        if (data.paradas && data.paradas.length > 0) {
            paradasSeleccionadas = data.paradas.map(p => p.id);
            actualizarListaParadas();
            actualizarSelectParadas();
        }
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('btnGuardar').disabled = false;

    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('rutaModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    editandoId = null;
    document.getElementById('btnGuardar').disabled = false;
    paradasSeleccionadas = [];
}

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModal();
});

// Cerrar al hacer clic fuera
window.onclick = (event) => {
    const modal = document.getElementById('rutaModal');
    if (event.target === modal) cerrarModal();
};

async function cargarRutas() {
    try {
        const response = await fetch('/admin/rutas', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const rutas = data.data || [];

        const tablaHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Línea</th>
                        <th>Paradas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rutas.map(r => `
                        <tr>
                            <td>${r.id}</td>
                            <td><strong>${r.nombre}</strong></td>
                            <td>${r.linea_nombre || '-'}</td>
                            <td>${r.paradas ? r.paradas.map(p => p.nombre).join(' → ') : '-'}</td>
                            <td><span class="status-badge ${r.status === 'activa' ? 'status-active' : 'status-inactive'}">${r.status}</span></td>
                            <td>
                                <button class="btn-edit" onclick="editarRuta(${r.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="eliminarRuta(${r.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${rutas.length === 0 ? '<tr><td colspan="6" style="text-align: center; padding: 30px;">No hay rutas registradas</td></tr>' : ''}
                </tbody>
            </table>
        `;
        document.getElementById('tablaRutas').innerHTML = tablaHtml;

    } catch (error) {
        console.error('Error al cargar rutas:', error);
        showToast('Error al cargar rutas', 'error');
    }
}

async function editarRuta(id) {
    try {
        const response = await fetch(`/admin/rutas/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.data) throw new Error('Datos inválidos');

        const ruta = data.data;
        editandoId = id;

        // Asegurar que los selectores estén cargados
        await cargarSelectores();

        abrirModal('Editar Ruta', ruta);

    } catch (error) {
        console.error('Error al cargar ruta:', error);
        showToast('Error al cargar la ruta', 'error');
    }
}

async function eliminarRuta(id) {
    if (!confirm('¿Estás seguro de eliminar esta ruta?')) return;

    try {
        const response = await fetch(`/admin/rutas/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            showToast(' Ruta eliminada exitosamente', 'success');
            cargarRutas();
        } else {
            showToast(data.error || data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión al servidor', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Cargar selectores
    cargarSelectores();

    // Formulario
    document.getElementById('rutaForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (loading) return;
        loading = true;
        document.getElementById('btnGuardar').disabled = true;

        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            id_linea: parseInt(document.getElementById('id_linea').value),
            status: document.getElementById('status').value,
            paradas_ids: paradasSeleccionadas
        };

        // Validaciones
        if (!datos.nombre) {
            showToast(' El nombre es obligatorio', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        if (!datos.id_linea) {
            showToast(' Debes seleccionar una línea', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        if (datos.paradas_ids.length === 0) {
            showToast(' Debes seleccionar al menos una parada', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        const url = editandoId ? `/admin/rutas/${editandoId}` : '/admin/rutas';
        const method = editandoId ? 'PUT' : 'POST';

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
                showToast(editandoId ? ' Ruta actualizada' : ' Ruta creada exitosamente', 'success');
                cerrarModal();
                cargarRutas();
            } else {
                showToast(data.error || data.message || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión al servidor', 'error');
        } finally {
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
        }
    });

    // Botón nueva ruta
    document.getElementById('btnNuevaRuta').onclick = async () => {
        editandoId = null;
        await cargarSelectores();
        paradasSeleccionadas = [];
        actualizarListaParadas();
        abrirModal('Nueva Ruta');
    };

    // Cargar rutas
    cargarRutas();
});