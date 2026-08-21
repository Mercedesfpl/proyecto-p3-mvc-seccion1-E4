document.addEventListener('DOMContentLoaded', () => {
    // --- DATOS SIMULADOS DE PRUEBA (Sustituir por llamada fetch a /api/esp32 en el futuro) ---
    let dispositivos = [
        { id: 1, mac: 'AA:BB:CC:11:22:33', tipo: 'bus', firmware: '1.0.2', status: 'activo' },
        { id: 2, mac: 'DD:EE:FF:44:55:66', tipo: 'parada', firmware: '1.0.0', status: 'activo' },
        { id: 3, mac: '11:22:33:44:55:66', tipo: 'bus', firmware: '0.9.8', status: 'inactivo' }
    ];

    // --- ELEMENTOS DEL DOM ---
    const btnNuevo = document.getElementById('btnNuevoEsp32');
    const modal = document.getElementById('modalEsp32');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const formEsp32 = document.getElementById('formEsp32');
    const modalTitle = document.getElementById('modalTitle');
    
    const searchInput = document.getElementById('searchEsp32');
    const filterTipo = document.getElementById('filterTipo');
    const filterStatus = document.getElementById('filterStatus');
    const tablaContainer = document.getElementById('tablaEsp32');

    // --- FUNCIONES DE MODAL ---
    const abrirModal = (modo = 'crear', data = null) => {
        formEsp32.reset();
        document.getElementById('esp32Id').value = '';

        if (modo === 'crear') {
            modalTitle.textContent = 'Nuevo ESP32';
            document.getElementById('password').required = true;
        } else if (modo === 'editar' && data) {
            modalTitle.textContent = 'Editar ESP32';
            document.getElementById('esp32Id').value = data.id;
            document.getElementById('mac').value = data.mac;
            document.getElementById('tipo_dispositivo').value = data.tipo;
            document.getElementById('version_firmware').value = data.firmware;
            document.getElementById('status').value = data.status;
            
            // La contraseña no es obligatoria al editar
            document.getElementById('password').required = false;
        }

        modal.style.display = 'flex';
    };

    const cerrarModal = () => {
        modal.style.display = 'none';
        formEsp32.reset();
    };

    // --- EVENTOS DEL MODAL ---
    if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModal('crear'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', cerrarModal);
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    // --- RENDERIZADO DE TABLA ---
    const renderTabla = () => {
        const busqueda = searchInput.value.toLowerCase().trim();
        const tipoVal = filterTipo.value;
        const statusVal = filterStatus.value;

        // Filtrar array
        const filtrados = dispositivos.filter(disp => {
            const coincideMac = disp.mac.toLowerCase().includes(busqueda);
            const coincideTipo = tipoVal === '' || disp.tipo === tipoVal;
            const coincideStatus = statusVal === '' || disp.status === statusVal;
            return coincideMac && coincideTipo && coincideStatus;
        });

        if (filtrados.length === 0) {
            tablaContainer.innerHTML = `
                <div style="text-align: center; padding: 32px; color: var(--texto-claro);">
                    <i class="fas fa-microchip" style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
                    <p>No se encontraron dispositivos ESP32 registrados.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="tabla" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--borde); text-align: left;">
                        <th style="padding: 12px;">MAC</th>
                        <th style="padding: 12px;">Tipo</th>
                        <th style="padding: 12px;">Firmware</th>
                        <th style="padding: 12px;">Estado</th>
                        <th style="padding: 12px; text-align: right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filtrados.forEach(disp => {
            const badgeClass = disp.status === 'activo' ? 'badge-success' : 'badge-danger';
            const badgeText = disp.status === 'activo' ? 'Activo' : 'Inactivo';
            const iconTipo = disp.tipo === 'bus' ? 'fa-bus' : 'fa-map-marker-alt';

            html += `
                <tr style="border-bottom: 1px solid var(--borde);">
                    <td style="padding: 12px; font-weight: 600;">${disp.mac}</td>
                    <td style="padding: 12px;"><i class="fas ${iconTipo}" style="color: var(--azul); margin-right: 6px;"></i> ${disp.tipo.toUpperCase()}</td>
                    <td style="padding: 12px;">${disp.firmware || 'N/A'}</td>
                    <td style="padding: 12px;"><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td style="padding: 12px; text-align: right;">
                        <button class="btn-icon btn-edit" data-id="${disp.id}" style="background: none; border: none; color: var(--azul); cursor: pointer; margin-right: 8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" data-id="${disp.id}" style="background: none; border: none; color: var(--rojo); cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        tablaContainer.innerHTML = html;

        // Asignar eventos a los botones dinámicos de Editar y Eliminar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const disp = dispositivos.find(d => d.id === id);
                if (disp) abrirModal('editar', disp);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                eliminarEsp32(id);
            });
        });
    };

    // --- ACCIÓN DE ELIMINAR CON SWEETALERT2 ---
    const eliminarEsp32 = async (id) => {
        const confirmado = await confirmDelete(
            '¿Eliminar dispositivo ESP32?',
            'El dispositivo dejará de enviar lecturas al sistema.'
        );

        if (confirmado) {
            // Aquí irá tu fetch DELETE /api/esp32/${id}
            dispositivos = dispositivos.filter(d => d.id !== id);
            renderTabla();
            showToast('Dispositivo eliminado correctamente', 'success');
        }
    };

    // --- GUARDAR O ACTUALIZAR (SUBMIT DEL FORMULARIO) ---
    formEsp32.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('esp32Id').value;
        const mac = document.getElementById('mac').value;
        const tipo = document.getElementById('tipo_dispositivo').value;
        const firmware = document.getElementById('version_firmware').value;
        const status = document.getElementById('status').value;

        if (id) {
            // Editar existente
            const disp = dispositivos.find(d => d.id === parseInt(id));
            if (disp) {
                disp.mac = mac;
                disp.tipo = tipo;
                disp.firmware = firmware;
                disp.status = status;
            }
            showToast('Dispositivo actualizado con éxito', 'success');
        } else {
            // Crear nuevo
            const nuevo = {
                id: Date.now(),
                mac: mac,
                tipo: tipo,
                firmware: firmware || '1.0.0',
                status: status
            };
            dispositivos.unshift(nuevo);
            showToast('Nuevo ESP32 registrado', 'success');
        }

        cerrarModal();
        renderTabla();
    });

    // --- EVENTOS DE FILTRADO Y BÚSQUEDA EN TIEMPO REAL ---
    searchInput.addEventListener('input', renderTabla);
    filterTipo.addEventListener('change', renderTabla);
    filterStatus.addEventListener('change', renderTabla);

    // Carga inicial de la tabla
    renderTabla();
});