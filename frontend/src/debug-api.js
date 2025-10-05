// Script de debug pour tester l'API settings
import { settingsService } from './services/settingsService.js';

// Test direct de fetch
window.testDirectFetch = async () => {
  console.log('🧪 Test direct fetch...');
  try {
    const response = await fetch('http://localhost:3003/api/settings/public');
    console.log('📡 Response:', response.status, response.statusText);
    const data = await response.json();
    console.log('✅ Data:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur direct fetch:', error);
    return error;
  }
};

// Test via proxy Vite
window.testProxyFetch = async () => {
  console.log('🧪 Test proxy fetch...');
  try {
    const response = await fetch('/api/settings/public');
    console.log('📡 Response:', response.status, response.statusText);
    const data = await response.json();
    console.log('✅ Data:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur proxy fetch:', error);
    return error;
  }
};

// Exposer les fonctions globalement pour les tests manuels
window.debugAPI = {
  // Tester la récupération des paramètres publics
  async testGetPublic() {
    console.log('🧪 Test getPublicSettings...');
    try {
      const result = await settingsService.getPublicSettings();
      console.log('✅ Résultat:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur:', error);
      return error;
    }
  },

  // Configurer le token admin
  async setupAdmin() {
    console.log('🔑 Configuration du token admin...');
    try {
      const result = await settingsService.loginAdmin();
      console.log('✅ Token configuré:', result);
      console.log('📋 Token dans localStorage:', localStorage.getItem('token'));
      return result;
    } catch (error) {
      console.error('❌ Erreur:', error);
      return error;
    }
  },

  // Tester la mise à jour des paramètres
  async testUpdate() {
    console.log('🧪 Test updateMultiple...');
    try {
      const testSettings = {
        nursery_name: { value: 'Test Simple', type: 'string' }
      };
      
      console.log('📤 Envoi:', testSettings);
      const result = await settingsService.updateMultiple(testSettings);
      console.log('✅ Résultat mise à jour:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      return error;
    }
  },

  // Test complet
  async testAll() {
    console.log('🚀 Test complet de l\'API...');
    
    console.log('\n1. Test récupération publique:');
    await this.testGetPublic();
    
    console.log('\n2. Test configuration admin:');
    await this.setupAdmin();
    
    console.log('\n3. Test mise à jour:');
    await this.testUpdate();
    
    console.log('\n4. Vérification finale:');
    await this.testGetPublic();
    
    console.log('✅ Tests terminés!');
  }
};

console.log('🧪 API Debug chargé! Utilisez:');
console.log('- window.testDirectFetch() // Test fetch direct');
console.log('- window.testProxyFetch() // Test via proxy Vite');
console.log('- window.debugAPI.testGetPublic()');
console.log('- window.debugAPI.setupAdmin()');
console.log('- window.debugAPI.testUpdate()');
console.log('- window.debugAPI.testAll()');
