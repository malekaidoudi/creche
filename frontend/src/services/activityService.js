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
      const response = await api.get('/activities', { params: { page, limit } });
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
      const response = await api.get(`/activities/${id}`);
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
      const response = await api.post('/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur createActivity:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une activité
   */
  async updateActivity(id, data) {
    try {
      const response = await api.put(`/activities/${id}`, data);
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
      const response = await api.delete(`/activities/${id}`);
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
      const response = await api.post(`/activities/${activityId}/reactions`, { reactionType });
      return response.data;
    } catch (error) {
      console.error('Erreur toggleReaction:', error);
      throw error;
    }
  },

  /**
   * Récupérer les commentaires d'une activité
   */
  async getComments(activityId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/activities/${activityId}/comments`, { params: { page, limit } });
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
      const response = await api.post(`/activities/${activityId}/comments`, { content, parentCommentId });
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
      const response = await api.delete(`/activities/${activityId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteComment:', error);
      throw error;
    }
  }
};

export default activityService;

