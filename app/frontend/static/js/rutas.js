// ============================================================
// PÁGINA DE RUTAS - CRUD completo con tabla
// ============================================================

let editandoIdRuta = null;
let loadingRuta = false;
let todasLasRutas = [];
let rutasFiltradas = [];
let lineasDisponibles = [];
let paginaActual = 1;
const itemsPorPagina = 10;
let idRutaViendo = null;

// ============================================================
// 1. NOTIFICACIONES
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
    if (typeof showToast === "function") {
        showToast(mensaje, tipo);
        return;
    }
    alert(mensaje);
}

// ============================================================
// 2. MODAL NUEVA / EDITAR RUTA
// ============================================================
async function abrirModalRuta(titulo = "Nueva Ruta") {
    const modal = document.getElementById("modalNuevaRuta");
    if (!modal) return;

    document.getElementById("formNuevaRuta").reset();
    document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const titleEl = document.getElementById("modalRutaTitle");
    if (titleEl) titleEl.textContent = titulo;

    await cargarSelectsRuta();
    modal.classList.add("show");
    document.getElementById("guardarRutaBtn").disabled = false;
}

function cerrarModalRuta() {
    const modal = document.getElementById("modalNuevaRuta");
    if (modal) modal.classList.remove("show");
    editandoIdRuta = null;
    const btn = document.getElementById("guardarRutaBtn");
    if (btn) btn.disabled = false;
}

// ============================================================
// 3. CARGAR SELECTS (líneas)
// ============================================================
async function cargarSelectsRuta() {
    try {
        const resp = await fetch("/admin/lineas", { credentials: "include" });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById("id_linea_ruta");
            if (!select) return;
            select.innerHTML = '<option value="">Seleccione una línea...</option>';
            data.data.forEach((linea) => {
                const opt = document.createElement("option");
                opt.value = linea.id;
                opt.textContent = linea.nombre;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error("Error al cargar líneas:", error);
        mostrarNotificacion("Error al cargar líneas", "danger");
    }
}

// ============================================================
// 4. GUARDAR RUTA (POST o PUT)
// ============================================================
async function guardarRuta(e) {
    if (e) e.preventDefault();
    if (loadingRuta) return;

    const form = document.getElementById("formNuevaRuta");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    let valid = true;
    document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    if (!data.nombre || !data.nombre.trim()) {
        document.getElementById("nombre_ruta").classList.add("is-invalid");
        valid = false;
    }
    if (!data.id_linea) {
        document.getElementById("id_linea_ruta").classList.add("is-invalid");
        valid = false;
    }
    if (!valid) {
        mostrarNotificacion("Complete los campos obligatorios (*)", "warning");
        return;
    }

    loadingRuta = true;
    document.getElementById("guardarRutaBtn").disabled = true;

    try {
        const csrfToken = getCookie("csrf_access_token");
        const esEdicion = editandoIdRuta !== null;
        const url = esEdicion ? `/admin/rutas/${editandoIdRuta}` : "/admin/rutas";
        const method = esEdicion ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            mostrarNotificacion(
                esEdicion ? "Ruta actualizada exitosamente" : "Ruta creada exitosamente",
                "success"
            );
            cerrarModalRuta();
            cargarDatos();
        } else {
            mostrarNotificacion(result.message || "Error al guardar la ruta", "danger");
        }
    } catch (error) {
        console.error("Error al guardar ruta:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
    } finally {
        loadingRuta = false;
        document.getElementById("guardarRutaBtn").disabled = false;
    }
}

// ============================================================
// 5. ELIMINAR RUTA
// ============================================================
async function eliminarRuta(id) {
    if (!confirm(`¿Está seguro de eliminar la ruta ID: ${id}?`)) return;

    try {
        const csrfToken = getCookie("csrf_access_token");
        const response = await fetch(`/admin/rutas/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: { "X-CSRF-TOKEN": csrfToken },
        });
        const result = await response.json();

        if (response.ok && result.success) {
            mostrarNotificacion("Ruta eliminada exitosamente", "success");
            cargarDatos();
        } else {
            mostrarNotificacion(result.message || "Error al eliminar", "danger");
        }
    } catch (error) {
        console.error("Error al eliminar ruta:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
    }
}

// ============================================================
// 6. CARGAR DATOS
// ============================================================
function cargarDatos() {
    fetch("/admin/rutas/api", { credentials: "include" })
        .then((response) => {
            if (!response.ok) throw new Error("Error al cargar rutas");
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                todasLasRutas = data.data || [];
                rutasFiltradas = [...todasLasRutas];
                paginaActual = 1;
                renderizarPagina();
                actualizarMapaPrincipal(todasLasRutas);
            }
        })
        .catch((error) => {
            console.error("Error al cargar rutas:", error);
            mostrarNotificacion("No se pudieron cargar las rutas del servidor.", "warning");
        });

    fetch("/admin/lineas", { credentials: "include" })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                lineasDisponibles = data.data || [];
                llenarFiltroLineas(lineasDisponibles);
            }
        })
        .catch((error) => console.error("Error al cargar líneas:", error));
}

// ============================================================
// 7. RENDERIZAR TABLA DE RUTAS
// ============================================================
function renderizarPagina() {
    const tbody = document.getElementById("rutasTableBody");
    if (!tbody) return;

    if (rutasFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="tabla-vacia">No hay rutas que coincidan</td>
            </tr>`;
        actualizarControlesPaginacion(0);
        return;
    }

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const pagina = rutasFiltradas.slice(inicio, fin);

    tbody.innerHTML = "";
    pagina.forEach((ruta) => {
        const idRuta = ruta.id ?? ruta.id_ruta;
        const statusClass = ruta.status === "activa" ? "status-active" : "status-inactive";
        const statusText = ruta.status === "activa" ? "Activa" : "Inactiva";
        const nombreLinea =
            ruta.linea_nombre || (ruta.linea ? ruta.linea.nombre : null) || "Sin línea";
        const totalParadas = Array.isArray(ruta.paradas) ? ruta.paradas.length : 0;

        const tr = document.createElement("tr");
        tr.setAttribute("data-linea-id", ruta.id_linea);
        tr.setAttribute("data-status", ruta.status);
        tr.innerHTML = `
            <td><strong>RUTA-${String(idRuta).padStart(3, "0")}</strong></td>
            <td>${ruta.nombre}</td>
            <td>
                <a href="/admin/lineas-page?id=${ruta.id_linea}" class="link-linea" title="Ver línea">
                    ${nombreLinea}
                </a>
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas fa-circle"></i> ${statusText}
                </span>
            </td>
            <td class="action-buttons">
                <button class="action-btn view" data-id="${idRuta}" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${idRuta}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${idRuta}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    asignarEventosTabla();
    actualizarControlesPaginacion(rutasFiltradas.length);
}

function actualizarControlesPaginacion(totalItems) {
    const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
    const info = document.getElementById("infoPagina");
    const btnPrev = document.getElementById("btnAnterior");
    const btnNext = document.getElementById("btnSiguiente");

    if (info) info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    if (btnPrev) btnPrev.disabled = paginaActual === 1;
    if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
}

// ============================================================
// 8. EVENTOS DE LA TABLA
// ============================================================
function asignarEventosTabla() {
    document.querySelectorAll(".action-btn.view").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            verRuta(this.getAttribute("data-id"));
        };
    });
    document.querySelectorAll(".action-btn.edit").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            editarRuta(this.getAttribute("data-id"));
        };
    });
    document.querySelectorAll(".action-btn.delete").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            eliminarRuta(this.getAttribute("data-id"));
        };
    });
}

// ============================================================
// 9. VER RUTA
// ============================================================
async function verRuta(id) {
    try {
        const resp = await fetch(`/admin/rutas/${id}`, { credentials: "include" });
        const result = await resp.json();
        if (!result.success) {
            mostrarNotificacion(result.message || "Ruta no encontrada", "danger");
            return;
        }
        const ruta = result.data;
        idRutaViendo = id;

        const idRuta = ruta.id ?? ruta.id_ruta;
        const nombreLinea =
            ruta.linea_nombre || (ruta.linea ? ruta.linea.nombre : null) || "Sin línea";
        const statusText = ruta.status === "activa" ? "Activa" : "Inactiva";

        document.getElementById("verRutaId").textContent = `RUTA-${String(idRuta).padStart(3, "0")}`;
        document.getElementById("verRutaNombre").textContent = ruta.nombre || "-";
        document.getElementById("verRutaLinea").textContent = nombreLinea;
        document.getElementById("verRutaParadas").textContent = `${(ruta.paradas || []).length} paradas`;
        document.getElementById("verRutaEstado").textContent = statusText;

        const badge = document.getElementById("verRutaEstadoBadge");
        badge.className = "status-badge";
        badge.classList.add(ruta.status === "activa" ? "status-active" : "status-inactive");

        const lista = document.getElementById("verRutaListaParadas");
        lista.innerHTML = "";
        if (ruta.paradas && ruta.paradas.length > 0) {
            const ordenadas = [...ruta.paradas].sort((a, b) => a.orden - b.orden);
            ordenadas.forEach((p) => {
                const li = document.createElement("li");
                li.textContent = p.nombre || `Parada #${p.id}`;
                lista.appendChild(li);
            });
        } else {
            lista.innerHTML = `<li class="item-vacio">Sin paradas</li>`;
        }

        document.getElementById("modalVerRuta").classList.add("show");
    } catch (error) {
        console.error("Error al ver ruta:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
    }
}

function cerrarModalVerRuta() {
    const modal = document.getElementById("modalVerRuta");
    if (modal) modal.classList.remove("show");
    idRutaViendo = null;
}

function editarDesdeVer() {
    const id = idRutaViendo;
    cerrarModalVerRuta();
    if (id) editarRuta(id);
}

// ============================================================
// 10. EDITAR RUTA
// ============================================================
async function editarRuta(id) {
    try {
        const resp = await fetch(`/admin/rutas/${id}`, { credentials: "include" });
        const result = await resp.json();
        if (!result.success) {
            mostrarNotificacion(result.message || "Ruta no encontrada", "danger");
            return;
        }
        const ruta = result.data;
        editandoIdRuta = id;

        const modal = document.getElementById("modalNuevaRuta");
        document.getElementById("formNuevaRuta").reset();
        document.getElementById("modalRutaTitle").textContent = "Editar Ruta";

        await cargarSelectsRuta();
        modal.classList.add("show");

        document.getElementById("nombre_ruta").value = ruta.nombre || "";
        document.getElementById("id_linea_ruta").value = ruta.id_linea || "";
        document.getElementById("status_ruta").value = ruta.status || "activa";
    } catch (error) {
        console.error("Error al editar ruta:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
    }
}

// ============================================================
// 11. FILTROS
// ============================================================
function llenarFiltroLineas(listaLineas) {
    const select = document.getElementById("filterLinea");
    if (!select) return;
    select.innerHTML = `<option value="">Todas las líneas</option>`;
    listaLineas.forEach((linea) => {
        const option = document.createElement("option");
        option.value = linea.id;
        option.textContent = linea.nombre;
        select.appendChild(option);
    });
}

function aplicarFiltros() {
    const searchTerm = document.getElementById("searchRuta")?.value?.toLowerCase() || "";
    const filterLinea = document.getElementById("filterLinea")?.value || "";
    const filterEstado = document.getElementById("filterEstado")?.value || "";

    rutasFiltradas = todasLasRutas.filter((ruta) => {
        const nombre = (ruta.nombre || "").toLowerCase();
        const lineaId = String(ruta.id_linea || "");
        const estado = ruta.status || "";

        if (searchTerm && !nombre.includes(searchTerm)) return false;
        if (filterLinea && lineaId !== filterLinea) return false;
        if (filterEstado && estado !== filterEstado) return false;
        return true;
    });

    paginaActual = 1;
    renderizarPagina();
}

// ============================================================
// 12. MAPA PRINCIPAL
// ============================================================
let mapaPrincipal = null;
let controlesRuta = [];

function destruirMapaPrincipal() {
    if (mapaPrincipal) {
        mapaPrincipal.off();
        mapaPrincipal.remove();
        mapaPrincipal = null;
    }
    controlesRuta = [];
    const container = document.getElementById("mapa-rutas-principal");
    if (container) container.innerHTML = "";
}

function inicializarMapaPrincipal() {
    destruirMapaPrincipal();

    const container = document.getElementById("mapa-rutas-principal");
    if (!container) return;

    mapaPrincipal = L.map("mapa-rutas-principal").setView([10.3447, -67.04], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "OpenStreetMap",
    }).addTo(mapaPrincipal);

    setTimeout(() => {
        if (mapaPrincipal) mapaPrincipal.invalidateSize();
    }, 300);
}

function actualizarMapaPrincipal(rutasData) {
    if (!mapaPrincipal) return;

    if (controlesRuta.length > 0) {
        controlesRuta.forEach((control) => {
            try { mapaPrincipal.removeControl(control); } catch (e) {}
        });
        controlesRuta = [];
    }

    mapaPrincipal.eachLayer(function (layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
            mapaPrincipal.removeLayer(layer);
        }
    });

    const contador = document.getElementById("contadorRutas");
    if (contador) contador.textContent = `${(rutasData || []).length} rutas`;

    if (!rutasData || rutasData.length === 0) return;

    rutasData.forEach((ruta) => {
        const color = ruta.color || "#74A9D3";
        if (!ruta.paradas || ruta.paradas.length < 2) return;

        const ordenadas = [...ruta.paradas].sort((a, b) => a.orden - b.orden);
        const waypoints = ordenadas
            .map((p) => {
                const coords = p.coordenadas ? p.coordenadas.split(",") : [];
                if (coords.length === 2) {
                    const lat = parseFloat(coords[0].trim());
                    const lng = parseFloat(coords[1].trim());
                    if (!isNaN(lat) && !isNaN(lng)) return L.latLng(lat, lng);
                }
                return null;
            })
            .filter((w) => w !== null);

        if (waypoints.length >= 2) {
            L.polyline(waypoints, { color: color, weight: 3, opacity: 0.7 }).addTo(mapaPrincipal);

            waypoints.forEach((coord, i) => {
                const parada = ordenadas[i];
                L.circleMarker(coord, {
                    radius: 6,
                    fillColor: color,
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9,
                })
                    .addTo(mapaPrincipal)
                    .bindPopup(`<strong>${parada.nombre}</strong><br>Orden: ${i + 1}`);
            });
        }
    });
}

function toggleExpandirMapa() {
    const mapa = document.getElementById("mapa-rutas-principal");
    const btn = document.getElementById("btnExpandirMapa");
    if (!mapa || !btn) return;
    const icono = btn.querySelector("i");

    mapa.classList.toggle("expanded");

    if (mapa.classList.contains("expanded")) {
        icono.classList.remove("fa-expand");
        icono.classList.add("fa-compress");
        btn.title = "Reducir mapa";
    } else {
        icono.classList.remove("fa-compress");
        icono.classList.add("fa-expand");
        btn.title = "Expandir mapa";
    }

    setTimeout(() => {
        if (mapaPrincipal) mapaPrincipal.invalidateSize();
    }, 350);
}

// ============================================================
// 13. INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    inicializarMapaPrincipal();

    const btnExpandir = document.getElementById("btnExpandirMapa");
    if (btnExpandir) btnExpandir.addEventListener("click", toggleExpandirMapa);

    const nuevaRutaBtn = document.getElementById("btnNuevaRuta");
    if (nuevaRutaBtn) {
        nuevaRutaBtn.onclick = function () {
            editandoIdRuta = null;
            abrirModalRuta("Nueva Ruta");
        };
    }

    const form = document.getElementById("formNuevaRuta");
    if (form) form.onsubmit = guardarRuta;

    window.addEventListener("click", function (event) {
        const modal = document.getElementById("modalNuevaRuta");
        if (event.target === modal) cerrarModalRuta();

        const modalVer = document.getElementById("modalVerRuta");
        if (event.target === modalVer) cerrarModalVerRuta();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const modal = document.getElementById("modalNuevaRuta");
            if (modal && modal.classList.contains("show")) cerrarModalRuta();

            const modalVer = document.getElementById("modalVerRuta");
            if (modalVer && modalVer.classList.contains("show")) cerrarModalVerRuta();
        }
    });

    document.getElementById("searchRuta")?.addEventListener("input", aplicarFiltros);
    document.getElementById("filterLinea")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filterEstado")?.addEventListener("change", aplicarFiltros);

    document.getElementById("btnAnterior")?.addEventListener("click", () => {
        if (paginaActual > 1) { paginaActual--; renderizarPagina(); }
    });
    document.getElementById("btnSiguiente")?.addEventListener("click", () => {
        const totalPaginas = Math.max(1, Math.ceil(rutasFiltradas.length / itemsPorPagina));
        if (paginaActual < totalPaginas) { paginaActual++; renderizarPagina(); }
    });

    cargarDatos();
});