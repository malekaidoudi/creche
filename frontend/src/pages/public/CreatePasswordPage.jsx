import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';

export default function CreatePasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation du mot de passe
  const validatePassword = (pwd) => {
    const validations = {
      length: pwd.length >= 6,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd)
    };
    return validations;
  };

  const passwordValidations = validatePassword(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Réinitialiser les erreurs
    setErrors({});

    // Validation
    const newErrors = {};

    if (!token || !email) {
      dialog.error(isRTL ? 'رابط غير صالح' : 'Lien invalide');
      return;
    }

    if (password.length < 6) {
      newErrors.password = isRTL ? 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل' : 'Mot de passe minimum 6 caractères';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/create-password', {
        token,
        email,
        password
      });

      // Sauvegarder le token JWT
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      dialog.success(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Compte créé avec succès !');

      // Redirection vers le dashboard parent
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (error) {
      console.error('Erreur création mot de passe:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'إنشاء كلمة المرور' : 'Créer votre mot de passe'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isRTL ? 'قم بإنشاء كلمة مرور آمنة لحسابك' : 'Créez un mot de passe sécurisé pour votre compte'}
            </p>
            {email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {email}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'كلمة المرور' : 'Mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder={isRTL ? 'أدخل كلمة المرور' : 'Entrez votre mot de passe'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}

              {/* Indicateurs de force */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordValidations.length ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={passwordValidations.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                      {isRTL ? '6 أحرف على الأقل' : 'Au moins 6 caractères'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordValidations.hasUpper ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={passwordValidations.hasUpper ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                      {isRTL ? 'حرف كبير واحد' : 'Une lettre majuscule'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordValidations.hasNumber ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={passwordValidations.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                      {isRTL ? 'رقم واحد' : 'Un chiffre'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Confirmez votre mot de passe'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>{isRTL ? 'كلمات المرور متطابقة' : 'Les mots de passe correspondent'}</span>
                </div>
              )}
            </div>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isRTL ? 'جاري الإنشاء...' : 'Création en cours...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>{isRTL ? 'إنشاء الحساب' : 'Créer mon compte'}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {isRTL ? 'بعد إنشاء كلمة المرور، سيتم توجيهك تلقائيًا إلى لوحة التحكم' : 'Après création, vous serez automatiquement connecté'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
