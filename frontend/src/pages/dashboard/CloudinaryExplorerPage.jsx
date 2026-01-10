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
    Clock
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

    if (!user || user.role !== 'admin') {
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
                                                        onClick={() => navigateToFolder(folder.path || folder.name)}
                                                        className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                                    >
                                                        <FolderOpen className="w-8 h-8 text-yellow-500" />
                                                        <span className="font-medium text-gray-900 dark:text-white truncate">
                                                            {folder.name}
                                                        </span>
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
        </div>
    );
};

export default CloudinaryExplorerPage;
