// ========================================
// PÁGINA DE LÍNEAS - CRUD
// ========================================

let editandoId = null;
let loading = false;
let presidentes = [];
let secretarios = [];

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

// ========== CARGAR SELECTORES ==========
async function cargarSelectores() {
    try {
        // Cargar presidentes (personas con rol 'presidente')
        const responsePres = await fetch('/admin/personas/select', {
            credentials: 'include'
        });
        const dataPres = await responsePres.json();
        presidentes = dataPres.data || [];

        // Cargar secretarios (usuarios con rol 'secretario')
        const responseSec = await fetch('/admin/secretarios/select', {
            credentials: 'include'
        });
        const dataSec = await responseSec.json();
        secretarios = dataSec.data || [];

        // Llenar select de presidentes
        const selectPres = document.getElementById('presidente_id');
        selectPres.innerHTML = '<option value="">Seleccione un presidente...</option>';
        presidentes.forEach(p => {
            if (p.rol === 'presidente') {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${p.nombre_completo} - ${p.cedula}`;
                selectPres.appendChild(option);
            }
        });

        // Llenar select de secretarios
        const selectSec = document.getElementById('secretario_id');
        selectSec.innerHTML = '<option value="">Seleccione un secretario (opcional)...</option>';
        secretarios.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.nombre} - ${s.email}`;
            selectSec.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar selectores:', error);
        showToast('Error al cargar presidentes y secretarios', 'error');
    }
}

// ========== MODAL ==========
function abrirModal(titulo, data = null) {
    const modal = document.getElementById('lineaModal');
    document.getElementById('modalTitle').textContent = titulo;

    // Resetear formulario
    document.getElementById('lineaForm').reset();
    document.getElementById('presidente_id').value = '';
    document.getElementById('secretario_id').value = '';

    if (data) {
        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('rif').value = data.rif || '';
        document.getElementById('presidente_id').value = data.presidente_id || '';
        document.getElementById('secretario_id').value = data.secretario_id || '';
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('btnGuardar').disabled = false;

    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('lineaModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    editandoId = null;
    document.getElementById('btnGuardar').disabled = false;
}

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModal();
});

// ========== CARGAR LÍNEAS ==========
async function cargarLineas() {
    try {
        const response = await fetch('/admin/lineas', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const lineas = data.data || [];

        const tablaHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Presidente</th>
                        <th>Secretario</th>
                        <th>RIF</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${lineas.map(linea => `
                        <tr>
                            <td>${linea.id}</td>
                            <td><strong>${linea.nombre}</strong></td>
                            <td>${linea.presidente ? linea.presidente.nombre_completo : '-'}</td>
                            <td>${linea.secretario_nombre || '-'}</td>
                            <td>${linea.rif}</td>
                            <td>
                                <button class="btn-edit" onclick="editarLinea(${linea.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="eliminarLinea(${linea.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${lineas.length === 0 ? `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 30px; color: var(--texto-claro);">
                                No hay líneas registradas
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;

        document.getElementById('tablaLineas').innerHTML = tablaHtml;

    } catch (error) {
        console.error('Error al cargar líneas:', error);
        showToast('Error al cargar líneas', 'error');
    }
}

// ========== EDITAR LÍNEA ==========
async function editarLinea(id) {
    try {
        const response = await fetch(`/admin/lineas/${id}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.data) throw new Error('Datos inválidos');

        const linea = data.data;
        editandoId = id;

        // Asegurar que los selects estén cargados
        await cargarSelectores();

        abrirModal('Editar Línea', {
            nombre: linea.nombre || '',
            rif: linea.rif || '',
            presidente_id: linea.presidente_id || '',
            secretario_id: linea.secretario_id || ''
        });

    } catch (error) {
        console.error('Error al cargar línea:', error);
        showToast('Error al cargar la línea', 'error');
    }
}

// ========== ELIMINAR LÍNEA ==========
async function eliminarLinea(id) {
    if (!confirm('¿Estás seguro de suspender esta línea?')) return;

    try {
        const response = await fetch(`/admin/lineas/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ Línea suspendida exitosamente', 'success');
            cargarLineas();
        } else {
            showToast(data.error || data.message || 'Error al suspender', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión al servidor', 'error');
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar selectores
    await cargarSelectores();

    // Formulario
    document.getElementById('lineaForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (loading) return;
        loading = true;
        document.getElementById('btnGuardar').disabled = true;

        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            rif: document.getElementById('rif').value.trim(),
            presidente_id: parseInt(document.getElementById('presidente_id').value),
            secretario_id: document.getElementById('secretario_id').value ?
                parseInt(document.getElementById('secretario_id').value) : null
        };

        // Validaciones
        if (!datos.nombre) {
            showToast('⚠️ El nombre es obligatorio', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        if (!datos.rif) {
            showToast('⚠️ El RIF es obligatorio', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        if (!datos.presidente_id) {
            showToast('⚠️ Debes seleccionar un presidente', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        const url = editandoId ? `/admin/lineas/${editandoId}` : '/admin/lineas';
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
                showToast(editandoId ? '✅ Línea actualizada' : '✅ Línea creada exitosamente', 'success');
                cerrarModal();
                cargarLineas();
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

    // Botón nueva línea
    document.getElementById('btnNuevaLinea').onclick = async () => {
        editandoId = null;
        await cargarSelectores();
        abrirModal('Nueva Línea');
    };

    // Cerrar modal al hacer clic fuera
    window.onclick = (event) => {
        const modal = document.getElementById('lineaModal');
        if (event.target === modal) {
            cerrarModal();
        }
    };

    // Cargar líneas
    cargarLineas();
});