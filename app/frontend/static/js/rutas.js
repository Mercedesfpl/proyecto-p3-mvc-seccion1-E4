// js/pages/rutas.js
document.addEventListener('DOMContentLoaded', function() {
    
    // Buscar ruta
    const searchInput = document.getElementById('searchRuta');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.ruta-card');
            
            cards.forEach(card => {
                const title = card.querySelector('.ruta-title h3').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Filtrar por línea
    const filterLinea = document.getElementById('filterLinea');
    if (filterLinea) {
        filterLinea.addEventListener('change', function() {
            const valor = this.value;
            const cards = document.querySelectorAll('.ruta-card');
            
            cards.forEach(card => {
                const lineaElement = card.querySelector('.info-row:first-child .info-value');
                const linea = lineaElement ? lineaElement.textContent : '';
                
                if (valor === 'Todas las líneas' || linea === valor) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Filtrar por estado
    const filterEstado = document.getElementById('filterEstado');
    if (filterEstado) {
        filterEstado.addEventListener('change', function() {
            const valor = this.value;
            const cards = document.querySelectorAll('.ruta-card');
            
            cards.forEach(card => {
                const statusSpan = card.querySelector('.status-badge');
                const estado = statusSpan ? statusSpan.textContent : '';
                
                if (valor === 'Todas') {
                    card.style.display = 'block';
                } else if (valor === 'Activas' && estado === 'Activa') {
                    card.style.display = 'block';
                } else if (valor === 'Inactivas' && estado === 'Mantenimiento') {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Botón Nueva Ruta
    const nuevaRutaBtn = document.getElementById('nuevaRutaBtn');
    if (nuevaRutaBtn) {
        nuevaRutaBtn.addEventListener('click', function() {
            alert('Funcionalidad: Crear nueva ruta (en desarrollo)');
        });
    }
    
    // Botón Nuevo Punto
    const nuevoPuntoBtn = document.getElementById('nuevoPuntoBtn');
    if (nuevoPuntoBtn) {
        nuevoPuntoBtn.addEventListener('click', function() {
            alert('Funcionalidad: Crear nuevo punto de control (en desarrollo)');
        });
    }
    
    // Botones Ver detalle
    const verDetalleBtns = document.querySelectorAll('.btn-ver');
    verDetalleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            alert('Ver detalle de ruta ID: ' + id);
        });
    });
    
    // Botones Editar en tabla
    const editBtns = document.querySelectorAll('.action-btn.edit');
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Funcionalidad: Editar punto de control (en desarrollo)');
        });
    });
    
    // Hover en tarjetas
    const cards = document.querySelectorAll('.ruta-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
    });
    
    // Animación de entrada de tarjetas
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
    
});

// js/pages/rutas.js
document.addEventListener('DOMContentLoaded', function() {
    
    //  ACORDEÓN PARA TARJETAS DE RUTAS 
    const accordionCards = document.querySelectorAll('.ruta-card.accordion');
    
    accordionCards.forEach(card => {
        const header = card.querySelector('.ruta-header-accordion');
        const content = card.querySelector('.ruta-content-accordion');
        const icon = card.querySelector('.accordion-icon');
        
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Cerrar otras tarjetas abiertas (opcional)
            accordionCards.forEach(otherCard => {
                if (otherCard !== card && otherCard.classList.contains('open')) {
                    const otherContent = otherCard.querySelector('.ruta-content-accordion');
                    const otherIcon = otherCard.querySelector('.accordion-icon');
                    otherContent.style.display = 'none';
                    otherCard.classList.remove('open');
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Abrir/cerrar la tarjeta actual
            const isOpen = card.classList.contains('open');
            
            if (isOpen) {
                content.style.display = 'none';
                card.classList.remove('open');
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                content.style.display = 'block';
                card.classList.add('open');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        });
    });
    
    //  RESTO DE FUNCIONALIDADES (filtros, búsqueda, etc.) 
    
    // Buscar ruta
    const searchInput = document.getElementById('searchRuta');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.ruta-card.accordion');
            
            cards.forEach(card => {
                const title = card.querySelector('.ruta-title h3').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Filtrar por línea
    const filterLinea = document.getElementById('filterLinea');
    if (filterLinea) {
        filterLinea.addEventListener('change', function() {
            const valor = this.value;
            const cards = document.querySelectorAll('.ruta-card.accordion');
            
            cards.forEach(card => {
                const lineaElement = card.querySelector('.info-row:first-child .info-value');
                const linea = lineaElement ? lineaElement.textContent : '';
                
                if (valor === 'Todas las líneas' || linea === valor) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Filtrar por estado 
    const filterEstado = document.getElementById('filterEstado');
    if (filterEstado) {
        filterEstado.addEventListener('change', function() {
            const valor = this.value;
            const cards = document.querySelectorAll('.ruta-card.accordion');
            
            cards.forEach(card => {
                const statusSpan = card.querySelector('.status-badge');
                const estado = statusSpan ? statusSpan.textContent : '';
                
                if (valor === 'Todas') {
                    card.style.display = 'block';
                } else if (valor === 'Activas' && estado === 'Activa') {
                    card.style.display = 'block';
                } else if (valor === 'Inactivas' && (estado === 'Mantenimiento' || estado === 'Inactiva')) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Botón Nueva Ruta
    const nuevaRutaBtn = document.getElementById('nuevaRutaBtn');
    if (nuevaRutaBtn) {
        nuevaRutaBtn.addEventListener('click', function() {
            alert('Funcionalidad: Crear nueva ruta (en desarrollo)');
        });
    }
    
    // Botón Nuevo Punto
    const nuevoPuntoBtn = document.getElementById('nuevoPuntoBtn');
    if (nuevoPuntoBtn) {
        nuevoPuntoBtn.addEventListener('click', function() {
            alert('Funcionalidad: Crear nuevo punto de control (en desarrollo)');
        });
    }
    
    // Botones Ver detalle
    const verDetalleBtns = document.querySelectorAll('.btn-ver');
    verDetalleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            alert('Ver detalle de ruta ID: ' + id);
        });
    });
    
    // Botones Editar en tabla
    const editBtns = document.querySelectorAll('.action-btn.edit');
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Funcionalidad: Editar punto de control (en desarrollo)');
        });
    });
    
});

// Expandir/contraer tarjetas
const expandBtns = document.querySelectorAll('.btn-expand');

expandBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const cardId = this.getAttribute('data-id');
        const expandableDiv = document.getElementById(`expandable-${cardId}`);
        const icon = this.querySelector('i');
        
        if (expandableDiv.style.display === 'none') {
            expandableDiv.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            expandableDiv.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    });
});