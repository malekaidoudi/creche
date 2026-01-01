import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    Download,
    Trash2,
    RotateCcw,
    HardDrive,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FileJson,
    Calendar,
    Shield,
    History
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const BackupManager = () => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const [backups, setBackups] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [restoring, setRestoring] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);

    useEffect(() => {
        fetchBackups();
        fetchStatus();
    }, []);

    const fetchBackups = async () => {
        try {
            const response = await api.get('/api/backup');
            if (response.data.success) {
                setBackups(response.data.backups);
            }
        } catch (error) {
            console.error('Erreur chargement backups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await api.get('/api/backup/status');
            if (response.data.success) {
                setStatus(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement status:', error);
        }
    };

    const createBackup = async () => {
        try {
            setCreating(true);
            const response = await api.post('/api/backup');

            if (response.data.success) {
                toast.success(isRTL ? 'تم إنشاء النسخة الاحتياطية' : 'Backup créé avec succès');
                await fetchBackups();
                await fetchStatus();
            }
        } catch (error) {
            console.error('Erreur création backup:', error);
            toast.error(isRTL ? 'خطأ في إنشاء النسخة الاحتياطية' : 'Erreur lors de la création du backup');
        } finally {
            setCreating(false);
        }
    };

    const downloadBackup = async (filename) => {
        try {
            const response = await api.get('/api/backup/download/' + filename, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(isRTL ? 'جاري التحميل...' : 'Téléchargement en cours...');
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            toast.error(isRTL ? 'خطأ في التحميل' : 'Erreur de téléchargement');
        }
    };

    const restoreBackup = async (filename) => {
        try {
            setRestoring(filename);
            setShowRestoreConfirm(null);

            const response = await api.post('/api/backup/restore/' + filename);

            if (response.data.success) {
                toast.success(
                    isRTL
                        ? `تمت الاستعادة: ${response.data.restored.rows} سجل`
                        : `Restauration réussie: ${response.data.restored.rows} lignes restaurées`
                );
                // Recharger la page pour refléter les changements
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            console.error('Erreur restauration:', error);
            toast.error(isRTL ? 'خطأ في الاستعادة' : 'Erreur lors de la restauration');
        } finally {
            setRestoring(null);
        }
    };

    const deleteBackup = async (filename) => {
        const confirmMsg = isRTL
            ? 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟'
            : 'Êtes-vous sûr de vouloir supprimer ce backup ?';

        if (!confirm(confirmMsg)) return;

        try {
            setDeleting(filename);
            const response = await api.delete('/api/backup/' + filename);

            if (response.data.success) {
                toast.success(isRTL ? 'تم حذف النسخة الاحتياطية' : 'Backup supprimé');
                await fetchBackups();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error(isRTL ? 'خطأ في الحذف' : 'Erreur de suppression');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatSize = (sizeKB) => {
        const size = parseFloat(sizeKB);
        if (size >= 1024) {
            return (size / 1024).toFixed(2) + ' MB';
        }
        return size.toFixed(2) + ' KB';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-50 to-cyan-50'} border ${isDark ? 'border-gray-700' : 'border-blue-200'}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {isRTL ? 'نظام النسخ الاحتياطي' : 'Système de Backup'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {isRTL ? 'نسخة احتياطية تلقائية كل يوم الساعة 02:00' : 'Backup automatique quotidien à 02:00'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={createBackup}
                        disabled={creating}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${creating
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                            }`}
                    >
                        {creating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Database className="w-4 h-4" />
                        )}
                        {isRTL ? 'إنشاء نسخة احتياطية الآن' : 'Créer un backup maintenant'}
                    </button>
                </div>

                {/* Stats */}
                {status && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                {status.total_backups}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isRTL ? 'نسخ احتياطية' : 'Backups'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                {status.last_backup?.tables || 0}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isRTL ? 'جداول' : 'Tables'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {status.last_backup?.rows || 0}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isRTL ? 'سجلات' : 'Lignes'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                {status.max_backups}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isRTL ? 'الحد الأقصى' : 'Max conservés'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Last Backup Info */}
            {status?.last_backup && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border ${isDark ? 'border-green-800' : 'border-green-200'}`}>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <div>
                            <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                                {isRTL ? 'آخر نسخة احتياطية' : 'Dernier backup'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                {formatDate(status.last_backup.created_at)} - {formatSize(status.last_backup.size_kb)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Backups List */}
            <div className="space-y-3">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRTL ? 'النسخ الاحتياطية المتاحة' : 'Backups disponibles'}
                </h4>

                {backups.length === 0 ? (
                    <div className={`p-8 text-center rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <Database className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {isRTL ? 'لا توجد نسخ احتياطية بعد' : 'Aucun backup disponible'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {backups.map((backup, index) => (
                                <motion.div
                                    key={backup.filename}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <FileJson className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {backup.filename}
                                            </p>
                                            <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(backup.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <HardDrive className="w-3 h-3" />
                                                    {formatSize(backup.size_kb)}
                                                </span>
                                                <span>{backup.tables} tables</span>
                                                <span>{backup.rows} lignes</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Bouton Restaurer */}
                                        {showRestoreConfirm === backup.filename ? (
                                            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg px-2 py-1">
                                                <span className="text-xs text-orange-700 dark:text-orange-300">
                                                    {isRTL ? 'تأكيد؟' : 'Confirmer?'}
                                                </span>
                                                <button
                                                    onClick={() => restoreBackup(backup.filename)}
                                                    disabled={restoring === backup.filename}
                                                    className="p-1 rounded bg-orange-500 hover:bg-orange-600 text-white"
                                                >
                                                    {restoring === backup.filename ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setShowRestoreConfirm(null)}
                                                    className="p-1 rounded bg-gray-400 hover:bg-gray-500 text-white"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowRestoreConfirm(backup.filename)}
                                                disabled={restoring === backup.filename}
                                                className={`p-2 rounded-lg transition-colors ${isDark
                                                    ? 'hover:bg-orange-900/30 text-gray-400 hover:text-orange-400'
                                                    : 'hover:bg-orange-50 text-gray-500 hover:text-orange-600'
                                                    }`}
                                                title={isRTL ? 'استعادة النظام' : 'Restaurer le système'}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => downloadBackup(backup.filename)}
                                            className={`p-2 rounded-lg transition-colors ${isDark
                                                ? 'hover:bg-gray-700 text-gray-400 hover:text-cyan-400'
                                                : 'hover:bg-gray-100 text-gray-500 hover:text-cyan-600'
                                                }`}
                                            title={isRTL ? 'تحميل' : 'Télécharger'}
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteBackup(backup.filename)}
                                            disabled={deleting === backup.filename}
                                            className={`p-2 rounded-lg transition-colors ${isDark
                                                ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400'
                                                : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                                                }`}
                                            title={isRTL ? 'حذف' : 'Supprimer'}
                                        >
                                            {deleting === backup.filename ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Restore Info Box */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'} border ${isDark ? 'border-orange-800' : 'border-orange-200'}`}>
                <div className="flex items-start gap-3">
                    <History className={`w-5 h-5 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-orange-900'}`}>
                            {isRTL ? 'كيفية استعادة النظام' : 'Comment restaurer le système'}
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-orange-700'}`}>
                            {isRTL
                                ? 'إذا حدث خطأ ما، انقر على زر الاستعادة (↺) بجانب النسخة الاحتياطية التي تريد العودة إليها. سيتم استبدال جميع البيانات الحالية بالبيانات المحفوظة.'
                                : 'En cas de problème, cliquez sur le bouton restaurer (↺) à côté du backup souhaité. Toutes les données actuelles seront remplacées par celles du backup.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-amber-50'} border ${isDark ? 'border-gray-700' : 'border-amber-200'}`}>
                <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-amber-900'}`}>
                            {isRTL ? 'نصيحة' : 'Conseil'}
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-amber-700'}`}>
                            {isRTL
                                ? 'قم بتحميل النسخ الاحتياطية بانتظام وحفظها في مكان آمن (Google Drive، Dropbox، إلخ) لحماية بياناتك.'
                                : 'Téléchargez régulièrement vos backups et stockez-les dans un endroit sûr (Google Drive, Dropbox, etc.) pour protéger vos données.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupManager;
