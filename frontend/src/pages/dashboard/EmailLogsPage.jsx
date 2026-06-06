import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Mail,
    CheckCircle,
    XCircle,
    RefreshCw,
    Filter,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';

export default function EmailLogsPage() {
    const { isRTL } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/logs/email?limit=100&status=${filter}`);
            if (response.data.success) {
                setLogs(response.data.logs);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const stats = {
        total: logs.length,
        sent: logs.filter(l => l.status === 'sent').length,
        failed: logs.filter(l => l.status === 'failed').length
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500">{error}</p>
                    <Button onClick={fetchLogs} className="mt-4">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Mail className="w-8 h-8 text-primary-600" />
                        {isRTL ? 'سجلات البريد' : 'Journal des Emails'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isRTL
                            ? 'متابعة جميع رسائل البريد الإلكتروني المرسلة'
                            : 'Suivi de tous les emails envoyés aux parents'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <Mail className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Envoyés</p>
                                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div>
                                <p className="text-sm text-gray-500">Échoués</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres */}
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Tous
                    </Button>
                    <Button
                        variant={filter === 'sent' ? 'default' : 'outline'}
                        onClick={() => setFilter('sent')}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Envoyés
                    </Button>
                    <Button
                        variant={filter === 'failed' ? 'default' : 'outline'}
                        onClick={() => setFilter('failed')}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Échoués
                    </Button>
                    <Button variant="outline" onClick={fetchLogs}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emails ({logs.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Statut</th>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-left">Destinataire</th>
                                        <th className="px-4 py-3 text-left">Sujet</th>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">Erreur</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-4 py-3">
                                                {log.status === 'sent' ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                        OK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-600">
                                                        <XCircle className="w-4 h-4" />
                                                        Échec
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
                                                    {log.email_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{log.recipient_email}</td>
                                            <td className="px-4 py-3 max-w-xs truncate">{log.subject}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-red-500 text-xs max-w-xs truncate">
                                                {log.error_message || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {logs.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Aucun email trouvé</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
