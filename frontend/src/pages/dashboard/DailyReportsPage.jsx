/**
 * Page de gestion des rapports journaliers
 * Permet aux éducatrices de remplir les rapports quotidiens pour chaque enfant
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Baby, User, Calendar, Clock, Thermometer, Pill,
    Utensils, Droplets, Heart, Moon, Activity, MessageSquare,
    Check, X, ChevronRight, Search, Filter, Save, Send,
    AlertCircle, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DailyReportsPage = () => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const { user } = useAuth();

    // États
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    // Formulaire de rapport
    const [formData, setFormData] = useState({
        // Bébé seulement
        temperature: '',
        medication: '',
        // Repas détaillés - Array de {period, meal_type, meal_description, quantity}
        meals: [],
        // Couches détaillées - Array de {nature, time, notes}
        diaper_changes_list: [],
        // Commun
        skin_condition: 'good',
        skin_notes: '',
        sleep_quality: '',
        sleep_start: '',
        sleep_end: '',
        sleep_notes: '',
        activities: '',
        observations: '',
        status: 'draft',
        // Fournitures apportées
        supplies_diapers: 0,
        supplies_food: ''
    });

    // Fournitures apportées aujourd'hui
    const [suppliesBrought, setSuppliesBrought] = useState([]);
    // Options de nourriture apportées pour cet enfant
    const [foodOptions, setFoodOptions] = useState([]);

    // Charger les enfants et infos crèche
    useEffect(() => {
        loadData();
    }, [reportDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Passer la date du rapport pour récupérer les enfants présents ce jour-là
            const childrenRes = await api.get(`/api/daily-reports/children/today?date=${reportDate}`);

            if (childrenRes.data.success) {
                setChildren(childrenRes.data.children);
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement des données');
        } finally {
            setLoading(false);
        }
    };

    // Sélectionner un enfant et charger son rapport existant
    const selectChild = async (child) => {
        setSelectedChild(child);

        // Réinitialiser le formulaire et les options
        setFoodOptions([]);
        setFormData({
            temperature: '',
            medication: '',
            meals: [],
            diaper_changes_list: [],
            skin_condition: 'good',
            skin_notes: '',
            sleep_quality: '',
            sleep_start: '',
            sleep_end: '',
            sleep_notes: '',
            activities: '',
            observations: '',
            status: 'draft',
            supplies_diapers: 0,
            supplies_food: ''
        });

        // Charger le rapport existant si présent
        if (child.has_report) {
            try {
                const res = await api.get(`/api/daily-reports/${child.id}/${reportDate}`);
                if (res.data.success && res.data.report) {
                    const r = res.data.report;
                    setFormData({
                        temperature: r.temperature || '',
                        medication: r.medication || '',
                        meals: r.meals_details || [],
                        diaper_changes_list: r.diaper_changes_details || [],
                        skin_condition: r.skin_condition || 'good',
                        skin_notes: r.skin_notes || '',
                        sleep_quality: r.sleep_quality || '',
                        sleep_start: r.sleep_start || '',
                        sleep_end: r.sleep_end || '',
                        sleep_notes: r.sleep_notes || '',
                        activities: r.activities || '',
                        observations: r.observations || '',
                        status: r.status || 'draft',
                        supplies_diapers: 0,
                        supplies_food: ''
                    });
                }
            } catch (error) {
                console.error('Erreur chargement rapport:', error);
            }
        }

        // Charger les fournitures apportées aujourd'hui
        try {
            const suppliesRes = await api.get(`/api/supplies/today/${child.id}`);
            if (suppliesRes.data.success) {
                setSuppliesBrought(suppliesRes.data.supplies || []);
            }
        } catch (error) {
            console.error('Erreur chargement fournitures:', error);
        }

        // Charger les options de nourriture pour cet enfant
        try {
            const foodRes = await api.get(`/api/supplies/child/${child.id}/food-options`);
            if (foodRes.data.success) {
                setFoodOptions(foodRes.data.food_options || []);
            }
        } catch (error) {
            console.error('Erreur chargement options nourriture:', error);
        }
    };

    // Sauvegarder le rapport
    const saveReport = async (sendToParent = false) => {
        if (!selectedChild) return;

        setSaving(true);
        try {
            const payload = {
                child_id: selectedChild.id,
                report_date: reportDate,
                ...formData,
                status: sendToParent ? 'sent' : 'completed'
            };

            const res = await api.post('/api/daily-reports', payload);

            if (res.data.success) {
                // Enregistrer les fournitures apportées si renseignées
                if (formData.supplies_diapers > 0) {
                    await api.post(`/api/supplies/child/${selectedChild.id}/refill`, {
                        supply_type: 'diapers',
                        quantity: formData.supplies_diapers,
                        notes: `Apporté le ${reportDate}`
                    });
                }
                if (formData.supplies_food && formData.supplies_food.trim()) {
                    await api.post(`/api/supplies/child/${selectedChild.id}/refill`, {
                        supply_type: 'food',
                        quantity: 1,
                        notes: formData.supplies_food
                    });
                }

                toast.success(
                    sendToParent
                        ? (isRTL ? 'تم إرسال التقرير للوالدين' : 'Rapport envoyé aux parents')
                        : (isRTL ? 'تم حفظ التقرير' : 'Rapport enregistré')
                );

                // Mettre à jour la liste
                setChildren(prev => prev.map(c =>
                    c.id === selectedChild.id
                        ? { ...c, has_report: true, report_status: payload.status }
                        : c
                ));
                setSelectedChild(prev => ({ ...prev, has_report: true, report_status: payload.status }));

                // Réinitialiser les fournitures après sauvegarde
                setFormData(prev => ({ ...prev, supplies_diapers: 0, supplies_food: '' }));
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            toast.error(isRTL ? 'خطأ في حفظ التقرير' : 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Ajouter un repas
    const addMeal = () => {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        // Pour les bébés: heure, pour les enfants: période
        const defaultPeriod = isBaby ? time : 'morning';
        // Type par défaut: biberon pour bébé, première nourriture apportée ou autre pour enfant
        const defaultMealType = isBaby
            ? 'bottle'
            : (foodMealOptions.length > 0 ? foodMealOptions[0].value : 'other');
        setFormData(prev => ({
            ...prev,
            meals: [...prev.meals, { period: defaultPeriod, meal_type: defaultMealType, meal_description: '', quantity: 'full' }]
        }));
    };

    // Supprimer un repas
    const removeMeal = (index) => {
        setFormData(prev => ({
            ...prev,
            meals: prev.meals.filter((_, i) => i !== index)
        }));
    };

    // Mettre à jour un repas
    const updateMeal = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            meals: prev.meals.map((meal, i) => i === index ? { ...meal, [field]: value } : meal)
        }));
    };

    // Ajouter un changement de couche
    const addDiaperChange = () => {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        setFormData(prev => ({
            ...prev,
            diaper_changes_list: [...prev.diaper_changes_list, { nature: 'pee', time, notes: '' }]
        }));
    };

    // Supprimer un changement de couche
    const removeDiaperChange = (index) => {
        setFormData(prev => ({
            ...prev,
            diaper_changes_list: prev.diaper_changes_list.filter((_, i) => i !== index)
        }));
    };

    // Mettre à jour un changement de couche
    const updateDiaperChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            diaper_changes_list: prev.diaper_changes_list.map((change, i) => i === index ? { ...change, [field]: value } : change)
        }));
    };

    // Ajouter une fourniture apportée
    const addSupplyBrought = async (supplyType, quantity, description) => {
        if (!selectedChild) return;
        try {
            const res = await api.post('/api/supplies/daily-brought', {
                child_id: selectedChild.id,
                supplies: [{ type: supplyType, quantity, description }]
            });
            if (res.data.success) {
                toast.success(isRTL ? 'تم تسجيل المستلزمات' : 'Fournitures enregistrées');
                // Recharger les fournitures
                const suppliesRes = await api.get(`/api/supplies/today/${selectedChild.id}`);
                if (suppliesRes.data.success) {
                    setSuppliesBrought(suppliesRes.data.supplies || []);
                }
                // Recharger les enfants pour mettre à jour le stock
                loadData();
            }
        } catch (error) {
            console.error('Erreur ajout fourniture:', error);
            toast.error(isRTL ? 'خطأ في تسجيل المستلزمات' : 'Erreur lors de l\'enregistrement');
        }
    };

    // Filtrer les enfants
    const filteredChildren = children.filter(child => {
        const matchSearch = `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterStatus === 'all'
            || (filterStatus === 'pending' && !child.has_report)
            || (filterStatus === 'completed' && child.has_report);
        return matchSearch && matchFilter;
    });

    // Calculer l'âge en mois
    const getAgeText = (birthDate) => {
        const birth = new Date(birthDate);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (months < 12) {
            return isRTL ? `${months} أشهر` : `${months} mois`;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) {
            return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
        }
        return isRTL ? `${years} سنة و ${remainingMonths} أشهر` : `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
    };

    // Labels multilingues
    const labels = {
        title: isRTL ? 'التقارير اليومية' : 'Rapports Journaliers',
        subtitle: isRTL ? 'متابعة يومية للأطفال' : 'Suivi quotidien des enfants',
        search: isRTL ? 'بحث عن طفل...' : 'Rechercher un enfant...',
        all: isRTL ? 'الكل' : 'Tous',
        pending: isRTL ? 'في الانتظار' : 'En attente',
        completed: isRTL ? 'مكتمل' : 'Complété',
        selectChild: isRTL ? 'اختر طفلاً لملء تقريره' : 'Sélectionnez un enfant pour remplir son rapport',
        baby: isRTL ? 'رضيع' : 'Bébé',
        child: isRTL ? 'طفل' : 'Enfant',
        // Sections formulaire
        temperature: isRTL ? 'الحرارة (°C)' : 'Température (°C)',
        medication: isRTL ? 'الأدوية' : 'Médicaments',
        meals: isRTL ? 'الوجبات' : 'Repas',
        mealsCount: isRTL ? 'عدد الوجبات' : 'Nombre de repas',
        mealType: isRTL ? 'نوع الوجبة' : 'Type de repas',
        bottle: isRTL ? 'رضاعة' : 'Biberon',
        compote: isRTL ? 'كومبوت' : 'Compote',
        fruit: isRTL ? 'فاكهة' : 'Fruit',
        solid: isRTL ? 'أخرى' : 'Autre',
        other: isRTL ? 'أخرى' : 'Autre',
        period: isRTL ? 'الفترة' : 'Période',
        morning: isRTL ? 'صباحاً' : 'Matinée',
        noon: isRTL ? 'ظهراً' : 'Midi',
        afternoon: isRTL ? 'بعد الظهر' : 'Après-midi',
        fullDay: isRTL ? 'اليوم كامل' : 'Journée complète',
        appetite: isRTL ? 'الشهية' : 'Appétit',
        good: isRTL ? 'جيد' : 'Bien',
        medium: isRTL ? 'متوسط' : 'Moyen',
        none: isRTL ? 'لا شهية' : 'Pas d\'appétit',
        diaper: isRTL ? 'الحفاظات' : 'Couches',
        diaperCount: isRTL ? 'عدد التغييرات' : 'Nombre de changements',
        diaperNature: isRTL ? 'الطبيعة' : 'Nature',
        pee: isRTL ? 'بول' : 'Pipi',
        poop: isRTL ? 'براز' : 'Selles',
        mixed: isRTL ? 'مختلط' : 'Mixte',
        skin: isRTL ? 'حالة الجلد' : 'État de la peau',
        skinNormal: isRTL ? 'عادي' : 'Normal',
        skinOther: isRTL ? 'أخرى' : 'Autre',
        sleep: isRTL ? 'النوم' : 'Sommeil',
        sleepQuality: isRTL ? 'جودة النوم' : 'Qualité du sommeil',
        calm: isRTL ? 'هادئ' : 'Calme',
        discontinuous: isRTL ? 'متقطع' : 'Discontinu',
        deep: isRTL ? 'عميق' : 'Profond',
        sleepStart: isRTL ? 'بداية النوم' : 'Début du sommeil',
        sleepEnd: isRTL ? 'نهاية النوم' : 'Fin du sommeil',
        activities: isRTL ? 'الأنشطة' : 'Activités',
        observations: isRTL ? 'ملاحظات' : 'Observations',
        save: isRTL ? 'حفظ' : 'Enregistrer',
        sendToParent: isRTL ? 'إرسال للوالدين' : 'Envoyer aux parents',
        notes: isRTL ? 'ملاحظات' : 'Notes',
        educator: isRTL ? 'المربية' : 'Éducatrice',
        nursery: isRTL ? 'الحضانة' : 'Crèche',
        date: isRTL ? 'التاريخ' : 'Date'
    };

    // Déterminer si l'enfant sélectionné est un bébé (< 12 mois)
    const isBaby = selectedChild ? (() => {
        const birthDate = new Date(selectedChild.birth_date);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        return ageInMonths < 12;
    })() : false;

    // Options de base pour les bébés uniquement
    const babyMealOptions = [
        { value: 'bottle', label: labels.bottle },
        { value: 'compote', label: labels.compote },
        { value: 'fruit', label: labels.fruit }
    ];

    // Options de nourriture apportées par les parents (avec clés uniques)
    const seenFoodValues = new Set();
    const foodMealOptions = foodOptions
        .map((food, index) => {
            const baseValue = `food_${food.toLowerCase().replace(/\s+/g, '_')}`;
            // Ajouter un index si la valeur existe déjà
            let value = baseValue;
            if (seenFoodValues.has(value)) {
                value = `${baseValue}_${index}`;
            }
            seenFoodValues.add(value);
            return { value, label: food };
        })
        .filter((opt, index, self) =>
            // Filtrer les doublons par label
            self.findIndex(o => o.label.toLowerCase() === opt.label.toLowerCase()) === index
        );

    // Options finales selon l'âge :
    // - Bébés : biberon + nourriture apportée + Autre
    // - Enfants : nourriture apportée + Autre
    const mealTypeOptions = [
        { value: 'bottle', label: labels.bottle },
        ...foodMealOptions,
        { value: 'other', label: labels.other }
    ];

    // Options de période pour les enfants (Matin, Midi, Goûter)
    const periodOptions = [
        { value: 'morning', label: labels.morning },
        { value: 'noon', label: labels.noon },
        { value: 'snack', label: isRTL ? 'وجبة خفيفة' : 'Goûter' }
    ];

    const appetiteOptions = [
        { value: 'good', label: labels.good },
        { value: 'medium', label: labels.medium },
        { value: 'none', label: labels.none }
    ];

    const diaperNatureOptions = [
        { value: 'pee', label: labels.pee },
        { value: 'poop', label: labels.poop },
        { value: 'mixed', label: labels.mixed }
    ];

    const sleepQualityOptions = [
        { value: 'calm', label: labels.calm },
        { value: 'discontinuous', label: labels.discontinuous },
        { value: 'deep', label: labels.deep }
    ];

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* En-tête */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <FileText className="inline-block w-8 h-8 mr-2 text-primary-500" />
                            {labels.title}
                        </h1>
                        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {labels.subtitle}
                        </p>
                    </div>

                    {/* Infos automatiques */}
                    <div className={`flex flex-wrap gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 rounded-full">
                            <User className="w-4 h-4" />
                            <span>{user?.first_name} {user?.last_name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                            <Calendar className="w-4 h-4" />
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                className="bg-transparent border-none outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des enfants */}
                <div className="lg:col-span-1">
                    <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className={`text-lg ${isDark ? 'text-white' : ''}`}>
                                    {isRTL ? 'الأطفال' : 'Enfants'} ({filteredChildren.length})
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={loadData}>
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Recherche */}
                            <div className="relative mt-3">
                                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                <Input
                                    placeholder={labels.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`${isRTL ? 'pr-10' : 'pl-10'} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                />
                            </div>

                            {/* Filtres */}
                            <div className="flex gap-2 mt-3">
                                {['all', 'pending', 'completed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1 text-xs rounded-full transition-colors ${filterStatus === status
                                            ? 'bg-primary-500 text-white'
                                            : isDark
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status === 'all' ? labels.all : status === 'pending' ? labels.pending : labels.completed}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>

                        <CardContent className="max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                {filteredChildren.map(child => (
                                    <motion.div
                                        key={child.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => selectChild(child)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedChild?.id === child.id
                                            ? 'bg-primary-100 dark:bg-primary-900/40 border-2 border-primary-500'
                                            : isDark
                                                ? 'bg-gray-700 hover:bg-gray-600'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${child.report_type === 'baby'
                                                ? 'bg-pink-100 dark:bg-pink-900/40'
                                                : 'bg-blue-100 dark:bg-blue-900/40'
                                                }`}>
                                                {child.photo_url ? (
                                                    <img src={child.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : child.report_type === 'baby' ? (
                                                    <Baby className="w-5 h-5 text-pink-500" />
                                                ) : (
                                                    <User className="w-5 h-5 text-blue-500" />
                                                )}
                                            </div>

                                            {/* Infos */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {child.first_name} {child.last_name}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {getAgeText(child.birth_date)}
                                                </p>
                                            </div>

                                            {/* Statut */}
                                            <div className="flex items-center gap-2">
                                                {child.report_type === 'baby' && (
                                                    <span className="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-full">
                                                        {labels.baby}
                                                    </span>
                                                )}
                                                {child.has_report ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {filteredChildren.length === 0 && (
                                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {isRTL ? 'لا يوجد أطفال' : 'Aucun enfant trouvé'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Formulaire de rapport */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedChild ? (
                            <motion.div
                                key={selectedChild.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                                    <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedChild.report_type === 'baby'
                                                    ? 'bg-pink-100 dark:bg-pink-900/40'
                                                    : 'bg-blue-100 dark:bg-blue-900/40'
                                                    }`}>
                                                    {selectedChild.report_type === 'baby' ? (
                                                        <Baby className="w-6 h-6 text-pink-500" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-blue-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className={isDark ? 'text-white' : ''}>
                                                        {selectedChild.first_name} {selectedChild.last_name}
                                                    </CardTitle>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {getAgeText(selectedChild.birth_date)} • {selectedChild.report_type === 'baby' ? labels.baby : labels.child}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedChild.has_report && (
                                                <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full">
                                                    {labels.completed}
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6 space-y-6">
                                        {/* Section Bébé uniquement */}
                                        {selectedChild.report_type === 'baby' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                                <h3 className="col-span-full text-lg font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-2">
                                                    <Baby className="w-5 h-5" />
                                                    {isRTL ? 'معلومات الرضيع' : 'Informations bébé'}
                                                </h3>

                                                {/* Température */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        <Thermometer className="inline w-4 h-4 mr-1" />
                                                        {labels.temperature}
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="35"
                                                        max="42"
                                                        value={formData.temperature}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                                                        placeholder="37.0"
                                                        className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                                                    />
                                                </div>

                                                {/* Médicaments */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        <Pill className="inline w-4 h-4 mr-1" />
                                                        {labels.medication}
                                                    </label>
                                                    <Input
                                                        value={formData.medication}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                                                        placeholder={isRTL ? 'اسم الدواء والجرعة' : 'Nom et dose du médicament'}
                                                        className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                                                    />
                                                </div>

                                            </div>
                                        )}

                                        {/* Section Repas détaillés */}
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                                                    <Utensils className="w-5 h-5" />
                                                    {isRTL ? 'الوجبات' : 'Repas'} ({formData.meals.length})
                                                </h3>
                                                <Button size="sm" onClick={addMeal} className="bg-orange-500 hover:bg-orange-600">
                                                    + {isRTL ? 'إضافة وجبة' : 'Ajouter repas'}
                                                </Button>
                                            </div>

                                            {formData.meals.length === 0 ? (
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {isRTL ? 'لم يتم إضافة وجبات بعد' : 'Aucun repas ajouté'}
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {formData.meals.map((meal, index) => (
                                                        <div key={index} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {isRTL ? `وجبة ${index + 1}` : `Repas ${index + 1}`}
                                                                </span>
                                                                <button onClick={() => removeMeal(index)} className="text-red-500 hover:text-red-700">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                {isBaby ? (
                                                                    <input
                                                                        type="time"
                                                                        value={meal.period}
                                                                        onChange={(e) => updateMeal(index, 'period', e.target.value)}
                                                                        className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                    />
                                                                ) : (
                                                                    <select
                                                                        value={meal.period}
                                                                        onChange={(e) => updateMeal(index, 'period', e.target.value)}
                                                                        className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                    >
                                                                        <option value="morning">{isRTL ? 'صباحاً' : 'Matin'}</option>
                                                                        <option value="noon">{isRTL ? 'ظهراً' : 'Midi'}</option>
                                                                        <option value="snack">{isRTL ? 'وجبة خفيفة' : 'Goûter'}</option>
                                                                    </select>
                                                                )}
                                                                <select
                                                                    value={meal.meal_type}
                                                                    onChange={(e) => updateMeal(index, 'meal_type', e.target.value)}
                                                                    className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                >
                                                                    {mealTypeOptions.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                                {meal.meal_type === 'other' && (
                                                                    <input
                                                                        type="text"
                                                                        placeholder={isRTL ? 'وصف...' : 'Description...'}
                                                                        value={meal.meal_description || ''}
                                                                        onChange={(e) => updateMeal(index, 'meal_description', e.target.value)}
                                                                        className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                    />
                                                                )}
                                                                <select
                                                                    value={meal.quantity || 'good'}
                                                                    onChange={(e) => updateMeal(index, 'quantity', e.target.value)}
                                                                    className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                >
                                                                    <option value="none">{isRTL ? 'لم يأكل' : 'Rien'}</option>
                                                                    <option value="little">{isRTL ? 'قليل' : 'Peu'}</option>
                                                                    <option value="half">{isRTL ? 'نصف' : 'Moitié'}</option>
                                                                    <option value="good">{isRTL ? 'جيد' : 'Bien'}</option>
                                                                    <option value="full">{isRTL ? 'كامل' : 'Tout'}</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Section Couches détaillées */}
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                                                        <Droplets className="w-5 h-5" />
                                                        {isRTL ? 'الحفاظات' : 'Couches'} ({formData.diaper_changes_list.length})
                                                    </h3>
                                                    {selectedChild?.diaper_low_stock && (
                                                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="w-4 h-4" />
                                                            {isRTL ? `تنبيه: ${selectedChild.diaper_stock} حفاظات متبقية` : `Alerte: ${selectedChild.diaper_stock} couches restantes`}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button size="sm" onClick={addDiaperChange} className="bg-blue-500 hover:bg-blue-600">
                                                    + {isRTL ? 'إضافة تغيير' : 'Ajouter change'}
                                                </Button>
                                            </div>

                                            {formData.diaper_changes_list.length === 0 ? (
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {isRTL ? 'لم يتم إضافة تغييرات بعد' : 'Aucun changement ajouté'}
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {formData.diaper_changes_list.map((change, index) => (
                                                        <div key={index} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {isRTL ? `تغيير ${index + 1}` : `Change ${index + 1}`}
                                                                </span>
                                                                <button onClick={() => removeDiaperChange(index)} className="text-red-500 hover:text-red-700">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <input
                                                                    type="time"
                                                                    value={change.time || ''}
                                                                    onChange={(e) => updateDiaperChange(index, 'time', e.target.value)}
                                                                    className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                />
                                                                <select
                                                                    value={change.nature}
                                                                    onChange={(e) => updateDiaperChange(index, 'nature', e.target.value)}
                                                                    className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                >
                                                                    {diaperNatureOptions.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="text"
                                                                    placeholder={isRTL ? 'ملاحظة...' : 'Note...'}
                                                                    value={change.notes || ''}
                                                                    onChange={(e) => updateDiaperChange(index, 'notes', e.target.value)}
                                                                    className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Section Fournitures apportées */}
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                                                        🎒 {isRTL ? 'المستلزمات المحضرة' : 'Fournitures apportées'}
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {isRTL ? 'سجل المستلزمات التي أحضرها الوالدين' : 'Enregistrez les fournitures apportées par les parents'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-700">
                                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        🧷 {isRTL ? 'حفاظات' : 'Couches'}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={formData.supplies_diapers || ''}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, supplies_diapers: parseInt(e.target.value) || 0 }))}
                                                            className={`w-20 px-3 py-2 rounded border text-center ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                                                        />
                                                        <span className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                            {isRTL ? 'قطعة' : 'pièces'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-700">
                                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        🍼 {isRTL ? 'طعام/حليب' : 'Nourriture/Lait'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder={isRTL ? 'وصف...' : 'Description...'}
                                                        value={formData.supplies_food || ''}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, supplies_food: e.target.value }))}
                                                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* État de la peau */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                <Heart className="inline w-4 h-4 mr-1" />
                                                {labels.skin}
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, skin_condition: 'good' }))}
                                                    className={`px-4 py-2 rounded-lg transition-colors ${formData.skin_condition === 'good'
                                                        ? 'bg-green-500 text-white'
                                                        : isDark
                                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {labels.skinNormal}
                                                </button>
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, skin_condition: 'other' }))}
                                                    className={`px-4 py-2 rounded-lg transition-colors ${formData.skin_condition === 'other'
                                                        ? 'bg-orange-500 text-white'
                                                        : isDark
                                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {labels.skinOther}
                                                </button>
                                            </div>
                                            {formData.skin_condition === 'other' && (
                                                <Input
                                                    className={`mt-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                                    placeholder={isRTL ? 'وصف الحالة...' : 'Décrire l\'état...'}
                                                    value={formData.skin_notes}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, skin_notes: e.target.value }))}
                                                />
                                            )}
                                        </div>

                                        {/* Sommeil */}
                                        <div className="space-y-3">
                                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                <Moon className="inline w-4 h-4 mr-1" />
                                                {labels.sleep}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {sleepQualityOptions.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setFormData(prev => ({ ...prev, sleep_quality: opt.value }))}
                                                        className={`px-4 py-2 rounded-lg transition-colors ${formData.sleep_quality === opt.value
                                                            ? opt.value === 'deep' ? 'bg-indigo-500 text-white'
                                                                : opt.value === 'calm' ? 'bg-blue-500 text-white'
                                                                    : 'bg-yellow-500 text-white'
                                                            : isDark
                                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {labels.sleepStart}
                                                    </label>
                                                    <Input
                                                        type="time"
                                                        value={formData.sleep_start}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, sleep_start: e.target.value }))}
                                                        className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {labels.sleepEnd}
                                                    </label>
                                                    <Input
                                                        type="time"
                                                        value={formData.sleep_end}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, sleep_end: e.target.value }))}
                                                        className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activités */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                <Activity className="inline w-4 h-4 mr-1" />
                                                {labels.activities}
                                            </label>
                                            <textarea
                                                value={formData.activities}
                                                onChange={(e) => setFormData(prev => ({ ...prev, activities: e.target.value }))}
                                                rows={2}
                                                placeholder={isRTL ? 'الأنشطة التي قام بها الطفل...' : 'Activités réalisées par l\'enfant...'}
                                                className={`w-full px-3 py-2 rounded-md border resize-none ${isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                    : 'bg-white border-gray-300 placeholder-gray-500'
                                                    }`}
                                            />
                                        </div>

                                        {/* Observations */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                <MessageSquare className="inline w-4 h-4 mr-1" />
                                                {labels.observations}
                                            </label>
                                            <textarea
                                                value={formData.observations}
                                                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                                rows={3}
                                                placeholder={isRTL ? 'ملاحظات عامة عن اليوم...' : 'Observations générales sur la journée...'}
                                                className={`w-full px-3 py-2 rounded-md border resize-none ${isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                    : 'bg-white border-gray-300 placeholder-gray-500'
                                                    }`}
                                            />
                                        </div>

                                        {/* Boutons d'action */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <Button
                                                onClick={() => saveReport(false)}
                                                disabled={saving}
                                                className="flex-1 bg-gray-600 hover:bg-gray-700"
                                            >
                                                {saving ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Save className="w-4 h-4 mr-2" />
                                                )}
                                                {labels.save}
                                            </Button>
                                            <Button
                                                onClick={() => saveReport(true)}
                                                disabled={saving}
                                                className="flex-1 bg-primary-500 hover:bg-primary-600"
                                            >
                                                {saving ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Send className="w-4 h-4 mr-2" />
                                                )}
                                                {labels.sendToParent}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                                    }`}
                            >
                                <FileText className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {labels.selectChild}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DailyReportsPage;
