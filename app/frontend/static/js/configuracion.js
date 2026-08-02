// app/frontend/static/js/pages/configuracion.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("configForm");

  // ✅ Función para aplicar el tema
  function aplicarTema(tema) {
    if (tema === "oscuro") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", tema); // Guardar preferencia local
  }

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

  // ✅ Cargar configuración desde localStorage
  function cargarConfiguracion() {
    const tema = localStorage.getItem("theme") || "claro";
    const notificaciones =
      localStorage.getItem("notificaciones") || "activadas";

    document.getElementById("tema").value = tema;
    document.getElementById("notificaciones").value = notificaciones;

    // ✅ Aplicar tema al cargar
    aplicarTema(tema);
  }

  // ✅ Guardar configuración en localStorage
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const tema = document.getElementById("tema").value;
    const notificaciones = document.getElementById("notificaciones").value;

    // Guardar en localStorage
    localStorage.setItem("theme", tema);
    localStorage.setItem("notificaciones", notificaciones);

    // Aplicar tema
    aplicarTema(tema);

    mostrarMensaje("Configuración guardada correctamente", "success");
  });

  cargarConfiguracion();
});
