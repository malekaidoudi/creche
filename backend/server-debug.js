const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration pour Railway proxy
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://malekaidoudi.github.io'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Crèche Backend API - Debug Mode',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Route de debug avec création d'utilisateurs
app.get('/api/debug', async (req, res) => {
  try {
    console.log('🔍 Route debug appelée');
    
    const mysql = require('mysql2/promise');
    const bcrypt = require('bcryptjs');
    
    // Configuration Railway
    const config = {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    };
    
    console.log('📋 Config Railway:', {
      host: config.host,
      database: config.database,
      hasPassword: !!config.password
    });
    
    if (!config.host || !config.user || !config.password) {
      return res.json({
        error: 'Variables Railway manquantes',
        env: {
          MYSQLHOST: !!process.env.MYSQLHOST,
          MYSQLUSER: !!process.env.MYSQLUSER,
          MYSQLPASSWORD: !!process.env.MYSQLPASSWORD,
          MYSQLDATABASE: !!process.env.MYSQLDATABASE
        }
      });
    }
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion MySQL OK');
    
    // Créer table users
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'parent') DEFAULT 'parent',
        profile_image VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table users créée');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Insérer utilisateurs de test
    const users = [
      ['Admin', 'Test', 'admin@creche.test', hashedPassword, 'admin', '+33123456789'],
      ['Staff', 'Test', 'staff@creche.test', hashedPassword, 'staff', '+33123456790'],
      ['Parent', 'Test', 'parent@creche.test', hashedPassword, 'parent', '+33123456791']
    ];
    
    for (const user of users) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO users (first_name, last_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
          user
        );
      } catch (e) {
        console.log('Utilisateur existe déjà:', user[2]);
      }
    }
    
    // Vérifier utilisateurs créés
    const [userList] = await connection.execute('SELECT email, role FROM users');
    
    await connection.end();
    
    res.json({
      status: 'OK',
      message: 'Debug Railway réussi',
      environment: process.env.NODE_ENV,
      database: config.database,
      users: userList,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    res.status(500).json({
      error: 'Debug error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route de login simple
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    const mysql = require('mysql2/promise');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const config = {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    };
    
    const connection = await mysql.createConnection(config);
    
    // Chercher utilisateur
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    
    if (users.length === 0) {
      await connection.end();
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const user = users[0];
    
    // Vérifier mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      await connection.end();
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Créer token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    await connection.end();
    
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
});

module.exports = app;
