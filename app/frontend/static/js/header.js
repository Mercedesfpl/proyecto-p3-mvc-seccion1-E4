// frontend/static/js/header.js

document.addEventListener('DOMContentLoaded', function() {
    var sidebar = document.getElementById('sidebar');
    var sidebarLogo = document.getElementById('sidebarLogo');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var sidebarUser = document.getElementById('sidebarUser');
    var sidebarUserMenu = document.getElementById('sidebarUserMenu');
    var menuToggle = document.getElementById('menuToggle');
    var sidebarOverlay = document.getElementById('sidebarOverlay');
    var notificationBtn = document.getElementById('notificationBtn');
    var notificationsPanel = document.getElementById('notificationsPanel');
    var markReadBtn = document.querySelector('.mark-read');
    var logoutSidebar = document.getElementById('btn-logout-sidebar');
    var logoutBtn = document.getElementById('btn-logout');
    var currentPath = window.location.pathname;

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        var isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }

    var sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }

    if (sidebarLogo) {
        sidebarLogo.addEventListener('click', function(e) {
            if (window.innerWidth > 1024) {
                e.stopPropagation();
                toggleSidebar();
            }
        });
    }

    function openSidebar() {
        sidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            openSidebar();
        });
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            closeSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeSidebar();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });

    document.querySelectorAll('.sidebar-nav-link').forEach(function(link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    if (sidebarUser && sidebarUserMenu) {
        sidebarUser.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebarUser.classList.toggle('open');
            sidebarUserMenu.classList.toggle('open');
        });

        document.addEventListener('click', function(e) {
            if (sidebarUserMenu.classList.contains('open')) {
                if (!sidebarUser.contains(e.target)) {
                    sidebarUser.classList.remove('open');
                    sidebarUserMenu.classList.remove('open');
                }
            }
        });
    }

    if (notificationBtn && notificationsPanel) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('show');
        });
    }

    document.addEventListener('click', function(e) {
        if (notificationsPanel && notificationsPanel.classList.contains('show')) {
            if (!notificationBtn.contains(e.target)) {
                notificationsPanel.classList.remove('show');
            }
        }
    });

    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            var unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(function(item) {
                item.classList.remove('unread');
            });
            var badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
            showToast('Notificaciones marcadas como leídas', 'info');
        });
    }

    if (logoutSidebar) {
        logoutSidebar.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                var response = await fetch('/api/logout', {
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                var response = await fetch('/api/logout', {
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

function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toastMessage');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast-message ' + type + ' show';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() {
        toast.classList.remove('show');
    }, 4000);
}