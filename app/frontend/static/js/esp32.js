// frontend/static/js/esp32.js

let esp32EditandoId = null;
let esp32Loading = false;
let todosLosEsp32 = [];
let esp32Filtrados = [];
let esp32PaginaActual = 1;
const esp32ItemsPorPagina = 10;
let esp32IdViendo = null;

// ============================================================
// COOKIES
// ============================================================
function getCookie(name) {
    return document.cookie
        .split("; ")
        .find((r) => r.startsWith(name + "="))
        ?.split("=")[1];
}

// ============================================================
// NOTIFICACIONES
// ============================================================
function notificar(mensaje, tipo = "success") {
    if (typeof showToast === "function") {
        showToast(mensaje, tipo);
    } else {
        alert(mensaje);
    }
}

// ============================================================
// MODAL NUEVA/EDITAR
// ============================================================
function abrirModal(titulo = "Nuevo ESP32", data = null) {
    const modal = document.getElementById("modalEsp32");
    const form = document.getElementById("formEsp32");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("esp32Id").value = "";
    document.getElementById("modalTitle").textContent = titulo;

    const passInput = document.getElementById("password");
    if (passInput) passInput.required = true;

    if (data) {
        document.getElementById("esp32Id").value = data.id_esp32;
        document.getElementById("mac").value = data.mac || "";
        document.getElementById("tipo_dispositivo").value = data.tipo_dispositivo || "";
        document.getElementById("version_firmware").value = data.version_firmware || "";
        document.getElementById("status").value = data.status || "activo";
        if (passInput) passInput.required = false;
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    document.getElementById("btnGuardar").disabled = false;
}

function cerrarModal() {
    const modal = document.getElementById("modalEsp32");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";
    esp32EditandoId = null;
    const btn = document.getElementById("btnGuardar");
    if (btn) btn.disabled = false;
}

// ============================================================
// CARGAR DATOS DESDE EL BACKEND
// ============================================================
async function cargarEsp32() {
    const tbody = document.getElementById("esp32TableBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-cargando">
                    <i class="fas fa-spinner fa-spin"></i> Cargando...
                </td>
            </tr>`;
    }

    try {
        const response = await fetch("/admin/esp32", { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        todosLosEsp32 = data.data || [];
        esp32Filtrados = [...todosLosEsp32];
        esp32PaginaActual = 1;
        renderizarPaginaEsp32();
    } catch (error) {
        console.error("Error al cargar ESP32:", error);
        notificar("Error al cargar dispositivos", "danger");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="tabla-vacia">
                        Error al cargar los dispositivos
                    </td>
                </tr>`;
        }
    }
}

// ============================================================
// RENDERIZAR TABLA
// ============================================================
function renderizarPaginaEsp32() {
    const tbody = document.getElementById("esp32TableBody");
    if (!tbody) return;

    if (esp32Filtrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-vacia">No hay dispositivos ESP32 registrados</td>
            </tr>`;
        actualizarControlesPaginacionEsp32(0);
        return;
    }

    const inicio = (esp32PaginaActual - 1) * esp32ItemsPorPagina;
    const fin = inicio + esp32ItemsPorPagina;
    const pagina = esp32Filtrados.slice(inicio, fin);

    tbody.innerHTML = "";
    pagina.forEach((disp) => {
        const statusClass = disp.status === "activo" ? "status-active" : "status-inactive";
        const statusText = disp.status === "activo" ? "Activo" : (disp.status === "retirado" ? "Retirado" : "Inactivo");

        // Tipo
        let tipoLabel = "Sin asignar";
        let tipoIcon = "fa-question";
        if (disp.tipo_dispositivo === "bus") {
            tipoLabel = "Bus";
            tipoIcon = "fa-bus";
        } else if (disp.tipo_dispositivo === "parada") {
            tipoLabel = "Parada";
            tipoIcon = "fa-map-marker-alt";
        }

        // Info de asignacion
        let asignadoA = "";
        if (disp.vehiculo_placa) {
            asignadoA = ` (${disp.vehiculo_placa})`;
        } else if (disp.parada_nombre) {
            asignadoA = ` (${disp.parada_nombre})`;
        }

        const tr = document.createElement("tr");
        tr.setAttribute("data-tipo", disp.tipo_dispositivo || "");
        tr.setAttribute("data-status", disp.status);
        tr.innerHTML = `
            <td><strong>ESP32-${String(disp.id_esp32).padStart(3, "0")}</strong></td>
            <td>${disp.mac}</td>
            <td><i class="fas ${tipoIcon}" style="color: var(--azul); margin-right: 6px;"></i>${tipoLabel}${asignadoA}</td>
            <td>${disp.version_firmware || "N/A"}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas fa-circle"></i> ${statusText}
                </span>
            </td>
            <td class="action-buttons">
                <button class="action-btn view" data-id="${disp.id_esp32}" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${disp.id_esp32}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${disp.id_esp32}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    asignarEventosTablaEsp32();
    actualizarControlesPaginacionEsp32(esp32Filtrados.length);
}

function actualizarControlesPaginacionEsp32(totalItems) {
    const totalPaginas = Math.max(1, Math.ceil(totalItems / esp32ItemsPorPagina));
    const info = document.getElementById("infoPagina");
    const btnPrev = document.getElementById("btnAnterior");
    const btnNext = document.getElementById("btnSiguiente");

    if (info) info.textContent = `Pagina ${esp32PaginaActual} de ${totalPaginas}`;
    if (btnPrev) btnPrev.disabled = esp32PaginaActual === 1;
    if (btnNext) btnNext.disabled = esp32PaginaActual >= totalPaginas;
}

// ============================================================
// EVENTOS TABLA
// ============================================================
function asignarEventosTablaEsp32() {
    document.querySelectorAll(".action-btn.view").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            verEsp32(this.getAttribute("data-id"));
        };
    });
    document.querySelectorAll(".action-btn.edit").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            editarEsp32(this.getAttribute("data-id"));
        };
    });
    document.querySelectorAll(".action-btn.delete").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            eliminarEsp32(this.getAttribute("data-id"));
        };
    });
}

// ============================================================
// VER
// ============================================================
function verEsp32(id) {
    const disp = todosLosEsp32.find((d) => String(d.id_esp32) === String(id));
    if (!disp) return;

    esp32IdViendo = id;
    const statusClass = disp.status === "activo" ? "status-active" : "status-inactive";
    const statusText = disp.status === "activo" ? "Activo" : (disp.status === "retirado" ? "Retirado" : "Inactivo");

    let tipoLabel = "Sin asignar";
    if (disp.tipo_dispositivo === "bus") tipoLabel = "Bus";
    else if (disp.tipo_dispositivo === "parada") tipoLabel = "Parada";

    document.getElementById("verEsp32Id").textContent = `ESP32-${String(disp.id_esp32).padStart(3, "0")}`;
    document.getElementById("verEsp32Mac").textContent = disp.mac || "-";
    document.getElementById("verEsp32Tipo").textContent = tipoLabel;
    document.getElementById("verEsp32Firmware").textContent = disp.version_firmware || "N/A";
    document.getElementById("verEsp32Estado").textContent = statusText;

    const badge = document.getElementById("verEsp32EstadoBadge");
    badge.className = "status-badge";
    badge.classList.add(statusClass);

    document.getElementById("modalVerEsp32").classList.add("show");
}

function cerrarModalVerEsp32() {
    document.getElementById("modalVerEsp32").classList.remove("show");
    esp32IdViendo = null;
}

function editarDesdeVerEsp32() {
    const id = esp32IdViendo;
    cerrarModalVerEsp32();
    if (id) editarEsp32(id);
}

// ============================================================
// EDITAR
// ============================================================
function editarEsp32(id) {
    const disp = todosLosEsp32.find((d) => String(d.id_esp32) === String(id));
    if (!disp) return;
    esp32EditandoId = id;
    abrirModal("Editar ESP32", disp);
}

// ============================================================
// GUARDAR (POST o PUT)
// ============================================================
async function guardarEsp32(e) {
    e.preventDefault();
    if (esp32Loading) return;

    const id = document.getElementById("esp32Id").value;
    const mac = document.getElementById("mac").value.trim().toUpperCase();
    const password = document.getElementById("password").value;
    const tipo = document.getElementById("tipo_dispositivo").value;
    const firmware = document.getElementById("version_firmware").value.trim();
    const status = document.getElementById("status").value;

    if (!mac || !tipo) {
        notificar("MAC y tipo son obligatorios", "warning");
        return;
    }

    if (!id && !password) {
        notificar("La contrasena es obligatoria al crear", "warning");
        return;
    }

    if (password && password.length < 6) {
        notificar("La contrasena debe tener al menos 6 caracteres", "warning");
        return;
    }

    esp32Loading = true;
    document.getElementById("btnGuardar").disabled = true;

    const datos = {
        mac: mac,
        tipo_dispositivo: tipo,
        version_firmware: firmware || null,
        status: status,
    };

    if (password) {
        datos.password = password;
    }

    try {
        const csrfToken = getCookie("csrf_access_token");
        const url = id ? `/admin/esp32/${id}` : "/admin/esp32";
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify(datos),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            notificar(id ? "Dispositivo actualizado" : "Dispositivo creado", "success");
            cerrarModal();
            cargarEsp32();
        } else {
            notificar(result.error || result.message || "Error al guardar", "danger");
        }
    } catch (error) {
        console.error("Error al guardar ESP32:", error);
        notificar("Error de conexion al servidor", "danger");
    } finally {
        esp32Loading = false;
        document.getElementById("btnGuardar").disabled = false;
    }
}

// ============================================================
// ELIMINAR
// ============================================================
async function eliminarEsp32(id) {
    let confirmado = false;
    if (typeof confirmDelete === "function") {
        confirmado = await confirmDelete(
            "Eliminar dispositivo ESP32?",
            "El dispositivo dejara de enviar lecturas al sistema."
        );
    } else {
        confirmado = confirm("Eliminar dispositivo ESP32?");
    }
    if (!confirmado) return;

    try {
        const csrfToken = getCookie("csrf_access_token");
        const response = await fetch(`/admin/esp32/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "X-CSRF-TOKEN": csrfToken,
            },
        });

        const result = await response.json();

        if (response.ok && result.success) {
            notificar("Dispositivo eliminado", "success");
            cargarEsp32();
        } else {
            notificar(result.error || "Error al eliminar", "danger");
        }
    } catch (error) {
        console.error("Error al eliminar ESP32:", error);
        notificar("Error de conexion al servidor", "danger");
    }
}

// ============================================================
// FILTROS
// ============================================================
function aplicarFiltrosEsp32() {
    const searchTerm = document.getElementById("searchEsp32")?.value?.toLowerCase() || "";
    const filterTipo = document.getElementById("filterTipo")?.value || "";
    const filterStatus = document.getElementById("filterStatus")?.value || "";

    esp32Filtrados = todosLosEsp32.filter((disp) => {
        const mac = (disp.mac || "").toLowerCase();
        const tipo = disp.tipo_dispositivo || "";
        const status = disp.status || "";

        if (searchTerm && !mac.includes(searchTerm)) return false;
        if (filterTipo && tipo !== filterTipo) return false;
        if (filterStatus && status !== filterStatus) return false;
        return true;
    });

    esp32PaginaActual = 1;
    renderizarPaginaEsp32();
}

// ============================================================
// INICIALIZACION
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btnNuevoEsp32")?.addEventListener("click", () => {
        esp32EditandoId = null;
        abrirModal("Nuevo ESP32");
    });

    const form = document.getElementById("formEsp32");
    if (form) {
        form.addEventListener("submit", guardarEsp32);
    }

    // Cerrar modales
    window.addEventListener("click", (event) => {
        const modal = document.getElementById("modalEsp32");
        if (event.target === modal) cerrarModal();

        const modalVer = document.getElementById("modalVerEsp32");
        if (event.target === modalVer) cerrarModalVerEsp32();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("modalEsp32");
            if (modal && modal.classList.contains("show")) cerrarModal();

            const modalVer = document.getElementById("modalVerEsp32");
            if (modalVer && modalVer.classList.contains("show")) cerrarModalVerEsp32();
        }
    });

    // Filtros
    document.getElementById("searchEsp32")?.addEventListener("input", aplicarFiltrosEsp32);
    document.getElementById("filterTipo")?.addEventListener("change", aplicarFiltrosEsp32);
    document.getElementById("filterStatus")?.addEventListener("change", aplicarFiltrosEsp32);

    // Paginacion
    document.getElementById("btnAnterior")?.addEventListener("click", () => {
        if (esp32PaginaActual > 1) {
            esp32PaginaActual--;
            renderizarPaginaEsp32();
        }
    });
    document.getElementById("btnSiguiente")?.addEventListener("click", () => {
        const totalPaginas = Math.max(1, Math.ceil(esp32Filtrados.length / esp32ItemsPorPagina));
        if (esp32PaginaActual < totalPaginas) {
            esp32PaginaActual++;
            renderizarPaginaEsp32();
        }
    });

    cargarEsp32();
});