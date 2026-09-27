// ============================================================
// PÁGINA DE RUTAS - CRUD completo (con modal)
// ============================================================

let editandoIdRuta = null;
let loadingRuta = false;
let rutas = [];
let lineas = [];

// ============================================================
// 1. NOTIFICACIONES (reutiliza showToast si existe)
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
    return;
  }
  if (tipo === "success") alert("✅ " + mensaje);
  else if (tipo === "warning") alert("⚠️ " + mensaje);
  else if (tipo === "danger") alert("❌ " + mensaje);
  else alert("ℹ️ " + mensaje);
}

// ============================================================
// 2. MODAL (abrir / cerrar)
// ============================================================
function abrirModalRuta(titulo = "Nueva Ruta") {
  const modal = document.getElementById("modalNuevaRuta");
  document.getElementById("formNuevaRuta").reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
  cargarSelectsRuta();

  setTimeout(() => {
    inicializarMapaModal();
  }, 300);

  modal.classList.add("show");
  document.getElementById("guardarRutaBtn").disabled = false;
}

function cerrarModalRuta() {
  const modal = document.getElementById("modalNuevaRuta");
  modal.classList.remove("show");
  editandoIdRuta = null;
  document.getElementById("guardarRutaBtn").disabled = false;
}
//Paso uno 🔽
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

// ============================================================
// 3. CARGAR SELECTS (líneas)
// ============================================================
async function cargarSelectsRuta() {
  try {
    const resp = await fetch("/admin/lineas");
    const data = await resp.json();
    if (data.success) {
      const select = document.getElementById("id_linea_ruta");
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
// 4. GUARDAR RUTA (POST /admin/rutas)
// ============================================================
async function guardarRuta(e) {
  if (e) e.preventDefault();
  if (loadingRuta) return;

  const form = document.getElementById("formNuevaRuta");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Validación
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
    mostrarNotificacion("Complete los campos obligatorios (*)", "warning");
    return;
  }

  loadingRuta = true;
  document.getElementById("guardarRutaBtn").disabled = true;
  /*Primero se copian la funcion getCookien al inicio de la pagina ver  paso 1
luego llaman a la funcion y lo asignan a una variable----> const csrfToken = getCookie("csrf_access_token"); ver paso 2
incluyen los headers de autorizacion ver paso 3
*/

  try {
    //Paso dos 🔽
    const csrfToken = getCookie("csrf_access_token");
    console.log("csrfToken--->", csrfToken);
    const response = await fetch("/admin/rutas", {
      method: "POST",
      //Paso tres 🔽

      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken, //  valor real, no "undefined"
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      mostrarNotificacion("Ruta creada exitosamente", "success");
      cerrarModalRuta();
      cargarDatos(); // Recargar lista
    } else {
      mostrarNotificacion(result.message || "Error al crear la ruta", "danger");
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
// 5. ELIMINAR RUTA (DELETE)
// ============================================================
async function eliminarRuta(id) {
  if (!confirm(`¿Está seguro de eliminar la ruta ID: ${id}?`)) return;

  try {
    const response = await fetch(`/admin/rutas/${id}`, {
      method: "DELETE",
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
// 6. CARGAR DATOS (rutas y líneas) - SIN BORRAR ESTÁTICOS
// ============================================================
function cargarDatos() {
  fetch("/admin/rutas/api")
    .then((response) => {
      if (!response.ok) throw new Error("Error al cargar rutas");
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        rutas = data.data || [];
        renderizarRutas(rutas);
        actualizarKPIs(rutas);
        // ACTUALIZAR MAPA PRINCIPAL
        if (!mapaPrincipal) {
          inicializarMapaPrincipal();
        }
        actualizarMapaPrincipal(rutas);
      }
    })
    .catch((error) => {
      console.error("Error al cargar rutas:", error);
      mostrarNotificacion(
        "No se pudieron cargar las rutas del servidor.",
        "warning"
      );
    });

  fetch("/admin/lineas")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        lineas = data.data || [];
        llenarFiltroLineas(lineas);
      }
    })
    .catch((error) => console.error("Error al cargar líneas:", error));
}

// ============================================================
// 10. MAPA PRINCIPAL DE RUTAS
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
  if (container) {
    container.innerHTML = "";
  }
}

function inicializarMapaPrincipal() {
  destruirMapaPrincipal();

  const container = document.getElementById("mapa-rutas-principal");
  if (!container) return;

  container.innerHTML = "";

  mapaPrincipal = L.map("mapa-rutas-principal").setView(
    [10.3447, -67.0400],
    11
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(mapaPrincipal);

  setTimeout(() => {
    if (mapaPrincipal) mapaPrincipal.invalidateSize();
  }, 300);
}

function actualizarMapaPrincipal(rutasData) {
  if (!mapaPrincipal) return;

  // Limpiar controles anteriores
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
      // Ordenar paradas por orden
      const paradasOrdenadas = [...ruta.paradas].sort(
        (a, b) => a.orden - b.orden
      );

      // Convertir coordenadas a latLng
      const waypoints = paradasOrdenadas
        .map((p) => {
          const coords = p.coordenadas ? p.coordenadas.split(",") : [];
          if (coords.length === 2) {
            const lat = parseFloat(coords[0].trim());
            const lng = parseFloat(coords[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
              return L.latLng(lat, lng);
            }
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

        // Marcadores de paradas
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
            `<strong>${parada.nombre}</strong><br>Orden: ${i + 1}<br>Ruta: ${ruta.nombre}`
          );
        });
      }
    }
  });

  const contador = document.getElementById("contadorRutas");
  if (contador) {
    contador.textContent = `${rutasData.length} rutas`;
  }
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
// 10.1 MAPA EN MODAL
// ============================================================

let mapaModal = null;

function inicializarMapaModal() {
  const container = document.getElementById("mapa-rutas-modal");
  if (!container) return;

  if (mapaModal) {
    mapaModal.off();
    mapaModal.remove();
    mapaModal = null;
  }

  container.innerHTML = "";

  mapaModal = L.map("mapa-rutas-modal").setView([10.3447, -67.0400], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(mapaModal);

  setTimeout(() => {
    if (mapaModal) mapaModal.invalidateSize();
  }, 300);
}

function actualizarMapaModal(paradasIds) {
  if (!mapaModal) return;

  mapaModal.eachLayer(function (layer) {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
      mapaModal.removeLayer(layer);
    }
  });

  if (!paradasIds || paradasIds.length === 0) return;

  const coords = [];
  paradasIds.forEach((id) => {
    const parada = window.paradasDisponibles?.find((p) => p.id === id);
    if (parada && parada.coordenadas) {
      const partes = parada.coordenadas.split(",");
      if (partes.length === 2) {
        const lat = parseFloat(partes[0].trim());
        const lng = parseFloat(partes[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          coords.push([lat, lng]);
        }
      }
    }
  });

  if (coords.length === 0) return;

  const bounds = L.latLngBounds(coords);
  mapaModal.fitBounds(bounds, { padding: [30, 30] });

  coords.forEach((coord, i) => {
    L.marker(coord, {
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div style="background: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${i + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(mapaModal);
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
// 10.2 EXPANDIR MAPA
// ============================================================

function toggleExpandirMapa() {
  const mapa = document.getElementById("mapa-rutas-principal");
  const btn = document.getElementById("btnExpandirMapa");
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
// 7. RENDERIZAR TABLA DE RUTAS
// ============================================================
function renderizarRutas(listaRutas) {
  const tbody = document.getElementById("rutasTableBody");
  if (!tbody) return;

  if (listaRutas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-vacia">No hay rutas registradas</td>
      </tr>`;
    return;
  }

  let html = "";
  listaRutas.forEach((ruta) => {
    const idRuta      = ruta.id ?? ruta.id_ruta;
    const statusClass = ruta.status === "activa" ? "status-active" : "status-inactive";
    const statusText  = ruta.status === "activa" ? "Activa" : "Inactiva";

    // El backend devuelve "linea_nombre" directo
    const nombreLinea = ruta.linea_nombre
                     || (ruta.linea ? ruta.linea.nombre : null)
                     || "Sin línea";

    // El backend devuelve "paradas" como array
    const totalParadas = Array.isArray(ruta.paradas) ? ruta.paradas.length : 0;

    html += `
      <tr data-linea-id="${ruta.id_linea}" data-status="${ruta.status}">
        <td><strong>RUTA-${String(idRuta).padStart(3, "0")}</strong></td>
        <td>${ruta.nombre}</td>
        <td>
          <a href="/admin/lineas-page?id=${ruta.id_linea}" class="link-linea" title="Ver línea">
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
          <button class="action-btn view" data-id="${idRuta}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn edit" data-id="${idRuta}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete" data-id="${idRuta}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  asignarEventosRutas();
}

// ============================================================
// 8. ACTUALIZAR KPIs (opcional, no rompe si no existen)
// ============================================================
function actualizarKPIs(listaRutas) {
  const total  = listaRutas.length;
  const activas = listaRutas.filter((r) => r.status === "activa").length;

  // Solo actualiza si el elemento existe
  const elTotal = document.getElementById("totalRutas");
  if (elTotal) elTotal.textContent = total;

  const elActivas = document.getElementById("rutasActivas");
  if (elActivas) elActivas.textContent = activas;

  // Contador del mapa (sí existe en tu HTML)
  const elContador = document.getElementById("contadorRutas");
  if (elContador) elContador.textContent = `${total} rutas`;
}

// ============================================================
// 9. LLENAR FILTRO DE LÍNEAS
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


// ============================================================
// 11. ASIGNAR EVENTOS A BOTONES DE LAS TARJETAS
// ============================================================
function asignarEventosRutas() {
  document.querySelectorAll(".action-btn.view").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      alert(`Ver detalle de ruta ID: ${id} (en desarrollo)`);
    };
  });

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      alert(`Editar ruta ID: ${id} (en desarrollo)`);
    };
  });

  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      eliminarRuta(id);
    };
  });
}

function handleVerDetalle(e) {
  e.stopPropagation();
  const id = this.getAttribute("data-id");
  // Aquí puedes abrir un modal de detalle o redirigir
  alert(`Ver detalle de ruta ID: ${id} (en desarrollo)`);
}

// ============================================================
// 12. FILTROS Y BÚSQUEDA
// ============================================================
function aplicarFiltros() {
  const searchTerm  = document.getElementById("searchRuta")?.value?.toLowerCase() || "";
  const filterLinea = document.getElementById("filterLinea")?.value || "";
  const filterEstado= document.getElementById("filterEstado")?.value || "";

  document.querySelectorAll("#rutasTableBody tr").forEach((tr) => {
    const nombre = tr.querySelector("td:nth-child(2)")?.textContent?.toLowerCase() || "";
    const lineaId = tr.getAttribute("data-linea-id");
    const estado  = tr.getAttribute("data-status");

    let visible = true;
    if (searchTerm && !nombre.includes(searchTerm)) visible = false;
    if (filterLinea && lineaId !== filterLinea) visible = false;
    if (filterEstado && estado !== filterEstado) visible = false;
    tr.style.display = visible ? "" : "none";
  });
}

// ============================================================
// 13. INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  // INICIALIZAR MAPA PRINCIPAL
  inicializarMapaPrincipal();

  // Boton expandir mapa
  const btnExpandir = document.getElementById("btnExpandirMapa");
  if (btnExpandir) {
    btnExpandir.addEventListener("click", toggleExpandirMapa);
  }

  // Boton "Nueva Ruta"
  const nuevaRutaBtn = document.getElementById("nuevaRutaBtn");
  if (nuevaRutaBtn) {
    nuevaRutaBtn.onclick = function () {
      editandoIdRuta = null;
      abrirModalRuta();
    };
  }

  // Formulario (submit)
  const form = document.getElementById("formNuevaRuta");
  if (form) {
    form.onsubmit = guardarRuta;
  }

  // Cerrar modal al hacer clic fuera
  window.onclick = function (event) {
    const modal = document.getElementById("modalNuevaRuta");
    if (event.target === modal) {
      cerrarModalRuta();
    }
  };

  // Cerrar con Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("modalNuevaRuta");
      if (modal.classList.contains("show")) {
        cerrarModalRuta();
      }
    }
  });

  // Eventos de filtros
  document
    .getElementById("searchRuta")
    ?.addEventListener("input", aplicarFiltros);
  document
    .getElementById("filterLinea")
    ?.addEventListener("change", aplicarFiltros);
  document
    .getElementById("filterEstado")
    ?.addEventListener("change", aplicarFiltros);

  // Cargar datos iniciales
  cargarDatos();
});
