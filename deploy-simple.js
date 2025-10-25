#!/usr/bin/env node

/**
 * Script de déploiement simple - Railway + Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');

function log(message, color = '\x1b[36m') {
  console.log(`${color}${message}\x1b[0m`);
}

function exec(command, cwd = '.') {
  log(`Exécution: ${command}`);
  return execSync(command, { cwd, stdio: 'inherit', encoding: 'utf8' });
}

async function main() {
  try {
    log('🚀 DÉPLOIEMENT SIMPLE - RAILWAY + VERCEL', '\x1b[33m');
    
    // 1. Backend sur Railway
    log('📦 Déploiement backend sur Railway...');
    process.chdir('./backend');
    
    // Vérifier la connexion Railway
    try {
      exec('railway whoami');
      log('✅ Connecté à Railway');
    } catch (error) {
      log('🔑 Connexion à Railway requise...');
      exec('railway login');
    }
    
    // Déployer
    exec('railway up --detach');
    log('⏳ Backend en cours de déploiement...');
    process.chdir('..');
    
    // 2. Frontend sur Vercel
    log('🎨 Déploiement frontend sur Vercel...');
    process.chdir('./frontend');
    
    // Vérifier la connexion Vercel
    try {
      exec('vercel whoami');
      log('✅ Connecté à Vercel');
    } catch (error) {
      log('🔑 Connexion à Vercel requise...');
      exec('vercel login');
    }
    
    // Déployer
    exec('vercel --prod --yes');
    process.chdir('..');
    
    log('✅ Déploiement terminé !', '\x1b[32m');
    log('🌐 Vérifiez vos applications:', '\x1b[36m');
    log('   - Backend: https://creche-backend.railway.app');
    log('   - Frontend: https://creche-frontend.vercel.app');
    log('⚠️  Les services peuvent prendre 2-3 minutes à démarrer');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, '\x1b[31m');
    log('💡 Vérifiez que Railway CLI et Vercel CLI sont installés');
  }
}

main();
