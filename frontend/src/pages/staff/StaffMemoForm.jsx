import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, CheckSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const StaffMemoForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'memo',
    title: '',
    description: '',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    try {
      setSaving(true);
      
      // Créer un événement de type memo/task assigné à l'admin
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'pending',
        priority: formData.priority,
        start_date: new Date().toISOString(),
        all_day: true,
        assigned_to: 1, // ID de l'admin (à ajuster selon votre BDD)
        color: formData.type === 'memo' ? '#8B5CF6' : '#3B82F6',
        metadata: {
          from_staff: true,
          sender_name: `${user.first_name} ${user.last_name}`,
          sender_id: user.id
        }
      };

      const response = await api.post('/api/events', payload);
      
      if (response.data.success) {
        toast.success(
          formData.type === 'memo' 
            ? '📝 Mémo envoyé à l\'admin avec succès' 
            : '✅ Tâche envoyée à l\'admin avec succès'
        );
        navigate('/dashboard');
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Envoyer à l'Admin
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            Nouveau Message pour l'Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Type de message
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'memo' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'memo'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === 'memo' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">📝 Mémo</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Information ou note
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'task' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'task'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <CheckSquare className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === 'task' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">✅ Tâche</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Action à effectuer
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Besoin de fournitures, Problème technique..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez votre demande ou information en détail..."
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">🟢 Basse - Peut attendre</option>
                <option value="medium">🟡 Moyenne - Normal</option>
                <option value="high">🔴 Haute - Urgent</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Ce message sera envoyé directement à l'administration et apparaîtra dans leurs tâches.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffMemoForm;
