// Utilidades generales
let CONFIG_CACHE = null;

async function getRandomPastelColor() {
    if (!CONFIG_CACHE) {
        CONFIG_CACHE = await window.getConfig();
    }
    return CONFIG_CACHE.PASTEL_COLORS[Math.floor(Math.random() * CONFIG_CACHE.PASTEL_COLORS.length)];
}

function showProgress(message = 'Cargando...') {
    const progressDiv = document.createElement('div');
    progressDiv.id = 'progressIndicator';
    progressDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                <div style="margin-bottom: 15px;">${message}</div>
                <div style="width: 200px; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
                    <div id="progressBar" style="width: 0%; height: 100%; background: #007bff; transition: width 0.3s;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(progressDiv);
    
    let progress = 0;
    const interval = setInterval(async () => {
        if (!CONFIG_CACHE) {
            CONFIG_CACHE = await window.getConfig();
        }
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        document.getElementById('progressBar').style.width = progress + '%';
    }, CONFIG_CACHE?.UI_CONFIG?.PROGRESS_INTERVAL || 100);
    
    return {
        complete: () => {
            clearInterval(interval);
            document.getElementById('progressBar').style.width = '100%';
            setTimeout(() => {
                const progressElement = document.getElementById('progressIndicator');
                if (progressElement) {
                    progressElement.remove();
                }
            }, 500);
        }
    };
}

function hideProgress() {
    const progressElement = document.getElementById('progressIndicator');
    if (progressElement) {
        progressElement.remove();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 15px 20px; border-radius: 5px; color: white;
        font-weight: 500; max-width: 300px; word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function validateFile(file) {
    if (!CONFIG_CACHE) {
        CONFIG_CACHE = await window.getConfig();
    }
    
    if (file.size > CONFIG_CACHE.FILE_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${CONFIG_CACHE.FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!CONFIG_CACHE.FILE_CONFIG.ACCEPTED_TYPES.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no válido. Tipos aceptados: ${CONFIG_CACHE.FILE_CONFIG.ACCEPTED_TYPES.join(', ')}`);
    }
    
    return true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Agregar estilos CSS para las animaciones
if (!document.getElementById('utilsStyles')) {
    const style = document.createElement('style');
    style.id = 'utilsStyles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}