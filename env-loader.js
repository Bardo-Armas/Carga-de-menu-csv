// Cargador de variables de entorno para el navegador
class EnvLoader {
    static async loadEnv() {
        try {
            const response = await fetch('./.env');
            if (!response.ok) {
                console.warn('No se pudo cargar el archivo .env, usando valores por defecto');
                return;
            }
            
            const envText = await response.text();
            const envVars = this.parseEnv(envText);
            
            // Hacer las variables disponibles globalmente
            window.ENV = envVars;
            
            return envVars;
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