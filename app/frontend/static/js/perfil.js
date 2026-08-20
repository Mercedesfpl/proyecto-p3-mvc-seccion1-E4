// frontend/static/js/pages/perfil.js

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

  let toastTimeout = null;

  // ========== NOTIFICACIONES TOAST ==========
  function mostrarToast(mensaje, tipo = "info") {
    const toast = document.getElementById("toastNotification") || document.getElementById("toastMessage");
    if (!toast) return;

    if (toastTimeout) clearTimeout(toastTimeout);

    toast.textContent = mensaje;
    toast.className = `toast-message ${tipo} show`;

    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  // ========== BADGES DE ROL ==========
  function actualizarBadgeRol(rol) {
    if (!avatarBadge) return;
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

  // ========== TOGGLE SECCIÓN CONTRASEÑA ==========
  if (btnCambiar && seccionCambio) {
    btnCambiar.addEventListener("click", function () {
      const estaOculto =
        seccionCambio.style.display === "none" || seccionCambio.style.display === "";

      if (estaOculto) {
        seccionCambio.style.display = "block";
        btnCambiar.textContent = "Ocultar cambio";
      } else {
        seccionCambio.style.display = "none";
        btnCambiar.innerHTML = `<i class="fas fa-key"></i> Cambiar contraseña`;
        if (cambioForm) cambioForm.reset();
      }
    });
  }

  if (btnCancelar && seccionCambio) {
    btnCancelar.addEventListener("click", function () {
      seccionCambio.style.display = "none";
      if (btnCambiar) {
        btnCambiar.innerHTML = `<i class="fas fa-key"></i> Cambiar contraseña`;
      }
      if (cambioForm) cambioForm.reset();
    });
  }

  // ========== CARGAR PERFIL ==========
  async function cargarPerfil() {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/perfil", {
        method: "GET",
        headers: headers,
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok && (data.success || data.data)) {
        const usuario = data.data || data;

        const inputNombre = document.getElementById("nombre");
        const inputEmail = document.getElementById("email");

        if (inputNombre) {
          inputNombre.value = usuario.nombre || "";
          inputNombre.defaultValue = usuario.nombre || "";
        }
        if (inputEmail) {
          inputEmail.value = usuario.email || "";
          inputEmail.defaultValue = usuario.email || "";
        }

        const rolSelect = document.getElementById("rol");
        if (rolSelect) rolSelect.value = usuario.rol || "usuario";

        if (avatarNombre) avatarNombre.textContent = usuario.nombre || "Usuario";
        if (avatarEmail) avatarEmail.textContent = usuario.email || "";
        actualizarBadgeRol(usuario.rol);
      } else {
        mostrarToast("Error al cargar perfil: " + (data.message || data.error || "Error desconocido"), "error");
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      mostrarToast("Error de conexión al servidor", "error");
    }
  }

  // ========== ACTUALIZAR DATOS DE PERFIL ==========
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const inputNombre = document.getElementById("nombre");
      const inputEmail = document.getElementById("email");

      const nombre = inputNombre ? inputNombre.value.trim() : "";
      const email = inputEmail ? inputEmail.value.trim() : "";
      const nombreOriginal = inputNombre ? inputNombre.defaultValue : "";
      const emailOriginal = inputEmail ? inputEmail.defaultValue : "";

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
        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        };

        const response = await fetch("/api/perfil", {
          method: "PUT",
          headers: headers,
          credentials: "include",
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
          mostrarToast("Perfil actualizado correctamente", "success");

          if (formData.nombre) {
            if (inputNombre) inputNombre.defaultValue = formData.nombre;
            if (avatarNombre) avatarNombre.textContent = formData.nombre;
            const navUser = document.querySelector(".user-name");
            if (navUser) navUser.textContent = formData.nombre;
          }

          if (formData.email) {
            if (inputEmail) inputEmail.defaultValue = formData.email;
            if (avatarEmail) avatarEmail.textContent = formData.email;
          }
        } else {
          mostrarToast(data.message || data.error || "Error al actualizar perfil", "error");
        }
      } catch (error) {
        console.error("Error al actualizar perfil:", error);
        mostrarToast("Error de conexión al servidor", "error");
      }
    });
  }

  // ========== CAMBIAR CONTRASEÑA ==========
  if (cambioForm) {
    cambioForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const currentPassword = document.getElementById("currentPassword")?.value.trim();
      const newPassword = document.getElementById("newPassword")?.value.trim();
      const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

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
        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        };

        const response = await fetch("/api/cambiar-contrasena", {
          method: "POST",
          headers: headers,
          credentials: "include",
          body: JSON.stringify({
            contrasenia_actual: currentPassword,
            nueva_contrasenia: newPassword
          })
        });

        const data = await response.json();

        if (response.ok) {
          mostrarToast("Contraseña actualizada correctamente", "success");
          cambioForm.reset();
          if (seccionCambio) seccionCambio.style.display = "none";
          if (btnCambiar) {
            btnCambiar.innerHTML = `<i class="fas fa-key"></i> Cambiar contraseña`;
          }
        } else {
          mostrarToast(data.message || data.error || "Error al cambiar contraseña", "error");
        }
      } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        mostrarToast("Error de conexión al servidor", "error");
      }
    });
  }

  // Carga inicial
  cargarPerfil();
});