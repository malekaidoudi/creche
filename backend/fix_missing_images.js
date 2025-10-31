#!/usr/bin/env node

// Script pour créer des images de test pour les profils manquants
const fs = require('fs');
const path = require('path');

async function createPlaceholderImages() {
  try {
    console.log('🖼️ CRÉATION D\'IMAGES DE TEST POUR PROFILS');
    console.log('==========================================');

    const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
    
    // S'assurer que le dossier existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Dossier uploads/profiles créé');
    }

    // Liste des images manquantes communes
    const missingImages = [
      'image-1761853923515-699314298.jpg',
      'image-1761852256505-958159278.jpg',
      'profile_image-1761067083540-237610435.jpeg',
      'profile_image-1761417955968-23032012.jpeg'
    ];

    // Créer une image SVG simple comme placeholder
    const createSvgPlaceholder = (filename) => {
      const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#e5e7eb"/>
  <circle cx="100" cy="80" r="30" fill="#9ca3af"/>
  <path d="M70 130 Q100 110 130 130 L130 160 Q100 180 70 160 Z" fill="#9ca3af"/>
  <text x="100" y="190" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">Photo Profil</text>
</svg>`;
      
      // Convertir en nom de fichier approprié
      const isJpeg = filename.endsWith('.jpeg') || filename.endsWith('.jpg');
      const targetFile = path.join(uploadsDir, filename);
      
      if (isJpeg) {
        // Pour les JPEG, on crée un fichier SVG avec extension jpeg (temporaire)
        fs.writeFileSync(targetFile, svgContent);
      } else {
        fs.writeFileSync(targetFile, svgContent);
      }
      
      return targetFile;
    };

    // Créer les images manquantes
    for (const imageName of missingImages) {
      const imagePath = path.join(uploadsDir, imageName);
      
      if (!fs.existsSync(imagePath)) {
        createSvgPlaceholder(imageName);
        console.log(`✅ Image créée: ${imageName}`);
      } else {
        console.log(`⚪ Image existe déjà: ${imageName}`);
      }
    }

    // Lister toutes les images dans le dossier
    const allImages = fs.readdirSync(uploadsDir);
    console.log('');
    console.log('📋 IMAGES DANS LE DOSSIER UPLOADS:');
    allImages.forEach(img => {
      const stats = fs.statSync(path.join(uploadsDir, img));
      console.log(`   ${img} (${stats.size} bytes)`);
    });

    console.log('');
    console.log('🎉 CORRECTION TERMINÉE !');
    console.log('💡 Les images manquantes ont été remplacées par des placeholders SVG');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des images:', error);
  }
}

createPlaceholderImages();
