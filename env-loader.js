// Cargador de variables de entorno para el navegador
class EnvLoader {
    static async loadEnv() {
        try {
            // En producción, usar el endpoint de API
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            
            if (isProduction) {
                const response = await fetch('/api/env');
                if (response.ok) {
                    const envVars = await response.json();
                    
                    // Verificar que las variables críticas estén presentes
                    if (!envVars.API_BASE_URL || !envVars.LOGIN_API_URL) {
                        throw new Error('Variables de entorno críticas no configuradas en Vercel');
                    }
                    
                    window.ENV = envVars;
                    return envVars;
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error cargando configuración');
                }
            } else {
                // En desarrollo, intentar cargar el archivo .env
                const response = await fetch('./.env');
                if (response.ok) {
                    const envText = await response.text();
                    const envVars = this.parseEnv(envText);
                    window.ENV = envVars;
                    return envVars;
                } else {
                    // Check content type to avoid parsing HTML as JSON
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('text/html')) {
                        console.warn('Received HTML response instead of .env file');
                        throw new Error('Archivo .env no encontrado en desarrollo');
                    }
                    throw new Error('Archivo .env no encontrado en desarrollo');
                }
            }
        } catch (error) {
            console.error('Error cargando variables de entorno:', error);
            
            // Mostrar error al usuario
            if (document.body) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: fixed; top: 0; left: 0; right: 0; 
                    background: #f44336; color: white; padding: 15px; 
                    text-align: center; z-index: 9999;
                `;
                errorDiv.innerHTML = `
                    <strong>Error de Configuración:</strong> ${error.message}<br>
                    <small>Contacte al administrador del sistema</small>
                `;
                document.body.prepend(errorDiv);
            }
            
            return {};
        }
    }
    
    static parseEnv(envText) {
        const envVars = {};
        const lines = envText.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                }
            }
        }
        
        return envVars;
    }
}

// Cargar variables de entorno inmediatamente y esperar
if (typeof window !== 'undefined') {
    // Crear una promesa global para que otros scripts puedan esperar
    window.envLoaded = EnvLoader.loadEnv();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvLoader;
} else {
    window.EnvLoader = EnvLoader;
}