/**
 * Service pour le workflow de création d'utilisateurs (Parent/Staff)
 * 
 * Endpoints:
 * - POST /api/user-workflow/create-parent - Créer un parent (admin)
 * - POST /api/user-workflow/create-staff - Créer un personnel (admin)
 * - POST /api/user-workflow/set-password - Définir le mot de passe
 * - POST /api/user-workflow/register-parent - Inscription parent (self-service)
 * - GET /api/children/orphans - Liste des enfants orphelins
 */

import api from './api';

const userWorkflowService = {
    /**
     * Créer un compte parent (par l'admin)
     * @param {Object} parentData - Données du parent
     * @param {string} parentData.first_name - Prénom
     * @param {string} parentData.last_name - Nom
     * @param {string} parentData.email - Email
     * @param {string} parentData.phone - Téléphone
     * @param {string} parentData.gender - Sexe (male/female)
     * @param {number} parentData.child_id - ID de l'enfant à associer
     * @param {string} [parentData.emergency_contact_name] - Nom contact urgence
     * @param {string} [parentData.emergency_contact_phone] - Téléphone contact urgence
     */
    async createParent(parentData) {
        try {
            const response = await api.post('/api/user-workflow/create-parent', parentData);
            return response.data;
        } catch (error) {
            console.error('Erreur création parent:', error);
            throw error.response?.data || { error: 'Erreur lors de la création du parent' };
        }
    },

    /**
     * Créer un compte personnel (par l'admin)
     * @param {Object} staffData - Données du personnel
     * @param {string} staffData.first_name - Prénom
     * @param {string} staffData.last_name - Nom
     * @param {string} staffData.email - Email
     * @param {string} staffData.phone - Téléphone
     * @param {string} staffData.gender - Sexe (male/female)
     * @param {string} staffData.staff_position - Poste (director, educator, health, cleaning, security, kitchen, other)
     */
    async createStaff(staffData) {
        try {
            const response = await api.post('/api/user-workflow/create-staff', staffData);
            return response.data;
        } catch (error) {
            console.error('Erreur création personnel:', error);
            throw error.response?.data || { error: 'Erreur lors de la création du personnel' };
        }
    },

    /**
     * Définir le mot de passe (via le lien reçu par email)
     * @param {Object} data - Données
     * @param {string} data.token - Token reçu par email
     * @param {string} data.email - Email de l'utilisateur
     * @param {string} data.password - Nouveau mot de passe
     */
    async setPassword(data) {
        try {
            const response = await api.post('/api/user-workflow/set-password', data);
            return response.data;
        } catch (error) {
            console.error('Erreur définition mot de passe:', error);
            throw error.response?.data || { error: 'Erreur lors de la définition du mot de passe' };
        }
    },

    /**
     * Inscription parent (self-service depuis le site)
     * @param {Object} data - Données d'inscription
     * @param {string} data.first_name - Prénom
     * @param {string} data.last_name - Nom
     * @param {string} data.email - Email
     * @param {string} data.phone - Téléphone
     * @param {string} data.password - Mot de passe
     * @param {boolean} data.child_already_enrolled - L'enfant est-il déjà inscrit ?
     * @param {number} [data.child_id] - ID de l'enfant (si déjà inscrit)
     */
    async registerParent(data) {
        try {
            const response = await api.post('/api/user-workflow/register-parent', data);
            return response.data;
        } catch (error) {
            console.error('Erreur inscription parent:', error);
            throw error.response?.data || { error: 'Erreur lors de l\'inscription' };
        }
    },

    /**
     * Renvoyer le lien de création de mot de passe (admin)
     * @param {number} userId - ID de l'utilisateur
     */
    async resendPasswordLink(userId) {
        try {
            const response = await api.post('/api/user-workflow/resend-password-link', { user_id: userId });
            return response.data;
        } catch (error) {
            console.error('Erreur renvoi lien:', error);
            throw error.response?.data || { error: 'Erreur lors du renvoi du lien' };
        }
    },

    /**
     * Récupérer la liste des enfants orphelins (sans parent)
     * @param {string} [search] - Recherche par nom
     */
    async getOrphanChildren(search = '') {
        try {
            const params = search ? { search } : {};
            const response = await api.get('/api/children/orphans', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération enfants orphelins:', error);
            throw error.response?.data || { error: 'Erreur lors de la récupération des enfants' };
        }
    },

    /**
     * Associer un enfant à un parent
     * @param {number} childId - ID de l'enfant
     * @param {number} parentId - ID du parent
     */
    async associateChildToParent(childId, parentId) {
        try {
            const response = await api.put(`/api/children/${childId}/associate-parent`, { parentId });
            return response.data;
        } catch (error) {
            console.error('Erreur association enfant-parent:', error);
            throw error.response?.data || { error: 'Erreur lors de l\'association' };
        }
    }
};

export default userWorkflowService;
