import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { isRTL } = useLanguage();
  const { register: registerUser, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  // Pas de redirection automatique - laissons l'utilisateur naviguer manuellement

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      toast.success(isRTL ? 'تم إنشاء الحساب بنجاح' : 'Compte créé avec succès');
      // Redirection manuelle après inscription réussie
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في إنشاء الحساب' : 'Erreur lors de la création du compte'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'إنشاء حساب' : 'Créer un compte'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {isRTL 
                ? 'املأ المعلومات أدناه لإنشاء حساب جديد'
                : 'Remplissez les informations ci-dessous pour créer votre compte'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'الاسم الأول' : 'Prénom'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('first_name', { 
                        required: isRTL ? 'الاسم الأول مطلوب' : 'Prénom requis',
                        minLength: {
                          value: 2,
                          message: isRTL ? 'الاسم قصير جداً' : 'Prénom trop court'
                        }
                      })}
                      className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={isRTL ? 'الاسم الأول' : 'Prénom'}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'اسم العائلة' : 'Nom'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('last_name', { 
                        required: isRTL ? 'اسم العائلة مطلوب' : 'Nom requis',
                        minLength: {
                          value: 2,
                          message: isRTL ? 'الاسم قصير جداً' : 'Nom trop court'
                        }
                      })}
                      className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={isRTL ? 'اسم العائلة' : 'Nom'}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    {...register('email', { 
                      required: isRTL ? 'البريد الإلكتروني مطلوب' : 'Email requis',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: isRTL ? 'بريد إلكتروني غير صحيح' : 'Email invalide'
                      }
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Entrez votre email'}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'رقم الهاتف' : 'Téléphone'} <span className="text-gray-400">({isRTL ? 'اختياري' : 'optionnel'})</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder={isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'كلمة المرور' : 'Mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: isRTL ? 'كلمة المرور مطلوبة' : 'Mot de passe requis',
                      minLength: {
                        value: 6,
                        message: isRTL ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Mot de passe trop court (6 caractères minimum)'
                      }
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-12 pr-12 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'أدخل كلمة المرور' : 'Entrez votre mot de passe'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: isRTL ? 'تأكيد كلمة المرور مطلوب' : 'Confirmation du mot de passe requise',
                      validate: value => value === password || (isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas')
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-12 pr-12 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Confirmez votre mot de passe'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Erreur générale */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                >
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Bouton d'inscription */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'إنشاء الحساب' : 'Créer le compte'}
                  </>
                )}
              </Button>
            </form>

            {/* Liens */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isRTL ? 'لديك حساب بالفعل؟' : 'Vous avez déjà un compte ?'}{' '}
                <Link
                  to="/login"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium"
                >
                  {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                </Link>
              </p>
              <Link
                to="/"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {isRTL ? 'العودة إلى الصفحة الرئيسية' : 'Retour à l\'accueil'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
