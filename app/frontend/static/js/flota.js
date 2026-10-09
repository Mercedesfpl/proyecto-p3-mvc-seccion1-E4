// ============================================================
// FLOTA (Buses) - Logica completa
// ============================================================

let editandoIdUnidad = null;
let loadingUnidad = false;
let paginaActual = 1;
const itemsPorPagina = 10;
let todosLosBuses = [];
let busesFiltrados = [];
let idUnidadViendo = null;

// ============================================================
// 1. NOTIFICACIONES
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
    return;
  }
  if (tipo === "success") alert("OK: " + mensaje);
  else if (tipo === "warning") alert("AVISO: " + mensaje);
  else if (tipo === "danger") alert("ERROR: " + mensaje);
  else alert(mensaje);
}

// ============================================================
// 2. COOKIES
// ============================================================
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

// ============================================================
// 3. ABRIR / CERRAR MODAL CREAR-EDITAR
// ============================================================
function abrirModalUnidad(data = null) {
  const modal = document.getElementById("modalNuevaUnidad");
  const form = document.getElementById("formNuevaUnidad");
  form.reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  if (data) {
    editandoIdUnidad = data.id_vehiculo;
    document.getElementById("placa").value = data.placa || "";
    document.getElementById("id_linea").value = data.id_linea || "";
    document.getElementById("id_ruta").value = data.id_ruta || "";
    document.getElementById("status").value = data.status || "";

    cargarSelectEsp32(data.id_vehiculo).then(() => {
      const selectEsp = document.getElementById("id_esp32");
      if (selectEsp && data.id_esp32) {
        selectEsp.value = data.id_esp32;
      }
    });

    document.querySelector("#modalNuevaUnidad h2").innerHTML =
      '<i class="fas fa-bus"></i> Editar unidad';
  } else {
    editandoIdUnidad = null;
    cargarSelectEsp32(null);
    document.querySelector("#modalNuevaUnidad h2").innerHTML =
      '<i class="fas fa-bus"></i> Nueva unidad';
  }

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
  document.getElementById("guardarUnidadBtn").disabled = false;
}

function cerrarModalUnidad() {
  const modal = document.getElementById("modalNuevaUnidad");
  modal.classList.remove("show");
  document.body.style.overflow = "";
  editandoIdUnidad = null;
  document.getElementById("formNuevaUnidad").reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
}

// ============================================================
// 4. CARGAR TABLA DE BUSES
// ============================================================
async function cargarBuses() {
  const tbody = document.getElementById("unidadesTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="tabla-cargando">
          <i class="fas fa-spinner fa-spin"></i> Cargando...
        </td>
      </tr>`;
  }

  try {
    const response = await fetch("/admin/buses", { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const buses = data.data || [];

    todosLosBuses = buses;
    busesFiltrados = [...todosLosBuses];

    renderizarPagina();
  } catch (error) {
    console.error("Error al cargar buses:", error);
    mostrarNotificacion("Error al cargar las unidades", "danger");
  }
}

// ============================================================
// 5. RENDERIZAR PAGINA ACTUAL (solo codigo, placa, estado)
// ============================================================
function renderizarPagina() {
  const tbody = document.getElementById("unidadesTableBody");
  if (!tbody) return;

  if (busesFiltrados.length === 0) {
    const mensaje =
      todosLosBuses.length === 0
        ? "No hay buses registrados"
        : "No hay buses que coincidan con el filtro";
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="tabla-vacia">${mensaje}</td>
      </tr>`;
    actualizarControlesPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const pagina = busesFiltrados.slice(inicio, fin);

  tbody.innerHTML = "";

  pagina.forEach((bus) => {
    let statusClass = "status-active";
    let statusText = "Activo";
    if (bus.status === "inactiva") {
      statusClass = "status-inactive";
      statusText = "Inactivo";
    }

    const tr = document.createElement("tr");
    tr.setAttribute("data-linea-id", bus.id_linea);
    tr.setAttribute("data-status", bus.status);
    tr.innerHTML = `
      <td><strong>BUS-${String(bus.id_vehiculo).padStart(3, "0")}</strong></td>
      <td>${bus.placa}</td>
      <td>
        <span class="status-badge ${statusClass}">
          <i class="fas fa-circle"></i> ${statusText}
        </span>
      </td>
      <td class="action-buttons">
        <button class="action-btn view" data-id="${bus.id_vehiculo}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" data-id="${bus.id_vehiculo}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" data-id="${bus.id_vehiculo}" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  asignarEventosTabla();
  actualizarControlesPaginacion(busesFiltrados.length);
}

// ============================================================
// 6. CONTROLES DE PAGINACION
// ============================================================
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
// 7. CARGAR SELECTS DEL MODAL
// ============================================================
async function cargarSelectsModal() {
  try {
    // Lineas
    const respLineas = await fetch("/admin/lineas", { credentials: "include" });
    const dataLineas = await respLineas.json();
    const selectLinea = document.getElementById("id_linea");
    if (selectLinea) {
      selectLinea.innerHTML = '<option value="">Seleccione una linea...</option>';
      (dataLineas.data || []).forEach((linea) => {
        const opt = document.createElement("option");
        opt.value = linea.id;
        opt.textContent = linea.nombre;
        selectLinea.appendChild(opt);
      });
    }

    // Rutas
    const respRutas = await fetch("/admin/rutas/api", {
      credentials: "include",
    });
    const dataRutas = await respRutas.json();
    const selectRuta = document.getElementById("id_ruta");
    if (selectRuta) {
      selectRuta.innerHTML = '<option value="">Sin ruta asignada...</option>';
      (dataRutas.data || []).forEach((ruta) => {
        const opt = document.createElement("option");
        opt.value = ruta.id_ruta || ruta.id;
        opt.textContent = ruta.nombre;
        selectRuta.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Error al cargar selects:", error);
  }
}

// ============================================================
// 8. CARGAR SELECT DE ESP32
// ============================================================
async function cargarSelectEsp32(idBusActual = null) {
  try {
    let url = "/admin/esp32/disponibles-para-bus";
    if (idBusActual) {
      url += `?id_bus=${idBusActual}`;
    }
    const resp = await fetch(url, { credentials: "include" });
    const data = await resp.json();
    const select = document.getElementById("id_esp32");
    if (!select) return;

    select.innerHTML = '<option value="">Sin ESP32 asignado</option>';
    (data.data || []).forEach((esp32) => {
      const opt = document.createElement("option");
      opt.value = esp32.id_esp32;
      const version = esp32.version_firmware || "sin version";
      opt.textContent = `${esp32.mac} (${version})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error al cargar ESP32:", error);
  }
}

// ============================================================
// 9. GUARDAR (POST o PUT)
// ============================================================
async function guardarNuevaUnidad(e) {
  if (e) e.preventDefault();
  if (loadingUnidad) return;

  const form = document.getElementById("formNuevaUnidad");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (!data.id_ruta) delete data.id_ruta;

  const idEsp32Value = document.getElementById("id_esp32")?.value;
  if (idEsp32Value) {
    data.id_esp32 = parseInt(idEsp32Value);
  } else {
    data.id_esp32 = null;
  }

  let valid = true;
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  if (data.placa) data.placa = data.placa.trim().toUpperCase();
  if (!data.placa) {
    document.getElementById("placa").classList.add("is-invalid");
    valid = false;
  }
  if (!data.id_linea) {
    document.getElementById("id_linea").classList.add("is-invalid");
    valid = false;
  }
  if (!valid) {
    mostrarNotificacion("Complete los campos obligatorios (*)", "warning");
    return;
  }

  loadingUnidad = true;
  document.getElementById("guardarUnidadBtn").disabled = true;

  try {
    const csrfToken = getCookie("csrf_access_token");
    const url = editandoIdUnidad
      ? `/admin/buses/${editandoIdUnidad}`
      : "/admin/save-bus";
    const method = editandoIdUnidad ? "PUT" : "POST";

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
        editandoIdUnidad ? "Unidad actualizada" : "Unidad creada exitosamente",
        "success"
      );
      cerrarModalUnidad();
      cargarBuses();
    } else {
      mostrarNotificacion(
        result.message || result.error || "Error al guardar la unidad",
        "danger"
      );
    }
  } catch (error) {
    console.error("Error al guardar unidad:", error);
    mostrarNotificacion("Error de conexion al servidor", "danger");
  } finally {
    loadingUnidad = false;
    document.getElementById("guardarUnidadBtn").disabled = false;
  }
}

// ============================================================
// 10. EDITAR UNIDAD
// ============================================================
async function editarUnidad(id) {
  try {
    const response = await fetch(`/admin/buses/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.data) throw new Error("Datos invalidos");

    await cargarSelectsModal();
    abrirModalUnidad(data.data);
  } catch (error) {
    console.error("Error al cargar la unidad:", error);
    mostrarNotificacion("Error al cargar la unidad", "danger");
  }
}

// ============================================================
// 11. ELIMINAR UNIDAD (DELETE)
// ============================================================
async function eliminarUnidad(id) {
  if (!confirm(`Esta seguro de eliminar la unidad ID: ${id}?`)) return;

  try {
    const csrfToken = getCookie("csrf_access_token");
    const response = await fetch(`/admin/buses/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
    });
    const result = await response.json();

    if (response.ok && result.success) {
      mostrarNotificacion("Unidad eliminada exitosamente", "success");
      cargarBuses();
    } else {
      mostrarNotificacion(result.message || "Error al eliminar", "danger");
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
    mostrarNotificacion("Error de conexion al servidor", "danger");
  }
}

// ============================================================
// 12. VER UNIDAD (modal con toda la info)
// ============================================================
async function verUnidad(id) {
  try {
    const resp = await fetch(`/admin/buses/${id}`, { credentials: "include" });
    const result = await resp.json();
    if (!result.success && !result.data) {
      mostrarNotificacion(result.error || "Unidad no encontrada", "danger");
      return;
    }
    const bus = result.data;
    idUnidadViendo = id;

    // Codigo
    document.getElementById("verUnidadId").textContent =
      `BUS-${String(bus.id_vehiculo).padStart(3, "0")}`;

    // Estado
    const inactiva = bus.status === "inactiva";
    const statusText = inactiva ? "Inactivo" : "Activo";
    const badge = document.getElementById("verUnidadEstadoBadge");
    document.getElementById("verUnidadEstado").textContent = statusText;
    badge.className = "status-badge";
    badge.classList.add(inactiva ? "status-inactive" : "status-active");

    // Icono
    const icono = document.getElementById("verUnidadIcono");
    if (icono) icono.style.background = "#74A9D3";

    // Info
    document.getElementById("verUnidadPlaca").textContent = bus.placa || "-";
    document.getElementById("verUnidadLinea").textContent = bus.linea_nombre || "Sin linea";
    document.getElementById("verUnidadRuta").textContent = bus.ruta_nombre || "Sin ruta";
    document.getElementById("verUnidadSecretario").textContent = bus.secretario_nombre || "Sin secretario";

    // ESP32
    if (bus.esp32_mac) {
      document.getElementById("verUnidadEsp32").innerHTML =
        `<span class="badge-esp32"><i class="fas fa-microchip"></i> ${bus.esp32_mac}</span>`;
    } else {
      document.getElementById("verUnidadEsp32").innerHTML =
        '<span class="badge-sin-esp32">Sin ESP32</span>';
    }

    document.getElementById("verUnidadFirmware").textContent = bus.esp32_version || "-";

    // Fecha
    let fecha = "No disponible";
    if (bus.created_at) {
      const d = new Date(bus.created_at);
      if (!isNaN(d.getTime())) {
        fecha = new Intl.DateTimeFormat("es-VE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(d);
      }
    }
    document.getElementById("verUnidadFecha").textContent = fecha;

    document.getElementById("modalVerUnidad").classList.add("show");
  } catch (error) {
    console.error("Error al ver unidad:", error);
    mostrarNotificacion("Error de conexion al servidor", "danger");
  }
}

function cerrarModalVerUnidad() {
  document.getElementById("modalVerUnidad").classList.remove("show");
  idUnidadViendo = null;
}

function editarDesdeVerUnidad() {
  const id = idUnidadViendo;
  cerrarModalVerUnidad();
  if (id) editarUnidad(id);
}

// ============================================================
// 13. ASIGNAR EVENTOS A BOTONES DE LA TABLA
// ============================================================
function asignarEventosTabla() {
  document.querySelectorAll(".action-btn.view").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      verUnidad(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      editarUnidad(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      eliminarUnidad(this.getAttribute("data-id"));
    };
  });
}

// ============================================================
// 14. FILTROS
// ============================================================
async function llenarFiltroLineasFlota() {
  try {
    const resp = await fetch("/admin/lineas");
    const data = await resp.json();
    if (data.success) {
      const select = document.getElementById("filterLinea");
      if (!select) return;
      select.innerHTML = '<option value="">Todas las lineas</option>';
      data.data.forEach((linea) => {
        const opt = document.createElement("option");
        opt.value = linea.id;
        opt.textContent = linea.nombre;
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Error al cargar filtro de lineas:", error);
  }
}

function aplicarFiltros() {
  const searchTerm =
    document.getElementById("searchUnidad")?.value?.toLowerCase() || "";
  const filterLinea = document.getElementById("filterLinea")?.value || "";
  const filterEstado = document.getElementById("filterEstado")?.value || "";

  busesFiltrados = todosLosBuses.filter((bus) => {
    const placa = (bus.placa || "").toLowerCase();
    const lineaTxt = (bus.linea_nombre || "").toLowerCase();
    const lineaId = String(bus.id_linea || "");
    const estado = bus.status || "";

    if (
      searchTerm &&
      !placa.includes(searchTerm) &&
      !lineaTxt.includes(searchTerm)
    )
      return false;
    if (filterLinea && lineaId !== filterLinea) return false;
    if (filterEstado && estado !== filterEstado) return false;
    return true;
  });

  paginaActual = 1;
  renderizarPagina();
}

// ============================================================
// 15. INICIALIZAR
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  cargarSelectsModal();
  cargarBuses();

  const nuevaUnidadBtn = document.getElementById("nuevaUnidadBtn");
  if (nuevaUnidadBtn) {
    nuevaUnidadBtn.onclick = async function () {
      editandoIdUnidad = null;
      await cargarSelectsModal();
      abrirModalUnidad(null);
    };
  }

  const form = document.getElementById("formNuevaUnidad");
  if (form) form.onsubmit = guardarNuevaUnidad;

  // Cerrar modales con click fuera
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("modalNuevaUnidad");
    if (event.target === modal) cerrarModalUnidad();

    const modalVer = document.getElementById("modalVerUnidad");
    if (event.target === modalVer) cerrarModalVerUnidad();
  });

  // Cerrar con Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("modalNuevaUnidad");
      if (modal && modal.classList.contains("show")) cerrarModalUnidad();

      const modalVer = document.getElementById("modalVerUnidad");
      if (modalVer && modalVer.classList.contains("show")) cerrarModalVerUnidad();
    }
  });

  // Paginacion
  document.getElementById("btnAnterior")?.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      renderizarPagina();
    }
  });

  document.getElementById("btnSiguiente")?.addEventListener("click", () => {
    const totalPaginas = Math.max(
      1,
      Math.ceil(busesFiltrados.length / itemsPorPagina)
    );
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderizarPagina();
    }
  });

  // Filtros
  document
    .getElementById("searchUnidad")
    ?.addEventListener("input", aplicarFiltros);
  document
    .getElementById("filterLinea")
    ?.addEventListener("change", aplicarFiltros);
  document
    .getElementById("filterEstado")
    ?.addEventListener("change", aplicarFiltros);

  llenarFiltroLineasFlota();
});