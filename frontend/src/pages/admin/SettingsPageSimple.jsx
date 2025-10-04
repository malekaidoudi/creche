import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Save, 
  Upload, 
  Eye, 
  EyeOff, 
  Palette, 
  Globe, 
  Building, 
  Clock, 
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useSettings } from '../../contexts/SettingsContext';
import { settingsService } from '../../services/staticSettingsService';

const SettingsPageSimple = () => {
  const { isRTL } = useLanguage();
  const { refreshSettings, updateLocalSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});

  // Catégories de paramètres
  const categories = [
    {
      id: 'general',
      name: isRTL ? 'عام' : 'Général',
      icon: Building,
      color: 'blue',
      fields: ['nursery_name', 'director_name', 'nursery_logo']
    },
    {
      id: 'contact',
      name: isRTL ? 'الاتصال' : 'Contact',
      icon: Globe,
      color: 'green',
      fields: ['nursery_address', 'nursery_phone', 'nursery_email', 'nursery_website']
    },
    {
      id: 'capacity',
      name: isRTL ? 'السعة' : 'Capacité',
      icon: Settings,
      color: 'purple',
      fields: ['total_capacity', 'available_spots', 'min_age_months', 'max_age_months']
    },
    {
      id: 'content',
      name: isRTL ? 'المحتوى' : 'Contenu',
      icon: Eye,
      color: 'pink',
      fields: ['welcome_message_fr', 'welcome_message_ar', 'about_description_fr', 'about_description_ar']
    },
    {
      id: 'appearance',
      name: isRTL ? 'المظهر' : 'Apparence',
      icon: Palette,
      color: 'indigo',
      fields: ['site_theme', 'primary_color', 'secondary_color', 'accent_color']
    }
  ];

  // Charger les paramètres
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getPublicSettings();
      
      if (response.success) {
        setSettings(response.data);
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(isRTL ? 'خطأ في تحميل الإعدادات' : 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un champ
  const handleFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Préparer les données modifiées seulement
      const changedSettings = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== settings[key]) {
          changedSettings[key] = {
            value: formData[key],
            type: getSettingType(key)
          };
        }
      });

      if (Object.keys(changedSettings).length === 0) {
        toast.info(isRTL ? 'لا توجد تغييرات للحفظ' : 'Aucune modification à sauvegarder');
        return;
      }

      // Sauvegarder via l'API (simulation pour le moment)
      // En production, utiliser : await settingsService.updateMultiple(changedSettings);
      
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres sauvegardés avec succès');
      
      // Mettre à jour les settings locaux
      setSettings(formData);
      
      // Mettre à jour le contexte global immédiatement pour que les changements apparaissent sur le site
      updateLocalSettings(formData);
      
      // Optionnel : rafraîchir depuis la base de données
      // await refreshSettings();
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(isRTL ? 'خطأ في حفظ الإعدادات' : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le type d'un paramètre
  const getSettingType = (key) => {
    if (key.includes('capacity') || key.includes('age') || key.includes('spots')) return 'number';
    if (key.includes('color')) return 'string';
    if (key.includes('theme')) return 'string';
    if (key.includes('message') || key.includes('description')) return 'string';
    return 'string';
  };

  // Filtrer les champs par catégorie
  const getFieldsByCategory = (category) => {
    const categoryConfig = categories.find(c => c.id === category);
    if (!categoryConfig) return [];
    
    return categoryConfig.fields.filter(field => settings[field] !== undefined);
  };

  // Upload d'image
  const handleImageUpload = async (key, file) => {
    if (!file) return;
    
    try {
      // Simulation d'upload - en production, utiliser l'API
      const reader = new FileReader();
      reader.onload = (e) => {
        handleFieldChange(key, e.target.result);
        toast.success(isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploadée avec succès');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(isRTL ? 'خطأ في رفع الصورة' : 'Erreur lors de l\'upload');
    }
  };

  // Rendu d'un champ selon son type
  const renderField = (key) => {
    const value = formData[key] || '';
    const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Champ upload d'image (logo)
    if (key.includes('logo')) {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          {value && (
            <div className="relative">
              <img
                src={value}
                alt="Logo"
                className="w-32 h-32 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
          )}
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleImageUpload(key, file);
                }
              }}
              className="hidden"
              id={`upload-${key}`}
            />
            <label
              htmlFor={`upload-${key}`}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isRTL ? 'رفع صورة' : 'Choisir une image'}
            </label>
          </div>
        </div>
      );
    }

    // Déterminer le type de champ
    if (key.includes('color')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
              placeholder="#000000"
            />
          </div>
        </div>
      );
    }

    if (key.includes('theme')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <select
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="auto">Automatique</option>
          </select>
        </div>
      );
    }

    if (key.includes('capacity') || key.includes('age') || key.includes('spots')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
          />
        </div>
      );
    }

    if (key.includes('message') || key.includes('description')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
          />
        </div>
      );
    }

    // Champ téléphone (toujours LTR)
    if (key.includes('phone')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            dir="ltr"
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
            placeholder="+216 XX XXX XXX"
          />
        </div>
      );
    }

    // Champ email (toujours LTR)
    if (key.includes('email')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            dir="ltr"
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
            placeholder="contact@example.com"
          />
        </div>
      );
    }

    // Champ URL (toujours LTR)
    if (key.includes('website') || key.includes('url')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <input
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            dir="ltr"
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
            placeholder="https://example.com"
          />
        </div>
      );
    }

    // Champ texte par défaut
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {displayName}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-600"
        />
      </div>
    );
  };

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isRTL ? 'إعدادات الحضانة' : 'Paramètres de la crèche'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isRTL 
                  ? 'إدارة جميع إعدادات وخصائص الحضانة'
                  : 'Gérez tous les paramètres et propriétés de la crèche'
                }
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isRTL ? 'حفظ' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Catégories */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isRTL ? 'الفئات' : 'Catégories'}
              </h3>
              
              <nav className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const fieldsCount = getFieldsByCategory(category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === category.id
                          ? `bg-${category.color}-50 text-${category.color}-700 dark:bg-${category.color}-900/20 dark:text-${category.color}-300`
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        {category.name}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeTab === category.id
                          ? `bg-${category.color}-100 text-${category.color}-700 dark:bg-${category.color}-800 dark:text-${category.color}-200`
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {fieldsCount}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content - Formulaire */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Header du formulaire */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {categories.find(c => c.id === activeTab)?.name}
                </h2>
              </div>

              {/* Contenu du formulaire */}
              <div className="p-6">
                <div className="space-y-6">
                  {getFieldsByCategory(activeTab).map((key) => (
                    <div key={key}>
                      {renderField(key)}
                    </div>
                  ))}
                  
                  {getFieldsByCategory(activeTab).length === 0 && (
                    <div className="text-center py-12">
                      <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {isRTL 
                          ? 'لا توجد إعدادات في هذه الفئة'
                          : 'Aucun paramètre dans cette catégorie'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPageSimple;
