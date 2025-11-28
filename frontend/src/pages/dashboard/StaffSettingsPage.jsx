import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Bell,
    Shield,
    Palette,
    Moon,
    Sun,
    Languages
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useDialogContext } from '../../contexts/DialogContext';
import ToggleSwitch from '../../components/ui/ToggleSwitch';

const StaffSettingsPage = () => {
    const { isRTL, currentLanguage, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const dialog = useDialogContext();
    const [menuType, setMenuType] = useState(() => {
        return localStorage.getItem('menuType') || 'side';
    });
    const [settings, setSettings] = useState({
        // Notifications
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        notifyAbsences: true,
        notifyMessages: true,
        notifyTasks: true,

        // Sécurité
        twoFactorAuth: false,
        sessionTimeout: 30
    });

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
        dialog.success(isRTL ? 'تم حفظ الإعدادات' : 'Paramètres enregistrés');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* En-tête */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-4"
                >
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isRTL ? 'الإعدادات' : 'Paramètres'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isRTL ? 'إدارة تفضيلاتك وإعداداتك' : 'Gérez vos préférences et paramètres'}
                        </p>
                    </div>
                </motion.div>

                {/* Préférences Interface */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Palette className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                {isRTL ? 'تفضيلات الواجهة' : 'Préférences Interface'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Mode sombre */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'المظهر المظلم' : 'Mode sombre'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تفعيل المظهر المظلم للواجهة' : 'Activer le thème sombre'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={theme === 'dark'}
                                    onChange={toggleTheme}
                                    ariaLabel={isRTL ? 'المظهر المظلم' : 'Mode sombre'}
                                />
                            </div>

                            {/* Langue */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'اللغة' : 'Langue'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تغيير لغة الواجهة' : 'Changer la langue de l\'interface'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleLanguage}
                                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <Languages className="w-4 h-4" />
                                    <span className="font-medium">
                                        {currentLanguage === 'fr' ? 'Français' : 'العربية'}
                                    </span>
                                </button>
                            </div>

                            {/* Menu Latéral */}
                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'القائمة الجانبية' : 'Menu Latéral'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'عرض القائمة الجانبية بدلاً من الزر العائم' : 'Afficher le menu latéral au lieu du bouton flottant'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={menuType === 'side'}
                                    onChange={() => {
                                        const newType = menuType === 'side' ? 'floating' : 'side';
                                        setMenuType(newType);
                                        localStorage.setItem('menuType', newType);
                                        dialog.success(
                                            isRTL
                                                ? 'تم حفظ التفضيل! جاري إعادة التحميل...'
                                                : 'Préférence enregistrée ! Rechargement...'
                                        );
                                        setTimeout(() => window.location.reload(), 500);
                                    }}
                                    ariaLabel={isRTL ? 'القائمة الجانبية' : 'Menu Latéral'}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Paramètres Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Bell className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                {isRTL ? 'إعدادات الإشعارات' : 'Paramètres Notifications'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Email */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'إشعارات البريد الإلكتروني' : 'Notifications Email'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تلقي الإشعارات عبر البريد الإلكتروني' : 'Recevoir les notifications par email'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.emailNotifications}
                                    onChange={(value) => handleSettingChange('emailNotifications', value)}
                                    ariaLabel={isRTL ? 'إشعارات البريد الإلكتروني' : 'Notifications Email'}
                                />
                            </div>

                            {/* Push */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'الإشعارات الفورية' : 'Notifications Push'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تلقي الإشعارات الفورية في المتصفح' : 'Recevoir les notifications push dans le navigateur'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.pushNotifications}
                                    onChange={(value) => handleSettingChange('pushNotifications', value)}
                                    ariaLabel={isRTL ? 'الإشعارات الفورية' : 'Notifications Push'}
                                />
                            </div>

                            {/* Messages */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'إشعارات الرسائل' : 'Notifications Messages'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'إشعار عند استلام رسالة جديدة' : 'Notifier lors de la réception d\'un nouveau message'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.notifyMessages}
                                    onChange={(value) => handleSettingChange('notifyMessages', value)}
                                    ariaLabel={isRTL ? 'إشعارات الرسائل' : 'Notifications Messages'}
                                />
                            </div>

                            {/* Tâches */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'إشعارات المهام' : 'Notifications Tâches'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'إشعار عند تعيين مهمة جديدة' : 'Notifier lors de l\'assignation d\'une nouvelle tâche'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.notifyTasks}
                                    onChange={(value) => handleSettingChange('notifyTasks', value)}
                                    ariaLabel={isRTL ? 'إشعارات المهام' : 'Notifications Tâches'}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Paramètres Sécurité */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                {isRTL ? 'إعدادات الأمان' : 'Paramètres Sécurité'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 2FA */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {isRTL ? 'المصادقة الثنائية' : 'Authentification à deux facteurs'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تفعيل طبقة أمان إضافية' : 'Activer une couche de sécurité supplémentaire'}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.twoFactorAuth}
                                    onChange={(value) => handleSettingChange('twoFactorAuth', value)}
                                    ariaLabel={isRTL ? 'المصادقة الثنائية' : 'Authentification à deux facteurs'}
                                />
                            </div>

                            {/* Session Timeout */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'مهلة الجلسة (دقائق)' : 'Délai d\'expiration de session (minutes)'}
                                </label>
                                <select
                                    value={settings.sessionTimeout}
                                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value={15}>15 {isRTL ? 'دقيقة' : 'minutes'}</option>
                                    <option value={30}>30 {isRTL ? 'دقيقة' : 'minutes'}</option>
                                    <option value={60}>60 {isRTL ? 'دقيقة' : 'minutes'}</option>
                                    <option value={120}>120 {isRTL ? 'دقيقة' : 'minutes'}</option>
                                </select>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    {isRTL
                                        ? 'سيتم تسجيل خروجك تلقائيًا بعد هذه المدة من عدم النشاط'
                                        : 'Vous serez automatiquement déconnecté après cette période d\'inactivité'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
};

export default StaffSettingsPage;
