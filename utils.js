// Utilidades generales
let UTILS_CONFIG_CACHE = null;

async function getRandomPastelColor() {
    if (!UTILS_CONFIG_CACHE) {
        UTILS_CONFIG_CACHE = await window.getConfig();
    }
    return UTILS_CONFIG_CACHE.PASTEL_COLORS[Math.floor(Math.random() * UTILS_CONFIG_CACHE.PASTEL_COLORS.length)];
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
        if (!UTILS_CONFIG_CACHE) {
            UTILS_CONFIG_CACHE = await window.getConfig();
        }
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        document.getElementById('progressBar').style.width = progress + '%';
    }, UTILS_CONFIG_CACHE?.UI_CONFIG?.PROGRESS_INTERVAL || 100);
    
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
    if (!UTILS_CONFIG_CACHE) {
        UTILS_CONFIG_CACHE = await window.getConfig();
    }
    
    if (file.size > UTILS_CONFIG_CACHE.FILE_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${UTILS_CONFIG_CACHE.FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!UTILS_CONFIG_CACHE.FILE_CONFIG.ACCEPTED_TYPES.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no válido. Tipos aceptados: ${UTILS_CONFIG_CACHE.FILE_CONFIG.ACCEPTED_TYPES.join(', ')}`);
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

// Añadir esta función a tu archivo utils.js existente

Utils.fetchJSON = async function(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        // Verificar si la respuesta está vacía
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
            throw new Error('Respuesta vacía del servidor');
        }
        
        // Intentar parsear el JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Error parseando JSON:', responseText);
            throw new Error(`Error parseando JSON: ${jsonError.message}`);
        }
        
        // Devolver objeto con datos y estado de la respuesta
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('Error en fetchJSON:', error);
        throw error;
    }
};

// Función para mostrar resultado
function showResult(resultId, message, isSuccess) {
    const resultDiv = document.getElementById(resultId);
    resultDiv.textContent = message;
    resultDiv.className = `result ${isSuccess ? 'success' : 'error'}`;
    resultDiv.style.display = 'block';
}

// Mejorar experiencia de selección de archivos
function setupFileInput(inputId) {
    const input = document.getElementById(inputId);
    
    input.addEventListener('change', function() {
        if (this.files.length > 0) {
            this.classList.add('file-selected');
            this.style.color = 'var(--success-green)';
            this.setAttribute('data-text', `Archivo seleccionado: ${this.files[0].name}`);
        } else {
            this.classList.remove('file-selected');
            this.style.color = '';
            this.removeAttribute('data-text');
        }
    });
}

// Crear el objeto Utils si no existe
window.Utils = window.Utils || {};

// Exportar todas las funciones necesarias al objeto global Utils
Utils.validateFile = validateFile;
Utils.showProgress = showProgress;
Utils.hideProgress = hideProgress;
Utils.showResult = showResult;
Utils.formatFileSize = formatFileSize;
Utils.debounce = debounce;
Utils.setupFileInput = setupFileInput;

// Añadir la función downloadCSV al objeto Utils
Utils.downloadCSV = function(csvContent, fileName) {
    // Crear un elemento <a> invisible
    const link = document.createElement('a');
    
    // Crear un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);
    
    // Configurar el enlace
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    // Añadir el enlace al DOM
    document.body.appendChild(link);
    
    // Simular clic en el enlace
    link.click();
    
    // Limpiar: eliminar el enlace del DOM
    document.body.removeChild(link);
    
    // Liberar la URL del objeto
    URL.revokeObjectURL(url);
};