// frontend/static/js/auth.js

// ========== FUNCIONES AUXILIARES ==========
function showToast(message, type = "success") {
  const toast = document.getElementById("toastMessage");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-message ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showStep(stepNumber) {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  if (step1) step1.style.display = "none";
  if (step2) step2.style.display = "none";
  if (step3) step3.style.display = "none";
  if (stepNumber === 1 && step1) step1.style.display = "block";
  if (stepNumber === 2 && step2) step2.style.display = "block";
  if (stepNumber === 3 && step3) step3.style.display = "block";
}

function updatePasswordStrength(password, elementId) {
  const strengthDiv = document.getElementById(elementId);
  if (!strengthDiv) return;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 10) strength++;
  if (/\d/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[!@#$%&/]/.test(password)) strength++;
  let color = "#dc2626";
  let text = "Débil";
  if (strength >= 3 && strength < 5) {
    color = "#f59e0b";
    text = "Media";
  } else if (strength >= 5) {
    color = "#10b981";
    text = "Fuerte";
  }
  strengthDiv.innerHTML = `<span style="color:${color}">${text}</span>`;
}

// ========== EFECTOS VISUALES  ==========
document.addEventListener("DOMContentLoaded", function () {
  // Efecto en botones
  const buttons = document.querySelectorAll(
    ".btn-login, .btn-register, .btn-forgot",
  );
  buttons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 150);
    });
  });

  // Efecto en inputs
  const inputs = document.querySelectorAll(".form-group input");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "translateX(4px)";
    });
    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "translateX(0)";
    });
  });

  // Toggle mostrar/ocultar contraseña
  const toggleBtn = document.querySelector(".password-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const passwordInput = document.getElementById("password");
      const icon = this.querySelector("i");
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      } else {
        passwordInput.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      }
    });
  }

  // Animación de entrada
  const authCard = document.querySelector(".auth-card");
  if (authCard) {
    authCard.style.opacity = "0";
    authCard.style.transform = "translateY(20px)";
    setTimeout(() => {
      authCard.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      authCard.style.opacity = "1";
      authCard.style.transform = "translateY(0)";
    }, 100);
  }

  // Efecto hover en enlaces
  const links = document.querySelectorAll(".auth-footer a, .forgot-link");
  links.forEach((link) => {
    link.addEventListener("mouseenter", function () {
      this.style.opacity = "0.7";
    });
    link.addEventListener("mouseleave", function () {
      this.style.opacity = "1";
    });
  });
});

// ========== RECUPERACIÓN DE CONTRASEÑA  ==========

let resetToken = null; // Guarda el token JWT del paso 1 si tu backend lo requiere

// PASO 1: Solicitar código
const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
  forgotForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();
    if (!email) {
      showToast("Ingresa un correo electrónico", "error");
      return;
    }

    // Mostrar estado de carga
    const submitBtn = forgotForm.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast(data.message || "Código enviado a tu correo", "success");

        if (data.access_token) {
          resetToken = data.access_token;
        }
        showStep(2);
      } else {
        showToast(
          data.message || data.error || "Error al enviar el código",
          "error",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de conexión con el servidor", "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// PASO 2: Verificar código
const verifyCodeForm = document.getElementById("verifyCodeForm");
if (verifyCodeForm) {
  verifyCodeForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const code = document.getElementById("code").value.trim();
    if (!code || code.length < 6) {
      showToast("Ingresa el código de 6 dígitos", "error");
      return;
    }

    const submitBtn = verifyCodeForm.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;

    try {
      const headers = { "Content-Type": "application/json" };

      if (resetToken) {
        headers["Authorization"] = `Bearer ${resetToken}`;
      }

      const response = await fetch("/api/verify-reset-code", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ code: code }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Código verificado correctamente", "success");
        showStep(3);
      } else {
        showToast(data.Message || data.error || "Código incorrecto", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de conexión", "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// PASO 3: Restablecer contraseña
const resetPasswordForm = document.getElementById("resetPasswordForm");
if (resetPasswordForm) {
  const newPwd = document.getElementById("newPassword");
  if (newPwd) {
    newPwd.addEventListener("input", function () {
      updatePasswordStrength(this.value, "newPasswordStrength");
    });
  }

  resetPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmNewPassword").value;
    const code = document.getElementById("code").value.trim();

    if (!newPassword || !confirmPassword) {
      showToast("Completa ambos campos de contraseña", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    const submitBtn = resetPasswordForm.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Restableciendo...';
    submitBtn.disabled = true;

    try {
      const headers = { "Content-Type": "application/json" };
      if (resetToken) {
        headers["Authorization"] = `Bearer ${resetToken}`;
      }

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          new_password: newPassword,
          code: code,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Contraseña actualizada. Redirigiendo...", "success");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        showToast(
          data.message || data.error || "Error al restablecer",
          "error",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de conexión", "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ========== LOGIN  ==========
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (response.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        showToast(result.Message || "Error al iniciar sesión", "error");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      showToast("No se pudo conectar con el servidor", "error");
    }
  });
}

// ========== LOGOUT ==========
const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  });
}

// ========== REGISTRO CON VERIFICACIÓN POR CORREO ==========
let preRegisterToken = null;

// Función para mostrar/ocultar pasos (si no existe ya)
function showRegStep(stepNumber) {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  if (step1) step1.style.display = "none";
  if (step2) step2.style.display = "none";
  if (step3) step3.style.display = "none";
  if (stepNumber === 1 && step1) step1.style.display = "block";
  if (stepNumber === 2 && step2) step2.style.display = "block";
  if (stepNumber === 3 && step3) step3.style.display = "block";
  // Opcional: ocultar el footer de login durante los pasos 2 y 3
  const loginFooter = document.getElementById("loginLinkFooter");
  if (loginFooter) {
    loginFooter.style.display = stepNumber === 1 ? "block" : "none";
  }
}

// Paso 1: Enviar datos para pre-registro
const registroForm = document.getElementById("registroForm");
if (registroForm) {
  registroForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if (!fullName || !email || !password || !confirmPassword) {
      showToast("Todos los campos son obligatorios", "error");
      return;
    }
    if (!terms) {
      showToast("Debes aceptar los términos y condiciones", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    const submitBtn = registroForm.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    try {
      const response = await fetch("/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: fullName,
          email: email,
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        preRegisterToken = data.token;
        showToast(data.message, "success");
        showRegStep(2);
        // Limpiar campo de código por si acaso
        document.getElementById("verificationCode").value = "";
      } else {
        showToast(data.message || "Error al enviar el código", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de conexión con el servidor", "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Paso 2: Verificar código y crear cuenta
const verifyForm = document.getElementById("verifyCodeForm");
if (verifyForm) {
  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("verificationCode").value.trim();
    if (!code || code.length !== 6) {
      showToast("Ingresa el código de 6 dígitos", "error");
      return;
    }

    const submitBtn = verifyForm.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;

    try {
      const response = await fetch("/api/verify-and-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: preRegisterToken,
          code: code,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(data.message, "success");
        showRegStep(3);
        // Guardar token de acceso si se quiere login automático (opcional)
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          // Redirigir después de 2 segundos
          setTimeout(() => {
            window.location.href = "/admin/dashboard";
          }, 2000);
        }
      } else {
        showToast(data.message || "Código incorrecto o expirado", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de conexión", "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Reenviar código (opcional)
const resendLink = document.getElementById("resendCodeLink");
if (resendLink) {
  resendLink.addEventListener("click", async (e) => {
    e.preventDefault();
    // Necesitamos el email que se usó en el paso 1. Podríamos guardarlo en una variable global.
    // Por simplicidad, pedimos al usuario que reintente el paso 1.
    showToast(
      "Por favor, vuelve a intentar el registro desde el inicio",
      "info",
    );
    showRegStep(1);
    preRegisterToken = null;
  });
}
