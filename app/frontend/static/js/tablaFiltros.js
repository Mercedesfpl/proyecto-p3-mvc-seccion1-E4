// frontend/static/js/tablaFiltros.js
// Filtros por columna tipo Excel para cualquier .data-table
// Modo "opción B": emite eventos para que la página filtre sobre la data completa.

(function () {
  let dropdownActual = null;

  // Estado de filtros por tabla
  const filtrosPorTabla = new WeakMap();

  /**
   * Inicializa los íconos de filtro en todas las tablas con th[data-col]
   */
  function inicializarFiltros() {
    document.querySelectorAll("table.data-table").forEach((tabla) => {
      if (tabla.dataset.filtrosInit === "true") return;
      tabla.dataset.filtrosInit = "true";

      if (!filtrosPorTabla.has(tabla)) {
        filtrosPorTabla.set(tabla, {});
      }

      tabla.querySelectorAll("th[data-col]").forEach((th) => {
        const icono = th.querySelector(".th-filter-icon");
        if (!icono) return;

        const col = th.dataset.col;
        // Evitar duplicar listeners
        if (icono.dataset.listener === "true") return;
        icono.dataset.listener = "true";

        icono.addEventListener("click", (e) => {
          e.stopPropagation();
          abrirDropdownFiltro(tabla, col, icono);
        });
      });

      // Restaurar estado visual si ya había filtros
      const filtros = filtrosPorTabla.get(tabla) || {};
      Object.keys(filtros).forEach((col) => actualizarIcono(tabla, col));
    });
  }

  /**
   * Abre el dropdown para una columna
   */
  function abrirDropdownFiltro(tabla, col, icono) {
    cerrarDropdown();

    const dropdown = document.createElement("div");
    dropdown.className = "col-filter-dropdown";

    // Título
    const title = document.createElement("div");
    title.className = "col-filter-title";
    title.textContent = `Filtrar: ${col}`;
    dropdown.appendChild(title);

    const valores = obtenerValoresUnicos(tabla, col);
    const filtrosActuales = filtrosPorTabla.get(tabla) || {};
    const seleccionadosActuales = Array.isArray(filtrosActuales[col])
      ? filtrosActuales[col]
      : null;

    // Siempre mostramos checkboxes (multiselección)
    const optionsDiv = document.createElement("div");
    optionsDiv.className = "col-filter-options";

    // Opción "Seleccionar todos"
    const todosLabel = document.createElement("label");
    todosLabel.className = "col-filter-option";
    const todosCheckbox = document.createElement("input");
    todosCheckbox.type = "checkbox";
    todosCheckbox.checked = !seleccionadosActuales;
    const todosSpan = document.createElement("span");
    todosSpan.innerHTML = "<strong>(Todos)</strong>";
    todosLabel.appendChild(todosCheckbox);
    todosLabel.appendChild(todosSpan);
    optionsDiv.appendChild(todosLabel);

    // Separador visual
    const hr = document.createElement("div");
    hr.style.height = "1px";
    hr.style.background = "var(--borde, #e2e8f0)";
    hr.style.margin = "4px 0";
    optionsDiv.appendChild(hr);

    valores.forEach((valor) => {
      const label = document.createElement("label");
      label.className = "col-filter-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = valor;
      checkbox.checked = !seleccionadosActuales || seleccionadosActuales.includes(valor);

      const span = document.createElement("span");
      span.textContent = valor || "(vacío)";

      label.appendChild(checkbox);
      label.appendChild(span);
      optionsDiv.appendChild(label);
    });

    // Listener del "Seleccionar todos"
    todosCheckbox.addEventListener("change", () => {
      const marcar = todosCheckbox.checked;
      optionsDiv.querySelectorAll('input[type="checkbox"]:not([data-todos])').forEach((cb) => {
        cb.checked = marcar;
      });
      // Quitar filtro de esa columna
      if (marcar) {
        limpiarFiltro(tabla, col);
      } else {
        aplicarCheckboxes(tabla, col, optionsDiv);
      }
    });
    todosCheckbox.setAttribute("data-todos", "true");

    // Listener en cada checkbox → aplicar al instante
    optionsDiv.querySelectorAll('input[type="checkbox"]:not([data-todos])').forEach((cb) => {
      cb.addEventListener("change", () => {
        // Si todos están marcados → quitar filtro
        const todos = Array.from(optionsDiv.querySelectorAll('input[type="checkbox"]:not([data-todos])'));
        const todosMarcados = todos.every((c) => c.checked);
        todosCheckbox.checked = todosMarcados;
        aplicarCheckboxes(tabla, col, optionsDiv);
      });
    });

    dropdown.appendChild(optionsDiv);

    // Acciones
    const actions = document.createElement("div");
    actions.className = "col-filter-actions";

    const btnLimpiar = document.createElement("button");
    btnLimpiar.className = "col-filter-btn clear";
    btnLimpiar.textContent = "Limpiar";
    btnLimpiar.addEventListener("click", () => {
      limpiarFiltro(tabla, col);
      cerrarDropdown();
    });

    actions.appendChild(btnLimpiar);
    dropdown.appendChild(actions);

    // Posicionar
    const rect = icono.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 6}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.classList.add("show");

    document.body.appendChild(dropdown);
    dropdownActual = dropdown;

    // Cerrar al hacer click fuera (excepto clics en el mismo dropdown)
    setTimeout(() => {
      document.addEventListener("click", cerrarAlClickFuera);
    }, 0);
  }

  function cerrarAlClickFuera(e) {
    if (dropdownActual && !dropdownActual.contains(e.target)) {
      cerrarDropdown();
    }
  }

  /**
   * Aplica el estado de los checkboxes → emite evento
   */
  function aplicarCheckboxes(tabla, col, optionsDiv) {
    const checkboxes = Array.from(
      optionsDiv.querySelectorAll('input[type="checkbox"]:not([data-todos])')
    );
    const marcados = checkboxes.filter((cb) => cb.checked).map((cb) => cb.value);

    const filtros = filtrosPorTabla.get(tabla) || {};

    // Si TODOS están marcados, no hay filtro para esta columna
    if (marcados.length === checkboxes.length) {
      delete filtros[col];
    } else {
      filtros[col] = marcados;
    }

    filtrosPorTabla.set(tabla, filtros);
    actualizarIcono(tabla, col);
    emitirCambio(tabla);
  }

  /**
   * Limpia el filtro de una columna
   */
  function limpiarFiltro(tabla, col) {
    const filtros = filtrosPorTabla.get(tabla) || {};
    delete filtros[col];
    filtrosPorTabla.set(tabla, filtros);
    actualizarIcono(tabla, col);
    emitirCambio(tabla);
  }

  /**
   * Emite el evento personalizado con los filtros actuales
   */
  function emitirCambio(tabla) {
    const filtros = filtrosPorTabla.get(tabla) || {};
    const evento = new CustomEvent("filtrosCambiados", {
      detail: { filtros: { ...filtros } },
    });
    tabla.dispatchEvent(evento);
  }

  /**
   * Lee los valores únicos de la columna (usa el dataset original si la tabla tiene data-json)
   * Fallback: lee las filas visibles del DOM
   */
  function obtenerValoresUnicos(tabla, col) {
    // Si la tabla tiene data-source (opcional) con todos los datos → leer de ahí
    const fuente = tabla.__datosCompletos;
    if (Array.isArray(fuente)) {
      const valores = new Set();
      fuente.forEach((item) => {
        const v = item[col];
        if (v !== undefined && v !== null && v !== "") valores.add(String(v));
      });
      return Array.from(valores).sort();
    }

    // Fallback: leer del DOM (solo valores de la página actual)
    const tbody = tabla.querySelector("tbody");
    if (!tbody) return [];

    const indice = obtenerIndiceColumna(tabla, col);
    if (indice === -1) return [];

    const valores = new Set();
    tbody.querySelectorAll("tr").forEach((tr) => {
      if (tr.querySelector(".tabla-vacia") || tr.querySelector(".tabla-cargando")) return;
      const td = tr.children[indice];
      if (td) {
        const texto = td.textContent.trim();
        if (texto) valores.add(texto);
      }
    });

    return Array.from(valores).sort();
  }

  /**
   * Índice de la columna a partir de data-col
   */
  function obtenerIndiceColumna(tabla, col) {
    const ths = Array.from(tabla.querySelectorAll("thead th"));
    return ths.findIndex((th) => th.dataset.col === col);
  }

  /**
   * Actualiza el estado visual del ícono
   */
  function actualizarIcono(tabla, col) {
    const th = tabla.querySelector(`th[data-col="${col}"]`);
    if (!th) return;
    const icono = th.querySelector(".th-filter-icon");
    if (!icono) return;

    const filtros = filtrosPorTabla.get(tabla) || {};
    if (filtros[col] && Array.isArray(filtros[col]) && filtros[col].length > 0) {
      icono.classList.add("active");
    } else {
      icono.classList.remove("active");
    }
  }

  function cerrarDropdown() {
    if (dropdownActual) {
      document.removeEventListener("click", cerrarAlClickFuera);
      dropdownActual.remove();
      dropdownActual = null;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarDropdown();
  });

  // Exponer API pública
  window.inicializarFiltrosTabla = inicializarFiltros;

  window.obtenerFiltrosColumna = function (tabla) {
    if (typeof tabla === "string") {
      tabla = document.getElementById(tabla);
    }
    if (!tabla) return {};
    return { ...(filtrosPorTabla.get(tabla) || {}) };
  };

  window.limpiarFiltrosColumna = function (tabla) {
    if (typeof tabla === "string") {
      tabla = document.getElementById(tabla);
    }
    if (!tabla) return;
    filtrosPorTabla.set(tabla, {});
    tabla.querySelectorAll(".th-filter-icon").forEach((i) => i.classList.remove("active"));
    emitirCambio(tabla);
  };

  window.registrarDatosCompletos = function (tabla, datos) {
    if (typeof tabla === "string") {
      tabla = document.getElementById(tabla);
    }
    if (!tabla) return;
    tabla.__datosCompletos = datos;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarFiltros);
  } else {
    inicializarFiltros();
  }
})();