import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Moon, Flag, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import ToggleSwitch from './ui/ToggleSwitch';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const HolidayPoliciesManager = () => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [expandedSection, setExpandedSection] = useState('national');

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            // Utiliser /api/holidays pour récupérer les politiques
            const response = await api.get('/api/holidays');

            if (response.data.success) {
                setPolicies(response.data.holidays);
            }
        } catch (error) {
            console.error('Erreur chargement politiques:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePolicy = async (policy) => {
        try {
            setSaving(policy.id);
            // Utiliser /api/holidays/:id pour modifier
            const response = await api.put(`/api/holidays/${policy.id}`, {
                is_active: !policy.is_active
            });

            if (response.data.success) {
                setPolicies(prev => prev.map(p =>
                    p.id === policy.id ? { ...p, is_active: !p.is_active } : p
                ));
                toast.success(
                    policy.is_active
                        ? (isRTL ? 'تم إلغاء التفعيل' : 'Désactivé')
                        : (isRTL ? 'تم التفعيل' : 'Activé')
                );
            }
        } catch (error) {
            console.error('Erreur toggle:', error);
            toast.error(isRTL ? 'خطأ في التحديث' : 'Erreur de mise à jour');
        } finally {
            setSaving(null);
        }
    };

    const updateDaysCount = async (policy, newCount) => {
        try {
            setSaving(policy.id);
            // Utiliser /api/holidays/:id pour modifier
            const response = await api.put(`/api/holidays/${policy.id}`, {
                days_count: newCount
            });

            if (response.data.success) {
                setPolicies(prev => prev.map(p =>
                    p.id === policy.id ? { ...p, days_count: newCount } : p
                ));
                toast.success(isRTL ? 'تم التحديث' : 'Mis à jour');
            }
        } catch (error) {
            console.error('Erreur update days:', error);
            toast.error(isRTL ? 'خطأ في التحديث' : 'Erreur de mise à jour');
        } finally {
            setSaving(null);
        }
    };

    const nationalPolicies = policies.filter(p => p.type === 'national');
    const religiousPolicies = policies.filter(p => p.type === 'religious');

    const SectionHeader = ({ type, icon: Icon, title, titleAr, count, color }) => (
        <button
            onClick={() => setExpandedSection(expandedSection === type ? null : type)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${isDark
                ? 'bg-gray-800 hover:bg-gray-750'
                : 'bg-white hover:bg-gray-50'
                } shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left rtl:text-right">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isRTL ? titleAr : title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {count} {isRTL ? 'عنصر' : 'éléments'}
                    </p>
                </div>
            </div>
            <motion.div
                animate={{ rotate: expandedSection === type ? 180 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </motion.div>
        </button>
    );

    const PolicyCard = ({ policy, showDaysSelector = false }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
            <div className="flex-1">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRTL ? policy.name_ar : policy.name}
                </p>
                {policy.fixed_day && policy.fixed_month && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {policy.fixed_day}/{policy.fixed_month} {isRTL ? 'كل سنة' : 'chaque année'}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {showDaysSelector && policy.is_active && (
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {isRTL ? 'أيام:' : 'Jours:'}
                        </span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => updateDaysCount(policy, num)}
                                    disabled={saving === policy.id}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${policy.days_count === num
                                        ? 'bg-purple-600 text-white'
                                        : isDark
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {saving === policy.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                ) : (
                    <ToggleSwitch
                        checked={policy.is_active}
                        onChange={() => togglePolicy(policy)}
                        size="sm"
                        disabled={saving === policy.id}
                        activeColor="peer-checked:bg-green-500"
                        inactiveColor="bg-red-400 dark:bg-red-600"
                    />
                )}
            </div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Section Jours Nationaux */}
            <div className="space-y-3">
                <SectionHeader
                    type="national"
                    icon={Flag}
                    title="Jours Fériés Nationaux"
                    titleAr="الأعياد الوطنية"
                    count={nationalPolicies.length}
                    color="bg-blue-500"
                />

                <AnimatePresence>
                    {expandedSection === 'national' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-2 pt-2">
                                <p className={`text-sm px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {isRTL
                                        ? 'هذه الأيام ثابتة كل سنة. قم بتفعيلها لإغلاق الحضانة في هذه الأيام.'
                                        : 'Ces jours sont fixes chaque année. Activez-les pour fermer la crèche ces jours-là.'}
                                </p>
                                {nationalPolicies.map(policy => (
                                    <PolicyCard key={policy.id} policy={policy} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Section Jours Religieux */}
            <div className="space-y-3">
                <SectionHeader
                    type="religious"
                    icon={Moon}
                    title="Fêtes Religieuses"
                    titleAr="الأعياد الدينية"
                    count={religiousPolicies.length}
                    color="bg-purple-500"
                />

                <AnimatePresence>
                    {expandedSection === 'religious' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-2 pt-2">
                                <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'} border ${isDark ? 'border-purple-800' : 'border-purple-200'}`}>
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                        <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                            {isRTL
                                                ? 'تتغير تواريخ الأعياد الدينية كل سنة. حدد عدد الأيام التي تريد إغلاق الحضانة فيها لكل عيد.'
                                                : 'Les dates des fêtes religieuses changent chaque année. Définissez le nombre de jours de fermeture pour chaque fête.'}
                                        </p>
                                    </div>
                                </div>

                                {religiousPolicies.map(policy => (
                                    <PolicyCard
                                        key={policy.id}
                                        policy={policy}
                                        showDaysSelector={policy.holiday_key === 'eid_fitr' || policy.holiday_key === 'eid_adha'}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info récurrence */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-blue-50'} border ${isDark ? 'border-gray-700' : 'border-blue-200'}`}>
                <div className="flex items-start gap-3">
                    <Calendar className={`w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-blue-900'}`}>
                            {isRTL ? 'تطبيق تلقائي' : 'Application automatique'}
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                            {isRTL
                                ? 'سيتم تطبيق هذه الإعدادات تلقائياً على جميع السنوات القادمة. يمكنك تعديلها في أي وقت.'
                                : 'Ces paramètres seront appliqués automatiquement pour toutes les années à venir. Vous pouvez les modifier à tout moment.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayPoliciesManager;
