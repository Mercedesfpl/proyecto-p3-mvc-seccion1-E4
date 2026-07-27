document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("configForm");

  function mostrarMensaje(mensaje, tipo = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    form.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  // Cargar configuración actual
  async function cargarConfiguracion() {
    try {
      const response = await fetch("/api/configuracion", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        document.getElementById("tema").value = data.tema || "claro";
        document.getElementById("notificaciones").value =
          data.notificaciones || "activadas";
      } else {
        mostrarMensaje("Error al cargar configuración", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Guardar configuración
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      tema: document.getElementById("tema").value,
      notificaciones: document.getElementById("notificaciones").value,
    };

    try {
      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        mostrarMensaje("Configuración guardada correctamente", "success");
        // Aplicar tema si es necesario
        if (formData.tema === "oscuro") {
          document.body.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
        }
      } else {
        mostrarMensaje(
          data.message || "Error al guardar configuración",
          "danger",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión al servidor", "danger");
    }
  });

  cargarConfiguracion();
});
