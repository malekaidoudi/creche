const fs = require('fs');
const path = require('path');

function checkPreDeploy() {
  console.log('🔍 Vérification pré-déploiement...\n');
  
  let errors = [];
  let warnings = [];
  
  // 1. Vérifier les fichiers essentiels
  const essentialFiles = [
    'package.json',
    'railway.json',
    'nixpacks.toml',
    'backend/package.json',
    'backend/server.js',
    'backend/.env.example',
    'backend/routes/health.js'
  ];
  
  console.log('📁 Vérification des fichiers essentiels:');
  essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MANQUANT`);
      errors.push(`Fichier manquant: ${file}`);
    }
  });
  
  // 2. Vérifier la configuration package.json
  console.log('\n📦 Vérification package.json racine:');
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.scripts && pkg.scripts.start) {
      console.log(`   ✅ Script start: ${pkg.scripts.start}`);
    } else {
      console.log('   ❌ Script start manquant');
      errors.push('Script start manquant dans package.json racine');
    }
    
    if (pkg.scripts && pkg.scripts.postinstall) {
      console.log(`   ✅ Script postinstall: ${pkg.scripts.postinstall}`);
    } else {
      console.log('   ⚠️  Script postinstall recommandé');
      warnings.push('Script postinstall recommandé pour installer les dépendances backend');
    }
  } catch (error) {
    console.log('   ❌ Erreur lecture package.json');
    errors.push('Impossible de lire package.json');
  }
  
  // 3. Vérifier la configuration backend
  console.log('\n🔧 Vérification backend:');
  try {
    const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    
    // Vérifier les dépendances critiques
    const criticalDeps = ['express', 'mysql2', 'bcryptjs', 'jsonwebtoken', 'cors', 'helmet'];
    criticalDeps.forEach(dep => {
      if (backendPkg.dependencies && backendPkg.dependencies[dep]) {
        console.log(`   ✅ ${dep}: ${backendPkg.dependencies[dep]}`);
      } else {
        console.log(`   ❌ ${dep} - MANQUANT`);
        errors.push(`Dépendance critique manquante: ${dep}`);
      }
    });
    
    // Vérifier les scripts
    if (backendPkg.scripts && backendPkg.scripts.start) {
      console.log(`   ✅ Script start backend: ${backendPkg.scripts.start}`);
    } else {
      console.log('   ❌ Script start backend manquant');
      errors.push('Script start manquant dans backend/package.json');
    }
    
  } catch (error) {
    console.log('   ❌ Erreur lecture backend/package.json');
    errors.push('Impossible de lire backend/package.json');
  }
  
  // 4. Vérifier la configuration Railway
  console.log('\n🚂 Vérification configuration Railway:');
  try {
    const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    
    if (railwayConfig.deploy && railwayConfig.deploy.startCommand) {
      console.log(`   ✅ Start command: ${railwayConfig.deploy.startCommand}`);
    } else {
      console.log('   ❌ Start command manquant');
      errors.push('Start command manquant dans railway.json');
    }
    
    if (railwayConfig.deploy && railwayConfig.deploy.healthcheckPath) {
      console.log(`   ✅ Health check: ${railwayConfig.deploy.healthcheckPath}`);
    } else {
      console.log('   ⚠️  Health check recommandé');
      warnings.push('Health check path recommandé dans railway.json');
    }
    
  } catch (error) {
    console.log('   ❌ Erreur lecture railway.json');
    errors.push('Impossible de lire railway.json');
  }
  
  // 5. Vérifier Nixpacks
  console.log('\n⚙️  Vérification Nixpacks:');
  if (fs.existsSync('nixpacks.toml')) {
    console.log('   ✅ nixpacks.toml présent');
  } else {
    console.log('   ⚠️  nixpacks.toml recommandé');
    warnings.push('nixpacks.toml recommandé pour une configuration précise');
  }
  
  // Résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   Erreurs: ${errors.length}`);
  console.log(`   Avertissements: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERREURS À CORRIGER:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  AVERTISSEMENTS:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  if (errors.length === 0) {
    console.log('\n🎉 PRÊT POUR LE DÉPLOIEMENT !');
    console.log('\n📋 ÉTAPES SUIVANTES:');
    console.log('1. Créer un projet Railway');
    console.log('2. Ajouter un service MySQL');
    console.log('3. Connecter le repository GitHub');
    console.log('4. Configurer les variables d\'environnement');
    console.log('5. Déployer !');
    return true;
  } else {
    console.log('\n🚫 DÉPLOIEMENT NON RECOMMANDÉ');
    console.log('Corrigez les erreurs avant de déployer.');
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const success = checkPreDeploy();
  process.exit(success ? 0 : 1);
}

module.exports = checkPreDeploy;
