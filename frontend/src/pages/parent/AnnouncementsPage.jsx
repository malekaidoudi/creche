import { useState, useEffect } from 'react';
import { Megaphone, Calendar, AlertCircle, Info, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, info, alert, event

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('📢 Annonces chargées:', response.data.announcements.length);
        setAnnouncements(response.data.announcements);
      }
    } catch (error) {
      console.error('❌ Erreur chargement annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Megaphone className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const badges = {
      info: 'bg-blue-100 text-blue-800',
      alert: 'bg-red-100 text-red-800',
      event: 'bg-purple-100 text-purple-800',
      success: 'bg-green-100 text-green-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      info: 'Information',
      alert: 'Alerte',
      event: 'Événement',
      success: 'Succès'
    };
    return labels[type] || type;
  };

  const filteredAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter(a => a.type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Annonces</h1>
        </div>
        <p className="text-gray-600">
          Restez informé des dernières actualités de la crèche
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes ({announcements.length})
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Informations ({announcements.filter(a => a.type === 'info').length})
        </button>
        <button
          onClick={() => setFilter('alert')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'alert'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Alertes ({announcements.filter(a => a.type === 'alert').length})
        </button>
        <button
          onClick={() => setFilter('event')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'event'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Événements ({announcements.filter(a => a.type === 'event').length})
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
                  {getTypeIcon(announcement.type)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(announcement.type)}`}>
                        {getTypeLabel(announcement.type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(announcement.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {announcement.content}
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
