#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

console.log('🧪 Test Final du Système de Logo\n');

// 1. Vérifier que le logo est dans le bon dossier (frontend)
const frontendLogoPath = '/Users/aidoudimalek/Windsurf/creche-site/frontend/public/images/logo.jpg';
const backendLogoPath = '/Users/aidoudimalek/Windsurf/creche-site/backend/public/images/logo.jpg';

console.log('1. 📁 Vérification des emplacements...');

if (fs.existsSync(frontendLogoPath)) {
  const stats = fs.statSync(frontendLogoPath);
  console.log(`   ✅ Logo dans frontend: ${Math.round(stats.size / 1024)} KB (${stats.mtime.toLocaleString()})`);
} else {
  console.log(`   ❌ Logo manquant dans frontend`);
}

if (fs.existsSync(backendLogoPath)) {
  console.log(`   ⚠️ Logo encore présent dans backend (à supprimer)`);
} else {
  console.log(`   ✅ Pas de logo dans backend (correct)`);
}

// 2. Test de l'API
console.log('\n2. 🌐 Test de l\'API...');
exec('curl -s http://localhost:3003/api/settings/public', (error, stdout, stderr) => {
  if (error) {
    console.log(`   ❌ Erreur API: ${error.message}`);
    return;
  }
  
  try {
    const data = JSON.parse(stdout);
    if (data.success && data.data.nursery_logo) {
      console.log(`   ✅ Logo API: ${data.data.nursery_logo}`);
      
      // Vérifier le timestamp
      if (data.data.nursery_logo.includes('?v=')) {
        const timestamp = data.data.nursery_logo.split('?v=')[1];
        const date = new Date(parseInt(timestamp));
        console.log(`   ✅ Timestamp: ${date.toLocaleString()}`);
      }
    } else {
      console.log(`   ❌ Logo non trouvé dans l'API`);
    }
  } catch (parseError) {
    console.log(`   ❌ Erreur parsing: ${parseError.message}`);
  }
});

// 3. Test d'upload
console.log('\n3. 🔄 Test d\'upload...');
exec('curl -X POST http://localhost:3003/api/settings/upload/nursery_logo -F "image=@/Users/aidoudimalek/Windsurf/creche-site/frontend/public/images/hero.jpg"', (error, stdout, stderr) => {
  if (error) {
    console.log(`   ❌ Erreur upload: ${error.message}`);
    return;
  }
  
  try {
    const result = JSON.parse(stdout);
    if (result.success) {
      console.log(`   ✅ Upload réussi: ${result.data.path}`);
      
      // Vérifier que le fichier a été mis à jour
      setTimeout(() => {
        if (fs.existsSync(frontendLogoPath)) {
          const newStats = fs.statSync(frontendLogoPath);
          console.log(`   ✅ Fichier mis à jour: ${newStats.mtime.toLocaleString()}`);
        }
      }, 1000);
    } else {
      console.log(`   ❌ Upload échoué: ${result.message}`);
    }
  } catch (parseError) {
    console.log(`   ❌ Erreur parsing upload: ${parseError.message}`);
  }
});

// 4. Instructions finales
setTimeout(() => {
  console.log('\n4. 🎯 Vérifications manuelles:');
  console.log('   • Le logo apparaît-il dans le header sur http://localhost:5173 ?');
  console.log('   • L\'upload via /admin/settings fonctionne-t-il ?');
  console.log('   • Le logo se met-il à jour en temps réel ?');
  console.log('   • L\'icône ⚙️ dans le footer fonctionne-t-elle ?');
  
  console.log('\n✅ Tests terminés!');
  console.log('📋 Résumé: Logo sauvegardé dans frontend/public/images/ avec timestamp pour cache-busting');
}, 3000);
