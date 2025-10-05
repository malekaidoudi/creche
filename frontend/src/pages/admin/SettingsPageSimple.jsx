import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../config/api';
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
  Image as ImageIcon,
  Users,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useSettings } from '../../contexts/SettingsContext';

const SettingsPageSimple = () => {
  const { isRTL } = useLanguage();
  const { settings: contextSettings, refreshSettings, updateLocalSettings, saveSettings, loading: contextLoading } = useSettings();
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');
  const [isSaving, setIsSaving] = useState(false); // Flag pour éviter les re-renders pendant la sauvegarde
  // Catégories de paramètres
  const categories = [
    {
      id: 'general',
      name: isRTL ? 'عام' : 'Général',
      icon: Settings,
      color: 'blue',
      fields: ['nursery_name', 'nursery_name_ar', 'nursery_logo', 'director_name']
    },
    {
      id: 'contact',
      name: isRTL ? 'الاتصال' : 'Contact',
      icon: Globe,
      color: 'green',
      fields: ['nursery_address', 'nursery_address_ar', 'nursery_phone', 'nursery_email', 'nursery_website']
    },
    {
      id: 'capacity',
      name: isRTL ? 'السعة والإحصائيات' : 'Capacité & Statistiques',
      icon: Users,
      fields: ['total_capacity', 'available_spots', 'min_age_months', 'max_age_months', 'staff_count', 'opening_year', 'map_address']
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
      color: 'purple',
      fields: ['site_theme', 'primary_color', 'secondary_color', 'accent_color']
    },
    {
      id: 'hours',
      name: isRTL ? 'ساعات العمل' : 'Horaires',
      icon: Clock,
      color: 'indigo',
      fields: ['opening_hours']
    }
  ];

  // Charger les paramètres
  useEffect(() => {
    loadSettings();
  }, []);

  // Recharger quand le contexte change (seulement au premier chargement)
  useEffect(() => {
    if (contextSettings && Object.keys(contextSettings).length > 0 && !isSaving) {
      setSettings(contextSettings);
      
      // Ne mettre à jour formData que si c'est vide (premier chargement)
      setFormData(prev => {
        const isFirstLoad = Object.keys(prev).length === 0;
        if (isFirstLoad) {
          console.log('🔄 Premier chargement du formulaire depuis le contexte');
          return contextSettings;
        } else {
          console.log('⚠️ Formulaire déjà initialisé, conservation des modifications');
          return prev;
        }
      });
    }
  }, [contextSettings, isSaving]);

  const loadSettings = async () => {
    try {
      console.log('🔄 Chargement des paramètres admin depuis le contexte...');
      
      // Utiliser les paramètres du contexte au lieu du service
      if (contextSettings && Object.keys(contextSettings).length > 0) {
        setSettings(contextSettings);
        
        // Ne mettre à jour formData que si c'est le premier chargement
        // (éviter d'écraser les modifications en cours)
        setFormData(prev => {
          const hasExistingData = Object.keys(prev).length > 0;
          if (hasExistingData) {
            console.log('⚠️ FormData existant détecté, conservation des modifications');
            return prev; // Garder les modifications existantes
          } else {
            console.log('✅ Premier chargement, initialisation du formData');
            return contextSettings; // Premier chargement
          }
        });
        
        console.log('✅ Paramètres admin chargés:', Object.keys(contextSettings).length, 'paramètres');
      } else {
        console.log('⚠️ Aucun paramètre dans le contexte, attente...');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des paramètres admin:', error);
      toast.error(isRTL ? 'خطأ في تحميل الإعدادات' : 'Erreur lors du chargement des paramètres');
    }
  };

  // Validation des champs
  const validateField = (key, value) => {
    const errors = {};

    switch (key) {
      case 'welcome_message_fr':
        if (!value || value.trim().length === 0) {
          errors[key] = isRTL ? 'الرسالة الفرنسية مطلوبة' : 'Message français requis';
        } else {
          const sentences = value.split(/[.!?]+/).filter(s => s.trim().length > 0);
          if (sentences.length < 1) {
            errors[key] = isRTL ? 'يجب أن تحتوي على جملة واحدة على الأقل' : 'Doit contenir au moins une phrase';
          } else if (sentences.length > 3) {
            errors[key] = isRTL ? 'لا يجب أن تتجاوز 3 جمل' : 'Ne doit pas dépasser 3 phrases';
          }
        }
        break;

      case 'welcome_message_ar':
        if (!value || value.trim().length === 0) {
          errors[key] = isRTL ? 'الرسالة العربية مطلوبة' : 'Message arabe requis';
        } else {
          const sentences = value.split(/[.!?؟]+/).filter(s => s.trim().length > 0);
          if (sentences.length < 1) {
            errors[key] = isRTL ? 'يجب أن تحتوي على جملة واحدة على الأقل' : 'Doit contenir au moins une phrase';
          } else if (sentences.length > 3) {
            errors[key] = isRTL ? 'لا يجب أن تتجاوز 3 جمل' : 'Ne doit pas dépasser 3 phrases';
          }
        }
        break;

      case 'nursery_address':
      case 'nursery_address_ar':
      case 'map_address':
        if (!value || value.trim().length < 10) {
          errors[key] = isRTL ? 'العنوان قصير جداً (10 أحرف على الأقل)' : 'Adresse trop courte (min 10 caractères)';
        } else if (value.length > 200) {
          errors[key] = isRTL ? 'العنوان طويل جداً (200 حرف كحد أقصى)' : 'Adresse trop longue (max 200 caractères)';
        }
        break;

      case 'nursery_name':
      case 'nursery_name_ar':
        if (!value || value.trim().length < 2) {
          errors[key] = isRTL ? 'اسم الحضانة قصير جداً (حرفان على الأقل)' : 'Nom de crèche trop court (min 2 caractères)';
        } else if (value.length > 100) {
          errors[key] = isRTL ? 'اسم الحضانة طويل جداً (100 حرف كحد أقصى)' : 'Nom de crèche trop long (max 100 caractères)';
        }
        break;

      case 'total_capacity':
      case 'available_spots':
      case 'staff_count':
      case 'min_age_months':
      case 'max_age_months':
      case 'opening_year':
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0) {
          errors[key] = isRTL ? 'يجب أن يكون رقماً موجباً' : 'Doit être un nombre positif';
        } else if (key === 'total_capacity' && numValue > 200) {
          errors[key] = isRTL ? 'السعة الإجمالية كبيرة جداً' : 'Capacité totale trop élevée';
        } else if (key === 'available_spots' && numValue > parseInt(formData.total_capacity || 0)) {
          errors[key] = isRTL ? 'الأماكن المتاحة لا يمكن أن تتجاوز السعة الإجمالية' : 'Places disponibles ne peut pas dépasser la capacité totale';
        } else if (key === 'opening_year' && (numValue < 1990 || numValue > new Date().getFullYear())) {
          errors[key] = isRTL ? 'سنة الافتتاح غير صحيحة' : 'Année d\'ouverture invalide';
        }
        break;

      case 'nursery_phone':
        if (!value || !/^\+?[\d\s\-\(\)]{8,20}$/.test(value)) {
          errors[key] = isRTL ? 'رقم الهاتف غير صحيح' : 'Numéro de téléphone invalide';
        }
        break;

      case 'nursery_email':
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[key] = isRTL ? 'عنوان البريد الإلكتروني غير صحيح' : 'Adresse email invalide';
        }
        break;
    }

    return errors;
  };

  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState({});

  // Mettre à jour un champ avec validation
  const handleFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));

    // Valider le champ
    const fieldErrors = validateField(key, value);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      [key]: fieldErrors[key] || undefined
    }));
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    try {
      setLoading(true);
      setIsSaving(true); // Empêcher les re-renders pendant la sauvegarde
      
      // Valider tous les champs modifiés
      const allErrors = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== settings[key]) {
          const fieldErrors = validateField(key, formData[key]);
          Object.assign(allErrors, fieldErrors);
        }
      });

      // Vérifier s'il y a des erreurs de validation
      if (Object.keys(allErrors).length > 0) {
        setValidationErrors(allErrors);
        toast.error(isRTL ? 'يرجى تصحيح الأخطاء قبل الحفظ' : 'Veuillez corriger les erreurs avant de sauvegarder');
        return;
      }
      
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
        toast(isRTL ? 'لا توجد تغييرات للحفظ' : 'Aucune modification à sauvegarder');
        return;
      }

      // Préparer les données pour la sauvegarde (valeurs seulement)
      const settingsToSave = {};
      Object.keys(changedSettings).forEach(key => {
        settingsToSave[key] = changedSettings[key].value;
      });
      
      // Sauvegarder via le contexte
      const result = await saveSettings(settingsToSave);
      
      if (result.success) {
        toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres sauvegardés avec succès');
        
        // Mettre à jour les settings de référence avec les nouvelles valeurs
        setSettings(prev => ({
          ...prev,
          ...settingsToSave
        }));
        
        // NE PAS recharger depuis l'API pour éviter d'écraser les modifications
        // await refreshSettings(); // Commenté pour éviter l'écrasement
        
        console.log('✅ Paramètres mis à jour localement:', Object.keys(settingsToSave));
      } else {
        toast.error(result.error || (isRTL ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde'));
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(isRTL ? 'خطأ في حفظ الإعدادات' : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
      setIsSaving(false); // Réactiver les re-renders
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
      // Utiliser l'API d'upload Railway en production
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(getApiUrl(`/api/settings/upload/${key}`), {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Mettre à jour seulement le formData (pas le contexte)
        handleFieldChange(key, result.data.path);
        toast.success(isRTL ? 'تم رفع الصورة بنجاح - Cliquez sur Sauvegarder pour confirmer' : 'Image uploadée avec succès - Cliquez sur Sauvegarder pour confirmer');
        
        // Ne pas rafraîchir le contexte ici - laisser l'utilisateur sauvegarder
        // await refreshSettings();
      } else {
        throw new Error(result.message || 'Erreur upload');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
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
              className="flex items-center px-4 py-2 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
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

    if (key.includes('capacity') || key.includes('age') || key.includes('spots') || key.includes('count') || key.includes('year')) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              validationErrors[key] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {validationErrors[key] && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {validationErrors[key]}
            </p>
          )}
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
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              validationErrors[key] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {validationErrors[key] && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {validationErrors[key]}
            </p>
          )}
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
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              validationErrors[key] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="+216 XX XXX XXX"
          />
          {validationErrors[key] && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {validationErrors[key]}
            </p>
          )}
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
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              validationErrors[key] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="contact@example.com"
          />
          {validationErrors[key] && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {validationErrors[key]}
            </p>
          )}
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

    // Champ horaires d'ouverture
    if (key === 'opening_hours') {
      const hours = value || {
        monday: { open: '07:00', close: '18:00', closed: false },
        tuesday: { open: '07:00', close: '18:00', closed: false },
        wednesday: { open: '07:00', close: '18:00', closed: false },
        thursday: { open: '07:00', close: '18:00', closed: false },
        friday: { open: '07:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '12:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      };

      const days = [
        { key: 'monday', name: isRTL ? 'الإثنين' : 'Lundi' },
        { key: 'tuesday', name: isRTL ? 'الثلاثاء' : 'Mardi' },
        { key: 'wednesday', name: isRTL ? 'الأربعاء' : 'Mercredi' },
        { key: 'thursday', name: isRTL ? 'الخميس' : 'Jeudi' },
        { key: 'friday', name: isRTL ? 'الجمعة' : 'Vendredi' },
        { key: 'saturday', name: isRTL ? 'السبت' : 'Samedi' },
        { key: 'sunday', name: isRTL ? 'الأحد' : 'Dimanche' }
      ];

      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </label>
          <div className="space-y-3">
            {days.map(day => (
              <div key={day.key} className="flex items-center space-x-4 rtl:space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {day.name}
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!hours[day.key]?.closed}
                    onChange={(e) => {
                      const newHours = {
                        ...hours,
                        [day.key]: {
                          ...hours[day.key],
                          closed: !e.target.checked
                        }
                      };
                      handleFieldChange(key, newHours);
                    }}
                    className="mr-2 rtl:mr-0 rtl:ml-2"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? 'مفتوح' : 'Ouvert'}
                  </span>
                </label>
                {!hours[day.key]?.closed && (
                  <>
                    <input
                      type="time"
                      value={hours[day.key]?.open || '07:00'}
                      onChange={(e) => {
                        const newHours = {
                          ...hours,
                          [day.key]: {
                            ...hours[day.key],
                            open: e.target.value
                          }
                        };
                        handleFieldChange(key, newHours);
                      }}
                      className="px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hours[day.key]?.close || '18:00'}
                      onChange={(e) => {
                        const newHours = {
                          ...hours,
                          [day.key]: {
                            ...hours[day.key],
                            close: e.target.value
                          }
                        };
                        handleFieldChange(key, newHours);
                      }}
                      className="px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
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
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            validationErrors[key] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {validationErrors[key] && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {validationErrors[key]}
          </p>
        )}
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
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span>{isRTL ? 'العودة للموقع' : 'Retour au site'}</span>
              </Link>
              <div className="border-l border-gray-300 dark:border-gray-600 h-6"></div>
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
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        activeCategory === category.id
                          ? `bg-${category.color}-50 text-${category.color}-700 dark:bg-${category.color}-900/20 dark:text-${category.color}-300`
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        {category.name}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeCategory === category.id
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
                  {categories.find(c => c.id === activeCategory)?.name}
                </h2>
              </div>

              {/* Contenu du formulaire */}
              <div className="p-6">
                <div className="space-y-6">
                  {getFieldsByCategory(activeCategory).map((key) => (
                    <div key={key}>
                      {renderField(key)}
                    </div>
                  ))}
                  
                  {getFieldsByCategory(activeCategory).length === 0 && (
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
