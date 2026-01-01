/**
 * Page de consultation des rapports journaliers pour les parents
 * Permet aux parents de voir les rapports quotidiens de leurs enfants
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Baby, User, Calendar, ChevronLeft, ChevronRight,
    Thermometer, Pill, Utensils, Droplets, Heart, Moon, Activity,
    MessageSquare, Clock, CheckCircle, AlertCircle, Loader2,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ChildDailyReportsPage = () => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    // États
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Charger les enfants du parent
    useEffect(() => {
        loadChildren();
    }, [selectedDate]);

    const loadChildren = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/daily-reports/parent/my-children?date=${selectedDate}`);
            if (res.data.success) {
                setChildren(res.data.children);
                // Sélectionner automatiquement le premier enfant
                if (res.data.children.length > 0 && !selectedChild) {
                    selectChild(res.data.children[0]);
                } else if (selectedChild) {
                    // Recharger le rapport de l'enfant sélectionné
                    const updatedChild = res.data.children.find(c => c.child_id === selectedChild.child_id);
                    if (updatedChild) {
                        selectChild(updatedChild);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    // Sélectionner un enfant et charger son rapport
    const selectChild = async (child) => {
        setSelectedChild(child);

        if (child.has_report && child.report_id) {
            // Charger les détails complets du rapport (avec meals_details et diaper_changes_details)
            try {
                setLoadingReport(true);
                const res = await api.get(`/api/daily-reports/${child.child_id}/${selectedDate}`);
                if (res.data.success) {
                    setSelectedReport(res.data.report);
                } else {
                    setSelectedReport({
                        ...child,
                        report_date: selectedDate
                    });
                }
            } catch (error) {
                console.error('Erreur chargement rapport:', error);
                setSelectedReport({
                    ...child,
                    report_date: selectedDate
                });
            } finally {
                setLoadingReport(false);
            }
        } else {
            setSelectedReport(null);
        }

    };

    // Charger un rapport spécifique par date
    const loadReportByDate = async (date) => {
        if (!selectedChild) return;

        setLoadingReport(true);
        setSelectedDate(date);

        try {
            const res = await api.get(`/api/daily-reports/${selectedChild.child_id}/${date}`);
            if (res.data.success) {
                setSelectedReport(res.data.report);
            } else {
                setSelectedReport(null);
            }
        } catch (error) {
            setSelectedReport(null);
        } finally {
            setLoadingReport(false);
        }
    };

    // Navigation entre les dates
    const navigateDate = (direction) => {
        const current = new Date(selectedDate);
        current.setDate(current.getDate() + direction);
        const newDate = current.toISOString().split('T')[0];
        loadReportByDate(newDate);
    };

    // Calculer l'âge
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

    // Formater la date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', options);
    };

    // Labels multilingues
    const labels = {
        title: isRTL ? 'تقارير أطفالي' : 'Rapports de mes enfants',
        subtitle: isRTL ? 'متابعة يومية لأطفالك' : 'Suivi quotidien de vos enfants',
        noReport: isRTL ? 'لا يوجد تقرير لهذا اليوم' : 'Pas de rapport pour ce jour',
        noReportDesc: isRTL ? 'لم يتم ملء تقرير لهذا التاريخ بعد' : 'Aucun rapport n\'a été rempli pour cette date',
        baby: isRTL ? 'رضيع' : 'Bébé',
        child: isRTL ? 'طفل' : 'Enfant',
        temperature: isRTL ? 'الحرارة' : 'Température',
        medication: isRTL ? 'الأدوية' : 'Médicaments',
        meals: isRTL ? 'الوجبات' : 'Repas',
        appetite: isRTL ? 'الشهية' : 'Appétit',
        good: isRTL ? 'جيد' : 'Bien',
        medium: isRTL ? 'متوسط' : 'Moyen',
        none: isRTL ? 'لا شهية' : 'Pas d\'appétit',
        diaper: isRTL ? 'الحفاظات' : 'Couches',
        changes: isRTL ? 'تغييرات' : 'changements',
        pee: isRTL ? 'بول' : 'Pipi',
        poop: isRTL ? 'براز' : 'Selles',
        mixed: isRTL ? 'مختلط' : 'Mixte',
        skin: isRTL ? 'حالة الجلد' : 'État de la peau',
        skinGood: isRTL ? 'جيد' : 'Bien',
        skinOther: isRTL ? 'أخرى' : 'Autre',
        sleep: isRTL ? 'النوم' : 'Sommeil',
        calm: isRTL ? 'هادئ' : 'Calme',
        discontinuous: isRTL ? 'متقطع' : 'Discontinu',
        deep: isRTL ? 'عميق' : 'Profond',
        activities: isRTL ? 'الأنشطة' : 'Activités',
        observations: isRTL ? 'ملاحظات' : 'Observations',
        educator: isRTL ? 'المربية' : 'Éducatrice',
        history: isRTL ? 'السجل' : 'Historique',
        back: isRTL ? 'رجوع' : 'Retour',
        bottle: isRTL ? 'رضاعة' : 'Biberon',
        compote: isRTL ? 'كومبوت' : 'Compote',
        fruit: isRTL ? 'فاكهة' : 'Fruit',
        solid: isRTL ? 'صلب' : 'Solide',
        other: isRTL ? 'أخرى' : 'Autre'
    };

    // Mapper les valeurs aux labels
    const getAppetiteLabel = (value) => {
        const map = { good: labels.good, medium: labels.medium, none: labels.none };
        return map[value] || value;
    };

    const getSleepLabel = (value) => {
        const map = { calm: labels.calm, discontinuous: labels.discontinuous, deep: labels.deep };
        return map[value] || value;
    };

    const getDiaperLabel = (value) => {
        const map = { pee: labels.pee, poop: labels.poop, mixed: labels.mixed };
        return map[value] || value;
    };

    const getMealTypeLabel = (value) => {
        const map = { bottle: labels.bottle, compote: labels.compote, fruit: labels.fruit, solid: labels.solid, other: labels.other };
        return map[value] || value;
    };

    const getAppetiteColor = (value) => {
        const map = { good: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', none: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
        return map[value] || 'bg-gray-100 text-gray-700';
    };

    const getSleepColor = (value) => {
        const map = { calm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', discontinuous: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', deep: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' };
        return map[value] || 'bg-gray-100 text-gray-700';
    };

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
                <Button
                    variant="ghost"
                    onClick={() => navigate('/mon-espace')}
                    className={`mb-4 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
                    {labels.back}
                </Button>

                <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <FileText className="inline-block w-8 h-8 mr-2 text-primary-500" />
                    {labels.title}
                </h1>
                <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {labels.subtitle}
                </p>
            </div>

            {/* Sélection d'enfant (si plusieurs) */}
            {children.length > 1 && (
                <div className="flex flex-wrap gap-3 mb-6">
                    {children.map(child => (
                        <button
                            key={child.child_id}
                            onClick={() => selectChild(child)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${selectedChild?.child_id === child.child_id
                                ? 'bg-primary-500 text-white shadow-lg'
                                : isDark
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                                }`}
                        >
                            {child.report_type === 'baby' ? (
                                <Baby className="w-4 h-4" />
                            ) : (
                                <User className="w-4 h-4" />
                            )}
                            <span>{child.first_name}</span>
                            {child.has_report && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </button>
                    ))}
                </div>
            )}

            {selectedChild && (
                <div className="max-w-4xl mx-auto">
                    {/* Rapport */}
                    <div>
                        {/* Navigation de date */}
                        <Card className={`mb-4 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigateDate(-1)}
                                    >
                                        <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                    </Button>

                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-primary-500" />
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => loadReportByDate(e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className={`bg-transparent border-none outline-none text-center font-medium cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'
                                                }`}
                                        />
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigateDate(1)}
                                        disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                                    >
                                        <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                    </Button>
                                </div>
                                <p className={`text-center text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {formatDate(selectedDate)}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Contenu du rapport */}
                        <AnimatePresence mode="wait">
                            {loadingReport ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center py-20"
                                >
                                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                </motion.div>
                            ) : selectedReport ? (
                                <motion.div
                                    key="report"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                                        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedChild.report_type === 'baby'
                                                        ? 'bg-pink-100 dark:bg-pink-900/40'
                                                        : 'bg-blue-100 dark:bg-blue-900/40'
                                                        }`}>
                                                        {selectedChild.photo_url ? (
                                                            <img src={selectedChild.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                                                        ) : selectedChild.report_type === 'baby' ? (
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
                                                            {getAgeText(selectedChild.birth_date)}
                                                            {selectedReport.educator_first_name && (
                                                                <span className="ml-3">
                                                                    • {labels.educator}: {selectedReport.educator_first_name} {selectedReport.educator_last_name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Stock couches et fournitures du jour */}
                                                <div className="flex items-center gap-4">
                                                    {/* Stock couches */}
                                                    <div className={`px-3 py-2 rounded-lg ${selectedChild.diaper_low_stock
                                                        ? 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700'
                                                        : 'bg-green-100 dark:bg-green-900/40'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">🧷</span>
                                                            <div>
                                                                <p className={`text-xs ${selectedChild.diaper_low_stock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                    {isRTL ? 'مخزون الحفاضات' : 'Stock couches'}
                                                                </p>
                                                                <p className={`text-lg font-bold ${selectedChild.diaper_low_stock ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                                                                    {selectedChild.diaper_stock || 0}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Fournitures apportées ce jour */}
                                                    {(selectedReport.today_supplies?.length > 0 || selectedChild.today_supplies?.length > 0) && (
                                                        <div className="px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">🎒</span>
                                                                <div>
                                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                                        {isRTL ? 'أحضر هذا اليوم' : 'Apporté ce jour'}
                                                                    </p>
                                                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                                                        {(selectedReport.today_supplies || selectedChild.today_supplies).map(s =>
                                                                            s.supply_type === 'diapers'
                                                                                ? `${s.quantity} ${isRTL ? 'حفاضات' : 'couches'}`
                                                                                : s.description || (isRTL ? 'طعام' : 'Nourriture')
                                                                        ).join(', ')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Section Bébé */}
                                                {selectedChild.report_type === 'baby' && (
                                                    <>
                                                        {/* Température */}
                                                        {selectedReport.temperature && (
                                                            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Thermometer className="w-5 h-5 text-red-500" />
                                                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                        {labels.temperature}
                                                                    </span>
                                                                </div>
                                                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {selectedReport.temperature}°C
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Médicaments */}
                                                        {selectedReport.medication && (
                                                            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Pill className="w-5 h-5 text-purple-500" />
                                                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                        {labels.medication}
                                                                    </span>
                                                                </div>
                                                                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                                    {selectedReport.medication}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Repas bébé (ancienne version) */}
                                                        {(selectedReport.meals_count > 0 || selectedReport.meal_type) && !selectedReport.meals_details?.length && (
                                                            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Utensils className="w-5 h-5 text-orange-500" />
                                                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                        {labels.meals}
                                                                    </span>
                                                                </div>
                                                                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                                    {selectedReport.meals_count} {isRTL ? 'وجبات' : 'repas'}
                                                                    {selectedReport.meal_type && ` - ${getMealTypeLabel(selectedReport.meal_type)}`}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* Repas détaillés (nouvelle version) */}
                                                {selectedReport.meals_details?.length > 0 && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} md:col-span-2`}>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Utensils className="w-5 h-5 text-orange-500" />
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {labels.meals} ({selectedReport.meals_details.length})
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {selectedReport.meals_details.map((meal, idx) => (
                                                                <div key={idx} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                                                                            {meal.period === 'morning' ? (isRTL ? 'صباح' : 'Matin') :
                                                                                meal.period === 'noon' ? (isRTL ? 'ظهر' : 'Midi') :
                                                                                    meal.period === 'afternoon' ? (isRTL ? 'بعد الظهر' : 'Après-midi') :
                                                                                        (isRTL ? 'يوم كامل' : 'Journée')}
                                                                        </span>
                                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                                            {meal.meal_type?.startsWith('food_')
                                                                                ? meal.meal_type.replace('food_', '').replace(/_/g, ' ')
                                                                                : getMealTypeLabel(meal.meal_type)}
                                                                        </span>
                                                                        {meal.meal_description && (
                                                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                ({meal.meal_description})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {meal.quantity && (
                                                                        <span className={`px-2 py-0.5 rounded text-xs ${(meal.quantity === 'good' || meal.quantity === 'full') ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                                                            (meal.quantity === 'medium' || meal.quantity === 'half') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                                                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                                            }`}>
                                                                            {(meal.quantity === 'good' || meal.quantity === 'full') ? (isRTL ? 'جيد' : 'Bien') :
                                                                                (meal.quantity === 'medium' || meal.quantity === 'half') ? (isRTL ? 'متوسط' : 'Moyen') :
                                                                                    (isRTL ? 'قليل' : 'Peu')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Appétit */}
                                                {selectedReport.appetite && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Utensils className="w-5 h-5 text-orange-500" />
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {labels.appetite}
                                                            </span>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAppetiteColor(selectedReport.appetite)}`}>
                                                            {getAppetiteLabel(selectedReport.appetite)}
                                                        </span>
                                                        {selectedReport.appetite_notes && (
                                                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {selectedReport.appetite_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Couches (ancienne version) */}
                                                {(selectedReport.diaper_changes > 0 || selectedReport.diaper_nature) && !selectedReport.diaper_changes_details?.length && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Droplets className="w-5 h-5 text-blue-500" />
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {labels.diaper}
                                                            </span>
                                                        </div>
                                                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                            {selectedReport.diaper_changes} {labels.changes}
                                                            {selectedReport.diaper_nature && ` - ${getDiaperLabel(selectedReport.diaper_nature)}`}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Couches détaillées (nouvelle version) */}
                                                {selectedReport.diaper_changes_details?.length > 0 && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} md:col-span-2`}>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Droplets className="w-5 h-5 text-blue-500" />
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {labels.diaper} ({selectedReport.diaper_changes_details.length} {labels.changes})
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {selectedReport.diaper_changes_details.map((change, idx) => (
                                                                <div key={idx} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        {change.change_time && (
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                                                                <Clock className="inline w-3 h-3 mr-1" />
                                                                                {change.change_time.substring(0, 5)}
                                                                            </span>
                                                                        )}
                                                                        <span className={`px-2 py-0.5 rounded text-xs ${change.nature === 'pee' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                                            change.nature === 'poop' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                                                                'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                                                                            }`}>
                                                                            {getDiaperLabel(change.nature)}
                                                                        </span>
                                                                    </div>
                                                                    {change.notes && (
                                                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                            {change.notes}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* État de la peau */}
                                                {selectedReport.skin_condition && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Heart className="w-5 h-5 text-pink-500" />
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {labels.skin}
                                                            </span>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedReport.skin_condition === 'good'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                                            }`}>
                                                            {selectedReport.skin_condition === 'good' ? labels.skinGood : labels.skinOther}
                                                        </span>
                                                        {selectedReport.skin_notes && (
                                                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {selectedReport.skin_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Sommeil */}
                                                {selectedReport.sleep_quality && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Moon className="w-5 h-5 text-indigo-500" />
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {labels.sleep}
                                                            </span>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSleepColor(selectedReport.sleep_quality)}`}>
                                                            {getSleepLabel(selectedReport.sleep_quality)}
                                                        </span>
                                                        {(selectedReport.sleep_start || selectedReport.sleep_end) && (
                                                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                <Clock className="inline w-4 h-4 mr-1" />
                                                                {(selectedReport.sleep_start || '--:--').substring(0, 5)} - {(selectedReport.sleep_end || '--:--').substring(0, 5)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Activités */}
                                            {selectedReport.activities && (
                                                <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Activity className="w-5 h-5 text-green-500" />
                                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {labels.activities}
                                                        </span>
                                                    </div>
                                                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                        {selectedReport.activities}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Observations */}
                                            {selectedReport.observations && (
                                                <div className={`mt-4 p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="w-5 h-5 text-primary-500" />
                                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {labels.observations}
                                                        </span>
                                                    </div>
                                                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                        {selectedReport.observations}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-report"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                                        <CardContent className="py-16 text-center">
                                            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {labels.noReport}
                                            </h3>
                                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                                {labels.noReportDesc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Aucun enfant */}
            {children.length === 0 && (
                <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                    <CardContent className="py-16 text-center">
                        <Baby className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'لا يوجد أطفال مسجلين' : 'Aucun enfant inscrit'}
                        </h3>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {isRTL ? 'لم يتم العثور على أطفال مرتبطين بحسابك' : 'Aucun enfant n\'est associé à votre compte'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ChildDailyReportsPage;
