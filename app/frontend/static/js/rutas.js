// ============================================================
// PAGINA DE RUTAS - CRUD completo con mapa y paradas
// ============================================================

let editandoIdRuta = null;
let loadingRuta = false;
let rutas = [];
let lineas = [];
let paradasDisponibles = [];
let paradasSeleccionadas = [];
let paginaActual = 1;
const itemsPorPagina = 10;
let idRutaViendo = null;
let mapaPrincipal = null;
let controlesRuta = [];
let mapaModal = null;
let marcadoresModal = [];

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
// 2. MODAL NUEVA / EDITAR
// ============================================================
async function abrirModalRuta(titulo = "Nueva Ruta") {
  const modal = document.getElementById("modalNuevaRuta");
  if (!modal) return;

  document.getElementById("formNuevaRuta").reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  const titleEl = document.getElementById("modalRutaTitle");
  if (titleEl) titleEl.textContent = titulo;

  paradasSeleccionadas = [];

  await cargarSelectsRuta();
  await cargarParadasDisponibles();

  renderizarListasParadas();

  modal.classList.add("show");

  setTimeout(() => {
    inicializarMapaModal();
  }, 300);

  const btnGuardar = document.getElementById("guardarRutaBtn");
  if (btnGuardar) btnGuardar.disabled = false;
}

function cerrarModalRuta() {
  const modal = document.getElementById("modalNuevaRuta");
  if (modal) modal.classList.remove("show");
  editandoIdRuta = null;
  paradasSeleccionadas = [];

  if (mapaModal) {
    mapaModal.off();
    mapaModal.remove();
    mapaModal = null;
  }

  const btnGuardar = document.getElementById("guardarRutaBtn");
  if (btnGuardar) btnGuardar.disabled = false;
}

// ============================================================
// 3. CARGAR SELECTS DE LINEAS
// ============================================================
async function cargarSelectsRuta() {
  try {
    const resp = await fetch("/admin/lineas", { credentials: "include" });
    const data = await resp.json();
    if (data.success) {
      lineas = data.data || [];
      const select = document.getElementById("id_linea_ruta");
      if (select) {
        select.innerHTML = '<option value="">Seleccione una linea...</option>';
        lineas.forEach((linea) => {
          const opt = document.createElement("option");
          opt.value = linea.id;
          opt.textContent = linea.nombre;
          select.appendChild(opt);
        });
      }
    }
  } catch (error) {
    console.error("Error al cargar lineas:", error);
    mostrarNotificacion("Error al cargar lineas", "danger");
  }
}

// ============================================================
// 4. CARGAR PARADAS DISPONIBLES
// ============================================================
async function cargarParadasDisponibles() {
  try {
    const resp = await fetch("/admin/paradas", { credentials: "include" });
    const data = await resp.json();
    if (data.success) {
      paradasDisponibles = data.data || [];
      window.paradasDisponibles = paradasDisponibles;
    }
  } catch (error) {
    console.error("Error al cargar paradas:", error);
    mostrarNotificacion("Error al cargar paradas", "danger");
  }
}

// ============================================================
// 5. RENDERIZAR LISTAS DE PARADAS
// ============================================================
function renderizarListasParadas() {
  const listaDisp = document.getElementById("listaDisponibles");
  const listaSel = document.getElementById("listaSeleccionadas");
  const contDisp = document.getElementById("contadorDisponibles");
  const contSel = document.getElementById("contadorSeleccionadas");
  const contTotal = document.getElementById("contadorParadasSeleccionadas");

  if (!listaDisp || !listaSel) return;

  const idsSeleccionados = paradasSeleccionadas.map((p) => p.id);
  const disponibles = paradasDisponibles.filter(
    (p) => !idsSeleccionados.includes(p.id),
  );

  if (contDisp) contDisp.textContent = disponibles.length;
  if (contSel) contSel.textContent = paradasSeleccionadas.length;
  if (contTotal)
    contTotal.textContent = `${paradasSeleccionadas.length} paradas`;

  listaDisp.innerHTML = "";
  if (disponibles.length === 0) {
    listaDisp.innerHTML =
      '<div class="item-vacio">No hay paradas disponibles</div>';
  } else {
    disponibles.forEach((parada) => {
      const div = document.createElement("div");
      div.className = "item-parada";
      div.innerHTML = `
        <span class="nombre-parada">${parada.nombre}</span>
        <button type="button" class="btn-agregar-item" data-id="${parada.id}">
          Agregar
        </button>
      `;
      listaDisp.appendChild(div);
    });
  }

  listaSel.innerHTML = "";
  if (paradasSeleccionadas.length === 0) {
    listaSel.innerHTML =
      '<div class="item-vacio">No hay paradas seleccionadas</div>';
  } else {
    paradasSeleccionadas.forEach((parada, index) => {
      const div = document.createElement("div");
      div.className = "item-parada";
      div.innerHTML = `
        <span class="numero-orden">${index + 1}</span>
        <span class="nombre-parada">${parada.nombre}</span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="btn-quitar-item" data-id="${parada.id}" title="Quitar">
            Quitar
          </button>
        </div>
      `;
      listaSel.appendChild(div);
    });
  }

  document.querySelectorAll(".btn-agregar-item").forEach((btn) => {
    btn.onclick = function () {
      const id = parseInt(this.getAttribute("data-id"));
      agregarParada(id);
    };
  });

  document.querySelectorAll(".btn-quitar-item").forEach((btn) => {
    btn.onclick = function () {
      const id = parseInt(this.getAttribute("data-id"));
      quitarParada(id);
    };
  });

  actualizarMapaModal();
}

function agregarParada(id) {
  const parada = paradasDisponibles.find((p) => p.id === id);
  if (!parada) return;
  if (paradasSeleccionadas.find((p) => p.id === id)) return;
  paradasSeleccionadas.push(parada);
  renderizarListasParadas();
}

function quitarParada(id) {
  paradasSeleccionadas = paradasSeleccionadas.filter((p) => p.id !== id);
  renderizarListasParadas();
}

// ============================================================
// 6. BOTONES AGREGAR TODAS / QUITAR TODAS
// ============================================================
function configurarBotonesParadas() {
  const btnAddAll = document.getElementById("btnAgregarTodasParadas");
  if (btnAddAll) {
    btnAddAll.onclick = function () {
      paradasSeleccionadas = [...paradasDisponibles];
      renderizarListasParadas();
    };
  }

  const btnQuitarAll = document.getElementById("btnQuitarTodasParadas");
  if (btnQuitarAll) {
    btnQuitarAll.onclick = function () {
      paradasSeleccionadas = [];
      renderizarListasParadas();
    };
  }
}

// ============================================================
// 7. GUARDAR RUTA (POST o PUT)
// ============================================================
async function guardarRuta(e) {
  if (e) e.preventDefault();
  if (loadingRuta) return;

  const form = document.getElementById("formNuevaRuta");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  let valid = true;
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  if (!data.nombre || !data.nombre.trim()) {
    document.getElementById("nombre_ruta").classList.add("is-invalid");
    valid = false;
  }
  if (!data.id_linea) {
    document.getElementById("id_linea_ruta").classList.add("is-invalid");
    valid = false;
  }
  if (!valid) {
    mostrarNotificacion("Complete los campos obligatorios", "warning");
    return;
  }

  data.paradas_ids = paradasSeleccionadas.map((p) => p.id);

  loadingRuta = true;
  document.getElementById("guardarRutaBtn").disabled = true;

  try {
    const csrfToken = getCookie("csrf_access_token");
    const esEdicion = editandoIdRuta !== null;
    const url = esEdicion ? `/admin/rutas/${editandoIdRuta}` : "/admin/rutas";
    const method = esEdicion ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
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
        esEdicion
          ? "Ruta actualizada exitosamente"
          : "Ruta creada exitosamente",
        "success",
      );
      cerrarModalRuta();
      cargarDatos();
    } else {
      mostrarNotificacion(
        result.message || "Error al guardar la ruta",
        "danger",
      );
    }
  } catch (error) {
    console.error("Error al guardar ruta:", error);
    mostrarNotificacion("Error de conexion al servidor", "danger");
  } finally {
    loadingRuta = false;
    document.getElementById("guardarRutaBtn").disabled = false;
  }
}

// ============================================================
// 8. ELIMINAR RUTA
// ============================================================
async function eliminarRuta(id) {
  if (!confirm(`Esta seguro de eliminar la ruta ID: ${id}?`)) return;

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
    mostrarNotificacion("Error de conexion al servidor", "danger");
  }
}

// ============================================================
// 9. CARGAR DATOS
// ============================================================
async function cargarDatos() {
  const tbody = document.getElementById("rutasTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-cargando">
          <i class="fas fa-spinner fa-spin"></i> Cargando...
        </td>
      </tr>`;
  }

  try {
    const response = await fetch("/admin/rutas/api", {
      credentials: "include",
    });
    const data = await response.json();

    if (data.success) {
      rutas = data.data || [];
      paginaActual = 1;
      renderizarPagina();

      if (!mapaPrincipal) {
        inicializarMapaPrincipal();
      }
      actualizarMapaPrincipal(rutas);
    }
  } catch (error) {
    console.error("Error al cargar rutas:", error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="tabla-vacia">Error al cargar datos</td>
        </tr>`;
    }
  }

  try {
    const respLineas = await fetch("/admin/lineas", { credentials: "include" });
    const dataLineas = await respLineas.json();
    if (dataLineas.success) {
      lineas = dataLineas.data || [];
      llenarFiltroLineas(lineas);
    }
  } catch (error) {
    console.error("Error al cargar lineas:", error);
  }
}

// ============================================================
// 10. RENDERIZAR TABLA
// ============================================================
function renderizarPagina() {
  const tbody = document.getElementById("rutasTableBody");
  if (!tbody) return;

  if (rutas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-vacia">No hay rutas registradas</td>
      </tr>`;
    actualizarControlesPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const pagina = rutas.slice(inicio, fin);

  tbody.innerHTML = "";
  pagina.forEach((ruta) => {
    const idRuta = ruta.id ?? ruta.id_ruta;
    const statusClass =
      ruta.status === "activa" ? "status-active" : "status-inactive";
    const statusText = ruta.status === "activa" ? "Activa" : "Inactiva";
    const nombreLinea =
      ruta.linea_nombre ||
      (ruta.linea ? ruta.linea.nombre : null) ||
      "Sin linea";
    const totalParadas = Array.isArray(ruta.paradas) ? ruta.paradas.length : 0;

    const tr = document.createElement("tr");
    tr.setAttribute("data-linea-id", ruta.id_linea);
    tr.setAttribute("data-status", ruta.status);
    tr.innerHTML = `
      <td><strong>RUTA-${String(idRuta).padStart(3, "0")}</strong></td>
      <td>${ruta.nombre}</td>
      <td>
        <a href="/admin/lineas-page?id=${ruta.id_linea}" class="link-linea" title="Ver linea">
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

  asignarEventosRutas();
  actualizarControlesPaginacion(rutas.length);
}

function actualizarControlesPaginacion(totalItems) {
  const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
  const info = document.getElementById("infoPagina");
  const btnPrev = document.getElementById("btnAnterior");
  const btnNext = document.getElementById("btnSiguiente");

  if (info) info.textContent = `Pagina ${paginaActual} de ${totalPaginas}`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
}

// ============================================================
// 11. MAPA PRINCIPAL
// ============================================================
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

  container.innerHTML = "";

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
      try {
        mapaPrincipal.removeControl(control);
      } catch (e) {}
    });
    controlesRuta = [];
  }

  mapaPrincipal.eachLayer(function (layer) {
    if (
      layer instanceof L.Marker ||
      layer instanceof L.Polyline ||
      layer instanceof L.CircleMarker
    ) {
      mapaPrincipal.removeLayer(layer);
    }
  });

  if (!rutasData || rutasData.length === 0) {
    const contador = document.getElementById("contadorRutas");
    if (contador) contador.textContent = "0 rutas";
    return;
  }

  rutasData.forEach((ruta) => {
    const color = ruta.color || "#74A9D3";

    if (ruta.paradas && ruta.paradas.length >= 2) {
      const paradasOrdenadas = [...ruta.paradas].sort(
        (a, b) => a.orden - b.orden,
      );

      const waypoints = paradasOrdenadas
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
        if (typeof L.Routing !== "undefined") {
          try {
            const rutaControl = L.Routing.control({
              waypoints: waypoints,
              routeWhileDragging: false,
              showAlternatives: false,
              fitSelectedRoutes: false,
              lineOptions: {
                styles: [{ color: color, weight: 4, opacity: 0.8 }],
                extendToWaypoints: false,
                missingRouteTolerance: 0,
              },
              router: L.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1/",
              }),
              show: false,
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
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(mapaPrincipal);

          marker.bindPopup(
            `<strong>${parada.nombre}</strong><br>Orden: ${i + 1}<br>Ruta: ${ruta.nombre}`,
          );
        });
      }
    }
  });

  const contador = document.getElementById("contadorRutas");
  if (contador) contador.textContent = `${rutasData.length} rutas`;
}

function dibujarLineaRecta(mapa, waypoints, color) {
  if (waypoints.length < 2) return;
  L.polyline(waypoints, {
    color: color,
    weight: 3,
    opacity: 0.7,
    dashArray: "5, 10",
  }).addTo(mapa);
}

// ============================================================
// 12. MAPA EN MODAL
// ============================================================
function inicializarMapaModal() {
  const container = document.getElementById("mapa-rutas-modal");
  if (!container) return;

  if (mapaModal) {
    mapaModal.off();
    mapaModal.remove();
    mapaModal = null;
  }

  container.innerHTML = "";
  marcadoresModal = [];

  mapaModal = L.map("mapa-rutas-modal").setView([10.3447, -67.04], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "OpenStreetMap",
  }).addTo(mapaModal);

  setTimeout(() => {
    if (mapaModal) mapaModal.invalidateSize();
  }, 300);

  actualizarMapaModal();
}

function actualizarMapaModal() {
  if (!mapaModal) return;

  marcadoresModal.forEach((m) => {
    try {
      mapaModal.removeLayer(m);
    } catch (e) {}
  });
  marcadoresModal = [];

  mapaModal.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      mapaModal.removeLayer(layer);
    }
  });

  if (paradasSeleccionadas.length === 0) return;

  const coords = [];
  paradasSeleccionadas.forEach((p) => {
    if (p.coordenadas) {
      const partes = p.coordenadas.split(",");
      if (partes.length === 2) {
        const lat = parseFloat(partes[0].trim());
        const lng = parseFloat(partes[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) coords.push([lat, lng]);
      }
    }
  });

  if (coords.length === 0) return;

  const bounds = L.latLngBounds(coords);
  mapaModal.fitBounds(bounds, { padding: [30, 30] });

  coords.forEach((coord, i) => {
    const marker = L.marker(coord, {
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div style="background:#4285f4;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">${i + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(mapaModal);
    marcadoresModal.push(marker);
  });

  if (coords.length > 1) {
    L.polyline(coords, {
      color: "#4285f4",
      weight: 3,
      opacity: 0.7,
      dashArray: "8, 8",
    }).addTo(mapaModal);
  }
}

// ============================================================
// 13. EXPANDIR MAPA
// ============================================================
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
// 14. EVENTOS DE LA TABLA
// ============================================================
function asignarEventosRutas() {
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
// 15. VER RUTA
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
      ruta.linea_nombre ||
      (ruta.linea ? ruta.linea.nombre : null) ||
      "Sin linea";
    const statusText = ruta.status === "activa" ? "Activa" : "Inactiva";

    document.getElementById("verRutaId").textContent =
      `RUTA-${String(idRuta).padStart(3, "0")}`;
    document.getElementById("verRutaNombre").textContent = ruta.nombre || "-";
    document.getElementById("verRutaLinea").textContent = nombreLinea;
    document.getElementById("verRutaParadas").textContent =
      `${(ruta.paradas || []).length} paradas`;
    document.getElementById("verRutaEstado").textContent = statusText;

    const badge = document.getElementById("verRutaEstadoBadge");
    badge.className = "status-badge";
    badge.classList.add(
      ruta.status === "activa" ? "status-active" : "status-inactive",
    );

    const lista = document.getElementById("verRutaListaParadas");
    lista.innerHTML = "";
    if (ruta.paradas && ruta.paradas.length > 0) {
      const paradasOrdenadas = [...ruta.paradas].sort(
        (a, b) => a.orden - b.orden,
      );
      paradasOrdenadas.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = p.nombre || `Parada #${p.id}`;
        lista.appendChild(li);
      });
    } else {
      lista.innerHTML = '<li class="item-vacio">Sin paradas</li>';
    }

    document.getElementById("modalVerRuta").classList.add("show");
  } catch (error) {
    console.error("Error al ver ruta:", error);
    mostrarNotificacion("Error de conexion al servidor", "danger");
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
// 16. EDITAR RUTA
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
    paradasSeleccionadas = [];

    const modal = document.getElementById("modalNuevaRuta");
    document.getElementById("formNuevaRuta").reset();
    document.getElementById("modalRutaTitle").textContent = "Editar Ruta";

    await cargarSelectsRuta();
    await cargarParadasDisponibles();

    if (ruta.paradas && ruta.paradas.length > 0) {
      const ids = ruta.paradas.map((p) => p.id);
      paradasSeleccionadas = paradasDisponibles.filter((p) =>
        ids.includes(p.id),
      );
    }

    modal.classList.add("show");

    document.getElementById("nombre_ruta").value = ruta.nombre || "";
    document.getElementById("id_linea_ruta").value = ruta.id_linea || "";
    document.getElementById("status_ruta").value = ruta.status || "activa";

    renderizarListasParadas();

    setTimeout(() => {
      inicializarMapaModal();
    }, 300);
  } catch (error) {
    console.error("Error al editar ruta:", error);
    mostrarNotificacion("Error de conexion al servidor", "danger");
  }
}

// ============================================================
// 17. FILTROS
// ============================================================
function llenarFiltroLineas(listaLineas) {
  const select = document.getElementById("filterLinea");
  if (!select) return;
  select.innerHTML = '<option value="">Todas las lineas</option>';
  listaLineas.forEach((linea) => {
    const option = document.createElement("option");
    option.value = linea.id;
    option.textContent = linea.nombre;
    select.appendChild(option);
  });
}

function aplicarFiltros() {
  const searchTerm =
    document.getElementById("searchRuta")?.value?.toLowerCase() || "";
  const filterLinea = document.getElementById("filterLinea")?.value || "";
  const filterEstado = document.getElementById("filterEstado")?.value || "";

  document.querySelectorAll("#rutasTableBody tr").forEach((tr) => {
    if (tr.querySelector(".tabla-vacia") || tr.querySelector(".tabla-cargando"))
      return;

    const nombre =
      tr.querySelector("td:nth-child(2)")?.textContent?.toLowerCase() || "";
    const lineaId = tr.getAttribute("data-linea-id");
    const estado = tr.getAttribute("data-status");

    let visible = true;
    if (searchTerm && !nombre.includes(searchTerm)) visible = false;
    if (filterLinea && lineaId !== filterLinea) visible = false;
    if (filterEstado && estado !== filterEstado) visible = false;
    tr.style.display = visible ? "" : "none";
  });
}

// ============================================================
// 18. INICIALIZACION
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  inicializarMapaPrincipal();

  const btnExpandir = document.getElementById("btnExpandirMapa");
  if (btnExpandir) {
    btnExpandir.addEventListener("click", toggleExpandirMapa);
  }

  const nuevaRutaBtn = document.getElementById("btnNuevaRuta");
  if (nuevaRutaBtn) {
    nuevaRutaBtn.onclick = function () {
      editandoIdRuta = null;
      abrirModalRuta("Nueva Ruta");
    };
  }

  const form = document.getElementById("formNuevaRuta");
  if (form) {
    form.onsubmit = guardarRuta;
  }

  configurarBotonesParadas();

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

  document
    .getElementById("searchRuta")
    ?.addEventListener("input", aplicarFiltros);
  document
    .getElementById("filterLinea")
    ?.addEventListener("change", aplicarFiltros);
  document
    .getElementById("filterEstado")
    ?.addEventListener("change", aplicarFiltros);

  document.getElementById("btnAnterior")?.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      renderizarPagina();
    }
  });
  document.getElementById("btnSiguiente")?.addEventListener("click", () => {
    const totalPaginas = Math.max(1, Math.ceil(rutas.length / itemsPorPagina));
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderizarPagina();
    }
  });

  cargarDatos();
});
