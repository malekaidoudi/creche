import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ProfilePictureUpload from '../../components/ui/ProfilePictureUpload'
import PageHeader from '../../components/ui/PageHeader'
import { uploadService } from '../../services/uploadService'

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user, updateProfile, changePassword } = useAuth()
  const { isRTL } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Formulaire de profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  })

  // Formulaire de mot de passe
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm()

  const onSubmitProfile = async (data) => {
    try {
      setLoading(true)
      // Ne pas inclure profile_picture dans les données à sauvegarder
      // car elle est gérée séparément par handleProfilePictureChange
      const { profile_picture, ...profileData } = data
      await updateProfile(profileData)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureChange = async (file) => {
    if (!file) {
      // Supprimer la photo de profil
      try {
        await uploadService.deleteProfilePicture()
        // Mettre à jour immédiatement le profil utilisateur
        await updateProfile({ profile_picture: null })
        return
      } catch (error) {
        console.error('Erreur suppression photo:', error)
        throw error
      }
    }

    try {
      // Upload de la nouvelle photo
      const result = await uploadService.uploadProfilePicture(file)
      
      // Mettre à jour immédiatement le profil utilisateur
      await updateProfile({ profile_picture: result.profile_picture_url })
      
      return result
    } catch (error) {
      console.error('Erreur upload photo:', error)
      throw error
    }
  }

  const onSubmitPassword = async (data) => {
    try {
      setLoading(true)
      await changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      resetPassword()
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    {
      id: 'profile',
      name: isRTL ? 'الملف الشخصي' : 'Profil',
      icon: User
    },
    {
      id: 'password',
      name: isRTL ? 'كلمة المرور' : 'Mot de passe',
      icon: Lock
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={t('common.profile')}
        subtitle={isRTL 
          ? 'إدارة معلومات حسابك وإعدادات الأمان'
          : 'Gérez les informations de votre compte et les paramètres de sécurité'
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 rtl:space-x-reverse`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenu des tabs */}
      <div className="card">
        <div className="card-body">
          {/* Tab Profil */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
              {/* Photo de profil */}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-6 rtl:md:space-x-reverse space-y-4 md:space-y-0 mb-8">
                <ProfilePictureUpload
                  currentImage={user?.profile_picture}
                  onImageChange={handleProfilePictureChange}
                  size="xl"
                />
                <div className="text-center md:text-left rtl:md:text-right">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </h3>
                  <p className="text-gray-600">
                    {t(`roles.${user?.role}`)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isRTL 
                      ? 'انقر على أيقونة الكاميرا لتغيير صورة الملف الشخصي'
                      : 'Cliquez sur l\'icône caméra pour changer votre photo de profil'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
                    {t('common.firstName')} *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${profileErrors.first_name ? 'border-error-500' : ''}`}
                    {...registerProfile('first_name', {
                      required: t('validation.required')
                    })}
                  />
                  {profileErrors.first_name && (
                    <p className="form-error">{profileErrors.first_name.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('common.lastName')} *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${profileErrors.last_name ? 'border-error-500' : ''}`}
                    {...registerProfile('last_name', {
                      required: t('validation.required')
                    })}
                  />
                  {profileErrors.last_name && (
                    <p className="form-error">{profileErrors.last_name.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('common.email')} *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      className={`form-input pl-10 rtl:pl-4 rtl:pr-10 ${profileErrors.email ? 'border-error-500' : ''}`}
                      {...registerProfile('email', {
                        required: t('validation.required'),
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: t('validation.email')
                        }
                      })}
                    />
                    <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {profileErrors.email && (
                    <p className="form-error">{profileErrors.email.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('common.phone')}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      className={`form-input pl-10 rtl:pl-4 rtl:pr-10 ${profileErrors.phone ? 'border-error-500' : ''}`}
                      {...registerProfile('phone')}
                    />
                    <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {profileErrors.phone && (
                    <p className="form-error">{profileErrors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('common.save')}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab Mot de passe */}
          {activeTab === 'password' && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe'}
                </h3>
                <p className="text-gray-600">
                  {isRTL 
                    ? 'تأكد من أن كلمة المرور الجديدة قوية وآمنة'
                    : 'Assurez-vous que votre nouveau mot de passe est fort et sécurisé'
                  }
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isRTL ? 'كلمة المرور الحالية' : 'Mot de passe actuel'} *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className={`form-input pr-10 rtl:pr-4 rtl:pl-10 ${passwordErrors.currentPassword ? 'border-error-500' : ''}`}
                    {...registerPassword('currentPassword', {
                      required: t('validation.required')
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="form-error">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'} *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className={`form-input pr-10 rtl:pr-4 rtl:pl-10 ${passwordErrors.newPassword ? 'border-error-500' : ''}`}
                    {...registerPassword('newPassword', {
                      required: t('validation.required'),
                      minLength: {
                        value: 6,
                        message: t('validation.minLength', { min: 6 })
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="form-error">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le nouveau mot de passe'} *
                </label>
                <input
                  type="password"
                  className={`form-input ${passwordErrors.confirmPassword ? 'border-error-500' : ''}`}
                  {...registerPassword('confirmPassword', {
                    required: t('validation.required'),
                    validate: (value, { newPassword }) => {
                      return value === newPassword || t('auth.passwordsNotMatch')
                    }
                  })}
                />
                {passwordErrors.confirmPassword && (
                  <p className="form-error">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <Lock className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {isRTL ? 'تحديث كلمة المرور' : 'Mettre à jour le mot de passe'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
