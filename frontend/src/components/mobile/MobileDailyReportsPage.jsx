/**
 * Composant Mobile pour les Rapports Journaliers
 * Design identique à l'app mobile (direction)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Search, RefreshCw, Baby, CheckCircle, Clock,
    Utensils, Droplets, Heart, Moon, Activity, MessageSquare,
    Save, Send, X, Plus, Loader2, ChevronRight, Thermometer, Check,
    AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Couleurs style direction (comme app mobile)
const dirColors = {
    background: '#0F172A',
    card: '#1E293B',
    cardLight: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    primary: '#8B5CF6',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    orange: '#F97316',
    blue: '#3B82F6',
    pink: '#EC4899',
};

const MobileDailyReportsPage = () => {
    const { isRTL } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSupplies, setSavingSupplies] = useState(false);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [foodOptions, setFoodOptions] = useState([]);
    const [foodBadges, setFoodBadges] = useState([]);
    const [foodInputText, setFoodInputText] = useState('');
    const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);
    const [childStock, setChildStock] = useState({ diapers: 0, alertThreshold: 5 });
    const [showLowStockAlert, setShowLowStockAlert] = useState(false);

    const [formData, setFormData] = useState({
        temperature: '',
        medication: '',
        meals: [],
        diaper_changes_list: [],
        skin_condition: 'good',
        skin_notes: '',
        sleep_quality: '',
        sleep_start: '',
        sleep_end: '',
        activities: '',
        observations: '',
        supplies_diapers: 0,
        supplies_food: '',
    });

    const labels = {
        title: isRTL ? 'التقارير اليومية' : 'Rapports Journaliers',
        subtitle: isRTL ? 'ملء التقارير اليومية للأطفال' : 'Remplir les rapports quotidiens',
        search: isRTL ? 'بحث...' : 'Rechercher...',
        back: isRTL ? 'رجوع' : 'Retour',
        baby: isRTL ? 'رضيع' : 'Bébé',
        child: isRTL ? 'طفل' : 'Enfant',
        temperature: isRTL ? 'الحرارة (°C)' : 'Température (°C)',
        medication: isRTL ? 'الأدوية' : 'Médicaments',
        meals: isRTL ? 'الوجبات' : 'Repas',
        diaper: isRTL ? 'الحفاظات' : 'Couches',
        skin: isRTL ? 'حالة الجلد' : 'État de la peau',
        skinNormal: isRTL ? 'عادي' : 'Normal',
        skinOther: isRTL ? 'أخرى' : 'Autre',
        sleep: isRTL ? 'النوم' : 'Sommeil',
        calm: isRTL ? 'هادئ' : 'Calme',
        discontinuous: isRTL ? 'متقطع' : 'Discontinu',
        deep: isRTL ? 'عميق' : 'Profond',
        activities: isRTL ? 'الأنشطة' : 'Activités',
        observations: isRTL ? 'ملاحظات' : 'Observations',
        save: isRTL ? 'حفظ' : 'Enregistrer',
        send: isRTL ? 'إرسال' : 'Envoyer',
        completed: isRTL ? 'مكتمل' : 'Complété',
        pending: isRTL ? 'في الانتظار' : 'En attente',
        add: isRTL ? 'إضافة' : 'Ajouter',
        noMeals: isRTL ? 'لم يتم إضافة وجبات بعد' : 'Aucun repas ajouté',
        noDiapers: isRTL ? 'لم يتم إضافة تغييرات بعد' : 'Aucun changement ajouté',
        supplies: isRTL ? 'المستلزمات المحضرة' : 'Fournitures apportées',
        suppliesDesc: isRTL ? 'سجل المستلزمات التي أحضرها الوالدين' : 'Enregistrez les fournitures apportées par les parents',
        diapers: isRTL ? 'حفاضات' : 'Couches',
        food: isRTL ? 'طعام/حليب' : 'Nourriture/Lait',
        pieces: isRTL ? 'قطعة' : 'pièces',
        validateSupplies: isRTL ? 'حفظ المستلزمات' : 'Valider les fournitures',
        pee: isRTL ? 'بول' : 'Pipi',
        poop: isRTL ? 'براز' : 'Selles',
        mixed: isRTL ? 'مختلط' : 'Mixte',
        start: isRTL ? 'البداية' : 'Début',
        end: isRTL ? 'النهاية' : 'Fin',
    };

    useEffect(() => {
        loadChildren();
    }, []);

    const loadChildren = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`/api/daily-reports/children/today?date=${today}`);
            if (response.data?.success) {
                setChildren(response.data.children || []);
            }
        } catch (error) {
            console.error('Erreur chargement enfants:', error);
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const selectChild = async (child) => {
        setSelectedChild(child);
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
            activities: '',
            observations: '',
            supplies_diapers: 0,
            supplies_food: '',
        });
        setFoodBadges([]);
        setFoodInputText('');

        if (child.has_report) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await api.get(`/api/daily-reports/${child.id}/${today}`);
                if (response.data?.success && response.data.report) {
                    const r = response.data.report;
                    setFormData({
                        temperature: r.temperature?.toString() || '',
                        medication: r.medication || '',
                        meals: r.meals_details || [],
                        diaper_changes_list: (r.diaper_changes_details || []).map(d => ({
                            nature: d.nature,
                            time: d.change_time || '',
                            notes: d.notes || ''
                        })),
                        skin_condition: r.skin_condition || 'good',
                        skin_notes: r.skin_notes || '',
                        sleep_quality: r.sleep_quality || '',
                        sleep_start: r.sleep_start || '',
                        sleep_end: r.sleep_end || '',
                        activities: r.activities || '',
                        observations: r.observations || '',
                        supplies_diapers: 0,
                        supplies_food: '',
                    });
                }
            } catch (error) {
                console.error('Erreur chargement rapport:', error);
            }
        }

        // Charger les options de nourriture apportée
        try {
            const foodRes = await api.get(`/api/supplies/child/${child.id}/food-options`);
            if (foodRes.data?.success) {
                setFoodOptions(foodRes.data.food_options || []);
            }
        } catch (error) {
            console.error('Erreur chargement options nourriture:', error);
        }

        // Charger le stock de couches de l'enfant
        try {
            const stockRes = await api.get(`/api/supplies/child/${child.id}`);
            if (stockRes.data?.success) {
                const diapersStock = stockRes.data.supplies?.find(s => s.supply_type === 'diapers');
                const diaperCount = diapersStock?.quantity || 0;
                const threshold = diapersStock?.alert_threshold || 5;
                setChildStock({ diapers: diaperCount, alertThreshold: threshold });
                setShowLowStockAlert(diaperCount <= threshold);
            }
        } catch (error) {
            console.error('Erreur chargement stock:', error);
        }
    };

    const isBaby = selectedChild ? (() => {
        const birthDate = new Date(selectedChild.birth_date);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        return ageInMonths < 12;
    })() : false;

    const getAgeText = (birthDate) => {
        const birth = new Date(birthDate);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (months < 12) {
            return isRTL ? `${months} أشهر` : `${months} mois`;
        }
        const years = Math.floor(months / 12);
        return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
    };

    const addMeal = () => {
        const now = new Date();
        const currentHour = now.getHours();
        let defaultPeriod = 'morning';
        if (currentHour >= 11 && currentHour < 15) {
            defaultPeriod = 'noon';
        } else if (currentHour >= 15) {
            defaultPeriod = 'snack';
        }
        setFormData(prev => ({
            ...prev,
            meals: [...prev.meals, { period: defaultPeriod, meal_type: 'bottle', meal_description: '', quantity: 'full' }]
        }));
    };

    const removeMeal = (index) => {
        setFormData(prev => ({
            ...prev,
            meals: prev.meals.filter((_, i) => i !== index)
        }));
    };

    const updateMeal = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            meals: prev.meals.map((meal, i) => i === index ? { ...meal, [field]: value } : meal)
        }));
    };

    const addDiaperChange = async () => {
        const now = new Date();
        const currentHour = now.getHours();
        // Heures de 7h à 18h
        const predefinedTimes = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        // Trouver l'heure la plus proche dans la plage
        let closestTime = '12:00';
        if (currentHour >= 7 && currentHour <= 18) {
            closestTime = `${currentHour}:00`;
        } else if (currentHour < 7) {
            closestTime = '7:00';
        } else {
            closestTime = '18:00';
        }

        setFormData(prev => ({
            ...prev,
            diaper_changes_list: [...prev.diaper_changes_list, { nature: 'pee', time: closestTime, notes: '' }]
        }));

        // Décrémenter le stock de couches via l'API
        if (selectedChild) {
            try {
                const response = await api.post(`/api/supplies/child/${selectedChild.id}/use`, {
                    supply_type: 'diapers',
                    quantity: 1
                });
                if (response.data?.success) {
                    const newStock = response.data.supply?.quantity || 0;
                    setChildStock(prev => ({ ...prev, diapers: newStock }));
                    if (response.data.low_stock_alert) {
                        setShowLowStockAlert(true);
                        toast.error(isRTL ? 'تنبيه: مخزون الحفاضات منخفض!' : 'Alerte: Stock de couches bas!');
                    }
                }
            } catch (error) {
                console.error('Erreur décrémentation stock:', error);
            }
        }
    };

    const removeDiaperChange = (index) => {
        setFormData(prev => ({
            ...prev,
            diaper_changes_list: prev.diaper_changes_list.filter((_, i) => i !== index)
        }));
    };

    const updateDiaperChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            diaper_changes_list: prev.diaper_changes_list.map((change, i) => i === index ? { ...change, [field]: value } : change)
        }));
    };

    const handleFoodInputChange = (text) => {
        if (text.endsWith(',')) {
            const word = text.slice(0, -1).trim();
            if (word && !foodBadges.includes(word)) {
                const newBadges = [...foodBadges, word];
                setFoodBadges(newBadges);
                setFormData(prev => ({ ...prev, supplies_food: newBadges.join(', ') }));
            }
            setFoodInputText('');
            setShowFoodSuggestions(false);
        } else {
            setFoodInputText(text);
            setShowFoodSuggestions(text.length > 0);
        }
    };

    const addFoodBadge = (food) => {
        if (!foodBadges.includes(food)) {
            const newBadges = [...foodBadges, food];
            setFoodBadges(newBadges);
            setFormData(prev => ({ ...prev, supplies_food: newBadges.join(', ') }));
        }
        setFoodInputText('');
        setShowFoodSuggestions(false);
    };

    const removeFoodBadge = (food) => {
        const newBadges = foodBadges.filter(b => b !== food);
        setFoodBadges(newBadges);
        setFormData(prev => ({ ...prev, supplies_food: newBadges.join(', ') }));
    };

    const filteredFoodSuggestions = foodOptions.filter(
        opt => opt.toLowerCase().includes(foodInputText.toLowerCase()) && !foodBadges.includes(opt)
    ).slice(0, 5);

    const saveSupplies = async () => {
        if (!selectedChild) return;
        if (formData.supplies_diapers === 0 && foodBadges.length === 0 && !foodInputText.trim()) {
            toast.error(isRTL ? 'لا توجد مستلزمات للحفظ' : 'Aucune fourniture à enregistrer');
            return;
        }

        setSavingSupplies(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let finalFoodList = [...foodBadges];
            if (foodInputText.trim()) {
                finalFoodList.push(foodInputText.trim());
            }

            if (formData.supplies_diapers > 0) {
                await api.post(`/api/supplies/child/${selectedChild.id}/refill`, {
                    supply_type: 'diapers',
                    quantity: formData.supplies_diapers,
                    notes: `Apporté le ${today}`
                });
            }

            if (finalFoodList.length > 0) {
                const foodDescription = finalFoodList.join(', ');
                await api.post(`/api/supplies/child/${selectedChild.id}/refill`, {
                    supply_type: 'food',
                    quantity: 1,
                    notes: foodDescription
                });
            }

            // Recharger les options de nourriture
            const foodRes = await api.get(`/api/supplies/child/${selectedChild.id}/food-options`);
            if (foodRes.data?.success) {
                setFoodOptions(foodRes.data.food_options || []);
            }

            // Recharger le stock de couches
            if (formData.supplies_diapers > 0) {
                const stockRes = await api.get(`/api/supplies/child/${selectedChild.id}`);
                if (stockRes.data?.success) {
                    const diapersStock = stockRes.data.supplies?.find(s => s.supply_type === 'diapers');
                    const diaperCount = diapersStock?.quantity || 0;
                    const threshold = diapersStock?.alert_threshold || 5;
                    setChildStock({ diapers: diaperCount, alertThreshold: threshold });
                    setShowLowStockAlert(diaperCount <= threshold);
                }
            }

            setFormData(prev => ({ ...prev, supplies_diapers: 0, supplies_food: '' }));
            setFoodBadges([]);
            setFoodInputText('');

            toast.success(isRTL ? 'تم حفظ المستلزمات' : 'Fournitures enregistrées');
        } catch (error) {
            console.error('Erreur sauvegarde fournitures:', error);
            toast.error(isRTL ? 'خطأ في حفظ المستلزمات' : 'Erreur lors de l\'enregistrement');
        } finally {
            setSavingSupplies(false);
        }
    };

    const saveReport = async (sendToParent = false) => {
        if (!selectedChild) return;

        setSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const payload = {
                child_id: selectedChild.id,
                report_date: today,
                ...formData,
                temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                sleep_start: formData.sleep_start || null,
                sleep_end: formData.sleep_end || null,
                status: sendToParent ? 'sent' : 'completed',
            };

            const response = await api.post('/api/daily-reports', payload);

            if (response.data?.success) {
                toast.success(sendToParent ? 'Envoyé aux parents' : 'Enregistré avec succès');
                setChildren(prev => prev.map(c =>
                    c.id === selectedChild.id
                        ? { ...c, has_report: true, report_status: payload.status }
                        : c
                ));
                setSelectedChild(prev => prev ? { ...prev, has_report: true, report_status: payload.status } : null);
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            toast.error(isRTL ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const filteredChildren = children.filter(child =>
        `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ backgroundColor: dirColors.background, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={40} color={dirColors.primary} className="animate-spin" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: dirColors.background, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${dirColors.primary} 0%, #6366F1 100%)`,
                padding: '20px 16px',
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
            }}>
                <button
                    onClick={() => selectedChild ? setSelectedChild(null) : navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        marginBottom: 12,
                        fontSize: 16,
                    }}
                >
                    <ChevronLeft size={24} />
                    <span>{labels.back}</span>
                </button>
                <h1 style={{ fontSize: 24, fontWeight: 'bold', color: 'white', margin: 0 }}>
                    {labels.title}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                    {labels.subtitle}
                </p>
            </div>

            {/* Barre de recherche */}
            <div style={{
                margin: '0 16px',
                marginTop: -20,
                backgroundColor: dirColors.card,
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
                <Search size={20} color={dirColors.textSecondary} />
                <input
                    type="text"
                    placeholder={labels.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        color: dirColors.text,
                        fontSize: 16,
                        outline: 'none',
                    }}
                />
            </div>

            {/* Contenu */}
            <div style={{ padding: 16, paddingBottom: 100 }}>
                {!selectedChild ? (
                    // Liste des enfants
                    <div>
                        {filteredChildren.map((child) => (
                            <div
                                key={child.id}
                                onClick={() => selectChild(child)}
                                style={{
                                    backgroundColor: dirColors.card,
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: child.report_type === 'baby' ? '#FCE7F3' : '#DBEAFE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Baby size={24} color={child.report_type === 'baby' ? dirColors.pink : dirColors.blue} />
                                </div>
                                <div style={{ flex: 1, marginLeft: 12 }}>
                                    <p style={{ fontSize: 16, fontWeight: 600, color: dirColors.text, margin: 0 }}>
                                        {child.first_name} {child.last_name}
                                    </p>
                                    <p style={{ fontSize: 12, color: dirColors.textSecondary, margin: 0 }}>
                                        {getAgeText(child.birth_date)}
                                    </p>
                                </div>
                                {child.report_type === 'baby' && (
                                    <span style={{
                                        backgroundColor: '#FCE7F3',
                                        color: '#BE185D',
                                        padding: '4px 8px',
                                        borderRadius: 12,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        marginRight: 8,
                                    }}>
                                        {labels.baby}
                                    </span>
                                )}
                                <span style={{
                                    backgroundColor: child.has_report ? '#DCFCE7' : '#FEF3C7',
                                    color: child.has_report ? '#16A34A' : '#D97706',
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}>
                                    {child.has_report ? labels.completed : labels.pending}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Formulaire
                    <div>
                        {/* En-tête enfant */}
                        <div style={{
                            backgroundColor: dirColors.card,
                            borderRadius: 16,
                            padding: 20,
                            marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    onClick={() => setSelectedChild(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <ChevronLeft size={24} color={dirColors.primary} />
                                </button>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 18, fontWeight: 'bold', color: dirColors.text, margin: 0 }}>
                                        {selectedChild.first_name} {selectedChild.last_name}
                                    </p>
                                    <p style={{ fontSize: 14, color: dirColors.textSecondary, margin: 0 }}>
                                        {getAgeText(selectedChild.birth_date)} • {selectedChild.report_type === 'baby' ? labels.baby : labels.child}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section Fournitures apportées */}
                        <div style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                        }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#86EFAC', marginBottom: 4 }}>
                                🎒 {labels.supplies}
                            </p>
                            <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 12 }}>
                                {labels.suppliesDesc}
                            </p>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 4 }}>
                                        🧷 {labels.diapers}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={formData.supplies_diapers || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, supplies_diapers: parseInt(e.target.value) || 0 }))}
                                            style={{
                                                width: 60,
                                                backgroundColor: dirColors.cardLight,
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '8px 12px',
                                                color: dirColors.text,
                                                textAlign: 'center',
                                            }}
                                        />
                                        <span style={{ color: dirColors.textSecondary, fontSize: 12 }}>{labels.pieces}</span>
                                    </div>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 4 }}>
                                        🍼 {labels.food}
                                    </p>
                                    {foodBadges.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                                            {foodBadges.map((badge, idx) => (
                                                <div key={idx} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    backgroundColor: dirColors.success,
                                                    padding: '4px 8px',
                                                    borderRadius: 12,
                                                }}>
                                                    <span style={{ color: 'white', fontSize: 12, marginRight: 4 }}>{badge}</span>
                                                    <button onClick={() => removeFoodBadge(badge)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                        <X size={14} color="white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'تابع بفاصلة...' : 'Tapez puis virgule...'}
                                        value={foodInputText}
                                        onChange={(e) => handleFoodInputChange(e.target.value)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: dirColors.cardLight,
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '8px 12px',
                                            color: dirColors.text,
                                        }}
                                    />
                                    {showFoodSuggestions && filteredFoodSuggestions.length > 0 && (
                                        <div style={{
                                            backgroundColor: dirColors.card,
                                            borderRadius: 8,
                                            marginTop: 4,
                                            border: `1px solid ${dirColors.cardLight}`,
                                        }}>
                                            {filteredFoodSuggestions.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => addFoodBadge(suggestion)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        borderBottom: idx < filteredFoodSuggestions.length - 1 ? `1px solid ${dirColors.cardLight}` : 'none',
                                                    }}
                                                >
                                                    <span style={{ color: dirColors.text, fontSize: 13 }}>{suggestion}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={saveSupplies}
                                disabled={savingSupplies}
                                style={{
                                    width: '100%',
                                    backgroundColor: dirColors.success,
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: 8,
                                    border: 'none',
                                    marginTop: 12,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    opacity: savingSupplies ? 0.7 : 1,
                                }}
                            >
                                {savingSupplies ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <Check size={20} />
                                        {labels.validateSupplies}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Section Repas */}
                        <div style={{
                            backgroundColor: 'rgba(249, 115, 22, 0.15)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#FDBA74', margin: 0 }}>
                                    🍽️ {labels.meals} ({formData.meals.length})
                                </p>
                                <button
                                    onClick={addMeal}
                                    style={{
                                        backgroundColor: dirColors.orange,
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    + {labels.add}
                                </button>
                            </div>
                            {formData.meals.length === 0 ? (
                                <p style={{ color: dirColors.textSecondary, fontSize: 14 }}>{labels.noMeals}</p>
                            ) : (
                                formData.meals.map((meal, index) => (
                                    <div key={index} style={{
                                        backgroundColor: dirColors.card,
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 8,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <span style={{ fontWeight: 600, color: dirColors.text }}>Repas {index + 1}</span>
                                            <button onClick={() => removeMeal(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <X size={20} color={dirColors.danger} />
                                            </button>
                                        </div>
                                        {/* Période */}
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 6 }}>Période</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {[
                                                    { value: 'morning', label: 'Matin' },
                                                    { value: 'noon', label: 'Midi' },
                                                    { value: 'snack', label: 'Goûter' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateMeal(index, 'period', opt.value)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 6,
                                                            border: 'none',
                                                            backgroundColor: meal.period === opt.value ? dirColors.primary : dirColors.cardLight,
                                                            color: meal.period === opt.value ? 'white' : dirColors.text,
                                                            fontSize: 12,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Type - Biberon par défaut, nourriture apportée, et Autre */}
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 6 }}>Type</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {/* Biberon */}
                                                <button
                                                    onClick={() => updateMeal(index, 'meal_type', 'bottle')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: 6,
                                                        border: 'none',
                                                        backgroundColor: meal.meal_type === 'bottle' ? dirColors.primary : dirColors.cardLight,
                                                        color: meal.meal_type === 'bottle' ? 'white' : dirColors.text,
                                                        fontSize: 12,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    🍼 Biberon
                                                </button>
                                                {/* Nourriture apportée par le parent */}
                                                {foodOptions.map((food, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            updateMeal(index, 'meal_type', 'food_brought');
                                                            updateMeal(index, 'meal_description', food);
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 6,
                                                            border: 'none',
                                                            backgroundColor: meal.meal_type === 'food_brought' && meal.meal_description === food ? dirColors.success : dirColors.cardLight,
                                                            color: meal.meal_type === 'food_brought' && meal.meal_description === food ? 'white' : dirColors.text,
                                                            fontSize: 12,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        🥗 {food}
                                                    </button>
                                                ))}
                                                {/* Autre */}
                                                <button
                                                    onClick={() => updateMeal(index, 'meal_type', 'other')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: 6,
                                                        border: 'none',
                                                        backgroundColor: meal.meal_type === 'other' ? dirColors.orange : dirColors.cardLight,
                                                        color: meal.meal_type === 'other' ? 'white' : dirColors.text,
                                                        fontSize: 12,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    📝 Autre
                                                </button>
                                            </div>
                                        </div>
                                        {/* Description */}
                                        <input
                                            type="text"
                                            placeholder="Description..."
                                            value={meal.meal_description || ''}
                                            onChange={(e) => updateMeal(index, 'meal_description', e.target.value)}
                                            style={{
                                                width: '100%',
                                                backgroundColor: dirColors.cardLight,
                                                border: 'none',
                                                borderRadius: 6,
                                                padding: '10px 12px',
                                                color: dirColors.text,
                                                fontSize: 13,
                                            }}
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Section Couches */}
                        <div style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                        }}>
                            {/* Alerte stock bas */}
                            {showLowStockAlert && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    borderRadius: 8,
                                    padding: 10,
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <AlertTriangle size={18} color={dirColors.danger} />
                                    <span style={{ color: dirColors.danger, fontSize: 13, fontWeight: 500 }}>
                                        {isRTL ? `تنبيه: مخزون منخفض (${childStock.diapers} متبقية)` : `Alerte: Stock bas (${childStock.diapers} restantes)`}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#93C5FD', margin: 0 }}>
                                        💧 {labels.diaper} ({formData.diaper_changes_list.length})
                                    </p>
                                </div>
                                <button
                                    onClick={addDiaperChange}
                                    style={{
                                        backgroundColor: dirColors.blue,
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    + {labels.add}
                                </button>
                            </div>
                            {formData.diaper_changes_list.length === 0 ? (
                                <p style={{ color: dirColors.textSecondary, fontSize: 14 }}>{labels.noDiapers}</p>
                            ) : (
                                formData.diaper_changes_list.map((change, index) => (
                                    <div key={index} style={{
                                        backgroundColor: dirColors.card,
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 8,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <span style={{ fontWeight: 600, color: dirColors.text }}>Change {index + 1}</span>
                                            <button onClick={() => removeDiaperChange(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <X size={20} color={dirColors.danger} />
                                            </button>
                                        </div>
                                        {/* Heure - Scroll horizontal de 7h à 18h */}
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 6 }}>Heure</p>
                                            <div style={{
                                                display: 'flex',
                                                gap: 6,
                                                overflowX: 'auto',
                                                paddingBottom: 8,
                                                WebkitOverflowScrolling: 'touch',
                                            }}>
                                                {['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => updateDiaperChange(index, 'time', time)}
                                                        style={{
                                                            padding: '8px 14px',
                                                            borderRadius: 8,
                                                            border: 'none',
                                                            backgroundColor: change.time === time ? dirColors.primary : dirColors.cardLight,
                                                            color: change.time === time ? 'white' : dirColors.text,
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Nature */}
                                        <div>
                                            <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 6 }}>Nature</p>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {[
                                                    { value: 'pee', label: labels.pee },
                                                    { value: 'poop', label: labels.poop },
                                                    { value: 'mixed', label: labels.mixed },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateDiaperChange(index, 'nature', opt.value)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 6,
                                                            border: 'none',
                                                            backgroundColor: change.nature === opt.value ? dirColors.primary : dirColors.cardLight,
                                                            color: change.nature === opt.value ? 'white' : dirColors.text,
                                                            fontSize: 12,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* État de la peau */}
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: dirColors.text, marginBottom: 8 }}>
                                💗 {labels.skin}
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[
                                    { value: 'good', label: labels.skinNormal, color: dirColors.success },
                                    { value: 'other', label: labels.skinOther, color: dirColors.orange },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData(prev => ({ ...prev, skin_condition: opt.value }))}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: 20,
                                            border: 'none',
                                            backgroundColor: formData.skin_condition === opt.value ? opt.color : dirColors.cardLight,
                                            color: formData.skin_condition === opt.value ? 'white' : dirColors.text,
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sommeil */}
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: dirColors.text, marginBottom: 8 }}>
                                🌙 {labels.sleep}
                            </p>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                {[
                                    { value: 'calm', label: labels.calm, color: dirColors.blue },
                                    { value: 'discontinuous', label: labels.discontinuous, color: dirColors.warning },
                                    { value: 'deep', label: labels.deep, color: '#6366F1' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData(prev => ({ ...prev, sleep_quality: opt.value }))}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: 20,
                                            border: 'none',
                                            backgroundColor: formData.sleep_quality === opt.value ? opt.color : dirColors.cardLight,
                                            color: formData.sleep_quality === opt.value ? 'white' : dirColors.text,
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {/* Heures de sommeil */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 4 }}>{labels.start}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {['12:00', '12:30', '13:00', '13:30', '14:00'].map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setFormData(prev => ({ ...prev, sleep_start: time }))}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: 6,
                                                    border: 'none',
                                                    backgroundColor: formData.sleep_start === time ? dirColors.primary : dirColors.cardLight,
                                                    color: formData.sleep_start === time ? 'white' : dirColors.text,
                                                    fontSize: 11,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 12, color: dirColors.textSecondary, marginBottom: 4 }}>{labels.end}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {['14:00', '14:30', '15:00', '15:30', '16:00'].map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setFormData(prev => ({ ...prev, sleep_end: time }))}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: 6,
                                                    border: 'none',
                                                    backgroundColor: formData.sleep_end === time ? dirColors.primary : dirColors.cardLight,
                                                    color: formData.sleep_end === time ? 'white' : dirColors.text,
                                                    fontSize: 11,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activités */}
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: dirColors.text, marginBottom: 8 }}>
                                🎨 {labels.activities}
                            </p>
                            <textarea
                                placeholder={isRTL ? 'الأنشطة التي قام بها الطفل...' : 'Activités réalisées...'}
                                value={formData.activities}
                                onChange={(e) => setFormData(prev => ({ ...prev, activities: e.target.value }))}
                                rows={3}
                                style={{
                                    width: '100%',
                                    backgroundColor: dirColors.cardLight,
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '12px 16px',
                                    color: dirColors.text,
                                    fontSize: 14,
                                    resize: 'none',
                                }}
                            />
                        </div>

                        {/* Observations */}
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: dirColors.text, marginBottom: 8 }}>
                                📝 {labels.observations}
                            </p>
                            <textarea
                                placeholder={isRTL ? 'ملاحظات عامة...' : 'Observations générales...'}
                                value={formData.observations}
                                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                rows={3}
                                style={{
                                    width: '100%',
                                    backgroundColor: dirColors.cardLight,
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '12px 16px',
                                    color: dirColors.text,
                                    fontSize: 14,
                                    resize: 'none',
                                }}
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button
                                onClick={() => saveReport(false)}
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    backgroundColor: dirColors.cardLight,
                                    color: dirColors.text,
                                    padding: '14px 20px',
                                    borderRadius: 12,
                                    border: 'none',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                <Save size={20} />
                                {labels.save}
                            </button>
                            <button
                                onClick={() => saveReport(true)}
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    backgroundColor: dirColors.primary,
                                    color: 'white',
                                    padding: '14px 20px',
                                    borderRadius: 12,
                                    border: 'none',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                {labels.send}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileDailyReportsPage;
