const db = require('../config/database');

// Middleware pour logger les requêtes
const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Capturer la réponse originale
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseData = null;
  
  // Override res.send
  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };
  
  // Override res.json
  res.json = function(data) {
    responseData = data;
    return originalJson.call(this, data);
  };
  
  // Logger après la réponse
  res.on('finish', async () => {
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000; // en secondes
    
    // Déterminer le niveau de log
    let level = 'info';
    if (res.statusCode >= 500) {
      level = 'error';
    } else if (res.statusCode >= 400) {
      level = 'warning';
    }
    
    // Déterminer l'action basée sur la route
    let action = 'unknown';
    const path = req.route?.path || req.path;
    const method = req.method;
    
    if (path.includes('/auth/login')) action = 'login';
    else if (path.includes('/auth/logout')) action = 'logout';
    else if (path.includes('/children') && method === 'POST') action = 'create_child';
    else if (path.includes('/children') && method === 'PUT') action = 'update_child';
    else if (path.includes('/children') && method === 'DELETE') action = 'delete_child';
    else if (path.includes('/enrollments') && method === 'POST') action = 'create_enrollment';
    else if (path.includes('/enrollments') && path.includes('/approve')) action = 'approve_enrollment';
    else if (path.includes('/enrollments') && path.includes('/reject')) action = 'reject_enrollment';
    else if (path.includes('/attendance') && method === 'POST') action = 'create_attendance';
    else if (path.includes('/documents') && method === 'POST') action = 'upload_document';
    else if (path.includes('/settings') && method === 'PUT') action = 'update_settings';
    else if (path.includes('/reports')) action = 'view_reports';
    else action = `${method.toLowerCase()}_${path.split('/')[2] || 'unknown'}`;
    
    // Construire le message
    let message = `${method} ${req.originalUrl} - ${res.statusCode}`;
    if (req.user) {
      message += ` - User: ${req.user.first_name} ${req.user.last_name} (${req.user.email})`;
    }
    
    // Données additionnelles (sans les mots de passe)
    const additionalData = {
      body: sanitizeData(req.body),
      query: req.query,
      params: req.params
    };
    
    // Insérer le log en base
    try {
      await db.execute(`
        INSERT INTO logs (
          level, message, action, user_id, ip_address, user_agent,
          request_method, request_url, response_status, execution_time, additional_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        level,
        message,
        action,
        req.user?.id || null,
        getClientIP(req),
        req.get('User-Agent') || null,
        method,
        req.originalUrl,
        res.statusCode,
        executionTime,
        JSON.stringify(additionalData)
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'insertion du log:', error);
    }
  });
  
  next();
};

// Fonction pour obtenir l'IP du client
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.connection?.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

// Fonction pour nettoyer les données sensibles
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Fonction pour logger manuellement
const logger = {
  info: async (message, action = null, userId = null, additionalData = null) => {
    await logToDatabase('info', message, action, userId, additionalData);
  },
  
  warning: async (message, action = null, userId = null, additionalData = null) => {
    await logToDatabase('warning', message, action, userId, additionalData);
  },
  
  error: async (message, action = null, userId = null, additionalData = null) => {
    await logToDatabase('error', message, action, userId, additionalData);
  },
  
  debug: async (message, action = null, userId = null, additionalData = null) => {
    await logToDatabase('debug', message, action, userId, additionalData);
  }
};

async function logToDatabase(level, message, action, userId, additionalData) {
  try {
    await db.execute(`
      INSERT INTO logs (level, message, action, user_id, additional_data)
      VALUES (?, ?, ?, ?, ?)
    `, [
      level,
      message,
      action,
      userId,
      additionalData ? JSON.stringify(additionalData) : null
    ]);
  } catch (error) {
    console.error('Erreur lors de l\'insertion du log manuel:', error);
  }
}

module.exports = { loggerMiddleware, logger };
