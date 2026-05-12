// frontend/static/js/base.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== DROPDOWN DEL USUARIO (mostrar/ocultar) ==========
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (userDropdown && dropdownMenu) {
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            // Alternar visibilidad
            if (dropdownMenu.style.display === 'block') {
                dropdownMenu.style.display = 'none';
            } else {
                dropdownMenu.style.display = 'block';
                // Si el panel de notificaciones está abierto, lo cierro
                if (notificationsPanel) notificationsPanel.style.display = 'none';
            }
        });
    }
    
    // ========== PANEL DE NOTIFICACIONES (mostrar/ocultar) ==========
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (notificationBtn && notificationsPanel) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Alternar visibilidad
            if (notificationsPanel.style.display === 'block') {
                notificationsPanel.style.display = 'none';
            } else {
                notificationsPanel.style.display = 'block';
                // Si el dropdown está abierto, lo cierro
                if (dropdownMenu) dropdownMenu.style.display = 'none';
            }
        });
    }
    
    // ========== CERRAR AL HACER CLIC FUERA ==========
    document.addEventListener('click', function(e) {
        // Cerrar dropdown si se clica fuera
        if (dropdownMenu && dropdownMenu.style.display === 'block') {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        }
        // Cerrar notificaciones si se clica fuera
        if (notificationsPanel && notificationsPanel.style.display === 'block') {
            if (!notificationBtn.contains(e.target)) {
                notificationsPanel.style.display = 'none';
            }
        }
    });
    
    // ========== EFECTO: MARCAR NOTIFICACIONES COMO LEÍDAS ==========
    const markReadBtn = document.querySelector('.mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            // Quitar la clase "unread" de todas las notificaciones
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Cambiar el badge a 0 y ocultarlo un poco
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.opacity = '0.5';
            }
            
            // Pequeño efecto visual
            this.style.opacity = '0.6';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 200);
        });
    }
    
    // ========== EFECTO: HOVER EN TARJETAS (ya está en CSS, pero ejemplo) ==========
    const cards = document.querySelectorAll('.kpi-card, .card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        });
    });
    
    // ========== ANIMACIÓN SUTIL AL CARGAR LAS TARJETAS ==========
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
    
    // ========== EFECTO EN LOS FILTROS (si existen) ==========
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Pequeño efecto visual de "cargando"
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 200);
        });
    });
    
    // ========== EFECTO EN BOTONES ==========
    const btns = document.querySelectorAll('.btn-primary, .btn-secondary');
    btns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Efecto de clic
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
});