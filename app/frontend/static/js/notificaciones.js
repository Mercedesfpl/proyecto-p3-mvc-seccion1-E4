// frontend/static/js/notifications.js

// Paleta de colores ajustada a la interfaz (Dashboard Guaicaipuro)
const COLOR_AZUL_PRIMARIO = '#6ba2d6';
const COLOR_AZUL_OSCURO = '#2b5282';
const COLOR_ROJO_DANGER = '#a83232';
const COLOR_GRIS_CANCELAR = '#8c9ba5';

// Configuración de estilo global para SweetAlert2
const swalEstilos = Swal.mixin({
    customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        htmlContainer: 'swal-custom-text',
        confirmButton: 'swal-custom-confirm-btn',
        cancelButton: 'swal-custom-cancel-btn'
    },
    buttonsStyling: true
});

window.showToast = function(message, icon = 'success', timer = 3500) {
    if (typeof Swal === 'undefined') {
        console.log(`[${icon.toUpperCase()}] ${message}`);
        return;
    }

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        customClass: {
            popup: 'swal-custom-toast'
        },
        didOpen: function(toast) {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: message
    });
};

window.confirmDelete = async function(title = '¿Eliminar unidad?', text = 'Esta acción eliminará la unidad del sistema y no se podrá deshacer.', confirmText = 'Sí, eliminar') {
    if (typeof Swal === 'undefined') {
        return confirm(title + '\n' + text);
    }

    const result = await swalEstilos.fire({
        title: title,
        text: text,
        icon: 'warning',
        iconColor: COLOR_ROJO_DANGER,
        showCancelButton: true,
        confirmButtonColor: COLOR_ROJO_DANGER,
        cancelButtonColor: COLOR_GRIS_CANCELAR,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true
    });

    return result.isConfirmed;
};

window.showAlert = function(title, message, icon = 'info') {
    if (typeof Swal === 'undefined') {
        alert(title + '\n' + message);
        return Promise.resolve();
    }

    return swalEstilos.fire({
        title: title,
        text: message,
        icon: icon,
        iconColor: icon === 'error' ? COLOR_ROJO_DANGER : COLOR_AZUL_PRIMARIO,
        confirmButtonColor: icon === 'error' ? COLOR_ROJO_DANGER : COLOR_AZUL_PRIMARIO,
        confirmButtonText: 'Entendido'
    });
};

window.confirmAction = async function(title, text, confirmText = 'Aceptar') {
    if (typeof Swal === 'undefined') {
        return confirm(title + '\n' + text);
    }

    const result = await swalEstilos.fire({
        title: title,
        text: text,
        icon: 'question',
        iconColor: COLOR_AZUL_PRIMARIO,
        showCancelButton: true,
        confirmButtonColor: COLOR_AZUL_PRIMARIO,
        cancelButtonColor: COLOR_GRIS_CANCELAR,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    });

    return result.isConfirmed;
};

window.showLoading = function(title = 'Procesando...', text = 'Por favor espera') {
    if (typeof Swal === 'undefined') {
        console.log('Loading: ' + title + ' - ' + text);
        return {
            close: function() { console.log('Loading closed'); }
        };
    }

    swalEstilos.fire({
        title: title,
        text: text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: function() {
            Swal.showLoading();
        }
    });

    return {
        close: function() { Swal.close(); }
    };
};