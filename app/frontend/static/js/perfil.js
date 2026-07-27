// app/frontend/static/js/pages/perfil.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("perfilForm");
  const btnCambiar = document.getElementById("btnCambiarContrasena");
  const seccionCambio = document.getElementById("cambiarContrasenaSection");
  const btnCancelar = document.getElementById("btnCancelarCambio");
  const cambioForm = document.getElementById("cambiarContrasenaForm");

  // Función para mostrar mensajes
  function mostrarMensaje(mensaje, tipo = "success", contenedor = form) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    contenedor.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  // Toggle mostrar/ocultar sección de cambio de contraseña
  btnCambiar.addEventListener("click", function () {
    if (
      seccionCambio.style.display === "none" ||
      seccionCambio.style.display === ""
    ) {
      seccionCambio.style.display = "block";
      btnCambiar.textContent = "Ocultar cambio de contraseña";
    } else {
      seccionCambio.style.display = "none";
      btnCambiar.textContent = "Cambiar contraseña";
      cambioForm.reset();
    }
  });

  btnCancelar.addEventListener("click", function () {
    seccionCambio.style.display = "none";
    btnCambiar.textContent = "Cambiar contraseña";
    cambioForm.reset();
  });

  // Cargar datos del perfil
  async function cargarPerfil() {
    try {
      const response = await fetch("/api/perfil", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        document.getElementById("nombre").value = data.data.nombre || "";
        document.getElementById("email").value = data.data.email || "";
        const rolSelect = document.getElementById("rol");
        if (rolSelect) {
          rolSelect.value = data.data.rol || "usuario";
        }
        // Guardar valores originales para comparar después
        document.getElementById("nombre").defaultValue = data.data.nombre || "";
        document.getElementById("email").defaultValue = data.data.email || "";
      } else {
        mostrarMensaje(
          "Error al cargar perfil: " + (data.message || "Error desconocido"),
          "danger",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión al servidor", "danger");
    }
  }

  // Actualizar perfil (nombre y email)
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const nombreOriginal = document.getElementById("nombre").defaultValue;
    const emailOriginal = document.getElementById("email").defaultValue;

    const formData = {};
    if (nombre !== nombreOriginal && nombre) {
      formData.nombre = nombre;
    }
    if (email !== emailOriginal && email) {
      formData.email = email;
    }

    if (Object.keys(formData).length === 0) {
      mostrarMensaje("No has modificado ningún campo", "warning");
      return;
    }

    if (email && email !== emailOriginal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        mostrarMensaje("Formato de correo inválido", "warning");
        return;
      }
    }

    try {
      const response = await fetch("/api/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        mostrarMensaje("Perfil actualizado correctamente", "success");
        if (formData.nombre) {
          document.getElementById("nombre").defaultValue = formData.nombre;
          const nombreHeader = document.querySelector(".user-name");
          if (nombreHeader) nombreHeader.textContent = formData.nombre;
        }
        if (formData.email) {
          document.getElementById("email").defaultValue = formData.email;
        }
      } else {
        mostrarMensaje(data.message || "Error al actualizar perfil", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión al servidor", "danger");
    }
  });

  // ========== CAMBIAR CONTRASEÑA ==========
  cambioForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document
      .getElementById("currentPassword")
      .value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    // Validaciones básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      mostrarMensaje(
        "Todos los campos son obligatorios",
        "warning",
        cambioForm,
      );
      return;
    }

    if (newPassword.length < 8) {
      mostrarMensaje(
        "La nueva contraseña debe tener al menos 8 caracteres",
        "warning",
        cambioForm,
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      mostrarMensaje("Las contraseñas no coinciden", "warning", cambioForm);
      return;
    }

    try {
      const response = await fetch("/api/cambiar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          contrasenia_actual: currentPassword,
          nueva_contrasenia: newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        mostrarMensaje(
          "Contraseña actualizada correctamente",
          "success",
          cambioForm,
        );
        cambioForm.reset();
        // Ocultar sección después de éxito
        seccionCambio.style.display = "none";
        btnCambiar.textContent = "Cambiar contraseña";
      } else {
        mostrarMensaje(
          data.message || "Error al cambiar contraseña",
          "danger",
          cambioForm,
        );
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión al servidor", "danger", cambioForm);
    }
  });

  // Cargar perfil al inicio
  cargarPerfil();
});
