import { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Users, User, Send, Calendar } from 'lucide-react';
import axios from 'axios';
import { useDialogContext } from '../../contexts/DialogContext';
import DatePicker from '../ui/DatePicker';
import { convertToISO, convertFromISO } from '../../utils/dateUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function PaymentAlertModal({ isOpen, onClose, onSuccess }) {
  const dialog = useDialogContext();
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);
  const firstInputRef = useRef(null);
  const [formData, setFormData] = useState({
    recipient_type: 'single', // single ou multiple
    parent_ids: [],
    amount: '',
    due_date: '',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadParents();
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadParents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'parent' }
      });

      if (response.data.success) {
        setParents(response.data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement parents:', error);
      dialog.error('Erreur lors du chargement des parents');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.recipient_type === 'single' && formData.parent_ids.length === 0) {
      dialog.error('Veuillez sélectionner au moins un parent');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      dialog.error('Le montant doit être supérieur à 0');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        recipient_type: formData.recipient_type,
        parent_ids: formData.recipient_type === 'single' ? formData.parent_ids : [],
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        message: formData.message
      };

      const response = await axios.post(
        `${API_URL}/payment-alerts`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dialog.success('Alerte de paiement envoyée avec succès');
        onSuccess?.();
        handleClose();
      }
    } catch (error) {
      console.error('Erreur envoi alerte:', error);
      dialog.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'alerte');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      recipient_type: 'single',
      parent_ids: [],
      amount: '',
      due_date: '',
      message: ''
    });
    onClose();
  };

  const toggleParent = (parentId) => {
    setFormData(prev => ({
      ...prev,
      parent_ids: prev.parent_ids.includes(parentId)
        ? prev.parent_ids.filter(id => id !== parentId)
        : [...prev.parent_ids, parentId]
    }));
  };

  const selectAllParents = () => {
    setFormData(prev => ({
      ...prev,
      parent_ids: parents.map(p => p.id)
    }));
  };

  const deselectAllParents = () => {
    setFormData(prev => ({
      ...prev,
      parent_ids: []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Alerte de Paiement
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type de destinataire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire(s) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, recipient_type: 'single', parent_ids: [] })}
                className={`p-3 rounded-lg border-2 transition-all ${formData.recipient_type === 'single'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
              >
                <User className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Parent(s) spécifique(s)</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, recipient_type: 'all', parent_ids: [] })}
                className={`p-3 rounded-lg border-2 transition-all ${formData.recipient_type === 'all'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Tous les parents</div>
              </button>
            </div>
          </div>

          {/* Sélection des parents (si single) */}
          {formData.recipient_type === 'single' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Parents ({formData.parent_ids.length})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllParents}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllParents}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {parents.map((parent) => (
                  <label
                    key={parent.id}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.parent_ids.includes(parent.id)}
                      onChange={() => toggleParent(parent.id)}
                      className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {parent.first_name} {parent.last_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{parent.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Montant */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              Montant à payer (TND) *
            </label>
            <input
              ref={firstInputRef}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Ex: 150.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {/* Date d'échéance */}
          <DatePicker
            label="Date d'échéance"
            required
            value={formData.due_date}
            onChange={(value) => setFormData({ ...formData, due_date: value })}
          />

          {/* Message personnalisé */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              Message (optionnel)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Message personnalisé..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer l'alerte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
