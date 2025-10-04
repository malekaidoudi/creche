// Service de paramètres statiques pour GitHub Pages
// Remplace l'API backend par des données statiques

const STATIC_SETTINGS = {
  // Informations générales
  nursery_name: 'Mima Elghalia',
  director_name: 'Mme Fatima Ben Ali',
  nursery_logo: '/images/logo.png',
  
  // Contact
  nursery_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',
  nursery_phone: '+216 71 123 456',
  nursery_email: 'contact@mimaelghalia.tn',
  nursery_website: 'https://mimaelghalia.tn',
  
  // Capacité
  total_capacity: 30,
  available_spots: 5,
  min_age_months: 3,
  max_age_months: 48,
  
  // Messages
  welcome_message_fr: 'Bienvenue à la crèche Mima Elghalia, un lieu d\'épanouissement pour vos enfants dans un environnement sécurisé et bienveillant.',
  welcome_message_ar: 'مرحباً بكم في حضانة ميما الغالية، مكان لنمو أطفالكم في بيئة آمنة ومحبة.',
  about_description_fr: 'Notre crèche offre un environnement éducatif stimulant avec une équipe qualifiée dédiée au bien-être de chaque enfant.',
  about_description_ar: 'توفر حضانتنا بيئة تعليمية محفزة مع فريق مؤهل مكرس لرفاهية كل طفل.',
  
  // Thème
  site_theme: 'light',
  primary_color: '#3B82F6',
  secondary_color: '#8B5CF6',
  accent_color: '#F59E0B',
  
  // Horaires
  opening_hours: {
    monday: { open: '07:00', close: '18:00' },
    tuesday: { open: '07:00', close: '18:00' },
    wednesday: { open: '07:00', close: '18:00' },
    thursday: { open: '07:00', close: '18:00' },
    friday: { open: '07:00', close: '18:00' },
    saturday: { open: '08:00', close: '16:00' },
    sunday: { open: null, close: null }
  },
  
  // Réseaux sociaux
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  
  // Système
  license_number: 'CR-2025-001',
  closure_periods: []
};

class StaticSettingsService {
  // Simuler un délai réseau
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Récupérer les paramètres publics
  async getPublicSettings() {
    await this.delay();
    
    return {
      success: true,
      data: { ...STATIC_SETTINGS }
    };
  }

  // Récupérer un paramètre spécifique
  async getSetting(key) {
    await this.delay();
    
    return {
      success: true,
      data: {
        setting_key: key,
        setting_value: STATIC_SETTINGS[key] || null,
        setting_type: this.getSettingType(key)
      }
    };
  }

  // Mettre à jour un paramètre (simulation)
  async updateSetting(key, data) {
    await this.delay();
    
    // En mode statique, on simule juste la sauvegarde
    STATIC_SETTINGS[key] = data.value;
    
    return {
      success: true,
      message: 'Paramètre mis à jour avec succès'
    };
  }

  // Mettre à jour plusieurs paramètres (simulation)
  async updateMultiple(settings) {
    await this.delay();
    
    Object.keys(settings).forEach(key => {
      if (settings[key].value !== undefined) {
        STATIC_SETTINGS[key] = settings[key].value;
      }
    });
    
    return {
      success: true,
      message: 'Paramètres mis à jour avec succès'
    };
  }

  // Déterminer le type d'un paramètre
  getSettingType(key) {
    if (key.includes('capacity') || key.includes('age') || key.includes('spots')) return 'number';
    if (key.includes('color')) return 'string';
    if (key.includes('theme')) return 'string';
    if (key.includes('opening_hours')) return 'json';
    if (key.includes('closure_periods')) return 'json';
    if (key.includes('logo')) return 'image';
    return 'string';
  }

  // Upload d'image (simulation)
  async uploadImage(file) {
    await this.delay(1000);
    
    // Simuler un upload en convertissant en base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          success: true,
          data: {
            url: e.target.result,
            filename: file.name
          }
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// Détecter si on est en mode GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Exporter le service approprié
export const settingsService = isGitHubPages 
  ? new StaticSettingsService()
  : {
      // Service API normal (importé dynamiquement si nécessaire)
      async getPublicSettings() {
        const { settingsService: apiService } = await import('./settingsService.js');
        return apiService.getPublicSettings();
      },
      async getSetting(key) {
        const { settingsService: apiService } = await import('./settingsService.js');
        return apiService.getSetting(key);
      },
      async updateSetting(key, data) {
        const { settingsService: apiService } = await import('./settingsService.js');
        return apiService.updateSetting(key, data);
      },
      async updateMultiple(settings) {
        const { settingsService: apiService } = await import('./settingsService.js');
        return apiService.updateMultiple(settings);
      },
      async uploadImage(file) {
        const { settingsService: apiService } = await import('./settingsService.js');
        return apiService.uploadImage(file);
      }
    };

export default settingsService;
