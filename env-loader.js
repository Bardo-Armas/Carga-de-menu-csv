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
                    window.ENV = envVars;
                    return envVars;
                }
            } else {
                // En desarrollo, intentar cargar el archivo .env
                const response = await fetch('./.env');
                if (response.ok) {
                    const envText = await response.text();
                    const envVars = this.parseEnv(envText);
                    window.ENV = envVars;
                    return envVars;
                }
            }
            
            console.warn('No se pudo cargar el archivo .env, usando valores por defecto');
            // Valores por defecto
            window.ENV = {
                API_BASE_URL: 'https://da-pw.tupide.mx/api/menu-mc',
                LOGIN_API_URL: 'https://control.da-pw.mx/api/panel-administrativo/admins/subitoInterno',
                AUTH_USER_KEY: 'auth_user',
                AUTH_SESSION_KEY: 'auth_session',
                ALLOWED_ROLES: 'Call-center,Administrador,Dirección'
            };
            return window.ENV;
        } catch (error) {
            console.warn('Error cargando variables de entorno:', error);
            return {};
        }
    }
    
    static parseEnv(envText) {
        const envVars = {};
        const lines = envText.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return envVars;
    }
}

// Cargar variables de entorno al inicializar
if (typeof window !== 'undefined') {
    EnvLoader.loadEnv();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvLoader;
} else {
    window.EnvLoader = EnvLoader;
}