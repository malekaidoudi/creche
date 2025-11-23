import { useState, useEffect, useRef } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useDialogContext } from '../../contexts/DialogContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function MemoModal({ isOpen, onClose, onSuccess }) {
  const dialog = useDialogContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    priority: 'medium'
  });
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.description.trim()) {
      dialog.error('La description est requise');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        title: 'Mémo personnel',
        description: formData.description,
        type: 'memo',
        priority: formData.priority,
        assigned_to: user.userId || user.id,
        start_date: new Date().toISOString(),
        status: 'pending'
      };

      const response = await axios.post(
        `${API_URL}/events`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dialog.success('Mémo créé avec succès');
        onSuccess?.();
        handleClose();
      }
    } catch (error) {
      console.error('Erreur création mémo:', error);
      dialog.error(error.response?.data?.message || 'Erreur lors de la création du mémo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      priority: 'medium'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📝 Nouveau Mémo
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Description *
            </label>
            <textarea
              ref={firstInputRef}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notez votre mémo ici..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Priorité */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <AlertCircle className="w-4 h-4" />
              Priorité
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">🟢 Basse</option>
              <option value="medium">🟡 Moyenne</option>
              <option value="high">🔴 Haute</option>
            </select>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              'Sauvegarder'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
