/**
 * Service Frontend pour le Journal d'Activité
 * Crèche Mima El Ghalia
 */

import api from './api';

const activityLogService = {
    // ==================== LOGS ====================

    /**
     * Récupérer les logs avec filtres et pagination
     */
    async getLogs(params = {}) {
        try {
            const response = await api.get('/api/activity-logs', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération logs:', error);
            throw error;
        }
    },

    /**
     * Récupérer un log par ID
     */
    async getLogById(id) {
        try {
            const response = await api.get(`/api/activity-logs/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération log:', error);
            throw error;
        }
    },

    /**
     * Récupérer les statistiques
     */
    async getStats(params = {}) {
        try {
            const response = await api.get('/api/activity-logs/stats', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération stats:', error);
            throw error;
        }
    },

    /**
     * Récupérer les actions disponibles pour les filtres
     */
    async getAvailableActions() {
        try {
            const response = await api.get('/api/activity-logs/actions');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération actions:', error);
            throw error;
        }
    },

    /**
     * Récupérer les données du tableau de bord
     */
    async getDashboard() {
        try {
            const response = await api.get('/api/activity-logs/dashboard');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération dashboard:', error);
            throw error;
        }
    },

    // ==================== ARCHIVES ====================

    /**
     * Rechercher dans les archives
     */
    async searchArchive(params = {}) {
        try {
            const response = await api.get('/api/activity-logs/archive', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur recherche archives:', error);
            throw error;
        }
    },

    /**
     * Déclencher l'archivage manuel
     */
    async triggerArchive() {
        try {
            const response = await api.post('/api/activity-logs/archive');
            return response.data;
        } catch (error) {
            console.error('Erreur archivage:', error);
            throw error;
        }
    },

    /**
     * Nettoyer les anciennes archives
     */
    async cleanup() {
        try {
            const response = await api.delete('/api/activity-logs/cleanup');
            return response.data;
        } catch (error) {
            console.error('Erreur nettoyage:', error);
            throw error;
        }
    },

    // ==================== ALERTES ====================

    /**
     * Récupérer toutes les alertes
     */
    async getAlerts(params = {}) {
        try {
            const response = await api.get('/api/activity-logs/alerts', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération alertes:', error);
            throw error;
        }
    },

    /**
     * Récupérer les alertes actives
     */
    async getActiveAlerts() {
        try {
            const response = await api.get('/api/activity-logs/alerts/active');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération alertes actives:', error);
            throw error;
        }
    },

    /**
     * Récupérer les statistiques des alertes
     */
    async getAlertStats() {
        try {
            const response = await api.get('/api/activity-logs/alerts/stats');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération stats alertes:', error);
            throw error;
        }
    },

    /**
     * Récupérer une alerte par ID
     */
    async getAlertById(id) {
        try {
            const response = await api.get(`/api/activity-logs/alerts/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération alerte:', error);
            throw error;
        }
    },

    /**
     * Marquer une alerte comme vue
     */
    async acknowledgeAlert(id) {
        try {
            const response = await api.put(`/api/activity-logs/alerts/${id}/acknowledge`);
            return response.data;
        } catch (error) {
            console.error('Erreur acknowledgement alerte:', error);
            throw error;
        }
    },

    /**
     * Résoudre une alerte
     */
    async resolveAlert(id, resolution = null) {
        try {
            const response = await api.put(`/api/activity-logs/alerts/${id}/resolve`, { resolution });
            return response.data;
        } catch (error) {
            console.error('Erreur résolution alerte:', error);
            throw error;
        }
    },

    /**
     * Ignorer une alerte
     */
    async dismissAlert(id, reason = null) {
        try {
            const response = await api.put(`/api/activity-logs/alerts/${id}/dismiss`, { reason });
            return response.data;
        } catch (error) {
            console.error('Erreur dismiss alerte:', error);
            throw error;
        }
    },

    // ==================== RAPPORTS ====================

    /**
     * Générer un rapport quotidien
     */
    async getDailyReport(date = null) {
        try {
            const params = date ? { date } : {};
            const response = await api.get('/api/activity-logs/reports/daily', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur rapport quotidien:', error);
            throw error;
        }
    },

    /**
     * Générer un rapport hebdomadaire
     */
    async getWeeklyReport(startDate = null) {
        try {
            const params = startDate ? { startDate } : {};
            const response = await api.get('/api/activity-logs/reports/weekly', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur rapport hebdomadaire:', error);
            throw error;
        }
    },

    /**
     * Générer un rapport mensuel
     */
    async getMonthlyReport(year = null, month = null) {
        try {
            const params = {};
            if (year) params.year = year;
            if (month !== null) params.month = month;
            const response = await api.get('/api/activity-logs/reports/monthly', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur rapport mensuel:', error);
            throw error;
        }
    },

    /**
     * Historique des rapports
     */
    async getReportHistory(params = {}) {
        try {
            const response = await api.get('/api/activity-logs/reports/history', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur historique rapports:', error);
            throw error;
        }
    },

    /**
     * Récupérer un rapport par ID
     */
    async getReportById(id) {
        try {
            const response = await api.get(`/api/activity-logs/reports/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération rapport:', error);
            throw error;
        }
    },

    /**
     * Exporter un rapport
     */
    async exportReport(type, format, params = {}) {
        try {
            const response = await api.get(`/api/activity-logs/reports/${type}/export/${format}`, {
                params,
                responseType: 'blob'
            });

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const extensions = { excel: 'xlsx', pdf: 'pdf', json: 'json' };
            link.setAttribute('download', `rapport_${type}_${new Date().toISOString().split('T')[0]}.${extensions[format]}`);

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Erreur export rapport:', error);
            throw error;
        }
    }
};

export default activityLogService;
