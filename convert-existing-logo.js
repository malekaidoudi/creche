// Script pour convertir le logo existant en Base64
const fetch = require('node-fetch');
const fs = require('fs');

async function convertExistingLogo() {
  console.log('🔄 Conversion du logo existant en Base64...');
  
  try {
    // URL du logo actuel
    const logoUrl = 'https://backend-production-3a21.up.railway.app/images/logo.jpg';
    
    console.log('📥 Téléchargement du logo depuis:', logoUrl);
    
    // Télécharger l'image
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Convertir en buffer
    const buffer = await response.buffer();
    console.log('✅ Image téléchargée:', buffer.length, 'bytes');
    
    // Convertir en Base64
    const base64String = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    console.log('✅ Conversion Base64 réussie:', base64String.length, 'caractères');
    
    // Sauvegarder dans la base de données via l'API
    const updateResponse = await fetch('https://backend-production-3a21.up.railway.app/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nursery_logo: {
          value: base64String,
          type: 'image'
        }
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Erreur API: ${updateResponse.status}`);
    }
    
    const result = await updateResponse.json();
    console.log('✅ Logo mis à jour en Base64:', result);
    
    console.log('\n🎉 Conversion terminée !');
    console.log('Le logo est maintenant stocké en Base64 dans la base de données.');
    console.log('Actualisez la page pour voir le changement.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  convertExistingLogo();
}

module.exports = { convertExistingLogo };
