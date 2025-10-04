import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  Image as ImageIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { settingsService } from '../../services/settingsService';

const SettingsPage = () => {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [showPrivate, setShowPrivate] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm();

  // Catégories de paramètres
  const categories = [
    {
      id: 'general',
      name: isRTL ? 'عام' : 'Général',
      icon: Building,
      color: 'blue'
    },
    {
      id: 'contact',
      name: isRTL ? 'الاتصال' : 'Contact',
      icon: Globe,
      color: 'green'
    },
    {
      id: 'capacity',
      name: isRTL ? 'السعة' : 'Capacité',
      icon: Settings,
      color: 'purple'
    },
    {
      id: 'schedule',
      name: isRTL ? 'الجدولة' : 'Horaires',
      icon: Clock,
      color: 'orange'
    },
    {
      id: 'content',
      name: isRTL ? 'المحتوى' : 'Contenu',
      icon: Eye,
      color: 'pink'
    },
    {
      id: 'appearance',
      name: isRTL ? 'المظهر' : 'Apparence',
      icon: Palette,
      color: 'indigo'
    },
    {
      id: 'system',
      name: isRTL ? 'النظام' : 'Système',
      icon: Shield,
      color: 'red'
    }
  ];

  // Charger les paramètres
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      
      if (response.success) {
        const settingsObj = {};
        response.data.forEach(setting => {
          settingsObj[setting.setting_key] = {
            value: setting.setting_value,
            type: setting.setting_type,
            category: setting.category,
            description: setting.description,
            isPublic: setting.is_public
          };
        });
        
        setSettings(settingsObj);
        
        // Pré-remplir le formulaire
        Object.keys(settingsObj).forEach(key => {
          let value = settingsObj[key].value;
          
          // Parser selon le type
          switch (settingsObj[key].type) {
            case 'number':
              value = parseFloat(value);
              break;
            case 'boolean':
              value = value === 'true';
              break;
            case 'json':
              try {
                value = JSON.parse(value);
              } catch (e) {
                console.warn(`Failed to parse JSON for ${key}:`, value);
              }
              break;
          }
          
          setValue(key, value);
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(isRTL ? 'خطأ في تحميل الإعدادات' : 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les paramètres
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Préparer les données pour l'API
      const settingsToUpdate = {};
      
      Object.keys(data).forEach(key => {
        if (settings[key]) {
          const setting = settings[key];
          let value = data[key];
          
          // Convertir selon le type
          switch (setting.type) {
            case 'json':
              if (typeof value === 'object') {
                value = JSON.stringify(value);
              }
              break;
            case 'boolean':
              value = value ? 'true' : 'false';
              break;
            case 'number':
              value = value.toString();
              break;
            default:
              value = value.toString();
          }
          
          settingsToUpdate[key] = {
            value: value,
            type: setting.type
          };
        }
      });

      const response = await settingsService.updateMultiple(settingsToUpdate);
      
      if (response.success) {
        toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres sauvegardés avec succès');
        await loadSettings(); // Recharger pour voir les changements
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(isRTL ? 'خطأ في حفظ الإعدادات' : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Upload d'image
  const handleImageUpload = async (key, file) => {
    try {
      setUploadingImage(key);
      
      const response = await settingsService.uploadImage(key, file);
      
      if (response.success) {
        setValue(key, response.data.path);
        toast.success(isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploadée avec succès');
        await loadSettings();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(isRTL ? 'خطأ في رفع الصورة' : 'Erreur lors de l\'upload');
    } finally {
      setUploadingImage(null);
    }
  };

  // Filtrer les paramètres par catégorie
  const getSettingsByCategory = (category) => {
    return Object.keys(settings).filter(key => 
      settings[key].category === category && 
      (showPrivate || settings[key].isPublic)
    );
  };

  // Rendu d'un champ selon son type
  const renderField = (key, setting) => {
    const { type, description } = setting;
    const fieldProps = {
      ...register(key),
      className: `w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
        errors[key] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
      }`
    };

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register(key)}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {description}
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            {...fieldProps}
            placeholder={description}
          />
        );

      case 'image':
        return (
          <div className="space-y-3">
            {watch(key) && (
              <div className="relative">
                <img
                  src={watch(key)}
                  alt={key}
                  className="w-32 h-32 object-cover rounded-lg border"
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
                {uploadingImage === key ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isRTL ? 'رفع صورة' : 'Choisir une image'}
              </label>
            </div>
          </div>
        );

      case 'json':
        return (
          <textarea
            {...fieldProps}
            rows="4"
            placeholder={`${description} (Format JSON)`}
            defaultValue={typeof watch(key) === 'object' ? JSON.stringify(watch(key), null, 2) : watch(key)}
          />
        );

      default:
        return (
          <input
            type="text"
            {...fieldProps}
            placeholder={description}
          />
        );
    }
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
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showPrivate 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {showPrivate ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {isRTL ? 'إظهار الخاص' : 'Afficher privés'}
              </button>
            </div>
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
                  const settingsCount = getSettingsByCategory(category.id).length;
                  
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
                        {settingsCount}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content - Formulaire */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Header du formulaire */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {categories.find(c => c.id === activeTab)?.name}
                    </h2>
                    
                    <button
                      type="submit"
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

                {/* Contenu du formulaire */}
                <div className="p-6">
                  <div className="space-y-6">
                    {getSettingsByCategory(activeTab).map((key) => {
                      const setting = settings[key];
                      
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              {!setting.isPublic && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                                  {isRTL ? 'خاص' : 'Privé'}
                                </span>
                              )}
                            </label>
                            
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {setting.type}
                            </span>
                          </div>
                          
                          {renderField(key, setting)}
                          
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.description}
                            </p>
                          )}
                          
                          {errors[key] && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {errors[key].message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    
                    {getSettingsByCategory(activeTab).length === 0 && (
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
