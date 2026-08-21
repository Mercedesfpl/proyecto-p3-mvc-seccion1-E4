// frontend/static/js/base.js

// ========================================
// MANEJO DE INTERFAZ Y COMPONENTES (DOM)
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // DROPDOWN DEL USUARIO (mostrar/ocultar)
  const userDropdown = document.getElementById("userDropdown");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationsPanel = document.getElementById("notificationsPanel");

  if (userDropdown && dropdownMenu) {
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dropdownMenu.style.display === "block") {
        dropdownMenu.style.display = "none";
      } else {
        dropdownMenu.style.display = "block";
        if (notificationsPanel) notificationsPanel.style.display = "none";
      }
    });
  }

  // PANEL DE NOTIFICACIONES
  if (notificationBtn && notificationsPanel) {
    notificationBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (notificationsPanel.style.display === "block") {
        notificationsPanel.style.display = "none";
      } else {
        notificationsPanel.style.display = "block";
        if (dropdownMenu) dropdownMenu.style.display = "none";
      }
    });
  }

  // CERRAR DROPDOWNS AL HACER CLIC FUERA
  document.addEventListener("click", function (e) {
    if (dropdownMenu && dropdownMenu.style.display === "block") {
      if (!userDropdown.contains(e.target)) {
        dropdownMenu.style.display = "none";
      }
    }
    if (notificationsPanel && notificationsPanel.style.display === "block") {
      if (!notificationBtn.contains(e.target)) {
        notificationsPanel.style.display = "none";
      }
    }
  });

  // MARCAR NOTIFICACIONES COMO LEÍDAS (Efecto visual UI)
  const markReadBtn = document.querySelector(".mark-read");
  if (markReadBtn) {
    markReadBtn.addEventListener("click", function () {
      const unreadItems = document.querySelectorAll(".notification-item.unread");
      unreadItems.forEach((item) => {
        item.classList.remove("unread");
      });

      const badge = document.querySelector(".notification-badge");
      if (badge) {
        badge.textContent = "0";
        badge.style.opacity = "0.5";
      }

      this.style.opacity = "0.6";
      setTimeout(() => {
        this.style.opacity = "1";
      }, 200);
    });
  }

  // EFECTOS VISUALES EN TARJETAS Y KPIs
  const cards = document.querySelectorAll(".kpi-card, .card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    });
  });

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

  // EFECTO EN FILTROS
  const filterSelects = document.querySelectorAll(".filter-select");
  filterSelects.forEach((select) => {
    select.addEventListener("change", function () {
      this.style.opacity = "0.7";
      setTimeout(() => {
        this.style.opacity = "1";
      }, 200);
    });
  });

  // EFECTO EN BOTONES
  const btns = document.querySelectorAll(".btn-primary, .btn-secondary");
  btns.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 150);
    });
  });

  // CONTROL DE PERMISOS DE VISTA POR ROL
  toggleAdminOnlyElements();
});

// ========================================
// INTERCEPTOR FETCH GLOBAL (Manejo de 401)
// ========================================

const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  if (response.status === 401) {
    let errorData = {};
    try {
      errorData = await response.clone().json();
    } catch (e) {
      errorData = { message: await response.clone().text() };
    }

    const mensaje = errorData.Message || "Tu sesión ha expirado. Inicia sesión nuevamente.";

    // Usa el showToast definido en notifications.js
    if (typeof window.showToast === "function") {
      window.showToast(mensaje, "warning");
    } else {
      alert(mensaje);
    }

    const redirectUrl = errorData.redirect_url || "/";
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);

    throw new Error("No autorizado");
  }
  return response;
};

// LOGOUT
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

// ========================================
// UTILIDADES Y FUNCIONES COMUNES CRUD
// ========================================

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

function openModal(title, fields, data = {}) {
  const modal = document.getElementById("genericModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  if (!modal) return;

  modalTitle.textContent = title;
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
    `
    )
    .join("");

  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("genericModal");
  if (modal) modal.style.display = "none";
}

function renderTable(containerId, columns, data, actions = true) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const thead = `<thead><tr>${columns
    .map((col) => `<th>${col.label}</th>`)
    .join("")}${actions ? "<th>Acciones</th>" : ""}</tr></thead>`;

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
        </tr>`
          )
          .join("")}
    </tbody>`;

  container.innerHTML = `<table class="data-table">${thead}${tbody}</table>`;
}

function getUserRole() {
  const body = document.body;
  return body.getAttribute("data-user-rol") || null;
}

function toggleAdminOnlyElements() {
  const role = getUserRole();
  const adminElements = document.querySelectorAll(".admin-only");

  if (role === "admin") {
    adminElements.forEach((el) => (el.style.display = ""));
  } else {
    adminElements.forEach((el) => (el.style.display = "none"));
  }
}