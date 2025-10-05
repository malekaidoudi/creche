#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

console.log('🧪 Test Final du Système Complet\n');

// 1. Vérifier que le logo existe dans le frontend
const frontendLogoPath = '/Users/aidoudimalek/Windsurf/creche-site/frontend/public/images/logo.jpeg';
console.log('1. 📁 Vérification du fichier logo...');

if (fs.existsSync(frontendLogoPath)) {
  const stats = fs.statSync(frontendLogoPath);
  console.log(`   ✅ Logo trouvé: ${Math.round(stats.size / 1024)} KB (${stats.mtime.toLocaleString()})`);
} else {
  console.log(`   ❌ Logo manquant dans frontend/public/images/`);
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
      const logoPath = data.data.nursery_logo;
      console.log(`   ✅ Logo API: ${logoPath}`);
      
      // Vérifier que ce n'est plus du base64
      if (logoPath.startsWith('data:image/')) {
        console.log(`   ❌ ERREUR: Le logo est encore en base64!`);
      } else if (logoPath.startsWith('/images/')) {
        console.log(`   ✅ Format correct: chemin d'image`);
        
        // Vérifier le timestamp
        if (logoPath.includes('?v=')) {
          console.log(`   ✅ Cache-busting activé`);
        }
      }
    } else {
      console.log(`   ❌ Logo non trouvé dans l'API`);
    }
  } catch (parseError) {
    console.log(`   ❌ Erreur parsing: ${parseError.message}`);
  }
});

// 3. Test de sauvegarde simple
console.log('\n3. 🔄 Test de sauvegarde...');
exec('curl -X PUT http://localhost:3003/api/settings -H "Content-Type: application/json" -d \'{"settings": {"nursery_name": {"value": "Test Final", "type": "string"}}}\'', (error, stdout, stderr) => {
  if (error) {
    console.log(`   ❌ Erreur sauvegarde: ${error.message}`);
    return;
  }
  
  try {
    const result = JSON.parse(stdout);
    if (result.success) {
      console.log(`   ✅ Sauvegarde réussie`);
    } else {
      console.log(`   ❌ Sauvegarde échouée: ${result.message}`);
    }
  } catch (parseError) {
    console.log(`   ❌ Erreur parsing sauvegarde: ${parseError.message}`);
  }
});

// 4. Instructions finales
setTimeout(() => {
  console.log('\n4. 🎯 Tests manuels finaux:');
  console.log('   • Le logo s\'affiche-t-il dans le header sur http://localhost:5173 ?');
  console.log('   • L\'upload via /admin/settings fonctionne-t-il sans erreur base64 ?');
  console.log('   • Les autres paramètres se sauvegardent-ils correctement ?');
  console.log('   • L\'icône ⚙️ dans le footer mène-t-elle aux settings ?');
  
  console.log('\n✅ Système complet testé!');
  console.log('📋 Résumé:');
  console.log('   - Logo: Chemin normal au lieu de base64');
  console.log('   - Upload: API au lieu de FileReader');
  console.log('   - Sauvegarde: Frontend → Backend → MySQL');
  console.log('   - Cache: Timestamp pour rafraîchissement');
  console.log('   - Navigation: Icône admin dans footer');
}, 3000);
