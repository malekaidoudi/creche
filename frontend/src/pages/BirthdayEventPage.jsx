import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Cake,
  Calendar,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Download,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Users,
  Camera,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Clock,
  Heart,
  ShieldAlert,
  Upload,
  ExternalLink,
  ClipboardList,
  Trash2,
  Share2,
  Baby,
  Edit3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDialogContext } from '../contexts/DialogContext';
import { useLanguage } from '../hooks/useLanguage';
import api from '../services/api';
import API_CONFIG from '../config/api';

const resolveChildPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) return photoUrl;
  return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const isGirlGender = (gender) =>
  ['female', 'f', 'fille', 'girl'].includes(String(gender || '').trim().toLowerCase());

/**
 * Formate un jour suggéré (dayOption) pour l'affichage en français ou en arabe.
 */
const formatDayOptionDisplay = (dayOption, isRTL) => {
  if (!dayOption) return { label: '', icon: '📅' };
  if (!isRTL) {
    return {
      label: (dayOption.label || dayOption.date || '').replace(/^[📅💬]\s*/, '').trim(),
      icon: dayOption.id === 'custom' ? '💬' : '📅'
    };
  }

  // Formatage en arabe
  const dateObj = dayOption.date ? new Date(`${dayOption.date}T12:00:00`) : null;
  const formattedDate =
    dateObj && !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('ar-TN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
      : dayOption.date;

  const hasCoBirthday = dayOption.label && dayOption.label.includes('anniv');
  const coSuffix = hasCoBirthday ? ' 🎂' : '';

  let suffix = '';
  let icon = '📅';

  switch (dayOption.id) {
    case 'same_day':
      suffix = `(يوم العيد الساعة 15:30${coSuffix})`;
      icon = '📅';
      break;
    case 'before':
      suffix = `(قبل يوم${coSuffix})`;
      icon = '📅';
      break;
    case 'after':
      suffix = `(يوم بعد${coSuffix})`;
      icon = '📅';
      break;
    case 'custom':
      suffix = '(أو يوم آخر بالاتفاق)';
      icon = '💬';
      break;
    default:
      suffix = coSuffix ? `(${coSuffix})` : '';
      icon = '📅';
      break;
  }

  return {
    label: `${formattedDate} ${suffix}`.trim(),
    icon
  };
};

/**
 * Formate le label d'une date choisie à partir de la liste des jours suggérés.
 */
const formatChosenDayLabel = (dateStr, suggestedDaysList, isRTL) => {
  if (!dateStr) return '';
  const cleanDateStr = String(dateStr).slice(0, 10);
  const matched = suggestedDaysList?.find((s) => s.date === cleanDateStr);
  if (matched) {
    const disp = formatDayOptionDisplay(matched, isRTL);
    return disp.label;
  }
  const dateObj = new Date(`${cleanDateStr}T12:00:00`);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }
  return cleanDateStr;
};

const BirthdayEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dialog = useDialogContext();
  const { currentLanguage, isRTL } = useLanguage();

  const isActualStaff =
    user?.role === 'admin' || user?.role === 'staff' || user?.role === 'directrice' || user?.role === 'developer';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sharingActivity, setSharingActivity] = useState(false);
  const [data, setData] = useState(null);

  const viewRole =
    user?.role === 'admin' || user?.role === 'directrice' || user?.role === 'developer'
      ? 'admin'
      : user?.role === 'staff'
      ? !data?.celebration?.assigned_staff_id ||
        Number(data?.celebration?.assigned_staff_id) === Number(user?.id)
        ? 'staff_assigne'
        : 'staff_non_assigne'
      : !data?.child?.parent_id || Number(data?.child?.parent_id) === Number(user?.id)
      ? 'parent_concerne'
      : 'parent_non_concerne';

  // Parent form state
  const [selectedDecision, setSelectedDecision] = useState(null); // 'yes' | 'no' | null
  const [wizardStep, setWizardStep] = useState(1); // 1: Choisir | 2: Valider | 3: Envoyer
  const [celebrationDay, setCelebrationDay] = useState('');
  const [parentNotes, setParentNotes] = useState('');
  const [notifyOtherParents, setNotifyOtherParents] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [changingMind, setChangingMind] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  // Admin & Staff form state
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [adminTaskText, setAdminTaskText] = useState('');
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState([]);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Load Google Fonts Fraunces & Plus Jakarta Sans for the festive editorial look
  useEffect(() => {
    const linkId = 'birthday-festive-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const fetchBirthdayDetail = useCallback(
    async (targetId) => {
      const childIdToLoad = targetId || id;
      if (!childIdToLoad) return;
      try {
        setLoading(true);
        const res = await api.get(`/api/birthdays/child/${childIdToLoad}`);
        if (res.data?.success) {
          const d = res.data;
          setData(d);
          setSlideIndex(0);
          setChangingMind(false);
          setHeroImgError(false);

          // Initialize parent decision
          const existingStatus = d.celebration?.decision_status;
          if (existingStatus === 'yes' || existingStatus === 'no') {
            setSelectedDecision(existingStatus);
            setWizardStep(1);
          } else {
            setSelectedDecision(null);
            setWizardStep(1);
          }

          // Initialize toggle "Informer les autres parents"
          setNotifyOtherParents(Boolean(d.celebration?.notify_other_parents));

          // Initialize celebration day
          const defaultDay =
            d.celebration?.celebration_date
              ? String(d.celebration.celebration_date).slice(0, 10)
              : d.suggested_days?.[0]?.date || d.birthday?.this_year_date || '';
          setCelebrationDay(defaultDay);

          // Pre-fill message
          const selectedDayLabel = formatChosenDayLabel(defaultDay, d.suggested_days, isRTL);
          if (isRTL) {
            const coNote =
              d.co_birthdays?.length > 0
                ? ` (لاحظنا أن ${d.co_birthdays.map((c) => c.first_name).join(' و ')} يحتفل أيضاً بعيد ميلاده !)`
                : '';
            const lateNote = d.birthday?.is_late_window
              ? ' (طلب متأخر بأقل من 5 أيام، بانتظار موافقتكم الكريمة)'
              : '';
            setParentNotes(
              d.celebration?.parent_notes ||
                `مرحباً بإدارة الروضة 👋 ! نود الاحتفال بعيد ميلاد ${d.child?.first_name} (${d.birthday?.turning_age} سنوات) في الروضة يوم ${selectedDayLabel}${coNote}${lateNote}. هل يمكنكم إعلامنا بكيفية التنظيم (الكعكة، العصير، الشموع) ؟ شكراً جزيلاً ! 🎂🎈`
            );
          } else {
            const coNote =
              d.co_birthdays?.length > 0
                ? ` (nous avons vu que ${d.co_birthdays.map((c) => c.first_name).join(' et ')} fête aussi son anniversaire !)`
                : '';
            const lateNote = d.birthday?.is_late_window
              ? ' (demande tardive à moins de 5 jours, sous réserve de votre accord)'
              : '';
            setParentNotes(
              d.celebration?.parent_notes ||
                `Bonjour la crèche 👋 ! Nous aimerions fêter les ${d.birthday?.turning_age} ans de ${d.child?.first_name} à la crèche le ${selectedDayLabel}${coNote}${lateNote}. Pouvez-vous nous dire comment on s'organise (gâteau, jus, bougies) ? Merci beaucoup ! 🎂🎈`
            );
          }

          // Pre-fill admin task text & staff
          if (d.staff_list?.length > 0) {
            setAssignedStaffId(
              d.celebration?.assigned_staff_id
                ? String(d.celebration.assigned_staff_id)
                : String(d.staff_list[0].id)
            );
          }
          const coAdminNote =
            d.co_birthdays?.length > 0
              ? ` Co-anniversaire possible avec ${d.co_birthdays.map((c) => c.first_name).join(', ')}.`
              : '';
          const cleanedSavedNotes = d.celebration?.admin_task_notes
            ? String(d.celebration.admin_task_notes)
                .replace(/Notes médicales\/allergies\s*:\s*[^.\n]+\.?\s*/gi, '')
                .replace(/^[ \t]*•[ \t]*Vérifier les allergies[^\n]*\n?/gim, '')
                .trim()
            : '';
          setAdminTaskText(
            cleanedSavedNotes ||
              `🎂 Préparer l'anniversaire de ${d.child?.first_name} (${d.birthday?.turning_age} ans) prévu le ${selectedDayLabel}.${coAdminNote} Prévoir décoration, couronne, musique et prendre 3-4 belles photos souvenirs pour le diaporama parent.`
          );
        }
      } catch (err) {
        console.error('Erreur chargement détails anniversaire:', err);
      } finally {
        setLoading(false);
      }
    },
    [id, isRTL]
  );

  useEffect(() => {
    fetchBirthdayDetail(id);
  }, [id, fetchBirthdayDetail]);

  // Update pre-filled message when celebrationDay changes
  const handleDayChange = (newDate) => {
    setCelebrationDay(newDate);
    if (!data) return;
    const selectedDayLabel = formatChosenDayLabel(newDate, data.suggested_days, isRTL);
    if (isRTL) {
      const coNote =
        data.co_birthdays?.length > 0
          ? ` (لاحظنا أن ${data.co_birthdays.map((c) => c.first_name).join(' و ')} يحتفل أيضاً بعيد ميلاده !)`
          : '';
      const lateNote = data.birthday?.is_late_window
        ? ' (طلب متأخر بأقل من 5 أيام، بانتظار موافقتكم الكريمة)'
        : '';
      setParentNotes(
        `مرحباً بإدارة الروضة 👋 ! نود الاحتفال بعيد ميلاد ${data.child?.first_name} (${data.birthday?.turning_age} سنوات) في الروضة يوم ${selectedDayLabel}${coNote}${lateNote}. هل يمكنكم إعلامنا بكيفية التنظيم (الكعكة، العصير، الشموع) ؟ شكراً جزيلاً ! 🎂🎈`
      );
    } else {
      const coNote =
        data.co_birthdays?.length > 0
          ? ` (nous avons vu que ${data.co_birthdays.map((c) => c.first_name).join(' et ')} fête aussi son anniversaire !)`
          : '';
      const lateNote = data.birthday?.is_late_window
        ? ' (demande tardive à moins de 5 jours, sous réserve de votre accord)'
        : '';
      setParentNotes(
        `Bonjour la crèche 👋 ! Nous aimerions fêter les ${data.birthday?.turning_age} ans de ${data.child?.first_name} à la crèche le ${selectedDayLabel}${coNote}${lateNote}. Pouvez-vous nous dire comment on s'organise (gâteau, jus, bougies) ? Merci beaucoup ! 🎂🎈`
      );
    }
  };

  // Save Parent Decision ('yes' or 'no')
  const handleSaveDecision = async (decision, channel = 'whatsapp') => {
    if (!data?.child?.id) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/api/birthdays/child/${data.child.id}/decision`, {
        decision,
        celebration_date: decision === 'yes' ? celebrationDay : null,
        parent_notes: decision === 'yes' ? parentNotes : isRTL ? 'حفل عائلي فقط، لا شيء للتحضير' : 'Rien à prévoir à la crèche',
        contact_channel: channel,
        notify_other_parents: decision === 'yes' ? notifyOtherParents : false
      });

      if (res.data?.success) {
        dialog?.success?.(res.data.message || (isRTL ? 'تم تسجيل القرار بنجاح !' : 'Décision enregistrée !'));
        setChangingMind(false);
        await fetchBirthdayDetail(data.child.id);

        // Open WhatsApp or SMS if requested
        const phoneClean = (data.nursery_phone || '+21658123456').replace(/[^0-9+]/g, '');
        const msg =
          decision === 'yes'
            ? parentNotes
            : isRTL
            ? `مرحباً بإدارة الروضة 👋، بخصوص عيد ميلاد ${data.child.first_name} (${data.birthday.turning_age} سنوات)، سنحتفل به عائلياً فقط هذا العام. لا داعي للتحضير في الروضة، شكراً جزيلاً !`
            : `Bonjour la crèche 👋, concernant l'anniversaire de ${data.child.first_name} (${data.birthday.turning_age} ans), nous le fêterons uniquement en famille cette année. Rien à prévoir à la crèche, merci beaucoup !`;
        if (channel === 'whatsapp') {
          window.open(
            `https://wa.me/${phoneClean.replace('+', '')}?text=${encodeURIComponent(msg)}`,
            '_blank',
            'noopener,noreferrer'
          );
        } else if (channel === 'sms') {
          window.open(
            `sms:${phoneClean}?body=${encodeURIComponent(msg)}`,
            '_blank',
            'noopener,noreferrer'
          );
        }
      }
    } catch (err) {
      console.error('Erreur décision anniversaire:', err);
      dialog?.error?.(
        err.response?.data?.error || 'Erreur lors de l’enregistrement de la décision'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle "Informer les autres parents" (exclusivement réservé au parent concerné)
  const handleToggleNotifyOtherParents = async (nextValue) => {
    if (viewRole !== 'parent_concerne' && viewRole !== 'parent') {
      dialog?.error?.("Seul le parent concerné a le droit de publier l'événement à tous les parents.");
      return;
    }
    setNotifyOtherParents(nextValue);
    if (!data?.child?.id || data?.celebration?.decision_status !== 'yes') {
      return;
    }
    try {
      setTogglingVisibility(true);
      const res = await api.patch(`/api/birthdays/child/${data.child.id}/visibility`, {
        notify_other_parents: nextValue
      });
      if (res.data?.success) {
        dialog?.success?.(res.data.message);
        await fetchBirthdayDetail(data.child.id);
      }
    } catch (err) {
      console.error('Erreur mise à jour visibilité événement:', err);
      dialog?.error?.(
        err.response?.data?.error || 'Erreur lors de la mise à jour de la visibilité'
      );
    } finally {
      setTogglingVisibility(false);
    }
  };

  // Admin / Staff Action ('accept', 'reject', 'assign_staff', 'complete_staff_task')
  const handleAdminAction = async (actionType) => {
    if (!data?.child?.id) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/api/birthdays/child/${data.child.id}/admin-action`, {
        action: actionType,
        assigned_staff_id: assignedStaffId ? parseInt(assignedStaffId, 10) : null,
        admin_task_notes: adminTaskText,
        celebration_date: celebrationDay
      });
      if (res.data?.success) {
        dialog?.success?.(res.data.message || 'Action enregistrée avec succès !');
        await fetchBirthdayDetail(data.child.id);
      }
    } catch (err) {
      console.error('Erreur action admin:', err);
      dialog?.error?.(err.response?.data?.error || 'Erreur lors de l’action');
    } finally {
      setSubmitting(false);
    }
  };

  // Select photo files from computer/mobile (creates local base64 previews)
  const handleSelectPhotoFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedPhotoFiles((prev) => [
          ...prev,
          {
            file,
            name: file.name,
            previewUrl: ev.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveSelectedPhoto = (indexToRemove) => {
    setSelectedPhotoFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Upload memory photos from computer/mobile (Admin/Staff)
  const handleAddMemoryPhoto = async (e) => {
    e.preventDefault();
    if (selectedPhotoFiles.length === 0 || !data?.child?.id) return;
    try {
      setSubmitting(true);
      const defaultCaption =
        newPhotoCaption.trim() ||
        `Souvenir des ${data.birthday?.turning_age} ans de ${data.child?.first_name} 🎂`;

      const formData = new FormData();
      selectedPhotoFiles.forEach((item) => {
        formData.append('photos_files', item.file);
      });
      formData.append('caption', defaultCaption);
      formData.append('publish_to_activity', 'true');

      const res = await api.post(
        `/api/birthdays/child/${data.child.id}/memories`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      if (res.data?.success) {
        dialog?.success?.(res.data.message || 'Photos souvenirs publiées et parent notifié !');
        setSelectedPhotoFiles([]);
        setNewPhotoCaption('');
        await fetchBirthdayDetail(data.child.id);
      }
    } catch (err) {
      console.error('Erreur ajout souvenir:', err);
      dialog?.error?.(
        err.response?.data?.error || 'Erreur lors de la publication des photos souvenirs'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Publish or update the birthday slideshow in the Activities feed (/activites)
  const handleShareSlideshowToActivity = async () => {
    if (!data?.child?.id) return;
    try {
      setSharingActivity(true);
      const res = await api.post(`/api/birthdays/child/${data.child.id}/share-activity`);
      if (res.data?.success) {
        dialog?.success?.(
          res.data.message || 'Diaporama publié dans le journal des Activités !'
        );
        await fetchBirthdayDetail(data.child.id);
      }
    } catch (err) {
      console.error('Erreur publication activité:', err);
      dialog?.error?.(
        err.response?.data?.error || 'Erreur lors de la publication dans la page Activités'
      );
    } finally {
      setSharingActivity(false);
    }
  };

  // Download single photo
  const downloadPhoto = async (photoUrl, filename) => {
    try {
      setDownloading(true);
      const response = await fetch(photoUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'souvenir-anniversaire.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab if CORS blocks direct blob fetch
      window.open(photoUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  // Download all photos
  const downloadAllPhotos = async () => {
    const items = data?.memories?.items || [];
    if (items.length === 0) return;
    setDownloading(true);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const safeName = (data?.child?.first_name || 'enfant').toLowerCase();
      await downloadPhoto(
        item.photo_url,
        `anniversaire-${safeName}-souvenir-${i + 1}.jpg`
      );
      await new Promise((r) => setTimeout(r, 350));
    }
    setDownloading(false);
    dialog?.success?.(`${items.length} photos téléchargées avec succès !`);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto animate-bounce">
            <Cake className="w-7 h-7" />
          </div>
          <p className="text-stone-600 font-semibold">
            Préparation de l’espace anniversaire...
          </p>
        </div>
      </div>
    );
  }

  if (!data?.child) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-amber-200/80 p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Cake className="w-8 h-8" />
          </div>
          <h1
            className="text-2xl font-bold text-stone-800"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Enfant introuvable
          </h1>
          <p className="text-stone-600 max-w-md mx-auto text-sm">
            Les informations d’anniversaire de cet enfant ne sont pas disponibles.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { child, birthday, co_birthdays, suggested_days, celebration, memories, staff_list } =
    data;
  const daysUntil = birthday?.days_until ?? 0;
  const isToday = Boolean(birthday?.is_today);
  const isBeforeJ5 = birthday?.is_before_j5;
  const isLateWindow = birthday?.is_late_window;
  const isPostBirthdayMonth = birthday?.is_post_birthday_month;
  const hasMemories = Boolean(memories?.has_memories && memories?.items?.length > 0);
  const currentSlide = memories?.items?.[slideIndex] || memories?.items?.[0];

  const isNoConfirmed =
    celebration?.decision_status === 'no' && !changingMind;
  const isYesConfirmed =
    celebration?.decision_status === 'yes' && !changingMind;
  const canChangeFromNo = Boolean(celebration?.can_change_mind_from_no);
  const canEditUntilJ1 = daysUntil >= 1;
  const heroPhotoUrl = resolveChildPhotoUrl(child.photo_url);
  const isChildGirl = isGirlGender(child.gender);

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const celebrationDateMidnight = celebration?.celebration_date
    ? new Date(celebration.celebration_date)
    : null;
  if (celebrationDateMidnight && !isNaN(celebrationDateMidnight.getTime())) {
    celebrationDateMidnight.setHours(0, 0, 0, 0);
  }
  const isCelebrationDayReached =
    daysUntil <= 0 ||
    isToday ||
    isPostBirthdayMonth ||
    (celebrationDateMidnight ? celebrationDateMidnight.getTime() <= todayMidnight.getTime() : false);
  const isCancelledByParent =
    celebration?.decision_status === 'no' &&
    celebration?.admin_approval_status === 'cancelled_by_parent';

  const formattedBirthDate = new Date(birthday.this_year_date).toLocaleDateString(
    currentLanguage === 'ar' ? 'ar-TN' : 'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );

  const countdownLabel = isRTL
    ? daysUntil === 0
      ? '🎉 اليوم هو اليوم الموعود !'
      : daysUntil > 0
      ? `🎉 خلال ${daysUntil} يوماً (ي-${daysUntil})`
      : `📸 تم الاحتفال به منذ ${Math.abs(daysUntil)} يوماً (ي+${Math.abs(daysUntil)})`
    : daysUntil === 0
    ? "🎉 C'est aujourd'hui !"
    : daysUntil > 0
    ? `🎉 Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} (J-${daysUntil})`
    : `📸 Fêté il y a ${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''} (J+${Math.abs(daysUntil)})`;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen pb-16"
      style={{
        backgroundColor: '#FFFDF9',
        backgroundImage:
          'radial-gradient(circle at 12% 8%, rgba(254, 205, 211, 0.35) 0%, transparent 38%), radial-gradient(circle at 88% 12%, rgba(253, 230, 138, 0.38) 0%, transparent 40%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* CONTENU PRINCIPAL */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {/* Bouton Retour */}
        <div>
          <button
            type="button"
            onClick={() => navigate(isActualStaff ? '/dashboard' : '/mon-espace')}
            className="compact-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold shadow-sm transition whitespace-nowrap"
            style={{ minHeight: 'auto', padding: '0.375rem 0.875rem' }}
          >
            {isRTL ? (
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isRTL ? 'رجوع' : 'Retour'}</span>
          </button>
        </div>
        {/* BANNIÈRE NOTIFICATION J+1 à J+30 (Souvenirs disponibles !) */}
        {isPostBirthdayMonth && hasMemories && (
          <div className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-rose-500 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/20">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shrink-0">
                📸
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full mb-1">
                  <span>{isRTL ? 'إشعار الولي · ي+1 إلى ي+30' : 'Notification Parent · J+1 à J+30'}</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold">
                  {isRTL
                    ? `📸 ألبوم ذكريات عيد ميلاد ${child.first_name} متوفر الآن !`
                    : `📸 Les souvenirs de l'anniversaire de ${child.first_name} sont disponibles !`}
                </h2>
                <p className="text-xs sm:text-sm text-white/90">
                  {isRTL
                    ? 'استمتعوا بمشاهدة ألبوم الصور وتحميلها (متاحة لمدة 30 يوماً، ثم في العام القادم كذكرى).'
                    : `Revivez la fête en diaporama et téléchargez toutes les photos souvenirs (visibles pendant 30 jours, puis l'année prochaine avant son anniversaire).`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              <Link
                to={isActualStaff ? '/activites' : '/mon-espace/activities'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm border border-white/30 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isRTL ? 'عرض في الأنشطة' : 'Voir dans Activités'}</span>
              </Link>
              <button
                onClick={downloadAllPhotos}
                disabled={downloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-800 font-extrabold text-xs sm:text-sm shadow hover:bg-purple-50 transition"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloading
                    ? isRTL
                      ? 'جارٍ التحميل...'
                      : 'Téléchargement...'
                    : isRTL
                    ? `تحميل ${memories.items.length} صورة`
                    : `Télécharger les ${memories.items.length} photos`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* CARTE HÉRO FESTIVE (Guirlande fanions + Photo + Couronne + Date) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF5EC] via-[#FFE4E6] to-[#FEF3C7] border border-[#F2E3D5] shadow-md">
          {/* SVG Bunting Garland */}
          <svg
            className="w-full h-9 sm:h-11 pointer-events-none select-none"
            viewBox="0 0 800 52"
            preserveAspectRatio="none"
          >
            <path
              d="M0,4 Q100,26 200,6 Q300,26 400,6 Q500,26 600,6 Q700,26 800,4"
              fill="none"
              stroke="#E2C6B2"
              strokeWidth="2"
            />
            <polygon points="35,10 60,13 46,40" fill="#FB7185" opacity="0.9" />
            <polygon points="95,15 120,14 108,42" fill="#FBBF24" opacity="0.9" />
            <polygon points="155,12 180,9 168,36" fill="#A78BFA" opacity="0.88" />
            <polygon points="235,11 260,15 246,41" fill="#34D399" opacity="0.88" />
            <polygon points="295,16 320,15 308,42" fill="#FB7185" opacity="0.9" />
            <polygon points="355,12 380,9 368,36" fill="#FBBF24" opacity="0.9" />
            <polygon points="435,11 460,15 446,41" fill="#F472B6" opacity="0.88" />
            <polygon points="495,16 520,15 508,42" fill="#34D399" opacity="0.88" />
            <polygon points="555,12 580,9 568,36" fill="#A78BFA" opacity="0.88" />
            <polygon points="635,11 660,15 646,41" fill="#FB7185" opacity="0.9" />
            <polygon points="695,16 720,15 708,42" fill="#FBBF24" opacity="0.9" />
            <polygon points="750,12 775,8 762,35" fill="#34D399" opacity="0.88" />
          </svg>

          <div className="px-3.5 sm:px-7 pb-4 pt-0.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-5">
            {/* Avatar + Crown + Child Info (Horizontal même sur mobile pour gagner de la hauteur) */}
            <div className="flex flex-row items-center text-start gap-3 sm:gap-4 w-full md:w-auto">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full p-0.5 sm:p-1 bg-gradient-to-tr from-rose-500 via-amber-400 to-purple-500 shadow-md">
                  {heroPhotoUrl && !heroImgError ? (
                    <img
                      src={heroPhotoUrl}
                      alt={child.first_name}
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover rounded-full border-2 sm:border-4 border-white"
                    />
                  ) : (
                    <div
                      className={`w-full h-full rounded-full border-2 sm:border-4 border-white flex items-center justify-center ${
                        isChildGirl
                          ? 'bg-pink-100 text-pink-500'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Baby className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                  )}
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow border border-white whitespace-nowrap">
                  👑 {birthday.turning_age} {isRTL ? 'سنوات' : 'ANS'}
                </span>
              </div>

              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/85 border border-rose-200 text-rose-600 text-[11px] font-extrabold shadow-sm">
                  <span>{countdownLabel}</span>
                </div>
                <h1
                  className="text-lg sm:text-2xl md:text-3xl font-extrabold text-stone-900 leading-snug break-words"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {isRTL ? `عيد ميلاد ${child.first_name} 🎂` : `L'anniversaire de ${child.first_name} 🎂`}
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-600 line-clamp-2">
                  {isPostBirthdayMonth
                    ? isRTL
                      ? 'شكراً لمشاركتنا هذه اللحظات المميزة ! تجدون صور الذكريات أدناه.'
                      : `Merci d'avoir partagé ce moment magique avec nous ! Retrouvez les photos souvenirs ci-dessous.`
                    : isRTL
                    ? 'لنستعد معاً لحفل لا يُنسى مع أصدقائه الصغار والفريق التربوي.'
                    : `Préparons ensemble une fête inoubliable avec ses petits camarades et l'équipe éducative.`}
                </p>
              </div>
            </div>

            {/* Official Date Pill (Compact sur mobile) */}
            <div className="w-full md:w-auto bg-white/90 backdrop-blur rounded-xl sm:rounded-2xl px-3 py-2 sm:p-3.5 border border-amber-200/80 shadow-sm flex md:block items-center justify-between text-start md:text-end shrink-0">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">
                {isRTL ? 'التاريخ الرسمي' : 'Date officielle'}
              </div>
              <div
                className="text-xs sm:text-base font-extrabold text-stone-800 capitalize md:mt-0.5"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {formattedBirthDate}
              </div>
              <div className="hidden md:block text-xs font-semibold text-rose-600 mt-0.5">
                {isRTL
                  ? `يُطفئ شمعاته الـ ${birthday.turning_age} ✨`
                  : `Souffle ses ${birthday.turning_age} bougies ✨`}
              </div>
            </div>
          </div>
        </div>

        {/* GRILLE PRINCIPALE : GAUCHE (Workflow selon rôle) / DROITE (Souvenirs conditionnels) */}
        <div
          className={`grid grid-cols-1 gap-4 sm:gap-6 items-start ${
            hasMemories || viewRole === 'admin' || viewRole === 'staff_assigne' || viewRole === 'staff_non_assigne'
              ? 'lg:grid-cols-12'
              : 'lg:grid-cols-1 max-w-3xl mx-auto'
          }`}
        >
          {/* COLONNE GAUCHE : WORKFLOW SELON LE RÔLE SÉLECTIONNÉ */}
          <div
            className={`space-y-4 ${
              hasMemories || viewRole === 'admin' || viewRole === 'staff_assigne' || viewRole === 'staff_non_assigne'
                ? 'lg:col-span-7'
                : 'w-full'
            }`}
          >
            {viewRole === 'parent_non_concerne' ? (
              /* ==================== VUE PARENT NON CONCERNÉ (AUTRE PARENT) ==================== */
              <div className="bg-white rounded-3xl border border-purple-200 p-4 sm:p-6 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold uppercase tracking-wider">
                    {isRTL
                      ? "👥 عرض ولي أمر لطفل آخر (غير معني)"
                      : "👥 Vue Parent d'un autre enfant (Parent non concerné)"}
                  </span>
                </div>

                {celebration?.decision_status === 'yes' && notifyOtherParents ? (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {isRTL
                          ? `🌍 مناسبة شاركها ولي أمر ${child.first_name} في الروزنامة !`
                          : `🌍 Événement partagé par le parent de ${child.first_name} dans le calendrier !`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                      {isRTL ? (
                        <>
                          اختار ولي أمر <strong>{child.first_name}</strong> إعلام بقية أولياء الروضة :
                          يمكنكم مشاهدة هذه المناسبة في روزنامة الأنشطة يوم{' '}
                          <strong>
                            {celebration?.celebration_date
                              ? String(celebration.celebration_date).slice(0, 10)
                              : celebrationDay || birthday.this_year_date}
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          Le parent de <strong>{child.first_name}</strong> a choisi d&apos;informer les autres
                          parents de la crèche : vous voyez cet événement d&apos;anniversaire dans votre
                          calendrier des événements le{' '}
                          <strong>
                            {celebration?.celebration_date
                              ? String(celebration.celebration_date).slice(0, 10)
                              : celebrationDay || birthday.this_year_date}
                          </strong>
                          .
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-stone-800 font-extrabold text-sm">
                      <ShieldAlert className="w-4 h-4 text-stone-500 shrink-0" />
                      <span>
                        {isRTL
                          ? '🔒 مناسبة خاصة (غير معروضة للأولياء الآخرين)'
                          : '🔒 Événement privé (Non affiché aux autres parents)'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {isRTL ? (
                        <>
                          لم يقم ولي أمر <strong>{child.first_name}</strong> بتفعيل المشاركة مع الأولياء الآخرين.
                          هذه المناسبة تظل معروضة فقط لـ{' '}
                          <strong>الولي المعني، الفريق التربوي والإدارة</strong>.
                        </>
                      ) : (
                        <>
                          Le parent de <strong>{child.first_name}</strong> n&apos;a pas activé le partage aux
                          autres parents. Cet événement de calendrier reste strictement visible par le{' '}
                          <strong>parent concerné, le staff et la direction</strong>.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {hasMemories && (
                  <div className="rounded-2xl bg-purple-50/70 border border-purple-200 p-3.5 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="text-xs sm:text-sm text-purple-950">
                      <strong>
                        {isRTL
                          ? '📰 النشر في صفحة الأنشطة (ي+1) :'
                          : '📰 Publication dans la page Activités (J+1) :'}
                      </strong>{' '}
                      {isRTL
                        ? 'ألبوم صور الحفل منشور في شريط أنشطة الروضة.'
                        : "Un diaporama des photos de la fête est publié dans le fil d'activités de la crèche."}
                    </div>
                    <Link
                      to={isActualStaff ? '/activites' : '/mon-espace/activities'}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'عرض في صفحة الأنشطة' : 'Voir dans la page Activités'}</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : viewRole === 'parent_concerne' || viewRole === 'parent' ? (
              /* ==================== VUE PARENT CONCERNÉ (FORMAT WIZARD COMPACT) ==================== */
              <div className="bg-white rounded-3xl border border-[#F2E3D5] p-4 sm:p-6 shadow-sm space-y-3.5">
                {/* En-tête compact + Badge Règle des 5 jours fusionné */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 block">
                      {isRTL ? 'تنظيم الولي والروضة' : 'Organisation Parent & Crèche'}
                    </span>
                    <h2
                      className="text-lg sm:text-xl font-bold text-stone-900 leading-snug"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {isPostBirthdayMonth
                        ? isRTL
                          ? '🎉 تم الاحتفال بعيد الميلاد في الروضة'
                          : '🎉 Anniversaire célébré à la crèche'
                        : isRTL
                        ? 'هل ترغبون في الاحتفال بعيد ميلاده في الروضة؟'
                        : 'Souhaitez-vous fêter son anniversaire à la crèche ?'}
                    </h2>
                  </div>

                  {!isPostBirthdayMonth && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isBeforeJ5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                      title={
                        isBeforeJ5
                          ? isRTL
                            ? 'التنظيم متاح: لديكم كامل الوقت للاختيار'
                            : `Organisation ouverte : vous avez tout le temps de choisir`
                          : isRTL
                          ? 'طلب متأخر (< 5 أيام) خاضع لموافقة الإدارة'
                          : `Demande tardive (< 5 jours) soumise à l'accord de la Direction`
                      }
                    >
                      {isBeforeJ5 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>
                        {isBeforeJ5
                          ? isRTL
                            ? `تنظيم مفتوح (ي-${daysUntil} ≥ 5 أيام)`
                            : `Organisation ouverte (J-${daysUntil} ≥ 5j)`
                          : isRTL
                          ? `أجل < 5 أيام (ي-${daysUntil}) · موافقة الإدارة`
                          : `Délai < 5j (J-${daysUntil}) · Accord Direction`}
                      </span>
                    </span>
                  )}
                </div>

                {/* Bandeau compact uniquement si délai < 5j (J-4 à J-1) */}
                {!isPostBirthdayMonth && isLateWindow && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2 text-xs text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {isRTL ? (
                        <>
                          <strong>الأجل &lt; 5 أيام (ي-{daysUntil}) :</strong> يظل الخيار متاحاً حتى ي-1،
                          شرط موافقة الإدارة.
                        </>
                      ) : (
                        <>
                          <strong>Délai &lt; 5j (J-{daysUntil}) :</strong> L&apos;option reste ouverte même à
                          J-1, sous réserve de validation par la Direction.
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Alerte Co-anniversaire compacte */}
                {co_birthdays?.length > 0 && (
                  <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 flex items-center gap-2 text-xs text-purple-950">
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      {isRTL ? (
                        <>
                          <strong>🎈 عيد ميلاد مشترك :</strong>{' '}
                          <strong>{co_birthdays.map((c) => c.first_name).join('، ')}</strong> يحتفل أيضاً
                          بعيد ميلاده في هذا التاريخ !
                        </>
                      ) : (
                        <>
                          <strong>🎈 Co-anniversaire :</strong>{' '}
                          <strong>{co_birthdays.map((c) => c.first_name).join(', ')}</strong> fête aussi
                          son anniversaire à cette date !
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* CAS 1 : Le parent a déjà choisi "NON, RIEN À PRÉVOIR" */}
                {isNoConfirmed ? (
                  <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 font-bold text-base">
                        🏠
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 mb-0.5">
                          {isRTL ? 'تم تأكيد القرار' : 'Décision validée'}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-800">
                          {isRTL
                            ? 'لا، لا شيء للتحضير في الروضة (حفل عائلي)'
                            : 'Non, rien à prévoir à la crèche (Fête en famille)'}
                        </h3>
                        <p className="text-xs text-stone-600 mt-0.5">
                          {isRTL
                            ? `تم إعلام الإدارة. سنغمر ${child.first_name} بمحبتنا بمناسبة سنته الـ ${birthday.turning_age} ! ❤️`
                            : `La direction a bien été informée. Nous ferons un gros câlin à ${child.first_name} pour ses ${birthday.turning_age} ans ! ❤️`}
                        </p>
                      </div>
                    </div>

                    {/* RÈGLE CHANGEMENT D'AVIS */}
                    {canChangeFromNo ? (
                      <div className="pt-2.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-stone-500">
                          {isRTL
                            ? `💡 قابل للتعديل حتى ي-5 (ي-${daysUntil} ≥ 5 أيام).`
                            : `💡 Modifiable jusqu'à J-5 (J-${daysUntil} ≥ 5j).`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setChangingMind(true);
                            setSelectedDecision('yes');
                            setWizardStep(2);
                          }}
                          className="compact-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-extrabold whitespace-nowrap shrink-0 shadow-sm transition"
                          style={{ minHeight: 'auto', padding: '0.375rem 0.75rem' }}
                        >
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          <span>{isRTL ? 'تغيير الرأي' : "Changer d'avis"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-400 italic">
                        {isRTL
                          ? '🔒 قرار نهائي مؤكد (انقضى أجل الـ 5 أيام قبل عيد الميلاد).'
                          : "🔒 Décision définitive validée (le délai de 5 jours avant l'anniversaire étant passé)."}
                      </div>
                    )}
                  </div>
                ) : isYesConfirmed ? (
                  /* CAS 1B : Le parent a déjà validé "OUI, ON FÊTE À LA CRÈCHE" */
                  <div className="rounded-2xl bg-[#FFF9F4] border border-emerald-200 p-3.5 sm:p-4 space-y-3">
                    <div
                      className={`rounded-xl px-3 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 ${
                        celebration.admin_approval_status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-900'
                          : celebration.admin_approval_status === 'rejected'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <span>
                        {celebration.admin_approval_status === 'accepted'
                          ? isRTL
                            ? '✅ تمت الموافقة على الحفل من الإدارة !'
                            : '✅ Fête validée par la Direction !'
                          : celebration.admin_approval_status === 'rejected'
                          ? isRTL
                            ? '❌ تم رفض الطلب (الأجل قصير جداً)'
                            : '❌ Demande refusée (délai trop court)'
                          : isRTL
                          ? '⏳ تم إرسال الطلب · في انتظار رد الإدارة'
                          : '⏳ Demande envoyée · En attente Direction'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white border border-stone-200/80 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 font-bold uppercase text-[10px] block">
                          {isRTL ? 'اليوم المحدد للاحتفال في الروضة' : 'Jour retenu pour la fête à la crèche'}
                        </span>
                        <span className="font-extrabold text-stone-900 text-sm">
                          📅{' '}
                          {formatChosenDayLabel(
                            celebrationDay || celebration?.celebration_date,
                            suggested_days,
                            isRTL
                          )}
                        </span>
                      </div>

                      {canEditUntilJ1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setChangingMind(true);
                            setSelectedDecision('yes');
                            setWizardStep(1);
                          }}
                          className="compact-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-extrabold whitespace-nowrap shrink-0 shadow-sm transition"
                          style={{ minHeight: 'auto', padding: '0.375rem 0.75rem' }}
                        >
                          <Edit3 className="w-3.5 h-3.5 shrink-0" />
                          <span>{isRTL ? 'تعديل اختياري' : 'Modifier mon choix'}</span>
                        </button>
                      )}
                    </div>

                    {/* Toggle Visibilité */}
                    <div className="rounded-xl bg-white border border-rose-200/90 p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                              {isRTL ? 'إعلام الأولياء الآخرين ؟' : 'Informer les autres parents ?'}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                notifyOtherParents
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {notifyOtherParents
                                ? isRTL
                                  ? '🌍 عام'
                                  : '🌍 Public'
                                : isRTL
                                ? '🔒 خاص'
                                : '🔒 Privé'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            {notifyOtherParents
                              ? isRTL
                                ? 'مرئي لجميع الأولياء في الروزنامة.'
                                : 'Visible par tous les parents dans le calendrier.'
                              : isRTL
                              ? 'مرئي فقط لكم، وللفريق التربوي والإدارة.'
                              : 'Visible uniquement par vous, le staff et la direction.'}
                          </p>
                        </div>

                        <div
                          role="switch"
                          tabIndex={0}
                          aria-checked={notifyOtherParents}
                          aria-label={isRTL ? 'إعلام أولياء الروضة الآخرين' : 'Informer les autres parents de la crèche'}
                          onClick={() => {
                            if (!togglingVisibility) {
                              handleToggleNotifyOtherParents(!notifyOtherParents);
                            }
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !togglingVisibility) {
                              e.preventDefault();
                              handleToggleNotifyOtherParents(!notifyOtherParents);
                            }
                          }}
                          style={{
                            width: '48px',
                            height: '26px',
                            minWidth: '48px',
                            minHeight: '26px',
                            maxHeight: '26px',
                            padding: '3px',
                            borderRadius: '9999px',
                            backgroundColor: notifyOtherParents ? '#F43F5E' : '#D6D3D1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: togglingVisibility ? 'wait' : 'pointer',
                            transition: 'background-color 0.2s ease-in-out',
                            flexShrink: 0,
                            boxSizing: 'border-box'
                          }}
                        >
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '9999px',
                              backgroundColor: '#FFFFFF',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                              transform: notifyOtherParents
                                ? isRTL
                                  ? 'translateX(-22px)'
                                  : 'translateX(22px)'
                                : 'translateX(0px)',
                              transition: 'transform 0.2s ease-in-out',
                              display: 'block'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isPostBirthdayMonth ? (
                  /* CAS 2 : Anniversaire déjà fêté (J+1 à J+30) */
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm sm:text-base">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {isRTL
                          ? `تم الاحتفال بعيد ميلاد ${child.first_name} الـ ${birthday.turning_age} بنجاح !`
                          : `Les ${birthday.turning_age} ans de ${child.first_name} ont été célébrés avec succès !`}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900/80">
                      {isRTL
                        ? 'تفضلوا بمشاهدة ألبوم الذكريات لاستعادة أجواء الحفل وتحميل صوركم (متاحة لمدة 30 يوماً، ثم كذكرى سنوية).'
                        : `Consultez le diaporama souvenir pour revivre la fête et télécharger vos photos (disponibles pendant 30 jours, puis l'année prochaine en souvenir).`}
                    </p>
                  </div>
                ) : (
                  /* CAS 3 : WIZARD EN 3 ÉTAPES SUR UNE SEULE LIGNE */
                  <div className="space-y-3">
                    {/* Bannière de modification en cours si changingMind */}
                    {changingMind && (
                      <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-xs">
                        <span className="font-bold flex items-center gap-1.5 min-w-0 truncate">
                          <span>✏️</span>
                          <span className="truncate">
                            {isRTL ? 'تعديل الاختيار قيد التنفيذ' : 'Modification du choix en cours'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setChangingMind(false);
                            setWizardStep(1);
                          }}
                          className="compact-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-extrabold whitespace-nowrap shrink-0 shadow-sm transition"
                          style={{ minHeight: 'auto', padding: '0.25rem 0.6rem' }}
                        >
                          <span>{isRTL ? 'إلغاء التعديل' : 'Annuler la modification'}</span>
                        </button>
                      </div>
                    )}

                    {/* Barre de progression 3 étapes sur une seule ligne */}
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 overflow-x-auto">
                      <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-1.5 sm:gap-2.5 text-xs font-extrabold whitespace-nowrap min-w-0">
                        {/* Étape 1 : Choisir */}
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="compact-btn inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          style={{ minHeight: 'auto', padding: 0 }}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-[11px] font-extrabold ${
                              wizardStep === 1
                                ? 'bg-rose-500 text-white'
                                : wizardStep > 1
                                ? 'bg-emerald-500 text-white'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {wizardStep > 1 ? '✓' : isRTL ? '١' : '1'}
                          </span>
                          <span
                            className={`whitespace-nowrap ${
                              wizardStep === 1 ? 'text-stone-900' : 'text-stone-500'
                            }`}
                          >
                            {isRTL ? 'الاختيار' : 'Choisir'}
                          </span>
                        </button>

                        {isRTL ? (
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        )}

                        {/* Étape 2 : Valider */}
                        <button
                          type="button"
                          disabled={!selectedDecision}
                          onClick={() => selectedDecision && setWizardStep(2)}
                          className="compact-btn inline-flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-60"
                          style={{ minHeight: 'auto', padding: 0 }}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-[11px] font-extrabold ${
                              wizardStep === 2
                                ? 'bg-rose-500 text-white'
                                : wizardStep > 2
                                ? 'bg-emerald-500 text-white'
                                : 'bg-stone-200 text-stone-500'
                            }`}
                          >
                            {wizardStep > 2 ? '✓' : isRTL ? '٢' : '2'}
                          </span>
                          <span
                            className={`whitespace-nowrap ${
                              wizardStep === 2 ? 'text-stone-900' : 'text-stone-400'
                            }`}
                          >
                            {isRTL ? 'التأكيد' : 'Valider'}
                          </span>
                        </button>

                        {isRTL ? (
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        )}

                        {/* Étape 3 : Envoyer */}
                        <button
                          type="button"
                          disabled={!selectedDecision || wizardStep < 2}
                          onClick={() => selectedDecision && setWizardStep(3)}
                          className="compact-btn inline-flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-60"
                          style={{ minHeight: 'auto', padding: 0 }}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-[11px] font-extrabold ${
                              wizardStep === 3
                                ? 'bg-rose-500 text-white'
                                : 'bg-stone-200 text-stone-500'
                            }`}
                          >
                            {isRTL ? '٣' : '3'}
                          </span>
                          <span
                            className={`whitespace-nowrap ${
                              wizardStep === 3 ? 'text-stone-900' : 'text-stone-400'
                            }`}
                          >
                            {isRTL ? 'الإرسال' : 'Envoyer'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ÉTAPE 1 : 1 CHOISIR (Oui / Non) */}
                    {wizardStep === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Carte OUI */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDecision('yes');
                            setWizardStep(2);
                          }}
                          className="text-start p-4 rounded-2xl border-2 border-stone-200 hover:border-rose-400 hover:bg-rose-50/40 bg-white transition group shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-2xl">🎂</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                isLateWindow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isLateWindow
                                ? isRTL
                                  ? 'موافقة الإدارة'
                                  : 'Accord Direction'
                                : isRTL
                                ? 'التالي ‹'
                                : 'Suivant ›'}
                            </span>
                          </div>
                          <div className="font-extrabold text-stone-900 text-sm sm:text-base group-hover:text-rose-600 transition">
                            {isRTL ? 'نعم، سنحتفل في الروضة !' : 'Oui, on fête à la crèche !'}
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">
                            {isLateWindow
                              ? isRTL
                                ? 'طلب متأخر (< 5 أيام) خاضع لموافقة الإدارة.'
                                : "Demande tardive (< 5j) soumise à l'accord de la direction."
                              : isRTL
                              ? 'اختيار اليوم المحدد والخصوصية.'
                              : 'Choisir le jour souhaité et la visibilité.'}
                          </p>
                        </button>

                        {/* Carte NON */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDecision('no');
                            setWizardStep(2);
                          }}
                          className="text-start p-4 rounded-2xl border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50 bg-white transition group shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-2xl">🏠</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 whitespace-nowrap">
                              {isRTL ? 'عائلي ‹' : 'En famille ›'}
                            </span>
                          </div>
                          <div className="font-extrabold text-stone-900 text-sm sm:text-base">
                            {isRTL ? 'لا، لا شيء للتحضير' : 'Non, rien à prévoir'}
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">
                            {isRTL
                              ? 'الاحتفال مع العائلة فقط هذه السنة.'
                              : 'Fête uniquement en famille cette année.'}
                          </p>
                        </button>
                      </div>
                    )}

                    {/* ÉTAPE 2 : 2 VALIDER (Choix du jour + Visibilité si Oui, ou Confirmation si Non) */}
                    {wizardStep === 2 && selectedDecision === 'no' && (
                      <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-stone-800">
                            <span>{isRTL ? '🏠 الاختيار :' : '🏠 Choix :'}</span>
                            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">
                              {isRTL ? 'لا، لا شيء للتحضير' : 'Non, rien à prévoir'}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">
                          {isRTL ? (
                            <>
                              اخترتم الاحتفال بعيد الميلاد عائلياً فقط.{' '}
                              {isBeforeJ5 ? (
                                <span className="text-stone-500">
                                  (💡 يمكنكم تغيير رأيكم حتى ي-5).
                                </span>
                              ) : (
                                <span className="text-amber-700 font-semibold">
                                  (⚠️ اختيار نهائي لأن ي-{daysUntil} &lt; 5 أيام).
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              Vous avez choisi de fêter l&apos;anniversaire uniquement en famille.{' '}
                              {isBeforeJ5 ? (
                                <span className="text-stone-500">
                                  (💡 Vous pourrez encore changer d&apos;avis jusqu&apos;à J-5).
                                </span>
                              ) : (
                                <span className="text-amber-700 font-semibold">
                                  (⚠️ Choix définitif car J-{daysUntil} &lt; 5j).
                                </span>
                              )}
                            </>
                          )}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className="compact-btn inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs whitespace-nowrap shrink-0 transition"
                            style={{ minHeight: 'auto', padding: '0.5rem 0.875rem' }}
                          >
                            {isRTL ? (
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{isRTL ? 'رجوع' : 'Retour'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="compact-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs whitespace-nowrap shrink-0 shadow-sm transition"
                            style={{ minHeight: 'auto', padding: '0.5rem 1rem' }}
                          >
                            <span>{isRTL ? 'تأكيد' : 'Valider'}</span>
                            {isRTL ? (
                              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {wizardStep === 2 && selectedDecision === 'yes' && (
                      <div className="rounded-2xl bg-[#FFF9F4] border border-rose-200/80 p-3.5 sm:p-4 space-y-3">
                        {/* 1. Choix du jour souhaité */}
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
                            {isRTL ? '١. اليوم المفضل للاحتفال :' : '1. Jour souhaité pour la fête :'}
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            {(suggested_days || []).map((dayOption) => {
                              const active = celebrationDay === dayOption.date;
                              const disp = formatDayOptionDisplay(dayOption, isRTL);
                              return (
                                <button
                                  key={dayOption.date}
                                  type="button"
                                  onClick={() => handleDayChange(dayOption.date)}
                                  className={`compact-btn px-2.5 py-2 rounded-xl border text-start transition ${
                                    active
                                      ? 'border-rose-500 bg-rose-500 text-white font-bold shadow-sm'
                                      : 'border-stone-200 bg-white text-stone-700 hover:border-rose-300'
                                  }`}
                                >
                                  <div className="text-xs font-bold leading-tight truncate">
                                    {disp.icon} {disp.label}
                                  </div>
                                  <div
                                    className={`text-[10px] ${
                                      active ? 'text-rose-100' : 'text-stone-400'
                                    }`}
                                  >
                                    {dayOption.date}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Toggle Visibilité */}
                        <div className="rounded-xl bg-white border border-rose-200/90 p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                                  {isRTL ? '٢. إعلام الأولياء الآخرين ؟' : '2. Informer les autres parents ?'}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                    notifyOtherParents
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {notifyOtherParents
                                    ? isRTL
                                      ? '🌍 عام'
                                      : '🌍 Public'
                                    : isRTL
                                    ? '🔒 خاص'
                                    : '🔒 Privé'}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                                {notifyOtherParents
                                  ? isRTL
                                    ? 'مرئي لجميع الأولياء في الروزنامة.'
                                    : 'Visible par tous les parents dans le calendrier.'
                                  : isRTL
                                  ? 'مرئي فقط لكم، وللفريق التربوي والإدارة.'
                                  : 'Visible uniquement par vous, le staff et la direction.'}
                              </p>
                            </div>

                            <div
                              role="switch"
                              tabIndex={0}
                              aria-checked={notifyOtherParents}
                              aria-label={isRTL ? 'إعلام أولياء الروضة الآخرين' : 'Informer les autres parents de la crèche'}
                              onClick={() => {
                                if (!togglingVisibility) {
                                  handleToggleNotifyOtherParents(!notifyOtherParents);
                                }
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !togglingVisibility) {
                                  e.preventDefault();
                                  handleToggleNotifyOtherParents(!notifyOtherParents);
                                }
                              }}
                              style={{
                                width: '48px',
                                height: '26px',
                                minWidth: '48px',
                                minHeight: '26px',
                                maxHeight: '26px',
                                padding: '3px',
                                borderRadius: '9999px',
                                backgroundColor: notifyOtherParents ? '#F43F5E' : '#D6D3D1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: togglingVisibility ? 'wait' : 'pointer',
                                transition: 'background-color 0.2s ease-in-out',
                                flexShrink: 0,
                                boxSizing: 'border-box'
                              }}
                            >
                              <span
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#FFFFFF',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                  transform: notifyOtherParents
                                    ? isRTL
                                      ? 'translateX(-22px)'
                                      : 'translateX(22px)'
                                    : 'translateX(0px)',
                                  transition: 'transform 0.2s ease-in-out',
                                  display: 'block'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Navigation Étape 2 -> Étape 3 */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className="compact-btn inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs whitespace-nowrap shrink-0 transition"
                            style={{ minHeight: 'auto', padding: '0.5rem 0.875rem' }}
                          >
                            {isRTL ? (
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{isRTL ? 'رجوع' : 'Retour'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="compact-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs whitespace-nowrap shrink-0 shadow-sm transition"
                            style={{ minHeight: 'auto', padding: '0.5rem 1rem' }}
                          >
                            <span>{isRTL ? 'تأكيد' : 'Valider'}</span>
                            {isRTL ? (
                              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 3 : 3 ENVOYER */}
                    {wizardStep === 3 && selectedDecision === 'no' && (
                      <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5 sm:p-4 space-y-3">
                        <div className="text-xs font-extrabold text-stone-800">
                          {isRTL ? '٣. إرسال التأكيد إلى الإدارة :' : '3. Envoyer la confirmation à la Direction :'}
                        </div>
                        <p className="text-xs text-stone-600">
                          {isRTL
                            ? 'اضغطوا أدناه لتسجيل اختياركم وإعلام الروضة عبر واتساب أو برسالة قصيرة SMS.'
                            : 'Cliquez ci-dessous pour enregistrer votre choix et prévenir la crèche sur WhatsApp ou par SMS.'}
                        </p>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className="compact-btn inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs whitespace-nowrap shrink-0 transition"
                            style={{ minHeight: 'auto', padding: '0.55rem 0.75rem' }}
                          >
                            {isRTL ? (
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{isRTL ? 'رجوع' : 'Retour'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSaveDecision('no', 'whatsapp')}
                            className="compact-btn flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-extrabold text-xs whitespace-nowrap shadow-md transition"
                            style={{ minHeight: 'auto', padding: '0.55rem 0.75rem' }}
                          >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>
                              {submitting
                                ? isRTL
                                  ? 'جارٍ الإرسال...'
                                  : 'Envoi...'
                                : isRTL
                                ? 'واتساب'
                                : 'WhatsApp'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSaveDecision('no', 'sms')}
                            className="compact-btn w-full sm:w-auto sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs whitespace-nowrap shadow transition"
                            style={{ minHeight: 'auto', padding: '0.55rem 0.75rem' }}
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRTL ? 'رسالة قصيرة SMS' : 'SMS'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && selectedDecision === 'yes' && (
                      <div className="rounded-2xl bg-[#FFF9F4] border border-rose-200/80 p-3.5 sm:p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs bg-white rounded-xl px-3 py-2 border border-rose-100">
                          <span className="font-bold text-stone-800 truncate">
                            📅{' '}
                            {formatChosenDayLabel(celebrationDay, suggested_days, isRTL)}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 whitespace-nowrap">
                            {notifyOtherParents
                              ? isRTL
                                ? '🌍 عام'
                                : '🌍 Public'
                              : isRTL
                              ? '🔒 خاص'
                              : '🔒 Privé'}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1">
                            {isRTL
                              ? '٣. رسالة جاهزة للإدارة :'
                              : '3. Message pré-rempli pour la Direction :'}
                          </label>
                          <textarea
                            rows={2}
                            value={parentNotes}
                            onChange={(e) => setParentNotes(e.target.value)}
                            className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className="compact-btn inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs whitespace-nowrap shrink-0 transition"
                            style={{ minHeight: 'auto', padding: '0.55rem 0.75rem' }}
                          >
                            {isRTL ? (
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{isRTL ? 'رجوع' : 'Retour'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSaveDecision('yes', 'whatsapp')}
                            className="compact-btn flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-extrabold text-xs whitespace-nowrap shadow-md transition"
                            style={{ minHeight: 'auto', padding: '0.55rem 0.75rem' }}
                          >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>
                              {submitting
                                ? isRTL
                                  ? 'جارٍ الإرسال...'
                                  : 'Envoi...'
                                : isRTL
                                ? 'واتساب'
                                : 'WhatsApp'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSaveDecision('yes', 'sms')}
                            className="compact-btn w-full sm:w-auto sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs whitespace-nowrap shadow transition"
                            style={{ minHeight: 'auto', padding: '0.55rem 0.75rem' }}
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRTL ? 'رسالة قصيرة SMS' : 'SMS'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : viewRole === 'staff_assigne' || viewRole === 'staff_non_assigne' ? (
              /* ==================== VUE STAFF (ASSIGNÉ OU NON ASSIGNÉ) ==================== */
              <div className="bg-white rounded-3xl border border-emerald-200 p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap ${
                        viewRole === 'staff_assigne'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {viewRole === 'staff_assigne'
                        ? isRTL
                          ? '👩‍🏫 عرض الموظف المكلّف بالتحضير'
                          : '👩‍🏫 VUE STAFF ASSIGNÉ À LA PRÉPARATION'
                        : isRTL
                        ? '🧑‍🏫 الفريق التربوي'
                        : '🧑‍🏫 Équipe éducative'}
                    </span>
                    {celebration?.assigned_staff_first_name && (
                      <span className="text-xs font-semibold text-stone-600">
                        {isRTL ? 'المسؤول المكلّف : ' : 'Responsable désigné : '}
                        <strong className="text-stone-900">
                          {celebration.assigned_staff_first_name}{' '}
                          {celebration.assigned_staff_last_name || ''}
                        </strong>
                      </span>
                    )}
                  </div>

                  <Link
                    to="/dashboard/tasks"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'عرض في مهامي (/dashboard/tasks)' : 'Voir dans Mes Tâches (/dashboard/tasks)'}</span>
                  </Link>
                </div>

                {/* Carte de la tâche de préparation auprès du Staff */}
                {celebration?.decision_status === 'no' ? (
                  <div
                    className={`rounded-2xl p-4 sm:p-5 space-y-2 border-2 ${
                      isCancelledByParent
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
                      <XCircle
                        className={`w-5 h-5 shrink-0 ${
                          isCancelledByParent ? 'text-rose-600' : 'text-stone-500'
                        }`}
                      />
                      <span>
                        {isCancelledByParent
                          ? isRTL
                            ? '🚫 تم إلغاء حفل عيد الميلاد من قِبل الولي'
                            : "🚫 Fête d'anniversaire annulée par le parent"
                          : isRTL
                          ? '🏠 الاحتفال عائلياً فقط في المنزل'
                          : '🏠 Anniversaire fêté uniquement en famille'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {isCancelledByParent
                        ? isRTL
                          ? `قام ولي أمر ${child.first_name} بإلغاء تنظيم الحفل في الروضة. تم إلغاء مهمة التحضير ومناسبة الروزنامة تلقائياً.`
                          : `Le parent de ${child.first_name} a annulé l'organisation de la fête à la crèche. La tâche de préparation et l'événement calendrier ont été automatiquement annulés.`
                        : isRTL
                        ? `أشار الولي إلى أن عيد ميلاد ${child.first_name} سيُحتفل به عائلياً فقط. لا يلزم أي تحضير في الروضة.`
                        : `Le parent a indiqué que l'anniversaire de ${child.first_name} sera fêté uniquement à la maison. Aucune préparation n'est requise à la crèche.`}
                    </p>
                  </div>
                ) : viewRole === 'staff_assigne' ? (
                  <div className="rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                        <span>{isRTL ? 'مهمة مسندة من الإدارة' : 'Tâche assignée par la Direction'}</span>
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          celebration?.assigned_task?.status === 'completed' ||
                          celebration?.decision_status === 'celebrated'
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {celebration?.assigned_task?.status === 'completed' ||
                        celebration?.decision_status === 'celebrated'
                          ? isRTL
                            ? '✅ مكتملة'
                            : '✅ Terminée'
                          : isRTL
                          ? '⏳ قيد التحضير'
                          : '⏳ À préparer'}
                      </span>
                    </div>

                    <div className="text-sm sm:text-base font-extrabold text-stone-900">
                      {isRTL
                        ? `🎂 تحضير عيد ميلاد ${child.first_name} (${birthday.turning_age} سنوات) — ${
                            celebration?.celebration_date
                              ? String(celebration.celebration_date).slice(0, 10)
                              : celebrationDay || birthday.this_year_date
                          }`
                        : `🎂 Préparer l'anniversaire de ${child.first_name} (${birthday.turning_age} ans) — ${
                            celebration?.celebration_date
                              ? String(celebration.celebration_date).slice(0, 10)
                              : celebrationDay || birthday.this_year_date
                          }`}
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 bg-white/90 rounded-xl p-3 border border-emerald-200 leading-relaxed">
                      {celebration?.admin_task_notes || adminTaskText}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-emerald-900 font-semibold">
                        {isRTL
                          ? '📍 معروضة أيضاً في ويدجت «مهام اليوم» وصفحة مهام الموظفين.'
                          : '📍 Visible aussi dans le widget « Tâches du jour » et la page Tâches du staff.'}
                      </span>
                      {celebration?.assigned_task?.status !== 'completed' && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleAdminAction('complete_staff_task')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isRTL ? '✅ تحديد المهمة كمكتملة' : '✅ Marquer la tâche comme terminée'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 space-y-2">
                    <div className="text-sm font-extrabold text-sky-950">
                      {isRTL
                        ? 'ℹ️ معلومة للفريق التربوي (موظف غير مكلّف)'
                        : 'ℹ️ Information Équipe Éducative (Staff non assigné)'}
                    </div>
                    <p className="text-xs sm:text-sm text-sky-900 leading-relaxed">
                      {isRTL ? (
                        <>
                          تشاهدون عيد ميلاد <strong>{child.first_name}</strong> في روزنامة الروضة
                          (لأن مناسبات أعياد الميلاد معروضة لكامل الفريق التربوي)، ولكن مهمة التحضير
                          مسندة إلى{' '}
                          <strong>
                            {celebration?.assigned_staff_first_name
                              ? `${celebration.assigned_staff_first_name} ${celebration.assigned_staff_last_name || ''}`
                              : 'زميل حددته الإدارة'}
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          Vous voyez l&apos;anniversaire de <strong>{child.first_name}</strong> dans le
                          calendrier de la crèche (car les événements d&apos;anniversaire sont visibles par
                          toute l&apos;équipe éducative), mais la tâche de préparation est assignée à{' '}
                          <strong>
                            {celebration?.assigned_staff_first_name
                              ? `${celebration.assigned_staff_first_name} ${celebration.assigned_staff_last_name || ''}`
                              : 'un collègue désigné par la direction'}
                          </strong>
                          .
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Visibilité en lecture seule pour le Staff */}
                {celebration?.decision_status !== 'no' && (
                  <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-stone-500 font-semibold">
                        {isRTL ? 'الخصوصية المحددة من الولي : ' : 'Visibilité choisie par le parent : '}
                      </span>
                      <strong className="text-stone-800">
                        {notifyOtherParents
                          ? isRTL
                            ? '🌍 مشارك مع جميع الأولياء'
                            : '🌍 Partagé à tous les parents'
                          : isRTL
                          ? '🔒 خاص (الولي المعني + الفريق + الإدارة)'
                          : '🔒 Privé (Parent concerné + Staff + Admin)'}
                      </strong>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-stone-200/80 text-stone-700 font-bold text-[11px]">
                      {isRTL
                        ? '🔒 الولي المعني فقط يمكنه تعديل الخصوصية'
                        : '🔒 Seul le parent concerné peut modifier la visibilité'}
                    </span>
                  </div>
                )}

                {/* Uploader pratique multi-photos pour le Staff */}
                {celebration?.decision_status !== 'no' &&
                  (isCelebrationDayReached || hasMemories ? (
                    <form
                      onSubmit={handleAddMemoryPhoto}
                      className="space-y-3 pt-3 border-t border-stone-200"
                    >
                      <h3 className="text-sm font-extrabold text-stone-800 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-purple-600" />
                        <span>
                          {isRTL
                            ? '📸 إضافة صور إلى ألبوم الذكريات (إشعار الولي لمدة 30 يوماً والنشر في الأنشطة)'
                            : "📸 Ajouter des photos depuis l'ordinateur ou téléphone (Diaporama Parent & Activités)"}
                        </span>
                      </h3>

                      <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 p-4 cursor-pointer transition text-center">
                        <Upload className="w-6 h-6 text-purple-600" />
                        <div className="text-xs sm:text-sm font-extrabold text-purple-900">
                          {isRTL
                            ? '📂 اختيار صورة أو عدة صور من الحاسوب / الهاتف'
                            : 'Cliquez pour choisir une ou plusieurs photos depuis votre ordinateur / mobile'}
                        </div>
                        <span className="text-[11px] text-purple-700">
                          {isRTL
                            ? 'دعم اختيار عدة صور (JPG, PNG, WEBP) — معاينة فورية قبل النشر'
                            : 'Formats JPG, PNG, WEBP · Sélection multiple supportée'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleSelectPhotoFiles}
                          className="hidden"
                        />
                      </label>

                      {selectedPhotoFiles.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {selectedPhotoFiles.map((item, idx) => (
                            <div
                              key={`${item.name}-${idx}`}
                              className="relative rounded-xl overflow-hidden border border-purple-200 aspect-video bg-stone-100 group"
                            >
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedPhoto(idx)}
                                className="compact-btn absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow"
                                title={isRTL ? 'حذف هذه الصورة' : 'Retirer cette photo'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder={
                          isRTL
                            ? `تعليق (مثال: عيد ميلاد سعيد ${child.first_name} 🎂)`
                            : `Légende du diaporama (ex: Joyeux anniversaire ${child.first_name} 🎂)`
                        }
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm"
                      />

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="submit"
                          disabled={submitting || selectedPhotoFiles.length === 0}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {submitting
                              ? isRTL
                                ? 'جارٍ النشر...'
                                : 'Publication en cours...'
                              : isRTL
                              ? `📸 نشر ${selectedPhotoFiles.length || ''} صورة وإشعار الولي`
                              : `📸 Publier ${selectedPhotoFiles.length || ''} photo(s) & Notifier le parent`}
                          </span>
                        </button>

                        {hasMemories && (
                          <Link
                            to="/activites"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-extrabold transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{isRTL ? '🔗 عرض الألبوم في صفحة الأنشطة' : '🔗 Voir le diaporama dans la page Activités'}</span>
                          </Link>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-2xl bg-purple-50/70 border border-purple-200/80 p-3.5 flex items-center gap-3 text-xs text-purple-900">
                      <Camera className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        {isRTL
                          ? '📸 إضافة صور الذكريات (ألبوم الولي 30 يوماً والنشر في الأنشطة) ستُفعّل في يوم الحفل (يوم ي).'
                          : "📸 Le dépôt des photos souvenirs (diaporama parent 30j & publication dans Activités) s'activera le jour de la fête (Jour J)."}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              /* ==================== VUE DIRECTION / ADMIN ==================== */
              <div className="bg-white rounded-3xl border border-amber-200 p-5 sm:p-7 shadow-sm space-y-5">
                {/* En-tête Tâche Urgente Direction */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    {isCancelledByParent ? (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold uppercase tracking-wider">
                        🚫 Annulé par le parent
                      </span>
                    ) : celebration?.decision_status === 'no' ? (
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-extrabold uppercase tracking-wider">
                        🏠 Fête en famille (Rien à prévoir)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold uppercase tracking-wider">
                        🚨 Organisation Direction
                      </span>
                    )}
                    <span className="text-xs font-semibold text-stone-500">
                      Statut parent :{' '}
                      <strong className="text-stone-800 uppercase">
                        {isCancelledByParent
                          ? 'ANNULÉ (NO)'
                          : celebration?.decision_status || 'En attente'}
                      </strong>
                    </span>
                  </div>

                  {/* Action 1 : Appeler le parent */}
                  <a
                    href={`tel:${child.parent_phone || '+21622334455'}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>
                      {isRTL ? (
                        <>الاتصال بـ {child.parent_first_name || 'الولي'} ({child.parent_phone || '+216 22 334 455'})</>
                      ) : (
                        <>Appeler {child.parent_first_name || 'le parent'} ({child.parent_phone || '+216 22 334 455'})</>
                      )}
                    </span>
                  </a>
                </div>

                {/* Bannière explicite si le parent a annulé ou choisi Non */}
                {celebration?.decision_status === 'no' && (
                  <div
                    className={`rounded-2xl p-4 border-2 space-y-1.5 ${
                      isCancelledByParent
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-extrabold">
                      <XCircle
                        className={`w-5 h-5 shrink-0 ${
                          isCancelledByParent ? 'text-rose-600' : 'text-stone-500'
                        }`}
                      />
                      <span>
                        {isRTL
                          ? (isCancelledByParent
                              ? '🚫 قام الولي بإلغاء تنظيم الحفل في الروضة'
                              : '🏠 اختار الولي الاحتفال بعيد الميلاد عائلياً فقط')
                          : (isCancelledByParent
                              ? `🚫 Le parent a annulé l'organisation de la fête à la crèche`
                              : `🏠 Le parent a choisi de fêter l'anniversaire uniquement en famille`)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {isRTL
                        ? (isCancelledByParent
                            ? 'تم إلغاء كافة المهام المرتبطة (الإدارة والفريق) ومناسبة الروزنامة تلقائياً. كما تم إشعار الموظف المكلّف.'
                            : 'لا توجد أي مهام تحضير أو مناسبة روزنامة مطلوبة من الروضة.')
                        : (isCancelledByParent
                            ? `Toutes les tâches associées (Direction et Staff) ainsi que l'événement du calendrier ont été automatiquement annulés. Le membre du staff précédemment assigné a également été notifié.`
                            : `Aucune tâche de préparation ni aucun événement calendrier ne sont requis pour la crèche.`)}
                    </p>
                  </div>
                )}

                {/* Résumé de la demande du parent + Statut table `events` */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-xs sm:text-sm">
                  <div>
                    <span className="text-stone-400 font-semibold block">{isRTL ? 'الطفل والعمر :' : 'Enfant & Âge :'}</span>
                    <span className="font-bold text-stone-800">
                      {child.first_name} {child.last_name} ({birthday.turning_age} {isRTL ? 'سنوات' : 'ans'})
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-semibold block">
                      {isRTL ? 'اليوم المطلوب للحفل :' : 'Jour demandé pour la fête :'}
                    </span>
                    <span className="font-bold text-rose-600">
                      {celebration?.decision_status === 'no'
                        ? (isRTL ? 'لا يوجد (احتفال عائلي)' : 'Aucun (Fête en famille)')
                        : celebration?.celebration_date
                        ? String(celebration.celebration_date).slice(0, 10)
                        : celebrationDay || birthday.this_year_date}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-stone-400 font-semibold block">
                      {isRTL ? 'ملاحظات طبية / حساسية :' : 'Notes médicales / Allergies :'}
                    </span>
                    <span className="font-semibold text-stone-700">
                      {child.allergies || child.medical_notes || (isRTL ? 'لا توجد حساسية مسجلة' : 'Aucune allergie signalée')}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-stone-400 font-semibold block">
                        {isRTL ? 'مناسبة الروزنامة والخصوصية :' : 'Événement calendrier & Visibilité :'}
                      </span>
                      <div className="font-bold text-stone-800">
                        {celebration?.decision_status === 'yes' ||
                        celebration?.decision_status === 'celebrated' ? (
                          notifyOtherParents ? (
                            <span className="text-emerald-700">
                              {isRTL ? '🌍 ظاهر لجميع الأولياء (وفق اختيار الولي المعني)' : '🌍 Affiché à tous les parents (choix du parent concerné)'}
                            </span>
                          ) : (
                            <span className="text-amber-800">
                              {isRTL ? '🔒 ظاهر فقط للولي المعني والفريق التربوي والإدارة' : '🔒 Affiché uniquement au parent concerné, au staff et à l\'admin'}
                            </span>
                          )
                        ) : (
                          <span className="text-stone-500">
                            {isRTL
                              ? `لا توجد مناسبة نشطة (قرار الولي : ${isCancelledByParent ? 'ملغى من الولي' : celebration?.decision_status || 'قيد الانتظار'})`
                              : `Aucun événement actif (décision parent : ${isCancelledByParent ? 'annulé par le parent' : celebration?.decision_status || 'en attente'})`}
                          </span>
                        )}
                      </div>
                      {celebration?.created_event?.id && celebration?.decision_status !== 'no' && (
                        <div className="inline-flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isRTL ? '✅ المناسبة مسجلة في الروزنامة' : '✅ Événement inscrit au calendrier'}</span>
                          <Link
                            to="/dashboard/events/calendar"
                            className="underline font-extrabold hover:text-emerald-950"
                          >
                            {isRTL ? 'عرض الروزنامة' : 'Voir calendrier'}
                          </Link>
                        </div>
                      )}
                    </div>
                    {/* RÈGLE STRICTE : L'admin n'a PAS le droit de publier l'événement à tous les parents */}
                    <span className="px-3 py-1.5 rounded-xl bg-stone-200/80 text-stone-700 text-[11px] font-bold">
                      {isRTL ? '🔒 خيار النشر مخصص حصرياً للولي المعني' : '🔒 Choix de publication réservé au parent concerné'}
                    </span>
                  </div>
                  {celebration?.parent_notes && (
                    <div className="sm:col-span-2 pt-1 border-t border-stone-200">
                      <span className="text-stone-400 font-semibold block">
                        {isRTL ? 'رسالة الولي :' : 'Message du parent :'}
                      </span>
                      <p className="italic text-stone-700">« {celebration.parent_notes} »</p>
                    </div>
                  )}
                </div>

                {/* Action 2 : Accepter ou Refuser si demande tardive (< 5 jours, même J-1) */}
                {celebration?.decision_status !== 'no' &&
                  (isLateWindow || celebration?.is_late_request) && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-amber-950">
                          <span className="font-extrabold">
                            {isRTL
                              ? `قرار الإدارة (طلب في أقل من 5 أيام — ي-${daysUntil}) :`
                              : `Décision de la Direction (Demande à moins de 5 jours — J-${daysUntil}) :`}
                          </span>
                          <p className="mt-0.5">
                            {isRTL
                              ? 'حتى في ي-1، القرار يعود إليكم. هل توافقون على تنظيم الحفل في الروضة؟'
                              : 'Même à J-1, la décision vous appartient. Acceptez-vous d\'organiser la fête à la crèche ?'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleAdminAction('accept')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isRTL ? '✅ قبول الطلب المتأخر' : '✅ Accepter la demande tardive'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleAdminAction('reject')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{isRTL ? '❌ رفض (الأجل قصير جداً)' : '❌ Refuser (Délai trop court)'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                {/* Action 3 : Assigner la tâche à un membre du staff avec texte pré-rempli */}
                {celebration?.decision_status !== 'no' && (
                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-stone-800 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-rose-500" />
                        <span>{isRTL ? 'إسناد مهمة التحضير إلى موظف' : 'Assigner la tâche de préparation à un membre du staff'}</span>
                      </h3>
                      {celebration?.assigned_staff_first_name && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {isRTL
                              ? `مسندة إلى ${celebration.assigned_staff_first_name} ${celebration.assigned_staff_last_name || ''}`
                              : `Assignée à ${celebration.assigned_staff_first_name} ${celebration.assigned_staff_last_name || ''}`}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-1">
                          {isRTL ? 'عضو الفريق التربوي :' : 'Membre de l\'équipe éducative :'}
                        </label>
                        <select
                          value={assignedStaffId}
                          onChange={(e) => setAssignedStaffId(e.target.value)}
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-stone-800"
                        >
                          {(staff_list || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} ({s.role})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-1">
                          {isRTL ? 'التاريخ المعتمد للحفل :' : 'Date retenue pour la fête :'}
                        </label>
                        <input
                          type="date"
                          value={celebrationDay}
                          onChange={(e) => setCelebrationDay(e.target.value)}
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-stone-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">
                        {isRTL
                          ? 'تعليمات المهمة (مكتوبة مسبقاً، قابلة للتعديل من الإدارة) :'
                          : 'Instructions de la tâche (pré-remplies, modifiables par l\'admin) :'}
                      </label>
                      <textarea
                        rows={3}
                        value={adminTaskText}
                        onChange={(e) => setAdminTaskText(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs sm:text-sm text-stone-800 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleAdminAction('assign_staff')}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {submitting
                            ? (isRTL ? 'جارٍ الإسناد...' : 'Assignation en cours...')
                            : (isRTL ? '✅ تأكيد وإسناد المهمة للموظف' : '✅ Valider & Assigner la tâche au staff')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action 4 : Sélecteur multi-photos sur ordinateur/mobile + Partage page Activités
                    S'affiche uniquement à partir du Jour J (ou si l'enfant a déjà des photos souvenirs) */}
                {celebration?.decision_status !== 'no' &&
                  (isCelebrationDayReached || hasMemories ? (
                    <form
                      onSubmit={handleAddMemoryPhoto}
                      className="space-y-3 pt-4 border-t border-stone-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-stone-800 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span>
                            {isRTL
                              ? 'إضافة صور إلى ألبوم الذكريات (إشعار للولي لمدة 30 يوماً ونشر في الأنشطة)'
                              : 'Ajouter des photos au diaporama souvenir (notifie le parent 30j & publie dans Activités)'}
                          </span>
                        </h3>
                      </div>

                      {/* Zone Drag & Drop / File Picker depuis l'ordinateur */}
                      <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 p-4 cursor-pointer transition text-center">
                        <Upload className="w-6 h-6 text-purple-600" />
                        <div className="text-xs sm:text-sm font-extrabold text-purple-900">
                          {isRTL
                            ? '📂 اختيار صورة أو عدة صور من الحاسوب / الهاتف'
                            : '📂 Choisir une ou plusieurs photos depuis votre ordinateur / téléphone'}
                        </div>
                        <span className="text-[11px] text-purple-700">
                          {isRTL
                            ? 'يدعم الاختيار المتعدد (JPG, PNG, WEBP) — معاينة فورية قبل الإرسال'
                            : 'Sélection multiple supportée (JPG, PNG, WEBP) — Aperçu immédiat avant envoi'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleSelectPhotoFiles}
                          className="hidden"
                        />
                      </label>

                      {/* Aperçu des photos sélectionnées */}
                      {selectedPhotoFiles.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {selectedPhotoFiles.map((item, idx) => (
                            <div
                              key={`${item.name}-${idx}`}
                              className="relative rounded-xl overflow-hidden border border-purple-200 aspect-video bg-stone-100"
                            >
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedPhoto(idx)}
                                className="compact-btn absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow"
                                title={isRTL ? 'حذف هذه الصورة' : 'Retirer cette photo'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder={
                          isRTL
                            ? `تعليق (مثال: ${child.first_name} يطفئ شموعه الـ ${birthday.turning_age} 🎂)`
                            : `Légende (ex: ${child.first_name} souffle ses ${birthday.turning_age} bougies 🎂)`
                        }
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm"
                      />

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="submit"
                          disabled={submitting || selectedPhotoFiles.length === 0}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {submitting
                              ? (isRTL ? 'جارٍ النشر...' : 'Publication en cours...')
                              : (isRTL
                                  ? `📸 نشر ${selectedPhotoFiles.length || ''} صورة وإشعار الولي`
                                  : `📸 Publier ${selectedPhotoFiles.length || ''} photo(s) & Notifier le parent`)}
                          </span>
                        </button>

                        {hasMemories && (
                          <>
                            <button
                              type="button"
                              disabled={sharingActivity}
                              onClick={handleShareSlideshowToActivity}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>
                                {sharingActivity
                                  ? (isRTL ? 'جارٍ النشر...' : 'Publication...')
                                  : (isRTL
                                      ? '📰 نشر / تحديث الألبوم في صفحة الأنشطة'
                                      : '📰 Publier / Mettre à jour le diaporama dans Activités')}
                              </span>
                            </button>

                            <Link
                              to="/activites"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-extrabold transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{isRTL ? '🔗 عرض في صفحة الأنشطة' : '🔗 Voir dans la page Activités'}</span>
                            </Link>
                          </>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-2xl bg-purple-50/70 border border-purple-200/80 p-3.5 flex items-center gap-3 text-xs text-purple-900">
                      <Camera className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        {isRTL
                          ? '📸 إيداع صور الذكريات (ألبوم الولي لمدة 30 يوماً والنشر في الأنشطة) يُفعّل يوم الحفل (يوم الحفل).'
                          : '📸 Le dépôt des photos souvenirs (diaporama parent 30j & publication dans Activités) s\'activera le jour de la fête (Jour J).'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* COLONNE DROITE : WIDGET DIAPORAMA SOUVENIRS
              RÈGLE STRICTE : N'apparaît QUE lorsque l'enfant a des souvenirs (hasMemories === true) ! */}
          {hasMemories && (
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-[#F2E3D5] p-5 sm:p-6 shadow-sm space-y-4">
                {/* Header du widget souvenirs */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isRTL
                        ? (isPostBirthdayMonth
                            ? 'ألبوم متاح لمدة 30 يوماً (ي+1 إلى ي+30)'
                            : `ذكريات السنة الماضية (${new Date().getFullYear() - 1})`)
                        : (isPostBirthdayMonth
                            ? 'Diaporama disponible 30 jours (J+1 à J+30)'
                            : `Souvenirs de l'an dernier (${new Date().getFullYear() - 1})`)}
                    </span>
                    <h3
                      className="text-lg sm:text-xl font-bold text-stone-900"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {isRTL ? `🎞️ ألبوم ذكريات ${child.first_name}` : `🎞️ Album Souvenirs de ${child.first_name}`}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold">
                    {slideIndex + 1} / {memories.items.length}
                  </span>
                </div>

                {/* Story-style progress bars (div role="button" pour garder 6px de hauteur fine) */}
                <div className="flex gap-1.5">
                  {memories.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSlideIndex(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSlideIndex(idx);
                      }}
                      className={`h-1.5 flex-1 rounded-full cursor-pointer transition ${
                        idx === slideIndex
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : idx < slideIndex
                          ? 'bg-rose-300'
                          : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Cadre Photo Diaporama */}
                {currentSlide && (
                  <div className="relative rounded-2xl overflow-hidden bg-stone-900 aspect-[4/3] group shadow-inner">
                    <img
                      src={currentSlide.photo_url}
                      alt={currentSlide.caption || (isRTL ? 'ذكرى عيد ميلاد' : 'Souvenir anniversaire')}
                      className="w-full h-full object-cover transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                    {/* Navigation Prev / Next */}
                    {memories.items.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setSlideIndex(
                              (prev) =>
                                (prev - 1 + memories.items.length) % memories.items.length
                            )
                          }
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-stone-900 flex items-center justify-center shadow transition"
                        >
                          {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSlideIndex((prev) => (prev + 1) % memories.items.length)
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-stone-900 flex items-center justify-center shadow transition"
                        >
                          {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                      </>
                    )}

                    {/* Légende en bas de la photo */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded-full mb-1">
                        {isRTL ? `سنة ${currentSlide.celebration_year}` : `Année ${currentSlide.celebration_year}`}
                      </span>
                      <p className="text-xs sm:text-sm font-bold leading-snug">
                        {currentSlide.caption}
                      </p>
                    </div>
                  </div>
                )}

                {/* Miniatures */}
                {memories.items.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {memories.items.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => setSlideIndex(idx)}
                        className={`rounded-xl overflow-hidden aspect-video border-2 transition ${
                          idx === slideIndex
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={item.photo_url}
                          alt={item.caption || (isRTL ? `صورة ${idx + 1}` : `Photo ${idx + 1}`)}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Boutons Télécharger les photos (Photo actuelle + Tout télécharger) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={downloading || !currentSlide}
                    onClick={() =>
                      downloadPhoto(
                        currentSlide?.photo_url,
                        `anniversaire-${child.first_name.toLowerCase()}-photo-${slideIndex + 1}.jpg`
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isRTL ? '⬇️ تحميل هذه الصورة' : '⬇️ Télécharger cette photo'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloading}
                    onClick={downloadAllPhotos}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-rose-500 hover:opacity-95 text-white font-extrabold text-xs shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isRTL
                        ? `📦 تحميل الكل (${memories.items.length})`
                        : `📦 Tout télécharger (${memories.items.length})`}
                    </span>
                  </button>
                </div>

                {/* Partage & Lien direct vers le diaporama dans la page Activités (à partir de J+1) */}
                <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
                  {(viewRole === 'admin' ||
                    viewRole === 'staff_assigne' ||
                    viewRole === 'staff_non_assigne') && (
                    <button
                      type="button"
                      disabled={sharingActivity}
                      onClick={handleShareSlideshowToActivity}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>
                        {sharingActivity
                          ? (isRTL ? 'جارٍ نشر الألبوم...' : 'Publication du diaporama...')
                          : (isRTL
                              ? '📰 مشاركة / تحديث الألبوم في صفحة الأنشطة'
                              : '📰 Partager / Mettre à jour ce diaporama dans la page Activités')}
                      </span>
                    </button>
                  )}

                  <Link
                    to={
                      viewRole === 'admin' ||
                      viewRole === 'staff_assigne' ||
                      viewRole === 'staff_non_assigne' ||
                      isActualStaff
                        ? '/activites'
                        : '/mon-espace/activities'
                    }
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-extrabold text-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {isRTL
                        ? '🔗 عرض الألبوم في صفحة الأنشطة'
                        : '🔗 Voir la publication du diaporama dans la page Activités'}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BirthdayEventPage;

