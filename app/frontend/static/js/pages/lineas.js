// frontend/static/js/pages/lineas.js

let editandoId = null;
let loading = false;
let presidentes = [];
let secretarios = [];
let todasLasLineas = [];
let lineasFiltradas = [];
let paginaActual = 1;
const itemsPorPagina = 10;
let idLineaViendo = null;

// ========== HELPERS ==========
function mostrarNotificacion(mensaje, tipo = "success") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
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

// ========== SELECCIÓN DE COLOR ==========
function seleccionarColor(hexColor) {
  const hex = (hexColor || "").toUpperCase();
  const inputColor = document.getElementById("color_linea");
  const colorHexText = document.getElementById("colorHex");
  const customPicker = document.getElementById("customColorPicker");

  if (inputColor) inputColor.value = hex;
  if (colorHexText) colorHexText.textContent = hex;
  if (customPicker) customPicker.value = hex;

  document.querySelectorAll(".color-swatch").forEach((swatch) => {
    if (swatch.dataset.color && swatch.dataset.color.toUpperCase() === hex) {
      swatch.classList.add("active");
    } else {
      swatch.classList.remove("active");
    }
  });
}

// ========== CARGAR SELECTORES ==========
async function cargarSelectores() {
  try {
    const responsePres = await fetch("/admin/personas/select", { credentials: "include" });
    const dataPres = await responsePres.json();
    presidentes = dataPres.data || [];

    const responseSec = await fetch("/admin/secretarios/select", { credentials: "include" });
    const dataSec = await responseSec.json();
    secretarios = dataSec.data || [];

    const selectPres = document.getElementById("presidente_id");
    if (selectPres) {
      selectPres.innerHTML = '<option value="">Seleccione un presidente...</option>';
      presidentes.forEach((p) => {
        if (p.rol === "presidente") {
          const option = document.createElement("option");
          option.value = p.id;
          option.textContent = `${p.nombre} - ${p.cedula || ""}`;
          selectPres.appendChild(option);
        }
      });
    }

    const selectSec = document.getElementById("secretario_id");
    if (selectSec) {
      selectSec.innerHTML = '<option value="">Seleccione un secretario (opcional)...</option>';
      secretarios.forEach((s) => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = `${s.nombre} ${s.apellido || ""}`.trim();
        selectSec.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error al cargar selectores:", error);
    mostrarNotificacion("Error al cargar presidentes y secretarios", "danger");
  }
}

// ========== MODAL NUEVA/EDITAR ==========
function abrirModal(titulo, data = null) {
  const modal = document.getElementById("lineaModal");
  if (!modal) return;

  document.getElementById("modalTitle").textContent = titulo;
  document.getElementById("lineaForm").reset();

  const selectPres = document.getElementById("presidente_id");
  const selectSec = document.getElementById("secretario_id");
  if (selectPres) selectPres.value = "";
  if (selectSec) selectSec.value = "";

  const colorInicial = data && data.color ? data.color : "#74A9D3";
  seleccionarColor(colorInicial);

  if (data) {
    document.getElementById("nombre").value = data.nombre || "";
    document.getElementById("rif").value = data.rif || "";
    if (selectPres) selectPres.value = data.presidente_id || "";
    if (selectSec) selectSec.value = data.secretario_id || "";
  }

  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  const btnGuardar = document.getElementById("btnGuardar");
  if (btnGuardar) btnGuardar.disabled = false;

  setTimeout(() => {
    const inputNombre = document.getElementById("nombre");
    if (inputNombre) inputNombre.focus();
  }, 100);
}

function cerrarModal() {
  const modal = document.getElementById("lineaModal");
  if (modal) modal.classList.remove("show");
  document.body.style.overflow = "";
  editandoId = null;
  const btnGuardar = document.getElementById("btnGuardar");
  if (btnGuardar) btnGuardar.disabled = false;
}

// ========== CARGAR DATOS ==========
async function cargarLineas() {
  const tbody = document.getElementById("lineasTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-cargando">
          <i class="fas fa-spinner fa-spin"></i> Cargando...
        </td>
      </tr>`;
  }

  try {
    const response = await fetch("/admin/lineas", { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    todasLasLineas = data.data || [];
    lineasFiltradas = [...todasLasLineas];
    paginaActual = 1;
    renderizarPagina();
  } catch (error) {
    console.error("Error al cargar líneas:", error);
    mostrarNotificacion("Error al cargar líneas", "danger");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="tabla-vacia">Error al cargar datos</td>
        </tr>`;
    }
  }
}

// ========== RENDERIZAR PÁGINA ==========
function renderizarPagina() {
  const tbody = document.getElementById("lineasTableBody");
  if (!tbody) return;

  if (lineasFiltradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-vacia">No hay líneas que coincidan</td>
      </tr>`;
    actualizarControlesPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const pagina = lineasFiltradas.slice(inicio, fin);

  tbody.innerHTML = "";
  pagina.forEach((linea) => {
    const suspendida = linea.suspendido === true;
    const statusClass = suspendida ? "status-inactive" : "status-active";
    const statusText = suspendida ? "Suspendida" : "Activa";
    const color = linea.color || "#74A9D3";

    const tr = document.createElement("tr");
    tr.setAttribute("data-status", suspendida ? "suspendida" : "activa");
    tr.innerHTML = `
      <td><strong>LÍNEA-${String(linea.id).padStart(3, "0")}</strong></td>
      <td>${linea.nombre}</td>
      <td>${linea.presidente || "-"}</td>
      <td>${linea.secretario_nombre || "-"}</td>
      <td>
        <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px #cbd5e1;"></span>
      </td>
      <td class="action-buttons">
        <button class="action-btn view" data-id="${linea.id}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" data-id="${linea.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" data-id="${linea.id}" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  asignarEventosTabla();
  actualizarControlesPaginacion(lineasFiltradas.length);
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

// ========== EVENTOS DE LA TABLA ==========
function asignarEventosTabla() {
  document.querySelectorAll(".action-btn.view").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      verLinea(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      editarLinea(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      eliminarLinea(this.getAttribute("data-id"));
    };
  });
}

// ========== VER LÍNEA ==========
async function verLinea(id) {
  try {
    const resp = await fetch(`/admin/lineas/${id}`, { credentials: "include" });
    const result = await resp.json();
    if (!result.success) {
      mostrarNotificacion(result.message || "Línea no encontrada", "danger");
      return;
    }
    const linea = result.data;
    idLineaViendo = id;

    const suspendida = linea.suspendido === true;
    const statusText = suspendida ? "Suspendida" : "Activa";
    const color = linea.color || "#74A9D3";

    document.getElementById("verLineaId").textContent = `LÍNEA-${String(linea.id).padStart(3, "0")}`;
    document.getElementById("verLineaNombre").textContent = linea.nombre || "-";
    document.getElementById("verLineaRif").textContent = linea.rif || "-";
    document.getElementById("verLineaPresidente").textContent =
      linea.presidente?.nombre || linea.presidente || "-";
    document.getElementById("verLineaSecretario").textContent =
      linea.secretario_nombre || "-";
    document.getElementById("verLineaColor").textContent = color;

    let fechaCreacion = "No disponible";
    if (linea.created_at) {
      const d = new Date(linea.created_at);
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
    document.getElementById("verLineaFecha").textContent = fechaCreacion;

    document.getElementById("verLineaEstado").textContent = statusText;
    const badge = document.getElementById("verLineaEstadoBadge");
    badge.className = "status-badge";
    badge.classList.add(suspendida ? "status-inactive" : "status-active");

    const icono = document.getElementById("verLineaIcono");
    if (icono) icono.style.background = color;

    document.getElementById("modalVerLinea").classList.add("show");
  } catch (error) {
    console.error("Error al ver línea:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

function cerrarModalVerLinea() {
  document.getElementById("modalVerLinea").classList.remove("show");
  idLineaViendo = null;
}

function editarDesdeVerLinea() {
  const id = idLineaViendo;
  cerrarModalVerLinea();
  if (id) editarLinea(id);
}

// ========== EDITAR LÍNEA ==========
async function editarLinea(id) {
  try {
    const response = await fetch(`/admin/lineas/${id}`, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.data) throw new Error("Datos inválidos");

    const linea = data.data;
    editandoId = id;

    await cargarSelectores();
    abrirModal("Editar Línea", {
      nombre: linea.nombre || "",
      rif: linea.rif || "",
      presidente_id: linea.presidente_id || "",
      secretario_id: linea.secretario_id || "",
      color: linea.color || "#74A9D3",
    });
  } catch (error) {
    console.error("Error al cargar línea:", error);
    mostrarNotificacion("Error al cargar la línea", "danger");
  }
}

// ========== ELIMINAR LÍNEA ==========
async function eliminarLinea(id) {
  if (!confirm("¿Estás seguro de eliminar/suspender esta línea?")) return;

  try {
    const csrfToken = getCookie("csrf_access_token");
    const response = await fetch(`/admin/lineas/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRF-TOKEN": csrfToken },
    });
    const data = await response.json();

    if (response.ok && data.success) {
      mostrarNotificacion("Línea eliminada exitosamente", "success");
      cargarLineas();
    } else {
      mostrarNotificacion(
        data.error || data.message || "No se puede eliminar la línea",
        "danger"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

// ========== FILTROS ==========
function aplicarFiltros() {
  const searchTerm = document.getElementById("searchLinea")?.value?.toLowerCase() || "";
  const filterEstado = document.getElementById("filterEstado")?.value || "";

  lineasFiltradas = todasLasLineas.filter((linea) => {
    const nombre = (linea.nombre || "").toLowerCase();
    const rif = (linea.rif || "").toLowerCase();
    const suspendida = linea.suspendido === true;
    const estado = suspendida ? "suspendida" : "activa";

    if (searchTerm && !nombre.includes(searchTerm) && !rif.includes(searchTerm)) return false;
    if (filterEstado && estado !== filterEstado) return false;
    return true;
  });

  paginaActual = 1;
  renderizarPagina();
}

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", async () => {
  // Paleta de colores
  const paletteContainer = document.getElementById("colorPalette");
  if (paletteContainer) {
    paletteContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".color-swatch");
      if (button && button.dataset.color) seleccionarColor(button.dataset.color);
    });
  }

  const customColorPicker = document.getElementById("customColorPicker");
  if (customColorPicker) {
    customColorPicker.addEventListener("input", function () {
      seleccionarColor(this.value);
    });
  }

  await cargarSelectores();

  // Form submit
  const formLinea = document.getElementById("lineaForm");
  if (formLinea) {
    formLinea.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loading) return;

      const btnGuardar = document.getElementById("btnGuardar");
      loading = true;
      if (btnGuardar) btnGuardar.disabled = true;

      const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        rif: document.getElementById("rif").value.trim(),
        presidente_id: parseInt(document.getElementById("presidente_id").value),
        secretario_id: document.getElementById("secretario_id").value
          ? parseInt(document.getElementById("secretario_id").value)
          : null,
        color: document.getElementById("color_linea").value,
      };

      if (!datos.nombre) { mostrarNotificacion("El nombre es obligatorio", "warning"); loading = false; if (btnGuardar) btnGuardar.disabled = false; return; }
      if (!datos.rif) { mostrarNotificacion("El RIF es obligatorio", "warning"); loading = false; if (btnGuardar) btnGuardar.disabled = false; return; }
      if (!datos.presidente_id) { mostrarNotificacion("Debes seleccionar un presidente", "warning"); loading = false; if (btnGuardar) btnGuardar.disabled = false; return; }

      const url = editandoId ? `/admin/lineas/${editandoId}` : "/admin/lineas";
      const method = editandoId ? "PUT" : "POST";
      const csrfToken = getCookie("csrf_access_token");

      try {
        const response = await fetch(url, {
          method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();
        if (response.ok && data.success !== false) {
          mostrarNotificacion(
            editandoId ? "Línea actualizada" : "Línea creada exitosamente",
            "success"
          );
          cerrarModal();
          cargarLineas();
        } else {
          mostrarNotificacion(data.error || data.message || "Error al guardar", "danger");
        }
      } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
      } finally {
        loading = false;
        if (btnGuardar) btnGuardar.disabled = false;
      }
    });
  }

  // Botón nueva línea
  const btnNueva = document.getElementById("btnNuevaLinea");
  if (btnNueva) {
    btnNueva.onclick = async () => {
      editandoId = null;
      await cargarSelectores();
      abrirModal("Nueva Línea");
    };
  }

  // Cerrar modales con click fuera
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("lineaModal");
    if (event.target === modal) cerrarModal();

    const modalVer = document.getElementById("modalVerLinea");
    if (event.target === modalVer) cerrarModalVerLinea();
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("lineaModal");
      if (modal && modal.classList.contains("show")) cerrarModal();

      const modalVer = document.getElementById("modalVerLinea");
      if (modalVer && modalVer.classList.contains("show")) cerrarModalVerLinea();
    }
  });

  // Paginación
  document.getElementById("btnAnterior")?.addEventListener("click", () => {
    if (paginaActual > 1) { paginaActual--; renderizarPagina(); }
  });
  document.getElementById("btnSiguiente")?.addEventListener("click", () => {
    const totalPaginas = Math.max(1, Math.ceil(lineasFiltradas.length / itemsPorPagina));
    if (paginaActual < totalPaginas) { paginaActual++; renderizarPagina(); }
  });

  // Filtros
  document.getElementById("searchLinea")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filterEstado")?.addEventListener("change", aplicarFiltros);

  cargarLineas();
});