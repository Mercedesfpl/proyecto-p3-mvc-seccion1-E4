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

    const markReadBtn = document.querySelector('.mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        });
    }
});