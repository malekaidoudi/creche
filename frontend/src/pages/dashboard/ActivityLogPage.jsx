/**
 * Page Journal d'Activité - Direction
 * Crèche Mima El Ghalia
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Bell,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    LogIn,
    RefreshCw,
    Search,
    Shield,
    TrendingUp,
    User,
    Users,
    XCircle,
    ChevronDown,
    ChevronRight,
    BarChart3,
    FileSpreadsheet,
    AlertCircle,
    Check,
    X
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import activityLogService from '../../services/activityLogService';

// Icônes par catégorie
const CATEGORY_ICONS = {
    auth: LogIn,
    enrollment: FileText,
    attendance: Calendar,
    document: FileText,
    account: User,
    system: Activity,
    security: Shield,
    contact: Users,
    child: Users,
    payment: TrendingUp,
    other: Activity
};

// Couleurs par sévérité
const SEVERITY_COLORS = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300',
    info: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300',
    debug: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300'
};

// Labels français
const CATEGORY_LABELS = {
    auth: 'Authentification',
    enrollment: 'Inscriptions',
    attendance: 'Présences',
    document: 'Documents',
    account: 'Comptes',
    system: 'Système',
    security: 'Sécurité',
    contact: 'Contacts',
    child: 'Enfants',
    payment: 'Paiements',
    other: 'Autres'
};

const SEVERITY_LABELS = {
    critical: '🔴 Urgent',
    warning: '🟡 Important',
    info: '🟢 Normal',
    debug: 'ℹ️ Info'
};

const ActivityLogPage = () => {
    const { isRTL } = useLanguage();

    // États
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
    const [filters, setFilters] = useState({
        category: '',
        severity: '',
        search: '',
        period: 'today'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [reportType, setReportType] = useState('daily');
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // Chargement initial
    useEffect(() => {
        loadDashboard();
    }, []);

    // Chargement selon l'onglet actif
    useEffect(() => {
        if (activeTab === 'logs') {
            loadLogs();
        } else if (activeTab === 'alerts') {
            loadAlerts();
        } else if (activeTab === 'reports') {
            loadReport();
        }
    }, [activeTab, filters, pagination.page]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await activityLogService.getDashboard();
            if (response.success) {
                setDashboard(response.dashboard);
            }
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            };

            // Convertir la période en dates
            if (filters.period === 'today') {
                params.startDate = new Date().toISOString().split('T')[0];
            } else if (filters.period === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                params.startDate = weekAgo.toISOString().split('T')[0];
            } else if (filters.period === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                params.startDate = monthAgo.toISOString().split('T')[0];
            }

            const response = await activityLogService.getLogs(params);
            if (response.success) {
                setLogs(response.logs);
                setPagination(prev => ({ ...prev, ...response.pagination }));
            }
        } catch (error) {
            console.error('Erreur chargement logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const response = await activityLogService.getAlerts({ status: 'active' });
            if (response.success) {
                setAlerts(response.alerts);
            }
        } catch (error) {
            console.error('Erreur chargement alertes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadReport = async () => {
        try {
            setReportLoading(true);
            let response;
            switch (reportType) {
                case 'daily':
                    response = await activityLogService.getDailyReport();
                    break;
                case 'weekly':
                    response = await activityLogService.getWeeklyReport();
                    break;
                case 'monthly':
                    response = await activityLogService.getMonthlyReport();
                    break;
            }
            if (response?.success) {
                setReport(response.report);
            }
        } catch (error) {
            console.error('Erreur chargement rapport:', error);
        } finally {
            setReportLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            await activityLogService.exportReport(reportType, format);
        } catch (error) {
            console.error('Erreur export:', error);
        }
    };

    const handleAcknowledgeAlert = async (alertId) => {
        try {
            await activityLogService.acknowledgeAlert(alertId);
            loadAlerts();
        } catch (error) {
            console.error('Erreur acknowledgement:', error);
        }
    };

    const handleResolveAlert = async (alertId) => {
        try {
            await activityLogService.resolveAlert(alertId);
            loadAlerts();
        } catch (error) {
            console.error('Erreur résolution:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Rendu du tableau de bord
    const renderDashboard = () => {
        if (!dashboard) return null;

        const stats = dashboard.stats || {};

        return (
            <div className="space-y-4 sm:space-y-6">
                {/* Cartes statistiques - 2 colonnes sur mobile, 4 sur desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs sm:text-sm">Connexions</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{stats.logins_success || 0}</p>
                                </div>
                                <LogIn className="w-8 h-8 sm:w-10 sm:h-10 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-xs sm:text-sm">Inscriptions</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{stats.new_enrollments || 0}</p>
                                </div>
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-xs sm:text-sm">Avertissements</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{stats.warning_events || 0}</p>
                                </div>
                                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-xs sm:text-sm">Critiques</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{stats.critical_events || 0}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alertes actives */}
                {dashboard.activeAlerts?.length > 0 && (
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <Bell className="w-5 h-5" />
                                Alertes Actives ({dashboard.activeAlerts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dashboard.activeAlerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-3 rounded-lg border ${SEVERITY_COLORS[alert.severity]}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span>{alert.severity_icon}</span>
                                                <span className="font-medium">{alert.title}</span>
                                            </div>
                                            <span className="text-xs opacity-75">
                                                {formatDate(alert.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Activités récentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Activités Récentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dashboard.recentActivities?.slice(0, 10).map((log) => {
                                const Icon = CATEGORY_ICONS[log.category] || Activity;
                                return (
                                    <div
                                        key={log.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className={`p-2 rounded-lg ${SEVERITY_COLORS[log.severity]}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{log.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {log.user_name || 'Système'} • {formatDate(log.created_at)}
                                            </p>
                                        </div>
                                        <span className="text-lg">{log.severity_icon}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Statistiques par catégorie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Par Catégorie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dashboard.byCategory?.map((cat) => {
                                    const Icon = CATEGORY_ICONS[cat.category] || Activity;
                                    const percentage = dashboard.stats?.total_activities
                                        ? Math.round((cat.count / dashboard.stats.total_activities) * 100)
                                        : 0;
                                    return (
                                        <div key={cat.category} className="flex items-center gap-3">
                                            <Icon className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm flex-1">
                                                {CATEGORY_LABELS[cat.category] || cat.category}
                                            </span>
                                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-12 text-right">{cat.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Activité par Heure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-1 h-32">
                                {Array.from({ length: 24 }, (_, i) => {
                                    const hourData = dashboard.byHour?.find(h => parseInt(h.hour) === i);
                                    const count = hourData?.count || 0;
                                    const maxCount = Math.max(...(dashboard.byHour?.map(h => h.count) || [1]));
                                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                            title={`${i}h: ${count} activités`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0h</span>
                                <span>6h</span>
                                <span>12h</span>
                                <span>18h</span>
                                <span>23h</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    // Rendu de la liste des logs
    const renderLogs = () => (
        <div className="space-y-3 sm:space-y-4">
            {/* Filtres - Responsive */}
            <Card>
                <CardContent className="p-3 sm:p-4">
                    {/* Recherche - Toujours en haut sur mobile */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>

                    {/* Filtres en grille responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {/* Période */}
                        <select
                            value={filters.period}
                            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                            className="px-2 sm:px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="all">Tout</option>
                        </select>

                        {/* Catégorie */}
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="px-2 sm:px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="">Catégorie</option>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        {/* Sévérité */}
                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                            className="px-2 sm:px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="">Niveau</option>
                            {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadLogs}
                            className="flex items-center justify-center gap-1 text-sm"
                        >
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Actualiser</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des logs */}
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y dark:divide-gray-700">
                        {logs.map((log) => {
                            const Icon = CATEGORY_ICONS[log.category] || Activity;
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <div className="flex items-start gap-2 sm:gap-4">
                                        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${SEVERITY_COLORS[log.severity]}`}>
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start sm:items-center gap-1 sm:gap-2 flex-wrap">
                                                <span className="text-base sm:text-lg">{log.severity_icon}</span>
                                                <h4 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{log.title}</h4>
                                                <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 hidden sm:inline">
                                                    {CATEGORY_LABELS[log.category] || log.category}
                                                </span>
                                            </div>
                                            {log.description && (
                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {log.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    <span className="truncate max-w-[80px] sm:max-w-none">{log.user_name || 'Système'}</span>
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4 border-t dark:border-gray-700">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                Précédent
                            </Button>
                            <span className="text-sm">
                                Page {pagination.page} sur {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                Suivant
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // Rendu des alertes
    const renderAlerts = () => (
        <div className="space-y-3 sm:space-y-4">
            <Card>
                <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        Alertes Actives ({alerts.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    {alerts.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-gray-500">
                            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-green-500" />
                            <p className="text-sm sm:text-base">Aucune alerte active</p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {alerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 sm:p-4 rounded-lg border-2 ${SEVERITY_COLORS[alert.severity]}`}
                                >
                                    {/* Layout en colonne sur mobile, en ligne sur desktop */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg sm:text-xl">{alert.severity_icon}</span>
                                                <h4 className="font-bold text-sm sm:text-base truncate">{alert.title}</h4>
                                            </div>
                                            <p className="mt-1.5 sm:mt-2 text-sm line-clamp-3">{alert.message}</p>
                                            <p className="text-xs mt-1.5 sm:mt-2 opacity-75">
                                                {formatDate(alert.created_at)}
                                            </p>
                                        </div>
                                        {/* Boutons en ligne, pleine largeur sur mobile */}
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs sm:text-sm"
                                            >
                                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                                Vu
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleResolveAlert(alert.id)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                                            >
                                                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                                Résoudre
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // Rendu des rapports
    const renderReports = () => (
        <div className="space-y-4">
            {/* Sélection du type de rapport */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-2">
                            {['daily', 'weekly', 'monthly'].map((type) => (
                                <Button
                                    key={type}
                                    variant={reportType === type ? 'default' : 'outline'}
                                    onClick={() => {
                                        setReportType(type);
                                        setReport(null);
                                    }}
                                >
                                    {type === 'daily' && 'Quotidien'}
                                    {type === 'weekly' && 'Hebdomadaire'}
                                    {type === 'monthly' && 'Mensuel'}
                                </Button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        <Button
                            variant="outline"
                            onClick={() => loadReport()}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Générer
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleExport('pdf')}
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                PDF
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleExport('excel')}
                                className="flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contenu du rapport */}
            {reportLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : report ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{report.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Résumé */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-600 dark:text-blue-400">Total activités</p>
                                <p className="text-2xl font-bold">{report.statistics?.summary?.total_activities || 0}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-green-600 dark:text-green-400">Connexions</p>
                                <p className="text-2xl font-bold">{report.statistics?.summary?.logins_success || 0}</p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-sm text-purple-600 dark:text-purple-400">Inscriptions</p>
                                <p className="text-2xl font-bold">{report.statistics?.summary?.new_enrollments || 0}</p>
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm text-yellow-600 dark:text-yellow-400">Avertissements</p>
                                <p className="text-2xl font-bold">{report.statistics?.summary?.warnings || 0}</p>
                            </div>
                        </div>

                        {/* Tendances (pour rapports hebdo/mensuel) */}
                        {report.statistics?.comparison?.trends && (
                            <div className="mb-6">
                                <h4 className="font-medium mb-3">Tendances vs période précédente</h4>
                                <div className="flex gap-4">
                                    {Object.entries(report.statistics.comparison.trends).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className="text-sm capitalize">{key}:</span>
                                            <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {value >= 0 ? '+' : ''}{value}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Événements importants */}
                        {report.importantEvents?.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">Événements Importants</h4>
                                <div className="space-y-2">
                                    {report.importantEvents.map((event, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg ${SEVERITY_COLORS[event.severity]}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{event.severity === 'critical' ? '🔴' : '🟡'}</span>
                                                <span className="font-medium">{event.title}</span>
                                                <span className="text-xs opacity-75">
                                                    {formatDate(event.created_at)}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm mt-1 opacity-90">{event.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p>Cliquez sur "Générer" pour créer un rapport</p>
                </div>
            )}
        </div>
    );

    // Modal détail log
    const renderLogDetail = () => (
        <AnimatePresence>
            {selectedLog && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedLog(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="text-2xl">{selectedLog.severity_icon}</span>
                                    {selectedLog.title}
                                </h3>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Catégorie</p>
                                        <p className="font-medium">{CATEGORY_LABELS[selectedLog.category]}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Sévérité</p>
                                        <p className="font-medium">{SEVERITY_LABELS[selectedLog.severity]}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Utilisateur</p>
                                        <p className="font-medium">{selectedLog.user_name || 'Système'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date</p>
                                        <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                    </div>
                                </div>

                                {selectedLog.description && (
                                    <div>
                                        <p className="text-sm text-gray-500">Description</p>
                                        <p className="mt-1">{selectedLog.description}</p>
                                    </div>
                                )}

                                {selectedLog.ip_address && (
                                    <div>
                                        <p className="text-sm text-gray-500">Adresse IP</p>
                                        <p className="font-mono">{selectedLog.ip_address}</p>
                                    </div>
                                )}

                                {selectedLog.request_path && (
                                    <div>
                                        <p className="text-sm text-gray-500">Requête</p>
                                        <p className="font-mono text-sm">
                                            {selectedLog.request_method} {selectedLog.request_path}
                                        </p>
                                    </div>
                                )}

                                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500">Métadonnées</p>
                                        <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs overflow-auto">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (loading && !dashboard) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            {/* En-tête - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                        Journal d'Activité
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base mt-1 hidden sm:block">
                        Suivez toutes les activités de la crèche en temps réel
                    </p>
                </div>
                <Button
                    onClick={loadDashboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 self-start sm:self-auto"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Actualiser</span>
                </Button>
            </div>

            {/* Onglets - Responsive avec scroll horizontal sur mobile */}
            <div className="flex gap-1 sm:gap-2 border-b dark:border-gray-700 overflow-x-auto pb-px -mx-3 px-3 sm:mx-0 sm:px-0">
                {[
                    { id: 'dashboard', label: 'Dashboard', mobileLabel: '📊', icon: BarChart3 },
                    { id: 'logs', label: 'Activités', mobileLabel: '📋', icon: Activity },
                    { id: 'alerts', label: 'Alertes', mobileLabel: '🔔', icon: Bell },
                    { id: 'reports', label: 'Rapports', mobileLabel: '📄', icon: FileText }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 hidden sm:block" />
                        <span className="sm:hidden">{tab.mobileLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden text-xs">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Contenu */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'logs' && renderLogs()}
                    {activeTab === 'alerts' && renderAlerts()}
                    {activeTab === 'reports' && renderReports()}
                </motion.div>
            </AnimatePresence>

            {/* Modal détail */}
            {renderLogDetail()}
        </div>
    );
};

export default ActivityLogPage;
