// Script de test pour le système de logo Base64
const fs = require('fs');
const path = require('path');

// Fonction pour convertir une image en Base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageExtension = path.extname(imagePath).toLowerCase();
    
    let mimeType;
    switch (imageExtension) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/jpeg';
    }
    
    const base64String = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    
    console.log('📊 Informations de l\'image:');
    console.log(`   Chemin: ${imagePath}`);
    console.log(`   Taille: ${imageBuffer.length} bytes (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`   Type MIME: ${mimeType}`);
    console.log(`   Longueur Base64: ${base64String.length} caractères`);
    console.log(`   Préfixe: ${base64String.substring(0, 50)}...`);
    
    return base64String;
  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error.message);
    return null;
  }
}

// Test avec une image d'exemple
console.log('🧪 Test du système de logo Base64\n');

// Créer une image de test simple (pixel rouge 1x1)
const testImagePath = path.join(__dirname, 'test-logo.png');
const redPixelPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

fs.writeFileSync(testImagePath, redPixelPNG);
console.log('✅ Image de test créée');

// Convertir en Base64
const base64Result = imageToBase64(testImagePath);

if (base64Result) {
  console.log('\n✅ Conversion réussie !');
  console.log('\n📋 Exemple d\'utilisation dans le frontend:');
  console.log('```javascript');
  console.log('// Dans handleImageUpload:');
  console.log('const base64String = await convertFileToBase64(file);');
  console.log('handleFieldChange(key, base64String);');
  console.log('```');
  
  console.log('\n📋 Exemple d\'affichage:');
  console.log('```jsx');
  console.log('<img src={base64String} alt="Logo" />');
  console.log('```');
  
  // Nettoyer le fichier de test
  fs.unlinkSync(testImagePath);
  console.log('\n🧹 Fichier de test supprimé');
} else {
  console.log('\n❌ Échec de la conversion');
}

console.log('\n🎯 Prochaines étapes:');
console.log('1. Testez l\'upload d\'une image dans l\'admin');
console.log('2. Vérifiez que l\'image s\'affiche correctement');
console.log('3. Confirmez que l\'image persiste après actualisation');
console.log('4. Vérifiez que l\'image apparaît sur le site public');
