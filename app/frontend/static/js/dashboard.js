// frontend/static/js/pages/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== ANIMACIÓN DE BARRAS DE PROGRESO ==========
    const barras = document.querySelectorAll('.bar-fill');
    barras.forEach(barra => {
        // Guardar el ancho original
        const anchoOriginal = barra.style.width;
        // Poner ancho a 0 para animar
        barra.style.width = '0%';
        // Animar después de un pequeño retraso
        setTimeout(() => {
            barra.style.transition = 'width 0.8s ease-out';
            barra.style.width = anchoOriginal;
        }, 100);
    });
    
    // ========== EFECTO HOVER EN INCIDENCIAS ==========
    const incidencias = document.querySelectorAll('.incidencia-item');
    incidencias.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gris)';
            this.style.transition = 'background-color 0.2s ease';
            this.style.cursor = 'pointer';
        });
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // ========== EFECTO HOVER EN FILAS DE RUTAS ==========
    const routeRows = document.querySelectorAll('.route-row');
    routeRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gris)';
            this.style.borderRadius = '8px';
            this.style.transition = 'background-color 0.2s ease';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // ========== EFECTO EN EL MAPA PLACEHOLDER ==========
    const mapPlaceholder = document.querySelector('.map-placeholder');
    if (mapPlaceholder) {
        mapPlaceholder.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.01)';
            this.style.transition = 'transform 0.2s ease';
            this.style.boxShadow = 'var(--sombra-md)';
        });
        mapPlaceholder.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    }
    
    // ========== ACTUALIZAR RELOJ EN CABECERA (opcional) ==========
    function actualizarReloj() {
        const relojElement = document.getElementById('reloj');
        if (relojElement) {
            const ahora = new Date();
            const hora = ahora.getHours().toString().padStart(2, '0');
            const minutos = ahora.getMinutes().toString().padStart(2, '0');
            relojElement.textContent = `${hora}:${minutos}`;
        }
    }
    actualizarReloj();
    setInterval(actualizarReloj, 60000); // Actualizar cada minuto
    
});