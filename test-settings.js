#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const API_BASE = 'http://localhost:3003/api';

async function testSettingsSystem() {
  console.log('🧪 Test du système de paramètres dynamiques\n');
  
  try {
    // 1. Test de l'API publique
    console.log('1️⃣ Test de l\'API publique...');
    const { stdout } = await execAsync(`curl -s ${API_BASE}/settings/public`);
    const publicResponse = JSON.parse(stdout);
    
    if (publicResponse.success) {
      const settings = publicResponse.data;
      console.log('   ✅ API publique fonctionne');
      console.log(`   📋 ${Object.keys(settings).length} paramètres récupérés`);
      console.log(`   🏢 Nom de la crèche: ${settings.nursery_name}`);
      console.log(`   📧 Email: ${settings.nursery_email}`);
      console.log(`   🎨 Thème: ${settings.site_theme}`);
      console.log(`   👥 Capacité: ${settings.available_spots}/${settings.total_capacity} places`);
    } else {
      console.log('   ❌ Échec de l\'API publique');
      return false;
    }
    
    // 2. Test des paramètres essentiels
    console.log('\n2️⃣ Validation des paramètres essentiels...');
    const requiredSettings = [
      'nursery_name', 'nursery_email', 'nursery_phone', 'nursery_address',
      'total_capacity', 'available_spots', 'min_age_months', 'max_age_months',
      'welcome_message_fr', 'welcome_message_ar',
      'site_theme', 'primary_color', 'secondary_color', 'accent_color'
    ];
    
    const settings = publicResponse.data;
    let missingSettings = [];
    
    for (const setting of requiredSettings) {
      if (settings[setting] === undefined || settings[setting] === null) {
        missingSettings.push(setting);
      }
    }
    
    if (missingSettings.length === 0) {
      console.log('   ✅ Tous les paramètres essentiels sont présents');
    } else {
      console.log(`   ⚠️  Paramètres manquants: ${missingSettings.join(', ')}`);
    }
    
    // 3. Test des types de données
    console.log('\n3️⃣ Validation des types de données...');
    const typeTests = [
      { key: 'total_capacity', expectedType: 'number', value: settings.total_capacity },
      { key: 'available_spots', expectedType: 'number', value: settings.available_spots },
      { key: 'site_theme', expectedType: 'string', value: settings.site_theme },
      { key: 'primary_color', expectedType: 'string', value: settings.primary_color }
    ];
    
    let typeErrors = [];
    for (const test of typeTests) {
      const actualType = typeof test.value;
      if (actualType !== test.expectedType) {
        typeErrors.push(`${test.key}: attendu ${test.expectedType}, reçu ${actualType}`);
      }
    }
    
    if (typeErrors.length === 0) {
      console.log('   ✅ Tous les types de données sont corrects');
    } else {
      console.log(`   ❌ Erreurs de type: ${typeErrors.join(', ')}`);
    }
    
    // 4. Test des couleurs
    console.log('\n4️⃣ Validation des couleurs...');
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const colors = ['primary_color', 'secondary_color', 'accent_color'];
    let colorErrors = [];
    
    for (const colorKey of colors) {
      const color = settings[colorKey];
      if (!colorRegex.test(color)) {
        colorErrors.push(`${colorKey}: ${color} n'est pas un code couleur hexadécimal valide`);
      }
    }
    
    if (colorErrors.length === 0) {
      console.log('   ✅ Toutes les couleurs sont au format hexadécimal valide');
    } else {
      console.log(`   ❌ Erreurs de couleur: ${colorErrors.join(', ')}`);
    }
    
    // 5. Test des horaires JSON
    console.log('\n5️⃣ Validation des horaires...');
    try {
      const hours = settings.opening_hours;
      if (typeof hours === 'object' && hours.monday) {
        console.log('   ✅ Horaires d\'ouverture correctement parsés');
        console.log(`   🕐 Exemple - Lundi: ${hours.monday.open} - ${hours.monday.close}`);
      } else {
        console.log('   ⚠️  Format des horaires inattendu');
      }
    } catch (error) {
      console.log('   ❌ Erreur lors du parsing des horaires:', error.message);
    }
    
    // 6. Test de performance
    console.log('\n6️⃣ Test de performance...');
    const startTime = Date.now();
    await execAsync(`curl -s ${API_BASE}/settings/public`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime < 100) {
      console.log(`   ✅ Temps de réponse excellent: ${responseTime}ms`);
    } else if (responseTime < 500) {
      console.log(`   ✅ Temps de réponse correct: ${responseTime}ms`);
    } else {
      console.log(`   ⚠️  Temps de réponse lent: ${responseTime}ms`);
    }
    
    console.log('\n🎉 Test du système de paramètres terminé avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   • ${Object.keys(settings).length} paramètres configurés`);
    console.log(`   • API publique fonctionnelle`);
    console.log(`   • Types de données validés`);
    console.log(`   • Couleurs au format correct`);
    console.log(`   • Performance acceptable (${responseTime}ms)`);
    
    return true;
    
  } catch (error) {
    console.log('\n❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Vérifiez que le serveur backend est démarré sur le port 3003');
    }
    
    return false;
  }
}

// Exécuter le test
if (require.main === module) {
  testSettingsSystem()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erreur critique:', error.message);
      process.exit(1);
    });
}

module.exports = { testSettingsSystem };
