import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Stethoscope,
  Users,
  Smile,
  Ruler,
  Camera,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import enrollmentsService from '../../services/enrollmentsService';
import LoadingSpinner from '../ui/LoadingSpinner';

const PreInterviewPreparationModal = ({ isOpen, onClose, application, onUpdated }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();

  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'contacts' | 'habits' | 'documents'
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [habitsNotes, setHabitsNotes] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [documents, setDocuments] = useState([]);

  // État temporaire pour ajouter une personne de confiance
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContactForm, setShowAddContactForm] = useState(false);

  useEffect(() => {
    if (application) {
      setDoctorName(application.doctor_name || '');
      setDoctorPhone(application.doctor_phone || '');
      setAllergies(application.allergies || '');
      setHabitsNotes(application.habits_notes || '');
      setWeightKg(application.weight_kg != null ? String(application.weight_kg) : '');
      setHeightCm(application.height_cm != null ? String(application.height_cm) : '');
      
      let contacts = [];
      if (Array.isArray(application.trusted_contacts)) {
        contacts = application.trusted_contacts;
      } else if (typeof application.trusted_contacts === 'string') {
        try { contacts = JSON.parse(application.trusted_contacts); } catch {}
      }
      setTrustedContacts(contacts);
      setDocuments(application.documents || []);
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleAddTrustedContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      dialog.error(isRTL ? 'يرجى إدخال الاسم ورقم الهاتف' : 'Veuillez saisir le nom et le téléphone');
      return;
    }
    if (trustedContacts.length >= 2) {
      dialog.error(isRTL ? 'الحد الأقصى هو شخصان موثوقان' : 'Maximum 2 personnes de confiance');
      return;
    }
    const updated = [
      ...trustedContacts,
      {
        name: newContactName.trim(),
        relation: newContactRelation.trim() || (isRTL ? 'شخص موثوق' : 'Proche'),
        phone: newContactPhone.trim()
      }
    ];
    setTrustedContacts(updated);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
    setShowAddContactForm(false);
  };

  const handleRemoveTrustedContact = (indexToRemove) => {
    setTrustedContacts(trustedContacts.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSavePreparation = async () => {
    setLoading(true);
    try {
      const res = await enrollmentsService.prepareMyApplication({
        doctor_name: doctorName.trim(),
        doctor_phone: doctorPhone.trim(),
        allergies: allergies.trim(),
        habits_notes: habitsNotes.trim(),
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        trusted_contacts: trustedContacts
      });

      if (res.success) {
        dialog.success(
          isRTL
            ? 'تم حفظ المعلومات بنجاح ! ستكون جاهزة يوم الموعد'
            : 'Informations enregistrées ! Elles seront prêtes le jour de votre rendez-vous.'
        );
        onUpdated?.();
        onClose();
      } else {
        dialog.error(res.error || (isRTL ? 'خطأ في الحفظ' : 'Erreur lors de l\'enregistrement'));
      }
    } catch (err) {
      console.error('Erreur sauvegarde préparation:', err);
      dialog.error(isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await enrollmentsService.uploadMyDocument(file, docType);
      if (res.success && res.document) {
        setDocuments(prev => [res.document, ...prev]);
        dialog.success(isRTL ? 'تم رفع الوثيقة بنجاح' : 'Document téléversé avec succès');
      } else {
        dialog.error(res.error || (isRTL ? 'خطأ في الرفع' : 'Échec du téléversement'));
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      dialog.error(isRTL ? 'تعذر رفع الملف' : 'Impossible de téléverser le fichier');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>✨ {isRTL ? 'تحضير موعد القبول' : 'Préparer mon rendez-vous d\'admission'}</span>
            </h3>
            <p className="text-xs text-primary-100 mt-0.5">
              {application.child_first_name} {application.child_last_name || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rappel du RDV */}
        {application.proposed_date && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/40 px-5 py-2.5 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {isRTL ? 'موعدكم القادم :' : 'Votre rendez-vous :'} <strong>{new Date(application.proposed_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong> ({application.appointment_location || 'Crèche Mima Elghalia'})
            </span>
          </div>
        )}

        {/* Navigation Onglets */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-1.5 gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'health'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>{isRTL ? 'الصحة والطبيب' : 'Pédiatre & Santé'}</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'contacts'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isRTL ? 'أشخاص موثوقون' : 'Personnes de confiance'}</span>
            {trustedContacts.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-[10px] flex items-center justify-center font-bold">
                {trustedContacts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'habits'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>{isRTL ? 'عادات الطفل' : 'Rituels & Habitudes'}</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'documents'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isRTL ? 'صور الوثائق' : 'Photos documents'}</span>
            {documents.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-[10px] flex items-center justify-center font-bold">
                {documents.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-gray-800 dark:text-gray-200">
          {/* Onglet 1: Santé & Pédiatre */}
          {activeTab === 'health' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL
                  ? 'تساعد هذه المعلومات فريق الروضة على التدخل السريع ومتابعة نمو طفلكم.'
                  : 'Ces informations permettent à la crèche de contacter rapidement votre pédiatre en cas de besoin et de suivre la croissance de votre enfant.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {isRTL ? 'اسم طبيب الأطفال / الطبيب المتابع' : 'Nom du Pédiatre / Médecin traitant'}
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder={isRTL ? 'د. محمد بن صالح' : 'Dr. Martin, Dr. Trabelsi...'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {isRTL ? 'هاتف الطبيب' : 'Téléphone du Médecin'}
                  </label>
                  <input
                    type="tel"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    placeholder="98 123 456"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Mensurations actuelles */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 space-y-3">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4" />
                  {isRTL ? 'القياسات الحالية (اختياري)' : 'Mensurations actuelles (optionnel)'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-300 mb-1">
                      {isRTL ? 'الوزن (كلغ)' : 'Poids (kg)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="Ex: 9.5"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-300 mb-1">
                      {isRTL ? 'الطول (صم)' : 'Taille (cm)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="Ex: 78"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isRTL ? 'الحساسيات أو الاحتياطات الخاصة' : 'Allergies ou précautions particulières'}
                </label>
                <textarea
                  rows="2"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder={
                    isRTL
                      ? 'حساسية من الفول السوداني، البنسلين، لا توجد...'
                      : 'Allergie au lait de vache, arachides, intolérance, rien à signaler...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </motion.div>
          )}

          {/* Onglet 2: Personnes de confiance */}
          {activeTab === 'contacts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40 p-3 rounded-xl text-xs text-primary-800 dark:text-primary-200">
                {isRTL
                  ? 'يمكنكم تفويض حتى شخصين موثوقين (جدة، خالة، عم، مربية منزلية) لاستلام الطفل عند انتهاء الدوام.'
                  : 'Vous pouvez désigner jusqu\'à 2 personnes de confiance autorisées à venir récupérer votre enfant (ex: Grand-mère, Oncle, Nounou).'}
              </div>

              {/* Liste des personnes déjà ajoutées */}
              <div className="space-y-2">
                {trustedContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {contact.relation} • <span dir="ltr">{contact.phone}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTrustedContact(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title={isRTL ? 'حذف' : 'Supprimer'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {trustedContacts.length === 0 && !showAddContactForm && (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    {isRTL ? 'لم تتم إضافة أشخاص موثوقين بعد' : 'Aucune personne de confiance enregistrée.'}
                  </div>
                )}
              </div>

              {/* Formulaire d'ajout */}
              {showAddContactForm ? (
                <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-700/80 space-y-3">
                  <p className="text-xs font-bold text-primary-700 dark:text-primary-300">
                    {isRTL ? 'إضافة شخص موثوق' : 'Ajouter une personne autorisée'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={isRTL ? 'الاسم واللقب' : 'Nom et Prénom'}
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder={isRTL ? 'القرابة (مثال: جدة)' : 'Lien (ex: Grand-mère)'}
                      value={newContactRelation}
                      onChange={(e) => setNewContactRelation(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none"
                    />
                    <input
                      type="tel"
                      placeholder={isRTL ? 'رقم الهاتف' : 'N° Téléphone'}
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      dir="ltr"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddContactForm(false)}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg"
                    >
                      {isRTL ? 'إلغاء' : 'Annuler'}
                    </button>
                    <button
                      onClick={handleAddTrustedContact}
                      className="px-4 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {isRTL ? 'تأكيد الإضافة' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              ) : (
                trustedContacts.length < 2 && (
                  <button
                    onClick={() => setShowAddContactForm(true)}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRTL ? 'إضافة شخص موثوق به' : 'Ajouter une personne de confiance'}</span>
                  </button>
                )
              )}
            </motion.div>
          )}

          {/* Onglet 3: Rituels & Habitudes */}
          {activeTab === 'habits' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL
                  ? 'شاركنا عادات طفلكم الصغيرة لتسهيل تأقلمه مع المربيات في أيامه الأولى.'
                  : 'Parlez-nous des petits rituels de votre enfant pour rendre son accueil doux et personnalisé.'}
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isRTL ? 'النوم، الدمية المفضلة (Doudou)، المصاصة، الأكل...' : 'Sommeil, doudou, tétine, biberon, rituels...'}
                </label>
                <textarea
                  rows="4"
                  value={habitsNotes}
                  onChange={(e) => setHabitsNotes(e.target.value)}
                  placeholder={
                    isRTL
                      ? 'مثال: ينام مع دبدوب أزرق، يفضل الهز الخفيف، يتناول الحليب دافئاً...'
                      : 'Ex: A besoin de son doudou lapin pour la sieste, s\'endort au calme avec musique douce, diversification alimentaire bien avancée...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </motion.div>
          )}

          {/* Onglet 4: Documents & Photos */}
          {activeTab === 'documents' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  {isRTL
                    ? '📸 التقط صوراً واضحة لدفتر التلاقيح ومضمون الولادة. يُرجى إحضار الوثائق الأصلية الورقية يوم المقابلة.'
                    : '📸 Prenez simplement en photo la page des vaccins et l\'extrait de naissance. Pensez à apporter les originaux papier lors de votre rendez-vous.'}
                </span>
              </div>

              {/* Boutons d'upload direct */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer transition-all text-center">
                  <Camera className="w-6 h-6 text-primary-600 dark:text-primary-400 mb-1" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {isRTL ? 'دفتر التلاقيح / الصحة' : 'Carnet de santé / Vaccins'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {isRTL ? 'التقط صورة بالكاميرا' : 'Photo smartphone ou PDF'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleFileUpload(e, 'carnet_medical')}
                  />
                </label>

                <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer transition-all text-center">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-1" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {isRTL ? 'مضمون الولادة' : 'Extrait de naissance'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {isRTL ? 'التقط صورة بالكاميرا' : 'Photo smartphone ou PDF'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleFileUpload(e, 'acte_naissance')}
                  />
                </label>
              </div>

              {uploading && (
                <div className="flex items-center justify-center py-2 gap-2 text-xs text-primary-600">
                  <LoadingSpinner size="sm" />
                  <span>{isRTL ? 'جاري رفع الملف...' : 'Téléversement en cours...'}</span>
                </div>
              )}

              {/* Liste des documents déjà envoyés */}
              {documents.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'الوثائق المرفوعة :' : 'Documents enregistrés :'}
                  </p>
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-xs"
                    >
                      <span className="truncate max-w-[200px] font-medium">
                        {doc.original_filename || doc.filename || 'Document'}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isRTL ? 'محفوظ' : 'Reçu'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-gray-500">
            {isRTL ? 'يمكنكم التعديل في أي وقت قبل الموعد' : 'Modifiable jusqu\'au jour du rendez-vous'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
            >
              {isRTL ? 'إغلاق' : 'Fermer'}
            </button>
            <button
              onClick={handleSavePreparation}
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="xs" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isRTL ? 'حفظ المعلومات' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PreInterviewPreparationModal;
