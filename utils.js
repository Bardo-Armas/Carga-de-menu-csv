// Utilidades generales
class Utils {
    // Función para obtener color aleatorio
    static getRandomPastelColor() {
        return CONFIG.PASTEL_COLORS[Math.floor(Math.random() * CONFIG.PASTEL_COLORS.length)];
    }
    
    // Función para mostrar progreso
    static showProgress(progressId, progressBarId) {
        const progressContainer = document.getElementById(progressId);
        progressContainer.style.display = 'block';
        
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += 10;
                document.getElementById(progressBarId).style.width = width + '%';
            }
        }, CONFIG.UI_CONFIG.PROGRESS_INTERVAL);
        return interval;
    }
    
    // Función para ocultar progreso
    static hideProgress(progressId, progressBarId, interval) {
        clearInterval(interval);
        document.getElementById(progressBarId).style.width = '100%';
        setTimeout(() => {
            document.getElementById(progressId).style.display = 'none';
            document.getElementById(progressBarId).style.width = '0%';
        }, 500);
    }
    
    // Función para mostrar resultado
    static showResult(resultId, message, isSuccess) {
        const resultDiv = document.getElementById(resultId);
        resultDiv.textContent = message;
        resultDiv.className = `result ${isSuccess ? 'success' : 'error'}`;
        resultDiv.style.display = 'block';
    }
    
    // Función para descargar archivo CSV
    static downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Función para validar archivo
    static validateFile(file) {
        if (!file) {
            return { valid: false, message: 'Por favor selecciona un archivo CSV' };
        }
        
        if (!file.name.endsWith('.csv')) {
            return { valid: false, message: 'El archivo debe tener extensión .csv' };
        }
        
        if (file.size > CONFIG.FILE_CONFIG.MAX_FILE_SIZE) {
            return { valid: false, message: 'El archivo es demasiado grande (máximo 10MB)' };
        }
        
        return { valid: true };
    }
    
    // Función para configurar input de archivo con drag & drop
    static setupFileInput(inputId) {
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
        
        // Drag and drop
        ['dragover', 'dragenter'].forEach(eventName => {
            input.addEventListener(eventName, (e) => {
                e.preventDefault();
                input.style.borderColor = 'var(--primary-yellow)';
                input.style.background = '#FFFBEB';
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            input.addEventListener(eventName, (e) => {
                e.preventDefault();
                input.style.borderColor = '';
                input.style.background = '';
            });
        });
        
        input.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.endsWith('.csv')) {
                input.files = files;
                input.dispatchEvent(new Event('change'));
            }
        });
    }
}

// Exportar utilidades
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}