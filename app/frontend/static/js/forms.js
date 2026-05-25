// frontend/static/js/forms.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== VALIDACIÓN DE CÉDULA (Venezuela) ==========
    window.validateVenezuelanId = function(cedula) {
        const cleanId = cedula.toString().replace(/\D/g, '');
        if (cleanId.length < 6 || cleanId.length > 8) {
            return { valid: false, message: 'La cédula debe tener entre 6 y 8 dígitos' };
        }
        return { valid: true, message: '' };
    };
    
    // ========== VALIDACIÓN DE PLACA (Venezuela) ==========
    window.validatePlate = function(plate) {
        const plateRegex = /^[A-Z]{3}[0-9]{3}[A-Z]?$/;
        if (!plateRegex.test(plate.toUpperCase())) {
            return { valid: false, message: 'Formato inválido (ej: ABC123 o ABC123D)' };
        }
        return { valid: true, message: '' };
    };
    
    // ========== VALIDACIÓN DE TELÉFONO (Venezuela) ==========
    window.validatePhone = function(phone) {
        const cleanPhone = phone.toString().replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            return { valid: false, message: 'Debe tener 10 u 11 dígitos (ej: 04121234567)' };
        }
        return { valid: true, message: '' };
    };
    
    // ========== MOSTRAR ERROR EN INPUT ==========
    window.showInputError = function(inputElement, message) {
        inputElement.classList.add('error');
        let errorDiv = inputElement.parentElement.querySelector('.form-message.error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-message error';
            inputElement.parentElement.appendChild(errorDiv);
        }
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    };
    
    window.clearInputError = function(inputElement) {
        inputElement.classList.remove('error');
        const errorDiv = inputElement.parentElement.querySelector('.form-message.error');
        if (errorDiv) {
            errorDiv.remove();
        }
    };
    
    // ========== LIMPIAR TODOS LOS ERRORES ==========
    window.clearAllErrors = function(formElement) {
        formElement.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
            input.classList.remove('error');
        });
        formElement.querySelectorAll('.form-message.error').forEach(msg => {
            msg.remove();
        });
    };
    
    // ========== MOSTRAR TOAST ==========
    window.showFormToast = function(message, type = 'success') {
        let toast = document.getElementById('formToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'formToast';
            toast.className = 'form-toast';
            document.body.appendChild(toast);
            
            // Estilos del toast (si no existen en CSS)
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.padding = '12px 20px';
            toast.style.borderRadius = '40px';
            toast.style.fontSize = '14px';
            toast.style.zIndex = '1001';
            toast.style.display = 'none';
            toast.style.animation = 'slideInRight 0.3s ease';
        }
        
        toast.textContent = message;
        toast.style.background = type === 'success' ? '#10b981' : (type === 'error' ? 'var(--rojo)' : 'var(--azul)');
        toast.style.color = 'white';
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    };
    
    // ========== MASK PARA CÉDULA (formato) ==========
    window.maskVenezuelanId = function(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        input.value = value;
    };
    
    // ========== MASK PARA TELÉFONO ==========
    window.maskPhone = function(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        input.value = value;
    };
    
    // ========== MASK PARA PLACA (mayúsculas automático) ==========
    window.maskPlate = function(input) {
        input.value = input.value.toUpperCase();
    };
    
    // ========== MOSTRAR NOMBRE DEL ARCHIVO SELECCIONADO ==========
    window.updateFileName = function(input, fileNameSpanId) {
        const fileNameSpan = document.getElementById(fileNameSpanId);
        if (fileNameSpan && input.files.length > 0) {
            fileNameSpan.textContent = input.files[0].name;
        } else if (fileNameSpan) {
            fileNameSpan.textContent = 'Ningún archivo seleccionado';
        }
    };
    
    // ========== AUTO-MÁSCARAS EN INPUTS ==========
    const cedulaInputs = document.querySelectorAll('[data-mask="cedula"]');
    cedulaInputs.forEach(input => {
        input.addEventListener('input', function() { maskVenezuelanId(this); });
    });
    
    const phoneInputs = document.querySelectorAll('[data-mask="phone"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() { maskPhone(this); });
    });
    
    const plateInputs = document.querySelectorAll('[data-mask="plate"]');
    plateInputs.forEach(input => {
        input.addEventListener('input', function() { maskPlate(this); });
    });
    
    // ========== VALIDACIÓN EN TIEMPO REAL ==========
    const validateOnBlur = document.querySelectorAll('[data-validate]');
    validateOnBlur.forEach(input => {
        input.addEventListener('blur', function() {
            const validateType = this.getAttribute('data-validate');
            let result;
            
            switch(validateType) {
                case 'cedula':
                    result = validateVenezuelanId(this.value);
                    break;
                case 'plate':
                    result = validatePlate(this.value);
                    break;
                case 'phone':
                    result = validatePhone(this.value);
                    break;
                default:
                    return;
            }
            
            if (!result.valid && this.value) {
                showInputError(this, result.message);
            } else {
                clearInputError(this);
            }
        });
        
        input.addEventListener('input', function() {
            clearInputError(this);
        });
    });
    
});