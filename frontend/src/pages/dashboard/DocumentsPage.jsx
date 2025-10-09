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
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('download');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Documents à télécharger (stockés dans public/documents)
  const downloadableDocuments = [
    {
      id: 1,
      name: 'Formulaire d\'inscription',
      nameAr: 'استمارة التسجيل',
      filename: 'formulaire-inscription.pdf',
      description: 'Formulaire principal d\'inscription à remplir',
      descriptionAr: 'الاستمارة الرئيسية للتسجيل',
      required: true,
      size: '245 KB'
    },
    {
      id: 2,
      name: 'Fiche médicale',
      nameAr: 'البطاقة الطبية',
      filename: 'fiche-medicale.pdf',
      description: 'Informations médicales de l\'enfant',
      descriptionAr: 'المعلومات الطبية للطفل',
      required: true,
      size: '156 KB'
    },
    {
      id: 3,
      name: 'Autorisation de sortie',
      nameAr: 'إذن الخروج',
      filename: 'autorisation-sortie.pdf',
      description: 'Autorisation pour les sorties et activités',
      descriptionAr: 'إذن للخروج والأنشطة',
      required: true,
      size: '98 KB'
    },
    {
      id: 4,
      name: 'Règlement intérieur',
      nameAr: 'النظام الداخلي',
      filename: 'reglement-interieur.pdf',
      description: 'Règlement de la crèche à lire et signer',
      descriptionAr: 'نظام الحضانة للقراءة والتوقيع',
      required: true,
      size: '312 KB'
    },
    {
      id: 5,
      name: 'Contrat d\'accueil',
      nameAr: 'عقد الاستقبال',
      filename: 'contrat-accueil.pdf',
      description: 'Contrat entre la crèche et les parents',
      descriptionAr: 'عقد بين الحضانة والأولياء',
      required: true,
      size: '189 KB'
    },
    {
      id: 6,
      name: 'Liste documents requis',
      nameAr: 'قائمة الوثائق المطلوبة',
      filename: 'liste-documents-requis.pdf',
      description: 'Liste complète des documents à fournir',
      descriptionAr: 'القائمة الكاملة للوثائق المطلوبة',
      required: false,
      size: '67 KB'
    }
  ];

  // Documents uploadés par les parents (simulés)
  const [uploadedDocuments, setUploadedDocuments] = useState([
    {
      id: 1,
      parentName: 'Ahmed Mohamed',
      childName: 'Sara Ahmed',
      documentType: 'Formulaire d\'inscription',
      filename: 'formulaire_sara_ahmed.pdf',
      uploadDate: '2024-01-15',
      status: 'pending',
      size: '1.2 MB',
      enrollmentId: 1
    },
    {
      id: 2,
      parentName: 'Fatima Ben Ali',
      childName: 'Mohamed Ben Ali',
      documentType: 'Fiche médicale',
      filename: 'fiche_medicale_mohamed.pdf',
      uploadDate: '2024-01-14',
      status: 'approved',
      size: '856 KB',
      enrollmentId: 2
    },
    {
      id: 3,
      parentName: 'Omar Trabelsi',
      childName: 'Lina Trabelsi',
      documentType: 'Autorisation sortie',
      filename: 'autorisation_lina.pdf',
      uploadDate: '2024-01-13',
      status: 'rejected',
      size: '654 KB',
      enrollmentId: 3,
      rejectionReason: 'Document illisible, veuillez le re-scanner'
    }
  ]);

  const handleDownload = (filename) => {
    // Télécharger depuis public/documents
    const link = document.createElement('a');
    link.href = `/documents/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(isRTL ? 'تم تحميل الملف' : 'Document téléchargé');
  };

  const handleViewDocument = (doc) => {
    // Ouvrir le document dans un nouvel onglet
    window.open(`/uploads/${doc.filename}`, '_blank');
  };

  const handleApproveDocument = (docId) => {
    setUploadedDocuments(prev => 
      prev.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'approved' }
          : doc
      )
    );
    toast.success(isRTL ? 'تم قبول الوثيقة' : 'Document approuvé');
  };

  const handleRejectDocument = (docId, reason) => {
    setUploadedDocuments(prev => 
      prev.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'rejected', rejectionReason: reason }
          : doc
      )
    );
    toast.success(isRTL ? 'تم رفض الوثيقة' : 'Document rejeté');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return isRTL ? 'مقبول' : 'Approuvé';
      case 'rejected':
        return isRTL ? 'مرفوض' : 'Rejeté';
      default:
        return isRTL ? 'في الانتظار' : 'En attente';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const filteredUploadedDocuments = uploadedDocuments.filter(doc => {
    const matchesSearch = doc.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'إدارة الوثائق' : 'Gestion des documents'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {isRTL 
                ? 'إدارة الوثائق القابلة للتحميل والوثائق المرفوعة من الأولياء'
                : 'Gérer les documents téléchargeables et les documents uploadés par les parents'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'download'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 inline" />
            {isRTL ? 'وثائق للتحميل' : 'Documents à télécharger'}
          </button>
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploaded'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 inline" />
            {isRTL ? 'الوثائق المرفوعة' : 'Documents uploadés'}
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'download' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? 'الوثائق المتاحة للتحميل' : 'Documents disponibles au téléchargement'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'الوثائق التي يجب على الأولياء تحميلها وملؤها'
                  : 'Documents que les parents doivent télécharger et remplir'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {downloadableDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-red-600 mr-3 rtl:mr-0 rtl:ml-3" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {isRTL ? doc.nameAr : doc.name}
                          </h3>
                          {doc.required && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {isRTL ? 'مطلوب' : 'Requis'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {isRTL ? doc.descriptionAr : doc.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.size}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(doc.filename)}
                        className="flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'تحميل' : 'Télécharger'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'uploaded' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Filtres et recherche */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={isRTL ? 'البحث في الوثائق...' : 'Rechercher dans les documents...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
                    <option value="pending">{isRTL ? 'في الانتظار' : 'En attente'}</option>
                    <option value="approved">{isRTL ? 'مقبول' : 'Approuvé'}</option>
                    <option value="rejected">{isRTL ? 'مرفوض' : 'Rejeté'}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des documents uploadés */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? 'الوثائق المرفوعة من الأولياء' : 'Documents uploadés par les parents'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? `${filteredUploadedDocuments.length} وثيقة`
                  : `${filteredUploadedDocuments.length} documents`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {doc.documentType}
                          </h3>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                            <User className="w-4 h-4" />
                            <span>{doc.parentName}</span>
                            <span>•</span>
                            <span>{doc.childName}</span>
                            <span>•</span>
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          <span className="ml-1 rtl:ml-0 rtl:mr-1">{getStatusText(doc.status)}</span>
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'عرض' : 'Voir'}
                        </Button>
                        
                        {isAdmin() && doc.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveDocument(doc.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              {isRTL ? 'قبول' : 'Approuver'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectDocument(doc.id, 'Document non conforme')}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              {isRTL ? 'رفض' : 'Rejeter'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          <strong>{isRTL ? 'سبب الرفض:' : 'Raison du rejet:'}</strong> {doc.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredUploadedDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {isRTL ? 'لا توجد وثائق مطابقة للبحث' : 'Aucun document ne correspond à votre recherche'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentsPage;
