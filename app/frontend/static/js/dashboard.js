let chartDistribucion = null;

document.addEventListener('DOMContentLoaded', function() {

    // ========== FECHA Y RELOJ ==========
    function actualizarFecha() {
        const fechaElement = document.getElementById('fechaActual');
        if (fechaElement) {
            const ahora = new Date();
            const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
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
            const [resLineas, resRutas, resParadas, resPersonas, resBuses] = await Promise.all([
                fetch('/admin/lineas', { credentials: 'include' }).then(r => r.json()),
                fetch('/admin/rutas/api', { credentials: 'include' }).then(r => r.json()),
                fetch('/admin/paradas', { credentials: 'include' }).then(r => r.json()),
                fetch('/admin/personas', { credentials: 'include' }).then(r => r.json()),
                fetch('/admin/buses', { credentials: 'include' }).then(r => r.json())
            ]);

            const lineas = resLineas.success ? resLineas.data : [];
            const rutas = resRutas.success ? resRutas.data : [];
            const paradas = resParadas.success ? resParadas.data : [];
            const personas = resPersonas.success ? resPersonas.data : [];
            const buses = resBuses.success ? resBuses.data : [];

            // Cifras Principales
            const totalRutas = rutas.length;
            const rutasActivas = rutas.filter(r => r.status === 'activa').length;
            const rutasInactivas = rutas.filter(r => r.status === 'inactiva').length;
            const totalParadas = paradas.length;
            const paradasActivas = paradas.filter(p => p.status === 'activa').length;

            // Inserción KPI
            document.getElementById('totalBuses').textContent = buses.length;
            document.getElementById('totalLineas').textContent = lineas.length;
            document.getElementById('totalRutas').textContent = totalRutas;
            document.getElementById('rutasActivasCount').textContent = rutasActivas;
            document.getElementById('rutasInactivasCount').textContent = rutasInactivas;
            document.getElementById('totalParadas').textContent = totalParadas;
            document.getElementById('paradasActivasCount').textContent = paradasActivas;

            // Inserción Hero
            document.getElementById('totalPersonas').textContent = personas.length;
            
            // Métricas
            const pctRutasActivas = totalRutas > 0 ? Math.round((rutasActivas / totalRutas) * 100) : 0;
            const pctRutasInactivas = totalRutas > 0 ? Math.round((rutasInactivas / totalRutas) * 100) : 0;
            const pctParadasActivas = totalParadas > 0 ? Math.round((paradasActivas / totalParadas) * 100) : 0;

            document.getElementById('porcentajeOperatividad').textContent = `${pctRutasActivas}%`;
            const prom = totalRutas > 0 ? (buses.length / totalRutas).toFixed(1) : 0;
            document.getElementById('promedioBuses').textContent = prom;

            // Barras
            document.getElementById('barRutasActivas').style.width = `${pctRutasActivas}%`;
            document.getElementById('lblPctRutas').textContent = `${pctRutasActivas}%`;

            document.getElementById('barRutasInactivas').style.width = `${pctRutasInactivas}%`;
            document.getElementById('lblPctInactivas').textContent = `${pctRutasInactivas}%`;

            document.getElementById('barParadasActivas').style.width = `${pctParadasActivas}%`;
            document.getElementById('lblPctParadas').textContent = `${pctParadasActivas}%`;

            // Gráfico y listas
            actualizarGrafico(rutas);
            actualizarUltimasRutas(rutas);
            actualizarResumenLineas(rutas, lineas);

        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
        }
    }

    // ========== GRÁFICO CON COLORES PROPIOS DE LAS RUTAS ==========
    function actualizarGrafico(rutas) {
        const ctx = document.getElementById('distribucionChart');
        if (!ctx) return;

        if (rutas.length === 0) return;

        // Extraer nombres y colores reales de las rutas
        const labels = rutas.map(r => r.nombre || 'Ruta sin nombre');
        // Usar el color definido en la ruta o un color por defecto de la paleta
        const colors = rutas.map(r => r.color && r.color.trim() !== '' ? r.color : '#95242A');
        
        // Asignar valor unitario por ruta para mostrar la distribución de colores de las rutas registradas
        const data = rutas.map(() => 1);

        if (chartDistribucion) {
            chartDistribucion.destroy();
        }

        chartDistribucion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 11, weight: '600' },
                            boxWidth: 10,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Ruta: ${context.label}`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // ========== ÚLTIMAS RUTAS ==========
    function actualizarUltimasRutas(rutas) {
        const container = document.getElementById('ultimasRutas');
        if (!container) return;

        const ultimas = [...rutas]
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .slice(0, 4);

        if (ultimas.length === 0) {
            container.innerHTML = `<div class="loading-text">No hay rutas registradas</div>`;
            return;
        }

        let html = '';
        ultimas.forEach(ruta => {
            const statusClass = ruta.status === 'activa' ? 'activa' : 'inactiva';
            const statusText = ruta.status === 'activa' ? 'Activa' : 'Inactiva';
            const color = ruta.color || '#95242A';

            html += `
                <div class="ultima-ruta-item">
                    <div class="ruta-info">
                        <span class="ruta-color" style="background: ${color};"></span>
                        <span class="ruta-nombre">${ruta.nombre}</span>
                        <span class="ruta-linea">• ${ruta.linea_nombre || 'Sin línea'}</span>
                    </div>
                    <span class="ruta-estado ${statusClass}">${statusText}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ========== RESUMEN DE LÍNEAS ==========
    function actualizarResumenLineas(rutas, lineas) {
        const container = document.getElementById('lineasListSummary');
        if (!container) return;

        if (lineas.length === 0) {
            container.innerHTML = `<div class="loading-text">No hay líneas registradas</div>`;
            return;
        }

        let html = '';
        lineas.forEach(linea => {
            const cantidadRutas = rutas.filter(r => r.id_linea === linea.id).length;
            html += `
                <div class="linea-item-row">
                    <span class="linea-item-name"><i class="fas fa-layer-group" style="color: var(--brand-red); margin-right: 6px;"></i>${linea.nombre}</span>
                    <span class="linea-item-badge">${cantidadRutas} rutas</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    cargarDatosDashboard();
    setInterval(cargarDatosDashboard, 300000);
});