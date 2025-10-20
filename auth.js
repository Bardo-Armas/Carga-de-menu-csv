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
                
                if (this.isRoleAllowed(userRole)) {
                    // Guardar datos del usuario y sesión
                    localStorage.setItem(this.config.AUTH_USER_KEY, JSON.stringify(data.data));
                    localStorage.setItem(this.config.AUTH_SESSION_KEY, JSON.stringify({
                        token: data.token,
                        timestamp: Date.now()
                    }));
                    
                    // Redirigir al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    throw new Error(`Acceso denegado. Rol '${userRole}' no autorizado.`);
                }
            } else {
                throw new Error(data.message || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error('Error en login:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loading.style.display = 'none';
        }
    }
    
    isRoleAllowed(role) {
        return this.config.ALLOWED_ROLES.includes(role);
    }
    
    isAuthenticated() {
        const user = this.getUser();
        const session = this.getSession();
        
        if (user && session) {
            return true;
        }
        return false;
    }
    
    getUser() {
        const userStr = localStorage.getItem(this.config?.AUTH_USER_KEY || 'auth_user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    getSession() {
        const sessionStr = localStorage.getItem(this.config?.AUTH_SESSION_KEY || 'auth_session');
        return sessionStr ? JSON.parse(sessionStr) : null;
    }
    
    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }
    
    hasRole(role) {
        return this.getUserRole() === role;
    }
    
    hasAnyRole(roles) {
        const userRole = this.getUserRole();
        return roles.includes(userRole);
    }
    
    async logout() {
        if (!this.config) {
            this.config = await window.getConfig();
        }
        localStorage.removeItem(this.config.AUTH_USER_KEY);
        localStorage.removeItem(this.config.AUTH_SESSION_KEY);
        window.location.href = 'index.html';
    }
    
    async requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    async requireRole(requiredRoles) {
        if (!this.config) {
            this.config = await window.getConfig();
        }
        
        if (!this.requireAuth()) {
            return false;
        }
        
        const userRole = this.getUserRole();
        if (!requiredRoles.includes(userRole)) {
            alert(`Acceso denegado. Se requiere uno de estos roles: ${requiredRoles.join(', ')}`);
            return false;
        }
        
        return true;
    }
    
    getAuthHeaders() {
        const session = this.getSession();
        if (session && session.token) {
            return {
                'Authorization': `Bearer ${session.token}`
            };
        }
        return {};
    }
}

const authManager = new AuthManager();

if (typeof window !== 'undefined') {
    window.AuthManager = authManager;
}