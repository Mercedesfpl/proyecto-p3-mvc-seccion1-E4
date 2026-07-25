// frontend/static/js/pages/paradas.js

let editandoId = null;
let loading = false;
let mapa = null;
let marcador = null;
let mapaPrincipal = null;
let marcadoresPrincipales = [];

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

// ========== MAPA PRINCIPAL ==========

function destruirMapaPrincipal() {
    if (mapaPrincipal) {
        mapaPrincipal.off();
        mapaPrincipal.remove();
        mapaPrincipal = null;
        marcadoresPrincipales = [];
    }
    const container = document.getElementById('mapa-principal');
    if (container) {
        container.innerHTML = '';
    }
}

function inicializarMapaPrincipal(paradas = []) {
    if (mapaPrincipal) {
        destruirMapaPrincipal();
    }

    const container = document.getElementById('mapa-principal');
    if (!container) {
        console.error('Contenedor del mapa principal no encontrado');
        return;
    }

    container.innerHTML = '';

    let centroLat = 10.3447;
    let centroLng = -67.0400;

    if (paradas.length > 0) {
        const coords = paradas[0].coordenadas.split(',');
        if (coords.length === 2) {
            centroLat = parseFloat(coords[0].trim());
            centroLng = parseFloat(coords[1].trim());
            if (isNaN(centroLat) || isNaN(centroLng)) {
                centroLat = 10.3447;
                centroLng = -67.0400;
            }
        }
    }

    mapaPrincipal = L.map('mapa-principal').setView([centroLat, centroLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapaPrincipal);

    paradas.forEach(parada => {
        const coords = parada.coordenadas.split(',');
        if (coords.length === 2) {
            const lat = parseFloat(coords[0].trim());
            const lng = parseFloat(coords[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
                agregarMarcadorPrincipal(lat, lng, parada);
            }
        }
    });

    const contador = document.getElementById('contadorParadas');
    if (contador) {
        contador.textContent = `${paradas.length} paradas`;
    }

    setTimeout(() => {
        if (mapaPrincipal) mapaPrincipal.invalidateSize();
    }, 300);
}

function agregarMarcadorPrincipal(lat, lng, parada) {
    if (!mapaPrincipal) return;

    const esActiva = parada.status === 'activa';
    const color = esActiva ? '#ea4335' : '#95a5a6';

    const icono = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                border: 2px solid white;
                position: relative;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                "></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });

    const marcador = L.marker([lat, lng], { icon: icono }).addTo(mapaPrincipal);

    const estadoTexto = esActiva ? 'Activa' : 'Inactiva';
    const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
            <strong style="font-size: 14px;">${parada.nombre}</strong>
            <br>
            <span style="font-size: 12px; color: #666;">
                <i class="fas fa-map-pin"></i> ${parada.coordenadas}
            </span>
            <br>
            <span style="font-size: 12px; color: ${esActiva ? '#10b981' : '#95a5a6'};">
                <i class="fas fa-circle"></i> ${estadoTexto}
            </span>
            <br>
            <span style="font-size: 11px; color: #999;">ID: ${parada.id}</span>
        </div>
    `;
    marcador.bindPopup(popupContent);

    marcadoresPrincipales.push(marcador);
}

// ========== MAPA EN MODAL ==========

function destruirMapaModal() {
    if (mapa) {
        mapa.off();
        mapa.remove();
        mapa = null;
        marcador = null;
    }
    const container = document.getElementById('map-container');
    if (container) {
        container.innerHTML = '';
    }
}

function inicializarMapaModal(lat = 10.3447, lng = -67.0400) {
    if (mapa) {
        destruirMapaModal();
    }

    const container = document.getElementById('map-container');
    if (!container) {
        console.error('Contenedor del mapa no encontrado');
        return;
    }

    container.innerHTML = '';

    mapa = L.map('map-container').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);

    const iconoPersonalizado = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background: #ea4335;
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                border: 2px solid white;
                position: relative;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                "></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });

    marcador = L.marker([lat, lng], {
        draggable: true,
        icon: iconoPersonalizado
    }).addTo(mapa);

    mapa.on('click', function(e) {
        const latlng = e.latlng;
        marcador.setLatLng(latlng);
        actualizarCoordenadas(latlng.lat, latlng.lng);
    });

    marcador.on('dragend', function(e) {
        const pos = marcador.getLatLng();
        actualizarCoordenadas(pos.lat, pos.lng);
    });

    if (typeof L.Control.geocoder !== 'undefined') {
        L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: 'Buscar dirección...',
            errorMessage: 'No se encontró la dirección'
        }).on('markgeocode', function(e) {
            const center = e.geocode.center;
            marcador.setLatLng(center);
            mapa.setView(center, 16);
            actualizarCoordenadas(center.lat, center.lng);
        }).addTo(mapa);
    }

    setTimeout(() => {
        if (mapa) mapa.invalidateSize();
    }, 300);
}

function actualizarCoordenadas(lat, lng) {
    const coordenadasInput = document.getElementById('coordenadas');
    if (coordenadasInput) {
        const valor = `${lat.toFixed(7)},${lng.toFixed(7)}`;
        coordenadasInput.value = valor;
    }
}

function mostrarMapaModal(mostrar) {
    const container = document.getElementById('mapaContainer');
    const btn = document.getElementById('btnToggleMapa');

    if (!container || !btn) return;

    if (mostrar) {
        container.style.display = 'block';
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-times"></i> Ocultar mapa';

        const coordsInput = document.getElementById('coordenadas');
        let lat = 10.3447;
        let lng = -67.0400;

        if (coordsInput && coordsInput.value) {
            const partes = coordsInput.value.split(',');
            if (partes.length === 2) {
                const latVal = parseFloat(partes[0].trim());
                const lngVal = parseFloat(partes[1].trim());
                if (!isNaN(latVal) && !isNaN(lngVal)) {
                    lat = latVal;
                    lng = lngVal;
                }
            }
        }

        inicializarMapaModal(lat, lng);

    } else {
        container.style.display = 'none';
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-map-marked-alt"></i> Mapa';
        destruirMapaModal();
    }
}

// ========== MODAL ==========

function abrirModal(titulo, data = null) {
    const modal = document.getElementById('paradaModal');
    if (!modal) return;

    document.getElementById('modalTitle').textContent = titulo;

    const form = document.getElementById('paradaForm');
    if (form) form.reset();

    const statusSelect = document.getElementById('status');
    if (statusSelect) statusSelect.value = 'activa';

    const coordsInput = document.getElementById('coordenadas');
    if (coordsInput) coordsInput.value = '';

    if (mapa) {
        mostrarMapaModal(false);
    }

    if (data) {
        const nombreInput = document.getElementById('nombre');
        if (nombreInput) nombreInput.value = data.nombre || '';

        if (coordsInput && data.coordenadas) {
            coordsInput.value = data.coordenadas;
        }

        if (statusSelect) statusSelect.value = data.status || 'activa';
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) btnGuardar.disabled = false;

    setTimeout(() => {
        const nombreInput = document.getElementById('nombre');
        if (nombreInput) nombreInput.focus();
    }, 100);
}

function cerrarModal() {
    const modal = document.getElementById('paradaModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';

    if (mapa) {
        mostrarMapaModal(false);
    }

    editandoId = null;

    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) btnGuardar.disabled = false;
}

// ========== CRUD ==========

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
        const tablaContainer = document.getElementById('tablaParadas');
        if (tablaContainer) tablaContainer.innerHTML = tablaHtml;

        inicializarMapaPrincipal(paradas);

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

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando paradas.js');

    const btnToggleMapa = document.getElementById('btnToggleMapa');
    if (btnToggleMapa) {
        btnToggleMapa.addEventListener('click', function() {
            const container = document.getElementById('mapaContainer');
            const isVisible = container && container.style.display !== 'none';
            mostrarMapaModal(!isVisible);
        });
    }

    const form = document.getElementById('paradaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (loading) return;
            loading = true;

            const btnGuardar = document.getElementById('btnGuardar');
            if (btnGuardar) btnGuardar.disabled = true;

            const nombreInput = document.getElementById('nombre');
            const coordsInput = document.getElementById('coordenadas');
            const statusSelect = document.getElementById('status');

            const datos = {
                nombre: nombreInput ? nombreInput.value.trim() : '',
                coordenadas: coordsInput ? coordsInput.value.trim() : '',
                status: statusSelect ? statusSelect.value : 'activa'
            };

            // Solo validación mínima en frontend
            if (!datos.nombre) {
                showToast('El nombre es obligatorio', 'error');
                loading = false;
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }

            if (!datos.coordenadas) {
                showToast('Las coordenadas son obligatorias', 'error');
                loading = false;
                if (btnGuardar) btnGuardar.disabled = false;
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
                    showToast(editandoId ? 'Parada actualizada' : 'Parada creada exitosamente', 'success');
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
                if (btnGuardar) btnGuardar.disabled = false;
            }
        });
    }

    const btnNueva = document.getElementById('btnNuevaParada');
    if (btnNueva) {
        btnNueva.addEventListener('click', function() {
            editandoId = null;
            abrirModal('Nueva Parada');
        });
    }

    window.onclick = (event) => {
        const modal = document.getElementById('paradaModal');
        if (modal && event.target === modal) {
            cerrarModal();
        }
    };

    cargarParadas();
});