#!/usr/bin/env node

/**
 * Script pour configurer automatiquement les secrets GitHub
 * Utilise GitHub CLI pour injecter les secrets nécessaires
 */

const { execSync } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    return null;
  }
}

function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

async function checkGitHubCLI() {
  console.log('🔍 Vérification de GitHub CLI...');
  const version = execCommand('gh --version');
  if (!version) {
    console.error('❌ GitHub CLI non installé. Installez-le avec: brew install gh');
    process.exit(1);
  }
  console.log('✅ GitHub CLI installé');

  // Vérifier l'authentification
  const user = execCommand('gh auth status');
  if (!user) {
    console.log('🔐 Authentification GitHub requise...');
    execCommand('gh auth login');
  }
}

async function setupSecrets() {
  console.log('🔧 Configuration des secrets GitHub...');

  // Générer JWT secret automatiquement
  const jwtSecret = generateJWTSecret();
  console.log('✅ JWT Secret généré automatiquement');

  // Demander les autres secrets
  const herokuApiKey = await question('🔑 Entrez votre Heroku API Key: ');
  const vercelToken = await question('🔑 Entrez votre Vercel Token: ');
  const vercelOrgId = await question('🔑 Entrez votre Vercel Org ID: ');
  const vercelProjectId = await question('🔑 Entrez votre Vercel Project ID: ');

  const secrets = {
    'HEROKU_API_KEY': herokuApiKey,
    'VERCEL_TOKEN': vercelToken,
    'VERCEL_ORG_ID': vercelOrgId,
    'VERCEL_PROJECT_ID': vercelProjectId,
    'JWT_SECRET': jwtSecret
  };

  // Configurer chaque secret
  for (const [name, value] of Object.entries(secrets)) {
    if (value) {
      const result = execCommand(`gh secret set ${name} --body "${value}"`);
      if (result !== null) {
        console.log(`✅ Secret ${name} configuré`);
      } else {
        console.log(`❌ Erreur lors de la configuration de ${name}`);
      }
    }
  }

  console.log('🎉 Configuration des secrets terminée!');
}

async function getVercelInfo() {
  console.log('\n📋 Pour obtenir vos informations Vercel:');
  console.log('1. Vercel Token: https://vercel.com/account/tokens');
  console.log('2. Org ID et Project ID:');
  console.log('   cd frontend && vercel link');
  console.log('   cat .vercel/project.json');
  console.log('\n🔑 Pour obtenir votre Heroku API Key:');
  console.log('   heroku auth:login');
  console.log('   heroku auth:token');
}

async function main() {
  console.log('🚀 CONFIGURATION DES SECRETS GITHUB');
  console.log('===================================');

  try {
    await checkGitHubCLI();
    await getVercelInfo();
    
    const proceed = await question('\n▶️  Continuer avec la configuration? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Configuration annulée.');
      process.exit(0);
    }

    await setupSecrets();

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}
