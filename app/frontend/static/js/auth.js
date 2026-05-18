// frontend/static/js/auth.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== MOSTRAR TOAST (notificación emergente) ==========
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toastMessage');
        toast.textContent = message;
        toast.className = `toast-message ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // ========== EFECTO EN BOTONES (feedback visual) ==========
    const buttons = document.querySelectorAll('.btn-login, .btn-register');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Efecto de clic
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // ========== EFECTO EN INPUTS (focus) ==========
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateX(4px)';
        });
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateX(0)';
        });
    });
    
    // ========== TOGGLE MOSTRAR/OCULTAR CONTRASEÑA ==========
    const toggleBtn = document.querySelector('.password-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
    
    // ========== ANIMACIÓN DE ENTRADA DE LA TARJETA ==========
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.style.opacity = '0';
        authCard.style.transform = 'translateY(20px)';
        setTimeout(() => {
            authCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            authCard.style.opacity = '1';
            authCard.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // ========== EFECTO HOVER EN ENLACES ==========
    const links = document.querySelectorAll('.auth-footer a, .forgot-link');
    links.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        link.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });
    
});