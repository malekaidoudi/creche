import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield,
  Mail,
  Clock,
  DollarSign,
  Save,
  AlertTriangle
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  const [settings, setSettings] = useState({
    general: {
      nurseryName: 'Mima Elghalia',
      address: 'Avenue Habib Bourguiba, Tunis',
      phone: '+216 71 000 000',
      email: 'contact@mimaelghalia.tn',
      website: 'www.mimaelghalia.tn',
      capacity: 50,
      openingTime: '07:00',
      closingTime: '18:00'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      attendanceAlerts: true,
      paymentReminders: true,
      enrollmentNotifications: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    },
    billing: {
      currency: 'TND',
      taxRate: 19,
      lateFee: 20,
      discountRate: 10,
      paymentMethods: ['cash', 'card', 'transfer']
    }
  })

  const tabs = [
    { id: 'general', label: isRTL ? 'عام' : 'Général', icon: Settings },
    { id: 'notifications', label: isRTL ? 'الإشعارات' : 'Notifications', icon: Bell },
    { id: 'security', label: isRTL ? 'الأمان' : 'Sécurité', icon: Shield },
    { id: 'billing', label: isRTL ? 'الفوترة' : 'Facturation', icon: DollarSign }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres sauvegardés avec succès')
    } catch (error) {
      toast.error(isRTL ? 'خطأ في حفظ الإعدادات' : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'اسم الحضانة' : 'Nom de la crèche'}
          </label>
          <input
            type="text"
            className="form-input"
            value={settings.general.nurseryName}
            onChange={(e) => updateSetting('general', 'nurseryName', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'السعة القصوى' : 'Capacité maximale'}
          </label>
          <input
            type="number"
            className="form-input"
            value={settings.general.capacity}
            onChange={(e) => updateSetting('general', 'capacity', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          {isRTL ? 'العنوان' : 'Adresse'}
        </label>
        <textarea
          className="form-input"
          rows={3}
          value={settings.general.address}
          onChange={(e) => updateSetting('general', 'address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'الهاتف' : 'Téléphone'}
          </label>
          <input
            type="tel"
            className="form-input"
            value={settings.general.phone}
            onChange={(e) => updateSetting('general', 'phone', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            type="email"
            className="form-input"
            value={settings.general.email}
            onChange={(e) => updateSetting('general', 'email', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'وقت الافتتاح' : 'Heure d\'ouverture'}
          </label>
          <input
            type="time"
            className="form-input"
            value={settings.general.openingTime}
            onChange={(e) => updateSetting('general', 'openingTime', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'وقت الإغلاق' : 'Heure de fermeture'}
          </label>
          <input
            type="time"
            className="form-input"
            value={settings.general.closingTime}
            onChange={(e) => updateSetting('general', 'closingTime', e.target.value)}
          />
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {Object.entries(settings.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">
              {key === 'emailNotifications' && (isRTL ? 'إشعارات البريد الإلكتروني' : 'Notifications par email')}
              {key === 'smsNotifications' && (isRTL ? 'إشعارات الرسائل النصية' : 'Notifications SMS')}
              {key === 'attendanceAlerts' && (isRTL ? 'تنبيهات الحضور' : 'Alertes de présence')}
              {key === 'paymentReminders' && (isRTL ? 'تذكيرات الدفع' : 'Rappels de paiement')}
              {key === 'enrollmentNotifications' && (isRTL ? 'إشعارات التسجيل' : 'Notifications d\'inscription')}
            </h4>
            <p className="text-sm text-gray-500">
              {isRTL ? 'تفعيل أو إلغاء هذا النوع من الإشعارات' : 'Activer ou désactiver ce type de notification'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={value}
              onChange={(e) => updateSetting('notifications', key, e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      ))}
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              {isRTL ? 'تنبيه أمني' : 'Avertissement de sécurité'}
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              {isRTL 
                ? 'تأكد من تفعيل المصادقة الثنائية لحماية أفضل'
                : 'Assurez-vous d\'activer l\'authentification à deux facteurs pour une meilleure sécurité'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'مهلة انتهاء الجلسة (دقيقة)' : 'Timeout de session (minutes)'}
          </label>
          <input
            type="number"
            className="form-input"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'انتهاء صلاحية كلمة المرور (يوم)' : 'Expiration mot de passe (jours)'}
          </label>
          <input
            type="number"
            className="form-input"
            value={settings.security.passwordExpiry}
            onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">
            {isRTL ? 'المصادقة الثنائية' : 'Authentification à deux facteurs'}
          </h4>
          <p className="text-sm text-gray-500">
            {isRTL ? 'طبقة حماية إضافية لحسابك' : 'Couche de sécurité supplémentaire pour votre compte'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.security.twoFactorAuth}
            onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  )

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'العملة' : 'Devise'}
          </label>
          <select
            className="form-input"
            value={settings.billing.currency}
            onChange={(e) => updateSetting('billing', 'currency', e.target.value)}
          >
            <option value="TND">Dinar Tunisien (TND)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar (USD)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'معدل الضريبة (%)' : 'Taux de TVA (%)'}
          </label>
          <input
            type="number"
            className="form-input"
            value={settings.billing.taxRate}
            onChange={(e) => updateSetting('billing', 'taxRate', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'رسوم التأخير' : 'Frais de retard'}
          </label>
          <input
            type="number"
            className="form-input"
            value={settings.billing.lateFee}
            onChange={(e) => updateSetting('billing', 'lateFee', parseFloat(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            {isRTL ? 'معدل الخصم (%)' : 'Taux de remise (%)'}
          </label>
          <input
            type="number"
            className="form-input"
            value={settings.billing.discountRate}
            onChange={(e) => updateSetting('billing', 'discountRate', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'الإعدادات' : 'Paramètres'}
        subtitle={isRTL ? 'إدارة إعدادات النظام والتفضيلات' : 'Gérer les paramètres système et préférences'}
      >
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isRTL ? 'حفظ' : 'Sauvegarder'}
            </>
          )}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des onglets */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-body">
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'billing' && renderBillingSettings()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
