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
    Edit,
    Baby,
    Archive,
    FolderOpen,
    ExternalLink,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DocumentsPage = () => {
    const { user } = useAuth();
    const isAdmin = () => user?.role === 'admin';
    const isStaff = () => user?.role === 'staff';
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();

    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState({ admin: 0, children: 0, archives: 0, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('admin');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // État pour les enfants avec dossier incomplet
    const [childrenWithMissingDocs, setChildrenWithMissingDocs] = useState([]);
    const [showChildUploadModal, setShowChildUploadModal] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    // 3 fichiers séparés pour les documents enfant
    const [childDocuments, setChildDocuments] = useState({
        acte_naissance: null,
        carnet_medical: null,
        certificat_medical: null
    });
    // État pour les cartes pliables (enfants avec dossier complet)
    const [expandedChildren, setExpandedChildren] = useState({});
    // Configuration automatique des types de documents
    const documentTypeConfig = {
        reglement: {
            title: isRTL ? 'النظام الداخلي' : 'Règlement intérieur',
            description: isRTL ? 'النظام الداخلي للحضانة - يجب توقيعه من طرف الأولياء' : 'Règlement intérieur de la crèche - à signer par les parents'
        },
        formulaire: {
            title: isRTL ? 'نموذج التسجيل' : 'Formulaire d\'inscription',
            description: isRTL ? 'نموذج التسجيل للأطفال الجدد' : 'Formulaire d\'inscription pour les nouveaux enfants'
        },
        guide: {
            title: isRTL ? 'دليل الأولياء' : 'Guide des parents',
            description: isRTL ? 'دليل شامل للأولياء حول سير الحضانة' : 'Guide complet pour les parents sur le fonctionnement de la crèche'
        },
        general: {
            title: isRTL ? 'وثيقة عامة' : 'Document général',
            description: isRTL ? 'وثيقة إدارية عامة' : 'Document administratif général'
        }
    };

    const [uploadData, setUploadData] = useState({
        document_type: 'reglement',
        is_public: true,
        is_required: false
    });

    // Charger les documents depuis l'API
    const loadDocuments = async () => {
        try {
            setLoading(true);

            const [docsResponse, statsResponse] = await Promise.all([
                api.get('/api/documents', { params: { type: filterCategory } }),
                api.get('/api/documents/stats')
            ]);

            if (docsResponse.data.success) {
                setDocuments(docsResponse.data.documents || []);

                // Identifier les enfants avec dossier incomplet (placeholder "dossier_complet" sans URL)
                if (filterCategory === 'children') {
                    const childrenDocs = docsResponse.data.documents || [];
                    console.log('📄 Documents enfants chargés:', childrenDocs.length);

                    // Chercher les placeholders "Dossier non disponible"
                    const missingDocs = childrenDocs.filter(doc => {
                        const isPlaceholder = doc.document_type === 'dossier_complet' && !doc.cloudinary_url;
                        const hasNote = doc.notes?.includes('Documents à fournir') || doc.description?.includes('Documents à fournir');
                        const isNonDisponible = doc.original_filename === 'Dossier non disponible' || doc.title?.includes('Dossier non disponible');
                        return isPlaceholder || isNonDisponible || hasNote;
                    });

                    console.log('⚠️ Dossiers incomplets trouvés:', missingDocs.length, missingDocs);
                    setChildrenWithMissingDocs(missingDocs);
                }
            }

            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
            }
        } catch (error) {
            console.error('Erreur chargement documents:', error);
            dialog.error(isRTL ? 'خطأ في تحميل الوثائق' : 'Erreur lors du chargement des documents');
        } finally {
            setLoading(false);
        }
    };

    // Upload documents pour un enfant avec dossier incomplet (3 fichiers)
    const handleChildDocumentUpload = async () => {
        const hasAnyFile = childDocuments.acte_naissance || childDocuments.carnet_medical || childDocuments.certificat_medical;

        if (!hasAnyFile || !selectedChild) {
            dialog.error(isRTL ? 'يرجى اختيار ملف واحد على الأقل' : 'Veuillez sélectionner au moins un fichier');
            return;
        }

        try {
            setUploadLoading(true);
            let uploadedCount = 0;

            // Upload chaque document séparément
            for (const [docType, file] of Object.entries(childDocuments)) {
                if (file) {
                    const formData = new FormData();
                    formData.append('document', file);
                    formData.append('document_type', docType);

                    await api.post(`/api/documents/children/${selectedChild.child_id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    uploadedCount++;
                }
            }

            dialog.success(isRTL
                ? `تم تحميل ${uploadedCount} وثيقة بنجاح`
                : `${uploadedCount} document(s) ajouté(s) avec succès`
            );
            setShowChildUploadModal(false);
            setChildDocuments({ acte_naissance: null, carnet_medical: null, certificat_medical: null });
            setSelectedChild(null);
            loadDocuments();
        } catch (error) {
            console.error('Erreur upload document enfant:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في تحميل الوثيقة' : 'Erreur lors du téléversement'));
        } finally {
            setUploadLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [filterCategory]);

    // Upload d'un document administratif
    const handleUpload = async () => {
        if (!selectedFile) {
            dialog.error(isRTL ? 'يرجى اختيار ملف' : 'Veuillez sélectionner un fichier');
            return;
        }

        // Récupérer le titre et la description automatiques
        const config = documentTypeConfig[uploadData.document_type];

        try {
            setUploadLoading(true);

            const formData = new FormData();
            formData.append('document', selectedFile);
            formData.append('title', config.title);
            formData.append('description', config.description);
            formData.append('document_type', uploadData.document_type);
            formData.append('is_public', uploadData.is_public);
            formData.append('is_required', uploadData.is_required);

            const response = await api.post('/api/documents/admin', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                dialog.success(isRTL ? 'تم تحميل الوثيقة بنجاح' : 'Document téléversé avec succès');
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadData({
                    document_type: 'reglement',
                    is_public: true,
                    is_required: false
                });
                loadDocuments();
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في تحميل الوثيقة' : 'Erreur lors du téléversement'));
        } finally {
            setUploadLoading(false);
        }
    };

    // Supprimer un document administratif
    const handleDelete = async (doc) => {
        if (doc.category !== 'admin') {
            dialog.error(isRTL ? 'لا يمكن حذف هذا المستند' : 'Ce document ne peut pas être supprimé');
            return;
        }

        const confirmed = await dialog.confirm(
            isRTL ? 'هل أنت متأكد من حذف هذه الوثيقة؟' : 'Êtes-vous sûr de vouloir supprimer ce document ?',
            isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression',
            { type: 'danger', confirmText: isRTL ? 'حذف' : 'Supprimer', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
        );

        if (!confirmed) return;

        try {
            const response = await api.delete(`/api/documents/admin/${doc.id}`);
            if (response.data.success) {
                dialog.success(isRTL ? 'تم حذف الوثيقة بنجاح' : 'Document supprimé avec succès');
                loadDocuments();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            dialog.error(isRTL ? 'خطأ في حذف الوثيقة' : 'Erreur lors de la suppression');
        }
    };

    // Ouvrir/télécharger un document
    const handleView = (doc) => {
        if (!doc.cloudinary_url) {
            dialog.error(isRTL ? 'الملف غير متوفر' : 'Fichier non disponible');
            return;
        }
        // Utiliser directement l'URL Cloudinary stockée en base
        window.open(doc.cloudinary_url, '_blank');
    };

    // Obtenir la configuration de catégorie
    const getCategoryConfig = (category) => {
        const configs = {
            admin: {
                label: isRTL ? 'إداري' : 'Administratif',
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                icon: FolderOpen
            },
            children: {
                label: isRTL ? 'طفل' : 'Enfant',
                color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                icon: Baby
            },
            archives: {
                label: isRTL ? 'أرشيف' : 'Archive',
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                icon: Archive
            }
        };
        return configs[category] || configs.admin;
    };

    // Filtrer les documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch =
            doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.child_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.child_last_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Documents requis pour un dossier complet
    const REQUIRED_DOCS = ['acte_naissance', 'carnet_medical', 'certificat_medical'];

    // Regrouper les documents enfants par nom d'enfant
    const groupedChildrenDocs = filteredDocuments
        .filter(doc => doc.category === 'children')
        .reduce((groups, doc) => {
            const childName = `${doc.child_first_name || 'Inconnu'} ${doc.child_last_name || ''}`.trim();
            if (!groups[childName]) {
                groups[childName] = {
                    docs: [],
                    child_id: doc.child_id,
                    child_first_name: doc.child_first_name,
                    child_last_name: doc.child_last_name
                };
            }
            groups[childName].docs.push(doc);
            return groups;
        }, {});

    // Calculer les documents manquants pour chaque enfant
    const getChildMissingDocs = (childDocs) => {
        const existingTypes = childDocs
            .filter(doc => doc.cloudinary_url) // Seulement les vrais documents (pas les placeholders)
            .map(doc => doc.document_type);
        return REQUIRED_DOCS.filter(type => !existingTypes.includes(type));
    };

    // Regrouper les documents archivés par nom d'enfant
    const groupedArchivesDocs = filteredDocuments
        .filter(doc => doc.category === 'archives')
        .reduce((groups, doc) => {
            const childName = `${doc.child_first_name || 'Inconnu'} ${doc.child_last_name || ''}`.trim();
            if (!groups[childName]) {
                groups[childName] = {
                    docs: [],
                    child_first_name: doc.child_first_name,
                    child_last_name: doc.child_last_name,
                    archived_at: doc.archived_at
                };
            }
            groups[childName].docs.push(doc);
            return groups;
        }, {});

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
                    <Button variant="outline" onClick={loadDocuments}>
                        <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'تحديث' : 'Actualiser'}
                    </Button>

                    {isAdmin() && (
                        <Button onClick={() => setShowUploadModal(true)}>
                            <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {isRTL ? 'رفع مستند إداري' : 'Ajouter document admin'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer hover:shadow-md transition-shadow ${filterCategory === 'admin' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setFilterCategory('admin')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admin}</p>
                            <p className="text-sm text-gray-500">{isRTL ? 'إداري' : 'Administratifs'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`cursor-pointer hover:shadow-md transition-shadow ${filterCategory === 'children' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setFilterCategory('children')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Baby className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.children}</p>
                            <p className="text-sm text-gray-500">{isRTL ? 'وثائق الأطفال' : 'Documents enfants'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`cursor-pointer hover:shadow-md transition-shadow ${filterCategory === 'archives' ? 'ring-2 ring-gray-500' : ''}`} onClick={() => setFilterCategory('archives')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.archives}</p>
                            <p className="text-sm text-gray-500">{isRTL ? 'أرشيف' : 'Archives'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Recherche */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={isRTL ? 'البحث في المستندات...' : 'Rechercher des documents...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Liste des documents - Affichage selon la catégorie */}
            {filterCategory === 'archives' ? (
                /* Affichage groupé par enfant pour les archives */
                <div className="space-y-6">
                    {Object.entries(groupedArchivesDocs).map(([childName, childData], groupIndex) => {
                        const docsCount = childData.docs.length;
                        const isExpanded = expandedChildren[`archive_${childName}`] ?? false; // Par défaut plié

                        return (
                            <Card key={`archive-${childName}`} className="overflow-hidden">
                                <CardHeader
                                    className="border-b cursor-pointer transition-colors bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    onClick={() => setExpandedChildren(prev => ({ ...prev, [`archive_${childName}`]: !isExpanded }))}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/50">
                                                <Archive className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white text-sm">{childName}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isRTL ? `${docsCount} وثيقة مؤرشفة` : `${docsCount} document(s) archivé(s)`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isExpanded
                                                ? <ChevronUp className="w-4 h-4 text-red-500" />
                                                : <ChevronDown className="w-4 h-4 text-red-500" />
                                            }
                                        </div>
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {childData.docs.map((doc, docIndex) => (
                                                <div key={`${doc.id}-${docIndex}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {doc.document_type || doc.title}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                {doc.original_filename}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-xs text-gray-400 hidden sm:inline">
                                                            {new Date(doc.archived_at || doc.created_at).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                                                        </span>
                                                        {doc.cloudinary_url ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleView(doc)}
                                                                    title={isRTL ? 'عرض' : 'Voir'}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    <span className="hidden sm:inline ml-1">{isRTL ? 'عرض' : 'Voir'}</span>
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = doc.cloudinary_url;
                                                                        link.download = doc.original_filename || 'document';
                                                                        link.target = '_blank';
                                                                        link.click();
                                                                    }}
                                                                    title={isRTL ? 'تحميل' : 'Télécharger'}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    <span className="hidden sm:inline ml-1">{isRTL ? 'تحميل' : 'Télécharger'}</span>
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button size="sm" variant="outline" disabled>
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                <span className="hidden sm:inline">{isRTL ? 'غير متوفر' : 'Non disponible'}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : filterCategory === 'children' ? (
                /* Affichage groupé par enfant */
                <div className="space-y-6">
                    {Object.entries(groupedChildrenDocs).map(([childName, childData], groupIndex) => {
                        const missingDocs = getChildMissingDocs(childData.docs);
                        const hasAllDocs = missingDocs.length === 0;
                        const realDocsCount = childData.docs.filter(d => d.cloudinary_url).length;
                        const isExpanded = expandedChildren[childName] ?? !hasAllDocs; // Par défaut: déplié si incomplet, plié si complet

                        return (
                            <Card key={childName} className="overflow-hidden">
                                <CardHeader
                                    className={`border-b cursor-pointer transition-colors ${hasAllDocs ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'}`}
                                    onClick={() => hasAllDocs && setExpandedChildren(prev => ({ ...prev, [childName]: !isExpanded }))}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasAllDocs ? 'bg-green-100 dark:bg-green-900/50' : 'bg-orange-100 dark:bg-orange-900/50'}`}>
                                                <Baby className={`w-4 h-4 ${hasAllDocs ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white text-sm">{childName}</h3>
                                                <p className={`text-xs ${hasAllDocs ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    {hasAllDocs
                                                        ? (isRTL ? `الملف مكتمل ✓ (${realDocsCount})` : `Dossier complet ✓ (${realDocsCount} docs)`)
                                                        : (isRTL ? `${missingDocs.length} وثيقة مفقودة` : `${missingDocs.length} document(s) manquant(s)`)
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!hasAllDocs && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedChild({
                                                            child_id: childData.child_id,
                                                            child_first_name: childData.child_first_name,
                                                            child_last_name: childData.child_last_name,
                                                            missingDocs: missingDocs
                                                        });
                                                        setChildDocuments({
                                                            acte_naissance: null,
                                                            carnet_medical: null,
                                                            certificat_medical: null
                                                        });
                                                        setShowChildUploadModal(true);
                                                    }}
                                                    className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    {isRTL ? 'إضافة' : 'Ajouter'}
                                                </button>
                                            )}
                                            {hasAllDocs && (
                                                isExpanded
                                                    ? <ChevronUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    : <ChevronDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                {(isExpanded || !hasAllDocs) && (
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {childData.docs.filter(doc => doc.cloudinary_url).map((doc, docIndex) => (
                                                <div key={`${doc.id}-${docIndex}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {doc.document_type}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                {doc.original_filename}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-xs text-gray-400 hidden sm:inline">
                                                            {new Date(doc.created_at).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                                                        </span>
                                                        {doc.cloudinary_url ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleView(doc)}
                                                                    title={isRTL ? 'عرض' : 'Voir'}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    <span className="hidden sm:inline ml-1">{isRTL ? 'عرض' : 'Voir'}</span>
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = doc.cloudinary_url;
                                                                        link.download = doc.original_filename || 'document';
                                                                        link.target = '_blank';
                                                                        link.click();
                                                                    }}
                                                                    title={isRTL ? 'تحميل' : 'Télécharger'}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    <span className="hidden sm:inline ml-1">{isRTL ? 'تحميل' : 'Télécharger'}</span>
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button size="sm" variant="outline" disabled>
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                <span className="hidden sm:inline">{isRTL ? 'غير متوفر' : 'Non disponible'}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                /* Affichage en grille pour admin et archives */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((doc, index) => {
                        const categoryConfig = getCategoryConfig(doc.category);
                        const CategoryIcon = categoryConfig.icon;

                        return (
                            <motion.div
                                key={`${doc.category}-${doc.id}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow h-full">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.category === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                    'bg-gray-100 dark:bg-gray-700'
                                                    }`}>
                                                    <CategoryIcon className={`w-5 h-5 ${doc.category === 'admin' ? 'text-blue-600 dark:text-blue-400' :
                                                        'text-gray-600 dark:text-gray-400'
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {doc.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {doc.document_type}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.color}`}>
                                                {categoryConfig.label}
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-2">
                                        {doc.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                {doc.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(doc.created_at).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                                            </span>
                                            {doc.original_filename && (
                                                <span className="truncate max-w-[120px]" title={doc.original_filename}>
                                                    {doc.original_filename}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {doc.cloudinary_url ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleView(doc)}
                                                    className="flex-1"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                                                    {isRTL ? 'عرض' : 'Voir'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled
                                                    className="flex-1"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                                                    {isRTL ? 'غير متوفر' : 'Non disponible'}
                                                </Button>
                                            )}

                                            {isAdmin() && doc.category === 'admin' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(doc)}
                                                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Message si aucun document */}
            {(filterCategory === 'children'
                ? Object.keys(groupedChildrenDocs).length === 0
                : filterCategory === 'archives'
                    ? Object.keys(groupedArchivesDocs).length === 0
                    : filteredDocuments.length === 0) && (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {isRTL ? 'لا توجد مستندات' : 'Aucun document trouvé'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {filterCategory === 'admin'
                                ? (isRTL ? 'لا توجد مستندات إدارية. أضف مستندًا جديدًا.' : 'Aucun document administratif. Ajoutez-en un nouveau.')
                                : filterCategory === 'children'
                                    ? (isRTL ? 'لا توجد وثائق أطفال. سيتم إضافتها عند الموافقة على التسجيلات.' : 'Aucun document enfant. Ils seront ajoutés lors de l\'approbation des inscriptions.')
                                    : filterCategory === 'archives'
                                        ? (isRTL ? 'لا توجد وثائق مؤرشفة.' : 'Aucun document archivé.')
                                        : (isRTL ? 'لا توجد مستندات مطابقة لمعايير البحث' : 'Aucun document ne correspond aux critères de recherche')
                            }
                        </p>
                    </div>
                )}

            {/* Modal d'upload */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {isRTL ? 'رفع مستند إداري جديد' : 'Ajouter un document administratif'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRTL ? 'نوع الوثيقة' : 'Type de document'} *
                                </label>
                                <select
                                    value={uploadData.document_type}
                                    onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="reglement">{isRTL ? 'النظام الداخلي' : 'Règlement intérieur'}</option>
                                    <option value="formulaire">{isRTL ? 'نموذج التسجيل' : 'Formulaire d\'inscription'}</option>
                                    <option value="guide">{isRTL ? 'دليل الأولياء' : 'Guide des parents'}</option>
                                    <option value="general">{isRTL ? 'وثيقة عامة' : 'Document général'}</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {isRTL ? 'العنوان والوصف سيتم تعيينهما تلقائياً' : 'Le titre et la description seront définis automatiquement'}
                                </p>
                            </div>

                            {/* Aperçu du titre et description automatiques */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {isRTL ? 'العنوان:' : 'Titre:'} <span className="text-gray-900 dark:text-white">{documentTypeConfig[uploadData.document_type]?.title}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {isRTL ? 'الوصف:' : 'Description:'} {documentTypeConfig[uploadData.document_type]?.description}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRTL ? 'الملف' : 'Fichier'} *
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {isRTL ? 'PDF, JPEG, PNG - الحد الأقصى 10 ميجابايت' : 'PDF, JPEG, PNG - Max 10 Mo'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={uploadData.is_public}
                                        onChange={(e) => setUploadData({ ...uploadData, is_public: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm text-gray-900 dark:text-white">
                                        {isRTL ? 'عام' : 'Public'}
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={uploadData.is_required}
                                        onChange={(e) => setUploadData({ ...uploadData, is_required: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm text-gray-900 dark:text-white">
                                        {isRTL ? 'مطلوب للتسجيل' : 'Requis pour inscription'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFile(null);
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={uploadLoading || !selectedFile}
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

            {/* Modal d'upload pour enfant avec documents manquants */}
            {showChildUploadModal && selectedChild && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {isRTL ? 'إضافة الوثائق المفقودة' : 'Ajouter les documents manquants'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {isRTL ? 'لـ' : 'Pour'} <span className="font-medium text-gray-900 dark:text-white">{selectedChild.child_first_name} {selectedChild.child_last_name}</span>
                        </p>

                        <div className="space-y-4">
                            {/* Acte de naissance - affiché seulement si manquant */}
                            {(!selectedChild.missingDocs || selectedChild.missingDocs.includes('acte_naissance')) && (
                                <div className="p-3 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        {isRTL ? 'شهادة الميلاد' : 'Acte de naissance'}
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setChildDocuments(prev => ({ ...prev, acte_naissance: e.target.files[0] }))}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    {childDocuments.acte_naissance && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {childDocuments.acte_naissance.name}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Carnet médical - affiché seulement si manquant */}
                            {(!selectedChild.missingDocs || selectedChild.missingDocs.includes('carnet_medical')) && (
                                <div className="p-3 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <FileText className="w-4 h-4 text-green-500" />
                                        {isRTL ? 'الدفتر الطبي' : 'Carnet médical'}
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setChildDocuments(prev => ({ ...prev, carnet_medical: e.target.files[0] }))}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    {childDocuments.carnet_medical && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {childDocuments.carnet_medical.name}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Certificat médical - affiché seulement si manquant */}
                            {(!selectedChild.missingDocs || selectedChild.missingDocs.includes('certificat_medical')) && (
                                <div className="p-3 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                        {isRTL ? 'الشهادة الطبية' : 'Certificat médical'}
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setChildDocuments(prev => ({ ...prev, certificat_medical: e.target.files[0] }))}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    {childDocuments.certificat_medical && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {childDocuments.certificat_medical.name}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Info */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                {isRTL ? 'PDF, JPEG, PNG - الحد الأقصى 10 ميجابايت لكل ملف' : 'PDF, JPEG, PNG - Max 10 Mo par fichier'}
                            </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={() => {
                                    setShowChildUploadModal(false);
                                    setChildDocuments({ acte_naissance: null, carnet_medical: null, certificat_medical: null });
                                    setSelectedChild(null);
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </Button>
                            <Button
                                onClick={handleChildDocumentUpload}
                                disabled={uploadLoading || (!childDocuments.acte_naissance && !childDocuments.carnet_medical && !childDocuments.certificat_medical)}
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                            >
                                {uploadLoading ? (
                                    <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                )}
                                {uploadLoading ? (isRTL ? 'جاري الرفع...' : 'Upload...') : (isRTL ? 'رفع الوثائق' : 'Ajouter')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
