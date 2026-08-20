// frontend/static/js/pages/lineas.js
// ========================================
// PÁGINA DE LÍNEAS - CRUD Y PALETA
// ========================================

let editandoId = null;
let loading = false;
let presidentes = [];
let secretarios = [];

// ========== MANEJO DE SELECCIÓN DE COLOR ==========
function seleccionarColor(hexColor) {
  const hex = hexColor.toUpperCase();
  const inputColor = document.getElementById("color_linea");
  const colorHexText = document.getElementById("colorHex");
  const customPicker = document.getElementById("customColorPicker");

  if (inputColor) inputColor.value = hex;
  if (colorHexText) colorHexText.textContent = hex;
  if (customPicker) customPicker.value = hex;

  // Marcar/Desmarcar swatches
  const swatches = document.querySelectorAll(".color-swatch");
  swatches.forEach(swatch => {
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
    const responsePres = await fetch("/admin/personas/select", {
      credentials: "include",
    });
    const dataPres = await responsePres.json();
    presidentes = dataPres.data || [];

    const responseSec = await fetch("/admin/secretarios/select", {
      credentials: "include",
    });
    const dataSec = await responseSec.json();
    secretarios = dataSec.data || [];

    const selectPres = document.getElementById("presidente_id");
    if (selectPres) {
      selectPres.innerHTML = '<option value="">Seleccione un presidente...</option>';
      presidentes.forEach((p) => {
        if (p.rol === "presidente") {
          const option = document.createElement("option");
          option.value = p.id;
          option.textContent = `${p.nombre} - ${p.cedula}`;
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
        option.textContent = `${s.nombre} - ${s.apellido}`;
        selectSec.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error al cargar selectores:", error);
    showToast("Error al cargar presidentes y secretarios", "error");
  }
}

// ========== MODAL ==========
function abrirModal(titulo, data = null) {
  const modal = document.getElementById("lineaModal");
  if (!modal) return;

  document.getElementById("modalTitle").textContent = titulo;
  document.getElementById("lineaForm").reset();
  
  const selectPres = document.getElementById("presidente_id");
  const selectSec = document.getElementById("secretario_id");
  if (selectPres) selectPres.value = "";
  if (selectSec) selectSec.value = "";
  
  // Establecer color inicial o cargado
  const colorInicial = (data && data.color) ? data.color : "#74A9D3";
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

// Cerrar con ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});

// ========== CARGAR LÍNEAS ==========
async function cargarLineas() {
  try {
    const response = await fetch("/admin/lineas", {
      credentials: "include",
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const lineas = data.data || [];

    const tablaHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Presidente</th>
            <th>Secretario</th>
            <th>RIF</th>
            <th>Color</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${lineas
            .map(
              (linea) => `
              <tr>
                <td>${linea.id}</td>
                <td><strong>${linea.nombre}</strong></td>
                <td>${linea.presidente ? linea.presidente : "-"}</td>
                <td>${linea.secretario_nombre || "-"}</td>
                <td>${linea.rif}</td>
                <td>
                  <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: ${linea.color || '#74A9D3'}; border: 2px solid #fff; box-shadow: 0 0 0 1px #cbd5e1;"></span>
                </td>
                <td>
                  <button class="btn-edit" onclick="editarLinea(${linea.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-delete" onclick="eliminarLinea(${linea.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `
            )
            .join("")}
          ${
            lineas.length === 0
              ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: var(--texto-claro);">
                  No hay líneas registradas
                </td>
              </tr>
            `
              : ""
          }
        </tbody>
      </table>
    `;

    const contenedorTabla = document.getElementById("tablaLineas");
    if (contenedorTabla) contenedorTabla.innerHTML = tablaHtml;
  } catch (error) {
    console.error("Error al cargar líneas:", error);
    showToast("Error al cargar líneas", "error");
  }
}

// ========== EDITAR LÍNEA ==========
async function editarLinea(id) {
  try {
    const response = await fetch(`/admin/lineas/${id}`, {
      credentials: "include",
    });

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
    showToast("Error al cargar la línea", "error");
  }
}

// ========== ELIMINAR LÍNEA ==========
async function eliminarLinea(id) {
  const confirmado = await confirmDelete(
    "¿Estás seguro?",
    "¿Deseas suspender/eliminar esta línea?",
    "Sí, continuar"
  );
  if (!confirmado) return;

  try {
    const response = await fetch(`/admin/lineas/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast("Línea procesada exitosamente", "success");
      cargarLineas();
    } else {
      const msg = data.error || data.message || "No se puede eliminar la línea debido a dependencias activas.";
      showAlert("No se puede eliminar", msg, "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Error de conexión al servidor", "error");
  }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", async () => {
  // Listeners para paleta de colores
  const paletteContainer = document.getElementById("colorPalette");
  if (paletteContainer) {
    paletteContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".color-swatch");
      if (button && button.dataset.color) {
        seleccionarColor(button.dataset.color);
      }
    });
  }

  // Listener para el selector personalizado
  const customColorPicker = document.getElementById("customColorPicker");
  if (customColorPicker) {
    customColorPicker.addEventListener("input", function() {
      seleccionarColor(this.value);
    });
  }

  await cargarSelectores();

  const formLinea = document.getElementById("lineaForm");
  if (formLinea) {
    formLinea.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (loading) return;
      loading = true;
      
      const btnGuardar = document.getElementById("btnGuardar");
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

      if (!datos.nombre) {
        showToast("El nombre es obligatorio", "error");
        loading = false;
        if (btnGuardar) btnGuardar.disabled = false;
        return;
      }

      if (!datos.rif) {
        showToast("El RIF es obligatorio", "error");
        loading = false;
        if (btnGuardar) btnGuardar.disabled = false;
        return;
      }

      if (!datos.presidente_id) {
        showToast("Debes seleccionar un presidente", "error");
        loading = false;
        if (btnGuardar) btnGuardar.disabled = false;
        return;
      }

      const url = editandoId ? `/admin/lineas/${editandoId}` : "/admin/lineas";
      const method = editandoId ? "PUT" : "POST";

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (response.ok && data.success !== false) {
          showToast(
            editandoId ? "Línea actualizada" : "Línea creada exitosamente",
            "success"
          );
          cerrarModal();
          cargarLineas();
        } else {
          const msg = data.error || data.message || "Error al procesar la solicitud";
          showAlert("Error en la operación", msg, "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showToast("Error de conexión al servidor", "error");
      } finally {
        loading = false;
        if (btnGuardar) btnGuardar.disabled = false;
      }
    });
  }

  const btnNueva = document.getElementById("btnNuevaLinea");
  if (btnNueva) {
    btnNueva.onclick = async () => {
      editandoId = null;
      await cargarSelectores();
      abrirModal("Nueva Línea");
    };
  }

  window.onclick = (event) => {
    const modal = document.getElementById("lineaModal");
    if (event.target === modal) {
      cerrarModal();
    }
  };

  cargarLineas();
});