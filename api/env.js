export default function handler(req, res) {
  // Solo permitir GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que las variables de entorno estén configuradas
  if (!process.env.API_BASE_URL || !process.env.LOGIN_API_URL) {
    return res.status(500).json({ 
      error: 'Environment variables not configured',
      message: 'Please configure API_BASE_URL and LOGIN_API_URL in Vercel dashboard'
    });
  }

  // Devolver las variables de entorno
  const envVars = {
    API_BASE_URL: process.env.API_BASE_URL,
    LOGIN_API_URL: process.env.LOGIN_API_URL,
    AUTH_USER_KEY: process.env.AUTH_USER_KEY || 'auth_user',
    AUTH_SESSION_KEY: process.env.AUTH_SESSION_KEY || 'auth_session',
    ALLOWED_ROLES: process.env.ALLOWED_ROLES || 'Call-center,Administrador,Dirección'
  };

  res.status(200).json(envVars);
}