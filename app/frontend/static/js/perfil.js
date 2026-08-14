// app/frontend/static/js/pages/perfil.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("perfilForm");
  const btnCambiar = document.getElementById("btnCambiarContrasena");
  const seccionCambio = document.getElementById("cambiarContrasenaSection");
  const btnCancelar = document.getElementById("btnCancelarCambio");
  const cambioForm = document.getElementById("cambiarContrasenaForm");

  // Elementos del resumen (columna izquierda)
  const avatarNombre = document.getElementById("avatarNombre");
  const avatarEmail = document.getElementById("avatarEmail");
  const avatarBadge = document.getElementById("avatarBadge");

  // Sistema de Notificaciones Toast (usa las clases de global.css)
  function mostrarToast(mensaje, tipo = "info") {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;

    toast.className = `toast-message ${tipo} show`;
    toast.textContent = mensaje;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  // Mapear rol a las clases CSS creadas para badges
  function actualizarBadgeRol(rol) {
    const rolNormalizado = (rol || "usuario").toLowerCase();
    let claseBadge = "badge-usuario";
    let textoRol = "Usuario";

    switch (rolNormalizado) {
      case "admin":
      case "administrador":
        claseBadge = "badge-admin";
        textoRol = "Administrador";
        break;
      case "presidente":
        claseBadge = "badge-presidente";
        textoRol = "Presidente";
        break;
      case "secretario":
        claseBadge = "badge-secretario";
        textoRol = "Secretario";
        break;
      default:
        claseBadge = "badge-usuario";
        textoRol = "Usuario";
    }

    avatarBadge.innerHTML = `<span class="${claseBadge}">${textoRol}</span>`;
  }

  // Toggle mostrar/ocultar cambio de contraseña
  btnCambiar.addEventListener("click", function () {
    const estaOculto =
      seccionCambio.style.display === "none" || seccionCambio.style.display === "";

    if (estaOculto) {
      seccionCambio.style.display = "block";
      btnCambiar.textContent = "Ocultar cambio";
    } else {
      seccionCambio.style.display = "none";
      btnCambiar.innerHTML = `<i class="fas fa-key"></i> Cambiar contraseña`;
      cambioForm.reset();
    }
  });

  btnCancelar.addEventListener("click", function () {
    seccionCambio.style.display = "none";
    btnCambiar.innerHTML = `<i class="fas fa-key"></i> Cambiar contraseña`;
    cambioForm.reset();
  });

  // Cargar perfil desde la API
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
        const usuario = data.data;

        // 1. Rellenar formulario (Columna Derecha)
        document.getElementById("nombre").value = usuario.nombre || "";
        document.getElementById("email").value = usuario.email || "";
        document.getElementById("nombre").defaultValue = usuario.nombre || "";
        document.getElementById("email").defaultValue = usuario.email || "";

        const rolSelect = document.getElementById("rol");
        if (rolSelect) rolSelect.value = usuario.rol || "usuario";

        // 2. Rellenar tarjeta resumen (Columna Izquierda)
        avatarNombre.textContent = usuario.nombre || "Usuario";
        avatarEmail.textContent = usuario.email || "";
        actualizarBadgeRol(usuario.rol);

      } else {
        mostrarToast("Error al cargar perfil: " + (data.message || "Error desconocido"), "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarToast("Error de conexión al servidor", "error");
    }
  }

  // Actualizar perfil (Nombre y Email)
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const nombreOriginal = document.getElementById("nombre").defaultValue;
    const emailOriginal = document.getElementById("email").defaultValue;

    const formData = {};
    if (nombre !== nombreOriginal && nombre) formData.nombre = nombre;
    if (email !== emailOriginal && email) formData.email = email;

    if (Object.keys(formData).length === 0) {
      mostrarToast("No has modificado ningún campo", "info");
      return;
    }

    if (email && email !== emailOriginal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        mostrarToast("Formato de correo inválido", "error");
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
        mostrarToast("Perfil actualizado correctamente", "success");

        // Actualizar los valores por defecto y el panel lateral
        if (formData.nombre) {
          document.getElementById("nombre").defaultValue = formData.nombre;
          avatarNombre.textContent = formData.nombre;
          const navUser = document.querySelector(".user-name");
          if (navUser) navUser.textContent = formData.nombre;
        }

        if (formData.email) {
          document.getElementById("email").defaultValue = formData.email;
          avatarEmail.textContent = formData.email;
        }
      } else {
        mostrarToast(data.message || "Error al actualizar perfil", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarToast("Error de conexión al servidor", "error");
    }
  });

  // Cambiar Contraseña
  cambioForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      mostrarToast("Todos los campos son obligatorios", "error");
      return;
    }

    if (newPassword.length < 8) {
      mostrarToast("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      mostrarToast("Las contraseñas no coinciden", "error");
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
        mostrarToast("Contraseña actualizada correctamente", "success");
        cambioForm.reset();
        seccionCambio.style.display = "none";
        btnCambiar.innerHTML = `<i class="fas fa-key"></i> Cambiar contraseña`;
      } else {
        mostrarToast(data.message || "Error al cambiar contraseña", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarToast("Error de conexión al servidor", "error");
    }
  });

  // Carga inicial
  cargarPerfil();
});