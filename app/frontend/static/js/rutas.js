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
  modal.classList.add("show");
  document.getElementById("guardarRutaBtn").disabled = false;
}

function cerrarModalRuta() {
  const modal = document.getElementById("modalNuevaRuta");
  modal.classList.remove("show");
  editandoIdRuta = null;
  document.getElementById("guardarRutaBtn").disabled = false;
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
        opt.value = linea.id_linea;
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

  try {
    const response = await fetch("/admin/rutas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  // Obtener rutas (usando el endpoint correcto)
  fetch("/admin/rutas/api")
    .then((response) => {
      if (!response.ok) throw new Error("Error al cargar rutas");
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        const lista = data.data || [];
        // Solo renderizar si HAY datos reales (si no, mantener los estáticos)
        if (lista.length > 0) {
          rutas = lista;
          renderizarRutas(rutas);
          actualizarKPIs(rutas);
        } else {
          // No hay datos, mantener los estáticos, pero actualizar KPIs con ceros
          console.log(
            "No hay rutas en el backend, se mantienen los estáticos.",
          );
          // Opcional: puedes actualizar KPIs a 0 o dejarlos como están
          // actualizarKPIs([]);
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar rutas:", error);
      mostrarNotificacion(
        "No se pudieron cargar las rutas del servidor. Mostrando datos de prueba.",
        "warning",
      );
    });

  // Obtener líneas para el filtro (siempre se actualiza)
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
// 7. RENDERIZAR TARJETAS DE RUTAS (REEMPLAZA las estáticas)
// ============================================================
function renderizarRutas(listaRutas) {
  const grid = document.getElementById("rutasGrid");
  if (!grid) return;

  // Si no hay rutas, NO BORRAMOS los estáticos, simplemente no hacemos nada.
  if (listaRutas.length === 0) {
    console.log("No se renderizan tarjetas porque no hay datos.");
    return;
  }

  let html = "";
  listaRutas.forEach((ruta) => {
    const statusClass = ruta.status === "activa" ? "active" : "inactive";
    const statusText = ruta.status === "activa" ? "Activa" : "Inactiva";
    const nombreLinea = ruta.linea ? ruta.linea.nombre : "Sin línea";

    html += `
        <div class="ruta-card">
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
                        <span class="info-label">Línea</span>
                        <span class="info-value">${nombreLinea}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ID</span>
                        <span class="info-value">#${ruta.id_ruta}</span>
                    </div>
                </div>
                <div class="ruta-footer">
                    <button class="btn-ver" data-id="${ruta.id_ruta}">
                        Ver detalle <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
  });

  grid.innerHTML = html;
  inicializarExpandibles();
  asignarEventosRutas();
}

// ============================================================
// 8. ACTUALIZAR KPIs
// ============================================================
function actualizarKPIs(listaRutas) {
  const total = listaRutas.length;
  const activas = listaRutas.filter((r) => r.status === "activa").length;
  document.getElementById("totalRutas").textContent = total;
  document.getElementById("rutasActivas").textContent = activas;

  // Puedes agregar fetch para paradas y buses si los endpoints existen
  // fetch('/admin/paradas').then(...)
  // fetch('/admin/buses').then(...)
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
    option.value = linea.id_linea;
    option.textContent = linea.nombre;
    select.appendChild(option);
  });
}

// ============================================================
// 10. EVENTOS DE EXPANSIÓN (acordeón)
// ============================================================
function inicializarExpandibles() {
  document.querySelectorAll(".btn-expand").forEach((btn) => {
    btn.removeEventListener("click", handleExpand);
    btn.addEventListener("click", handleExpand);
  });
}

function handleExpand(e) {
  e.stopPropagation();
  const id = this.getAttribute("data-id");
  const expandable = document.getElementById(`expandable-${id}`);
  const icon = this.querySelector("i");
  if (!expandable) return;
  if (expandable.style.display === "none") {
    expandable.style.display = "block";
    if (icon) icon.style.transform = "rotate(180deg)";
  } else {
    expandable.style.display = "none";
    if (icon) icon.style.transform = "rotate(0deg)";
  }
}

// ============================================================
// 11. ASIGNAR EVENTOS A BOTONES DE LAS TARJETAS
// ============================================================
function asignarEventosRutas() {
  // Botones "Ver detalle"
  document.querySelectorAll(".btn-ver").forEach((btn) => {
    btn.removeEventListener("click", handleVerDetalle);
    btn.addEventListener("click", handleVerDetalle);
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
  const searchTerm =
    document.getElementById("searchRuta")?.value?.toLowerCase() || "";
  const filterLinea = document.getElementById("filterLinea")?.value || "";
  const filterEstado = document.getElementById("filterEstado")?.value || "";

  const cards = document.querySelectorAll(".ruta-card");
  cards.forEach((card) => {
    const title =
      card.querySelector(".ruta-title h3")?.textContent?.toLowerCase() || "";
    const lineaElement = card.querySelector(
      ".info-row:first-child .info-value",
    );
    const linea = lineaElement ? lineaElement.textContent : "";
    const statusSpan = card.querySelector(".status-badge");
    const estado = statusSpan ? statusSpan.textContent : "";

    let visible = true;
    if (searchTerm && !title.includes(searchTerm)) visible = false;
    if (
      filterLinea &&
      linea !== filterLinea &&
      !card.querySelector(`[data-linea-id="${filterLinea}"]`)
    )
      visible = false;
    if (filterEstado) {
      if (filterEstado === "Activas" && estado !== "Activa") visible = false;
      if (
        filterEstado === "Inactivas" &&
        estado !== "Inactiva" &&
        estado !== "Mantenimiento"
      )
        visible = false;
    }
    card.style.display = visible ? "block" : "none";
  });
}

// ============================================================
// 13. INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  // Botón "Nueva Ruta"
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

  // Cerrar con tecla Escape
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
