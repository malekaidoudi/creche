import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Upload, 
  FileText, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Edit
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import documentsService from '../../services/documentsService';

const DocumentsPage = () => {
  const { user } = useAuth();
  const isAdmin = () => user?.role === 'admin';
  const isStaff = () => user?.role === 'staff';
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    document_type: 'reglement',
    is_public: true
  });

  // Fonction pour charger les documents depuis l'API
  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Simuler des données pour l'instant
      setDocuments([
        {
          id: 1,
          title: 'Règlement intérieur',
          description: 'Règlement de la crèche Mima Elghalia',
          document_type: 'reglement',
          is_public: true,
          created_at: new Date().toISOString(),
          uploaded_by_name: 'Admin',
          uploaded_by_lastname: 'System',
          original_filename: 'reglement.pdf'
        },
        {
          id: 2,
          title: 'Formulaire d\'inscription',
          description: 'Formulaire à remplir pour l\'inscription',
          document_type: 'formulaire',
          is_public: true,
          created_at: new Date().toISOString(),
          uploaded_by_name: 'Admin',
          uploaded_by_lastname: 'System',
          original_filename: 'formulaire.pdf'
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [filterType]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadDocuments();
  };

  // Fonction pour upload d'un document
  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setUploadLoading(true);
      // Simuler l'upload pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(isRTL ? 'تم رفع المستند بنجاح' : 'Document uploadé avec succès');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({
        title: '',
        description: '',
        document_type: 'reglement',
        is_public: true
      });
      loadDocuments(); // Recharger la liste
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadLoading(false);
    }
  };

  // Fonction pour supprimer un document
  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المستند؟' : 'Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      // Simuler la suppression
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success(isRTL ? 'تم حذف المستند بنجاح' : 'Document supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Fonction pour télécharger un document
  const handleDownload = async (id, filename) => {
    try {
      // Simuler le téléchargement
      toast.success(isRTL ? 'تم تحميل المستند' : `Téléchargement de ${filename} démarré`);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Filtrer les documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
            {isRTL ? 'إدارة المستندات' : 'Gestion des documents'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'إدارة المستندات الإدارية والملفات' : 'Gérer les documents administratifs et fichiers'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </Button>
          
          {(isAdmin() || isStaff()) && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'رفع مستند' : 'Ajouter document'}
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={isRTL ? 'البحث في المستندات...' : 'Rechercher des documents...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filtre par type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{isRTL ? 'جميع الأنواع' : 'Tous les types'}</option>
              <option value="reglement">{isRTL ? 'اللوائح' : 'Règlements'}</option>
              <option value="formulaire">{isRTL ? 'النماذج' : 'Formulaires'}</option>
              <option value="general">{isRTL ? 'عام' : 'Général'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.document_type}
                      </p>
                    </div>
                  </div>
                  
                  {doc.is_public && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      {isRTL ? 'عام' : 'Public'}
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {doc.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {doc.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>
                    {new Date(doc.created_at).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                  </span>
                  <span>
                    {doc.uploaded_by_name} {doc.uploaded_by_lastname}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc.id, doc.original_filename)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                    {isRTL ? 'تحميل' : 'Télécharger'}
                  </Button>
                  
                  {(isAdmin() || isStaff()) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Message si aucun document */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isRTL ? 'لا توجد مستندات' : 'Aucun document trouvé'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL 
              ? 'لا توجد مستندات مطابقة لمعايير البحث'
              : 'Aucun document ne correspond aux critères de recherche'
            }
          </p>
        </div>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'رفع مستند جديد' : 'Ajouter un nouveau document'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'العنوان' : 'Titre'}
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={isRTL ? 'عنوان المستند' : 'Titre du document'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={isRTL ? 'وصف المستند' : 'Description du document'}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'النوع' : 'Type'}
                </label>
                <select
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData({...uploadData, document_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="reglement">{isRTL ? 'لائحة' : 'Règlement'}</option>
                  <option value="formulaire">{isRTL ? 'نموذج' : 'Formulaire'}</option>
                  <option value="general">{isRTL ? 'عام' : 'Général'}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الملف' : 'Fichier'}
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={uploadData.is_public}
                  onChange={(e) => setUploadData({...uploadData, is_public: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 rtl:ml-0 rtl:mr-2 block text-sm text-gray-900 dark:text-white">
                  {isRTL ? 'مستند عام (يمكن للجميع الوصول إليه)' : 'Document public (accessible à tous)'}
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowUploadModal(false)}
                variant="outline"
                className="flex-1"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadLoading || !selectedFile || !uploadData.title}
                className="flex-1"
              >
                {uploadLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {uploadLoading ? (isRTL ? 'جاري الرفع...' : 'Upload...') : (isRTL ? 'رفع' : 'Uploader')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
