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
    
    // Créer railway.json simple
    fs.writeFileSync('railway.json', JSON.stringify({
      "$schema": "https://railway.app/railway.schema.json",
      "build": { "builder": "NIXPACKS" },
      "deploy": { "numReplicas": 1 }
    }, null, 2));
    
    exec('railway up --detach');
    process.chdir('..');
    
    // 2. Frontend sur Vercel
    log('🎨 Déploiement frontend sur Vercel...');
    process.chdir('./frontend');
    exec('vercel --prod --yes');
    process.chdir('..');
    
    log('✅ Déploiement terminé !', '\x1b[32m');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, '\x1b[31m');
  }
}

main();
