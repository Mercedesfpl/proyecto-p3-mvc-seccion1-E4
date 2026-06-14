// frontend/static/js/header.js
document.addEventListener('DOMContentLoaded', function() {
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');

    if (userDropdown) {
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            if (notificationsPanel) notificationsPanel.classList.remove('show');
        });
    }

    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('show');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        });
    }

    document.addEventListener('click', function() {
        if (dropdownMenu) dropdownMenu.classList.remove('show');
        if (notificationsPanel) notificationsPanel.classList.remove('show');
    });

    // Marcar todas como leídas
    const markReadBtn = document.querySelector('.mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Actualizar badge a 0
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
            
            showToast('Notificaciones marcadas como leídas', 'info');
        });
    }
});

// frontend/static/js/header.js

document.addEventListener('DOMContentLoaded', function() {
    //  MENÚ HAMBURGUESA 
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    
    // Crear overlay si no existe
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
    }
    
    // Abrir/cerrar menú
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            overlay.classList.toggle('active');
            // Cambiar ícono del botón
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Cerrar menú al hacer clic en overlay
        overlay.addEventListener('click', function() {
            mainNav.classList.remove('active');
            overlay.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
        
        // Cerrar menú al hacer clic en un enlace
        const navLinks = mainNav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mainNav.classList.remove('active');
                overlay.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
    
    //  DROPDOWN DEL USUARIO 
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (userDropdown && dropdownMenu) {
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            // Cerrar notificaciones si están abiertas
            if (notificationsPanel) notificationsPanel.classList.remove('show');
        });
    }
    
    //  PANEL DE NOTIFICACIONES 
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (notificationBtn && notificationsPanel) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('show');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        });
    }
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        }
        if (notificationsPanel && notificationsPanel.classList.contains('show')) {
            if (!notificationBtn.contains(e.target)) {
                notificationsPanel.classList.remove('show');
            }
        }
    });
    
    //  MARCAR NOTIFICACIONES COMO LEÍDAS 
    const markReadBtn = document.querySelector('.mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
            }
        });
    }
    
    //  LOGOUT 
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    console.error('Error al cerrar sesión');
                }
            } catch (error) {
                console.error('Error de red:', error);
            }
        });
    }
});