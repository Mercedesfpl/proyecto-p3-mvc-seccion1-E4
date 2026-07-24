// ============================================================
// FLOTA (Buses) - Lógica completa (sin Bootstrap)
// ============================================================

let editandoIdUnidad = null;
let loadingUnidad = false;

// ============================================================
// 1. MOSTRAR NOTIFICACIONES (usando el mismo sistema de personas)
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
  // Reutiliza la función showToast de personas.js si existe
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
    return;
  }
  // Fallback: alert simple
  if (tipo === "success") alert("✅ " + mensaje);
  else if (tipo === "warning") alert("⚠️ " + mensaje);
  else if (tipo === "danger") alert("❌ " + mensaje);
  else alert("ℹ️ " + mensaje);
}

// ============================================================
// 2. ABRIR / CERRAR MODAL (igual que en personas)
// ============================================================
function abrirModalUnidad(titulo = "Nueva Unidad") {
  const modal = document.getElementById("modalNuevaUnidad");
  // Limpiar formulario
  document.getElementById("formNuevaUnidad").reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
  // Cargar selects
  cargarSelectsModal();
  // Mostrar modal
  modal.classList.add("show");
  document.getElementById("guardarUnidadBtn").disabled = false;
}

function cerrarModalUnidad() {
  const modal = document.getElementById("modalNuevaUnidad");
  modal.classList.remove("show");
  editandoIdUnidad = null;
  document.getElementById("guardarUnidadBtn").disabled = false;
  document.getElementById("formNuevaUnidad").reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
}

// ============================================================
// 3. CARGAR TABLA DE BUSES
// ============================================================
async function cargarBuses() {
  try {
    const response = await fetch("/admin/buses");
    const data = await response.json();
    const tbody = document.getElementById("unidadesTableBody");
    if (!tbody) return;

    if (data.success && data.data && data.data.length > 0) {
      tbody.innerHTML = "";
      data.data.forEach((bus) => {
        const nombreLinea = bus.linea ? bus.linea.nombre : "Sin línea";
        const nombreRuta = bus.ruta ? bus.ruta.nombre : "Sin ruta";
        const nombreSecretario = bus.secretario
          ? bus.secretario.nombre
          : "Sin secretario";

        let statusClass = "status-active";
        let statusText = "Activo";
        if (bus.status === "inactiva") {
          statusClass = "status-inactive";
          statusText = "Inactivo";
        } else if (bus.status === "en_servicio") {
          statusClass = "status-warning";
          statusText = "En servicio";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td><strong>BUS-${String(bus.id_vehiculo).padStart(3, "0")}</strong></td>
                    <td>${bus.placa}</td>
                    <td>${nombreLinea} / ${nombreRuta}</td>
                    <td>${nombreSecretario}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <i class="fas fa-circle"></i> ${statusText}
                        </span>
                    </td>
                    <td>${bus.ubicacion || "No asignada"}</td>
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
    } else {
      // Mantener datos estáticos (no borrar)
      console.log(
        "No se cargaron datos del backend, se mantienen los estáticos",
      );
    }
    // Asignar eventos a los botones de la tabla
    asignarEventosTabla();
  } catch (error) {
    console.error("Error al cargar buses:", error);
    mostrarNotificacion(
      "No se pudieron cargar datos del servidor. Mostrando datos de prueba.",
      "warning",
    );
  }
}

// ============================================================
// 4. CARGAR SELECTS DEL MODAL
// ============================================================
async function cargarSelectsModal() {
  try {
    // Líneas
    const respLineas = await fetch("/admin/lineas");
    const dataLineas = await respLineas.json();
    if (dataLineas.success) {
      const select = document.getElementById("id_linea");
      select.innerHTML = '<option value="">Seleccione una línea...</option>';
      dataLineas.data.forEach((linea) => {
        const opt = document.createElement("option");
        opt.value = linea.id_linea;
        opt.textContent = linea.nombre;
        select.appendChild(opt);
      });
    }

    // Rutas
    const respRutas = await fetch("/admin/rutas/api");
    const dataRutas = await respRutas.json();
    if (dataRutas.success) {
      const select = document.getElementById("id_ruta");
      select.innerHTML = '<option value="">Sin ruta asignada</option>';
      dataRutas.data.forEach((ruta) => {
        const opt = document.createElement("option");
        opt.value = ruta.id_ruta;
        opt.textContent = ruta.nombre;
        select.appendChild(opt);
      });
    }

    // Secretarios
    const respSecretarios = await fetch("/admin/secretarios/select");
    const dataSecretarios = await respSecretarios.json();
    if (dataSecretarios.success) {
      const select = document.getElementById("id_secretario");
      select.innerHTML =
        '<option value="">Seleccione un secretario...</option>';
      dataSecretarios.data.forEach((sec) => {
        const opt = document.createElement("option");
        opt.value = sec.id;
        opt.textContent = `${sec.nombre} ${sec.apellido || ""}`.trim();
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Error al cargar selects:", error);
    mostrarNotificacion("Error al cargar datos del formulario", "danger");
  }
}

// ============================================================
// 5. GUARDAR NUEVA UNIDAD (POST)
// ============================================================
async function guardarNuevaUnidad(e) {
  if (e) e.preventDefault();
  if (loadingUnidad) return;

  const form = document.getElementById("formNuevaUnidad");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Validación
  let valid = true;
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  if (!data.placa || !data.placa.trim()) {
    document.getElementById("placa").classList.add("is-invalid");
    valid = false;
  }
  if (!data.id_linea) {
    document.getElementById("id_linea").classList.add("is-invalid");
    valid = false;
  }
  if (!data.id_secretario) {
    document.getElementById("id_secretario").classList.add("is-invalid");
    valid = false;
  }
  if (!valid) {
    mostrarNotificacion("Complete los campos obligatorios (*)", "warning");
    return;
  }

  loadingUnidad = true;
  document.getElementById("guardarUnidadBtn").disabled = true;

  try {
    const response = await fetch("/admin/buses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      mostrarNotificacion("Unidad creada exitosamente", "success");
      cerrarModalUnidad();
      cargarBuses();
    } else {
      mostrarNotificacion(
        result.message || "Error al crear la unidad",
        "danger",
      );
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
// 6. ELIMINAR UNIDAD (DELETE)
// ============================================================
async function eliminarUnidad(id) {
  if (!confirm(`¿Está seguro de eliminar la unidad ID: ${id}?`)) return;

  try {
    const response = await fetch(`/admin/buses/${id}`, {
      method: "DELETE",
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
// 7. ASIGNAR EVENTOS A BOTONES DE LA TABLA
// ============================================================
function asignarEventosTabla() {
  document.querySelectorAll(".action-btn.view").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      alert(`Ver detalle de unidad ID: ${id} (en desarrollo)`);
    };
  });

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      alert(`Editar unidad ID: ${id} (en desarrollo)`);
    };
  });

  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      eliminarUnidad(id);
    };
  });
}

// ============================================================
// 8. INICIALIZAR EVENTOS
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  // Botón "Nueva Unidad"
  const nuevaUnidadBtn = document.getElementById("nuevaUnidadBtn");
  if (nuevaUnidadBtn) {
    nuevaUnidadBtn.onclick = function () {
      editandoIdUnidad = null;
      abrirModalUnidad();
    };
  }

  // Formulario (submit)
  const form = document.getElementById("formNuevaUnidad");
  if (form) {
    form.onsubmit = guardarNuevaUnidad;
  }

  // Cerrar modal al hacer clic fuera (igual que en personas)
  window.onclick = function (event) {
    const modal = document.getElementById("modalNuevaUnidad");
    if (event.target === modal) {
      cerrarModalUnidad();
    }
  };

  // Cerrar con tecla Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("modalNuevaUnidad");
      if (modal.classList.contains("show")) {
        cerrarModalUnidad();
      }
    }
  });

  // Botón Exportar
  const exportarBtn = document.getElementById("exportarBtn");
  if (exportarBtn) {
    exportarBtn.onclick = function () {
      alert("Funcionalidad: Exportar listado (en desarrollo)");
    };
  }

  // Cargar datos iniciales
  cargarBuses();
});
