exports.handler = async function(event, context) {
  // Solo permitir GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Devolver las variables de entorno
    const envVars = {
      API_BASE_URL: process.env.API_BASE_URL || 'Entorno prueba',
      LOGIN_API_URL: process.env.LOGIN_API_URL || 'Entorno prueba',
      AUTH_USER_KEY: process.env.AUTH_USER_KEY || 'auth_user',
      AUTH_SESSION_KEY: process.env.AUTH_SESSION_KEY || 'auth_session',
      ALLOWED_ROLES: process.env.ALLOWED_ROLES || 'Call-center,Administrador,Dirección'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envVars)
    };
  } catch (error) {
    console.error('Error en función env:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error.message
      })
    };
  }
};