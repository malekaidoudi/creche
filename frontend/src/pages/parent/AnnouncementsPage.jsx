import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Calendar, AlertCircle, Info, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, info, alert, event

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      // Parents utilisent /my, admin/staff utilisent la route normale
      const endpoint = user?.role === 'parent' ? '/announcements/my' : '/announcements';

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('📢 Annonces chargées:', response.data.announcements?.length || 0);
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement annonces:', error);
      console.error('Détails:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (eventType) => {
    switch (eventType) {
      case 'general':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'meeting':
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'celebration':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Megaphone className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (eventType) => {
    const badges = {
      general: 'bg-blue-100 text-blue-800',
      urgent: 'bg-red-100 text-red-800',
      meeting: 'bg-purple-100 text-purple-800',
      event: 'bg-purple-100 text-purple-800',
      celebration: 'bg-green-100 text-green-800'
    };
    return badges[eventType] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (eventType) => {
    const labels = {
      general: 'Information',
      urgent: 'Urgent',
      meeting: 'Réunion',
      event: 'Événement',
      celebration: 'Célébration'
    };
    return labels[eventType] || eventType;
  };

  const filteredAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter(a => a.event_type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Bouton retour pour les parents */}
        {user?.role === 'parent' && (
          <button
            onClick={() => navigate('/mon-espace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à Mon Espace</span>
          </button>
        )}

        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Annonces</h1>
        </div>
        <p className="text-gray-600">
          Restez informé des dernières actualités de la crèche
        </p>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          Toutes ({announcements.length})
        </button>
        <button
          onClick={() => setFilter('general')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${filter === 'general'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          <span className="hidden sm:inline">Informations</span>
          <span className="sm:hidden">Info</span> ({announcements.filter(a => a.event_type === 'general').length})
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${filter === 'urgent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          Urgent ({announcements.filter(a => a.event_type === 'urgent').length})
        </button>
        <button
          onClick={() => setFilter('meeting')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${filter === 'meeting'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          <span className="hidden sm:inline">Réunions</span>
          <span className="sm:hidden">RDV</span> ({announcements.filter(a => a.event_type === 'meeting').length})
        </button>
        <button
          onClick={() => setFilter('event')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm col-span-2 sm:col-span-1 ${filter === 'event'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          Événements ({announcements.filter(a => a.event_type === 'event').length})
        </button>
      </div>

      {/* Liste des annonces */}
      {filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">Aucune annonce pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(announcement.event_type)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(announcement.event_type)}`}>
                        {getTypeLabel(announcement.event_type)}
                      </span>
                      {announcement.event_date && (
                        <span className="text-sm text-gray-500">
                          📅 {new Date(announcement.event_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {announcement.description}
              </p>

              {/* Footer */}
              {announcement.author_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Publié par <span className="font-medium text-gray-700">{announcement.author_name}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
