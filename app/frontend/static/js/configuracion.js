// app/frontend/static/js/pages/configuracion.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("configForm");

  // Sistema de Notificaciones Toast (coincide con el resto de la app)
  function mostrarToast(mensaje, tipo = "info") {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;

    toast.className = `toast-message ${tipo} show`;
    toast.textContent = mensaje;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  // Cargar configuración actual desde la API
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

        // Aplicar el tema guardado
        if (data.tema === "oscuro") {
          document.body.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
        }
      } else {
        mostrarToast("Error al cargar configuración", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarToast("Error de conexión al servidor", "error");
    }
  }

  // Guardar configuración al enviar el formulario
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
        mostrarToast("Configuración guardada correctamente", "success");

        // Aplicar o remover modo oscuro dinámicamente
        if (formData.tema === "oscuro") {
          document.body.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
        }
      } else {
        mostrarToast(
          data.message || "Error al guardar la configuración",
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarToast("Error de conexión al servidor", "error");
    }
  });

  // Carga inicial al montar la vista
  cargarConfiguracion();
});