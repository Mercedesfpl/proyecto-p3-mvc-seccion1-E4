// frontend/static/js/pages/rutas.js

let editandoIdRuta = null;
let loadingRuta = false;
let rutas = [];
let lineas = [];
let paradasDisponibles = [];
let paradasSeleccionadasIds = [];
let mapaPrincipal = null;
let mapaModal = null;

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
    }
    const container = document.getElementById('mapa-rutas-principal');
    if (container) {
        container.innerHTML = '';
    }
}

function inicializarMapaPrincipal() {
    destruirMapaPrincipal();

    const container = document.getElementById('mapa-rutas-principal');
    if (!container) return;

    container.innerHTML = '';

    mapaPrincipal = L.map('mapa-rutas-principal').setView([10.3447, -67.0400], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapaPrincipal);

    setTimeout(() => {
        if (mapaPrincipal) mapaPrincipal.invalidateSize();
    }, 300);
}

function actualizarMapaPrincipal(rutasData) {
    if (!mapaPrincipal) return;

    mapaPrincipal.eachLayer(function(layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapaPrincipal.removeLayer(layer);
        }
    });

    const colores = ['#ea4335', '#4285f4', '#34a853', '#fbbc04', '#9c27b0', '#00bcd4'];

    rutasData.forEach((ruta, index) => {
        const color = colores[index % colores.length];

        if (ruta.paradas && ruta.paradas.length > 0) {
            const coords = ruta.paradas.map(p => {
                const partes = p.coordenadas.split(',');
                if (partes.length === 2) {
                    const lat = parseFloat(partes[0].trim());
                    const lng = parseFloat(partes[1].trim());
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return [lat, lng];
                    }
                }
                return null;
            }).filter(c => c !== null);

            if (coords.length > 0) {
                const polilinea = L.polyline(coords, {
                    color: color,
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 10'
                }).addTo(mapaPrincipal);

                coords.forEach((coord, i) => {
                    const marker = L.circleMarker(coord, {
                        radius: 5,
                        fillColor: color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(mapaPrincipal);

                    const parada = ruta.paradas[i];
                    marker.bindPopup(`
                        <strong>${parada.nombre}</strong>
                        <br>Orden: ${i + 1}
                        <br>Ruta: ${ruta.nombre}
                    `);
                });
            }
        }
    });

    const contador = document.getElementById('contadorRutas');
    if (contador) {
        contador.textContent = `${rutasData.length} rutas`;
    }
}

// ========== MAPA EN MODAL ==========

function inicializarMapaModal() {
    const container = document.getElementById('mapa-rutas-modal');
    if (!container) return;

    if (mapaModal) {
        mapaModal.off();
        mapaModal.remove();
        mapaModal = null;
    }

    container.innerHTML = '';

    mapaModal = L.map('mapa-rutas-modal').setView([10.3447, -67.0400], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapaModal);

    setTimeout(() => {
        if (mapaModal) mapaModal.invalidateSize();
    }, 300);
}

function actualizarMapaModal(paradasIds) {
    if (!mapaModal) return;

    mapaModal.eachLayer(function(layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapaModal.removeLayer(layer);
        }
    });

    if (!paradasIds || paradasIds.length === 0) {
        return;
    }

    const paradasSeleccionadas = paradasDisponibles.filter(p => paradasIds.includes(p.id));

    if (paradasSeleccionadas.length === 0) return;

    const coords = paradasSeleccionadas.map(p => {
        const partes = p.coordenadas.split(',');
        if (partes.length === 2) {
            const lat = parseFloat(partes[0].trim());
            const lng = parseFloat(partes[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
                return [lat, lng];
            }
        }
        return null;
    }).filter(c => c !== null);

    if (coords.length === 0) return;

    const bounds = L.latLngBounds(coords);
    mapaModal.fitBounds(bounds, { padding: [30, 30] });

    coords.forEach((coord, i) => {
        const parada = paradasSeleccionadas[i];
        const marker = L.marker(coord, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        background: #4285f4;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 10px;
                        font-weight: bold;
                    ">
                        ${i + 1}
                    </div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(mapaModal);

        marker.bindPopup(`
            <strong>${parada.nombre}</strong>
            <br>Orden: ${i + 1}
            <br>Coordenadas: ${parada.coordenadas}
        `);
    });

    if (coords.length > 1) {
        L.polyline(coords, {
            color: '#4285f4',
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 8'
        }).addTo(mapaModal);
    }
}

// ========== MODAL ==========

function abrirModalRuta(titulo = 'Nueva Ruta', data = null) {
    const modal = document.getElementById('modalNuevaRuta');
    document.getElementById('modalRutaTitle').textContent = titulo;
    document.getElementById('formNuevaRuta').reset();
    document.getElementById('status_ruta').value = 'activa';
    paradasSeleccionadasIds = [];

    if (data) {
        document.getElementById('nombre_ruta').value = data.nombre || '';
        document.getElementById('id_linea_ruta').value = data.id_linea || '';
        document.getElementById('status_ruta').value = data.status || 'activa';
        if (data.paradas) {
            paradasSeleccionadasIds = data.paradas.map(p => p.id);
        }
        editandoIdRuta = data.id_ruta || null;
    } else {
        editandoIdRuta = null;
    }

    cargarSelectoresRuta();
    actualizarListasParadas();
    inicializarMapaModal();

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('guardarRutaBtn').disabled = false;
}

function cerrarModalRuta() {
    const modal = document.getElementById('modalNuevaRuta');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    editandoIdRuta = null;
    document.getElementById('guardarRutaBtn').disabled = false;

    if (mapaModal) {
        mapaModal.off();
        mapaModal.remove();
        mapaModal = null;
    }
}

// ========== PARADAS ==========

function actualizarListasParadas() {
    const disponiblesSelect = document.getElementById('paradas_disponibles');
    const seleccionadasSelect = document.getElementById('paradas_seleccionadas');

    // Filtrar paradas disponibles (no seleccionadas)
    const disponibles = paradasDisponibles.filter(p => !paradasSeleccionadasIds.includes(p.id));
    disponiblesSelect.innerHTML = '';
    disponibles.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nombre;
        disponiblesSelect.appendChild(option);
    });

    // Paradas seleccionadas en orden
    const seleccionadas = paradasDisponibles.filter(p => paradasSeleccionadasIds.includes(p.id));
    seleccionadasSelect.innerHTML = '';
    seleccionadas.forEach((p, index) => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${index + 1}. ${p.nombre}`;
        seleccionadasSelect.appendChild(option);
    });

    // Actualizar mapa del modal
    actualizarMapaModal(paradasSeleccionadasIds);

    // Actualizar contador en el mapa
    const contador = document.getElementById('contadorParadasSeleccionadas');
    if (contador) {
        contador.textContent = `${paradasSeleccionadasIds.length} paradas`;
    }
}

function agregarParada() {
    const select = document.getElementById('paradas_disponibles');
    const selected = select.selectedOptions;
    const ids = Array.from(selected).map(opt => parseInt(opt.value));
    
    if (ids.length === 0) {
        showToast('Selecciona una parada para agregar', 'warning');
        return;
    }
    
    ids.forEach(id => {
        if (!paradasSeleccionadasIds.includes(id)) {
            paradasSeleccionadasIds.push(id);
        }
    });
    actualizarListasParadas();
    showToast(`${ids.length} parada(s) agregada(s)`, 'success');
}

function agregarTodas() {
    const disponibles = paradasDisponibles.filter(p => !paradasSeleccionadasIds.includes(p.id));
    if (disponibles.length === 0) {
        showToast('No hay paradas disponibles para agregar', 'warning');
        return;
    }
    disponibles.forEach(p => {
        paradasSeleccionadasIds.push(p.id);
    });
    actualizarListasParadas();
    showToast(`${disponibles.length} parada(s) agregada(s)`, 'success');
}

function quitarParada() {
    const select = document.getElementById('paradas_seleccionadas');
    const selected = select.selectedOptions;
    const ids = Array.from(selected).map(opt => parseInt(opt.value));
    
    if (ids.length === 0) {
        showToast('Selecciona una parada para quitar', 'warning');
        return;
    }
    
    paradasSeleccionadasIds = paradasSeleccionadasIds.filter(id => !ids.includes(id));
    actualizarListasParadas();
    showToast(`${ids.length} parada(s) quitada(s)`, 'success');
}

function quitarTodas() {
    if (paradasSeleccionadasIds.length === 0) {
        showToast('No hay paradas seleccionadas para quitar', 'warning');
        return;
    }
    paradasSeleccionadasIds = [];
    actualizarListasParadas();
    showToast('Todas las paradas quitadas', 'success');
}

function subirParada() {
    const select = document.getElementById('paradas_seleccionadas');
    const selected = select.selectedIndex;
    if (selected <= 0) {
        showToast('La parada ya está en la primera posición', 'warning');
        return;
    }
    const id = parseInt(select.options[selected].value);
    const index = paradasSeleccionadasIds.indexOf(id);
    if (index > 0) {
        [paradasSeleccionadasIds[index], paradasSeleccionadasIds[index - 1]] =
        [paradasSeleccionadasIds[index - 1], paradasSeleccionadasIds[index]];
        actualizarListasParadas();
        setTimeout(() => {
            select.selectedIndex = selected - 1;
        }, 50);
        showToast('Parada subida', 'success');
    }
}

function bajarParada() {
    const select = document.getElementById('paradas_seleccionadas');
    const selected = select.selectedIndex;
    if (selected === -1 || selected === select.options.length - 1) {
        showToast('La parada ya está en la última posición', 'warning');
        return;
    }
    const id = parseInt(select.options[selected].value);
    const index = paradasSeleccionadasIds.indexOf(id);
    if (index < paradasSeleccionadasIds.length - 1) {
        [paradasSeleccionadasIds[index], paradasSeleccionadasIds[index + 1]] =
        [paradasSeleccionadasIds[index + 1], paradasSeleccionadasIds[index]];
        actualizarListasParadas();
        setTimeout(() => {
            select.selectedIndex = selected + 1;
        }, 50);
        showToast('Parada bajada', 'success');
    }
}

// ========== CARGAR SELECTORES ==========

async function cargarSelectoresRuta() {
    try {
        const respLineas = await fetch('/admin/lineas', {
            credentials: 'include'
        });
        const dataLineas = await respLineas.json();
        if (dataLineas.success) {
            lineas = dataLineas.data || [];
            const select = document.getElementById('id_linea_ruta');
            const currentValue = select.value;
            select.innerHTML = '<option value="">Seleccione una linea...</option>';
            lineas.forEach(linea => {
                const opt = document.createElement('option');
                opt.value = linea.id;
                opt.textContent = linea.nombre;
                select.appendChild(opt);
            });
            if (currentValue) select.value = currentValue;
        }

        const respParadas = await fetch('/admin/paradas-disponibles', {
            credentials: 'include'
        });
        const dataParadas = await respParadas.json();
        if (dataParadas.success) {
            paradasDisponibles = dataParadas.data || [];
            actualizarListasParadas();
        }

    } catch (error) {
        console.error('Error al cargar selectores:', error);
        showToast('Error al cargar lineas y paradas', 'error');
    }
}

// ========== CRUD ==========

async function cargarRutas() {
    try {
        const response = await fetch('/admin/rutas', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        rutas = data.data || [];

        const total = rutas.length;
        const activas = rutas.filter(r => r.status === 'activa').length;
        const inactivas = total - activas;
        document.getElementById('totalRutas').textContent = total;
        document.getElementById('rutasActivas').textContent = activas;
        document.getElementById('rutasInactivas').textContent = inactivas;

        renderizarTarjetas(rutas);
        actualizarMapaPrincipal(rutas);

    } catch (error) {
        console.error('Error al cargar rutas:', error);
        showToast('Error al cargar rutas', 'error');
    }
}

function renderizarTarjetas(listaRutas) {
    const grid = document.getElementById('rutasGrid');
    if (!grid) return;

    if (listaRutas.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--texto-claro);">
                <i class="fas fa-route" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                No hay rutas registradas
            </div>
        `;
        return;
    }

    let html = '';
    listaRutas.forEach((ruta) => {
        const statusClass = ruta.status === 'activa' ? 'active' : 'inactive';
        const statusText = ruta.status === 'activa' ? 'Activa' : 'Inactiva';
        const nombreLinea = ruta.linea_nombre || 'Sin linea';
        const paradasList = ruta.paradas || [];

        html += `
        <div class="ruta-card" data-id="${ruta.id_ruta}">
            <div class="ruta-header">
                <div class="ruta-title">
                    <i class="fas fa-route"></i>
                    <h3>${ruta.nombre}</h3>
                </div>
                <div class="ruta-header-right">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <button class="btn-expand" data-id="${ruta.id_ruta}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="ruta-expandable" id="expandable-${ruta.id_ruta}" style="display: none">
                <div class="ruta-info">
                    <div class="info-row">
                        <span class="info-label">Linea</span>
                        <span class="info-value">${nombreLinea}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Paradas</span>
                        <span class="info-value">${paradasList.length}</span>
                    </div>
                </div>
                <div class="paradas-list">
                    <h4><i class="fas fa-map-pin"></i> Puntos de control (${paradasList.length})</h4>
                    ${paradasList.length > 0 ? paradasList.map(p => `
                        <div class="parada-item">
                            <i class="fas fa-circle"></i> ${p.nombre} <span style="color: var(--texto-claro); font-size: 12px;">(Orden ${p.orden})</span>
                        </div>
                    `).join('') : '<div class="parada-item">No hay paradas asignadas</div>'}
                </div>
                <div class="ruta-footer">
                    <button class="btn-edit" onclick="editarRuta(${ruta.id_ruta})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="eliminarRuta(${ruta.id_ruta})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    });

    grid.innerHTML = html;
    inicializarExpandibles();
}

function inicializarExpandibles() {
    document.querySelectorAll('.btn-expand').forEach((btn) => {
        btn.removeEventListener('click', handleExpand);
        btn.addEventListener('click', handleExpand);
    });
}

function handleExpand(e) {
    e.stopPropagation();
    const id = this.getAttribute('data-id');
    const expandable = document.getElementById(`expandable-${id}`);
    const icon = this.querySelector('i');
    if (!expandable) return;
    if (expandable.style.display === 'none') {
        expandable.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        expandable.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

async function editarRuta(id) {
    try {
        const response = await fetch(`/admin/rutas/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.data) throw new Error('Datos invalidos');

        const ruta = data.data;
        await cargarSelectoresRuta();
        abrirModalRuta('Editar Ruta', ruta);

    } catch (error) {
        console.error('Error al cargar ruta:', error);
        showToast('Error al cargar la ruta', 'error');
    }
}

async function eliminarRuta(id) {
    if (!confirm('¿Esta seguro de eliminar esta ruta?')) return;

    try {
        const response = await fetch(`/admin/rutas/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            showToast('Ruta eliminada exitosamente', 'success');
            cargarRutas();
        } else {
            showToast(data.error || data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexion al servidor', 'error');
    }
}

// ========== FILTROS ==========

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchRuta')?.value?.toLowerCase() || '';
    const filterLinea = document.getElementById('filterLinea')?.value || '';
    const filterEstado = document.getElementById('filterEstado')?.value || '';

    const cards = document.querySelectorAll('.ruta-card');
    cards.forEach((card) => {
        const title = card.querySelector('.ruta-title h3')?.textContent?.toLowerCase() || '';
        const lineaElement = card.querySelector('.info-row:first-child .info-value');
        const linea = lineaElement ? lineaElement.textContent : '';
        const statusSpan = card.querySelector('.status-badge');
        const estado = statusSpan ? statusSpan.textContent : '';

        let visible = true;
        if (searchTerm && !title.includes(searchTerm)) visible = false;
        if (filterLinea && linea !== filterLinea) visible = false;
        if (filterEstado) {
            if (filterEstado === 'activa' && estado !== 'Activa') visible = false;
            if (filterEstado === 'inactiva' && estado !== 'Inactiva') visible = false;
        }
        card.style.display = visible ? 'block' : 'none';
    });
}

// ========== INICIALIZACION ==========

document.addEventListener('DOMContentLoaded', function() {

    inicializarMapaPrincipal();

    document.getElementById('btnAgregarParada').addEventListener('click', agregarParada);
    document.getElementById('btnAgregarTodas').addEventListener('click', agregarTodas);
    document.getElementById('btnQuitarParada').addEventListener('click', quitarParada);
    document.getElementById('btnQuitarTodas').addEventListener('click', quitarTodas);
    document.getElementById('btnSubirParada').addEventListener('click', subirParada);
    document.getElementById('btnBajarParada').addEventListener('click', bajarParada);

    document.getElementById('formNuevaRuta').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (loadingRuta) return;
        loadingRuta = true;
        document.getElementById('guardarRutaBtn').disabled = true;

        const datos = {
            nombre: document.getElementById('nombre_ruta').value.trim(),
            id_linea: parseInt(document.getElementById('id_linea_ruta').value),
            status: document.getElementById('status_ruta').value,
            paradas_ids: paradasSeleccionadasIds
        };

        if (!datos.nombre) {
            showToast('El nombre es obligatorio', 'error');
            loadingRuta = false;
            document.getElementById('guardarRutaBtn').disabled = false;
            return;
        }

        if (!datos.id_linea) {
            showToast('Debes seleccionar una linea', 'error');
            loadingRuta = false;
            document.getElementById('guardarRutaBtn').disabled = false;
            return;
        }

        if (datos.paradas_ids.length === 0) {
            showToast('Debes seleccionar al menos una parada', 'error');
            loadingRuta = false;
            document.getElementById('guardarRutaBtn').disabled = false;
            return;
        }

        const url = editandoIdRuta ? `/admin/rutas/${editandoIdRuta}` : '/admin/rutas';
        const method = editandoIdRuta ? 'PUT' : 'POST';

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
                showToast(editandoIdRuta ? 'Ruta actualizada' : 'Ruta creada exitosamente', 'success');
                cerrarModalRuta();
                cargarRutas();
            } else {
                showToast(data.error || data.message || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexion al servidor', 'error');
        } finally {
            loadingRuta = false;
            document.getElementById('guardarRutaBtn').disabled = false;
        }
    });

    document.getElementById('btnNuevaRuta').addEventListener('click', function() {
        cargarSelectoresRuta();
        abrirModalRuta('Nueva Ruta');
    });

    window.onclick = function(event) {
        const modal = document.getElementById('modalNuevaRuta');
        if (event.target === modal) {
            cerrarModalRuta();
        }
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalNuevaRuta');
            if (modal.classList.contains('show')) {
                cerrarModalRuta();
            }
        }
    });

    document.getElementById('searchRuta')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filterLinea')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filterEstado')?.addEventListener('change', aplicarFiltros);

    cargarRutas();
});