// frontend/static/js/base.js

window.mostrarToast = function (message, type = "error") {
  // Tu implementación actual de toast
  const toast = document.getElementById("toastMessage");
  if (toast) {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 4000);
  } else {
    console.error("Toast element not found", message);
  }
};
document.addEventListener("DOMContentLoaded", function () {
  //  DROPDOWN DEL USUARIO (mostrar/ocultar)
  const userDropdown = document.getElementById("userDropdown");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (userDropdown && dropdownMenu) {
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
      // Alternar visibilidad
      if (dropdownMenu.style.display === "block") {
        dropdownMenu.style.display = "none";
      } else {
        dropdownMenu.style.display = "block";
        // Si el panel de notificaciones está abierto, lo cierro
        if (notificationsPanel) notificationsPanel.style.display = "none";
      }
    });
  }

  //  PANEL DE NOTIFICACIONES (mostrar/ocultar)
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationsPanel = document.getElementById("notificationsPanel");

  if (notificationBtn && notificationsPanel) {
    notificationBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      // Alternar visibilidad
      if (notificationsPanel.style.display === "block") {
        notificationsPanel.style.display = "none";
      } else {
        notificationsPanel.style.display = "block";
        // Si el dropdown está abierto, lo cierro
        if (dropdownMenu) dropdownMenu.style.display = "none";
      }
    });
  }

  //  CERRAR AL HACER CLIC FUERA
  document.addEventListener("click", function (e) {
    // Cerrar dropdown si se clica fuera
    if (dropdownMenu && dropdownMenu.style.display === "block") {
      if (!userDropdown.contains(e.target)) {
        dropdownMenu.style.display = "none";
      }
    }
    // Cerrar notificaciones si se clica fuera
    if (notificationsPanel && notificationsPanel.style.display === "block") {
      if (!notificationBtn.contains(e.target)) {
        notificationsPanel.style.display = "none";
      }
    }
  });

  //  EFECTO: MARCAR NOTIFICACIONES COMO LEÍDAS
  const markReadBtn = document.querySelector(".mark-read");
  if (markReadBtn) {
    markReadBtn.addEventListener("click", function () {
      // Quitar la clase "unread" de todas las notificaciones
      const unreadItems = document.querySelectorAll(
        ".notification-item.unread",
      );
      unreadItems.forEach((item) => {
        item.classList.remove("unread");
      });

      const badge = document.querySelector(".notification-badge");
      if (badge) {
        badge.textContent = "0";
        badge.style.opacity = "0.5";
      }

      // Pequeño efecto visual
      this.style.opacity = "0.6";
      setTimeout(() => {
        this.style.opacity = "1";
      }, 200);
    });
  }

  //  EFECTO: HOVER EN TARJETAS
  const cards = document.querySelectorAll(".kpi-card, .card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    });
  });

  //  ANIMACIÓN  AL CARGAR LAS TARJETAS
  const kpis = document.querySelectorAll(".kpi-card");
  kpis.forEach((kpi, index) => {
    kpi.style.opacity = "0";
    kpi.style.transform = "translateY(20px)";
    setTimeout(() => {
      kpi.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      kpi.style.opacity = "1";
      kpi.style.transform = "translateY(0)";
    }, index * 50);
  });

  //  EFECTO EN LOS FILTROS
  const filterSelects = document.querySelectorAll(".filter-select");
  filterSelects.forEach((select) => {
    select.addEventListener("change", function () {
      // Pequeño efecto visual de "cargando"
      this.style.opacity = "0.7";
      setTimeout(() => {
        this.style.opacity = "1";
      }, 200);
    });
  });

  //  EFECTO EN BOTONES
  const btns = document.querySelectorAll(".btn-primary, .btn-secondary");
  btns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      // Efecto de clic
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 150);
    });
  });
});

// Interceptor global para manejar errores de autenticación (401)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  console.log("🔵 Interceptor activado - Petición a:", args[0]);
  const response = await originalFetch.apply(this, args);
  console.log("🟢 Respuesta recibida - Status:", response.status);

  if (response.status === 401) {
    console.log("🔴 401 detectado - Procesando...");
    let errorData = {};
    try {
      errorData = await response.clone().json();
    } catch (e) {
      errorData = { message: await response.clone().text() };
    }

    const mensaje =
      errorData.Message || "Tu sesión ha expirado. Inicia sesión nuevamente.";
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast(mensaje, "warning");
    } else {
      alert(mensaje);
    }

    // Redirigir después de un pequeño retraso para ver el toast
    const redirectUrl = errorData.redirect_url || "/";
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);

    throw new Error("No autorizado");
  }
  return response;
};

//  LOGOUT
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

//  FUNCIONES COMUNES PARA TODOS LOS CRUD

// Mostrar notificación
function showToast(message, type = "success") {
  const toast = document.getElementById("toastMessage");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-message ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Petición genérica a la API
async function fetchAPI(url, method = "GET", body = null) {
  const options = {
    method: method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error en la petición");
  }
  return data;
}

// Abrir modal genérico
function openModal(title, fields, data = {}) {
  const modal = document.getElementById("genericModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  modalTitle.textContent = title;

  // Generar campos dinámicamente
  modalBody.innerHTML = fields
    .map(
      (field) => `
        <div class="form-group">
            <label>${field.label}</label>
            <input type="${field.type || "text"}" 
                   id="${field.name}" 
                   name="${field.name}" 
                   class="form-input" 
                   value="${data[field.name] || ""}"
                   ${field.required ? "required" : ""}>
        </div>
    `,
    )
    .join("");

  modal.style.display = "block";
}

// Cerrar modal
function closeModal() {
  document.getElementById("genericModal").style.display = "none";
}

// Cargar datos en tabla genérica
function renderTable(containerId, columns, data, actions = true) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const thead = `<thead><tr>${columns.map((col) => `<th>${col.label}</th>`).join("")}${actions ? "<th>Acciones</th>" : ""}</tr></thead>`;

  const tbody = `<tbody>
        ${data
          .map(
            (row) => `<tr>
            ${columns.map((col) => `<td>${row[col.field] || "-"}</td>`).join("")}
            ${
              actions
                ? `<td>
                <button class="btn-edit" data-id="${row.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" data-id="${row.id}"><i class="fas fa-trash"></i></button>
            </td>`
                : ""
            }
        </tr>`,
          )
          .join("")}
    </tbody>`;

  container.innerHTML = `<table class="data-table">${thead}${tbody}</table>`;
}

// Obtener el rol del usuario actual (desde el DOM o desde una API)
function getUserRole() {
  // Opción 1: Si el rol está en un data attribute del body
  const body = document.body;
  if (body.getAttribute("data-user-rol")) {
    return body.getAttribute("data-user-rol");
  }
  return null;
}

// Mostrar/ocultar elementos según el rol
function toggleAdminOnlyElements() {
  const role = getUserRole();
  const adminElements = document.querySelectorAll(".admin-only");

  if (role === "admin") {
    adminElements.forEach((el) => (el.style.display = ""));
  } else {
    adminElements.forEach((el) => (el.style.display = "none"));
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  toggleAdminOnlyElements();
});

// aplica el modo oscuro
document.addEventListener("DOMContentLoaded", function () {
  // Cargar tema guardado en localStorage
  const tema = localStorage.getItem("theme") || "claro";
  if (tema === "oscuro") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
});
