// ========================================
// HEADER - Menu hamburguesa, dropdowns, etc
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // ===== MENU HAMBURGUESA =====
    const menuToggle = document.getElementById('menuToggle');
    const headerNav = document.querySelector('.header-nav');

    if (menuToggle && headerNav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            headerNav.classList.toggle('active');

            // Cambiar ícono
            const icon = menuToggle.querySelector('i');
            if (headerNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (headerNav.classList.contains('active') &&
                !headerNav.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                headerNav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // ===== DROPDOWN DEL USUARIO =====
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (userDropdown && dropdownMenu) {
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');

            // Cerrar notificaciones si están abiertas
            const notificationsPanel = document.getElementById('notificationsPanel');
            if (notificationsPanel) {
                notificationsPanel.classList.remove('show');
            }
        });
    }

    // ===== PANEL DE NOTIFICACIONES =====
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');

    if (notificationBtn && notificationsPanel) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('show');

            // Cerrar dropdown si está abierto
            if (dropdownMenu) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // ===== CERRAR AL HACER CLIC FUERA =====
    document.addEventListener('click', function(e) {
        // Cerrar dropdown
        if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        }

        // Cerrar notificaciones
        if (notificationsPanel && notificationsPanel.classList.contains('show')) {
            if (!notificationBtn.contains(e.target)) {
                notificationsPanel.classList.remove('show');
            }
        }
    });

    // ===== MARCAR NOTIFICACIONES COMO LEÍDAS =====
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
                badge.style.display = 'none';
            }

            showToast('Notificaciones marcadas como leídas', 'info');
        });
    }

    // ===== LOGOUT =====
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
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

// ===== FUNCIÓN TOAST GLOBAL =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast-message ${type} show`;

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}