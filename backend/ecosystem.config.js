module.exports = {
  apps: [
    {
      name: 'creche-management-system',
      script: './server.js',
      instances: 'max', // Utiliser tous les CPU disponibles
      exec_mode: 'cluster',
      
      // Variables d'environnement par défaut
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      
      // Variables pour la production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      
      // Variables pour le staging
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3003
      },
      
      // Configuration des logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Gestion des erreurs et redémarrage
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Surveillance
      watch: false, // Désactiver en production
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads'
      ],
      
      // Configuration avancée
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Métriques et monitoring
      pmx: true,
      
      // Configuration pour le déploiement
      post_update: ['npm install', 'echo "Application mise à jour"'],
      
      // Variables d'environnement spécifiques
      env_vars: {
        COMMON_VARIABLE: 'true'
      }
    }
  ],

  // Configuration de déploiement (optionnel)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/creche-management-system.git',
      path: '/var/www/creche-management-system',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:username/creche-management-system.git',
      path: '/var/www/creche-management-system-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
}
