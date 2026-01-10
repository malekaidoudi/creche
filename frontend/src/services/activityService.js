/**
 * Service API pour les activités (fil d'actualités)
 */

import api from './api';

const activityService = {
  /**
   * Récupérer la liste des activités
   */
  async getActivities(page = 1, limit = 10) {
    try {
      const response = await api.get('/api/activities', { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Erreur getActivities:', error);
      throw error;
    }
  },

  /**
   * Récupérer une activité par ID
   */
  async getActivityById(id) {
    try {
      const response = await api.get(`/api/activities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getActivityById:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle activité
   */
  async createActivity(formData) {
    try {
      // Log du contenu du FormData pour debug
      console.log('📤 createActivity - Contenu FormData:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  - ${key}: File(${value.name}, ${(value.size / 1024 / 1024).toFixed(2)} MB, ${value.type})`);
        } else {
          console.log(`  - ${key}: ${value}`);
        }
      }

      const response = await api.post('/api/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('✅ createActivity - Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur createActivity:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une activité
   */
  async updateActivity(id, data) {
    try {
      const response = await api.put(`/api/activities/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur updateActivity:', error);
      throw error;
    }
  },

  /**
   * Supprimer une activité
   */
  async deleteActivity(id) {
    try {
      const response = await api.delete(`/api/activities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteActivity:', error);
      throw error;
    }
  },

  /**
   * Ajouter/Toggle une réaction
   */
  async toggleReaction(activityId, reactionType) {
    try {
      const response = await api.post(`/api/activities/${activityId}/reactions`, { reactionType });
      return response.data;
    } catch (error) {
      console.error('Erreur toggleReaction:', error);
      throw error;
    }
  },

  /**
   * Récupérer les détails des réactions (qui a réagi)
   */
  async getReactionDetails(activityId) {
    try {
      const response = await api.get(`/api/activities/${activityId}/reactions/details`);
      return response.data;
    } catch (error) {
      console.error('Erreur getReactionDetails:', error);
      throw error;
    }
  },

  /**
   * Récupérer les commentaires d'une activité
   */
  async getComments(activityId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/api/activities/${activityId}/comments`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Erreur getComments:', error);
      throw error;
    }
  },

  /**
   * Ajouter un commentaire
   */
  async addComment(activityId, content, parentCommentId = null) {
    try {
      const response = await api.post(`/api/activities/${activityId}/comments`, { content, parentCommentId });
      return response.data;
    } catch (error) {
      console.error('Erreur addComment:', error);
      throw error;
    }
  },

  /**
   * Supprimer un commentaire
   */
  async deleteComment(activityId, commentId) {
    try {
      const response = await api.delete(`/api/activities/${activityId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteComment:', error);
      throw error;
    }
  }
};

export default activityService;

