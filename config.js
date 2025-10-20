// Configuración de la aplicación
class ConfigManager {
    constructor() {
        this.envVars = this.loadEnvVars();
    }

    loadEnvVars() {
        return {
            API_BASE_URL: this.getEnvVar('API_BASE_URL', 'menu'),
            LOGIN_API_URL: this.getEnvVar('LOGIN_API_URL', 'admins'),
            AUTH_USER_KEY: this.getEnvVar('AUTH_USER_KEY', 'auth_user'),
            AUTH_SESSION_KEY: this.getEnvVar('AUTH_SESSION_KEY', 'auth_session'),
            ALLOWED_ROLES: this.getEnvVar('ALLOWED_ROLES', 'roles')
        };
    }

    getEnvVar(key, defaultValue) {
        if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
            return window.ENV[key];
        }
        return defaultValue;
    }
}

const configManager = new ConfigManager();

const CONFIG = {
    API_BASE_URL: configManager.envVars.API_BASE_URL,
    LOGIN_API_URL: configManager.envVars.LOGIN_API_URL,
    AUTH_USER_KEY: configManager.envVars.AUTH_USER_KEY,
    AUTH_SESSION_KEY: configManager.envVars.AUTH_SESSION_KEY,
    ALLOWED_ROLES: configManager.envVars.ALLOWED_ROLES,
    
    // Colores pastel para las categorías
    PASTEL_COLORS: [
        '#FFE5E5', // Rosa pastel
        '#E5F3FF', // Azul pastel
        '#E5FFE5', // Verde pastel
        '#FFF5E5', // Naranja pastel
        '#F0E5FF', // Púrpura pastel
        '#E5FFFF', // Cian pastel
        '#FFFFE5', // Amarillo pastel
        '#FFE5F5', // Magenta pastel
        '#F5FFE5', // Lima pastel
        '#E5F0FF', // Lavanda pastel
        '#FFE5D5', // Durazno pastel
        '#D5FFE5'  // Menta pastel
    ],
    
    // Configuración de archivos
    FILE_CONFIG: {
        ACCEPTED_TYPES: ['.csv'],
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    },
    
    // Configuración de UI
    UI_CONFIG: {
        SCROLL_AMOUNT: 200,
        PROGRESS_INTERVAL: 100,
        MODAL_ANIMATION_DURATION: 300
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}