// ========================================
// PÁGINA DE PERSONAS - CRUD
// ========================================

let editandoId = null;
let loading = false;

function getBadgeForRol(rol) {
    if (!rol) return '<span class="badge badge-sin-rol">Sin rol</span>';

    const map = {
        'admin': 'badge-admin',
        'administrador': 'badge-administrador',
        'presidente': 'badge-presidente',
        'secretario': 'badge-secretario'
    };

    const clase = map[rol.toLowerCase()] || 'badge-sin-rol';

    const nombreMostrar = {
        'admin': 'Admin',
        'administrador': 'Admin',
        'presidente': 'Presidente',
        'secretario': 'Secretario'
    };

    return `<span class="badge ${clase}">${nombreMostrar[rol] || rol}</span>`;
}

function abrirModal(titulo, data = null) {
    const modal = document.getElementById('personaModal');

    document.getElementById('modalTitle').textContent = titulo;

    if (data) {
        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('apellido').value = data.apellido || '';
        document.getElementById('cedula').value = data.cedula || '';
        document.getElementById('correo').value = data.correo || '';
        document.getElementById('telefono').value = data.telefono || '';
        document.getElementById('rol').value = data.rol || '';
    } else {
        document.getElementById('personaForm').reset();
        document.getElementById('rol').value = '';
    }

    modal.classList.add('show');
    document.getElementById('btnGuardar').disabled = false;
}

function cerrarModal() {
    const modal = document.getElementById('personaModal');
    modal.classList.remove('show');
    editandoId = null;
    document.getElementById('btnGuardar').disabled = false;
}

async function cargarPersonas() {
    try {
        const response = await fetch('/admin/personas', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const personas = data.data || [];

        if (!Array.isArray(personas)) {
            throw new Error('Datos inválidos');
        }

        const tablaHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Cédula</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${personas.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td><strong>${p.nombre_completo}</strong></td>
                            <td>${p.cedula}</td>
                            <td>${p.correo || '-'}</td>
                            <td>${getBadgeForRol(p.rol)}</td>
                            <td>
                                <button class="btn-edit" onclick="editarPersona(${p.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="eliminarPersona(${p.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${personas.length === 0 ? `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 30px; color: var(--texto-claro);">
                                No hay personas registradas
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;

        document.getElementById('tablaPersonas').innerHTML = tablaHtml;
    } catch (error) {
        console.error('Error al cargar personas:', error);
        showToast('Error al cargar personas: ' + error.message, 'error');
        document.getElementById('tablaPersonas').innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--rojo);">
                <i class="fas fa-exclamation-triangle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                <p>Error al cargar los datos. Revisa la consola.</p>
                <button class="btn-secondary" style="margin-top: 12px;" onclick="cargarPersonas()">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

async function editarPersona(id) {
    try {
        const response = await fetch(`/admin/personas/${id}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.data) throw new Error('Datos inválidos');

        const persona = data.data;
        editandoId = id;
        abrirModal('Editar Persona', persona);
    } catch (error) {
        console.error('Error al cargar persona:', error);
        showToast('Error al cargar la persona: ' + error.message, 'error');
    }
}

async function eliminarPersona(id) {
    const confirmado = await confirmDelete(
        '¿Estás seguro?',
        '¿Deseas eliminar esta persona? Esta acción no se puede deshacer.',
        'Sí, eliminar'
    );
    if (!confirmado) return;

    try {
        const response = await fetch(`/admin/personas/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Persona eliminada exitosamente', 'success');
            cargarPersonas();
        } else {
            showToast(data.error || data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión al servidor', 'error');
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Formulario
    document.getElementById('personaForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (loading) return;
        loading = true;
        document.getElementById('btnGuardar').disabled = true;

        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            cedula: document.getElementById('cedula').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            rol: document.getElementById('rol').value
        };

        if (!datos.nombre || !datos.apellido || !datos.cedula) {
            showToast('Nombre, apellido y cédula son obligatorios', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        if (!datos.rol) {
            showToast('Debes seleccionar un rol', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }

        const url = editandoId ? `/admin/personas/${editandoId}` : '/admin/personas';
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
                showToast(editandoId ? 'Persona actualizada' : 'Persona creada exitosamente', 'success');
                cerrarModal();
                cargarPersonas();
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

    // Botón nueva persona
    document.getElementById('btnNuevaPersona').onclick = () => {
        editandoId = null;
        abrirModal('Nueva Persona');
    };

    // Cerrar modal al hacer clic fuera
    window.onclick = (event) => {
        const modal = document.getElementById('personaModal');
        if (event.target === modal) {
            cerrarModal();
        }
    };

    // Cargar personas
    cargarPersonas();
});