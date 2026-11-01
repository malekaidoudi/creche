import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cake, ChevronRight, Baby, Edit3 } from 'lucide-react';
import api from '../../services/api';
import API_CONFIG from '../../config/api';

const resolveChildPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) return photoUrl;
  return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const isGirlGender = (gender) =>
  ['female', 'f', 'fille', 'girl'].includes(String(gender || '').trim().toLowerCase());

const ParentBirthdayBanner = ({ compact = false }) => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState({});

  const loadBirthdayChildren = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/birthdays/my-children');
      if (res.data?.success) {
        // Afficher dans Mon Espace :
        // - Avant l'anniversaire jusqu'à J-1 à 23:59 (et Jour J) : days_until >= 0 && days_until <= 35
        // - De J+1 à J+30 : uniquement si l'enfant a des souvenirs publiés
        const relevant = (res.data.children || []).filter((c) => {
          if (c.days_until >= 0 && c.days_until <= 35) return true;
          if (c.days_until < 0 && c.days_until >= -30) {
            return Boolean(c.has_memories || c.memories_count > 0);
          }
          return false;
        });
        setChildren(relevant);
      }
    } catch (err) {
      console.error('Erreur chargement widget anniversaire parent:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBirthdayChildren();
  }, [loadBirthdayChildren]);

  if (loading || children.length === 0) return null;

  return (
    <div className={`space-y-2.5 ${compact ? 'pt-8 pb-1' : 'mt-2 mb-6'}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Cake className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">
            Anniversaires & Souvenirs 🎂
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-3'} gap-3`}>
        {children.map((child) => {
          const isPost = child.is_post_birthday_month;
          const isLate = child.is_late_window;
          const hasMemories = Boolean(child.has_memories || child.memories_count > 0);
          const decisionStatus = child.celebration?.decision_status || child.decision || 'pending';
          const isValidated =
            !isPost && (decisionStatus === 'yes' || decisionStatus === 'no');
          const canEditUntilJ1 = child.days_until >= 1;
          const canChangeFromNo = decisionStatus === 'no' && child.days_until >= 5;
          const photoSrc = resolveChildPhotoUrl(child.photo_url);
          const showPhoto = Boolean(photoSrc && !failedImages[child.id]);
          const isGirl = isGirlGender(child.gender);

          const rawCelebrationDate =
            child.celebration?.celebration_date ||
            child.preferred_date ||
            child.this_year_date;
          const formattedChosenDate = rawCelebrationDate
            ? (() => {
                const d = new Date(rawCelebrationDate);
                return !isNaN(d.getTime())
                  ? d.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })
                  : String(rawCelebrationDate).slice(0, 10);
              })()
            : '';

          return (
            <div
              key={child.id}
              onClick={() => navigate(`/mon-espace/child/${child.id}/birthday`)}
              className={`cursor-pointer group rounded-2xl p-3.5 sm:p-4 border shadow-sm hover:shadow-md transition flex items-center justify-between gap-3 ${
                isValidated && decisionStatus === 'yes'
                  ? 'bg-gradient-to-br from-emerald-50 via-[#FFF9F4] to-amber-50/80 border-emerald-200'
                  : isValidated && decisionStatus === 'no'
                  ? 'bg-gradient-to-br from-stone-50 via-white to-stone-100 border-stone-200'
                  : 'bg-gradient-to-br from-[#FFF5EC] via-[#FFE4E6] to-[#FEF3C7] border-rose-200/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  {showPhoto ? (
                    <img
                      src={photoSrc}
                      alt={child.first_name}
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [child.id]: true }))
                      }
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm ${
                        isGirl
                          ? 'bg-pink-100 text-pink-500'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Baby className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-[10px] font-extrabold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                    {child.turning_age}a
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-stone-900 text-sm">
                      🎂 {child.first_name}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isPost
                          ? 'bg-purple-600 text-white'
                          : decisionStatus === 'yes'
                          ? 'bg-emerald-600 text-white'
                          : decisionStatus === 'no'
                          ? 'bg-stone-600 text-white'
                          : isLate
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isPost
                        ? `📸 Souvenirs (J+${Math.abs(child.days_until)})`
                        : child.days_until === 0
                        ? "🎉 Aujourd'hui"
                        : `J-${child.days_until}`}
                    </span>
                    {decisionStatus === 'yes' && !isPost && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          child.celebration?.notify_other_parents
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200/80 text-stone-700'
                        }`}
                      >
                        {child.celebration?.notify_other_parents ? '🌍 Public' : '🔒 Privé'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-700 truncate mt-0.5 font-medium">
                    {isPost && hasMemories
                      ? `📸 Les souvenirs de ${child.first_name} sont disponibles !`
                      : decisionStatus === 'yes'
                      ? child.celebration?.admin_approval_status === 'pending_approval'
                        ? `⏳ Fête le ${formattedChosenDate} (Accord Direction)`
                        : `✅ Fête validée (${formattedChosenDate}) · Modifiable jusqu'à J-1`
                      : decisionStatus === 'no'
                      ? '🏠 Fête en famille (Rien à prévoir à la crèche)'
                      : isLate
                      ? '⚠️ Délai < 5j : Demander accord Direction'
                      : '👉 Cliquez pour choisir (Oui / Non à la crèche)'}
                  </p>
                </div>
              </div>

              {isValidated && ((decisionStatus === 'yes' && canEditUntilJ1) || canChangeFromNo) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200/90 text-stone-700 group-hover:text-rose-600 group-hover:border-rose-200 text-[11px] font-extrabold whitespace-nowrap shrink-0 shadow-sm transition">
                  <Edit3 className="w-3 h-3 shrink-0" />
                  <span>Modifier</span>
                </span>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center text-rose-600 shrink-0 shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParentBirthdayBanner;


