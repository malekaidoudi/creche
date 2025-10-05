// Remplace l'API backend par des données statiques

// Base de données statique des paramètres de la crèche
const STATIC_SETTINGS = {
  // Informations générales
  nursery_name: 'Mima Elghalia',
  nursery_name_ar: 'ميما الغالية',
  nursery_logo: '/images/logo.png',
  director_name: 'Mme Fatima Ben Ali',
  nursery_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',
  nursery_address_ar: '123 شارع السلام، 1000 تونس، تونس',
  nursery_phone: '+216 71 123 456',
  nursery_email: 'contact@mimaelghalia.tn',
  nursery_website: 'https://mimaelghalia.tn',

  // Capacité et statistiques
  total_capacity: 30,
  available_spots: 5,
  min_age_months: 3,
  max_age_months: 48,
  staff_count: 8,
  opening_year: 2019,
  map_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',

  // Messages de bienvenue
  welcome_message_fr: 'Bienvenue à la crèche Mima Elghalia, un lieu d\'épanouissement pour vos enfants dans un environnement sécurisé et bienveillant.',
  welcome_message_ar: 'مرحباً بكم في حضانة ميما الغالية، مكان لنمُو أطفالكم في بيئة آمنة ومحبة.',
  
  // Descriptions
  about_description_fr: 'Notre crèche offre un environnement éducatif stimulant avec une équipe qualifiée dédiée au bien-être de chaque enfant.',
  about_description_ar: 'توفر حضانتنا بيئة تعليمية محفزة مع فريق مؤهل مكرس لرفاهية كل طفل.',

  // Horaires d'ouverture - MISE À JOUR COMPLÈTE
  opening_hours: {
    monday: { open: '07:00', close: '18:00', closed: false },
    tuesday: { open: '07:00', close: '18:00', closed: false },
    wednesday: { open: '07:00', close: '18:00', closed: false },
    thursday: { open: '07:00', close: '18:00', closed: false },
    friday: { open: '07:00', close: '18:00', closed: false },
    saturday: { open: '08:00', close: '12:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  },
  
  // Thème et couleurs
  site_theme: 'light',
  primary_color: '#3B82F6',
  secondary_color: '#8B5CF6',
  accent_color: '#F59E0B',
  
  // Réseaux sociaux
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  
  // Système
  license_number: 'CR-2025-001',
  closure_periods: []
};

class StaticSettingsService {
  constructor() {
    // Charger les paramètres depuis localStorage ou utiliser les valeurs par défaut
    this.settings = this.loadFromStorage();
  }

  // Charger depuis localStorage
  loadFromStorage() {
    try {
      console.log('📦 Chargement depuis localStorage...');
      const stored = localStorage.getItem('creche_settings');
      
      if (stored) {
        console.log('📄 Données trouvées dans localStorage:', stored.substring(0, 100) + '...');
        const parsedSettings = JSON.parse(stored);
        const mergedSettings = { ...STATIC_SETTINGS, ...parsedSettings };
        console.log('✅ Paramètres fusionnés:', Object.keys(mergedSettings));
        return mergedSettings;
      } else {
        console.log('📝 Aucune donnée dans localStorage, utilisation des valeurs par défaut');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis localStorage:', error);
    }
    
    console.log('🔧 Retour des paramètres par défaut');
    return { ...STATIC_SETTINGS };
  }

  // Sauvegarder dans localStorage
  saveToStorage(settings) {
    try {
      localStorage.setItem('creche_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  // Simuler un délai réseau
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtenir tous les paramètres
  async getSettings() {
    try {
      console.log('🔍 Service getSettings appelé');
      await this.delay();
      const result = { ...this.settings };
      console.log('📤 Service retourne:', Object.keys(result).length, 'paramètres');
      return result;
    } catch (error) {
      console.error('❌ Erreur dans getSettings:', error);
      throw error;
    }
  }

  // Mettre à jour les paramètres
  async updateSettings(newSettings) {
    await this.delay();
    
    try {
      // Mettre à jour les paramètres en mémoire
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      
      // Sauvegarder dans localStorage
      this.saveToStorage(this.settings);
      
      console.log('✅ Paramètres sauvegardés:', newSettings);
      
      return {
        success: true,
        message: 'Paramètres sauvegardés avec succès',
        data: this.settings
      };
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      return {
        success: false,
        message: 'Erreur lors de la sauvegarde',
        error: error.message
      };
    }
  }

  // Obtenir un paramètre spécifique
  async getSetting(key) {
    await this.delay(100);
    return this.settings[key];
  }

  // Réinitialiser aux valeurs par défaut
  async resetSettings() {
    await this.delay();
    this.settings = { ...STATIC_SETTINGS };
    this.saveToStorage(this.settings);
    return {
      success: true,
      message: 'Paramètres réinitialisés',
      data: this.settings
    };
  }
}

// Créer une instance du service
export const settingsService = new StaticSettingsService();

export default settingsService;
