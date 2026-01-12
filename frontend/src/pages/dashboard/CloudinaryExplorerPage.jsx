import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderOpen,
    File,
    Image,
    Video,
    FileText,
    HardDrive,
    Cloud,
    RefreshCw,
    Search,
    Trash2,
    Download,
    Eye,
    ChevronRight,
    Home,
    ArrowLeft,
    Grid,
    List,
    AlertTriangle,
    CheckCircle,
    X,
    Loader2,
    Database,
    Zap,
    Clock,
    Move,
    Copy,
    Edit,
    FolderPlus,
    MoreVertical
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CloudinaryExplorerPage = () => {
    const { user } = useAuth();
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [folders, setFolders] = useState([]);
    const [resources, setResources] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResource, setSelectedResource] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [resourceType, setResourceType] = useState('all');

    // États pour les modals de gestion de fichiers
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [targetFolder, setTargetFolder] = useState('');
    const [newName, setNewName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [allFolders, setAllFolders] = useState([]);
    const [showContextMenu, setShowContextMenu] = useState(null);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getResourceIcon = (resource) => {
        if (resource.resourceType === 'video') return Video;
        if (resource.resourceType === 'raw') return FileText;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(resource.format?.toLowerCase())) return Image;
        return File;
    };

    const loadStats = async () => {
        try {
            const response = await api.get('/api/cloudinary-explorer/stats');
            if (response.data.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    const loadFolders = async (path = '') => {
        try {
            const endpoint = path
                ? `/api/cloudinary-explorer/folders/${encodeURIComponent(path)}`
                : '/api/cloudinary-explorer/folders';

            const response = await api.get(endpoint);
            if (response.data.success) {
                setFolders(response.data.folders || []);
            } else {
                setFolders([]);
            }
        } catch (error) {
            console.error('Erreur chargement dossiers:', error);
            setFolders([]);
        }
    };

    const loadResources = async (folder = '') => {
        try {
            setLoading(true);

            // Ne pas charger les fichiers à la racine - seulement dans les dossiers
            if (!folder) {
                setResources([]);
                setLoading(false);
                return;
            }

            const endpoint = resourceType === 'all'
                ? '/api/cloudinary-explorer/all-resources'
                : '/api/cloudinary-explorer/resources';

            const params = { folder, max_results: 100 };
            if (resourceType !== 'all') {
                params.type = resourceType;
            }

            const response = await api.get(endpoint, { params });

            if (response.data.success) {
                // Filtrer pour n'afficher que les fichiers du dossier actuel (pas des sous-dossiers)
                const currentFolderResources = (response.data.resources || []).filter(r => {
                    const resourceFolder = r.folder || r.publicId.split('/').slice(0, -1).join('/');
                    return resourceFolder === folder;
                });
                setResources(currentFolderResources);
            }
        } catch (error) {
            console.error('Erreur chargement ressources:', error);
            dialog.error(isRTL ? 'خطأ في تحميل الملفات' : 'Erreur lors du chargement des fichiers');
        } finally {
            setLoading(false);
        }
    };

    const navigateToFolder = (folderPath) => {
        setCurrentPath(folderPath);

        if (folderPath) {
            const parts = folderPath.split('/');
            const newBreadcrumb = parts.map((part, index) => ({
                name: part,
                path: parts.slice(0, index + 1).join('/')
            }));
            setBreadcrumb(newBreadcrumb);
        } else {
            setBreadcrumb([]);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadResources(currentPath);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/api/cloudinary-explorer/search', {
                params: { q: searchTerm, max_results: 100 }
            });

            if (response.data.success) {
                setResources(response.data.resources || []);
            }
        } catch (error) {
            console.error('Erreur recherche:', error);
            dialog.error(isRTL ? 'خطأ في البحث' : 'Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResource = async (publicId) => {
        const confirmed = await dialog.confirm(
            isRTL ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Êtes-vous sûr de vouloir supprimer ce fichier ?',
            isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression'
        );

        if (!confirmed) return;

        try {
            setDeleteLoading(true);
            const response = await api.delete(`/api/cloudinary-explorer/resource/${encodeURIComponent(publicId)}`);

            if (response.data.success) {
                dialog.success(isRTL ? 'تم حذف الملف' : 'Fichier supprimé');
                setSelectedResource(null);
                loadResources(currentPath);
                loadStats();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            dialog.error(isRTL ? 'خطأ في الحذف' : 'Erreur lors de la suppression');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Charger tous les dossiers pour le sélecteur de destination
    const loadAllFolders = async () => {
        try {
            const response = await api.get('/api/cloudinary-explorer/folders');
            if (response.data.success) {
                const rootFolders = response.data.folders || [];
                const allFoldersList = [{ name: '/ (Racine)', path: '' }];

                // Ajouter les dossiers racine et leurs sous-dossiers
                for (const folder of rootFolders) {
                    allFoldersList.push({ name: folder.name, path: folder.path || folder.name });
                    // Charger les sous-dossiers
                    try {
                        const subResponse = await api.get(`/api/cloudinary-explorer/folders/${encodeURIComponent(folder.path || folder.name)}`);
                        if (subResponse.data.success && subResponse.data.folders) {
                            for (const subFolder of subResponse.data.folders) {
                                allFoldersList.push({
                                    name: `  └ ${subFolder.name}`,
                                    path: subFolder.path || `${folder.name}/${subFolder.name}`
                                });
                            }
                        }
                    } catch (e) {
                        // Ignorer les erreurs de sous-dossiers
                    }
                }
                setAllFolders(allFoldersList);
            }
        } catch (error) {
            console.error('Erreur chargement dossiers:', error);
        }
    };

    // Déplacer un fichier
    const handleMoveFile = async () => {
        if (!selectedResource) return;

        try {
            setActionLoading(true);
            const response = await api.post('/api/cloudinary-explorer/move', {
                publicId: selectedResource.publicId,
                targetFolder: targetFolder
            });

            if (response.data.success) {
                dialog.success(isRTL ? 'تم نقل الملف' : 'Fichier déplacé');
                setShowMoveModal(false);
                setSelectedResource(null);
                setTargetFolder('');
                loadResources(currentPath);
            }
        } catch (error) {
            console.error('Erreur déplacement:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في النقل' : 'Erreur lors du déplacement'));
        } finally {
            setActionLoading(false);
        }
    };

    // Copier un fichier
    const handleCopyFile = async () => {
        if (!selectedResource) return;

        try {
            setActionLoading(true);
            const response = await api.post('/api/cloudinary-explorer/copy', {
                publicId: selectedResource.publicId,
                targetFolder: targetFolder
            });

            if (response.data.success) {
                dialog.success(isRTL ? 'تم نسخ الملف' : 'Fichier copié');
                setShowCopyModal(false);
                setTargetFolder('');
                loadResources(currentPath);
            }
        } catch (error) {
            console.error('Erreur copie:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في النسخ' : 'Erreur lors de la copie'));
        } finally {
            setActionLoading(false);
        }
    };

    // Renommer un fichier
    const handleRenameFile = async () => {
        if (!selectedResource || !newName.trim()) return;

        try {
            setActionLoading(true);
            const response = await api.put('/api/cloudinary-explorer/rename', {
                publicId: selectedResource.publicId,
                newName: newName.trim()
            });

            if (response.data.success) {
                dialog.success(isRTL ? 'تم تغيير الاسم' : 'Fichier renommé');
                setShowRenameModal(false);
                setSelectedResource(null);
                setNewName('');
                loadResources(currentPath);
            }
        } catch (error) {
            console.error('Erreur renommage:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في تغيير الاسم' : 'Erreur lors du renommage'));
        } finally {
            setActionLoading(false);
        }
    };

    // Créer un dossier
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            setActionLoading(true);
            const folderPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
            const response = await api.post('/api/cloudinary-explorer/create-folder', {
                folderPath: folderPath
            });

            if (response.data.success) {
                dialog.success(isRTL ? 'تم إنشاء المجلد' : 'Dossier créé');
                setShowCreateFolderModal(false);
                setNewFolderName('');
                loadFolders(currentPath);
            }
        } catch (error) {
            console.error('Erreur création dossier:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في إنشاء المجلد' : 'Erreur lors de la création du dossier'));
        } finally {
            setActionLoading(false);
        }
    };

    // Supprimer un dossier
    const handleDeleteFolder = async (folderPath) => {
        const confirmed = await dialog.confirm(
            isRTL ? 'هل أنت متأكد من حذف هذا المجلد وجميع محتوياته؟' : 'Êtes-vous sûr de vouloir supprimer ce dossier et tout son contenu ?',
            isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression',
            { type: 'danger' }
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            const response = await api.delete(`/api/cloudinary-explorer/folder/${encodeURIComponent(folderPath)}`);

            if (response.data.success) {
                dialog.success(isRTL ? 'تم حذف المجلد' : 'Dossier supprimé');
                loadFolders(currentPath);
                loadStats();
            }
        } catch (error) {
            console.error('Erreur suppression dossier:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في حذف المجلد' : 'Erreur lors de la suppression du dossier'));
        } finally {
            setActionLoading(false);
        }
    };

    // Ouvrir le modal de déplacement
    const openMoveModal = () => {
        loadAllFolders();
        setTargetFolder('');
        setShowMoveModal(true);
    };

    // Ouvrir le modal de copie
    const openCopyModal = () => {
        loadAllFolders();
        setTargetFolder('');
        setShowCopyModal(true);
    };

    // Ouvrir le modal de renommage
    const openRenameModal = () => {
        if (selectedResource) {
            setNewName(selectedResource.filename || '');
            setShowRenameModal(true);
        }
    };

    const refresh = useCallback(() => {
        loadStats();
        loadFolders(currentPath);
        loadResources(currentPath);
    }, [currentPath]);

    useEffect(() => {
        loadStats();
        loadFolders();
        // Ne pas charger les ressources à la racine
    }, []);

    useEffect(() => {
        loadFolders(currentPath);
        loadResources(currentPath);
    }, [currentPath, resourceType]);

    const filteredResources = resources.filter(r => {
        if (!searchTerm) return true;
        return r.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.publicId?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getUsageColor = (percentage) => {
        const pct = parseFloat(percentage);
        if (pct >= 90) return 'bg-red-500';
        if (pct >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                        {isRTL ? 'هذه الصفحة متاحة للمسؤولين فقط' : 'Cette page est réservée aux administrateurs'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Cloud className="w-7 h-7 text-blue-500" />
                        {isRTL ? 'مستكشف Cloudinary' : 'Explorateur Cloudinary'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        {isRTL ? 'إدارة ملفات التخزين السحابي' : 'Gérer les fichiers du stockage cloud'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreateFolderModal(true)}>
                        <FolderPlus className="w-4 h-4 mr-2" />
                        {isRTL ? 'مجلد جديد' : 'Nouveau dossier'}
                    </Button>
                    <Button variant="outline" onClick={refresh} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {isRTL ? 'تحديث' : 'Actualiser'}
                    </Button>
                </div>
            </div>

            {/* Statistiques de stockage */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stockage */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{isRTL ? 'التخزين' : 'Stockage'}</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatBytes(stats.usage?.storage?.used)} / {formatBytes(stats.usage?.storage?.limit)}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getUsageColor(stats.usage?.storage?.percentage)}`}
                                    style={{ width: `${Math.min(stats.usage?.storage?.percentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{stats.usage?.storage?.percentage}%</p>
                        </CardContent>
                    </Card>

                    {/* Bande passante */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{isRTL ? 'عرض النطاق' : 'Bande passante'}</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatBytes(stats.usage?.bandwidth?.used)} / {formatBytes(stats.usage?.bandwidth?.limit)}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getUsageColor(stats.usage?.bandwidth?.percentage)}`}
                                    style={{ width: `${Math.min(stats.usage?.bandwidth?.percentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{stats.usage?.bandwidth?.percentage}%</p>
                        </CardContent>
                    </Card>

                    {/* Transformations */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{isRTL ? 'التحويلات' : 'Transformations'}</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {stats.usage?.transformations?.used?.toLocaleString()} / {stats.usage?.transformations?.limit?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getUsageColor(stats.usage?.transformations?.percentage)}`}
                                    style={{ width: `${Math.min(stats.usage?.transformations?.percentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{stats.usage?.transformations?.percentage}%</p>
                        </CardContent>
                    </Card>

                    {/* Ressources */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <File className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{isRTL ? 'الملفات' : 'Fichiers'}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats.usage?.resources?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                {isRTL ? 'الخطة:' : 'Plan:'} <span className="font-medium text-blue-600">{stats.plan || 'Free'}</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Barre de navigation et filtres */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateToFolder('')}
                                className="flex-shrink-0"
                            >
                                <Home className="w-4 h-4" />
                            </Button>

                            {breadcrumb.map((item, index) => (
                                <div key={item.path} className="flex items-center gap-1 flex-shrink-0">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigateToFolder(item.path)}
                                        className={index === breadcrumb.length - 1 ? 'font-semibold' : ''}
                                    >
                                        {item.name}
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Recherche */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={isRTL ? 'بحث...' : 'Rechercher...'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Filtre type */}
                            <select
                                value={resourceType}
                                onChange={(e) => setResourceType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="all">{isRTL ? 'الكل' : 'Tous'}</option>
                                <option value="image">{isRTL ? 'صور' : 'Images'}</option>
                                <option value="video">{isRTL ? 'فيديو' : 'Vidéos'}</option>
                                <option value="raw">{isRTL ? 'ملفات' : 'Fichiers'}</option>
                            </select>

                            {/* Vue */}
                            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="rounded-none"
                                >
                                    <Grid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="rounded-none"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Liste des dossiers et fichiers */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FolderOpen className="w-5 h-5 text-yellow-500" />
                                    {currentPath || (isRTL ? 'الجذر' : 'Racine')}
                                </span>
                                <span className="text-sm font-normal text-gray-500">
                                    {filteredResources.length} {isRTL ? 'ملف' : 'fichier(s)'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <LoadingSpinner size="lg" />
                                </div>
                            ) : (
                                <>
                                    {/* Dossiers */}
                                    {folders.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-500 mb-3">
                                                {isRTL ? 'المجلدات' : 'Dossiers'}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {folders.map((folder) => (
                                                    <motion.div
                                                        key={folder.path || folder.name}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="relative group flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                                    >
                                                        <div
                                                            className="flex items-center gap-3 flex-1"
                                                            onClick={() => navigateToFolder(folder.path || folder.name)}
                                                        >
                                                            <FolderOpen className="w-8 h-8 text-yellow-500" />
                                                            <span className="font-medium text-gray-900 dark:text-white truncate">
                                                                {folder.name}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteFolder(folder.path || folder.name);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                                                            title={isRTL ? 'حذف المجلد' : 'Supprimer le dossier'}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fichiers */}
                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {filteredResources.map((resource) => {
                                                const Icon = getResourceIcon(resource);
                                                return (
                                                    <motion.div
                                                        key={resource.publicId}
                                                        whileHover={{ scale: 1.02 }}
                                                        onClick={() => setSelectedResource(resource)}
                                                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${selectedResource?.publicId === resource.publicId
                                                            ? 'border-blue-500'
                                                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                            }`}
                                                    >
                                                        {/* Aperçu */}
                                                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                            {resource.resourceType === 'image' ? (
                                                                <img
                                                                    src={resource.url}
                                                                    alt={resource.filename}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            ) : resource.resourceType === 'video' ? (
                                                                <div className="relative w-full h-full">
                                                                    <video
                                                                        src={resource.url}
                                                                        className="w-full h-full object-cover"
                                                                        muted
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                        <Video className="w-12 h-12 text-white" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <Icon className="w-12 h-12 text-gray-400" />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="p-2 bg-white dark:bg-gray-800">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {resource.filename}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatBytes(resource.bytes)}
                                                            </p>
                                                        </div>

                                                        {/* Overlay actions */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(resource.url, '_blank');
                                                                }}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const link = document.createElement('a');
                                                                    link.href = resource.url;
                                                                    link.download = resource.filename;
                                                                    link.click();
                                                                }}
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Vue liste */
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredResources.map((resource) => {
                                                const Icon = getResourceIcon(resource);
                                                return (
                                                    <div
                                                        key={resource.publicId}
                                                        onClick={() => setSelectedResource(resource)}
                                                        className={`flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedResource?.publicId === resource.publicId
                                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                                            : ''
                                                            }`}
                                                    >
                                                        {/* Icône/Aperçu */}
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                            {resource.resourceType === 'image' ? (
                                                                <img
                                                                    src={resource.url}
                                                                    alt={resource.filename}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <Icon className="w-6 h-6 text-gray-400" />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {resource.filename}
                                                            </p>
                                                            <p className="text-sm text-gray-500 truncate">
                                                                {resource.folder || '/'}
                                                            </p>
                                                        </div>

                                                        {/* Métadonnées */}
                                                        <div className="text-right text-sm text-gray-500 hidden md:block">
                                                            <p>{formatBytes(resource.bytes)}</p>
                                                            <p>{resource.format?.toUpperCase()}</p>
                                                        </div>

                                                        {/* Date */}
                                                        <div className="text-right text-sm text-gray-500 hidden lg:block">
                                                            <p>{formatDate(resource.createdAt)}</p>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(resource.url, '_blank');
                                                                }}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const link = document.createElement('a');
                                                                    link.href = resource.url;
                                                                    link.download = resource.filename;
                                                                    link.click();
                                                                }}
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {filteredResources.length === 0 && !loading && currentPath && (
                                        <div className="text-center py-12">
                                            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">
                                                {isRTL ? 'لا توجد ملفات في هذا المجلد' : 'Aucun fichier dans ce dossier'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Message à la racine */}
                                    {!currentPath && folders.length > 0 && (
                                        <div className="text-center py-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <Cloud className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {isRTL
                                                    ? 'انقر على مجلد لعرض الملفات'
                                                    : 'Cliquez sur un dossier pour voir les fichiers'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Aucun dossier à la racine */}
                                    {!currentPath && folders.length === 0 && !loading && (
                                        <div className="text-center py-12">
                                            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">
                                                {isRTL ? 'لا توجد مجلدات' : 'Aucun dossier'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Panneau de détails */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {isRTL ? 'التفاصيل' : 'Détails'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedResource ? (
                                <div className="space-y-4">
                                    {/* Aperçu */}
                                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                        {selectedResource.resourceType === 'image' ? (
                                            <img
                                                src={selectedResource.url}
                                                alt={selectedResource.filename}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : selectedResource.resourceType === 'video' ? (
                                            <video
                                                src={selectedResource.url}
                                                controls
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <FileText className="w-16 h-16 text-gray-400" />
                                        )}
                                    </div>

                                    {/* Infos */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{isRTL ? 'الاسم' : 'Nom'}</span>
                                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                                {selectedResource.filename}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{isRTL ? 'الحجم' : 'Taille'}</span>
                                            <span className="font-medium">{formatBytes(selectedResource.bytes)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{isRTL ? 'النوع' : 'Type'}</span>
                                            <span className="font-medium">{selectedResource.format?.toUpperCase()}</span>
                                        </div>
                                        {selectedResource.width && selectedResource.height && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{isRTL ? 'الأبعاد' : 'Dimensions'}</span>
                                                <span className="font-medium">{selectedResource.width} × {selectedResource.height}</span>
                                            </div>
                                        )}
                                        {selectedResource.duration && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{isRTL ? 'المدة' : 'Durée'}</span>
                                                <span className="font-medium">{Math.round(selectedResource.duration)}s</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{isRTL ? 'المجلد' : 'Dossier'}</span>
                                            <span className="font-medium truncate max-w-[150px]">{selectedResource.folder || '/'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{isRTL ? 'التاريخ' : 'Date'}</span>
                                            <span className="font-medium">{formatDate(selectedResource.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => window.open(selectedResource.url, '_blank')}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            {isRTL ? 'عرض' : 'Voir'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = selectedResource.url;
                                                link.download = selectedResource.filename;
                                                link.click();
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            {isRTL ? 'تحميل' : 'Télécharger'}
                                        </Button>

                                        {/* Nouvelles actions de gestion */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={openMoveModal}
                                                disabled={actionLoading}
                                            >
                                                <Move className="w-4 h-4 mr-1" />
                                                {isRTL ? 'نقل' : 'Déplacer'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={openCopyModal}
                                                disabled={actionLoading}
                                            >
                                                <Copy className="w-4 h-4 mr-1" />
                                                {isRTL ? 'نسخ' : 'Copier'}
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={openRenameModal}
                                            disabled={actionLoading}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            {isRTL ? 'إعادة تسمية' : 'Renommer'}
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleDeleteResource(selectedResource.publicId)}
                                            disabled={deleteLoading}
                                        >
                                            {deleteLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-2" />
                                            )}
                                            {isRTL ? 'حذف' : 'Supprimer'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">
                                        {isRTL ? 'اختر ملفًا لعرض التفاصيل' : 'Sélectionnez un fichier pour voir les détails'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal Déplacer */}
            {showMoveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Move className="w-5 h-5 text-blue-500" />
                            {isRTL ? 'نقل الملف' : 'Déplacer le fichier'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {selectedResource?.filename}
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'المجلد الوجهة' : 'Dossier de destination'}
                            </label>
                            <select
                                value={targetFolder}
                                onChange={(e) => setTargetFolder(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {allFolders.map((folder) => (
                                    <option key={folder.path} value={folder.path}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowMoveModal(false)}>
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </Button>
                            <Button className="flex-1" onClick={handleMoveFile} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Move className="w-4 h-4 mr-2" />}
                                {isRTL ? 'نقل' : 'Déplacer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Copier */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Copy className="w-5 h-5 text-green-500" />
                            {isRTL ? 'نسخ الملف' : 'Copier le fichier'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {selectedResource?.filename}
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'المجلد الوجهة' : 'Dossier de destination'}
                            </label>
                            <select
                                value={targetFolder}
                                onChange={(e) => setTargetFolder(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {allFolders.map((folder) => (
                                    <option key={folder.path} value={folder.path}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowCopyModal(false)}>
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </Button>
                            <Button className="flex-1" onClick={handleCopyFile} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {isRTL ? 'نسخ' : 'Copier'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Renommer */}
            {showRenameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-orange-500" />
                            {isRTL ? 'إعادة تسمية الملف' : 'Renommer le fichier'}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'الاسم الجديد' : 'Nouveau nom'}
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={isRTL ? 'أدخل الاسم الجديد' : 'Entrez le nouveau nom'}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowRenameModal(false)}>
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </Button>
                            <Button className="flex-1" onClick={handleRenameFile} disabled={actionLoading || !newName.trim()}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                                {isRTL ? 'تغيير الاسم' : 'Renommer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Créer dossier */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FolderPlus className="w-5 h-5 text-yellow-500" />
                            {isRTL ? 'إنشاء مجلد جديد' : 'Créer un nouveau dossier'}
                        </h3>
                        {currentPath && (
                            <p className="text-sm text-gray-500 mb-2">
                                {isRTL ? 'داخل:' : 'Dans:'} {currentPath}
                            </p>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'اسم المجلد' : 'Nom du dossier'}
                            </label>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={isRTL ? 'أدخل اسم المجلد' : 'Entrez le nom du dossier'}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowCreateFolderModal(false)}>
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </Button>
                            <Button className="flex-1" onClick={handleCreateFolder} disabled={actionLoading || !newFolderName.trim()}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FolderPlus className="w-4 h-4 mr-2" />}
                                {isRTL ? 'إنشاء' : 'Créer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudinaryExplorerPage;
