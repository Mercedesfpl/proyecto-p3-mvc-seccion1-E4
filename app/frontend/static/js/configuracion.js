// app/frontend/static/js/pages/configuracion.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("configForm");

  //  Función para aplicar el tema
  function aplicarTema(tema) {
    if (tema === "oscuro") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", tema);
  }

  // Función para mostrar mensaje (con eliminación de duplicados)
  function mostrarMensaje(mensaje, tipo = "success") {
    // Eliminar mensajes anteriores
    const mensajesAnteriores = form.querySelectorAll(".alert");
    mensajesAnteriores.forEach((el) => el.remove());

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

  //  Cargar configuración desde el BACKEND
  async function cargarConfiguracion() {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        aplicarTema("claro");
        document.getElementById("tema").value = "claro";
        document.getElementById("notificaciones").value = "activadas";
        return;
      }

      const response = await fetch("/api/configuracion", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const tema = data.data.tema || "claro";
        const notificaciones = data.data.notificaciones || "activadas";

        document.getElementById("tema").value = tema;
        document.getElementById("notificaciones").value = notificaciones;
        aplicarTema(tema);
        localStorage.setItem("notificaciones", notificaciones);
      } else {
        const temaCached = localStorage.getItem("theme") || "claro";
        const notifCached =
          localStorage.getItem("notificaciones") || "activadas";
        document.getElementById("tema").value = temaCached;
        document.getElementById("notificaciones").value = notifCached;
        aplicarTema(temaCached);
        mostrarMensaje(
          "No se pudo cargar la configuración del servidor, usando valores locales",
          "warning",
        );
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
      const temaCached = localStorage.getItem("theme") || "claro";
      const notifCached = localStorage.getItem("notificaciones") || "activadas";
      document.getElementById("tema").value = temaCached;
      document.getElementById("notificaciones").value = notifCached;
      aplicarTema(temaCached);
      mostrarMensaje(
        "Error de conexión, usando configuración local",
        "warning",
      );
    }
  }

  //  Guardar configuración en el BACKEND y en localStorage
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const tema = document.getElementById("tema").value;
    const notificaciones = document.getElementById("notificaciones").value;

    const payload = {
      tema: tema,
      notificaciones: notificaciones,
    };

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        mostrarMensaje("No hay sesión activa, no se puede guardar", "error");
        return;
      }

      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("theme", data.data.tema);
        localStorage.setItem("notificaciones", data.data.notificaciones);
        aplicarTema(data.data.tema);
        mostrarMensaje("Configuración guardada correctamente", "success");
      } else {
        localStorage.setItem("theme", tema);
        localStorage.setItem("notificaciones", notificaciones);
        aplicarTema(tema);
        mostrarMensaje(
          data.message ||
            "Error al guardar en el servidor, se guardó localmente",
          "warning",
        );
      }
    } catch (error) {
      console.error("Error guardando configuración:", error);
      localStorage.setItem("theme", tema);
      localStorage.setItem("notificaciones", notificaciones);
      aplicarTema(tema);
      mostrarMensaje(
        "Error de conexión, configuración guardada localmente",
        "warning",
      );
    }
  });

  cargarConfiguracion();
});
