// ============================================================
// PAGINA DE RUTAS - CRUD completo con mapa y paradas
// ============================================================

let pasoActual = 1;
let editandoIdRuta = null;
let paradasRuta = []; // [{ id, nombre, coordenadas, tiempoSiguiente }]
let loadingRuta = false;
let rutas = [];
let lineas = [];
let paradasDisponibles = [];
let paginaActual = 1;
const itemsPorPagina = 10;
let idRutaViendo = null;
let mapaPrincipal = null;
let controlesRuta = [];
let mapaModal = null;
let marcadoresModal = [];
let mapaPreview = null;
let marcadoresPreview = [];

// ============================================================
// 1. NOTIFICACIONES
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
  const iconMap = { danger: "error", success: "success", warning: "warning", info: "info" };
  const icon = iconMap[tipo] || "info";
  if (typeof showToast === "function") {
    showToast(mensaje, icon);
    return;
  }
  alert(mensaje);
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

// ============================================================
// 2. MODAL NUEVA / EDITAR
// ============================================================
async function abrirModalRuta(titulo = "Nueva Ruta") {
  const modal = document.getElementById("modalNuevaRuta");
  if (!modal) return;

  document.getElementById("formNuevaRuta").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

  const titleEl = document.getElementById("modalRutaTitle");
  if (titleEl) titleEl.textContent = titulo;

  paradasRuta = [];
  pasoActual = 1;

  await cargarSelectsRuta();
  await cargarParadasDisponibles();

  irPaso(1);
  renderizarPaso2();

  modal.classList.add("show");

  const btnGuardar = document.getElementById("guardarRutaBtn");
  if (btnGuardar) btnGuardar.disabled = false;
}

function cerrarModalRuta() {
  const modal = document.getElementById("modalNuevaRuta");
  if (modal) modal.classList.remove("show");
  editandoIdRuta = null;
  paradasRuta = [];
  pasoActual = 1;

  if (mapaPreview) {
    mapaPreview.off();
    mapaPreview.remove();
    mapaPreview = null;
  }
  marcadoresPreview = [];

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
// PASO 2: RENDERIZAR DISPONIBLES Y RUTA CONSTRUIDA
// ============================================================
function renderizarPaso2() {
  renderizarDisponiblesPaso2();
  renderizarRutaConstruida();
}

function renderizarDisponiblesPaso2() {
  const listaDisp = document.getElementById("listaDisponibles");
  const contDisp = document.getElementById("contadorDisponibles");
  if (!listaDisp) return;

  const idsSeleccionados = paradasRuta.map((p) => p.id);
  const disponibles = paradasDisponibles.filter((p) => !idsSeleccionados.includes(p.id));

  if (contDisp) contDisp.textContent = disponibles.length;

  listaDisp.innerHTML = "";
  if (disponibles.length === 0) {
    listaDisp.innerHTML = '<div class="item-vacio">No hay paradas disponibles</div>';
    return;
  }

  disponibles.forEach((parada) => {
    const div = document.createElement("div");
    div.className = "item-parada";
    div.innerHTML = `
      <span class="nombre-parada">${parada.nombre}</span>
      <button type="button" class="btn-agregar-item" data-id="${parada.id}">
        <i class="fas fa-plus"></i> Agregar
      </button>
    `;
    listaDisp.appendChild(div);
  });

  document.querySelectorAll(".btn-agregar-item").forEach((btn) => {
    btn.onclick = function () {
      const id = parseInt(this.getAttribute("data-id"));
      agregarParadaRuta(id);
    };
  });
}

function renderizarRutaConstruida() {
  const cont = document.getElementById("rutaConstruida");
  if (!cont) return;

  if (paradasRuta.length === 0) {
    cont.innerHTML = '<div class="item-vacio">Selecciona paradas para construir la ruta</div>';
    return;
  }

  cont.innerHTML = "";

  paradasRuta.forEach((parada, index) => {
    // Item de la parada
    const item = document.createElement("div");
    item.className = "ruta-parada-item";
    item.innerHTML = `
      <span class="orden">${index + 1}</span>
      <span class="nombre">${parada.nombre}</span>
      <button type="button" class="btn-remove" data-id="${parada.id}" title="Quitar">
        <i class="fas fa-times"></i>
      </button>
    `;
    cont.appendChild(item);

    // Si no es la última parada, mostrar el input de tiempo
    if (index < paradasRuta.length - 1) {
      const conexion = document.createElement("div");
      conexion.className = "tiempo-conexion";
      conexion.innerHTML = `
        <label><i class="fas fa-clock"></i> Tiempo entre ${index + 1} y ${index + 2}:</label>
        <input type="number" min="1" max="999" value="${parada.tiempoSiguiente || ""}"
               data-index="${index}" placeholder="0" class="input-tiempo">
        <span>min</span>
      `;
      cont.appendChild(conexion);
    }
  });

  // Listeners para quitar paradas
  cont.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.onclick = function () {
      const id = parseInt(this.getAttribute("data-id"));
      quitarParadaRuta(id);
    };
  });

  // Listeners para tiempos
  cont.querySelectorAll(".input-tiempo").forEach((input) => {
    input.oninput = function () {
      const idx = parseInt(this.getAttribute("data-index"));
      const val = parseInt(this.value) || 0;
      paradasRuta[idx].tiempoSiguiente = val;
    };
  });
}

function agregarParadaRuta(id) {
  const parada = paradasDisponibles.find((p) => p.id === id);
  if (!parada) return;
  if (paradasRuta.find((p) => p.id === id)) return;

  paradasRuta.push({
    id: parada.id,
    nombre: parada.nombre,
    coordenadas: parada.coordenadas || null,
    tiempoSiguiente: null,
  });

  renderizarPaso2();
}

function quitarParadaRuta(id) {
  paradasRuta = paradasRuta.filter((p) => p.id !== id);
  renderizarPaso2();
}

// ============================================================
// PASO 3: RESUMEN Y MAPA PREVIEW
// ============================================================
function actualizarResumenConfirmacion() {
  const nombre = document.getElementById("nombre_ruta").value.trim();
  const selectLinea = document.getElementById("id_linea_ruta");
  const nombreLinea = selectLinea.options[selectLinea.selectedIndex]?.textContent || "-";
  const estado = document.getElementById("status_ruta").value;

  document.getElementById("resumenNombre").textContent = nombre || "-";
  document.getElementById("resumenLinea").textContent = nombreLinea;
  document.getElementById("resumenEstado").textContent = estado === "activa" ? "Activa" : "Inactiva";
  document.getElementById("resumenParadas").textContent = paradasRuta.length;

  // Tiempo total (suma de tiemposSiguiente)
  const tiempoTotal = paradasRuta
    .slice(0, -1)
    .reduce((sum, p) => sum + (p.tiempoSiguiente || 0), 0);
  document.getElementById("resumenTiempo").textContent = `${tiempoTotal} min`;

  // Lista detallada
  const lista = document.getElementById("resumenListaParadas");
  lista.innerHTML = "";
  paradasRuta.forEach((p, i) => {
    const li = document.createElement("li");
    let texto = p.nombre;
    if (i < paradasRuta.length - 1) {
      texto += ` <small>(${p.tiempoSiguiente} min → siguiente)</small>`;
    }
    li.innerHTML = texto;
    lista.appendChild(li);
  });
}

function inicializarMapaPreview() {
  const container = document.getElementById("mapa-rutas-preview");
  if (!container) return;

  if (mapaPreview) {
    mapaPreview.off();
    mapaPreview.remove();
    mapaPreview = null;
  }
  marcadoresPreview = [];
  container.innerHTML = "";

  mapaPreview = L.map("mapa-rutas-preview").setView([10.3447, -67.04], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "OpenStreetMap",
  }).addTo(mapaPreview);

  setTimeout(() => mapaPreview && mapaPreview.invalidateSize(), 200);

  const coords = [];
  paradasRuta.forEach((p, i) => {
    if (p.coordenadas) {
      const partes = p.coordenadas.split(",");
      if (partes.length === 2) {
        const lat = parseFloat(partes[0].trim());
        const lng = parseFloat(partes[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          coords.push([lat, lng]);
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: "custom-marker",
              html: `<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">${i + 1}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(mapaPreview);
          marker.bindPopup(`<strong>${p.nombre}</strong>`);
          marcadoresPreview.push(marker);
        }
      }
    }
  });

  if (coords.length > 0) {
    mapaPreview.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
  }
  if (coords.length > 1) {
    L.polyline(coords, { color: "#2563eb", weight: 3, opacity: 0.7, dashArray: "8, 8" }).addTo(mapaPreview);
  }
}

// ============================================================
// WIZARD: NAVEGACIÓN ENTRE PASOS
// ============================================================
function irPaso(paso) {
  // Validar paso 1 antes de avanzar
  if (paso === 2 && pasoActual === 1) {
    const nombre = document.getElementById("nombre_ruta").value.trim();
    const idLinea = document.getElementById("id_linea_ruta").value;
    if (!nombre) {
      document.getElementById("nombre_ruta").classList.add("is-invalid");
      mostrarNotificacion("Ingresa el nombre de la ruta", "warning");
      return;
    }
    if (!idLinea) {
      document.getElementById("id_linea_ruta").classList.add("is-invalid");
      mostrarNotificacion("Selecciona una línea", "warning");
      return;
    }
    document.getElementById("nombre_ruta").classList.remove("is-invalid");
    document.getElementById("id_linea_ruta").classList.remove("is-invalid");
  }

  // Validar paso 2 antes de avanzar
  if (paso === 3) {
    if (paradasRuta.length < 2) {
      mostrarNotificacion("Debes seleccionar al menos 2 paradas", "warning");
      return;
    }
    // Validar que todos los tiempos estén llenos (excepto el último)
    for (let i = 0; i < paradasRuta.length - 1; i++) {
      if (!paradasRuta[i].tiempoSiguiente || paradasRuta[i].tiempoSiguiente <= 0) {
        mostrarNotificacion(`Define el tiempo entre la parada ${i + 1} y ${i + 2}`, "warning");
        return;
      }
    }
    // Si vamos al paso 3, actualizar resumen y mapa
    actualizarResumenConfirmacion();
  }

  pasoActual = paso;

  // Actualizar paneles
  document.querySelectorAll(".wizard-panel").forEach((p) => p.classList.remove("active"));
  document.querySelector(`.wizard-panel[data-panel="${paso}"]`)?.classList.add("active");

  // Actualizar indicadores
  document.querySelectorAll(".wizard-step").forEach((s) => {
    const n = parseInt(s.dataset.step);
    s.classList.toggle("active", n === paso);
    s.classList.toggle("completed", n < paso);
  });

  // Inicializar mapa preview al entrar al paso 3
  if (paso === 3) {
    setTimeout(() => inicializarMapaPreview(), 200);
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

  if (!data.nombre || !data.nombre.trim() || !data.id_linea) {
    mostrarNotificacion("Completa los datos de la ruta", "warning");
    return;
  }
  if (paradasRuta.length < 2) {
    mostrarNotificacion("La ruta debe tener al menos 2 paradas", "warning");
    return;
  }

  // Construir payload con orden y tiempo hacia la siguiente
  data.paradas = paradasRuta.map((p, i) => ({
    id: p.id,
    orden: i + 1,
    tiempo_siguiente: i < paradasRuta.length - 1 ? p.tiempoSiguiente : null,
  }));
  data.paradas_ids = paradasRuta.map((p) => p.id);

  console.log("PAYLOAD A ENVIAR:", JSON.stringify(data, null, 2));

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
      mostrarNotificacion(esEdicion ? "Ruta actualizada" : "Ruta creada", "success");
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
    const response = await fetch("/admin/rutas/get", {
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
      <td>${totalParadas}</td>
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

  if (paradasRuta.length === 0) return;

  const coords = [];
  paradasRuta.forEach((p) => {
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
    paradasRuta = [];
    pasoActual = 1;

    document.getElementById("formNuevaRuta").reset();
    document.getElementById("modalRutaTitle").textContent = "Editar Ruta";

    await cargarSelectsRuta();
    await cargarParadasDisponibles();

    if (ruta.paradas && ruta.paradas.length > 0) {
      const ordenadas = [...ruta.paradas].sort((a, b) => a.orden - b.orden);
      paradasRuta = ordenadas.map((p, i) => ({
        id: p.id,
        nombre: p.nombre,
        coordenadas: p.coordenadas || null,
        tiempoSiguiente: p.tiempo_siguiente ?? null,
      }));
    }

    document.getElementById("modalNuevaRuta").classList.add("show");
    document.getElementById("nombre_ruta").value = ruta.nombre || "";
    document.getElementById("id_linea_ruta").value = ruta.id_linea || "";
    document.getElementById("status_ruta").value = ruta.status || "activa";

    irPaso(1);
    renderizarPaso2();
  } catch (error) {
    console.error("Error al editar ruta:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
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