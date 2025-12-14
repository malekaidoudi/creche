/**
 * ChildEmergencyContactsPage - Gestion des contacts d'urgence d'un enfant
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Phone,
    User,
    Plus,
    X,
    Save,
    Trash2,
    Edit,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import api from '../../services/api';

const ChildEmergencyContactsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const isMobile = useIsMobile();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        relationship: '',
        phone: '',
        phone2: '',
        can_pickup: true,
        priority: 1
    });

    const relationships = [
        { value: 'mother', label: isRTL ? 'الأم' : 'Mère' },
        { value: 'father', label: isRTL ? 'الأب' : 'Père' },
        { value: 'grandparent', label: isRTL ? 'الجد/الجدة' : 'Grand-parent' },
        { value: 'uncle_aunt', label: isRTL ? 'العم/العمة' : 'Oncle/Tante' },
        { value: 'sibling', label: isRTL ? 'الأخ/الأخت' : 'Frère/Sœur' },
        { value: 'nanny', label: isRTL ? 'المربية' : 'Nounou' },
        { value: 'neighbor', label: isRTL ? 'الجار' : 'Voisin(e)' },
        { value: 'other', label: isRTL ? 'آخر' : 'Autre' }
    ];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [childRes, contactsRes] = await Promise.all([
                api.get(`/api/children/${id}`),
                api.get(`/api/children/${id}/emergency-contacts`).catch(() => ({ data: { contacts: [] } }))
            ]);

            if (childRes.data) {
                setChild(childRes.data.child || childRes.data);
            }

            if (contactsRes.data?.contacts) {
                setContacts(contactsRes.data.contacts);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put(`/api/children/${id}/emergency-contacts`, { contacts });
            // Toast ou notification de succès
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleAddOrUpdateContact = () => {
        if (!formData.name.trim() || !formData.phone.trim()) return;

        if (editingContact) {
            // Mise à jour
            setContacts(prev => prev.map(c =>
                c.id === editingContact.id ? { ...formData, id: c.id } : c
            ));
        } else {
            // Ajout
            const newContact = {
                ...formData,
                id: Date.now(),
                priority: contacts.length + 1
            };
            setContacts(prev => [...prev, newContact]);
        }

        resetForm();
    };

    const handleRemoveContact = (contactId) => {
        setContacts(prev => prev.filter(c => c.id !== contactId));
    };

    const handleEditContact = (contact) => {
        setFormData({
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            phone2: contact.phone2 || '',
            can_pickup: contact.can_pickup,
            priority: contact.priority
        });
        setEditingContact(contact);
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            relationship: '',
            phone: '',
            phone2: '',
            can_pickup: true,
            priority: 1
        });
        setEditingContact(null);
        setShowAddModal(false);
    };

    const getRelationshipLabel = (value) => {
        const rel = relationships.find(r => r.value === value);
        return rel ? rel.label : value;
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${isMobile ? 'pb-24' : ''}`}>
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobile ? 'pb-24' : ''}`}>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                {!isMobile && (
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>{isRTL ? 'العودة' : 'Retour'}</span>
                    </button>
                )}

                {/* Titre */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Phone className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isRTL ? 'جهات الاتصال في حالات الطوارئ' : 'Contacts d\'urgence'}
                            </h1>
                            {child && (
                                <p className="text-gray-500">
                                    {child.first_name} {child.last_name}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            {isRTL
                                ? 'هؤلاء هم الأشخاص الذين يمكننا الاتصال بهم في حالات الطوارئ أو لاستلام طفلك.'
                                : 'Ces personnes pourront être contactées en cas d\'urgence ou récupérer votre enfant.'}
                        </p>
                    </div>
                </div>

                {/* Liste des contacts */}
                {contacts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center"
                    >
                        <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {isRTL ? 'لا توجد جهات اتصال مسجلة' : 'Aucun contact enregistré'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl"
                        >
                            <Plus className="w-4 h-4" />
                            {isRTL ? 'إضافة جهة اتصال' : 'Ajouter un contact'}
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-3 mb-6">
                        {contacts
                            .sort((a, b) => a.priority - b.priority)
                            .map((contact, index) => (
                                <motion.div
                                    key={contact.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {contact.name}
                                                    </h3>
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                                        #{contact.priority}
                                                    </span>
                                                </div>
                                                {contact.relationship && (
                                                    <p className="text-sm text-gray-500">
                                                        {getRelationshipLabel(contact.relationship)}
                                                    </p>
                                                )}
                                                <div className="mt-2 space-y-1">
                                                    <a
                                                        href={`tel:${contact.phone}`}
                                                        className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        {contact.phone}
                                                    </a>
                                                    {contact.phone2 && (
                                                        <a
                                                            href={`tel:${contact.phone2}`}
                                                            className="flex items-center gap-2 text-sm text-gray-500"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                            {contact.phone2}
                                                        </a>
                                                    )}
                                                </div>
                                                {contact.can_pickup && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                                                        <UserCheck className="w-3 h-3" />
                                                        {isRTL ? 'مصرح له بالاستلام' : 'Autorisé à récupérer l\'enfant'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditContact(contact)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveContact(contact.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                )}

                {/* Bouton sauvegarder */}
                {contacts.length > 0 && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? (isRTL ? 'جاري الحفظ...' : 'Enregistrement...') : (isRTL ? 'حفظ التغييرات' : 'Enregistrer')}
                    </button>
                )}
            </div>

            {/* Modal Ajout/Modification */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
                        onClick={resetForm}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto pb-safe mb-20 sm:mb-0"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {editingContact
                                            ? (isRTL ? 'تعديل جهة الاتصال' : 'Modifier le contact')
                                            : (isRTL ? 'إضافة جهة اتصال' : 'Ajouter un contact')}
                                    </h3>
                                    <button onClick={resetForm}>
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'الاسم الكامل' : 'Nom complet'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Marie Dupont"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'العلاقة' : 'Relation'}
                                        </label>
                                        <select
                                            value={formData.relationship}
                                            onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">{isRTL ? 'اختر...' : 'Sélectionner...'}</option>
                                            {relationships.map(rel => (
                                                <option key={rel.value} value={rel.value}>{rel.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'رقم الهاتف' : 'Téléphone'} *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: 06 12 34 56 78"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'هاتف ثانوي' : 'Téléphone secondaire'}
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone2}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone2: e.target.value }))}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder={isRTL ? 'اختياري' : 'Optionnel'}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="can_pickup"
                                            checked={formData.can_pickup}
                                            onChange={(e) => setFormData(prev => ({ ...prev, can_pickup: e.target.checked }))}
                                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor="can_pickup" className="text-sm text-gray-700 dark:text-gray-300">
                                            {isRTL ? 'مصرح له باستلام الطفل' : 'Autorisé à récupérer l\'enfant'}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium"
                                    >
                                        {isRTL ? 'إلغاء' : 'Annuler'}
                                    </button>
                                    <button
                                        onClick={handleAddOrUpdateContact}
                                        className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium"
                                    >
                                        {editingContact ? (isRTL ? 'تحديث' : 'Mettre à jour') : (isRTL ? 'إضافة' : 'Ajouter')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isMobile && <MobileNavigation />}
        </div>
    );
};

export default ChildEmergencyContactsPage;
