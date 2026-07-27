// frontend/static/js/pages/rutas.js

let editandoIdRuta = null;
let loadingRuta = false;
let rutas = [];
let lineas = [];
let paradasDisponibles = [];
let paradasSeleccionadasIds = [];
let mapaPrincipal = null;
let mapaModal = null;
let paginaActual = 1;
let controlesRuta = [];
const registrosPorPagina = 5;
let rutasFiltradas = [];

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

    // Limpiar controles anteriores
    if (controlesRuta.length > 0) {
        controlesRuta.forEach(control => {
            try {
                mapaPrincipal.removeControl(control);
            } catch (e) {}
        });
        controlesRuta = [];
    }

    mapaPrincipal.eachLayer(function(layer) {
        if (layer instanceof L.Marker || 
            layer instanceof L.Polyline || 
            layer instanceof L.CircleMarker) {
            mapaPrincipal.removeLayer(layer);
        }
    });

    if (!rutasData || rutasData.length === 0) {
        const contador = document.getElementById('contadorRutas');
        if (contador) contador.textContent = '0 rutas';
        return;
    }

    rutasData.forEach((ruta, index) => {
        const color = ruta.color || '#74A9D3';

        if (ruta.paradas && ruta.paradas.length >= 2) {
            const paradasOrdenadas = [...ruta.paradas].sort((a, b) => a.orden - b.orden);
            
            const waypoints = paradasOrdenadas.map(p => {
                const coords = p.coordenadas.split(',');
                return L.latLng(parseFloat(coords[0].trim()), parseFloat(coords[1].trim()));
            });

            if (typeof L.Routing !== 'undefined' && waypoints.length >= 2) {
                try {
                    const rutaControl = L.Routing.control({
                        waypoints: waypoints,
                        routeWhileDragging: false,
                        showAlternatives: false,
                        fitSelectedRoutes: false,
                        lineOptions: {
                            styles: [{ color: color, weight: 4, opacity: 0.8 }],
                            extendToWaypoints: false,
                            missingRouteTolerance: 0
                        },
                        router: L.Routing.osrmv1({
                            serviceUrl: 'https://router.project-osrm.org/route/v1/'
                        }),
                        show: false
                    }).addTo(mapaPrincipal);
                    controlesRuta.push(rutaControl);
                } catch (e) {
                    dibujarLineaRecta(mapaPrincipal, waypoints, color);
                }
            } else {
                dibujarLineaRecta(mapaPrincipal, waypoints, color);
            }

            waypoints.forEach((coord, i) => {
                const parada = paradasOrdenadas[i];
                const marker = L.circleMarker(coord, {
                    radius: 6,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                }).addTo(mapaPrincipal);

                marker.bindPopup(`
                    <strong>${parada.nombre}</strong>
                    <br>Orden: ${i + 1}
                    <br>Ruta: ${ruta.nombre}
                `);
            });
        }
    });

    const contador = document.getElementById('contadorRutas');
    if (contador) {
        contador.textContent = `${rutasData.length} rutas`;
    }
}

function dibujarLineaRecta(mapa, waypoints, color) {
    if (waypoints.length < 2) return;
    const coords = waypoints.map(w => w);
    L.polyline(coords, {
        color: color,
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
    }).addTo(mapa);
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

    if (!paradasIds || paradasIds.length === 0) return;

    const paradasSeleccionadas = paradasIds
        .map(id => paradasDisponibles.find(p => p.id === id))
        .filter(Boolean);

    if (paradasSeleccionadas.length === 0) return;

    const coords = paradasSeleccionadas.map(p => {
        const partes = p.coordenadas ? p.coordenadas.split(',') : [];
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
        L.marker(coord, {
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
        }).addTo(mapaModal).bindPopup(`
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

// ========== EXPANDIR MAPA ==========

function toggleExpandirMapa() {
    const mapa = document.getElementById('mapa-rutas-principal');
    const btn = document.getElementById('btnExpandirMapa');
    const icono = btn.querySelector('i');
    
    mapa.classList.toggle('expanded');
    
    if (mapa.classList.contains('expanded')) {
        icono.classList.remove('fa-expand');
        icono.classList.add('fa-compress');
        btn.title = 'Reducir mapa';
    } else {
        icono.classList.remove('fa-compress');
        icono.classList.add('fa-expand');
        btn.title = 'Expandir mapa';
    }
    
    setTimeout(() => {
        if (mapaPrincipal) mapaPrincipal.invalidateSize();
    }, 350);
}

// ========== MODAL ==========

function abrirModalRuta(titulo = 'Nueva Ruta', data = null) {
    const modal = document.getElementById('modalNuevaRuta');
    if (!modal) return;

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
    } else {
        editandoIdRuta = null;
    }

    cargarSelectoresRuta();
    renderizarListasParadas();
    inicializarMapaModal();

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('guardarRutaBtn').disabled = false;
}

function cerrarModalRuta() {
    const modal = document.getElementById('modalNuevaRuta');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    editandoIdRuta = null;
    
    const btnGuardar = document.getElementById('guardarRutaBtn');
    if (btnGuardar) btnGuardar.disabled = false;

    if (mapaModal) {
        mapaModal.off();
        mapaModal.remove();
        mapaModal = null;
    }
}

// ========== PARADAS ==========

function renderizarListasParadas() {
    const disponiblesContainer = document.getElementById('listaDisponibles');
    const seleccionadasContainer = document.getElementById('listaSeleccionadas');
    const contadorDisponibles = document.getElementById('contadorDisponibles');
    const contadorSeleccionadas = document.getElementById('contadorSeleccionadas');
    const contadorModal = document.getElementById('contadorParadasSeleccionadas');

    if (!disponiblesContainer || !seleccionadasContainer) return;

    const disponibles = paradasDisponibles.filter(p => !paradasSeleccionadasIds.includes(p.id));
    
    if (disponibles.length === 0) {
        disponiblesContainer.innerHTML = `<div class="item-vacio">No hay paradas disponibles</div>`;
    } else {
        disponiblesContainer.innerHTML = disponibles.map(p => `
            <div class="item-parada" data-id="${p.id}">
                <span class="nombre-parada">${p.nombre}</span>
                <button class="btn-agregar-item" data-id="${p.id}" title="Agregar parada al final de la lista">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
        `).join('');
    }

    const seleccionadas = paradasSeleccionadasIds
        .map(id => paradasDisponibles.find(p => p.id === id))
        .filter(Boolean);
    
    if (seleccionadas.length === 0) {
        seleccionadasContainer.innerHTML = `<div class="item-vacio">No hay paradas seleccionadas</div>`;
    } else {
        seleccionadasContainer.innerHTML = seleccionadas.map((p, index) => `
            <div class="item-parada seleccionado" data-id="${p.id}">
                <span class="numero-orden">${index + 1}</span>
                <span class="nombre-parada">${p.nombre}</span>
                <button class="btn-quitar-item" data-id="${p.id}" title="Quitar parada de la lista">
                    <i class="fas fa-times"></i> Quitar
                </button>
            </div>
        `).join('');
    }

    if (contadorDisponibles) contadorDisponibles.textContent = `${disponibles.length} disponibles`;
    if (contadorSeleccionadas) contadorSeleccionadas.textContent = `${seleccionadas.length} paradas`;
    if (contadorModal) contadorModal.textContent = `${seleccionadas.length} paradas`;

    document.querySelectorAll('#listaDisponibles .btn-agregar-item').forEach(btn => {
        btn.onclick = handleAgregarParada;
    });

    document.querySelectorAll('#listaSeleccionadas .btn-quitar-item').forEach(btn => {
        btn.onclick = handleQuitarParada;
    });

    const btnAgregarTodas = document.getElementById('btnAgregarTodasParadas');
    if (btnAgregarTodas) btnAgregarTodas.onclick = handleAgregarTodas;

    const btnQuitarTodas = document.getElementById('btnQuitarTodasParadas');
    if (btnQuitarTodas) btnQuitarTodas.onclick = handleQuitarTodas;

    actualizarMapaModal(paradasSeleccionadasIds);
}

function handleAgregarParada(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    if (paradasSeleccionadasIds.includes(id)) {
        showToast('Esta parada ya está en la lista', 'warning');
        return;
    }
    paradasSeleccionadasIds.push(id);
    renderizarListasParadas();
    showToast('Parada agregada', 'success');
}

function handleQuitarParada(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    paradasSeleccionadasIds = paradasSeleccionadasIds.filter(p => p !== id);
    renderizarListasParadas();
    showToast('Parada quitada', 'success');
}

function handleAgregarTodas() {
    const disponibles = paradasDisponibles.filter(p => !paradasSeleccionadasIds.includes(p.id));
    if (disponibles.length === 0) {
        showToast('No hay paradas disponibles para agregar', 'warning');
        return;
    }
    disponibles.forEach(p => paradasSeleccionadasIds.push(p.id));
    renderizarListasParadas();
    showToast(`${disponibles.length} parada(s) agregadas`, 'success');
}

function handleQuitarTodas() {
    if (paradasSeleccionadasIds.length === 0) {
        showToast('No hay paradas para quitar', 'warning');
        return;
    }
    paradasSeleccionadasIds = [];
    renderizarListasParadas();
    showToast('Todas las paradas quitadas', 'success');
}

async function cargarSelectoresRuta() {
    try {
        const respLineas = await fetch('/admin/lineas', { credentials: 'include' });
        const dataLineas = await respLineas.json();
        if (dataLineas.success) {
            lineas = dataLineas.data || [];
            const select = document.getElementById('id_linea_ruta');
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Seleccione una línea...</option>';
                lineas.forEach(linea => {
                    const opt = document.createElement('option');
                    opt.value = linea.id;
                    opt.textContent = linea.nombre;
                    select.appendChild(opt);
                });
                if (currentValue) select.value = currentValue;
            }
        }

        const respParadas = await fetch('/admin/paradas-disponibles', { credentials: 'include' });
        const dataParadas = await respParadas.json();
        if (dataParadas.success) {
            paradasDisponibles = dataParadas.data || [];
            renderizarListasParadas();
        }

    } catch (error) {
        console.error('Error al cargar selectores:', error);
        showToast('Error al cargar líneas y paradas', 'error');
    }
}

// ========== PAGINACIÓN Y BÚSQUEDA ==========

function filtrarRutas() {
    const busqueda = document.getElementById('searchRuta')?.value?.toLowerCase() || '';
    const filterLinea = document.getElementById('filterLinea')?.value || '';
    const filterEstado = document.getElementById('filterEstado')?.value || '';

    rutasFiltradas = rutas.filter(ruta => {
        const nombre = (ruta.nombre || '').toLowerCase();
        const linea = ruta.linea_nombre || '';
        const estado = ruta.status || '';

        let coincide = true;
        if (busqueda && !nombre.includes(busqueda)) coincide = false;
        if (filterLinea && linea !== filterLinea) coincide = false;
        if (filterEstado && estado !== filterEstado) coincide = false;
        return coincide;
    });

    paginaActual = 1;
    renderizarTablaRutas();
    actualizarPaginacion();
}

function renderizarTablaRutas() {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const rutasPagina = rutasFiltradas.slice(inicio, fin);

    const container = document.getElementById('tablaRutas');
    if (!container) return;

    if (rutasFiltradas.length === 0) {
        container.innerHTML = `
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
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 30px; color: var(--texto-claro);">
                            No hay rutas que coincidan con la búsqueda
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
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Línea</th>
                    <th>Paradas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    rutasPagina.forEach(ruta => {
        const rutaId = ruta.id || ruta.id_ruta;
        if (!rutaId) return;

        const statusClass = ruta.status === 'activa' ? 'active' : 'inactive';
        const statusText = ruta.status === 'activa' ? 'Activa' : 'Inactiva';
        const nombreLinea = ruta.linea_nombre || 'Sin línea';
        const paradasCount = (ruta.paradas || []).length;

        html += `
            <tr>
                <td>${rutaId}</td>
                <td><strong>${ruta.nombre}</strong></td>
                <td>${nombreLinea}</td>
                <td>${paradasCount}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-edit" onclick="editarRuta(${rutaId})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="eliminarRuta(${rutaId})" title="Eliminar">
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
    const totalPaginas = Math.ceil(rutasFiltradas.length / registrosPorPagina) || 1;
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const infoPagina = document.getElementById('infoPagina');

    btnAnterior.disabled = paginaActual <= 1;
    btnSiguiente.disabled = paginaActual >= totalPaginas;
    infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
}

function irPagina(direccion) {
    const totalPaginas = Math.ceil(rutasFiltradas.length / registrosPorPagina) || 1;
    const nuevaPagina = paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        renderizarTablaRutas();
        actualizarPaginacion();
    }
}

// ========== CRUD ==========

async function cargarRutas() {
    try {
        const response = await fetch('/admin/rutas/api', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            rutas = data.data || [];
        } else {
            rutas = [];
        }

        rutas = rutas.map(r => ({
            ...r,
            id: r.id || r.id_ruta || null
        }));

        rutasFiltradas = [...rutas];
        renderizarTablaRutas();
        actualizarPaginacion();
        actualizarMapaPrincipal(rutas);

    } catch (error) {
        console.error('Error al cargar rutas:', error);
        showToast('Error al cargar rutas', 'error');
    }
}

async function editarRuta(id) {
    if (!id) {
        showToast('ID de ruta inválido', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/admin/rutas/${id}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.data) throw new Error('Datos inválidos');

        const ruta = data.data;
        editandoIdRuta = parseInt(id) || parseInt(ruta.id) || parseInt(ruta.id_ruta) || null;
        console.log('editandoIdRuta asignado:', editandoIdRuta);  // Debug
        await cargarSelectoresRuta();
        abrirModalRuta('Editar Ruta', data.data);

    } catch (error) {
        console.error('Error al cargar ruta:', error);
        showToast('Error al cargar la ruta', 'error');
    }
}

async function eliminarRuta(id) {
    if (!id) {
        showToast('ID de ruta inválido', 'error');
        return;
    }
    
    if (!confirm('¿Está seguro de eliminar esta ruta?')) return;

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
        showToast('Error de conexión al servidor', 'error');
    }
}

// ========== INICIALIZACIÓN Y EVENTOS ==========

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar mapa principal
    inicializarMapaPrincipal();

    // Expandir mapa
    document.getElementById('btnExpandirMapa').addEventListener('click', toggleExpandirMapa);

    // Filtros
    document.getElementById('searchRuta')?.addEventListener('input', filtrarRutas);
    document.getElementById('filterLinea')?.addEventListener('change', filtrarRutas);
    document.getElementById('filterEstado')?.addEventListener('change', filtrarRutas);

    // Paginación
    document.getElementById('btnAnterior').addEventListener('click', function() { irPagina(-1); });
    document.getElementById('btnSiguiente').addEventListener('click', function() { irPagina(1); });

    // Formulario
    const formRuta = document.getElementById('formNuevaRuta');
    if (formRuta) {
        formRuta.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (loadingRuta) return;
            loadingRuta = true;
            
            const btnGuardar = document.getElementById('guardarRutaBtn');
            if (btnGuardar) btnGuardar.disabled = true;

            const datos = {
                nombre: document.getElementById('nombre_ruta').value.trim(),
                id_linea: parseInt(document.getElementById('id_linea_ruta').value),
                status: document.getElementById('status_ruta').value,
                paradas_ids: paradasSeleccionadasIds
                // El color se obtiene de la línea seleccionada
            };

            if (!datos.nombre) {
                showToast('El nombre es obligatorio', 'error');
                loadingRuta = false;
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }

            if (!datos.id_linea) {
                showToast('Debes seleccionar una línea', 'error');
                loadingRuta = false;
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }

            if (datos.paradas_ids.length === 0) {
                showToast('Debes seleccionar al menos una parada', 'error');
                loadingRuta = false;
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }

            const url = editandoIdRuta ? `/admin/rutas/${editandoIdRuta}` : '/admin/rutas';
            const method = editandoIdRuta ? 'PUT' : 'POST';

            console.log('URL:', url, 'Método:', method, 'ID:', editandoIdRuta);  // Debug


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
                showToast('Error de conexión al servidor', 'error');
            } finally {
                loadingRuta = false;
                if (btnGuardar) btnGuardar.disabled = false;
            }
        });
    }

    // Botón nueva ruta
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
            if (modal && modal.classList.contains('show')) {
                cerrarModalRuta();
            }
        }
    });

    cargarRutas();
});