const express = require('express');
const router = express.Router();

// Mock data pour les paramètres de la crèche
const crecheSettings = {
  name: {
    fr: 'Mima Elghalia',
    ar: 'ميما الغالية'
  },
  description: {
    fr: 'Une crèche moderne offrant un environnement sûr et stimulant pour le développement de vos enfants',
    ar: 'حضانة عصرية توفر بيئة آمنة ومحفزة لتطوير أطفالكم'
  },
  address: {
    fr: '123 Avenue Habib Bourguiba, Tunis',
    ar: 'شارع الحبيب بورقيبة، تونس العاصمة'
  },
  phone: '+216 71 123 456',
  email: 'contact@mimaelghalia.tn',
  website: 'https://mimaelghalia.tn',
  director: {
    name: {
      fr: 'Mme. Fatima Ahmed',
      ar: 'السيدة فاطمة أحمد'
    },
    title: {
      fr: 'Directrice',
      ar: 'المديرة'
    }
  },
  capacity: 30,
  ageRange: {
    min: 2, // mois
    max: 36 // mois
  },
  hours: {
    open: '07:00',
    close: '18:00',
    days: {
      fr: 'Lundi - Vendredi',
      ar: 'الإثنين - الجمعة'
    }
  },
  services: [
    {
      id: 'childcare',
      name: {
        fr: 'Garde d\'enfants',
        ar: 'رعاية الأطفال'
      },
      description: {
        fr: 'Garde complète pour enfants de 2 mois à 3 ans',
        ar: 'رعاية شاملة للأطفال من عمر شهرين إلى 3 سنوات'
      },
      icon: 'baby'
    },
    {
      id: 'education',
      name: {
        fr: 'Éducation précoce',
        ar: 'التعليم المبكر'
      },
      description: {
        fr: 'Programmes éducatifs avancés pour le développement',
        ar: 'برامج تعليمية متطورة لتنمية قدرات الطفل'
      },
      icon: 'book-open'
    },
    {
      id: 'health',
      name: {
        fr: 'Soins de santé',
        ar: 'الرعاية الصحية'
      },
      description: {
        fr: 'Suivi médical continu et environnement sain',
        ar: 'متابعة طبية مستمرة وبيئة صحية آمنة'
      },
      icon: 'heart'
    },
    {
      id: 'activities',
      name: {
        fr: 'Activités de groupe',
        ar: 'الأنشطة الجماعية'
      },
      description: {
        fr: 'Activités ludiques pour développer les compétences sociales',
        ar: 'أنشطة ترفيهية وتعليمية لتطوير المهارات الاجتماعية'
      },
      icon: 'users'
    }
  ],
  theme: {
    primaryColor: '#0ea5e9', // sky-500
    secondaryColor: '#d946ef', // fuchsia-500
    logo: '/images/logo_creche.jpg',
    favicon: '/images/favicon.ico'
  },
  social: {
    facebook: 'https://facebook.com/mimaelghalia',
    instagram: 'https://instagram.com/mimaelghalia',
    linkedin: 'https://linkedin.com/company/mimaelghalia'
  },
  features: [
    {
      id: 'security',
      name: {
        fr: 'Sécurité 24/7',
        ar: 'أمان 24/7'
      },
      description: {
        fr: 'Surveillance continue et environnement sécurisé',
        ar: 'مراقبة مستمرة وبيئة آمنة'
      },
      icon: 'shield'
    },
    {
      id: 'nutrition',
      name: {
        fr: 'Nutrition équilibrée',
        ar: 'تغذية متوازنة'
      },
      description: {
        fr: 'Repas sains préparés par des nutritionnistes',
        ar: 'وجبات صحية معدة من قبل أخصائيي التغذية'
      },
      icon: 'utensils'
    },
    {
      id: 'qualified-staff',
      name: {
        fr: 'Personnel qualifié',
        ar: 'فريق مؤهل'
      },
      description: {
        fr: 'Équipe expérimentée et certifiée',
        ar: 'فريق ذو خبرة ومعتمد'
      },
      icon: 'award'
    }
  ],
  stats: [
    {
      id: 'capacity',
      value: 30,
      label: {
        fr: 'Places disponibles',
        ar: 'مكان متاح'
      },
      icon: 'users'
    },
    {
      id: 'opening-year',
      value: 2025,
      label: {
        fr: 'Année d\'ouverture',
        ar: 'سنة الافتتاح'
      },
      icon: 'calendar'
    },
    {
      id: 'staff-count',
      value: 4,
      label: {
        fr: 'Personnel qualifié',
        ar: 'موظف مؤهل'
      },
      icon: 'award'
    },
    {
      id: 'safety-standards',
      value: '100%',
      label: {
        fr: 'Normes de sécurité',
        ar: 'معايير الأمان'
      },
      icon: 'shield'
    }
  ]
};

// GET /api/settings - Récupérer tous les paramètres
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: crecheSettings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/settings/:section - Récupérer une section spécifique
router.get('/:section', (req, res) => {
  try {
    const { section } = req.params;
    
    if (!crecheSettings[section]) {
      return res.status(404).json({
        success: false,
        error: 'Section non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: crecheSettings[section]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la section:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;
