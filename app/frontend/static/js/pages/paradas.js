// frontend/static/js/pages/paradas.js

let editandoId = null;
let loading = false;

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

function abrirModal(titulo, data = null) {
    const modal = document.getElementById('paradaModal');
    document.getElementById('modalTitle').textContent = titulo;
    
    if (data) {
        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('coordenadas').value = data.coordenadas || '';
        document.getElementById('status').value = data.status || 'activa';
    } else {
        document.getElementById('paradaForm').reset();
        document.getElementById('status').value = 'activa';
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('btnGuardar').disabled = false;
}

function cerrarModal() {
    const modal = document.getElementById('paradaModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    editandoId = null;
    document.getElementById('btnGuardar').disabled = false;
}

async function cargarParadas() {
    try {
        const response = await fetch('/admin/paradas', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const paradas = data.data || [];
        
        const tablaHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Coordenadas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${paradas.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td><strong>${p.nombre}</strong></td>
                            <td>${p.coordenadas}</td>
                            <td><span class="status-badge ${p.status === 'activa' ? 'status-active' : 'status-inactive'}">${p.status}</span></td>
                            <td>
                                <button class="btn-edit" onclick="editarParada(${p.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="eliminarParada(${p.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${paradas.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 30px;">No hay paradas registradas</td></tr>' : ''}
                </tbody>
            </table>
        `;
        document.getElementById('tablaParadas').innerHTML = tablaHtml;
        
    } catch (error) {
        console.error('Error al cargar paradas:', error);
        showToast('Error al cargar paradas', 'error');
    }
}

async function editarParada(id) {
    try {
        const response = await fetch(`/admin/paradas/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.data) throw new Error('Datos inválidos');
        
        const parada = data.data;
        editandoId = id;
        abrirModal('Editar Parada', parada);
        
    } catch (error) {
        console.error('Error al cargar parada:', error);
        showToast('Error al cargar la parada', 'error');
    }
}

async function eliminarParada(id) {
    if (!confirm('¿Estás seguro de eliminar esta parada?')) return;
    
    try {
        const response = await fetch(`/admin/paradas/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast('Parada eliminada exitosamente', 'success');
            cargarParadas();
        } else {
            showToast(data.error || data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión al servidor', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('paradaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (loading) return;
        loading = true;
        document.getElementById('btnGuardar').disabled = true;
        
        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            coordenadas: document.getElementById('coordenadas').value.trim(),
            status: document.getElementById('status').value
        };
        
        if (!datos.nombre) {
            showToast(' El nombre es obligatorio', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }
        
        if (!datos.coordenadas) {
            showToast(' Las coordenadas son obligatorias', 'error');
            loading = false;
            document.getElementById('btnGuardar').disabled = false;
            return;
        }
        
        const url = editandoId ? `/admin/paradas/${editandoId}` : '/admin/paradas';
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
                showToast(editandoId ? ' Parada actualizada' : ' Parada creada exitosamente', 'success');
                cerrarModal();
                cargarParadas();
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
    
    document.getElementById('btnNuevaParada').onclick = () => {
        editandoId = null;
        abrirModal('Nueva Parada');
    };
    
    window.onclick = (event) => {
        const modal = document.getElementById('paradaModal');
        if (event.target === modal) cerrarModal();
    };
    
    cargarParadas();
});