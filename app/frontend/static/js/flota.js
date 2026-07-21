// frontend/static/js/pages/flota.js
document.addEventListener('DOMContentLoaded', function() {
    
    //  FILTROS Y BÚSQUEDA 
    
    // Buscar unidad
    const searchInput = document.getElementById('searchUnidad');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#unidadesTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Filtrar por línea
    const filterLinea = document.getElementById('filterLinea');
    if (filterLinea) {
        filterLinea.addEventListener('change', function() {
            const valor = this.value;
            const rows = document.querySelectorAll('#unidadesTableBody tr');
            
            rows.forEach(row => {
                const linea = row.cells[2]?.textContent || '';
                if (valor === 'Todas las líneas' || linea === valor) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Filtrar por estado
    const filterEstado = document.getElementById('filterEstado');
    if (filterEstado) {
        filterEstado.addEventListener('change', function() {
            const valor = this.value;
            const rows = document.querySelectorAll('#unidadesTableBody tr');
            
            rows.forEach(row => {
                const estadoCell = row.cells[4];
                const estadoSpan = estadoCell?.querySelector('.status-badge');
                const estado = estadoSpan ? estadoSpan.textContent.trim() : '';
                
                if (valor === 'Todos los estados') {
                    row.style.display = '';
                } else if (valor === 'Activo' && estado === 'Activo') {
                    row.style.display = '';
                } else if (valor === 'En servicio' && estado === 'En servicio') {
                    row.style.display = '';
                } else if (valor === 'En taller' && estado === 'En taller') {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    //  BOTONES 
    
    // Botón Nueva Unidad
    const nuevaUnidadBtn = document.getElementById('nuevaUnidadBtn');
    if (nuevaUnidadBtn) {
        nuevaUnidadBtn.addEventListener('click', function() {
            alert('Funcionalidad: Crear nueva unidad (en desarrollo)');
        });
    }
    
    // Botón Exportar
    const exportarBtn = document.getElementById('exportarBtn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', function() {
            alert('Funcionalidad: Exportar listado (en desarrollo)');
        });
    }
    
    // Botones Ver detalle
    const viewBtns = document.querySelectorAll('.action-btn.view');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            alert(`Ver detalle de unidad ID: ${id} (en desarrollo)`);
        });
    });
    
    // Botones Editar
    const editBtns = document.querySelectorAll('.action-btn.edit');
    editBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            alert(`Editar unidad ID: ${id} (en desarrollo)`);
        });
    });
    
    // Botones Eliminar
    const deleteBtns = document.querySelectorAll('.action-btn.delete');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            if (confirm(`¿Eliminar la unidad ID: ${id}?`)) {
                alert(`Unidad ${id} eliminada (simulación)`);
            }
        });
    });
    
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
    
    // Hover en filas de la tabla
    const tableRows = document.querySelectorAll('#unidadesTableBody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gris)';
            this.style.transition = 'background-color 0.2s ease';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Paginación (simulada - visual)
    const pageItems = document.querySelectorAll('.page-item');
    pageItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!this.classList.contains('active') && 
                !this.classList.contains('prev') && 
                !this.classList.contains('next')) {
                pageItems.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                alert('Página ' + this.textContent + ' (simulación)');
            }
        });
    });
    
});