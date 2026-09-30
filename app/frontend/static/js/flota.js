// ============================================================
// FLOTA (Buses) - Lógica completa
// ============================================================

let editandoIdUnidad = null;
let loadingUnidad = false;
let paginaActual = 1;
const itemsPorPagina = 10;
let todosLosBuses = [];
let busesFiltrados = [];

// ============================================================
// 1. NOTIFICACIONES
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
    return;
  }
  if (tipo === "success") alert("" + mensaje);
  else if (tipo === "warning") alert(" " + mensaje);
  else if (tipo === "danger") alert("" + mensaje);
  else alert("" + mensaje);
}

// ============================================================
// 3. MODAL
// ============================================================
async function abrirModalUnidad(titulo = "Nueva Unidad") {
  const modal = document.getElementById("modalNuevaUnidad");
  document.getElementById("formNuevaUnidad").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

  const titleEl = document.getElementById("modalUnidadTitle");
  if (titleEl) titleEl.textContent = titulo;

  await cargarSelectsModal();
  modal.classList.add("show");
  document.getElementById("guardarUnidadBtn").disabled = false;
}

function cerrarModalUnidad() {
  const modal = document.getElementById("modalNuevaUnidad");
  modal.classList.remove("show");
  editandoIdUnidad = null;
  document.getElementById("guardarUnidadBtn").disabled = false;
  document.getElementById("formNuevaUnidad").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}

// ============================================================
// 4. CARGAR DATOS DESDE EL BACKEND
// ============================================================
async function cargarBuses() {
  const tbody = document.getElementById("unidadesTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="tabla-cargando">
          <i class="fas fa-spinner fa-spin"></i> Cargando...
        </td>
      </tr>`;
  }

  try {
    const response = await fetch("/admin/buses");
    const data = await response.json();
    todosLosBuses = data.success && Array.isArray(data.data) ? data.data : [];
    busesFiltrados = [...todosLosBuses]; 
    paginaActual = 1;
    renderizarPagina();   
  } catch (error) {
    console.error("Error al cargar buses:", error);
    mostrarNotificacion("No se pudieron cargar los datos del servidor.", "warning");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="tabla-vacia">Error al cargar datos</td>
        </tr>`;
    }
  }
}

// ============================================================
// 4.1 RENDERIZAR PÁGINA ACTUAL
// ============================================================
function renderizarPagina() {
  const tbody = document.getElementById("unidadesTableBody");
  if (!tbody) return;

  // Si no hay buses (ni filtrados ni totales)
  if (busesFiltrados.length === 0) {
    const mensaje = todosLosBuses.length === 0
      ? "No hay buses registrados"
      : "No hay buses que coincidan con el filtro";
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="tabla-vacia">${mensaje}</td>
      </tr>`;
    actualizarControlesPaginacion(0);
    return;
  }

  // Calcular rango SOBRE busesFiltrados
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin    = inicio + itemsPorPagina;
  const pagina = busesFiltrados.slice(inicio, fin);   

  // Pintar filas
  tbody.innerHTML = "";
  pagina.forEach((bus) => {
    const nombreLinea = bus.linea ? bus.linea.nombre : "Sin línea";
    const nombreRuta  = bus.ruta  ? bus.ruta.nombre  : "Sin ruta";

    let statusClass = "status-active";
    let statusText  = "Activo";
    if (bus.status === "inactiva") {
      statusClass = "status-inactive";
      statusText  = "Inactivo";
    } else if (bus.status === "en_servicio") {
      statusClass = "status-warning";
      statusText  = "En servicio";
    }

    const tr = document.createElement("tr");
    tr.setAttribute("data-linea-id", bus.id_linea);
    tr.setAttribute("data-status", bus.status);
    tr.innerHTML = `
      <td><strong>BUS-${String(bus.id_vehiculo).padStart(3, "0")}</strong></td>
      <td>${bus.placa}</td>
      <td>${nombreLinea} / ${nombreRuta}</td>
      <td>
        <span class="status-badge ${statusClass}">
          <i class="fas fa-circle"></i> ${statusText}
        </span>
      </td>
      <td class="action-buttons">
        <button class="action-btn view" data-id="${bus.id_vehiculo}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" data-id="${bus.id_vehiculo}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" data-id="${bus.id_vehiculo}">
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
// 4.2 CONTROLES DE PAGINACIÓN
// ============================================================
function actualizarControlesPaginacion(totalItems) {
  const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));

  const info     = document.getElementById("infoPagina");
  const btnPrev  = document.getElementById("btnAnterior");
  const btnNext  = document.getElementById("btnSiguiente");

  if (info)    info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
}

// ============================================================
// 5. CARGAR SELECTS DEL MODAL
// ============================================================
async function cargarSelectsModal() {
  try {
    // Líneas
    const respLineas = await fetch("/admin/lineas");
    const dataLineas = await respLineas.json();
    if (dataLineas.success) {
      const select = document.getElementById("id_linea");
      if (select) {
        select.innerHTML = '<option value="">Seleccione una línea...</option>';
        dataLineas.data.forEach((linea) => {
          const opt = document.createElement("option");
          opt.value = linea.id;
          opt.textContent = linea.nombre;
          select.appendChild(opt);
        });
      }
    }
    // Rutas
    const respRutas = await fetch("/admin/rutas/api");
    const dataRutas = await respRutas.json();
    if (dataRutas.success) {
      const select = document.getElementById("id_ruta");
      if (select) {
        select.innerHTML = '<option value="">Sin ruta asignada</option>';
        dataRutas.data.forEach((ruta) => {
          const opt = document.createElement("option");
          opt.value = ruta.id ?? ruta.id_ruta;
          opt.textContent = ruta.nombre;
          select.appendChild(opt);
        });
      }
    }
  } catch (error) {
    console.error("Error al cargar selects:", error);
  }
}

// ============================================================
// 6. GUARDAR (POST o PUT)
// ============================================================
async function guardarNuevaUnidad(e) {
  if (e) e.preventDefault();
  if (loadingUnidad) return;

  const form = document.getElementById("formNuevaUnidad");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (!data.id_ruta)   delete data.id_ruta;
  if (!data.ubicacion) delete data.ubicacion;

  let valid = true;
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

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
    const esEdicion = editandoIdUnidad !== null;
    const url = esEdicion
      ? `/admin/buses/${editandoIdUnidad}`
      : `/admin/save-bus`;
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
        esEdicion ? "Unidad actualizada exitosamente" : "Unidad creada exitosamente",
        "success"
      );
      cerrarModalUnidad();
      cargarBuses();
    } else {
      mostrarNotificacion(result.message || "Error al guardar la unidad", "danger");
    }
  } catch (error) {
    console.error("Error al guardar unidad:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  } finally {
    loadingUnidad = false;
    document.getElementById("guardarUnidadBtn").disabled = false;
  }
}

// ============================================================
// 7. ELIMINAR
// ============================================================
async function eliminarUnidad(id) {
  if (!confirm(`¿Está seguro de eliminar la unidad ID: ${id}?`)) return;

  try {
    const csrfToken = getCookie("csrf_access_token");
    const response = await fetch(`/admin/buses/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRF-TOKEN": csrfToken },
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
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

// ============================================================
// 8. VER
// ============================================================
async function verUnidad(id) {
  try {
    const resp = await fetch(`/admin/buses/${id}`);
    const result = await resp.json();
    if (!result.success) {
      mostrarNotificacion(result.message || "Bus no encontrado", "danger");
      return;
    }
    const bus = result.data;

    const nombreLinea      = bus.linea ? bus.linea.nombre : "Sin línea";
    const colorLinea       = bus.linea?.color || "#74A9D3";
    const nombreSecretario = bus.linea?.secretario_nombre || "Sin secretario";
    const nombreRuta       = bus.ruta ? bus.ruta.nombre : "Sin ruta";

  // Formatear fecha
  let fechaCreacion = "No disponible";
  if (bus.created_at) {
    const d = new Date(bus.created_at);
    if (!isNaN(d.getTime())) {
      fechaCreacion = new Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    }
  }

    const statusText = bus.status === "activa"
      ? "Activa"
      : bus.status === "inactiva"
        ? "Inactiva"
        : "En servicio";

    // Rellenar modal
    document.getElementById("verBusId").textContent         = `BUS-${String(bus.id_vehiculo).padStart(3, "0")}`;
    document.getElementById("verBusPlaca").textContent      = bus.placa || "-";
    document.getElementById("verBusLinea").textContent      = nombreLinea;
    document.getElementById("verBusLinea").style.color      = colorLinea;
    document.getElementById("verBusRuta").textContent       = nombreRuta;
    document.getElementById("verBusSecretario").textContent = nombreSecretario;
    document.getElementById("verBusEstado").textContent     = statusText;
    document.getElementById("verBusUbicacion").textContent  = bus.ubicacion || "No asignada";
    document.getElementById("verBusFecha").textContent      = fechaCreacion;

        const estadoBadge = document.getElementById("verBusEstadoBadge");
        if (estadoBadge) {
          estadoBadge.className = "status-badge";
          if (bus.status === "activa")         estadoBadge.classList.add("status-active");
          else if (bus.status === "inactiva")  estadoBadge.classList.add("status-inactive");
          else                                  estadoBadge.classList.add("status-warning");
        }
    // Mostrar modal
    document.getElementById("modalVerUnidad").classList.add("show");
  } catch (error) {
    console.error("Error al ver unidad:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

function cerrarModalVerUnidad() {
  document.getElementById("modalVerUnidad").classList.remove("show");
}

// ============================================================
// 9. EDITAR
// ============================================================
async function editarUnidad(id) {
  try {
    const resp = await fetch(`/admin/buses/${id}`);
    const result = await resp.json();
    if (!result.success) {
      mostrarNotificacion(result.message || "Bus no encontrado", "danger");
      return;
    }
    const bus = result.data;

    editandoIdUnidad = id;

    // Abrir modal y ESPERAR a que los selects se carguen
    const modal = document.getElementById("modalNuevaUnidad");
    document.getElementById("formNuevaUnidad").reset();
    document.getElementById("modalUnidadTitle").textContent = "Editar Unidad";
    await cargarSelectsModal();    
    modal.classList.add("show");

    // Ahora sí, rellenar sin setTimeout
    document.getElementById("placa").value      = bus.placa || "";
    document.getElementById("id_linea").value   = bus.id_linea || "";
    document.getElementById("id_ruta").value    = bus.id_ruta || "";
    document.getElementById("status").value     = bus.status || "activa";
    if (document.getElementById("ubicacion")) {
      document.getElementById("ubicacion").value = bus.ubicacion || "";
    }
  } catch (error) {
    console.error("Error al editar unidad:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

// ============================================================
// 10. EVENTOS DE LA TABLA
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
// 11. FILTROS
// ============================================================
async function llenarFiltroLineasFlota() {
  try {
    const resp = await fetch("/admin/lineas");
    const data = await resp.json();
    if (data.success) {
      const select = document.getElementById("filterLinea");
      if (!select) return;
      select.innerHTML = '<option value="">Todas las líneas</option>';
      data.data.forEach((linea) => {
        const opt = document.createElement("option");
        opt.value = linea.id;
        opt.textContent = linea.nombre;
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Error al cargar filtro de líneas:", error);
  }
}

function aplicarFiltros() {
  const searchTerm   = document.getElementById("searchUnidad")?.value?.toLowerCase() || "";
  const filterLinea  = document.getElementById("filterLinea")?.value || "";
  const filterEstado = document.getElementById("filterEstado")?.value || "";

  busesFiltrados = todosLosBuses.filter((bus) => {
    const placa    = (bus.placa || "").toLowerCase();
    const lineaTxt = (bus.linea?.nombre || "").toLowerCase();
    const lineaId  = String(bus.id_linea || "");
    const estado   = bus.status || "";

    if (searchTerm && !placa.includes(searchTerm) && !lineaTxt.includes(searchTerm)) return false;
    if (filterLinea && lineaId !== filterLinea) return false;
    if (filterEstado && estado !== filterEstado) return false;
    return true;
  });

  paginaActual = 1;
  renderizarPagina();
}

// ============================================================
// 12. INICIALIZAR
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  const nuevaUnidadBtn = document.getElementById("nuevaUnidadBtn");
  if (nuevaUnidadBtn) {
    nuevaUnidadBtn.onclick = async function () {
      editandoIdUnidad = null;
      await abrirModalUnidad("Nueva Unidad");
    };
  }

  const form = document.getElementById("formNuevaUnidad");
  if (form) form.onsubmit = guardarNuevaUnidad;

  window.onclick = function (event) {
    const modal = document.getElementById("modalNuevaUnidad");
    if (event.target === modal) cerrarModalUnidad();
  };

  // Cerrar modal de Ver con click fuera
  window.addEventListener("click", function (event) {
    const modalVer = document.getElementById("modalVerUnidad");
    if (event.target === modalVer) cerrarModalVerUnidad();
  });

  // Cerrar modal de Ver con Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modalVer = document.getElementById("modalVerUnidad");
      if (modalVer && modalVer.classList.contains("show")) {
        cerrarModalVerUnidad();
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("modalNuevaUnidad");
      if (modal.classList.contains("show")) cerrarModalUnidad();
    }
  });

  // Paginación
document.getElementById("btnAnterior")?.addEventListener("click", () => {
  if (paginaActual > 1) {
    paginaActual--;
    renderizarPagina();
  }
});

document.getElementById("btnSiguiente")?.addEventListener("click", () => {
  const totalPaginas = Math.max(1, Math.ceil(busesFiltrados.length / itemsPorPagina));
  if (paginaActual < totalPaginas) {
    paginaActual++;
    renderizarPagina();
  }
});

  // Filtros
  document.getElementById("searchUnidad")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filterLinea")?.addEventListener("change", aplicarFiltros);
  document.getElementById("filterEstado")?.addEventListener("change", aplicarFiltros);

  // Cargar datos
  llenarFiltroLineasFlota();
  cargarBuses();
});