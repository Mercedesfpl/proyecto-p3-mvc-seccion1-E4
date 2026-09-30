// frontend/static/js/pages/paradas.js

let editandoId = null;
let loading = false;
<<<<<<< HEAD
let rutasCache = []; //guardamos las rutas para el select
=======
let mapa = null;
let marcador = null;
let mapaPrincipal = null;
let marcadoresPrincipales = [];
let todasLasParadas = [];
let paradasFiltradas = [];
let paginaActual = 1;
const itemsPorPagina = 10;
let idParadaViendo = null;
>>>>>>> feature-mercedes

// ============================================================
// 1. HELPERS (usa los de base.js si existen)
// ============================================================

function mostrarNotificacion(mensaje, tipo = "success") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
    return;
  }
  alert(mensaje);
}

// ============================================================
// 2. MAPA PRINCIPAL
// ============================================================
function destruirMapaPrincipal() {
  if (mapaPrincipal) {
    mapaPrincipal.off();
    mapaPrincipal.remove();
    mapaPrincipal = null;
    marcadoresPrincipales = [];
  }
  const container = document.getElementById("mapa-principal");
  if (container) container.innerHTML = "";
}

function inicializarMapaPrincipal(paradas = []) {
  if (mapaPrincipal) destruirMapaPrincipal();

  const container = document.getElementById("mapa-principal");
  if (!container) return;

  container.innerHTML = "";

  let centroLat = 10.3447;
  let centroLng = -67.0400;

  if (paradas.length > 0 && paradas[0].coordenadas) {
    const coords = paradas[0].coordenadas.split(",");
    if (coords.length === 2) {
      const lat = parseFloat(coords[0].trim());
      const lng = parseFloat(coords[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        centroLat = lat;
        centroLng = lng;
      }
    }
  }

  mapaPrincipal = L.map("mapa-principal", {
    zoomControl: true,
    fadeAnimation: true,
    zoomAnimation: true,
  }).setView([centroLat, centroLng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    minZoom: 8,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abc",
    crossOrigin: true,
  }).addTo(mapaPrincipal);

  paradas.forEach((parada) => {
    if (parada.coordenadas) {
      const coords = parada.coordenadas.split(",");
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          agregarMarcadorPrincipal(lat, lng, parada);
        }
      }
    }
  });

  const contador = document.getElementById("contadorParadas");
  if (contador) contador.textContent = `${paradas.length} paradas`;

  setTimeout(() => {
    if (mapaPrincipal) mapaPrincipal.invalidateSize();
  }, 300);
}

function agregarMarcadorPrincipal(lat, lng, parada) {
  if (!mapaPrincipal) return;

  const esActiva = parada.status === "activa";
  const color = esActiva ? "#74A9D3" : "#95a5a6";

  const icono = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.2;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

  const marcador = L.marker([lat, lng], { icon: icono }).addTo(mapaPrincipal);

  const estadoTexto = esActiva ? "Activa" : "Inactiva";
  const estadoColor = esActiva ? "#10b981" : "#95a5a6";
  marcador.bindPopup(`
    <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 150px;">
      <strong style="font-size: 14px;">${parada.nombre}</strong>
      <br>
      <span style="font-size: 12px; color: #666;">${parada.coordenadas}</span>
      <br>
      <span style="font-size: 12px; color: ${estadoColor};">${estadoTexto}</span>
    </div>
  `);

  marcadoresPrincipales.push(marcador);
}

// ============================================================
// 3. MAPA EN MODAL (solo para nueva/editar)
// ============================================================
function destruirMapaModal() {
  if (mapa) {
    mapa.off();
    mapa.remove();
    mapa = null;
    marcador = null;
  }
  const container = document.getElementById("map-container");
  if (container) container.innerHTML = "";
}

function inicializarMapaModal(lat = 10.3447, lng = -67.0400) {
  if (mapa) destruirMapaModal();

  const container = document.getElementById("map-container");
  if (!container) return;

  container.innerHTML = "";

  mapa = L.map("map-container").setView([lat, lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abc",
    crossOrigin: true,
  }).addTo(mapa);

  const iconoPersonalizado = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: #74A9D3;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -4px; left: -4px; right: -4px; bottom: -4px;
          border-radius: 50%;
          background: #74A9D3;
          opacity: 0.2;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  marcador = L.marker([lat, lng], {
    draggable: true,
    icon: iconoPersonalizado,
  }).addTo(mapa);

  mapa.on("click", function (e) {
    const latlng = e.latlng;
    marcador.setLatLng(latlng);
    actualizarCoordenadas(latlng.lat, latlng.lng);
  });

  marcador.on("dragend", function () {
    const pos = marcador.getLatLng();
    actualizarCoordenadas(pos.lat, pos.lng);
  });

  if (typeof L.Control.geocoder !== "undefined") {
    L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: "Buscar dirección...",
      errorMessage: "No se encontró la dirección",
    })
      .on("markgeocode", function (e) {
        const center = e.geocode.center;
        marcador.setLatLng(center);
        mapa.setView(center, 16);
        actualizarCoordenadas(center.lat, center.lng);
      })
      .addTo(mapa);
  }

  setTimeout(() => {
    if (mapa) mapa.invalidateSize();
  }, 300);
}

function actualizarCoordenadas(lat, lng) {
  const input = document.getElementById("coordenadas");
  if (input) input.value = `${lat.toFixed(7)},${lng.toFixed(7)}`;
}

function mostrarMapaModal(mostrar) {
  const container = document.getElementById("mapaContainer");
  const btn = document.getElementById("btnToggleMapa");
  if (!container || !btn) return;

  if (mostrar) {
    container.style.display = "block";
    btn.classList.add("active");
    btn.innerHTML = '<i class="fas fa-times"></i> Ocultar mapa';

    const coordsInput = document.getElementById("coordenadas");
    let lat = 10.3447;
    let lng = -67.0400;

    if (coordsInput && coordsInput.value) {
      const partes = coordsInput.value.split(",");
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
    container.style.display = "none";
    btn.classList.remove("active");
    btn.innerHTML = '<i class="fas fa-map-marked-alt"></i> Mapa';
    destruirMapaModal();
  }
}

// ============================================================
// 4. EXPANDIR MAPA
// ============================================================
function toggleExpandirMapa() {
  const el = document.getElementById("mapa-principal");
  const btn = document.getElementById("btnExpandirMapa");
  const icono = btn.querySelector("i");

  el.classList.toggle("expanded");

  if (el.classList.contains("expanded")) {
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
// 5. MODAL NUEVA / EDITAR
// ============================================================
function abrirModal(titulo, data = null) {
  const modal = document.getElementById("paradaModal");
  if (!modal) return;

  document.getElementById("modalTitle").textContent = titulo;

  const form = document.getElementById("paradaForm");
  if (form) form.reset();

  const statusSelect = document.getElementById("status");
  if (statusSelect) statusSelect.value = "activa";

  const coordsInput = document.getElementById("coordenadas");
  if (coordsInput) coordsInput.value = "";

  if (mapa) mostrarMapaModal(false);

  if (data) {
<<<<<<< HEAD
    document.getElementById("nombre").value = data.nombre || "";
    document.getElementById("coordenadas").value = data.coordenadas || "";
    document.getElementById("status").value = data.status || "activa";
    document.getElementById("id_ruta").value = data.id_ruta || "";
  } else {
    document.getElementById("paradaForm").reset();
    document.getElementById("status").value = "activa";
    document.getElementById("id_ruta").value = "";
=======
    const nombreInput = document.getElementById("nombre");
    if (nombreInput) nombreInput.value = data.nombre || "";
    if (coordsInput && data.coordenadas) coordsInput.value = data.coordenadas;
    if (statusSelect) statusSelect.value = data.status || "activa";
>>>>>>> feature-mercedes
  }

  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  const btnGuardar = document.getElementById("btnGuardar");
  if (btnGuardar) btnGuardar.disabled = false;

  setTimeout(() => {
    const nombreInput = document.getElementById("nombre");
    if (nombreInput) nombreInput.focus();
  }, 100);
}

function cerrarModal() {
  const modal = document.getElementById("paradaModal");
  if (modal) modal.classList.remove("show");
  document.body.style.overflow = "";

  if (mapa) mostrarMapaModal(false);

  editandoId = null;

  const btnGuardar = document.getElementById("btnGuardar");
  if (btnGuardar) btnGuardar.disabled = false;
}

<<<<<<< HEAD
async function cargarRutas() {
  try {
    const response = await fetch("/admin/rutas/api", {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    rutasCache = data.data || [];

    const select = document.getElementById("id_ruta");
    select.innerHTML = '<option value="">Sin ruta</option>';
    rutasCache.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id_ruta;
      opt.textContent = r.nombre;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error al cargar rutas:", error);
  }
}

=======
// ============================================================
// 6. CARGAR PARADAS
// ============================================================
>>>>>>> feature-mercedes
async function cargarParadas() {
  const tbody = document.getElementById("paradasTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="tabla-cargando">
          <i class="fas fa-spinner fa-spin"></i> Cargando...
        </td>
      </tr>`;
  }

  try {
    const response = await fetch("/admin/paradas", { credentials: "include" });
    const data = await response.json();
    todasLasParadas = data.success && Array.isArray(data.data) ? data.data : [];
    paradasFiltradas = [...todasLasParadas];
    paginaActual = 1;

    renderizarPagina();
    inicializarMapaPrincipal(todasLasParadas);
  } catch (error) {
    console.error("Error al cargar paradas:", error);
    mostrarNotificacion("Error al cargar paradas", "danger");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="tabla-vacia">Error al cargar datos</td>
        </tr>`;
    }
  }
}

// ============================================================
// 7. RENDERIZAR PÁGINA
// ============================================================
function renderizarPagina() {
  const tbody = document.getElementById("paradasTableBody");
  if (!tbody) return;

  if (paradasFiltradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="tabla-vacia">No hay paradas registradas</td>
      </tr>`;
    actualizarControlesPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const pagina = paradasFiltradas.slice(inicio, fin);

  tbody.innerHTML = "";
  pagina.forEach((p) => {
    const statusClass = p.status === "activa" ? "status-active" : "status-inactive";
    const statusText = p.status === "activa" ? "Activa" : "Inactiva";

    const tr = document.createElement("tr");
    tr.setAttribute("data-status", p.status);
    tr.innerHTML = `
      <td><strong>PARADA-${String(p.id).padStart(3, "0")}</strong></td>
      <td>${p.nombre}</td>
      <td>
        <span class="status-badge ${statusClass}">
          <i class="fas fa-circle"></i> ${statusText}
        </span>
      </td>
      <td class="action-buttons">
        <button class="action-btn view" data-id="${p.id}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" data-id="${p.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" data-id="${p.id}" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  asignarEventosTabla();
  actualizarControlesPaginacion(paradasFiltradas.length);
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
      verParada(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      editarParada(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      eliminarParada(this.getAttribute("data-id"));
    };
  });
}

// ============================================================
// 9. VER PARADA
// ============================================================
async function verParada(id) {
  try {
    const response = await fetch(`/admin/paradas/${id}`, { credentials: "include" });
    const data = await response.json();
    if (!data.success || !data.data) {
      mostrarNotificacion(data.message || "Parada no encontrada", "danger");
      return;
    }
    const p = data.data;
    idParadaViendo = id;

    const statusText = p.status === "activa" ? "Activa" : "Inactiva";

    document.getElementById("verParadaId").textContent =
      `PARADA-${String(p.id).padStart(3, "0")}`;
    document.getElementById("verParadaNombre").textContent = p.nombre || "-";
    document.getElementById("verParadaCoordenadas").textContent = p.coordenadas || "-";
    document.getElementById("verParadaEstado").textContent = statusText;

    // Badge dinámico
    const badge = document.getElementById("verParadaEstadoBadge");
    badge.className = "status-badge";
    badge.classList.add(p.status === "activa" ? "status-active" : "status-inactive");

    // Fecha
    let fechaTexto = "No disponible";
    if (p.created_at) {
      const d = new Date(p.created_at);
      if (!isNaN(d.getTime())) {
        fechaTexto = new Intl.DateTimeFormat("es-VE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(d);
      }
    }
    document.getElementById("verParadaFecha").textContent = fechaTexto;

    document.getElementById("modalVerParada").classList.add("show");
  } catch (error) {
    console.error("Error al ver parada:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

function cerrarModalVerParada() {
  const modal = document.getElementById("modalVerParada");
  if (modal) modal.classList.remove("show");
  idParadaViendo = null;
}

function editarDesdeVer() {
  const id = idParadaViendo;
  cerrarModalVerParada();
  if (id) editarParada(id);
}

// ============================================================
// 10. EDITAR PARADA
// ============================================================
async function editarParada(id) {
  try {
    const response = await fetch(`/admin/paradas/${id}`, { credentials: "include" });
    const data = await response.json();
    if (!data.success || !data.data) throw new Error("Datos inválidos");

    editandoId = id;
    abrirModal("Editar Parada", data.data);
  } catch (error) {
    console.error("Error al cargar parada:", error);
    mostrarNotificacion("Error al cargar la parada", "danger");
  }
}

// ============================================================
// 11. ELIMINAR PARADA
// ============================================================
async function eliminarParada(id) {
  if (!confirm("¿Estás seguro de eliminar esta parada?")) return;

  try {
    const csrfToken = getCookie("csrf_access_token");
    const response = await fetch(`/admin/paradas/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
    });
    const data = await response.json();

    if (response.ok && data.success) {
      mostrarNotificacion("Parada eliminada exitosamente", "success");
      cargarParadas();
    } else {
      mostrarNotificacion(data.error || data.message || "Error al eliminar", "danger");
    }
  } catch (error) {
    console.error("Error:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {
  cargarRutas();

  document
    .getElementById("paradaForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
=======
// ============================================================
// 12. FILTROS
// ============================================================
function aplicarFiltros() {
  const searchTerm = document.getElementById("searchParada")?.value?.toLowerCase() || "";
  const filterEstado = document.getElementById("filterEstado")?.value || "";
>>>>>>> feature-mercedes

  paradasFiltradas = todasLasParadas.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const estado = p.status || "";

    if (searchTerm && !nombre.includes(searchTerm)) return false;
    if (filterEstado && estado !== filterEstado) return false;
    return true;
  });

  paginaActual = 1;
  renderizarPagina();
}

// ============================================================
// 13. INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  // Expandir mapa
  document.getElementById("btnExpandirMapa")?.addEventListener("click", toggleExpandirMapa);

  // Toggle mapa en modal
  document.getElementById("btnToggleMapa")?.addEventListener("click", function () {
    const container = document.getElementById("mapaContainer");
    const isVisible = container && container.style.display !== "none";
    mostrarMapaModal(!isVisible);
  });

  // Formulario
  const form = document.getElementById("paradaForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loading) return;
      loading = true;
      document.getElementById("btnGuardar").disabled = true;

      const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        coordenadas: document.getElementById("coordenadas").value.trim(),
        status: document.getElementById("status").value,
        id_ruta: document.getElementById("id_ruta").value || null,
      };

      if (!datos.nombre) {
        mostrarNotificacion("El nombre es obligatorio", "warning");
        loading = false;
        document.getElementById("btnGuardar").disabled = false;
        return;
      }
      if (!datos.coordenadas) {
        mostrarNotificacion("Las coordenadas son obligatorias", "warning");
        loading = false;
        document.getElementById("btnGuardar").disabled = false;
        return;
      }

      const url = editandoId ? `/admin/paradas/${editandoId}` : "/admin/paradas";
      const method = editandoId ? "PUT" : "POST";
      const csrfToken = getCookie("csrf_access_token");

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(datos),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          mostrarNotificacion(
            editandoId ? "Parada actualizada" : "Parada creada exitosamente",
            "success"
          );
          cerrarModal();
          cargarParadas();
        } else {
          mostrarNotificacion(data.error || data.message || "Error al guardar", "danger");
        }
      } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
      } finally {
        loading = false;
        document.getElementById("btnGuardar").disabled = false;
      }
    });
  }

  // Botón "Nueva Parada"
  const btnNueva = document.getElementById("nuevaParadaBtn");
  if (btnNueva) {
    btnNueva.addEventListener("click", function () {
      editandoId = null;
      abrirModal("Nueva Parada");
    });
  }

  // Cerrar modal con click fuera
  window.addEventListener("click", function (event) {
    const modalEditar = document.getElementById("paradaModal");
    if (event.target === modalEditar) cerrarModal();

    const modalVer = document.getElementById("modalVerParada");
    if (event.target === modalVer) cerrarModalVerParada();
  });

  // Cerrar con Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modalEditar = document.getElementById("paradaModal");
      if (modalEditar && modalEditar.classList.contains("show")) {
        cerrarModal();
      }
      const modalVer = document.getElementById("modalVerParada");
      if (modalVer && modalVer.classList.contains("show")) {
        cerrarModalVerParada();
      }
    }
  });

  // Filtros
  document.getElementById("searchParada")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filterEstado")?.addEventListener("change", aplicarFiltros);

  // Paginación
  document.getElementById("btnAnterior")?.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      renderizarPagina();
    }
  });

  document.getElementById("btnSiguiente")?.addEventListener("click", () => {
    const totalPaginas = Math.max(1, Math.ceil(paradasFiltradas.length / itemsPorPagina));
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderizarPagina();
    }
  });

  // Cargar datos
  cargarParadas();
});