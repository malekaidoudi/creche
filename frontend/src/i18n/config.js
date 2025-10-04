import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// Traductions françaises
const frTranslations = {
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    reset: 'Réinitialiser',
    submit: 'Soumettre',
    close: 'Fermer',
    yes: 'Oui',
    no: 'Non',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    home: 'Accueil',
    dashboard: 'Tableau de bord',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    login: 'Connexion',
    register: 'Inscription',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    phone: 'Téléphone',
    address: 'Adresse',
    date: 'Date',
    time: 'Heure',
    status: 'Statut',
    actions: 'Actions',
    details: 'Détails',
    view: 'Voir',
    download: 'Télécharger',
    upload: 'Téléverser',
    required: 'Requis',
    optional: 'Optionnel',
    page: 'Page',
    of: 'sur',
    total: 'Total',
    items: 'éléments',
    noData: 'Aucune donnée disponible',
    selectLanguage: 'Choisir la langue'
  },
  nav: {
    home: 'Accueil',
    articles: 'Articles',
    news: 'Actualités',
    enrollment: 'Inscription',
    contact: 'Contact',
    dashboard: 'Tableau de bord',
    users: 'Utilisateurs',
    children: 'Enfants',
    enrollments: 'Inscriptions',
    attendance: 'Présences',
    articlesManagement: 'Gestion Articles',
    newsManagement: 'Gestion Actualités',
    contacts: 'Messages'
  },
  auth: {
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    email: 'Adresse email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    role: 'Rôle',
    loginButton: 'Se connecter',
    registerButton: 'S\'inscrire',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: 'Pas de compte ?',
    hasAccount: 'Déjà un compte ?',
    loginSuccess: 'Connexion réussie',
    registerSuccess: 'Inscription réussie',
    logoutSuccess: 'Déconnexion réussie',
    invalidCredentials: 'Identifiants invalides',
    emailRequired: 'Email requis',
    passwordRequired: 'Mot de passe requis',
    passwordMinLength: 'Le mot de passe doit contenir au moins 6 caractères',
    passwordsNotMatch: 'Les mots de passe ne correspondent pas'
  },
  roles: {
    admin: 'Administrateur',
    staff: 'Personnel',
    parent: 'Parent'
  },
  status: {
    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    cancelled: 'Annulé',
    draft: 'Brouillon',
    published: 'Publié',
    new: 'Nouveau',
    read: 'Lu',
    replied: 'Répondu'
  },
  home: {
    title: 'Bienvenue dans notre crèche',
    subtitle: 'Un environnement sûr et bienveillant pour vos enfants',
    cta: 'Inscrire votre enfant',
    features: {
      title: 'Nos services',
      education: {
        title: 'Éducation de qualité',
        description: 'Programme éducatif adapté à chaque âge'
      },
      care: {
        title: 'Soins attentionnés',
        description: 'Personnel qualifié et bienveillant'
      },
      safety: {
        title: 'Sécurité maximale',
        description: 'Environnement sécurisé et surveillé'
      }
    }
  },
  enrollment: {
    title: 'Inscription de votre enfant',
    childInfo: 'Informations de l\'enfant',
    parentInfo: 'Informations du parent',
    childFirstName: 'Prénom de l\'enfant',
    childLastName: 'Nom de l\'enfant',
    birthDate: 'Date de naissance',
    gender: 'Sexe',
    male: 'Garçon',
    female: 'Fille',
    medicalInfo: 'Informations médicales',
    emergencyContact: 'Contact d\'urgence',
    emergencyContactName: 'Nom du contact d\'urgence',
    emergencyContactPhone: 'Téléphone du contact d\'urgence',
    enrollmentDate: 'Date d\'inscription souhaitée',
    notes: 'Notes supplémentaires',
    documents: 'Documents requis',
    carnetMedical: 'Carnet médical',
    acteNaissance: 'Acte de naissance',
    certificatMedical: 'Certificat médical',
    documentsInfo: 'Veuillez télécharger tous les documents requis',
    reglement: 'Règlement intérieur',
    downloadReglement: 'Télécharger le règlement',
    submit: 'Soumettre la demande',
    success: 'Demande d\'inscription envoyée avec succès'
  },
  contact: {
    title: 'Contactez-nous',
    subtitle: 'Nous sommes là pour répondre à vos questions',
    name: 'Nom complet',
    email: 'Email',
    phone: 'Téléphone',
    subject: 'Sujet',
    message: 'Message',
    send: 'Envoyer le message',
    success: 'Message envoyé avec succès',
    info: {
      title: 'Informations de contact',
      address: 'Adresse',
      phone: 'Téléphone',
      email: 'Email',
      hours: 'Horaires d\'ouverture'
    }
  },
  dashboard: {
    welcome: 'Bienvenue, {{name}}',
    overview: 'Vue d\'ensemble',
    stats: {
      totalUsers: 'Total utilisateurs',
      totalChildren: 'Total enfants',
      todayAttendance: 'Présences aujourd\'hui',
      pendingEnrollments: 'Inscriptions en attente',
      attendanceRate: 'Taux de présence'
    }
  },
  children: {
    title: 'Gestion des enfants',
    addChild: 'Ajouter un enfant',
    editChild: 'Modifier l\'enfant',
    childDetails: 'Détails de l\'enfant',
    firstName: 'Prénom',
    lastName: 'Nom',
    birthDate: 'Date de naissance',
    age: 'Âge',
    gender: 'Sexe',
    medicalInfo: 'Informations médicales',
    emergencyContact: 'Contact d\'urgence',
    photo: 'Photo',
    isPresent: 'Présent aujourd\'hui',
    attendance: 'Présences'
  },
  attendance: {
    title: 'Gestion des présences',
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    child: 'Enfant',
    staff: 'Personnel',
    checkInTime: 'Heure d\'arrivée',
    checkOutTime: 'Heure de départ',
    notes: 'Notes',
    today: 'Aujourd\'hui',
    present: 'Présents',
    departed: 'Partis',
    recordCheckIn: 'Enregistrer l\'arrivée',
    recordCheckOut: 'Enregistrer le départ'
  },
  articles: {
    title: 'Articles',
    addArticle: 'Ajouter un article',
    editArticle: 'Modifier l\'article',
    titleFr: 'Titre (Français)',
    titleAr: 'Titre (Arabe)',
    contentFr: 'Contenu (Français)',
    contentAr: 'Contenu (Arabe)',
    image: 'Image',
    status: 'Statut',
    author: 'Auteur',
    publishedAt: 'Publié le',
    readMore: 'Lire la suite'
  },
  news: {
    title: 'Actualités',
    addNews: 'Ajouter une actualité',
    editNews: 'Modifier l\'actualité',
    titleFr: 'Titre (Français)',
    titleAr: 'Titre (Arabe)',
    descriptionFr: 'Description (Français)',
    descriptionAr: 'Description (Arabe)',
    eventDate: 'Date de l\'événement',
    upcoming: 'À venir',
    past: 'Passées'
  },
  validation: {
    required: 'Ce champ est requis',
    email: 'Email invalide',
    minLength: 'Minimum {{min}} caractères',
    maxLength: 'Maximum {{max}} caractères',
    phone: 'Numéro de téléphone invalide',
    date: 'Date invalide',
    url: 'URL invalide'
  }
}

// Traductions arabes
const arTranslations = {
  common: {
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    reset: 'إعادة تعيين',
    submit: 'إرسال',
    close: 'إغلاق',
    yes: 'نعم',
    no: 'لا',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    home: 'الرئيسية',
    dashboard: 'لوحة التحكم',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    phone: 'الهاتف',
    address: 'العنوان',
    date: 'التاريخ',
    time: 'الوقت',
    status: 'الحالة',
    actions: 'الإجراءات',
    details: 'التفاصيل',
    view: 'عرض',
    download: 'تحميل',
    upload: 'رفع',
    required: 'مطلوب',
    optional: 'اختياري',
    page: 'صفحة',
    of: 'من',
    total: 'المجموع',
    items: 'عناصر',
    noData: 'لا توجد بيانات متاحة',
    selectLanguage: 'اختر اللغة'
  },
  nav: {
    home: 'الرئيسية',
    articles: 'المقالات',
    news: 'الأخبار',
    enrollment: 'التسجيل',
    contact: 'اتصل بنا',
    dashboard: 'لوحة التحكم',
    users: 'المستخدمون',
    children: 'الأطفال',
    enrollments: 'التسجيلات',
    attendance: 'الحضور',
    articlesManagement: 'إدارة المقالات',
    newsManagement: 'إدارة الأخبار',
    contacts: 'الرسائل'
  },
  auth: {
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    logout: 'تسجيل الخروج',
    email: 'عنوان البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    phone: 'الهاتف',
    role: 'الدور',
    loginButton: 'دخول',
    registerButton: 'تسجيل',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    registerSuccess: 'تم التسجيل بنجاح',
    logoutSuccess: 'تم تسجيل الخروج بنجاح',
    invalidCredentials: 'بيانات اعتماد غير صحيحة',
    emailRequired: 'البريد الإلكتروني مطلوب',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordMinLength: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
    passwordsNotMatch: 'كلمات المرور غير متطابقة'
  },
  roles: {
    admin: 'مدير',
    staff: 'موظف',
    parent: 'والد'
  },
  status: {
    active: 'نشط',
    inactive: 'غير نشط',
    pending: 'في الانتظار',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    cancelled: 'ملغى',
    draft: 'مسودة',
    published: 'منشور',
    new: 'جديد',
    read: 'مقروء',
    replied: 'تم الرد'
  },
  home: {
    title: 'مرحباً بكم في حضانتنا',
    subtitle: 'بيئة آمنة ومحبة لأطفالكم',
    cta: 'سجل طفلك',
    features: {
      title: 'خدماتنا',
      education: {
        title: 'تعليم عالي الجودة',
        description: 'برنامج تعليمي مناسب لكل عمر'
      },
      care: {
        title: 'رعاية متميزة',
        description: 'طاقم مؤهل ومحب'
      },
      safety: {
        title: 'أمان تام',
        description: 'بيئة آمنة ومراقبة'
      }
    }
  },
  enrollment: {
    title: 'تسجيل طفلك',
    childInfo: 'معلومات الطفل',
    parentInfo: 'معلومات الوالد',
    childFirstName: 'اسم الطفل الأول',
    childLastName: 'اسم عائلة الطفل',
    birthDate: 'تاريخ الميلاد',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    medicalInfo: 'المعلومات الطبية',
    emergencyContact: 'جهة اتصال الطوارئ',
    emergencyContactName: 'اسم جهة اتصال الطوارئ',
    emergencyContactPhone: 'هاتف جهة اتصال الطوارئ',
    enrollmentDate: 'تاريخ التسجيل المرغوب',
    notes: 'ملاحظات إضافية',
    documents: 'الوثائق المطلوبة',
    carnetMedical: 'الدفتر الطبي',
    acteNaissance: 'مضمون الولادة',
    certificatMedical: 'الشهادة الطبية',
    documentsInfo: 'يرجى تحميل جميع الوثائق المطلوبة',
    reglement: 'النظام الداخلي',
    downloadReglement: 'تحميل النظام الداخلي',
    submit: 'إرسال الطلب',
    success: 'تم إرسال طلب التسجيل بنجاح'
  },
  contact: {
    title: 'اتصل بنا',
    subtitle: 'نحن هنا للإجابة على أسئلتكم',
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    subject: 'الموضوع',
    message: 'الرسالة',
    send: 'إرسال الرسالة',
    success: 'تم إرسال الرسالة بنجاح',
    info: {
      title: 'معلومات الاتصال',
      address: 'العنوان',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      hours: 'ساعات العمل'
    }
  },
  dashboard: {
    welcome: 'مرحباً، {{name}}',
    overview: 'نظرة عامة',
    stats: {
      totalUsers: 'إجمالي المستخدمين',
      totalChildren: 'إجمالي الأطفال',
      todayAttendance: 'حضور اليوم',
      pendingEnrollments: 'التسجيلات المعلقة',
      attendanceRate: 'معدل الحضور'
    }
  },
  children: {
    title: 'إدارة الأطفال',
    addChild: 'إضافة طفل',
    editChild: 'تعديل الطفل',
    childDetails: 'تفاصيل الطفل',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    birthDate: 'تاريخ الميلاد',
    age: 'العمر',
    gender: 'الجنس',
    medicalInfo: 'المعلومات الطبية',
    emergencyContact: 'جهة اتصال الطوارئ',
    photo: 'الصورة',
    isPresent: 'حاضر اليوم',
    attendance: 'الحضور'
  },
  attendance: {
    title: 'إدارة الحضور',
    checkIn: 'الوصول',
    checkOut: 'المغادرة',
    child: 'الطفل',
    staff: 'الموظف',
    checkInTime: 'وقت الوصول',
    checkOutTime: 'وقت المغادرة',
    notes: 'ملاحظات',
    today: 'اليوم',
    present: 'الحاضرون',
    departed: 'المغادرون',
    recordCheckIn: 'تسجيل الوصول',
    recordCheckOut: 'تسجيل المغادرة'
  },
  articles: {
    title: 'المقالات',
    addArticle: 'إضافة مقال',
    editArticle: 'تعديل المقال',
    titleFr: 'العنوان (فرنسي)',
    titleAr: 'العنوان (عربي)',
    contentFr: 'المحتوى (فرنسي)',
    contentAr: 'المحتوى (عربي)',
    image: 'الصورة',
    status: 'الحالة',
    author: 'الكاتب',
    publishedAt: 'نُشر في',
    readMore: 'اقرأ المزيد'
  },
  news: {
    title: 'الأخبار',
    addNews: 'إضافة خبر',
    editNews: 'تعديل الخبر',
    titleFr: 'العنوان (فرنسي)',
    titleAr: 'العنوان (عربي)',
    descriptionFr: 'الوصف (فرنسي)',
    descriptionAr: 'الوصف (عربي)',
    eventDate: 'تاريخ الحدث',
    upcoming: 'قادمة',
    past: 'سابقة'
  },
  validation: {
    required: 'هذا الحقل مطلوب',
    email: 'بريد إلكتروني غير صحيح',
    minLength: 'الحد الأدنى {{min}} أحرف',
    maxLength: 'الحد الأقصى {{max}} أحرف',
    phone: 'رقم هاتف غير صحيح',
    date: 'تاريخ غير صحيح',
    url: 'رابط غير صحيح'
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    debug: process.env.NODE_ENV === 'development',

    resources: {
      fr: {
        translation: frTranslations
      },
      ar: {
        translation: arTranslations
      }
    },

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  })

export default i18n
