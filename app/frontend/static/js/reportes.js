// frontend/static/js/pages/reportes.js
document.addEventListener('DOMContentLoaded', function() {
    
    //  GRÁFICOS (si los canvas existen) 
    
    // Gráfico 1: Pasajeros por día
    const ctx1 = document.getElementById('pasajerosChart')?.getContext('2d');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Pasajeros',
                    data: [15200, 16800, 17400, 18200, 19500, 14200, 12800],
                    borderColor: '#74A9D3',
                    backgroundColor: 'rgba(116, 169, 211, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#74A9D3'
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    // Gráfico 2: Distribución por ruta (pie)
    const ctx2 = document.getElementById('rutaPieChart')?.getContext('2d');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['Los Teques - Caracas', 'El Tambor - La Miel', 'San Antonio', 'Altos de Pipe'],
                datasets: [{
                    data: [45, 25, 18, 12],
                    backgroundColor: ['#74A9D3', '#F3B001', '#95242A', '#5A8FB7']
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    // Gráfico 3: Cumplimiento de horarios
    const ctx3 = document.getElementById('cumplimientoChart')?.getContext('2d');
    if (ctx3) {
        new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4'],
                datasets: [{
                    label: 'Cumplimiento (%)',
                    data: [67, 82, 91, 73],
                    backgroundColor: '#74A9D3',
                    borderRadius: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    // Gráfico 4: Incidencias por tipo
    const ctx4 = document.getElementById('incidenciasTipoChart')?.getContext('2d');
    if (ctx4) {
        new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: ['Averías', 'Retrasos', 'Denuncias', 'Accidentes'],
                datasets: [{
                    label: 'Cantidad',
                    data: [8, 15, 6, 3],
                    backgroundColor: '#95242A',
                    borderRadius: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    //  EFECTOS VISUALES 
    
    // Animación de entrada para tarjetas KPI
    const kpis = document.querySelectorAll('.kpi-card');
    kpis.forEach((kpi, index) => {
        kpi.style.opacity = '0';
        kpi.style.transform = 'translateY(20px)';
        setTimeout(() => {
            kpi.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            kpi.style.opacity = '1';
            kpi.style.transform = 'translateY(0)';
        }, index * 50);
    });
    
    // Animación para gráficos
    const charts = document.querySelectorAll('.chart-card');
    charts.forEach((chart, index) => {
        chart.style.opacity = '0';
        chart.style.transform = 'translateY(20px)';
        setTimeout(() => {
            chart.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            chart.style.opacity = '1';
            chart.style.transform = 'translateY(0)';
        }, 150 + (index * 50));
    });
    
    // Hover en filas de la tabla
    const tableRows = document.querySelectorAll('.incidencias-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gris)';
            this.style.transition = 'background-color 0.2s ease';
            this.style.cursor = 'pointer';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Hover en elementos del ranking
    const rankingItems = document.querySelectorAll('.ranking-item');
    rankingItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
            this.style.transition = 'transform 0.2s ease';
            this.style.cursor = 'pointer';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    //  EVENTOS DE BOTONES 
    
    const aplicarFiltros = document.getElementById('aplicarFiltros');
    if (aplicarFiltros) {
        aplicarFiltros.addEventListener('click', function() {
            // Efecto visual de "cargando"
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
                alert('Funcionalidad: Aplicar filtros (en desarrollo)');
            }, 200);
        });
    }
    
    const verDetalleBtn = document.querySelector('.ver-detalle-btn');
    if (verDetalleBtn) {
        verDetalleBtn.addEventListener('click', function() {
            alert('Funcionalidad: Ver detalle de rutas (en desarrollo)');
        });
    }
    
    const exportPdf = document.querySelector('.export-pdf');
    if (exportPdf) {
        exportPdf.addEventListener('click', function() {
            alert('Funcionalidad: Exportar a PDF (en desarrollo)');
        });
    }
    
    const exportExcel = document.querySelector('.export-excel');
    if (exportExcel) {
        exportExcel.addEventListener('click', function() {
            alert('Funcionalidad: Exportar a Excel (en desarrollo)');
        });
    }
    
    const exportarTodo = document.getElementById('exportarTodo');
    if (exportarTodo) {
        exportarTodo.addEventListener('click', function() {
            alert('Funcionalidad: Exportar todo el reporte (en desarrollo)');
        });
    }
    
});