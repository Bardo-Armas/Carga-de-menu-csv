// Sistema de autenticación basado en roles
class AuthManager {
    constructor() {
        this.config = null;
        this.initializeLogin();
    }
    
    async initializeLogin() {
        // Esperar a que la configuración esté lista
        this.config = await window.getConfig();
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Verificar si ya está autenticado
        if (this.isAuthenticated() && window.location.pathname.includes('index.html')) {
            window.location.href = 'dashboard.html';
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        // Asegurar que tenemos la configuración
        if (!this.config) {
            this.config = await window.getConfig();
        }
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const loading = document.getElementById('loading');
        const errorMessage = document.getElementById('errorMessage');
        
        // Mostrar loading
        loginBtn.disabled = true;
        loading.style.display = 'block';
        errorMessage.style.display = 'none';
        
        try {
            const response = await fetch(this.config.LOGIN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Validar que el usuario tenga un rol permitido
                const userRole = data.data.role;
                if (!this.isRoleAllowed(userRole)) {
                    throw new Error(`Acceso denegado. Rol '${userRole}' no autorizado.`);
                }
                
                // Guardar datos del usuario y sesión
                localStorage.setItem(CONFIG.AUTH_USER_KEY, JSON.stringify(data.data));
                localStorage.setItem(CONFIG.AUTH_SESSION_KEY, JSON.stringify({
                    loginTime: new Date().toISOString(),
                    role: userRole,
                    userId: data.data.id
                }));
                
                // Redirigir a la página principal
                window.location.href = 'dashboard.html';  // Y aquí
            } else {
                throw new Error(data.message || 'Error de autenticación');
            }
        } catch (error) {
            console.error('Error en login:', error);
            errorMessage.textContent = error.message || 'Error de conexión. Intente nuevamente.';
            errorMessage.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loading.style.display = 'none';
        }
    }
    
    isRoleAllowed(role) {
        return CONFIG.ALLOWED_ROLES.includes(role);
    }
    
    isAuthenticated() {
        const user = this.getUser();
        const session = this.getSession();
        
        if (!user || !session) {
            return false;
        }
        
        // Verificar que el rol siga siendo válido
        return this.isRoleAllowed(user.role);
    }
    
    getUser() {
        const userStr = localStorage.getItem(CONFIG.AUTH_USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }
    
    getSession() {
        const sessionStr = localStorage.getItem(CONFIG.AUTH_SESSION_KEY);
        return sessionStr ? JSON.parse(sessionStr) : null;
    }
    
    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }
    
    hasRole(role) {
        const userRole = this.getUserRole();
        return userRole === role;
    }
    
    hasAnyRole(roles) {
        const userRole = this.getUserRole();
        return roles.includes(userRole);
    }
    
    logout() {
        localStorage.removeItem(CONFIG.AUTH_USER_KEY);
        localStorage.removeItem(CONFIG.AUTH_SESSION_KEY);
        window.location.href = 'index.html';
    }
    
    // Middleware para proteger rutas
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html'; 
            return false;
        }
        return true;
    }
    
    // Middleware para requerir roles específicos
    requireRole(requiredRoles) {
        if (!this.requireAuth()) {
            return false;
        }
        
        const userRole = this.getUserRole();
        const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        
        if (!rolesArray.includes(userRole)) {
            alert(`Acceso denegado. Se requiere uno de estos roles: ${rolesArray.join(', ')}`);
            return false;
        }
        
        return true;
    }
    
    // Headers para peticiones (sin token, solo información de sesión)
    getAuthHeaders() {
        const user = this.getUser();
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-ID': user ? user.id.toString() : '',
            'X-User-Role': user ? user.role : ''
        };
    }
}

// Inicializar el sistema de autenticación
const authManager = new AuthManager();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AuthManager = authManager;
}