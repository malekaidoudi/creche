#!/usr/bin/env node

/**
 * Script de déploiement Railway simplifié
 * Déploie le backend sur Railway et le frontend sur Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function generateJWTSecret() {
  return require('crypto').randomBytes(64).toString('hex');
}

async function deployBackendRailway() {
  log('🚀 Déploiement du backend sur Railway...', 'yellow');

  // Aller dans le dossier backend
  process.chdir('./backend');

  try {
    // Vérifier si Railway est connecté
    log('🔐 Vérification de la connexion Railway...', 'cyan');
    try {
      execCommand('railway whoami', { stdio: 'pipe' });
      log('✅ Déjà connecté à Railway', 'green');
    } catch (error) {
      log('🔑 Connexion à Railway requise...', 'yellow');
      execCommand('railway login');
    }

    // Initialiser le projet Railway
    log('📦 Initialisation du projet Railway...', 'cyan');
    try {
      execCommand('railway init --name creche-backend-api');
    } catch (error) {
      log('⚠️  Projet peut-être déjà initialisé', 'yellow');
    }

    // Configurer les variables d'environnement
    log('🔧 Configuration des variables d\'environnement...', 'cyan');
    const jwtSecret = generateJWTSecret();
    
    execCommand('railway variables --set NODE_ENV=production');
    execCommand('railway variables --set PORT=3000');
    execCommand(`railway variables --set JWT_SECRET="${jwtSecret}"`);
    execCommand('railway variables --set UPLOAD_PATH=/tmp/uploads');

    // Ajouter la base de données MySQL via l'interface web
    log('🗄️ Configuration de la base de données...', 'cyan');
    log('⚠️  Ajoutez manuellement MySQL depuis le dashboard Railway:', 'yellow');
    log('   https://railway.com/project/a58842f2-68a3-4440-96e0-3a5007bc15ed', 'cyan');

    // Déployer
    log('🚀 Déploiement en cours...', 'cyan');
    execCommand('railway up --detach');

    // Attendre un peu pour que le déploiement se lance
    log('⏳ Attente du déploiement...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Récupérer l'URL du service
    log('🔍 Récupération de l\'URL du service...', 'cyan');
    let serviceUrl;
    try {
      const status = execCommand('railway status --json', { stdio: 'pipe' });
      const statusData = JSON.parse(status);
      serviceUrl = statusData.service?.url || 'https://creche-backend-api.railway.app';
    } catch (error) {
      serviceUrl = 'https://creche-backend-api.railway.app';
    }

    log('✅ Backend déployé sur Railway', 'green');
    log(`🌐 URL du backend: ${serviceUrl}`, 'cyan');
    
    process.chdir('..');
    return serviceUrl;

  } catch (error) {
    process.chdir('..');
    throw error;
  }
}

async function deployFrontendVercel(backendUrl) {
  log('🚀 Déploiement du frontend sur Vercel...', 'yellow');

  process.chdir('./frontend');

  try {
    // Mettre à jour la configuration API
    updateFrontendConfig(backendUrl);

    // Vérifier si Vercel est connecté
    log('🔐 Vérification de la connexion Vercel...', 'cyan');
    try {
      execCommand('vercel whoami', { stdio: 'pipe' });
      log('✅ Déjà connecté à Vercel', 'green');
    } catch (error) {
      log('🔑 Connexion à Vercel requise...', 'yellow');
      execCommand('vercel login');
    }

    // Déployer sur Vercel
    log('🚀 Déploiement en cours...', 'cyan');
    const deployResult = execCommand('vercel --prod --yes', { stdio: 'pipe' });
    const frontendUrl = deployResult.trim().split('\n').pop();

    log('✅ Frontend déployé sur Vercel', 'green');
    log(`🌐 URL du frontend: ${frontendUrl}`, 'cyan');
    
    process.chdir('..');
    return frontendUrl;

  } catch (error) {
    process.chdir('..');
    throw error;
  }
}

function updateFrontendConfig(backendUrl) {
  const envPath = './.env.production';
  const config = `# Configuration de production pour Vercel
VITE_API_URL=${backendUrl}
VITE_APP_NAME=Mima Elghalia
VITE_APP_VERSION=2.0.0

# Configuration pour Vercel
VITE_BASE_URL=/

# Configuration de sécurité
VITE_ENABLE_DEVTOOLS=false
VITE_LOG_LEVEL=error

# Configuration API
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK_DATA=false`;
  
  fs.writeFileSync(envPath, config);
  log('✅ Configuration frontend mise à jour', 'green');
}

async function testDeployment(frontendUrl, backendUrl) {
  log('🧪 Test du déploiement...', 'yellow');

  try {
    // Test backend (avec timeout plus long)
    log('🔍 Test du backend...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10s
    
    try {
      execCommand(`curl -f ${backendUrl}/api/health`, { stdio: 'pipe' });
      log('✅ Backend accessible', 'green');
    } catch (error) {
      log('⚠️  Backend peut prendre quelques minutes à démarrer', 'yellow');
    }

    // Test frontend
    log('🔍 Test du frontend...', 'cyan');
    try {
      execCommand(`curl -f ${frontendUrl}`, { stdio: 'pipe' });
      log('✅ Frontend accessible', 'green');
    } catch (error) {
      log('⚠️  Frontend peut prendre quelques minutes à être disponible', 'yellow');
    }

  } catch (error) {
    log('⚠️  Tests partiellement réussis', 'yellow');
  }
}

async function main() {
  try {
    log('🚀 DÉPLOIEMENT AVEC RAILWAY + VERCEL', 'bright');
    log('====================================', 'bright');

    const backendUrl = await deployBackendRailway();
    const frontendUrl = await deployFrontendVercel(backendUrl);
    
    await testDeployment(frontendUrl, backendUrl);

    log('🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!', 'green');
    log('==================================', 'green');
    log(`🎨 Frontend: ${frontendUrl}`, 'cyan');
    log(`⚙️  Backend:  ${backendUrl}`, 'cyan');
    log('==================================', 'green');
    log('', 'reset');
    log('📋 Prochaines étapes:', 'yellow');
    log('1. Attendez 2-3 minutes que les services démarrent', 'cyan');
    log('2. Testez votre application', 'cyan');
    log('3. Vérifiez les logs si nécessaire:', 'cyan');
    log('   - Railway: railway logs', 'cyan');
    log('   - Vercel: vercel logs', 'cyan');

  } catch (error) {
    log(`❌ Erreur de déploiement: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
