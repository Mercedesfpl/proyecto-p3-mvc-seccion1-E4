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

// ========== RECUPERACIÓN DE CONTRASEÑA (SOLO VISUAL) ==========

// Mostrar/ocultar pasos
function showStep(stepNumber) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'none';
    
    if (stepNumber === 1 && step1) step1.style.display = 'block';
    if (stepNumber === 2 && step2) step2.style.display = 'block';
    if (stepNumber === 3 && step3) step3.style.display = 'block';
}

// Efecto visual al enviar código
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
    forgotForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        if (email) {
            showToast('Código enviado (simulación)', 'success');
            showStep(2);
        } else {
            showToast('Ingresa un correo electrónico', 'error');
        }
    });
}

// Efecto visual al verificar código
const verifyCodeForm = document.getElementById('verifyCodeForm');
if (verifyCodeForm) {
    verifyCodeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const code = document.getElementById('code').value;
        if (code && code.length >= 6) {
            showToast('Código verificado', 'success');
            showStep(3);
        } else {
            showToast('Ingresa un código válido de 6 dígitos', 'error');
        }
    });
}

// Efecto visual al restablecer contraseña
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    const newPwd = document.getElementById('newPassword');
    if (newPwd) {
        newPwd.addEventListener('input', function() {
            updatePasswordStrength(this.value, 'newPasswordStrength');
        });
    }
    
    resetPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (!newPassword || !confirmPassword) {
            showToast('Completa todos los campos', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        
        showToast('Contraseña restablecida. Redirigiendo...', 'success');
        setTimeout(() => {
            window.location.href = '/api/login-page';
        }, 1500);
    });
}

// Función de fortaleza de contraseña (si no existe)
function updatePasswordStrength(password, elementId) {
    const strengthDiv = document.getElementById(elementId);
    if (!strengthDiv) return;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 10) strength++;
    if (/\d/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[!@#$%&/]/.test(password)) strength++;
    
    let color = '#dc2626';
    let text = 'Débil';
    
    if (strength >= 3 && strength < 5) {
        color = '#f59e0b';
        text = 'Media';
    } else if (strength >= 5) {
        color = '#10b981';
        text = 'Fuerte';
    }
    
    strengthDiv.innerHTML = `<span style="color:${color}">${text}</span>`;
}