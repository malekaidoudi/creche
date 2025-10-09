import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { isRTL } = useLanguage();
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Effacer les erreurs au démontage
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success(isRTL ? 'تم تسجيل الدخول بنجاح' : 'Connexion réussie');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في تسجيل الدخول' : 'Erreur de connexion'));
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
                <LogIn className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'تسجيل الدخول' : 'Connexion'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {isRTL 
                ? 'أدخل بياناتك للوصول إلى حسابك'
                : 'Entrez vos identifiants pour accéder à votre compte'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      required: isRTL ? 'كلمة المرور مطلوبة' : 'Mot de passe requis'
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

              {/* Bouton de connexion */}
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
                    <LogIn className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                  </>
                )}
              </Button>
            </form>

            {/* Liens */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isRTL ? 'ليس لديك حساب؟' : 'Pas encore de compte ?'}{' '}
                <Link
                  to="/register"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium"
                >
                  {isRTL ? 'إنشاء حساب' : 'Créer un compte'}
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

export default LoginPage;
