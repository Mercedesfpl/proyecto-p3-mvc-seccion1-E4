// frontend/static/js/pages/dashboard.js

let chartDistribucion = null;

document.addEventListener('DOMContentLoaded', function() {

    // ========== FECHA Y RELOJ ==========
    function actualizarFecha() {
        const fechaElement = document.getElementById('fechaActual');
        if (fechaElement) {
            const ahora = new Date();
            const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
            fechaElement.textContent = ahora.toLocaleDateString('es-ES', opciones);
        }
    }

    function actualizarReloj() {
        const relojElement = document.getElementById('reloj');
        if (relojElement) {
            const ahora = new Date();
            const hora = ahora.getHours().toString().padStart(2, '0');
            const minutos = ahora.getMinutes().toString().padStart(2, '0');
            relojElement.textContent = `${hora}:${minutos}`;
        }
    }

    actualizarFecha();
    actualizarReloj();
    setInterval(actualizarReloj, 60000);

    // ========== CARGAR DATOS DEL DASHBOARD ==========

    async function cargarDatosDashboard() {
        try {
            // Cargar líneas
            const responseLineas = await fetch('/admin/lineas', { credentials: 'include' });
            const dataLineas = await responseLineas.json();
            const lineas = dataLineas.success ? dataLineas.data : [];

            // Cargar rutas
            const responseRutas = await fetch('/admin/rutas/api', { credentials: 'include' });
            const dataRutas = await responseRutas.json();
            const rutas = dataRutas.success ? dataRutas.data : [];

            // Cargar paradas
            const responseParadas = await fetch('/admin/paradas', { credentials: 'include' });
            const dataParadas = await responseParadas.json();
            const paradas = dataParadas.success ? dataParadas.data : [];

            // Cargar personas
            const responsePersonas = await fetch('/admin/personas', { credentials: 'include' });
            const dataPersonas = await responsePersonas.json();
            const personas = dataPersonas.success ? dataPersonas.data : [];

            // Cargar buses
            const responseBuses = await fetch('/admin/buses', { credentials: 'include' });
            const dataBuses = await responseBuses.json();
            const buses = dataBuses.success ? dataBuses.data : [];

            // ========== ACTUALIZAR KPIs ==========
            const totalLineas = lineas.length;
            const rutasActivas = rutas.filter(r => r.status === 'activa').length;
            const rutasInactivas = rutas.filter(r => r.status === 'inactiva').length;
            const totalRutas = rutas.length;
            const totalParadas = paradas.length;
            const paradasActivas = paradas.filter(p => p.status === 'activa').length;
            const totalPersonas = personas.length;
            const totalBuses = buses.length;

            document.getElementById('totalLineas').textContent = totalLineas;
            document.getElementById('totalRutas').textContent = totalRutas;
            document.getElementById('rutasActivas').textContent = rutasActivas;
            document.getElementById('rutasInactivas').textContent = rutasInactivas;
            document.getElementById('totalParadas').textContent = totalParadas;
            document.getElementById('paradasActivas').textContent = paradasActivas;
            document.getElementById('totalPersonas').textContent = totalPersonas;
            document.getElementById('totalBuses').textContent = totalBuses;

            // ========== ACTUALIZAR GRÁFICO ==========
            actualizarGrafico(rutas, lineas);

            // ========== ACTUALIZAR ÚLTIMAS RUTAS ==========
            actualizarUltimasRutas(rutas);

        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
        }
    }

    // ========== GRÁFICO DE DISTRIBUCIÓN ==========

    function actualizarGrafico(rutas, lineas) {
        const ctx = document.getElementById('distribucionChart');
        if (!ctx) return;

        // Contar rutas por línea
        const lineasMap = {};
        lineas.forEach(l => {
            lineasMap[l.id] = l.nombre;
        });

        const rutasPorLinea = {};
        rutas.forEach(r => {
            const nombreLinea = lineasMap[r.id_linea] || 'Sin línea';
            if (!rutasPorLinea[nombreLinea]) {
                rutasPorLinea[nombreLinea] = 0;
            }
            rutasPorLinea[nombreLinea]++;
        });

        const labels = Object.keys(rutasPorLinea);
        const data = Object.values(rutasPorLinea);
        const colores = ['#74A9D3', '#F3B001', '#95242A', '#10b981', '#8B5CF6', '#EC4899'];

        if (chartDistribucion) {
            chartDistribucion.destroy();
        }

        chartDistribucion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colores.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 11 },
                            padding: 12,
                            boxWidth: 14,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // ========== ÚLTIMAS RUTAS ==========

    function actualizarUltimasRutas(rutas) {
        const container = document.getElementById('ultimasRutas');
        if (!container) return;

        // Ordenar por ID (asumiendo que IDs más altos = más recientes)
        const ultimas = [...rutas]
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .slice(0, 5);

        if (ultimas.length === 0) {
            container.innerHTML = `
                <div class="loading-text">No hay rutas registradas</div>
            `;
            return;
        }

        let html = '';
        ultimas.forEach(ruta => {
            const statusClass = ruta.status === 'activa' ? 'activa' : 'inactiva';
            const statusText = ruta.status === 'activa' ? 'Activa' : 'Inactiva';
            const color = ruta.color || '#74A9D3';

            html += `
                <div class="ultima-ruta-item">
                    <div class="ruta-info">
                        <span class="ruta-color" style="background: ${color};"></span>
                        <span class="ruta-nombre">${ruta.nombre}</span>
                        <span class="ruta-linea">${ruta.linea_nombre || 'Sin línea'}</span>
                    </div>
                    <span class="ruta-estado ${statusClass}">${statusText}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ========== ANIMACIONES ==========

    // Animar barras de progreso (si existen)
    const barras = document.querySelectorAll('.bar-fill');
    barras.forEach(barra => {
        const anchoOriginal = barra.style.width;
        barra.style.width = '0%';
        setTimeout(() => {
            barra.style.transition = 'width 0.8s ease-out';
            barra.style.width = anchoOriginal;
        }, 100);
    });

    // Efectos hover
    document.querySelectorAll('.incidencia-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gris)';
            this.style.transition = 'background-color 0.2s ease';
            this.style.cursor = 'pointer';
        });
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });

    // ========== INICIALIZAR ==========

    cargarDatosDashboard();

    // Recargar datos cada 5 minutos
    setInterval(cargarDatosDashboard, 300000);
});