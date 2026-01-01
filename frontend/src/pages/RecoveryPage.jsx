import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Key,
    Database,
    RotateCcw,
    Download,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    FileJson,
    Calendar,
    HardDrive,
    Server,
    Wifi,
    WifiOff,
    RefreshCw
} from 'lucide-react';

// Utiliser l'URL de base sans /api car on l'ajoute dans les appels
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3003/api').replace(/\/api$/, '');

const RecoveryPage = () => {
    const [recoveryKey, setRecoveryKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [backups, setBackups] = useState([]);
    const [status, setStatus] = useState(null);
    const [restoring, setRestoring] = useState(null);
    const [restoreResult, setRestoreResult] = useState(null);

    // Vérifier si la clé est dans l'URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const keyFromUrl = params.get('key');
        if (keyFromUrl) {
            setRecoveryKey(keyFromUrl);
            verifyKey(keyFromUrl);
        }
    }, []);

    const verifyKey = async (key) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/api/recovery/verify?key=${key}`);
            const data = await response.json();

            if (response.ok && data.success) {
                setIsAuthenticated(true);
                fetchBackups(key);
                fetchStatus(key);
            } else {
                setError(data.error || 'Clé invalide');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const fetchBackups = async (key) => {
        try {
            const response = await fetch(`${API_BASE}/api/recovery/backups?key=${key}`);
            const data = await response.json();

            if (data.success) {
                setBackups(data.backups);
            }
        } catch (err) {
            console.error('Erreur chargement backups:', err);
        }
    };

    const fetchStatus = async (key) => {
        try {
            const response = await fetch(`${API_BASE}/api/recovery/status?key=${key}`);
            const data = await response.json();

            if (data.success) {
                setStatus(data);
            }
        } catch (err) {
            console.error('Erreur chargement status:', err);
        }
    };

    const restoreBackup = async (filename) => {
        if (!confirm(`⚠️ ATTENTION: Cette action va remplacer TOUTES les données actuelles par celles du backup "${filename}".\n\nÊtes-vous absolument sûr de vouloir continuer ?`)) {
            return;
        }

        setRestoring(filename);
        setRestoreResult(null);

        try {
            const response = await fetch(`${API_BASE}/api/recovery/restore/${filename}?key=${recoveryKey}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                setRestoreResult({
                    success: true,
                    message: `Restauration réussie: ${data.restored.rows} lignes restaurées dans ${data.restored.tables} tables`
                });
            } else {
                setRestoreResult({
                    success: false,
                    message: data.error || 'Erreur lors de la restauration'
                });
            }
        } catch (err) {
            setRestoreResult({
                success: false,
                message: 'Erreur de connexion au serveur'
            });
        } finally {
            setRestoring(null);
            fetchStatus(recoveryKey);
        }
    };

    const downloadBackup = async (filename) => {
        try {
            const response = await fetch(`${API_BASE}/api/recovery/download/${filename}?key=${recoveryKey}`);
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Erreur lors du téléchargement');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatSize = (kb) => {
        if (!kb) return '-';
        const size = parseFloat(kb);
        if (size > 1024) return `${(size / 1024).toFixed(2)} MB`;
        return `${size} KB`;
    };

    // Page de connexion avec clé
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-orange-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Récupération d'Urgence</h1>
                            <p className="text-gray-400 mt-2">Crèche Mima Elghalia</p>
                        </div>

                        {/* Formulaire */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Key className="w-4 h-4 inline mr-2" />
                                    Clé de récupération
                                </label>
                                <input
                                    type="password"
                                    value={recoveryKey}
                                    onChange={(e) => setRecoveryKey(e.target.value)}
                                    placeholder="Entrez votre clé secrète..."
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && verifyKey(recoveryKey)}
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                onClick={() => verifyKey(recoveryKey)}
                                disabled={loading || !recoveryKey}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Vérification...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Accéder à la récupération
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info */}
                        <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
                            <p className="text-xs text-gray-400 text-center">
                                Cette page permet de restaurer le système en cas de problème.
                                <br />
                                La clé de récupération se trouve dans le fichier <code className="text-orange-400">.env</code>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Page de récupération
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Mode Récupération</h1>
                    <p className="text-gray-400">Crèche Mima Elghalia - Restauration d'urgence</p>
                </motion.div>

                {/* Status de la DB */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className={`p-4 rounded-xl border ${status?.database?.status === 'connected'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-3">
                            {status?.database?.status === 'connected' ? (
                                <>
                                    <Wifi className="w-6 h-6 text-green-500" />
                                    <div>
                                        <p className="font-medium text-green-400">Base de données connectée</p>
                                        <p className="text-sm text-green-500/70">La restauration est possible</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-6 h-6 text-red-500" />
                                    <div>
                                        <p className="font-medium text-red-400">Base de données déconnectée</p>
                                        <p className="text-sm text-red-500/70">{status?.database?.error || 'Vérifiez la connexion'}</p>
                                    </div>
                                </>
                            )}
                            <button
                                onClick={() => fetchStatus(recoveryKey)}
                                className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Résultat de restauration */}
                <AnimatePresence>
                    {restoreResult && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-6 p-4 rounded-xl border ${restoreResult.success
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {restoreResult.success ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                )}
                                <p className={restoreResult.success ? 'text-green-400' : 'text-red-400'}>
                                    {restoreResult.message}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Liste des backups */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
                >
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-orange-500" />
                            <h2 className="font-semibold text-white">Backups disponibles</h2>
                            <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                                {backups.length}
                            </span>
                        </div>
                        <button
                            onClick={() => fetchBackups(recoveryKey)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {backups.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileJson className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Aucun backup disponible</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700">
                            {backups.map((backup, index) => (
                                <motion.div
                                    key={backup.filename}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-gray-700 rounded-lg">
                                                <FileJson className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{backup.filename}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(backup.backup_date || backup.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <HardDrive className="w-3 h-3" />
                                                        {formatSize(backup.size_kb)}
                                                    </span>
                                                    {backup.tables && (
                                                        <span>{backup.tables} tables</span>
                                                    )}
                                                    {backup.rows && (
                                                        <span>{backup.rows} lignes</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => downloadBackup(backup.filename)}
                                                className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
                                                title="Télécharger"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => restoreBackup(backup.filename)}
                                                disabled={restoring === backup.filename || status?.database?.status !== 'connected'}
                                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                                                title="Restaurer ce backup"
                                            >
                                                {restoring === backup.filename ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Restauration...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw className="w-4 h-4" />
                                                        Restaurer
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Instructions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                >
                    <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Instructions importantes
                    </h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• La restauration remplace <strong className="text-white">toutes</strong> les données actuelles</li>
                        <li>• Assurez-vous que la base de données est accessible avant de restaurer</li>
                        <li>• Téléchargez le backup actuel avant de restaurer une ancienne version</li>
                        <li>• Après restauration, reconnectez-vous à l'application normalement</li>
                    </ul>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Crèche Mima Elghalia - Système de récupération d'urgence</p>
                    <p className="mt-1">
                        <a href="/" className="text-orange-500 hover:underline">Retour à l'accueil</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RecoveryPage;
