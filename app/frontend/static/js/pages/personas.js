// ============================================================
// PÁGINA DE PERSONAS - CRUD completo
// ============================================================

let editandoId = null;
let loading = false;
let todasLasPersonas = [];
let personasFiltradas = [];
let paginaActual = 1;
const itemsPorPagina = 10;
let idPersonaViendo = null;

// ============================================================
// 1. HELPERS
// ============================================================
function mostrarNotificacion(mensaje, tipo = "success") {
    if (typeof showToast === "function") {
        showToast(mensaje, tipo);
        return;
    }
    alert(mensaje);
}

function getBadgeForRol(rol) {
    if (!rol) return '<span class="badge badge-sin-rol">Sin rol</span>';

    const map = {
        admin: "badge-admin",
        administrador: "badge-administrador",
        presidente: "badge-presidente",
        secretario: "badge-secretario",
    };
    const clase = map[rol.toLowerCase()] || "badge-sin-rol";

    const nombreMostrar = {
        admin: "Admin",
        administrador: "Admin",
        presidente: "Presidente",
        secretario: "Secretario",
    };
    return `<span class="badge ${clase}">${nombreMostrar[rol] || rol}</span>`;
}

// ============================================================
// 2. MODAL NUEVA / EDITAR PERSONA
// ============================================================
function abrirModal(titulo, data = null) {
    const modal = document.getElementById("personaModal");
    if (!modal) return;

    document.getElementById("modalTitle").textContent = titulo;

    if (data) {
        document.getElementById("nombre").value = data.nombre || "";
        document.getElementById("apellido").value = data.apellido || "";
        document.getElementById("cedula").value = data.cedula || "";
        document.getElementById("correo").value = data.correo || "";
        document.getElementById("telefono").value = data.telefono || "";
        document.getElementById("rol").value = data.rol || "";
    } else {
        document.getElementById("personaForm").reset();
        document.getElementById("rol").value = "";
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    document.getElementById("btnGuardar").disabled = false;
}

function cerrarModal() {
    const modal = document.getElementById("personaModal");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";
    editandoId = null;
    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) btnGuardar.disabled = false;
}

// ============================================================
// 3. CARGAR PERSONAS
// ============================================================
async function cargarPersonas() {
    const tbody = document.getElementById("personasTableBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-cargando">
                    <i class="fas fa-spinner fa-spin"></i> Cargando...
                </td>
            </tr>`;
    }

    try {
        const response = await fetch("/admin/personas", {
            credentials: "include",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        todasLasPersonas = Array.isArray(data.data) ? data.data : [];
        personasFiltradas = [...todasLasPersonas];
        paginaActual = 1;
        renderizarPagina();
    } catch (error) {
        console.error("Error al cargar personas:", error);
        mostrarNotificacion("Error al cargar personas", "danger");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="tabla-vacia">Error al cargar datos</td>
                </tr>`;
        }
    }
}

// ============================================================
// 4. RENDERIZAR PÁGINA
// ============================================================
function renderizarPagina() {
    const tbody = document.getElementById("personasTableBody");
    if (!tbody) return;

    if (personasFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-vacia">No hay personas que coincidan</td>
            </tr>`;
        actualizarControlesPaginacion(0);
        return;
    }

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const pagina = personasFiltradas.slice(inicio, fin);

    tbody.innerHTML = "";
    pagina.forEach((p) => {
        const nombre = p.nombre_completo || `${p.nombre || ""} ${p.apellido || ""}`.trim();
        const tr = document.createElement("tr");
        tr.setAttribute("data-rol", p.rol || "");
        tr.innerHTML = `
            <td><strong>PER-${String(p.id).padStart(3, "0")}</strong></td>
            <td>${nombre}</td>
            <td>${p.cedula || "-"}</td>
            <td>${p.correo || "-"}</td>
            <td>${getBadgeForRol(p.rol)}</td>
            <td class="action-buttons">
                <button class="action-btn view" data-id="${p.id}" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${p.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${p.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    asignarEventosTabla();
    actualizarControlesPaginacion(personasFiltradas.length);
}

function actualizarControlesPaginacion(totalItems) {
    const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
    const info = document.getElementById("infoPagina");
    const btnPrev = document.getElementById("btnAnterior");
    const btnNext = document.getElementById("btnSiguiente");

    if (info) info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    if (btnPrev) btnPrev.disabled = paginaActual === 1;
    if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
}

// ============================================================
// 5. EVENTOS DE LA TABLA
// ============================================================
function asignarEventosTabla() {
    document.querySelectorAll(".action-btn.view").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            verPersona(this.getAttribute("data-id"));
        };
    });
    document.querySelectorAll(".action-btn.edit").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            editarPersona(this.getAttribute("data-id"));
        };
    });
    document.querySelectorAll(".action-btn.delete").forEach((btn) => {
        btn.onclick = function (e) {
            e.stopPropagation();
            eliminarPersona(this.getAttribute("data-id"));
        };
    });
}

// ============================================================
// 6. VER PERSONA
// ============================================================
async function verPersona(id) {
    try {
        const response = await fetch(`/admin/personas/${id}`, {
            credentials: "include",
        });
        const data = await response.json();

        if (!data.success || !data.data) {
            mostrarNotificacion("Persona no encontrada", "danger");
            return;
        }

        const p = data.data;
        idPersonaViendo = id;

        const nombre = p.nombre_completo || `${p.nombre || ""} ${p.apellido || ""}`.trim();

        document.getElementById("verPersonaId").textContent = `PER-${String(p.id).padStart(3, "0")}`;
        document.getElementById("verPersonaNombre").textContent = nombre || "-";
        document.getElementById("verPersonaCedula").textContent = p.cedula || "-";
        document.getElementById("verPersonaCorreo").textContent = p.correo || "-";
        document.getElementById("verPersonaTelefono").textContent = p.telefono || "-";
        document.getElementById("verPersonaRol").innerHTML = getBadgeForRol(p.rol);

        document.getElementById("modalVerPersona").classList.add("show");
    } catch (error) {
        console.error("Error al ver persona:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
    }
}

function cerrarModalVerPersona() {
    const modal = document.getElementById("modalVerPersona");
    if (modal) modal.classList.remove("show");
    idPersonaViendo = null;
}

function editarDesdeVerPersona() {
    const id = idPersonaViendo;
    cerrarModalVerPersona();
    if (id) editarPersona(id);
}

// ============================================================
// 7. EDITAR PERSONA
// ============================================================
async function editarPersona(id) {
    try {
        const response = await fetch(`/admin/personas/${id}`, {
            credentials: "include",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.data) throw new Error("Datos inválidos");

        editandoId = id;
        abrirModal("Editar Persona", data.data);
    } catch (error) {
        console.error("Error al cargar persona:", error);
        mostrarNotificacion("Error al cargar la persona", "danger");
    }
}

// ============================================================
// 8. ELIMINAR PERSONA
// ============================================================
async function eliminarPersona(id) {
    if (!confirm("¿Deseas eliminar esta persona? Esta acción no se puede deshacer.")) return;

    try {
        const csrfToken = getCookie("csrf_access_token");
        const response = await fetch(`/admin/personas/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: { "X-CSRF-TOKEN": csrfToken },
        });
        const data = await response.json();

        if (response.ok && data.success) {
            mostrarNotificacion("Persona eliminada exitosamente", "success");
            cargarPersonas();
        } else {
            mostrarNotificacion(data.error || data.message || "Error al eliminar", "danger");
        }
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion("Error de conexión al servidor", "danger");
    }
}

// ============================================================
// 9. FILTROS
// ============================================================
function aplicarFiltros() {
    const searchTerm = document.getElementById("searchPersona")?.value?.toLowerCase() || "";
    const filterRol = document.getElementById("filterRol")?.value || "";

    personasFiltradas = todasLasPersonas.filter((p) => {
        const nombre = (p.nombre_completo || `${p.nombre || ""} ${p.apellido || ""}`).toLowerCase();
        const cedula = (p.cedula || "").toLowerCase();
        const correo = (p.correo || "").toLowerCase();
        const rol = p.rol || "";

        if (
            searchTerm &&
            !nombre.includes(searchTerm) &&
            !cedula.includes(searchTerm) &&
            !correo.includes(searchTerm)
        )
            return false;
        if (filterRol && rol !== filterRol) return false;
        return true;
    });

    paginaActual = 1;
    renderizarPagina();
}

// ============================================================
// 10. INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("personaForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (loading) return;
            loading = true;
            document.getElementById("btnGuardar").disabled = true;

            const datos = {
                nombre: document.getElementById("nombre").value.trim(),
                apellido: document.getElementById("apellido").value.trim(),
                cedula: document.getElementById("cedula").value.trim(),
                correo: document.getElementById("correo").value.trim(),
                telefono: document.getElementById("telefono").value.trim(),
                rol: document.getElementById("rol").value,
            };

            if (!datos.nombre || !datos.apellido || !datos.cedula) {
                mostrarNotificacion("Nombre, apellido y cédula son obligatorios", "warning");
                loading = false;
                document.getElementById("btnGuardar").disabled = false;
                return;
            }
            if (!datos.rol) {
                mostrarNotificacion("Debes seleccionar un rol", "warning");
                loading = false;
                document.getElementById("btnGuardar").disabled = false;
                return;
            }

            const url = editandoId ? `/admin/personas/${editandoId}` : "/admin/personas";
            const method = editandoId ? "PUT" : "POST";
            const csrfToken = getCookie("csrf_access_token");

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                    body: JSON.stringify(datos),
                });

                const data = await response.json();

                if (response.ok) {
                    mostrarNotificacion(
                        editandoId ? "Persona actualizada" : "Persona creada exitosamente",
                        "success"
                    );
                    cerrarModal();
                    cargarPersonas();
                } else {
                    mostrarNotificacion(data.error || data.message || "Error al guardar", "danger");
                }
            } catch (error) {
                console.error("Error:", error);
                mostrarNotificacion("Error de conexión al servidor", "danger");
            } finally {
                loading = false;
                document.getElementById("btnGuardar").disabled = false;
            }
        });
    }

    const btnNueva = document.getElementById("btnNuevaPersona");
    if (btnNueva) {
        btnNueva.onclick = function () {
            editandoId = null;
            abrirModal("Nueva Persona");
        };
    }

    window.addEventListener("click", function (event) {
        const modal = document.getElementById("personaModal");
        if (event.target === modal) cerrarModal();

        const modalVer = document.getElementById("modalVerPersona");
        if (event.target === modalVer) cerrarModalVerPersona();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const modal = document.getElementById("personaModal");
            if (modal && modal.classList.contains("show")) cerrarModal();

            const modalVer = document.getElementById("modalVerPersona");
            if (modalVer && modalVer.classList.contains("show")) cerrarModalVerPersona();
        }
    });

    document.getElementById("searchPersona")?.addEventListener("input", aplicarFiltros);
    document.getElementById("filterRol")?.addEventListener("change", aplicarFiltros);

    document.getElementById("btnAnterior")?.addEventListener("click", () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarPagina();
        }
    });
    document.getElementById("btnSiguiente")?.addEventListener("click", () => {
        const totalPaginas = Math.max(1, Math.ceil(personasFiltradas.length / itemsPorPagina));
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarPagina();
        }
    });

    cargarPersonas();
});