#!/usr/bin/env node

/**
 * Script d'installation automatique des prérequis pour le déploiement
 * Installe GitHub CLI, Vercel CLI, et Heroku CLI
 */

const { execSync } = require('child_process');
const os = require('os');

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
    return null;
  }
}

function checkCommand(command, name) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${name} déjà installé`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name} non installé`, 'yellow');
    return false;
  }
}

function detectPackageManager() {
  if (checkCommand('yarn --version', 'Yarn')) {
    return 'yarn';
  } else if (checkCommand('npm --version', 'NPM')) {
    return 'npm';
  } else {
    throw new Error('Aucun gestionnaire de paquets trouvé (npm ou yarn requis)');
  }
}

function detectOS() {
  const platform = os.platform();
  if (platform === 'darwin') return 'macos';
  if (platform === 'linux') return 'linux';
  if (platform === 'win32') return 'windows';
  return 'unknown';
}

async function installHomebrew() {
  log('🍺 Installation de Homebrew...', 'yellow');
  const installScript = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
  execCommand(installScript);
}

async function installGitHubCLI() {
  log('📦 Installation de GitHub CLI...', 'yellow');
  const osType = detectOS();
  
  switch (osType) {
    case 'macos':
      if (!checkCommand('brew --version', 'Homebrew')) {
        await installHomebrew();
      }
      execCommand('brew install gh');
      break;
    case 'linux':
      execCommand('curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg');
      execCommand('echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null');
      execCommand('sudo apt update && sudo apt install gh');
      break;
    case 'windows':
      log('Sur Windows, téléchargez GitHub CLI depuis: https://cli.github.com/', 'cyan');
      break;
    default:
      log('OS non supporté pour l\'installation automatique', 'red');
  }
}

async function installVercelCLI() {
  log('⚡ Installation de Vercel CLI...', 'yellow');
  const packageManager = detectPackageManager();
  
  if (packageManager === 'yarn') {
    execCommand('yarn global add vercel@latest');
  } else {
    execCommand('npm install -g vercel@latest');
  }
}

async function installHerokuCLI() {
  log('🚀 Installation de Heroku CLI...', 'yellow');
  const osType = detectOS();
  
  switch (osType) {
    case 'macos':
      if (!checkCommand('brew --version', 'Homebrew')) {
        await installHomebrew();
      }
      execCommand('brew tap heroku/brew && brew install heroku');
      break;
    case 'linux':
      execCommand('curl https://cli-assets.heroku.com/install.sh | sh');
      break;
    case 'windows':
      log('Sur Windows, téléchargez Heroku CLI depuis: https://devcenter.heroku.com/articles/heroku-cli', 'cyan');
      break;
    default:
      log('OS non supporté pour l\'installation automatique', 'red');
  }
}

async function verifyInstallations() {
  log('🔍 Vérification des installations...', 'yellow');
  
  const tools = [
    { cmd: 'git --version', name: 'Git' },
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'npm --version', name: 'NPM' },
    { cmd: 'gh --version', name: 'GitHub CLI' },
    { cmd: 'vercel --version', name: 'Vercel CLI' },
    { cmd: 'heroku --version', name: 'Heroku CLI' }
  ];

  let allInstalled = true;
  for (const tool of tools) {
    if (checkCommand(tool.cmd, tool.name)) {
      log(`✅ ${tool.name} installé`, 'green');
    } else {
      log(`❌ ${tool.name} non installé`, 'red');
      allInstalled = false;
    }
  }

  return allInstalled;
}

async function setupAuthentication() {
  log('🔐 Configuration de l\'authentification...', 'yellow');
  
  // GitHub CLI
  if (checkCommand('gh auth status', 'GitHub Auth')) {
    log('✅ GitHub CLI déjà authentifié', 'green');
  } else {
    log('🔑 Authentification GitHub CLI requise...', 'cyan');
    execCommand('gh auth login');
  }

  // Vercel CLI
  log('🔑 Pour Vercel CLI, exécutez: vercel login', 'cyan');
  
  // Heroku CLI
  log('🔑 Pour Heroku CLI, exécutez: heroku login', 'cyan');
}

async function main() {
  try {
    log('🚀 INSTALLATION DES PRÉREQUIS DE DÉPLOIEMENT', 'bright');
    log('==============================================', 'bright');

    // Vérifier les installations existantes
    const initialCheck = await verifyInstallations();
    if (initialCheck) {
      log('🎉 Tous les outils sont déjà installés!', 'green');
      await setupAuthentication();
      return;
    }

    log(`📱 OS détecté: ${detectOS()}`, 'cyan');
    log(`📦 Gestionnaire de paquets: ${detectPackageManager()}`, 'cyan');

    // Installer les outils manquants
    if (!checkCommand('gh --version', 'GitHub CLI')) {
      await installGitHubCLI();
    }

    if (!checkCommand('vercel --version', 'Vercel CLI')) {
      await installVercelCLI();
    }

    if (!checkCommand('heroku --version', 'Heroku CLI')) {
      await installHerokuCLI();
    }

    // Vérification finale
    log('🔍 Vérification finale...', 'yellow');
    const finalCheck = await verifyInstallations();
    
    if (finalCheck) {
      log('🎉 Installation terminée avec succès!', 'green');
      await setupAuthentication();
      
      log('📋 Prochaines étapes:', 'cyan');
      log('1. Configurez les secrets: npm run deploy:setup', 'cyan');
      log('2. Lancez le déploiement: npm run deploy', 'cyan');
    } else {
      log('❌ Certains outils n\'ont pas pu être installés', 'red');
      log('Veuillez les installer manuellement:', 'yellow');
      log('- GitHub CLI: https://cli.github.com/', 'cyan');
      log('- Vercel CLI: npm install -g vercel@latest', 'cyan');
      log('- Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli', 'cyan');
    }

  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
