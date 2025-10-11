import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import settingsService from '../../services/settingsService';

const SettingsPage = () => {
  const { isAdmin } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    type: 'string',
    description: '',
    isPublic: false
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Charger les paramètres
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAllSettings();
      
      if (response.success) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Fonction pour sauvegarder un paramètre
  const handleSaveSetting = async (key, settingData) => {
    try {
      setSaveLoading(true);
      const response = await settingsService.updateSetting(key, settingData);
      
      if (response.success) {
        toast.success(isRTL ? 'تم حفظ الإعداد بنجاح' : 'Paramètre sauvegardé avec succès');
        loadSettings(); // Recharger
        setShowAddModal(false);
        setEditingSetting(null);
        setNewSetting({
          key: '',
          value: '',
          type: 'string',
          description: '',
          isPublic: false
        });
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaveLoading(false);
    }
  };

  // Fonction pour supprimer un paramètre
  const handleDeleteSetting = async (key) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الإعداد؟' : 'Êtes-vous sûr de vouloir supprimer ce paramètre ?')) {
      return;
    }

    try {
      const response = await settingsService.deleteSetting(key);
      if (response.success) {
        toast.success(isRTL ? 'تم حذف الإعداد بنجاح' : 'Paramètre supprimé avec succès');
        loadSettings(); // Recharger
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  // Fonction pour éditer un paramètre
  const handleEditSetting = (key, setting) => {
    setEditingSetting(key);
    setNewSetting({
      key,
      value: setting.value,
      type: setting.type,
      description: setting.description,
      isPublic: setting.isPublic
    });
    setShowAddModal(true);
  };

  // Filtrer les paramètres
  const filteredSettings = Object.entries(settings).filter(([key, setting]) => {
    return key.toLowerCase().includes(searchTerm.toLowerCase()) ||
           setting.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Fonction pour rafraîchir
  const handleRefresh = () => {
    loadSettings();
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {isRTL ? 'غير مخول' : 'Accès non autorisé'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isRTL ? 'ليس لديك صلاحية للوصول إلى الإعدادات' : 'Vous n\'avez pas l\'autorisation d\'accéder aux paramètres'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'إعدادات النظام' : 'Paramètres système'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'إدارة إعدادات الحضانة' : 'Gérer les paramètres de la crèche'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </Button>
          
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'إضافة إعداد' : 'Ajouter paramètre'}
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={isRTL ? 'البحث في الإعدادات...' : 'Rechercher des paramètres...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des paramètres */}
      <div className="space-y-4">
        {filteredSettings.map(([key, setting]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {key}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        setting.type === 'string' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        setting.type === 'number' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        setting.type === 'boolean' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                      }`}>
                        {setting.type}
                      </span>
                      {setting.isPublic ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <Eye className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'عام' : 'Public'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                          <EyeOff className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'خاص' : 'Privé'}
                        </span>
                      )}
                    </div>
                    
                    {setting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {setting.description}
                      </p>
                    )}
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {setting.type === 'boolean' ? 
                          (setting.value ? (isRTL ? 'صحيح' : 'true') : (isRTL ? 'خطأ' : 'false')) :
                          setting.type === 'json' ?
                          JSON.stringify(setting.value, null, 2) :
                          String(setting.value)
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse ml-4 rtl:ml-0 rtl:mr-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSetting(key, setting)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSetting(key)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Message si aucun paramètre */}
      {filteredSettings.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isRTL ? 'لا توجد إعدادات' : 'Aucun paramètre trouvé'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL 
              ? 'لا توجد إعدادات مطابقة لمعايير البحث'
              : 'Aucun paramètre ne correspond aux critères de recherche'
            }
          </p>
        </div>
      )}

      {/* Modal d'ajout/édition */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingSetting ? 
                (isRTL ? 'تعديل الإعداد' : 'Modifier le paramètre') :
                (isRTL ? 'إضافة إعداد جديد' : 'Ajouter un nouveau paramètre')
              }
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'المفتاح' : 'Clé'}
                </label>
                <input
                  type="text"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                  disabled={!!editingSetting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  placeholder={isRTL ? 'مفتاح الإعداد' : 'Clé du paramètre'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'النوع' : 'Type'}
                </label>
                <select
                  value={newSetting.type}
                  onChange={(e) => setNewSetting({...newSetting, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="string">{isRTL ? 'نص' : 'Texte'}</option>
                  <option value="number">{isRTL ? 'رقم' : 'Nombre'}</option>
                  <option value="boolean">{isRTL ? 'منطقي' : 'Booléen'}</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'القيمة' : 'Valeur'}
                </label>
                {newSetting.type === 'boolean' ? (
                  <select
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="true">{isRTL ? 'صحيح' : 'Vrai'}</option>
                    <option value="false">{isRTL ? 'خطأ' : 'Faux'}</option>
                  </select>
                ) : newSetting.type === 'json' ? (
                  <textarea
                    value={typeof newSetting.value === 'object' ? JSON.stringify(newSetting.value, null, 2) : newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    rows={4}
                    placeholder='{"key": "value"}'
                  />
                ) : (
                  <input
                    type={newSetting.type === 'number' ? 'number' : 'text'}
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={isRTL ? 'قيمة الإعداد' : 'Valeur du paramètre'}
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={isRTL ? 'وصف الإعداد' : 'Description du paramètre'}
                  rows={2}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newSetting.isPublic}
                  onChange={(e) => setNewSetting({...newSetting, isPublic: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 rtl:ml-0 rtl:mr-2 block text-sm text-gray-900 dark:text-white">
                  {isRTL ? 'إعداد عام (يمكن للجميع الوصول إليه)' : 'Paramètre public (accessible à tous)'}
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSetting(null);
                  setNewSetting({
                    key: '',
                    value: '',
                    type: 'string',
                    description: '',
                    isPublic: false
                  });
                }}
                variant="outline"
                className="flex-1"
                disabled={saveLoading}
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                onClick={() => handleSaveSetting(newSetting.key, newSetting)}
                disabled={saveLoading || !newSetting.key}
                className="flex-1"
              >
                {saveLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {saveLoading ? (isRTL ? 'جاري الحفظ...' : 'Sauvegarde...') : (isRTL ? 'حفظ' : 'Sauvegarder')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
