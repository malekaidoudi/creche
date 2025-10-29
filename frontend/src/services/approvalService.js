import api from './api.js';

const approvalService = {
  // Approuver une demande d'inscription
  approveChild: async (childId) => {
    try {
      const response = await api.put(`/api/children/${childId}`, {
        status: 'approved'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur approbation enfant:', error);
      throw error;
    }
  },

  // Rejeter une demande d'inscription
  rejectChild: async (childId, reason = '') => {
    try {
      const response = await api.put(`/api/children/${childId}`, {
        status: 'rejected',
        rejection_reason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Erreur rejet enfant:', error);
      throw error;
    }
  },

  // Remettre en attente
  setPendingChild: async (childId) => {
    try {
      const response = await api.put(`/api/children/${childId}`, {
        status: 'pending'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur mise en attente enfant:', error);
      throw error;
    }
  }
};

export default approvalService;
