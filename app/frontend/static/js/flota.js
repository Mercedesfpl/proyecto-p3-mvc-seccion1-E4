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

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

// ============================================================
// 2. ABRIR / CERRAR MODAL (igual que en personas)
// ============================================================
function abrirModalUnidad(data = null) {
  const modal = document.getElementById("modalNuevaUnidad");
  const form = document.getElementById("formNuevaUnidad");
  form.reset();
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  if (data) {
    //modo edición
    editandoIdUnidad = data.id_vehiculo;
    document.getElementById("placa").value = data.placa || "";
    document.getElementById("id_linea").value = data.id_linea || "";
    document.getElementById("id_ruta").value = data.id_ruta || "";
    document.getElementById("id_secretario").value = data.id_secretario || "";
    document.getElementById("status").value = data.status || "";
    document.querySelector("#modalNuevaUnidad h2").innerHTML =
      '<i class="fas fa-bus"></i> Editar unidad';
  } else {
    //modo creación
    editandoIdUnidad = null;
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
// 3. CARGAR TABLA DE BUSES
// ============================================================
async function cargarBuses() {
  try {
    const response = await fetch("/admin/buses", { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const buses = data.data || [];
    const tbody = document.getElementById("unidadesTableBody");
    if (!tbody) return;

    if (buses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">No hay unidades registradas</td></tr>`;
      return;
    }

    tbody.innerHTML = buses
      .map((bus) => {
        //Usamos los campos planos que devuelve el backend
        const nombreLinea = bus.linea_nombre || "Sin Línea";
        const nombreRuta = bus.ruta_nombre || "Sin ruta";
        const nombreSecretario = bus.secretario_nombre || "Sin secretario";

        let statusClass = "status-active";
        let statusText = "Activo";
        if (bus.status === "inactiva") {
          statusClass = "status-inactive";
          statusText = "Inactivo";
        }

        return `
          <tr>
            <td><strong>BUS-${String(bus.id_vehiculo).padStart(3, "0")}</strong></td>
            <td>${bus.placa}</td>
            <td>${nombreLinea}</td>
            <td>${nombreRuta}</td>
            <td>${nombreSecretario}</td>
            <td>
              <span class="status-badge ${statusClass}">
                <i class="fas fa-circle"></i> ${statusText}
              </span>
            </td>
            <td class="action-buttons">
              <button class="action-btn edit" data-id="${bus.id_vehiculo}" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" data-id="${bus.id_vehiculo}" title="Eliminar">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    asignarEventosTabla();
  } catch (error) {
    console.error("Error al cargar buses:", error);
    mostrarNotificacion("Error al cargar las unidades", "danger");
  }
}

// ============================================================
// 4. CARGAR SELECTS DEL MODAL
// ============================================================
async function cargarSelectsModal() {
  try {
    // Líneas
    const respLineas = await fetch("/admin/lineas", { credentials: "include" });
    const dataLineas = await respLineas.json();
    const selectLinea = document.getElementById("id_linea");
    selectLinea.innerHTML = '<option value="">Seleccione una línea...</option>';
    (dataLineas.data || []).forEach((linea) => {
      const opt = document.createElement("option");
      opt.value = linea.id;
      opt.textContent = linea.nombre;
      selectLinea.appendChild(opt);
    });

    // Rutas
    const respRutas = await fetch("/admin/rutas/api", {
      credentials: "include",
    });
    const dataRutas = await respRutas.json();
    const selectRuta = document.getElementById("id_ruta");
    selectRuta.innerHTML = '<option value="">Sin ruta asignada...</option>';
    (dataRutas.data || []).forEach((ruta) => {
      const opt = document.createElement("option");
      opt.value = ruta.id_ruta;
      opt.textContent = ruta.nombre;
      selectRuta.appendChild(opt);
    });

    // Secretarios
    const respSecretarios = await fetch("/admin/secretarios/select", {
      credentials: "include",
    });
    const dataSecretarios = await respSecretarios.json();
    const selectSecretario = document.getElementById("id_secretario");
    selectSecretario.innerHTML =
      '<option value="">Seleccione un secretario...</option>';
    (dataSecretarios.data || []).forEach((sec) => {
      const opt = document.createElement("option");
      opt.value = sec.id;
      opt.textContent = sec.nombre;
      selectSecretario.appendChild(opt);
    });
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
    const csrfToken = getCookie("csrf_access_token");
    console.log("csrfToken--->", csrfToken);

    const url = editandoIdUnidad
      ? `/admin/buses/${editandoIdUnidad}`
      : "/admin/buses";
    const method = editandoIdUnidad ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      credentials: "include", // 🔑 envía cookies
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken, // 🔑 valor real, no "undefined"
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      mostrarNotificacion(
        editandoIdUnidad ? "Unidad actualizada" : "Unidad creada exitosamente",
        "success",
      );
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
    mostrarNotificacion("Error de conexión al servidorrrrr", "danger");
  } finally {
    loadingUnidad = false;
    document.getElementById("guardarUnidadBtn").disabled = false;
  }
}

// ============================================================
// 6. EDITAR UNIDAD
// ============================================================
async function editarUnidad(id) {
  try {
    const response = await fetch(`/admin/buses/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.data) throw new Error("Datos inválidos");

    //Aseguramos que los selects estén cargados antes de abrir el modal
    await cargarSelectsModal();
    abrirModalUnidad(data.data);
  } catch (error) {
    console.error("Error al cargar la unidad:", error);
    mostrarNotificacion("Error al cargar la unidad", "danger");
  }
}

// ============================================================
// 7. ELIMINAR UNIDAD (DELETE)
// ============================================================
async function eliminarUnidad(id) {
  if (!confirm(`¿Está seguro de eliminar la unidad ID: ${id}?`)) return;

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
    mostrarNotificacion("Error de conexión al servidor", "danger");
  }
}

// ============================================================
// 8. ASIGNAR EVENTOS A BOTONES DE LA TABLA
// ============================================================
function asignarEventosTabla() {
  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const id = this.getAttribute("data-id");
      editarUnidad(id);
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
  //Cargar los selects al inicio (para que estén listos al abrir el modal)
  cargarSelectsModal();

  //cargar tabla
  cargarBuses();

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
