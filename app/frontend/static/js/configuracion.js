// frontend/static/js/pages/configuracion.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("configForm");
  if (!form) return;

  // ========== HELPERS ==========
  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find((r) => r.startsWith(name + "="))
      ?.split("=")[1];
  }

  function aplicarTema(tema) {
    if (tema === "oscuro") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", tema);
  }

  function mostrarMensaje(mensaje, tipo = "success") {
    if (typeof showToast === "function") {
      showToast(mensaje, tipo === "error" ? "error" : tipo);
      return;
    }
    alert(mensaje);
  }

  // ========== CARGAR ==========
  async function cargarConfiguracion() {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/configuracion", {
        method: "GET",
        headers: headers,
        credentials: "include",
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
        const notifCached = localStorage.getItem("notificaciones") || "activadas";
        document.getElementById("tema").value = temaCached;
        document.getElementById("notificaciones").value = notifCached;
        aplicarTema(temaCached);
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
      const temaCached = localStorage.getItem("theme") || "claro";
      const notifCached = localStorage.getItem("notificaciones") || "activadas";
      document.getElementById("tema").value = temaCached;
      document.getElementById("notificaciones").value = notifCached;
      aplicarTema(temaCached);
    }
  }

  // ========== GUARDAR ==========
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
      const csrfToken = getCookie("csrf_access_token");

      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,                 
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",                      
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("theme", data.data.tema);
        localStorage.setItem("notificaciones", data.data.notificaciones);
        aplicarTema(data.data.tema);
        mostrarMensaje("Configuración guardada correctamente", "success");
      } else {
        // Fallback local
        localStorage.setItem("theme", tema);
        localStorage.setItem("notificaciones", notificaciones);
        aplicarTema(tema);
        mostrarMensaje(
          data.message || "Error al guardar en el servidor, se guardó localmente",
          "warning"
        );
      }
    } catch (error) {
      console.error("Error guardando configuración:", error);
      localStorage.setItem("theme", tema);
      localStorage.setItem("notificaciones", notificaciones);
      aplicarTema(tema);
      mostrarMensaje("Error de conexión, configuración guardada localmente", "warning");
    }
  });

  // ========== PREVIEW DE TEMA EN VIVO ==========
  document.getElementById("tema")?.addEventListener("change", function () {
    aplicarTema(this.value);
  });

  cargarConfiguracion();
});