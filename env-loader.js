// Cargador de variables de entorno para el navegador
class EnvLoader {
    static async loadEnv() {
        try {
            // En producción, usar el endpoint de API
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            
            if (isProduction) {
                try {
                    const response = await fetch('/api/env');
                    
                    // Verificar si la respuesta está vacía
                    const responseText = await response.text();
                    if (!responseText || responseText.trim() === '') {
                        throw new Error('Respuesta vacía del servidor');
                    }
                    
                    // Intentar parsear el JSON
                    let envVars;
                    try {
                        envVars = JSON.parse(responseText);
                    } catch (jsonError) {
                        console.error('Error parseando JSON:', responseText);
                        throw new Error(`Error parseando JSON: ${jsonError.message}`);
                    }
                    
                    // Verificar que las variables críticas estén presentes
                    if (!envVars.API_BASE_URL || !envVars.LOGIN_API_URL) {
                        throw new Error('Variables de entorno críticas no configuradas en Netlify');
                    }
                    
                    window.ENV = envVars;
                    return envVars;
                } catch (fetchError) {
                    console.error('Error obteniendo variables de entorno:', fetchError);
                    throw new Error(`Error de API: ${fetchError.message}`);
                }
            } else {
                // En desarrollo, intentar cargar el archivo .env
                try {
                    const response = await fetch('./.env');
                    if (response.ok) {
                        const envText = await response.text();
                        const envVars = this.parseEnv(envText);
                        window.ENV = envVars;
                        return envVars;
                    } else {
                        console.warn('Archivo .env no encontrado, usando valores por defecto para desarrollo');
                        // Valores por defecto para desarrollo
                        const defaultEnvVars = {
                            API_BASE_URL: 'Entorno prueba',
                            LOGIN_API_URL: 'Entorno prueba',
                            AUTH_USER_KEY: 'auth_user',
                            AUTH_SESSION_KEY: 'auth_session',
                            ALLOWED_ROLES: 'Call-center,Administrador,Dirección'
                        };
                        window.ENV = defaultEnvVars;
                        return defaultEnvVars;
                    }
                } catch (error) {
                    console.error('Error cargando .env:', error);
                    throw new Error('Error cargando configuración de desarrollo');
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