#!/usr/bin/env node

/**
 * Script de déploiement automatisé pour l'application Crèche
 * Déploie le frontend sur Vercel et le backend sur Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  frontend: {
    name: 'creche-frontend',
    platform: 'vercel',
    directory: './frontend',
    repository: 'https://github.com/malekaidoudi/creche-frontend'
  },
  backend: {
    name: 'creche-backend-api',
    platform: 'heroku',
    directory: './backend',
    repository: 'https://github.com/malekaidoudi/creche-backend'
  }
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`Exécution: ${command}`, 'cyan');
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    log(`Erreur lors de l'exécution: ${command}`, 'red');
    throw error;
  }
}

async function checkPrerequisites() {
  log('🔍 Vérification des prérequis...', 'yellow');
  
  const commands = [
    { cmd: 'git --version', name: 'Git', required: true },
    { cmd: 'node --version', name: 'Node.js', required: true },
    { cmd: 'npm --version', name: 'NPM', required: true },
    { cmd: 'vercel --version', name: 'Vercel CLI', required: false },
    { cmd: 'heroku --version', name: 'Heroku CLI', required: false }
  ];

  const missing = [];

  for (const { cmd, name, required } of commands) {
    try {
      execCommand(cmd, { stdio: 'pipe' });
      log(`✅ ${name} installé`, 'green');
    } catch (error) {
      log(`❌ ${name} non installé`, 'red');
      if (required) {
        throw new Error(`${name} est requis pour le déploiement`);
      } else {
        missing.push(name);
      }
    }
  }

  if (missing.length > 0) {
    log('⚠️  Outils manquants détectés:', 'yellow');
    missing.forEach(tool => log(`   - ${tool}`, 'yellow'));
    log('', 'reset');
    log('🔧 Pour installer automatiquement les outils manquants:', 'cyan');
    log('   npm run install:prerequisites', 'cyan');
    log('', 'reset');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Voulez-vous continuer sans ces outils? (y/N): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      throw new Error('Installation des prérequis requise');
    }
  }
}

async function createRepositories() {
  log('📦 Création des dépôts séparés...', 'yellow');

  // Créer le dépôt frontend
  if (!fs.existsSync('./creche-frontend')) {
    execCommand('mkdir creche-frontend');
    execCommand('cp -r ./frontend/* ./creche-frontend/');
    execCommand('cd creche-frontend && git init');
    execCommand('cd creche-frontend && git add .');
    execCommand('cd creche-frontend && git commit -m "Initial frontend commit"');
    log('✅ Dépôt frontend créé', 'green');
  }

  // Créer le dépôt backend
  if (!fs.existsSync('./creche-backend')) {
    execCommand('mkdir creche-backend');
    execCommand('cp -r ./backend/* ./creche-backend/');
    execCommand('cd creche-backend && git init');
    execCommand('cd creche-backend && git add .');
    execCommand('cd creche-backend && git commit -m "Initial backend commit"');
    log('✅ Dépôt backend créé', 'green');
  }
}

async function deployBackend() {
  log('🚀 Déploiement du backend sur Heroku...', 'yellow');

  process.chdir('./creche-backend');

  try {
    // Créer l'application Heroku
    execCommand(`heroku create ${CONFIG.backend.name} --region eu`);
    
    // Ajouter l'addon MySQL ClearDB
    execCommand(`heroku addons:create cleardb:ignite --app ${CONFIG.backend.name}`);
    
    // Configurer les variables d'environnement
    const envVars = [
      'NODE_ENV=production',
      'UPLOAD_PATH=/tmp/uploads',
      `JWT_SECRET=${generateJWTSecret()}`
    ];

    for (const envVar of envVars) {
      execCommand(`heroku config:set ${envVar} --app ${CONFIG.backend.name}`);
    }

    // Récupérer l'URL de la base de données ClearDB
    const dbUrl = execCommand(`heroku config:get CLEARDB_DATABASE_URL --app ${CONFIG.backend.name}`, { stdio: 'pipe' });
    const dbConfig = parseClearDBUrl(dbUrl.trim());
    
    // Configurer les variables de base de données
    execCommand(`heroku config:set DB_HOST=${dbConfig.host} --app ${CONFIG.backend.name}`);
    execCommand(`heroku config:set DB_PORT=${dbConfig.port} --app ${CONFIG.backend.name}`);
    execCommand(`heroku config:set DB_USER=${dbConfig.user} --app ${CONFIG.backend.name}`);
    execCommand(`heroku config:set DB_PASSWORD=${dbConfig.password} --app ${CONFIG.backend.name}`);
    execCommand(`heroku config:set DB_NAME=${dbConfig.database} --app ${CONFIG.backend.name}`);

    // Déployer
    execCommand('git add .');
    execCommand('git commit -m "Deploy to Heroku" --allow-empty');
    execCommand(`heroku git:remote -a ${CONFIG.backend.name}`);
    execCommand('git push heroku main');

    log('✅ Backend déployé sur Heroku', 'green');
    
    const backendUrl = `https://${CONFIG.backend.name}.herokuapp.com`;
    log(`🌐 Backend URL: ${backendUrl}`, 'cyan');
    
    process.chdir('..');
    return backendUrl;

  } catch (error) {
    process.chdir('..');
    throw error;
  }
}

async function deployFrontend(backendUrl) {
  log('🚀 Déploiement du frontend sur Vercel...', 'yellow');

  process.chdir('./creche-frontend');

  try {
    // Mettre à jour la configuration API
    updateFrontendConfig(backendUrl);

    // Déployer sur Vercel
    execCommand('vercel --prod --yes');

    log('✅ Frontend déployé sur Vercel', 'green');
    
    // Récupérer l'URL Vercel
    const frontendUrl = execCommand('vercel --prod --yes', { stdio: 'pipe' }).trim();
    log(`🌐 Frontend URL: ${frontendUrl}`, 'cyan');
    
    process.chdir('..');
    return frontendUrl;

  } catch (error) {
    process.chdir('..');
    throw error;
  }
}

function updateFrontendConfig(backendUrl) {
  const configPath = './src/config/api.js';
  let config = fs.readFileSync(configPath, 'utf8');
  
  // Remplacer l'URL de base
  config = config.replace(
    /BASE_URL: process\.env\.NODE_ENV === 'production'[^,]+,/,
    `BASE_URL: process.env.NODE_ENV === 'production' 
    ? '${backendUrl}'
    : 'http://localhost:3003',`
  );
  
  fs.writeFileSync(configPath, config);
  log('✅ Configuration frontend mise à jour', 'green');
}

function generateJWTSecret() {
  return require('crypto').randomBytes(64).toString('hex');
}

function parseClearDBUrl(url) {
  // Format: mysql://username:password@hostname:port/database_name?reconnect=true
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) {
    throw new Error('Format URL ClearDB invalide');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

async function testDeployment(frontendUrl, backendUrl) {
  log('🧪 Test du déploiement...', 'yellow');

  try {
    // Test backend
    execCommand(`curl -f ${backendUrl}/api/health`);
    log('✅ Backend accessible', 'green');

    // Test frontend
    execCommand(`curl -f ${frontendUrl}`);
    log('✅ Frontend accessible', 'green');

  } catch (error) {
    log('❌ Erreur lors des tests', 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🚀 DÉPLOIEMENT AUTOMATISÉ - CRÈCHE MANAGEMENT SYSTEM', 'bright');
    log('================================================', 'bright');

    await checkPrerequisites();
    await createRepositories();
    
    const backendUrl = await deployBackend();
    const frontendUrl = await deployFrontend(backendUrl);
    
    await testDeployment(frontendUrl, backendUrl);

    log('🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!', 'green');
    log('================================', 'green');
    log(`Frontend: ${frontendUrl}`, 'cyan');
    log(`Backend:  ${backendUrl}`, 'cyan');
    log('================================', 'green');

  } catch (error) {
    log(`❌ Erreur de déploiement: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };
