#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Test complet du système de logo\n');

// 1. Vérifier que le fichier logo existe
const logoPath = '/Users/aidoudimalek/Windsurf/creche-site/backend/public/images/logo.jpg';
console.log('1. 📁 Vérification du fichier logo...');
if (fs.existsSync(logoPath)) {
  const stats = fs.statSync(logoPath);
  console.log(`   ✅ Fichier trouvé: ${logoPath}`);
  console.log(`   📊 Taille: ${Math.round(stats.size / 1024)} KB`);
  console.log(`   🕒 Modifié: ${stats.mtime.toLocaleString()}`);
} else {
  console.log(`   ❌ Fichier non trouvé: ${logoPath}`);
}

// 2. Test de l'API publique
console.log('\n2. 🌐 Test de l\'API publique...');
const { exec } = require('child_process');

exec('curl -s http://localhost:3003/api/settings/public', (error, stdout, stderr) => {
  if (error) {
    console.log(`   ❌ Erreur API: ${error.message}`);
    return;
  }
  
  try {
    const data = JSON.parse(stdout);
    if (data.success && data.data.nursery_logo) {
      console.log(`   ✅ Logo dans l'API: ${data.data.nursery_logo}`);
      
      // Vérifier si le logo a un timestamp
      if (data.data.nursery_logo.includes('?v=')) {
        console.log(`   ✅ Timestamp présent pour éviter le cache`);
      } else {
        console.log(`   ⚠️ Pas de timestamp - risque de cache`);
      }
    } else {
      console.log(`   ❌ Logo non trouvé dans l'API`);
    }
  } catch (parseError) {
    console.log(`   ❌ Erreur parsing JSON: ${parseError.message}`);
  }
});

// 3. Test d'accessibilité du logo
console.log('\n3. 🔗 Test d\'accessibilité du logo...');
exec('curl -I http://localhost:3003/images/logo.jpg', (error, stdout, stderr) => {
  if (error) {
    console.log(`   ❌ Logo non accessible: ${error.message}`);
    return;
  }
  
  if (stdout.includes('200 OK')) {
    console.log(`   ✅ Logo accessible via HTTP`);
    
    // Extraire le Content-Type
    const contentTypeMatch = stdout.match(/Content-Type: (.+)/);
    if (contentTypeMatch) {
      console.log(`   📷 Type: ${contentTypeMatch[1].trim()}`);
    }
    
    // Extraire la taille
    const contentLengthMatch = stdout.match(/Content-Length: (\d+)/);
    if (contentLengthMatch) {
      const sizeKB = Math.round(parseInt(contentLengthMatch[1]) / 1024);
      console.log(`   📊 Taille HTTP: ${sizeKB} KB`);
    }
  } else {
    console.log(`   ❌ Logo non accessible (pas de 200 OK)`);
  }
});

// 4. Instructions pour les tests manuels
setTimeout(() => {
  console.log('\n4. 🎯 Tests manuels à effectuer:');
  console.log('   • Allez sur http://localhost:5173');
  console.log('   • Vérifiez que le logo apparaît dans le header');
  console.log('   • Allez sur /admin/settings');
  console.log('   • Changez le logo et vérifiez la mise à jour');
  console.log('   • Utilisez l\'icône ⚙️ dans le footer pour accéder aux settings');
  
  console.log('\n✅ Tests automatiques terminés!');
}, 2000);
