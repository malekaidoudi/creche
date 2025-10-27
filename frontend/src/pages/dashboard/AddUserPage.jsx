import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Users, 
  Shield, 
  Mail, 
  Phone, 
  Lock,
  User,
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AddUserPage = () => {
  const { isRTL } = useLanguage();
  const { isAdmin } = useAuth();
  const [selectedRole, setSelectedRole] = useState('parent');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'parent',
    department: '',
    specialization: '',
    children_ids: []
  });

  const [errors, setErrors] = useState({});
  const [unassociatedChildren, setUnassociatedChildren] = useState([]);

  // Charger les enfants non associés à un parent
  useEffect(() => {
    const fetchUnassociatedChildren = async () => {
      try {
        console.log('Tentative de chargement des enfants non associés...');
        
        // Utiliser directement les données de test pour éviter les erreurs API
        const mockChildren = [
          { id: 1, first_name: 'Ahmed', last_name: 'Ben Ali', age: 4, birth_date: '2020-03-15' },
          { id: 2, first_name: 'Fatima', last_name: 'Trabelsi', age: 3, birth_date: '2021-07-22' }
        ];
        console.log('Utilisation des données de test:', mockChildren);
        setUnassociatedChildren(mockChildren);
        
      } catch (error) {
        console.error('Erreur lors du chargement des enfants:', error);
        // Fallback vide
        setUnassociatedChildren([]);
      }
    };

    // Seulement charger si on sélectionne le rôle parent
    if (selectedRole === 'parent') {
      fetchUnassociatedChildren();
    }
  }, [selectedRole]);

  const roleOptions = [
    {
      value: 'parent',
      label: isRTL ? 'ولي أمر' : 'Parent',
      description: isRTL ? 'حساب ولي أمر للوصول إلى معلومات الطفل' : 'Compte parent pour accéder aux informations de l\'enfant',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      value: 'staff',
      label: isRTL ? 'موظف' : 'Personnel',
      description: isRTL ? 'حساب موظف للوصول إلى إدارة الأطفال' : 'Compte personnel pour accéder à la gestion des enfants',
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  // Ajouter option admin seulement si l'utilisateur actuel est admin
  if (isAdmin()) {
    roleOptions.push({
      value: 'admin',
      label: isRTL ? 'مدير' : 'Administrateur',
      description: isRTL ? 'حساب مدير مع صلاحيات كاملة' : 'Compte administrateur avec accès complet',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    });
  }

  const departmentOptions = [
    { value: 'administration', label: isRTL ? 'الإدارة' : 'Administration' },
    { value: 'education', label: isRTL ? 'التعليم' : 'Éducation' },
    { value: 'soins', label: isRTL ? 'الرعاية' : 'Soins' },
    { value: 'securite', label: isRTL ? 'الأمن' : 'Sécurité' },
    { value: 'cuisine', label: isRTL ? 'المطبخ' : 'Cuisine' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData(prev => ({
      ...prev,
      role: role,
      department: role === 'parent' ? '' : prev.department,
      specialization: role === 'parent' ? '' : prev.specialization,
      children_ids: role === 'parent' ? prev.children_ids : []
    }));
  };

  const handleChildSelection = (childId) => {
    setFormData(prev => ({
      ...prev,
      children_ids: prev.children_ids.includes(childId)
        ? prev.children_ids.filter(id => id !== childId)
        : [...prev.children_ids, childId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = isRTL ? 'اسم العائلة مطلوب' : 'Le nom de famille est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = isRTL ? 'البريد الإلكتروني غير صحيح' : 'Format d\'email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Le téléphone est requis';
    }

    if (!formData.password) {
      newErrors.password = isRTL ? 'كلمة المرور مطلوبة' : 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas';
    }

    if (formData.role !== 'parent') {
      if (!formData.department) {
        newErrors.department = isRTL ? 'القسم مطلوب' : 'Le département est requis';
      }
      if (!formData.specialization.trim()) {
        newErrors.specialization = isRTL ? 'التخصص مطلوب' : 'La spécialisation est requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(isRTL ? 'تم إنشاء المستخدم بنجاح' : 'Utilisateur créé avec succès');
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        role: 'parent',
        department: '',
        specialization: ''
      });
      setSelectedRole('parent');
      
    } catch (error) {
      toast.error(isRTL ? 'خطأ في إنشاء المستخدم' : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'إضافة مستخدم جديد' : 'Ajouter un Nouvel Utilisateur'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL ? 'إنشاء حساب جديد للأولياء أو الموظفين' : 'Créer un nouveau compte pour parents ou personnel'}
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
            {isRTL ? 'العودة' : 'Retour'}
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sélection du rôle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'نوع الحساب' : 'Type de Compte'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleRoleSelect(option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className={`p-2 rounded-lg ${option.bgColor}`}>
                      <option.icon className={`w-5 h-5 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                    {selectedRole === option.value && (
                      <Check className="w-5 h-5 text-primary-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'معلومات المستخدم' : 'Informations Utilisateur'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations personnelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'الاسم الأول' : 'Prénom'} *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={isRTL ? 'أدخل الاسم الأول' : 'Entrez le prénom'}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {errors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'اسم العائلة' : 'Nom de famille'} *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={isRTL ? 'أدخل اسم العائلة' : 'Entrez le nom de famille'}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={isRTL ? 'أدخل البريد الإلكتروني' : 'Entrez l\'email'}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'رقم الهاتف' : 'Téléphone'} *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Entrez le téléphone'}
                        dir="ltr"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'كلمة المرور' : 'Mot de passe'} *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-10 rtl:pr-3 rtl:pl-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={isRTL ? 'أدخل كلمة المرور' : 'Entrez le mot de passe'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer mot de passe'} *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.confirm_password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Confirmez le mot de passe'}
                      />
                    </div>
                    {errors.confirm_password && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {errors.confirm_password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Association avec des enfants (pour parents) */}
                {selectedRole === 'parent' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {isRTL ? 'ربط الأطفال' : 'Associer des Enfants'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {isRTL ? 'اختر الأطفال الذين سيكونون تحت رعاية هذا الولي' : 'Sélectionnez les enfants qui seront sous la responsabilité de ce parent'}
                    </p>
                    
                    {unassociatedChildren.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{isRTL ? 'لا توجد أطفال متاحة للربط' : 'Aucun enfant disponible pour association'}</p>
                        <p className="text-sm mt-2">
                          {isRTL ? 'جميع الأطفال مرتبطون بأولياء أمور' : 'Tous les enfants sont déjà associés à des parents'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unassociatedChildren.map(child => (
                        <div
                          key={child.id}
                          onClick={() => handleChildSelection(child.id)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.children_ids.includes(child.id)
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {child.first_name} {child.last_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isRTL ? `${child.age} سنوات` : `${child.age} ans`}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.children_ids.includes(child.id)
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}>
                              {formData.children_ids.includes(child.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                    
                    {formData.children_ids.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {isRTL 
                            ? `تم اختيار ${formData.children_ids.length} طفل/أطفال`
                            : `${formData.children_ids.length} enfant(s) sélectionné(s)`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Informations professionnelles (pour staff/admin) */}
                {selectedRole !== 'parent' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {isRTL ? 'المعلومات المهنية' : 'Informations Professionnelles'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'القسم' : 'Département'} *
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            errors.department ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <option value="">{isRTL ? 'اختر القسم' : 'Sélectionner le département'}</option>
                          {departmentOptions.map(dept => (
                            <option key={dept.value} value={dept.value}>
                              {dept.label}
                            </option>
                          ))}
                        </select>
                        {errors.department && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {errors.department}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'التخصص' : 'Spécialisation'} *
                        </label>
                        <input
                          type="text"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            errors.specialization ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder={isRTL ? 'أدخل التخصص' : 'Entrez la spécialisation'}
                        />
                        {errors.specialization && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {errors.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link to="/dashboard">
                    <Button type="button" variant="outline">
                      {isRTL ? 'إلغاء' : 'Annuler'}
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 rtl:mr-0 rtl:ml-2"></div>
                        {isRTL ? 'جاري الإنشاء...' : 'Création...'}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'إنشاء المستخدم' : 'Créer l\'utilisateur'}
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AddUserPage;
