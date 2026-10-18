/**
 * Centre d'Aide & Assistant Intelligent Crèche Mima Elghalia
 * Données certifiées et synchronisées avec le référentiel documentsV2 (Audit & Documentation)
 * Support complet Bilingue Français / Arabe (RTL)
 */

export const glossaryData = {
  fr: [
    {
      term: "Parent / Titulaire du compte",
      category: "Acteurs",
      definition: "Responsable légal de l'enfant (père ou mère). Après validation du dossier d'inscription, dispose d'un compte utilisateur pour accéder à « Mon Espace » et suivre la vie quotidienne de ses enfants.",
      details: "Chaque parent n'accède strictement qu'aux enfants qui lui sont rattachés."
    },
    {
      term: "Candidat (Applicant)",
      category: "Inscriptions",
      definition: "Personne ayant déposé un dossier d'inscription pour un enfant. Il ne dispose pas encore de compte tant que son dossier n'a pas été formellement approuvé par la direction.",
      details: "Peut confirmer son rendez-vous de visite via un lien public sécurisé sans avoir de compte actif."
    },
    {
      term: "Dossier d'inscription (Enrollment)",
      category: "Inscriptions",
      definition: "Candidature officielle d'un enfant comprenant les informations familiales, médicales et les justificatifs (acte de naissance, carnet de santé, certificat médical).",
      details: "Statuts possibles : En attente (pending), En cours (in_progress), Approuvé (approved), Rejeté (rejected), Archivé."
    },
    {
      term: "Rendez-vous d'admission (Appointment)",
      category: "Inscriptions",
      definition: "Entretien physique proposé par la direction lors de l'acceptation préliminaire du dossier pour rencontrer la famille et finaliser l'inscription.",
      details: "Le parent peut confirmer la date proposée ou suggérer un créneau alternatif."
    },
    {
      term: "Personnel / Éducatrice (Staff)",
      category: "Acteurs",
      definition: "Membre de l'équipe pédagogique assurant le bien-être, l'éveil et le suivi des enfants au jour le jour.",
      details: "Bénéficie de permissions communes par défaut et de permissions individuelles débloquées par la direction."
    },
    {
      term: "Direction / Administrateur",
      category: "Acteurs",
      definition: "Responsable de l'établissement disposant de tous les droits de gestion : inscriptions, personnel, paramètres, sauvegardes et statistiques.",
      details: "Possède implicitement toutes les permissions de l'application."
    },
    {
      term: "Pointage de Présence (Attendance)",
      category: "Quotidien",
      definition: "Enregistrement en temps réel de l'heure d'arrivée (Check-in) et de l'heure de départ (Check-out) de chaque enfant.",
      details: "En fin de journée, un automate (job de nuit) clôture automatiquement les fiches encore ouvertes."
    },
    {
      term: "Signalement d'Absence",
      category: "Quotidien",
      definition: "Déclaration préalable par le parent pour prévenir la crèche d'une absence prévue (maladie, convenance familiale, voyage).",
      details: "Permet à l'équipe pédagogique d'ajuster les effectifs et la préparation des repas."
    },
    {
      term: "Bilan Journalier (Daily Report)",
      category: "Quotidien",
      definition: "Rapport quotidien rédigé par l'éducatrice détaillant le déroulement de la journée : repas consommés, siestes, changes et observations d'éveil.",
      details: "Consultable instantanément par les parents dans « Mon Espace »."
    },
    {
      term: "Traitement Médical & Posologie",
      category: "Santé",
      definition: "Prescription médicamenteuse déclarée par le parent avec horaires et doses. L'administration est confirmée et horodatée par le personnel habilité.",
      details: "Nécessite la permission individuelle 'Administrer les traitements'."
    },
    {
      term: "Personne de Confiance (Trusted Contact)",
      category: "Sécurité",
      definition: "Personne majeure explicitement autorisée par les parents à venir chercher l'enfant à la crèche en cas d'imprévu (jusqu'à 2 personnes enregistrées).",
      details: "Une pièce d'identité peut être exigée à l'accueil."
    },
    {
      term: "Permissions Communes vs Individuelles",
      category: "Sécurité",
      definition: "Les permissions communes sont accordées à tout le personnel dès l'embauche (pointage, bilans, photos). Les permissions individuelles sont accordées au cas par cas par la direction.",
      details: "Exemples de permissions individuelles : administration médicaments, accès aux numéros des parents, traitement des absences."
    },
    {
      term: "Jours Fériés & Fermetures",
      category: "Organisation",
      definition: "Calendrier officiel des 28 jours de fermeture en Tunisie (fêtes nationales, religieuses islamiques et congés scolaires).",
      details: "Configurable par l'administrateur avec mise à jour immédiate pour les familles."
    },
    {
      term: "Sauvegarde & Révocation de Session",
      category: "Sécurité",
      definition: "Sauvegardes automatiques quotidiennes à 02h00. Les sessions inactives expirent sous 7 jours et sont révoquées immédiatement lors de la déconnexion.",
      details: "Les liens de réinitialisation de mot de passe sont limités à 1 heure pour garantir la sécurité."
    }
  ],
  ar: [
    {
      term: "الولي / صاحب الحساب",
      category: "الأطراف",
      definition: "المسؤول القانوني عن الطفل (الأب أو الأم). بعد قبول ملف التسجيل، يحصل على حساب للوصول إلى «مساحتي» ومتابعة الحياة اليومية لأبنائه.",
      details: "لا يمكن للولي الاطلاع إلا على بيانات أطفاله المسجلين فقط."
    },
    {
      term: "المترشح (Applicant)",
      category: "التسجيلات",
      definition: "الشخص الذي قدم ملف تسجيل لطفل. لا يملك حساباً نشطاً بعد حتى تتم دراسة وقبول الملف رسمياً من الإدارة.",
      details: "يمكنه تأكيد موعد المقابلة عبر رابط عام وآمن دون الحاجة لتسجيل الدخول مسبقاً."
    },
    {
      term: "ملف التسجيل (Enrollment)",
      category: "التسجيلات",
      definition: "مطلب تسجيل رسمي يتضمن بيانات الطفل والعائلة والوثائق المطلوبة (مضمون الولادة، الدفتر الصحي، الشهادة الطبية).",
      details: "الحالات الممكنة: قيد الانتظار (pending)، قيد المعالجة (in_progress)، مقبول (approved)، مرفوض (rejected)، مؤرشف."
    },
    {
      term: "موعد القبول والمقابلة (Appointment)",
      category: "التسجيلات",
      definition: "موعد حضور بالروضة تقترحه الإدارة عند قبول الملف مبدئياً للتعرف على العائلة واستكمال الإجراءات.",
      details: "يمكن للولي تأكيد الموعد المقترح أو اقتراح موعد بديل مناسب."
    },
    {
      term: "الموظف / المربية (Staff)",
      category: "الأطراف",
      definition: "عضو بالفريق التربوي مسؤول عن رعاية الأطفال، إيقاظهم، ومتابعة أنشطتهم اليومية في الحضانة.",
      details: "يتمتع بصلاحيات عامة افتراضية وصلاحيات فردية خاصة تمنحها الإدارة."
    },
    {
      term: "الإدارة / المسؤول (Admin)",
      category: "الأطراف",
      definition: "إدارة المؤسسة التي تملك كامل الصلاحيات لإدارة التسجيلات، الموظفين، الإعدادات، النسخ الاحتياطية والإحصائيات.",
      details: "يملك تلقائياً جميع الصلاحيات المتوفرة في المنظومة."
    },
    {
      term: "تسجيل الحضور (Attendance)",
      category: "اليوميات",
      definition: "تسجيل فوري لوقت دخول الطفل (Check-in) ووقت خروجه (Check-out) من الروضة.",
      details: "في نهاية اليوم، يقوم نظام آلي تلقائي بإغلاق السجلات المفتوحة لتفادي الأخطاء."
    },
    {
      term: "الإشعار بالغياب",
      category: "اليوميات",
      definition: "إعلام مسبق من الولي للحضانة عند تغيب الطفل لسبب صحي أو عائلي أو سفر.",
      details: "يساعد الفريق في تنظيم النشاط ووجبات الطعام بشكل دقيق."
    },
    {
      term: "التقرير اليومي (Daily Report)",
      category: "اليوميات",
      definition: "تقرير يومي تعده المربية يوضح تفاصيل يوم الطفل: الوجبات المستهلكة، القيلولة، تغيير الحفاض والملاحظات التربوية.",
      details: "يظهر فورياً للأهالي في قسم «مساحتي»."
    },
    {
      term: "العلاج الطبي والجرعات",
      category: "الصحة",
      definition: "وصفة طبية يدرجها الولي مع الجرعات والمواعيد. يتم تسجيل وتأكيد إعطاء الدواء من طرف المربية المؤهلة رسمياً.",
      details: "يتطلب صلاحية فردية خاصة: 'إعطاء الأدوية والعلاجات'."
    },
    {
      term: "الشخص الموثوق (Trusted Contact)",
      category: "السلامة",
      definition: "شخص بالغ معتمد رسمياً من الولي لاصطحاب الطفل من الروضة في الحالات الطارئة (حتى شخصين مسجلين).",
      details: "يتم التثبت من بطاقة الهوية عند الاستقبال."
    },
    {
      term: "الصلاحيات العامة مقابل الخاصة",
      category: "الأمان",
      definition: "الصلاحيات العامة تمنح لكل مربية تلقائياً (تسجيل الحضور، التقارير، الصور). الصلاحيات الخاصة تمنحها الإدارة حسب الحاجة.",
      details: "أمثلة للصلاحيات الخاصة: تقديم الأدوية، الاطلاع على هواتف الأولياء، قبول طلبات الغياب."
    },
    {
      term: "العطل وأيام الإغلاق",
      category: "التنظيم",
      definition: "الروزنامة الرسمية لـ 28 يوم عطلة في تونس (أعياد وطنية، دينية وإجازات مدرسية).",
      details: "يمكن للإدارة تفعيلها أو تعطيلها مع تحديث فوري لجميع المستخدمين."
    },
    {
      term: "النسخ الاحتياطي وحماية الحسابات",
      category: "الأمان",
      definition: "نسخ احتياطي تلقائي كل ليلة على الساعة 02:00. الجلسات غير النشطة تنتهي بعد 7 أيام وتُبطل فورياً عند تسجيل الخروج.",
      details: "روابط تعيين كلمة السر صالحة لمدة ساعة واحدة فقط لضمان السلامة التامة."
    }
  ]
};

export const workflowData = {
  fr: [
    {
      id: "wf-enrollment",
      title: "Parcours d'Inscription & Accueil",
      description: "Le parcours de bout en bout depuis la candidature jusqu'à la création du compte et l'admission de l'enfant.",
      steps: [
        {
          num: "01",
          title: "Soumission du formulaire public",
          desc: "Le parent remplit le formulaire sur le site sans compte. Vérification automatique anti-doublon et envoi d'un e-mail de confirmation."
        },
        {
          num: "02",
          title: "Dépôt des pièces justificatives",
          desc: "Téléversement sécurisé de l'acte de naissance, du carnet de santé et des certificats médicaux requis."
        },
        {
          num: "03",
          title: "Étude & Décision par la Direction",
          desc: "La direction examine le dossier. En cas d'acceptation, elle fixe une date de rendez-vous d'admission et valide la candidature."
        },
        {
          num: "04",
          title: "Création du mot de passe & Espace Parent",
          desc: "Le parent reçoit un e-mail officiel avec un lien pour créer son mot de passe (valable 7 jours) et se connecter immédiatement."
        },
        {
          num: "05",
          title: "Entretien d'admission & Finalisation",
          desc: "Confirmation du rendez-vous, rencontre avec l'équipe et activation officielle de la fiche enfant dans le groupe correspondant."
        }
      ]
    },
    {
      id: "wf-attendance",
      title: "Pointage des Présences au Quotidien",
      description: "Comment sont gérées les arrivées, les départs et la clôture de journée.",
      steps: [
        {
          num: "01",
          title: "Arrivée le matin (Check-in)",
          desc: "L'éducatrice pointe l'enfant sur sa tablette ou son ordinateur dès son arrivée. L'heure précise est consignée."
        },
        {
          num: "02",
          title: "Vérification des absences signalées",
          desc: "Les absences déclarées par les parents apparaissent directement, évitant les interrogations sur les enfants non arrivés."
        },
        {
          num: "03",
          title: "Départ le soir (Check-out)",
          desc: "Pointage de la sortie et remise de l'enfant au parent ou à une personne de confiance expressément autorisée."
        },
        {
          num: "04",
          title: "Clôture automatique de fin de journée",
          desc: "Chaque soir, un automate système clôture automatiquement les présences pour assurer l'exactitude des statistiques."
        }
      ]
    },
    {
      id: "wf-treatments",
      title: "Gestion Médicale & Administration de Traitements",
      description: "Le protocole de santé garantissant sécurité et traçabilité des soins.",
      steps: [
        {
          num: "01",
          title: "Déclaration par le parent",
          desc: "Dans « Mon Espace », le parent enregistre le médicament, la posologie prescrite, la durée et les heures exactes."
        },
        {
          num: "02",
          title: "Prise en charge par le personnel habilité",
          desc: "Seul le personnel disposant de la permission 'Administrer les traitements' accède à la liste des médicaments du jour."
        },
        {
          num: "03",
          title: "Administration & Confirmation horodatée",
          desc: "Après avoir administré la dose prescrite, l'éducatrice valide l'action avec l'heure exacte et d'éventuelles notes d'observation."
        },
        {
          num: "04",
          title: "Suivi en direct pour les parents",
          desc: "Le parent voit immédiatement que le traitement a été respecté et administré dans les règles."
        }
      ]
    },
    {
      id: "wf-daily",
      title: "Bilan Quotidien & Suivi des Fournitures",
      description: "La transmission détaillée des événements de la journée de chaque enfant.",
      steps: [
        {
          num: "01",
          title: "Suivi des repas & collations",
          desc: "Saisie des quantités consommées (tout mangé, moitié, peu) et de l'appétit de l'enfant."
        },
        {
          num: "02",
          title: "Sommeil & Temps calmes",
          desc: "Enregistrement des heures d'endormissement, de réveil et de la qualité du repos."
        },
        {
          num: "03",
          title: "Changes & Propreté",
          desc: "Suivi régulier des changes de couches et de l'apprentissage de la propreté."
        },
        {
          num: "04",
          title: "Alerte de réapprovisionnement",
          desc: "Lorsque le stock de couches ou lingettes est faible, une notification est transmise aux parents."
        }
      ]
    }
  ],
  ar: [
    {
      id: "wf-enrollment",
      title: "مسار التسجيل والاستقبال",
      description: "المسار الكامل من تقديم المطلب إلى إنشاء الحساب وقبول الطفل رسمياً بالروضة.",
      steps: [
        {
          num: "01",
          title: "تقديم الاستمارة العامة",
          desc: "يملأ الولي الاستمارة عبر الموقع دون الحاجة لحساب. يتحقق النظام آلياً من عدم التكرار ويرسل بريد تأكيد الاستلام."
        },
        {
          num: "02",
          title: "رفع الوثائق المطلوبة",
          desc: "تحميل مضمون الولادة، الدفتر الصحي والشهائد الطبية بشكل رقمي آمن."
        },
        {
          num: "03",
          title: "دراسة الملف وقرار الإدارة",
          desc: "تراجع الإدارة المطلب. عند القبول، تحدد موعد المقابلة وتوافق على الترشح."
        },
        {
          num: "04",
          title: "إنشاء كلمة السر ودخول مساحة الولي",
          desc: "يتلقى الولي بريداً رسمياً برابط لتعيين كلمة السر (صالح لمدة 7 أيام) للدخول المباشر إلى حسابه."
        },
        {
          num: "05",
          title: "المقابلة وتفعيل بطاقة الطفل",
          desc: "تأكيد الموعد، التعرف على الفريق التربوي وتفعيل تسجيل الطفل في قسمه المناسب."
        }
      ]
    },
    {
      id: "wf-attendance",
      title: "تسجيل الحضور اليومي والمغادرة",
      description: "كيفية تنظيم عمليات الدخول والخروج والإغلاق اليومي.",
      steps: [
        {
          num: "01",
          title: "الوصول صباحاً (دخول)",
          desc: "تقوم المربية بتسجيل دخول الطفل فور وصوله عبر الحاسوب أو اللوحة الرقمية مع حفظ الوقت الدقيق."
        },
        {
          num: "02",
          title: "التحقق من الغيابات المبلغ عنها",
          desc: "تظهر الغيابات المعلنة مسبقاً من الأولياء مباشرة لتفادي أي التباس حول الأطفال المتغيبين."
        },
        {
          num: "03",
          title: "المغادرة مساءً (خروج)",
          desc: "تسجيل وقت الخروج وتسليم الطفل للأولياء أو للشخص الموثوق المرخص له رسمياً."
        },
        {
          num: "04",
          title: "الإغلاق الآلي لنهاية اليوم",
          desc: "يقوم برنامج ليلي تلقائي بإغلاق سجلات الحضور المفتوحة لضمان سلامة الإحصائيات الشهرية."
        }
      ]
    },
    {
      id: "wf-treatments",
      title: "إدارة العلاجات الطبية والأدوية",
      description: "بروتوكول السلامة الصحية لضمان تتبع دقيق للأدوية الموصوفة.",
      steps: [
        {
          num: "01",
          title: "تسجيل الدواء من قبل الولي",
          desc: "في «مساحتي»، يسجل الولي اسم الدواء، الجرعة المحددة من الطبيب، المدة وأوقات التناول الدقيقة."
        },
        {
          num: "02",
          title: "تكليف الموظفة المؤهلة",
          desc: "فقط المربيات الحاصلات على صلاحية 'إعطاء الأدوية' يمكنهن استعراض الأدوية الواجب تقديمها اليوم."
        },
        {
          num: "03",
          title: "إعطاء الدواء والتأكيد الفوري",
          desc: "بعد تقديم الجرعة، تؤكد المربية العملية في النظام مع تسجيل الوقت والملاحظات."
        },
        {
          num: "04",
          title: "متابعة فورية للأولياء",
          desc: "يطلع الولي فوراً في مساحته على تأكيد تناول طفله للدواء بالوقت والملاحظات."
        }
      ]
    },
    {
      id: "wf-daily",
      title: "التقرير اليومي ومتابعة المستلزمات",
      description: "المتابعة الدقيقة والشاملة لتفاصيل يوم الطفل في الروضة.",
      steps: [
        {
          num: "01",
          title: "متابعة الوجبات والشهية",
          desc: "تسجيل كميات الأكل المتناولة (أكل بالكامل، نصفه، قليل) وشهية الطفل خلال اليوم."
        },
        {
          num: "02",
          title: "النوم والراحة",
          desc: "تسجيل أوقات النوم والاستيقاظ وجودة قيلولة الطفل ومدى هدوئه."
        },
        {
          num: "03",
          title: "الحفاضات والنظافة",
          desc: "متابعة دورية لتغيير الحفاضات وتشجيع الطفل على النظافة الذاتية."
        },
        {
          num: "04",
          title: "تنبيه تجديد المستلزمات",
          desc: "عند اقتراب نفاد الحفاضات أو المناديل المبللة الخاصة بالطفل، يصل إشعار تذكيري للولي."
        }
      ]
    }
  ]
};

export const helpData = {
  fr: {
    panelTitle: "Centre d'Aide & Assistant Intelligent",
    panelSubtitle: "Documentation officielle certifiée • Guide Crèche Mima Elghalia",
    liveStatus: "Prêt à vous aider",
    roleBadge: {
      admin: "Direction / Administrateur",
      staff: "Personnel / Équipe éducative",
      parent: "Espace Parent",
      developer: "Direction / Administrateur",
      visitor: "Visiteur / Candidat"
    },
    tabs: {
      chat: "Assistant IA",
      guide: "Guides par Rôle",
      faq: "FAQ & Solutions",
      glossary: "Glossaire Métier",
      workflows: "Parcours & Flux"
    },
    chat: {
      welcome: "Bonjour ! Je suis votre Assistant Virtuel certifié Mima Elghalia.\n\nJe réponds à vos questions sur les inscriptions, le pointage des présences, la gestion médicale, les bilans journaliers et les paramètres de la crèche.\n\nQue souhaitez-vous savoir aujourd'hui ?",
      placeholder: "Posez votre question (ex: comment déclarer une absence ?)...",
      send: "Envoyer",
      typing: "L'assistant analyse votre demande...",
      noAnswer: "Je n'ai pas trouvé de réponse automatique exacte pour cette question précise.\n\n👉 Vous pouvez consulter l'onglet 'Guides par Rôle' ou 'FAQ' ci-dessus, ou contacter la direction via la messagerie interne ou la page Contact.",
      contactAdmin: "Besoin d'un contact direct ?",
      copySuccess: "Réponse copiée !",
      quickQuestions: [
        "Comment inscrire un enfant ?",
        "Comment pointer les présences ?",
        "Comment administrer un traitement médical ?",
        "Comment signaler une absence ?",
        "Comment sont gérées les sauvegardes ?",
        "Quels sont les jours fériés de la crèche ?"
      ]
    },
    faq: {
      title: "Base de Connaissances & FAQ",
      searchPlaceholder: "Rechercher une question, une procédure ou un mot-clé...",
      categories: {
        all: "Tout afficher",
        general: "Général & Compte",
        inscriptions: "Inscriptions",
        presences: "Présences & Absences",
        sante: "Santé & Traitements",
        staff: "Personnel & Équipe",
        admin: "Direction & Sécurité"
      },
      items: [
        {
          id: "faq-1",
          category: "general",
          question: "Comment changer la langue d'affichage ?",
          answer: "Cliquez sur le sélecteur FR / العربية situé dans la barre de navigation supérieure. L'ensemble de l'interface bascule instantanément, avec inversion droite-à-gauche (RTL) complète pour la langue arabe. Votre préférence est mémorisée automatiquement."
        },
        {
          id: "faq-2",
          category: "general",
          question: "Comment basculer entre le mode clair et le mode sombre ?",
          answer: "Cliquez sur l'icône de lune / soleil dans l'en-tête de l'application. Le thème choisi s'adapte à l'ensemble des pages et reste mémorisé sur votre appareil."
        },
        {
          id: "faq-3",
          category: "general",
          question: "Que signifie le message 'Session expirée' ?",
          answer: "Par mesure de sécurité, votre session reste active jusqu'à 7 jours consécutifs d'inactivité. Au-delà, le jeton de sécurité expire et est invalidé côté serveur. Il vous suffit de vous reconnecter avec votre e-mail et mot de passe."
        },
        {
          id: "faq-4",
          category: "general",
          question: "J'ai oublié mon mot de passe, que faire ?",
          answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Renseignez votre adresse e-mail. Vous recevrez instantanément un lien de réinitialisation sécurisé valable pendant 1 heure."
        },
        {
          id: "faq-5",
          category: "inscriptions",
          question: "Comment fonctionne la première inscription d'un enfant ?",
          answer: "Le candidat remplit le formulaire public accessible depuis la page d'accueil ('Inscription') sans avoir besoin de compte. Il téléverse l'acte de naissance, le carnet de santé et le certificat médical. La direction examine le dossier sous quelques jours."
        },
        {
          id: "faq-6",
          category: "inscriptions",
          question: "Que se passe-t-il lorsque le dossier d'inscription est approuvé ?",
          answer: "La direction valide le dossier en fixant une date pour un rendez-vous d'admission. Le parent reçoit immédiatement un e-mail officiel contenant un lien sécurisé lui permettant de créer son mot de passe définitif et d'accéder à « Mon Espace »."
        },
        {
          id: "faq-7",
          category: "inscriptions",
          question: "Comment inscrire un deuxième enfant pour un parent déjà inscrit ?",
          answer: "Inutile de recommencer une inscription publique ! Connectez-vous à « Mon Espace », puis cliquez sur 'Ajouter un enfant'. Vos coordonnées parentales seront automatiquement rattachées au nouveau dossier."
        },
        {
          id: "faq-8",
          category: "inscriptions",
          question: "Puis-je modifier ou reporter la date du rendez-vous d'admission ?",
          answer: "Oui. Le parent peut confirmer la date proposée ou faire une contre-proposition de créneau horaire directement depuis l'e-mail reçu ou via son espace personnel."
        },
        {
          id: "faq-9",
          category: "presences",
          question: "Comment fonctionne le pointage des présences (Check-in / Check-out) ?",
          answer: "Dans le menu Présences, le personnel clique sur 'Entrée' pour enregistrer l'heure d'arrivée dès que l'enfant franchit la porte, et sur 'Sortie' lors du départ. Si un départ n'a pas été consigné manuellement, un job serveur automatique clôture la fiche en fin de journée."
        },
        {
          id: "faq-10",
          category: "presences",
          question: "Comment déclarer l'absence d'un enfant ?",
          answer: "Dans « Mon Espace », cliquez sur 'Signaler une absence'. Renseignez la période (date de début et date de fin) et le motif (maladie, voyage, convenance personnelle). Le personnel est immédiatement notifié et valide la prise en compte."
        },
        {
          id: "faq-11",
          category: "sante",
          question: "Comment ajouter un traitement médical ou une allergie ?",
          answer: "Dans « Mon Espace », sélectionnez la fiche de votre enfant puis l'onglet 'Santé & Traitements'. Cliquez sur 'Ajouter un traitement' : indiquez le médicament, la posologie, les heures de prise et joignez l'ordonnance si nécessaire. L'équipe pédagogique habilitée en sera notifiée."
        },
        {
          id: "faq-12",
          category: "sante",
          question: "Qui a le droit d'administrer des médicaments aux enfants ?",
          answer: "Seuls les membres du personnel disposant expressément de la permission individuelle 'Administrer les traitements' (accordée par la direction) peuvent valider l'administration d'un traitement et signer électroniquement la prise."
        },
        {
          id: "faq-13",
          category: "sante",
          question: "Qu'est-ce qu'une 'Personne de confiance' et comment l'enregistrer ?",
          answer: "C'est un tiers adulte (grand-parent, oncle, voisin) autorisé par les parents à récupérer l'enfant. Vous pouvez renseigner jusqu'à 2 personnes de confiance dans la fiche de votre enfant avec nom, prénom, numéro de téléphone et lien de parenté."
        },
        {
          id: "faq-14",
          category: "staff",
          question: "Comment rédiger le bilan journalier d'un enfant ?",
          answer: "Dans le tableau de bord du personnel, ouvrez 'Bilans journaliers', choisissez l'enfant puis renseignez : la quantité de nourriture consommée, la qualité et la durée de la sieste, les changes effectués et les observations d'éveil. Le parent le consulte en temps réel."
        },
        {
          id: "faq-15",
          category: "staff",
          question: "Pourquoi certains boutons me sont inaccessibles (message 403 / permission refusée) ?",
          answer: "Le compte personnel dispose de permissions communes par défaut (pointage, bilans, photos). Certaines actions avancées (voir les téléphones des parents, administrer des médicaments, traiter les absences) nécessitent que la direction active la permission correspondante sur votre profil."
        },
        {
          id: "faq-16",
          category: "staff",
          question: "Comment publier des photos et activités de la crèche ?",
          answer: "Dans Activités > Nouvelle activité, rédigez une description et ajoutez des photos ou courtes vidéos. Dès la publication, ces photos apparaissent dans le fil pédagogique accessible aux parents connectés."
        },
        {
          id: "faq-17",
          category: "admin",
          question: "Comment gérer les permissions individuelles d'une éducatrice ?",
          answer: "Depuis le menu Personnel, ouvrez la fiche de l'employée puis cliquez sur 'Gérer les permissions'. Cochez ou décochez les 14 permissions granulaires (médical, coordonnées parents, gestion des absences...). Les modifications prennent effet immédiatement."
        },
        {
          id: "faq-18",
          category: "admin",
          question: "Comment sont programmées les fermetures et jours fériés en Tunisie ?",
          answer: "Dans Paramètres > Jours fériés, la crèche dispose du catalogue des 28 jours fériés tunisiens (8 fêtes nationales, 12 fêtes religieuses et 8 périodes de vacances scolaires). L'administrateur peut activer ou désactiver chaque jour de fermeture avec les toggles."
        },
        {
          id: "faq-19",
          category: "admin",
          question: "Comment fonctionnent les sauvegardes de données ?",
          answer: "Une sauvegarde complète de la base de données est déclenchée automatiquement chaque nuit à 02h00 sans action manuelle. L'administrateur peut également créer une sauvegarde instantanée manuelle, la télécharger ou la restaurer depuis le menu Paramètres > Sauvegardes."
        },
        {
          id: "faq-20",
          category: "admin",
          question: "Comment sont gérés les rôles et permissions des utilisateurs ?",
          answer: "La crèche s'articule autour de rôles adaptés : la Direction supervise l'intégralité des dossiers, finances et paramètres ; l'Équipe éducative bénéficie de permissions pour le suivi quotidien (présences, bilans, repas) ; et les Parents accèdent à leur espace sécurisé pour suivre leurs enfants."
        }
      ]
    },
    guide: {
      title: "Guides Pratiques par Rôle",
      subtitle: "Procédures détaillées extraites du référentiel officiel documentsV2",
      roleFilterLabel: "Sélectionnez votre profil :",
      roles: {
        parent: "Guide du Parent",
        staff: "Guide du Personnel",
        admin: "Guide de la Direction",
        visitor: "Guide du Visiteur / Candidat"
      },
      sectionsByRole: {
        parent: [
          {
            id: "guide-parent-1",
            title: "1. Découverte de « Mon Espace »",
            content: "Votre espace regroupe tout ce qui concerne vos enfants inscrits :\n• Carte d'identité et profil de chaque enfant\n• Calendrier des présences et historique des arrivées/départs\n• Bilans journaliers rédigés par l'équipe (repas, sommeil, propreté)\n• Fil d'actualités avec les photos des ateliers et sorties pédagogiques\n• Messagerie directe avec la direction et les éducatrices"
          },
          {
            id: "guide-parent-2",
            title: "2. Gérer la santé et les traitements médicaux",
            content: "Pour déclarer une ordonnance ou une allergie :\n1. Rendez-vous dans « Mon Espace » > Onglet 'Santé'\n2. Cliquez sur 'Ajouter un traitement médical'\n3. Renseignez le nom exact du médicament, la posologie prescrite et les heures de prise\n4. Joignez une copie de l'ordonnance médicale\n5. Dès l'administration par l'éducatrice habilitée, vous recevrez une confirmation horodatée"
          },
          {
            id: "guide-parent-3",
            title: "3. Signaler une absence prévue ou imprévue",
            content: "Pour éviter les inquiétudes de l'équipe et adapter les repas :\n1. Ouvrez « Mon Espace » > 'Déclarer une absence'\n2. Choisissez l'enfant concerné\n3. Indiquez la date de début, la date de fin et le motif (maladie, voyage, famille)\n4. L'éducatrice en charge est immédiatement prévenue dans son planning du jour"
          },
          {
            id: "guide-parent-4",
            title: "4. Ajouter une Personne de Confiance",
            content: "Si un proche (grand-parent, oncle, voisin) doit récupérer votre enfant :\n1. Allez dans la fiche de l'enfant > 'Personnes autorisées'\n2. Renseignez son nom, prénom, numéro de téléphone et lien de parenté\n3. Vous pouvez enregistrer jusqu'à 2 personnes de confiance\n4. À l'accueil, la personne devra présenter une pièce d'identité valide"
          },
          {
            id: "guide-parent-5",
            title: "5. Partager un avis et participer à la vie de la crèche",
            content: "Votre avis est précieux pour améliorer la qualité d'accueil :\n1. Dans « Mon Espace », descendez jusqu'à la section 'Votre avis compte'\n2. Attribuez une note et rédigez votre témoignage\n3. Après modération bienveillante par la direction, votre avis pourra être publié sur la page d'accueil du site"
          }
        ],
        staff: [
          {
            id: "guide-staff-1",
            title: "1. Pointage des Arrivées et des Départs",
            content: "Le pointage est l'action prioritaire de la journée :\n1. Ouvrez Présences > Vue du Jour\n2. Dès qu'un enfant arrive, cliquez sur 'Entrée' (l'heure exacte est horodatée)\n3. En cas de départ le soir, cliquez sur 'Sortie' en vérifiant l'identité de l'adulte accompagnateur\n4. En fin de journée, les présences encore ouvertes sont clôturées automatiquement par le système"
          },
          {
            id: "guide-staff-2",
            title: "2. Remplir le Bilan Journalier & Suivi des Fournitures",
            content: "Pour chaque enfant présent dans votre groupe :\n1. Ouvrez l'onglet 'Bilans journaliers'\n2. Renseignez les repas (portions mangées), les siestes (durée/calme) et les changes\n3. Indiquez si les stocks de couches ou lingettes sont bientôt épuisés\n4. Sauvegardez : les parents peuvent consulter ce bilan en direct dans leur espace"
          },
          {
            id: "guide-staff-3",
            title: "3. Administration des Médicaments (Permission requise)",
            content: "Réglementation stricte sur la santé des enfants :\n1. Seules les éducatrices dotées de la permission 'Administrer les traitements' peuvent valider un acte médical\n2. Consultez la liste des prises programmées du jour dans 'Traitements'\n3. Vérifiez la prescription, administrez la dose et cliquez sur 'Confirmer l'administration' avec l'heure exacte"
          },
          {
            id: "guide-staff-4",
            title: "4. Partage d'Activités & Photos Pédagogiques",
            content: "Pour valoriser les activités des enfants :\n1. Rendez-vous dans Activités > 'Nouvelle publication'\n2. Décrivez l'atelier (peinture, motricité, comptines, sorties)\n3. Téléversez jusqu'à 10 photos ou courtes vidéos\n4. Les publications sont visibles exclusivement par les parents connectés pour protéger la vie privée des enfants"
          },
          {
            id: "guide-staff-5",
            title: "5. Comprendre vos Droits et Permissions",
            content: "Vos permissions sont visibles dans votre profil :\n• Permissions communes (automatiques) : Présences, Bilans journaliers, Photos d'activités, Planning interne\n• Permissions individuelles (accordées par l'administrateur) : Médicaments, Contacts téléphoniques des familles, Traitement des absences, Tâches d'équipe"
          }
        ],
        admin: [
          {
            id: "guide-admin-1",
            title: "1. Traitement & Validation des Inscriptions",
            content: "Procédure complète pour accepter un nouvel enfant :\n1. Allez dans Inscriptions > Candidatures en attente\n2. Vérifiez les informations de l'enfant et les justificatifs téléversés\n3. Cliquez sur 'Approuver' et fixez une date pour le rendez-vous d'admission\n4. Le système crée automatiquement le compte parent et lui envoie un e-mail officiel pour créer son mot de passe\n5. En cas de dossier incomplet, déclenchez une demande de documents complémentaires par e-mail"
          },
          {
            id: "guide-admin-2",
            title: "2. Gestion des Comptes et Attribution des Permissions",
            content: "Pour administrer votre équipe et vos familles :\n1. Allez dans Paramètres > Utilisateurs\n2. Pour une éducatrice, ouvrez la modale de permissions et activez les modules requis (santé, messagerie, documents administratifs)\n3. Vous pouvez à tout moment suspendre ou réactiver un compte utilisateur en cas de départ"
          },
          {
            id: "guide-admin-3",
            title: "3. Configuration de l'Établissement & Jours Fériés",
            content: "Personnalisation complète de la crèche :\n• Coordonnées bilingues FR/AR (nom, adresse, téléphone, email)\n• Horaires d'ouverture par jour de la semaine et accueil du samedi\n• Gestionnaire des 28 jours fériés tunisiens (nationaux, religieux, scolaires) avec toggles d'ouverture/fermeture"
          },
          {
            id: "guide-admin-4",
            title: "4. Sauvegardes & Sécurité des Données",
            content: "Protection intégrale du patrimoine de données de la crèche :\n1. Une sauvegarde automatique s'exécute chaque nuit à 02h00\n2. Vous pouvez générer une sauvegarde manuelle instantanée avant toute modification majeure\n3. Les sauvegardes peuvent être téléchargées sur votre ordinateur en archive sécurisée ou restaurées en cas d'incident"
          },
          {
            id: "guide-admin-5",
            title: "5. Supervision & Messagerie Publique",
            content: "Supervisez le bon fonctionnement au quotidien :\n• Consultez le taux d'occupation et l'assiduité mensuelle dans les Statistiques\n• Répondez aux demandes des visiteurs reçues via la boîte de contact public\n• Modérez et publiez les avis soumis par les parents pour enrichir le site public"
          }
        ],
        visitor: [
          {
            id: "guide-visitor-1",
            title: "1. Comment inscrire mon enfant pour la première fois ?",
            content: "L'inscription se fait entièrement en ligne en 3 étapes simples :\n1. Cliquez sur le bouton 'Inscription' en haut de la page d'accueil\n2. Renseignez les informations de l'enfant et vos coordonnées de contact\n3. Joignez les documents numériques (acte de naissance, carnet de santé)\n4. Validez : un e-mail de confirmation avec votre numéro de dossier vous sera envoyé immédiatement"
          },
          {
            id: "guide-visitor-2",
            title: "2. Quels sont les délais de traitement des candidatures ?",
            content: "La direction examine les dossiers sous 48 à 72 heures ouvrées. Si des places sont disponibles dans la tranche d'âge de votre enfant, vous recevrez une invitation pour un rendez-vous d'admission sur place."
          },
          {
            id: "guide-visitor-3",
            title: "3. Visiter la crèche et rencontrer l'équipe",
            content: "Vous pouvez contacter l'accueil via le formulaire de contact du site ou par téléphone pour planifier une visite guidée de nos locaux et découvrir le projet pédagogique de l'établissement."
          }
        ]
      }
    },
    tours: {
      title: "Parcours Guidés Interactifs",
      subtitle: "Découvrez les fonctionnalités clés pas à pas selon votre rôle",
      start: "Démarrer ce parcours",
      stepsCount: "étapes détaillées"
    },
    close: "Fermer le centre d'aide",
    back: "Retour",
    search: "Rechercher",
    allCategories: "Toutes les rubriques"
  },
  ar: {
    panelTitle: "مركز المساعدة والمساعد الذكي",
    panelSubtitle: "التوثيق الرسمي المعتمد • دليل روضة ميمة الغالية",
    liveStatus: "جاهز لمساعدتك",
    roleBadge: {
      admin: "الإدارة / المسؤول العام",
      staff: "الفريق التربوي / الموظفون",
      parent: "فضاء الولي",
      developer: "الإدارة / المسؤول العام",
      visitor: "زائر / مترشح"
    },
    tabs: {
      chat: "المساعد الذكي",
      guide: "دليل الأدوار",
      faq: "الأسئلة الشائعة",
      glossary: "قاموس المصطلحات",
      workflows: "مسارات العمل"
    },
    chat: {
      welcome: "مرحباً بكم! أنا المساعد الافتراضي المعتمد لروضة ميمة الغالية.\n\nأجيب على استفساراتكم حول التسجيل، تسجيل الحضور، الرعاية الطبية، التقارير اليومية وإعدادات الروضة.\n\nكيف يمكنني مساعدتكم اليوم؟",
      placeholder: "اكتب سؤالك هنا (مثال: كيف أبلغ عن غياب طفلي؟)...",
      send: "إرسال",
      typing: "المساعد يحلل طلبكم...",
      noAnswer: "لم أجد إجابة آلية مباشرة ومطابقة لهذا السؤال الدقيق.\n\n👉 يمكنكم استعراض تبويب 'دليل الأدوار' أو 'الأسئلة الشائعة' أعلاه، أو مراسلة الإدارة مباشرة عبر البريد الداخلي أو صفحة الاتصال.",
      contactAdmin: "هل تحتاج لتواصل مباشر مع الإدارة؟",
      copySuccess: "تم نسخ الإجابة!",
      quickQuestions: [
        "كيف أُسجّل طفلاً جديداً؟",
        "كيف يتم تسجيل الحضور والغياب؟",
        "كيف أضيف علاجاً أو دواءً لطفلي؟",
        "كيف أبلغ عن غياب طارئ؟",
        "كيف تتم إدارة النسخ الاحتياطي؟",
        "ما هي عطل الروضة وأيام الإغلاق؟"
      ]
    },
    faq: {
      title: "قاعدة المعرفة والأسئلة الشائعة",
      searchPlaceholder: "ابحث عن سؤال، إجراء، أو كلمة مفتاحية...",
      categories: {
        all: "عرض الكل",
        general: "عام والحساب",
        inscriptions: "التسجيلات والقبول",
        presences: "الحضور والغياب",
        sante: "الصحة والعلاجات",
        staff: "الموظفون والفريق",
        admin: "الإدارة والأمان"
      },
      items: [
        {
          id: "faq-1",
          category: "general",
          question: "كيف يمكنني تغيير لغة الواجهة؟",
          answer: "اضغط على زر التبديل FR / العربية الموجود في الشريط العلوي للتنقل. تتحول الواجهة بالكامل فوراً مع دعم كامل للكتابة والاتجاه من اليمين إلى اليسار (RTL). يُحفظ اختيارك تلقائياً للزيارات القادمة."
        },
        {
          id: "faq-2",
          category: "general",
          question: "كيف أقوم بالتبديل بين الوضع المضيء والوضع الليلي؟",
          answer: "اضغط على أيقونة القمر / الشمس في رأس الصفحة. يطبق المظهر المختار فوراً على جميع الصفحات ويُحفظ على جهازك."
        },
        {
          id: "faq-3",
          category: "general",
          question: "ماذا تعني رسالة 'انتهت صلاحية الجلسة'؟",
          answer: "لأسباب أمنية، تظل الجلسة نشطة لمدة تصل إلى 7 أيام من عدم النشاط كحد أقصى. بعد ذلك، تنتهي صلاحية رمز الدخول ويُلغى من الخادم. كل ما عليك فعله هو إعادة تسجيل الدخول ببريدك الإلكتروني وكلمة المرور."
        },
        {
          id: "faq-4",
          category: "general",
          question: "نسيت كلمة المرور الخاصة بي، ماذا أفعل؟",
          answer: "في شاشة تسجيل الدخول، اضغط على 'نسيت كلمة المرور'. أدخل بريدك الإلكتروني المسجل. ستتلقى فوراً رسالة بريد إلكتروني تحتوي على رابط آمن صالح لمدة ساعة واحدة لتعيين كلمة مرور جديدة."
        },
        {
          id: "faq-5",
          category: "inscriptions",
          question: "كيف تتم عملية تسجيل طفل لأول مرة؟",
          answer: "يملأ الولي الاستمارة العامة المتاحة من الصفحة الرئيسية ('تسجيل') دون الحاجة لحساب مسبق. يقوم برفع مضمون الولادة، الدفتر الصحي والشهادة الطبية. تراجع الإدارة الملف وترد في غضون أيام قليلة."
        },
        {
          id: "faq-6",
          category: "inscriptions",
          question: "ما الذي يحدث عند قبول ملف التسجيل من الإدارة؟",
          answer: "توافق الإدارة على الملف مع تحديد موعد لمقابلة القبول. يتلقى الولي فوراً بريداً إلكترونياً رسمياً يتضمن رابطاً آمناً لإنشاء كلمة المرور والدخول المباشر إلى «مساحتي»."
        },
        {
          id: "faq-7",
          category: "inscriptions",
          question: "كيف أسجل طفلاً ثانياً وأنا أملك حساباً بالفعل؟",
          answer: "لا حاجة لتقديم طلب عام من الصفر! قم بتسجيل الدخول إلى «مساحتي»، ثم اضغط على 'إضافة طفل'. سيتم ربط بياناتك العائلية تلقائياً بملف الطفل الجديد."
        },
        {
          id: "faq-8",
          category: "inscriptions",
          question: "هل يمكنني تعديل أو اقتراح موعد بديل لمقابلة القبول؟",
          answer: "نعم بكل تأكيد. يمكن للولي تأكيد الموعد المقترح أو تقديم اقتراح بديل للوقت المناسب مباشرة عبر الرابط الوارد بالبريد أو من خلال حسابه الشخصي."
        },
        {
          id: "faq-9",
          category: "presences",
          question: "كيف يعمل نظام تسجيل الحضور (Check-in / Check-out)؟",
          answer: "في قائمة الحضور، تضغط المربية على 'دخول' لتسجيل وقت وصول الطفل بالدقيقة فور دخوله، وتضغط على 'خروج' عند مغادرته. وإذا لم يُسجل الخروج يدوياً، يقوم برنامج الخادم الآلي بإغلاق السجل في نهاية اليوم."
        },
        {
          id: "faq-10",
          category: "presences",
          question: "كيف أقوم بالإبلاغ عن غياب طفلي؟",
          answer: "في «مساحتي»، اضغط على 'الإبلاغ عن غياب'. حدد الفترة (تاريخ البداية والنهاية) واذكر السبب (مرض، سفر، أسباب عائلية). يتم إشعار الفريق التربوي فوراً لتعديل الترتيبات."
        },
        {
          id: "faq-11",
          category: "sante",
          question: "كيف أضيف دواءً أو علاجاً طبياً لطفلي؟",
          answer: "في «مساحتي»، اختر بطاقة طفلك ثم تبويب 'الصحة والعلاجات'. اضغط على 'إضافة علاج': حدد اسم الدواء، الجرعة، مواعيد التناول وأرفق صورة الوصفة الطبية. يتم إشعار المربية المسؤولة فوراً."
        },
        {
          id: "faq-12",
          category: "sante",
          question: "من يحق له إعطاء الأدوية للأطفال داخل الروضة؟",
          answer: "فقط المربيات الحاصلات رسمياً على صلاحية 'إعطاء الأدوية والعلاجات' (الممنوحة من قبل الإدارة) يمكنهن تسجيل وتأكيد إعطاء الدواء إلكترونياً مع الوقت الدقيق."
        },
        {
          id: "faq-13",
          category: "sante",
          question: "ما هو 'الشخص الموثوق' وكيف أقوم بتسجيله؟",
          answer: "هو شخص بالغ (جد، عم، جار موثوق) يرخص له الولي رسمياً باصطحاب الطفل عند الطوارئ. يمكنك تسجيل حتى شخصين موثوقين ببياناتهم الكاملة ورقم هاتفهم في بطاقة الطفل مع التحقق من الهوية عند الاستقبال."
        },
        {
          id: "faq-14",
          category: "staff",
          question: "كيف تعد المربية التقرير اليومي للطفل؟",
          answer: "في لوحة تحكم الموظفين، افتح 'التقارير اليومية'، اختر الطفل ثم سجل: كمية الوجبات المستهلكة، مدة ونوعية القيلولة، تغيير الحفاضات والملاحظات التربوية. يظهر هذا التقرير فورياً للأولياء في مساحتهم."
        },
        {
          id: "faq-15",
          category: "staff",
          question: "لماذا تظهر لي رسالة 'لا تملك الصلاحية' عند بعض الأزرار؟",
          answer: "يملك حساب الموظف صلاحيات عامة افتراضية (تسجيل الحضور، التقارير، الصور). بعض الإجراءات الحساسة (رؤية هواتف الأولياء، إعطاء الأدوية، معالجة طلبات الغياب) تتطلب تفعيل الصلاحية الخاصة المقابلة من قبل الإدارة."
        },
        {
          id: "faq-16",
          category: "staff",
          question: "كيف أقوم بنشر صور وأنشطة الروضة؟",
          answer: "في الأنشطة > نشاط جديد، اكتب وصف النشاط التربوي وأرفق صوراً أو مقاطع فيديو قصيرة. فور النشر، تظهر الصور في معرض الأنشطة المخصص للأولياء المسجلين لحماية خصوصية الأطفال."
        },
        {
          id: "faq-17",
          category: "admin",
          question: "كيف تدير الإدارة الصلاحيات الفردية للمربيات؟",
          answer: "من قائمة الموظفين، افتح بطاقة المربية ثم اضغط على 'إدارة الصلاحيات'. قم بتفعيل أو تعطيل الصلاحيات الـ 14 بدقة (الصحة، بيانات الأولياء، الغيابات...). تُطبق التغييرات فوراً."
        },
        {
          id: "faq-18",
          category: "admin",
          question: "كيف يتم ضبط العطل الرسمية في تونس؟",
          answer: "في الإعدادات > العطل، يتوفر النظام على روزنامة الـ 28 يوم عطلة تونسية (8 أعياد وطنية، 12 مناسبة دينية و8 فترات إجازة مدرسية). يمكن للإدارة تفعيل أو تعطيل أيام الإغلاق بمفاتيح التشغيل بسهولة."
        },
        {
          id: "faq-19",
          category: "admin",
          question: "كيف تتم عمليات النسخ الاحتياطي وحماية البيانات؟",
          answer: "يتم إجراء نسخ احتياطي شامل لقاعدة البيانات تلقائياً كل ليلة على الساعة 02:00 دون تدخل بشري. كما يمكن للمسؤول إنشاء نسخة احتياطية فورية يدوياً وتحميلها كملف آمن أو استعادتها عند الحاجة."
        },
        {
          id: "faq-20",
          category: "admin",
          question: "كيف يتم تنظيم الأدوار والصلاحيات للمستخدمين؟",
          answer: "تعتمد المنظومة على أدوار واضحة: تملك الإدارة الصلاحيات الكاملة لمتابعة التسجيلات والمالية والموظفين؛ بينما يملك الفريق التربوي صلاحيات مخصصة للعمل اليومي (الحضور، الوجبات، التقارير)؛ ويصل الأولياء إلى فضائهم الخاص لمتابعة أبنائهم بكل أمان."
        }
      ]
    },
    guide: {
      title: "دليل الاستخدام المفصل حسب الدور",
      subtitle: "إجراءات تفصيلية مستخرجة من وثائق المشروع الرسمية documentsV2",
      roleFilterLabel: "اختر صفتك في المنظومة:",
      roles: {
        parent: "دليل الولي",
        staff: "دليل الموظف والمربية",
        admin: "دليل الإدارة والمسؤول",
        visitor: "دليل الزائر والمترشح"
      },
      sectionsByRole: {
        parent: [
          {
            id: "guide-parent-1",
            title: "1. استكشاف «مساحتي» ومتابعة الطفل",
            content: "تجمع مساحتك الخاصة كل ما يخص أطفالك المسجلين في مكان واحد:\n• بطاقة هوية وبيانات كل طفل\n• جدول الحضور وسجل أوقات الدخول والخروج اليومية\n• التقارير اليومية التي تعدها المربية (الوجبات، القيلولة، النظافة)\n• معرض الأنشطة التربوية والصور والفيديوهات الخاصة بالورشات\n• المراسلة الفورية المباشرة مع الإدارة والمربيات"
          },
          {
            id: "guide-parent-2",
            title: "2. متابعة الصحة وإضافة الأدوية والعلاجات",
            content: "لتسجيل وصفة طبية أو حساسية غذائية/دوائية:\n1. افتح «مساحتي» > تبويب 'الصحة والعلاجات'\n2. اضغط على 'إضافة علاج طبي'\n3. اذكر اسم الدواء الدقيق، الجرعة الموصوفة وأوقات التقديم بالساعة\n4. أرفق صورة للوصفة الطبية\n5. فور تقديم الجرعة من قبل المربية المؤهلة، ستتلقى إشعار تأكيد بالوقت الدقيق والملاحظات"
          },
          {
            id: "guide-parent-3",
            title: "3. التبليغ عن غياب طارئ أو مبرمج",
            content: "لتسهيل تنظيم اليوم وضمان عدم قلق الفريق التربوي:\n1. اذهب إلى «مساحتي» > 'الإبلاغ عن غياب'\n2. حدد الطفل المعني بالغياب\n3. حدد تاريخ البداية والنهاية والسبب (مرض، سفر، ظروف عائلية)\n4. يظهر الغياب فوراً للمربية في جدول الحضور اليومي"
          },
          {
            id: "guide-parent-4",
            title: "4. تفويض شخص موثوق لاصطحاب الطفل",
            content: "إذا كان أحد الأقارب (جد، عم، خالة) سيقوم باستلام طفلك:\n1. افتح بطاقة الطفل > 'الأشخاص المرخص لهم'\n2. أدخل الاسم، اللقب، رقم الهاتف وصلة القرابة\n3. يمكنك تسجيل شخصين موثوقين كحد أقصى\n4. عند الاستقبال، سيُطلب من الشخص إظهار بطاقة التعريف الوطنية"
          },
          {
            id: "guide-parent-5",
            title: "5. مشاركة تقييمك ورأيك في الروضة",
            content: "رأيك وملاحظاتك تساهم دائماً في تطوير جودة الرعاية والتعليم:\n1. في «مساحتي»، انزل إلى قسم 'رأيك يهمنا'\n2. ضع تقييماً بالنجوم واكتب تعليقك ومقترحاتك\n3. بعد المراجعة الودية من الإدارة، يمكن نشر رأيك في الصفحة الرئيسية للموقع"
          }
        ],
        staff: [
          {
            id: "guide-staff-1",
            title: "1. تسجيل الحضور والانصراف اليومي",
            content: "تسجيل الحضور هو المهمة اليومية الأولى والأساسية:\n1. افتح الحضور > عرض اليوم\n2. فور وصول الطفل، اضغط على زر 'دخول' (يُسجل الوقت بالدقيقة تلقائياً)\n3. عند الانصراف مساءً، اضغط على 'خروج' مع التحقق من هوية الشخص المستلم\n4. في نهاية اليوم، تُغلق السجلات المفتوحة تلقائياً عبر النظام الآلي"
          },
          {
            id: "guide-staff-2",
            title: "2. إعداد التقرير اليومي ومتابعة المستلزمات",
            content: "لكل طفل حاضر في مجموعتك التربوية:\n1. افتح تبويب 'التقارير اليومية'\n2. سجل تفاصيل الوجبات، فترات القيلولة والنوم، وتغيير الحفاضات\n3. نبه في حال قرب نفاد الحفاضات أو المناديل المبللة الخاصة بالطفل\n4. احفظ التقرير: يطلع عليه الأولياء فورياً ومباشرة عبر هواتفهم"
          },
          {
            id: "guide-staff-3",
            title: "3. تقديم الأدوية (يتطلب صلاحية رسمية)",
            content: "بروتوكول صارم للحفاظ على سلامة وصحة الأطفال:\n1. فقط المربيات الحاصلات على صلاحية 'إعطاء الأدوية' يمكنهن تأكيد الجرعات\n2. استعرض قائمة الأدوية المبرمجة لليوم في قسم 'العلاجات'\n3. تحقق من الوصفة والجرعة، قدم الدواء للطفل ثم اضغط 'تأكيد الإعطاء' مع تسجيل الساعة والملاحظات"
          },
          {
            id: "guide-staff-4",
            title: "4. نشر الأنشطة التربوية والصور",
            content: "لإبراز إبداعات وأنشطة الأطفال اليومية:\n1. اذهب إلى الأنشطة > 'نشاط جديد'\n2. اكتب وصفاً للورشة (رسم، حركية، أناشيد، ألعاب ذكاء)\n3. أرفق صوراً أو مقاطع فيديو مناسبة (حتى 10 ملفات)\n4. تُعرض المنشورات حصرياً للأولياء المسجلين حفاظاً على خصوصية الأطفال"
          },
          {
            id: "guide-staff-5",
            title: "5. فهم الصلاحيات العامة والخاصة",
            content: "يمكنك مراجعة صلاحياتك في صفحة ملفك الشخصي:\n• صلاحيات عامة (افتراضية): تسجيل الحضور، التقارير اليومية، صور الأنشطة، روزنامة العمل\n• صلاحيات خاصة (تمنحها الإدارة): الأدوية والعلاجات، هواتف الأولياء، معالجة طلبات الغياب، المهام الداخلية"
          }
        ],
        admin: [
          {
            id: "guide-admin-1",
            title: "1. معالجة وقبول ملفات التسجيل",
            content: "المسار الكامل لقبول طفل جديد في الروضة:\n1. اذهب إلى التسجيلات > الطلبات المعلقة\n2. راجع بيانات الطفل والوثائق الرسمية المرفوعة\n3. اضغط على 'موافقة' وحدد موعداً لمقابلة القبول\n4. ينشئ النظام حساباً للولي ويرسل له بريداً رسمياً لإنشاء كلمة المرور\n5. إذا كان الملف ناقصاً، أرسل طلباً لاستكمال الوثائق بضغطة زر"
          },
          {
            id: "guide-admin-2",
            title: "2. إدارة الحسابات وتوزيع الصلاحيات",
            content: "لإدارة فريق العمل والمستخدمين:\n1. اذهب إلى الإعدادات > المستخدمين\n2. لكل مربية، افتح نافذة الصلاحيات وفعل الصلاحيات المطلوبة (صحة، مراسلة، وثائق...)\n3. يمكنك تعليق أو إعادة تفعيل أي حساب بسهولة عند الحاجة"
          },
          {
            id: "guide-admin-3",
            title: "3. ضبط إعدادات الروضة وأيام العطل",
            content: "تخصيص شامل لبيانات الروضة:\n• معلومات المؤسسة باللغتين العربية والفرنسية (الاسم، العنوان، الهاتف)\n• أوقات العمل الأسبوعية واستقبال يوم السبت\n• ضبط روزنامة الـ 28 يوم عطلة في تونس (أعياد وطنية ودينية ومدرسية) بمفاتيح تفعيل فورية"
          },
          {
            id: "guide-admin-4",
            title: "4. النسخ الاحتياطي وحماية البيانات",
            content: "حماية تامة وشاملة لبيانات المؤسسة:\n1. يعمل نظام النسخ الاحتياطي التلقائي يومياً على الساعة 02:00 صباحاً\n2. يمكنك إنشاء نسخة احتياطية فورية يدوياً قبل أي تعديلات كبيرة\n3. يمكن تنزيل ملفات النسخ الاحتياطي على جهازك أو استعادتها عند الطوارئ"
          },
          {
            id: "guide-admin-5",
            title: "5. الإشراف العام وصندوق الرسائل العامة",
            content: "متابعة سير العمل اليومي:\n• متابعة نسبة الإشغال والحضور في شاشة الإحصائيات العامة\n• الرد على استفسارات الزوار الواردة عبر نموذج الاتصال في الموقع\n• مراجعة واعتماد تقييمات الأولياء لنشرها في الموقع العام"
          }
        ],
        visitor: [
          {
            id: "guide-visitor-1",
            title: "1. كيف أقوم بتسجيل طفلي لأول مرة؟",
            content: "التسجيل يتم رقمياً عبر الموقع في 3 خطوات سريعة:\n1. اضغط على زر 'تسجيل' في أعلى الصفحة الرئيسية\n2. أدخل بيانات الطفل ووسائل التواصل الخاصة بالعائلة\n3. ارفع صور الوثائق (مضمون الولادة، الدفتر الصحي)\n4. أكد الإرسال: ستصلك رسالة تأكيد بالبريد الإلكتروني برقم الملف فوراً"
          },
          {
            id: "guide-visitor-2",
            title: "2. ما هي المدة المستغرقة لدراسة الملف؟",
            content: "تقوم الإدارة بمراجعة الملفات في غضون 48 إلى 72 ساعة عمل. في حال توفر شواغر في الفئة العمرية لطفلكم، ستتلقون دعوة لحضور مقابلة القبول والتعرف على الروضة."
          },
          {
            id: "guide-visitor-3",
            title: "3. زيارة الروضة والتعرف على الفريق",
            content: "يمكنكم التواصل مع الإدارة عبر نموذج الاتصال أو الاتصال هاتفياً لتحديد موعد لزيارة المؤسسة والاطلاع على الفضاءات والبرنامج التربوي المعتمد."
          }
        ]
      }
    },
    tours: {
      title: "مسارات الإرشاد التفاعلية",
      subtitle: "تعرف على أهم وظائف المنظومة خطوة بخطوة حسب طبيعة استخدامك",
      start: "بدء هذا المسار",
      stepsCount: "خطوات مفصلة"
    },
    close: "إغلاق مركز المساعدة",
    back: "رجوع",
    search: "بحث",
    allCategories: "جميع الأقسام"
  }
};

export const chatBotResponses = {
  fr: [
    {
      keywords: ["inscrire", "inscription", "nouvel enfant", "candidat", "admission", "dossier"],
      answer: "📝 Pour inscrire un enfant à la crèche :\n1. Remplissez le formulaire en ligne depuis la page d'accueil ('Inscription').\n2. Téléversez l'acte de naissance, le carnet de santé et le certificat médical.\n3. La direction examine le dossier sous 48 à 72h et vous propose une date d'entretien.\n4. À l'acceptation finale, vous recevez un e-mail officiel pour créer votre mot de passe et accéder à « Mon Espace ».",
      actions: [
        { label: "📝 Inscription en ligne", path: "/inscription" },
        { label: "📞 Contacter la crèche", path: "/contact" }
      ],
      followUps: [
        "Quels sont les documents obligatoires ?",
        "Combien de temps prend l'étude du dossier ?"
      ]
    },
    {
      keywords: ["rdv", "rendez-vous", "entretien", "visite", "reporter"],
      answer: "📅 Rendez-vous d'admission :\n• Dès que la direction approuve votre dossier préliminaire, une proposition de date vous est envoyée par e-mail.\n• Vous pouvez confirmer ce créneau ou suggérer une autre date directement via le lien public sécurisé sans avoir de compte préalable.",
      actions: [
        { label: "📅 Gestion des inscriptions", path: "/dashboard/enrollments" }
      ],
      followUps: [
        "Comment modifier la date d'un rendez-vous ?",
        "Que se passe-t-il après l'entretien ?"
      ]
    },
    {
      keywords: ["présence", "présences", "pointage", "check-in", "checkin", "check-out", "arriver", "partir", "heure"],
      answer: "⏱️ Gestion du Pointage des Présences :\n• À l'arrivée : Le personnel clique sur 'Entrée' pour enregistrer l'heure d'arrivée exacte de l'enfant.\n• Au départ : Le personnel clique sur 'Sortie' en vérifiant l'identité du parent ou de la personne de confiance autorisée.\n• En fin de journée : Un automate clôture les présences non pointées manuellement.",
      actions: [
        { label: "⏱️ Registre des présences", path: "/dashboard/attendance" }
      ],
      followUps: [
        "Comment déclarer une personne de confiance ?",
        "Qui a le droit de pointer les entrées/sorties ?"
      ]
    },
    {
      keywords: ["absence", "absent", "malade", "signaler", "voyage", "congé"],
      answer: "📢 Signaler une absence :\n1. Connectez-vous à « Mon Espace » > cliquez sur 'Signaler une absence'.\n2. Indiquez la période (dates début/fin) et la raison (maladie, voyage, convenance).\n3. L'équipe pédagogique reçoit immédiatement la notification pour ajuster le planning et les repas.",
      actions: [
        { label: "📢 Signaler une absence", path: "/mon-espace/absence-request" }
      ],
      followUps: [
        "Un certificat médical est-il obligatoire ?",
        "Comment annuler une absence signalée ?"
      ]
    },
    {
      keywords: ["médicament", "traitement", "santé", "ordonnance", "posologie", "fièvre", "allergie"],
      answer: "💊 Traitements Médicaux & Santé :\n1. Dans « Mon Espace », ouvrez la fiche de l'enfant > onglet 'Santé'.\n2. Cliquez sur 'Ajouter un traitement' : indiquez le médicament, la posologie prescrite et les heures exactes.\n3. L'administration est assurée exclusivement par le personnel habilité (permission 'Administrer les traitements').\n4. Chaque prise est confirmée et horodatée dans le système.",
      actions: [
        { label: "💊 Traitements médicaux", path: "/mon-espace/treatments" }
      ],
      followUps: [
        "Qui a l'autorisation d'administrer les médicaments ?",
        "Peut-on ajouter une ordonnance scannée ?"
      ]
    },
    {
      keywords: ["personne de confiance", "récupérer", "confiance", "oncle", "tante", "grand-mère", "grand-père"],
      answer: "🛡️ Personnes de confiance autorisées :\n• Les parents peuvent enregistrer jusqu'à 2 personnes majeures autorisées à récupérer l'enfant.\n• Renseignez nom, prénom, numéro de téléphone et lien de parenté dans la fiche enfant.\n• Une pièce d'identité sera demandée à l'accueil lors de la sortie.",
      actions: [
        { label: "🛡️ Fiche enfant & contacts", path: "/profile" }
      ],
      followUps: [
        "Peut-on changer la personne de confiance en cours d'année ?"
      ]
    },
    {
      keywords: ["rapport", "bilan", "journalier", "repas", "sieste", "couches", "journée"],
      answer: "📋 Bilans Journaliers :\n• Rédigés quotidiennement par l'éducatrice : détails des repas consommés, durée et qualité de la sieste, changes et observations d'éveil.\n• Consultables en temps réel par les parents dans « Mon Espace » > 'Bilans journaliers'.",
      actions: [
        { label: "📋 Bilans journaliers", path: "/mon-espace/daily-reports" }
      ],
      followUps: [
        "À quelle heure le bilan est-il publié ?",
        "Les deux parents reçoivent-ils le bilan ?"
      ]
    },
    {
      keywords: ["mot de passe", "password", "oublié", "réinitialiser", "connexion", "login", "jeton"],
      answer: "🔐 Mot de passe & Sécurité du compte :\n• Mot de passe oublié : Cliquez sur 'Mot de passe oublié' sur l'écran de connexion. Le lien reçu par e-mail est valable 1 heure.\n• À la création du compte : Le lien d'activation reçu après acceptation du dossier d'inscription est valable 7 jours.\n• Durée de session : Votre session reste active 7 jours sans déconnexion.",
      actions: [
        { label: "🔐 Accueil & Connexion", path: "/" },
        { label: "🔑 Mot de passe oublié", path: "/forgot-password" }
      ],
      followUps: [
        "Combien de temps dure le lien de réinitialisation ?",
        "Que faire si je ne reçois pas l'e-mail ?"
      ]
    },
    {
      keywords: ["permission", "droits", "accès", "403", "interdit", "rôle", "staff", "admin"],
      answer: "🔒 Permissions & Rôles :\n• Le personnel bénéficie de permissions communes (présences, bilans, photos).\n• Certaines actions (médicaments, accès aux téléphones des familles, gestion des absences) nécessitent que la direction active la permission individuelle correspondante.\n• La direction (Admin) possède toutes les permissions pour superviser l'ensemble de la crèche.",
      actions: [
        { label: "🔒 Gestion du personnel & permissions", path: "/dashboard/staff" }
      ],
      followUps: [
        "Quelle est la différence entre permissions communes et individuelles ?"
      ]
    },
    {
      keywords: ["jours fériés", "fermeture", "vacances", "tunisie", "férié", "congés", "horaires"],
      answer: "🇹🇳 Jours fériés & Fermetures :\n• Le système intègre les 28 jours fériés officiels en Tunisie (8 fêtes nationales, 12 religieuses islamiques et 8 vacances scolaires).\n• Consultez le widget 'Jours fériés' dans votre tableau de bord ou « Mon Espace ».\n• L'administrateur peut activer ou désactiver chaque jour de fermeture dans Paramètres > Jours fériés.",
      actions: [
        { label: "🇹🇳 Calendrier des jours fériés", path: "/dashboard/settings#section-holidays" }
      ],
      followUps: [
        "La crèche est-elle ouverte pendant les vacances scolaires ?"
      ]
    },
    {
      keywords: ["sauvegarde", "backup", "restaurer", "télécharger", "base de données"],
      answer: "💾 Sauvegardes de données :\n• Automatiques : Un backup intégral s'exécute chaque nuit à 02h00.\n• Manuelles : L'administrateur peut déclencher une sauvegarde instantanée dans Paramètres > Sauvegardes.\n• Les archives peuvent être téléchargées ou restaurées en toute sécurité.",
      actions: [
        { label: "💾 Espace sauvegardes", path: "/dashboard/settings" }
      ],
      followUps: [
        "Les sauvegardes incluent-elles les photos des enfants ?"
      ]
    },
    {
      keywords: ["photo", "activité", "atelier", "vidéo", "galerie", "médias"],
      answer: "📸 Activités & Photos pédagogiques :\n• Le personnel habilité publie photos et descriptions des activités de la crèche.\n• Ces publications sont strictement réservées aux utilisateurs connectés pour garantir la sécurité et la vie privée des enfants.",
      actions: [
        { label: "📸 Galerie d'activités", path: "/activites" }
      ],
      followUps: [
        "Qui peut voir les photos de mon enfant ?"
      ]
    },
    {
      keywords: ["langue", "arabe", "français", "rtl", "sombre", "thème"],
      answer: "🌐 Langue & Thème :\n• Langue : Basculez entre Français et Arabe via le sélecteur FR / العربية en haut à droite. Le mode RTL s'applique automatiquement.\n• Thème : Cliquez sur l'icône lune/soleil pour basculer entre mode clair et mode sombre.",
      actions: [
        { label: "🏠 Accueil", path: "/" }
      ],
      followUps: [
        "Le portail parent est-il entièrement disponible en arabe ?"
      ]
    },
    {
      keywords: ["bonjour", "salut", "hello", "aide", "assister", "qui es-tu"],
      answer: "👋 Bonjour ! Je suis l'Assistant Virtuel officiel de la crèche Mima Elghalia, configuré d'après le référentiel documentsV2.\n\nJe peux vous expliquer n'importe quelle procédure : inscriptions, présences, bilans, santé, permissions ou sauvegardes. Que désirez-vous savoir ?",
      actions: [
        { label: "📝 Inscription en ligne", path: "/inscription" },
        { label: "📋 Bilans journaliers", path: "/mon-espace/daily-reports" }
      ],
      followUps: [
        "Comment inscrire mon enfant ?",
        "Comment signaler une absence ?"
      ]
    }
  ],
  ar: [
    {
      keywords: ["تسجيل", "نسجل", "كيفاش", "بنتي", "ولدي", "طفلة", "تسجيلات", "طفل جديد", "ترشح", "قبول", "ملف", "انخراط"],
      answer: "📝 لتسجيل طفل جديد في الروضة:\n1. املأ الاستمارة الإلكترونية من الصفحة الرئيسية ('تسجيل').\n2. ارفع الوثائق المطلوبة: مضمون الولادة، الدفتر الصحي والشهادة الطبية.\n3. تراجع الإدارة الملف في ظرف 48 إلى 72 ساعة عمل وتقترح موعداً لمقابلة القبول.\n4. عند القبول النهائي، تتلقى بريداً إلكترونياً رسمياً لإنشاء كلمة المرور والدخول إلى «مساحتي».",
      actions: [
        { label: "📝 التسجيل في الروضة", path: "/inscription" },
        { label: "📞 الاتصال بالإدارة", path: "/contact" }
      ],
      followUps: [
        "ما هي الوثائق المطلوبة للتسجيل؟",
        "كم تستغرق دراسة ملف التسجيل؟",
        "كيف يتم تحديد موعد مقابلة القبول؟"
      ]
    },
    {
      keywords: ["موعد", "مقابلة", "زيارة", "تأجيل", "تغيير الموعد"],
      answer: "📅 مواعيد مقابلات القبول:\n• فور موافقة الإدارة المبدئية على الملف، يُقترح عليك موعد بالبريد الإلكتروني.\n• يمكنك تأكيد الموعد أو اقتراح موعد بديل مناسب مباشرة عبر الرابط الآمن دون الحاجة لتسجيل الدخول المسبق.",
      actions: [
        { label: "📅 إدارة التسجيلات والمواعيد", path: "/dashboard/enrollments" }
      ],
      followUps: [
        "كيف أطلب تأجيل الموعد المقترح؟",
        "هل يتطلب الحضور اصطحاب الطفل للمقابلة؟"
      ]
    },
    {
      keywords: ["حضور", "غياب", "دخول", "خروج", "تسجيل الحضور", "وقت", "ساعة"],
      answer: "⏱️ إدارة تسجيل الحضور:\n• عند الوصول: تضغط المربية على 'دخول' لتسجيل وقت وصول الطفل بالدقيقة.\n• عند المغادرة: تضغط على 'خروج' مع التحقق من هوية الشخص المرخص له باستلام الطفل.\n• في المساء: يغلق نظام آلي تلقائي سجلات الحضور المفتوحة لضمان دقة الإحصائيات.",
      actions: [
        { label: "⏱️ سجل الحضور اليومي", path: "/dashboard/attendance" }
      ],
      followUps: [
        "كيف أسجل شخصاً موثوقاً لاستلام طفلي؟",
        "هل يمكن للولي الاطلاع على أوقات حضور طفله؟"
      ]
    },
    {
      keywords: ["إبلاغ عن غياب", "تغيب", "مرض", "سفر", "غائب"],
      answer: "📢 التبليغ عن غياب:\n1. سجل الدخول إلى «مساحتي» > اضغط على 'الإبلاغ عن غياب'.\n2. حدد الفترة (تاريخ البداية والنهاية) واذكر السبب (مرض، سفر، عطلة عائلية).\n3. يتلقى الفريق التربوي الإشعار فوراً لتعديل الوجبات وبرنامج الأنشطة.",
      actions: [
        { label: "📢 الإبلاغ عن غياب", path: "/mon-espace/absence-request" }
      ],
      followUps: [
        "هل تتطلب العودة من المرض شهادة طبية؟",
        "كيف ألغي إبلاغ غياب تم تسجيله خطأً؟"
      ]
    },
    {
      keywords: ["دواء", "علاج", "صحة", "وصفة", "حرارة", "جرعة", "حساسية"],
      answer: "💊 الأدوية والعلاجات الطبية:\n1. في «مساحتي»، افتح بطاقة الطفل > تبويب 'الصحة والعلاجات'.\n2. اضغط على 'إضافة علاج': سجل اسم الدواء، الجرعة الموصوفة وأوقات التناول الدقيقة.\n3. إعطاء الدواء محصور بالمربيات الحاصلات على الصلاحية الخاصة 'تقديم الأدوية'.\n4. يتم تأكيد وتسجيل تقديم كل جرعة فورياً في المنظومة.",
      actions: [
        { label: "💊 متابعة الأدوية والعلاجات", path: "/mon-espace/treatments" }
      ],
      followUps: [
        "من له الحق في إعطاء الدواء لطفلي؟",
        "كيف أرفق صورة الوصفة الطبية؟"
      ]
    },
    {
      keywords: ["شخص موثوق", "استلام الطفل", "جد", "جدة", "عم", "خال", "تفويض"],
      answer: "🛡️ الأشخاص الموثوق بهم للاستلام:\n• يمكن للأولياء تسجيل حتى شخصين بالغين مرخص لهما باستلام الطفل عند الطوارئ.\n• سجل الاسم، اللقب، رقم الهاتف وصلة القرابة في بطاقة الطفل.\n• يُطلب من الشخص إظهار بطاقة التعريف الوطنية عند الاستقبال.",
      actions: [
        { label: "🛡️ بيانات العائلة والأشخاص الموثوقين", path: "/profile" }
      ],
      followUps: [
        "هل يمكن تفويض شخص ليوم واحد فقط؟"
      ]
    },
    {
      keywords: ["تقرير يومي", "تقرير", "وجبة", "قيلولة", "نوم", "حفاضات", "يوميات"],
      answer: "📋 التقارير اليومية:\n• تعدها المربية يومياً: كميات الوجبات المستهلكة، مدة وهدوء القيلولة، تغيير الحفاضات وملاحظات النشاط.\n• يطلع عليها الأولياء فورياً وبشكل مباشر في «مساحتي» > 'التقارير اليومية'.",
      actions: [
        { label: "📋 التقارير اليومية للطفل", path: "/mon-espace/daily-reports" }
      ],
      followUps: [
        "متى يصبح التقرير اليومي متاحاً للمشاهدة؟",
        "هل يمكن للأب والأم معاً قراءة التقرير؟"
      ]
    },
    {
      keywords: ["كلمة السر", "كلمة المرور", "نسيت", "دخول", "حساب", "جلسة"],
      answer: "🔐 كلمة المرور وأمان الحساب:\n• نسيت كلمة المرور: اضغط على 'نسيت كلمة المرور' في صفحة الدخول. رابط الاسترجاع بالبريد صالح لمدة ساعة واحدة.\n• تفعيل الحساب الجديد: رابط إنشاء كلمة المرور عند قبول التسجيل صالح لمدة 7 أيام.\n• استمرار الجلسة: تبقى جلستك نشطة حتى 7 أيام دون انقطاع.",
      actions: [
        { label: "🔐 الصفحة الرئيسية والدخول", path: "/" },
        { label: "🔑 نسيت كلمة المرور", path: "/forgot-password" }
      ],
      followUps: [
        "كم مدة صلاحية رابط استرجاع كلمة المرور؟",
        "ماذا أفعل إن لم يصلني البريد الإلكتروني؟"
      ]
    },
    {
      keywords: ["صلاحيات", "أذونات", "ممنوع", "دور", "مربية", "مسؤول", "403"],
      answer: "🔒 الصلاحيات والأدوار:\n• يتمتع الموظف بصلاحيات عامة (حضور، تقارير، صور الأنشطة).\n• بعض الوظائف (الأدوية، هواتف الأولياء، معالجة الغيابات) تتطلب تفعيل الصلاحية الخاصة من قبل الإدارة.\n• الإدارة تملك كامل الصلاحيات لتسيير ومتابعة كافة أنشطة الروضة.",
      actions: [
        { label: "🔒 جدول الصلاحيات وإدارة الفريق", path: "/dashboard/staff" }
      ],
      followUps: [
        "ما الفرق بين الصلاحيات العامة والصلاحيات الخاصة؟"
      ]
    },
    {
      keywords: ["عطل", "إجازات", "أعياد", "تونس", "إغلاق", "عطلة", "أوقات العمل"],
      answer: "🇹🇳 العطل وأيام الإغلاق:\n• يتضمن النظام 28 يوم عطلة رسمية في تونس (8 وطنية، 12 دينية و8 إجازات مدرسية).\n• يمكنك متابعة العطل القادمة من خلال ودجت 'العطل' في لوحة التحكم أو مساحتي.\n• تملك الإدارة صلاحية تفعيل أو تعطيل أي يوم إغلاق في الإعدادات > العطل.",
      actions: [
        { label: "🇹🇳 جدول العطل والإجازات", path: "/dashboard/settings#section-holidays" }
      ],
      followUps: [
        "هل تعمل الروضة خلال العطل المدرسية؟"
      ]
    },
    {
      keywords: ["نسخ احتياطي", "حفظ البيانات", "استرجاع", "قاعدة بيانات", "backup"],
      answer: "💾 النسخ الاحتياطي وحماية البيانات:\n• آلياً: يتم إنشاء نسخة احتياطية شاملة كل ليلة على الساعة 02:00 صباحاً.\n• يدوياً: يمكن للمسؤول إنشاء نسخة فورية في أي وقت من الإعدادات > النسخ الاحتياطي.\n• يمكن تنزيل الأرشيف بأمان أو استعادته عند الحاجة.",
      actions: [
        { label: "💾 إدارة النسخ الاحتياطي", path: "/dashboard/settings" }
      ],
      followUps: [
        "هل يشمل النسخ الاحتياطي صور الأطفال والأنشطة؟"
      ]
    },
    {
      keywords: ["صور", "أنشطة", "ورشات", "فيديو", "معرض"],
      answer: "📸 الأنشطة التربوية والصور:\n• ينشر الفريق التربوي صوراً وأوصافاً للورشات والفعاليات المنظمة للأطفال.\n• المنشورات تظهر حصرياً للمستخدمين المسجلين حفاظاً على سلامة وخصوصية أطفالكم.",
      actions: [
        { label: "📸 معرض الأنشطة", path: "/activites" }
      ],
      followUps: [
        "من يستطيع مشاهدة صور الأنشطة؟"
      ]
    },
    {
      keywords: ["لغة", "عربية", "فرنسية", "يمين", "وضع ليلي", "مظهر"],
      answer: "🌐 اللغة والمظهر:\n• اللغة: بدل بين العربية والفرنسية من زر FR / العربية أعلى الصفحة. يُطبق اتجاه اليمين لليسار (RTL) تلقائياً.\n• المظهر: اضغط على رمز القمر/الشمس للتبديل بين الوضع الليلي والمضيء.",
      actions: [
        { label: "🏠 الصفحة الرئيسية", path: "/" }
      ],
      followUps: [
        "هل تدعم المنظومة الوضع الداكن بشكل كامل؟"
      ]
    },
    {
      keywords: ["مرحبا", "أهلا", "صباح الخير", "مساء الخير", "سلام", "مساعدة", "من أنت"],
      answer: "👋 أهلاً ومرحباً بكم! أنا المساعد الافتراضي المعتمد لروضة ميمة الغالية وفق توثيق documentsV2.\n\nيمكنني مساعدتكم في كافة إجراءات التسجيل، الحضور، التقارير اليومية، الرعاية الطبية، الصلاحيات أو الإعدادات. ماذا تودون أن تسألوا؟",
      actions: [
        { label: "📝 التسجيل في الروضة", path: "/inscription" },
        { label: "📋 التقارير اليومية", path: "/mon-espace/daily-reports" }
      ],
      followUps: [
        "كيفاش نسجل بنتي أو ولدي؟",
        "كيف يتم الإبلاغ عن غياب طفل؟"
      ]
    }
  ]
};

/**
 * Moteur de suggestions contextuelles par Page & Rôle (DOCS V2)
 * Analyse l'URL active et le rôle de l'utilisateur pour adapter l'assistance
 */
export function getContextualHelp(pathname = '', role = 'visitor', language = 'fr') {
  const isAr = language === 'ar';
  const path = pathname.toLowerCase();
  const effectiveRole = role || 'visitor';

  // 1. Inscriptions & Candidatures
  if (
    path.includes('/inscription') ||
    path.includes('/pending-enrollments') ||
    path.includes('/enrollments') ||
    path.includes('/create-password') ||
    path.includes('/upload-documents')
  ) {
    if (effectiveRole === 'admin' || effectiveRole === 'developer') {
      return {
        contextKey: 'enrollments_admin',
        contextName: isAr ? 'إدارة التسجيلات والقبول' : 'Gestion des Inscriptions & Admissions',
        welcomeMessage: isAr
          ? 'أهلاً بك في وحدة معالجة التسجيلات. يمكنك دراسة الملفات، الموافقة مع تحديد موعد، أو طلب وثائق تكميلية.'
          : 'Vous êtes sur le module de gestion des inscriptions. Je peux vous guider pour approuver un dossier, fixer un RDV ou notifier un candidat.',
        suggestions: isAr
          ? [
              'كيف أوافق على ملف مع تحديد موعد؟',
              'ما هي أسباب الرفض المعتمدة في النظام؟',
              'كيف أطلب وثائق ناقصة من الولي؟',
              'كيف يتم إنشاء حساب الولي تلقائياً؟'
            ]
          : [
              'Comment approuver un dossier avec un rendez-vous ?',
              'Quels sont les motifs valides pour un refus ?',
              'Comment relancer un candidat pour pièces manquantes ?',
              'Comment fonctionne le compte parent créé automatiquement ?'
            ],
        recommendedWorkflowId: 'wf-enrollment',
        recommendedFaqCategory: 'inscriptions'
      };
    }

    return {
      contextKey: 'enrollments_public',
      contextName: isAr ? 'تسجيل طفل جديد' : 'Inscription d’un Enfant',
      welcomeMessage: isAr
        ? 'أهلاً بك في استمارة التسجيل. سأساعدك في إعداد الملف، معرفة الوثائق المطلوبة ومراحل القبول.'
        : 'Bienvenue sur le formulaire d’inscription. Je peux vous aider à préparer votre dossier et vous expliquer les étapes d’admission.',
      suggestions: isAr
        ? [
            'ما هي الوثائق الإجبارية للتسجيل؟',
            'كم يستغرق الرد على ملف التسجيل؟',
            'كيف أؤكد موعد المقابلة بالروضة؟',
            'كيف أقوم بإنشاء كلمة السر لحسابي؟'
          ]
        : [
            'Quelles sont les pièces obligatoires à fournir ?',
            'Quel est le délai de réponse pour mon dossier ?',
            'Comment confirmer mon rendez-vous d’admission ?',
            'Comment créer mon mot de passe parent ?'
          ],
      recommendedWorkflowId: 'wf-enrollment',
      recommendedFaqCategory: 'inscriptions'
    };
  }

  // 2. Présences & Absences
  if (
    path.includes('/attendance') ||
    path.includes('/absence') ||
    path.includes('/absence-request') ||
    path.includes('/absence-management')
  ) {
    if (effectiveRole === 'parent') {
      return {
        contextKey: 'attendance_parent',
        contextName: isAr ? 'الحضور والغيابات' : 'Présences & Absences Enfant',
        welcomeMessage: isAr
          ? 'أنت في فضاء متابعة الحضور والغيابات. يمكنك الإبلاغ عن غياب طارئ أو مراجعة تواريخ حضور طفلك.'
          : 'Vous êtes dans le suivi des présences et absences. Vous pouvez déclarer une absence ou consulter le calendrier.',
        suggestions: isAr
          ? [
              'كيف أبلغ عن غياب طفلي (مرض، سفر)؟',
              'كيف أقرأ جدول الحضور الشهري؟',
              'من يحق له اصطحاب طفلي (الشخص الموثوق)؟',
              'ما هي مواعيد الدخول والخروج؟'
            ]
          : [
              'Comment déclarer une absence maladie ou voyage ?',
              'Comment lire le calendrier de présence ?',
              'Qui a le droit de récupérer mon enfant (Personne de confiance) ?',
              'Quels sont les horaires d’accueil le matin ?'
            ],
        recommendedWorkflowId: 'wf-attendance',
        recommendedFaqCategory: 'presences'
      };
    }

    return {
      contextKey: 'attendance_staff',
      contextName: isAr ? 'تسجيل الحضور اليومي' : 'Pointage des Présences (Staff)',
      welcomeMessage: isAr
        ? 'أنت في شاشة الحضور اليومي. يمكنك تسجيل دخول وخروج الأطفال، ومتابعة الغيابات المصرح بها.'
        : 'Vous êtes sur le module de pointage journalier. Je peux vous guider pour les entrées, sorties et clôtures de fin de journée.',
      suggestions: isAr
        ? [
            'كيف أسجل دخول طفل (Check-in) وخروجه؟',
            'كيف يعمل الإغلاق الآلي لنهاية اليوم؟',
            'كيف أراجع وأقبل طلبات الغياب الواردة؟',
            'أين أجد تقرير الحضور الشهري؟'
          ]
        : [
            'Comment enregistrer l’entrée (Check-in) et la sortie ?',
            'Comment fonctionne la clôture automatique de fin de journée ?',
            'Comment traiter et valider un signalement d’absence ?',
            'Où trouver le rapport d’assiduité mensuelle ?'
          ],
      recommendedWorkflowId: 'wf-attendance',
      recommendedFaqCategory: 'presences'
    };
  }

  // 3. Traitements Médicaux & Santé
  if (
    path.includes('/treatment') ||
    path.includes('/medical') ||
    path.includes('/emergency-contacts')
  ) {
    if (effectiveRole === 'parent') {
      return {
        contextKey: 'treatments_parent',
        contextName: isAr ? 'الصحة والعلاجات الطبية' : 'Santé & Traitements Médicaux',
        welcomeMessage: isAr
          ? 'أنت في قسم الرعاية الصحية. يمكنك تسجيل الأدوية الموصوفة وتحديد مواعيد الجرعات بدقة.'
          : 'Vous consultez le module Santé & Traitements. Vous pouvez déclarer une ordonnance, une allergie ou un contact d’urgence.',
        suggestions: isAr
          ? [
              'كيف أضيف علاجاً أو دواءً مع تحديد الأوقات؟',
              'كيف أسجل حساسية دوائية أو غذائية؟',
              'كيف أسجل شخصاً موثوقاً لاستلام طفلي؟',
              'كيف يصلني تأكيد إعطاء الدواء لطفلي؟'
            ]
          : [
              'Comment ajouter un traitement médical avec horaires ?',
              'Comment déclarer une allergie alimentaire ou médicamenteuse ?',
              'Comment enregistrer une personne de confiance (max 2) ?',
              'Comment être averti de l’administration du médicament ?'
            ],
        recommendedWorkflowId: 'wf-treatments',
        recommendedFaqCategory: 'sante'
      };
    }

    return {
      contextKey: 'treatments_staff',
      contextName: isAr ? 'إعطاء الأدوية والرعاية الصحية' : 'Administration des Traitements (Staff)',
      welcomeMessage: isAr
        ? 'وحدة الرعاية الصحية: التحقق من الوصفات الطبية المبرمجة لليوم وتأكيد إعطاء الجرعات.'
        : 'Module Santé & Traitements : vérification des prescriptions du jour et validation horodatée des prises.',
      suggestions: isAr
        ? [
            'من يملك صلاحية إعطاء الأدوية للأطفال؟',
            'كيف أؤكد تقديم جرعة دواء مع تسجيل الوقت؟',
            'ماذا أفعل في حالة حساسية طارئة أو حمى؟',
            'كيف أطلع على الملف الطبي للطفل؟'
          ]
        : [
            'Qui a la permission d’administrer les médicaments ?',
            'Comment confirmer la prise d’un traitement avec l’heure ?',
            'Que faire en cas d’allergie déclarée ou de fièvre ?',
            'Comment consulter la fiche médicale d’un enfant ?'
          ],
      recommendedWorkflowId: 'wf-treatments',
      recommendedFaqCategory: 'sante'
    };
  }

  // 4. Bilans Journaliers & Fournitures
  if (
    path.includes('/daily-reports') ||
    path.includes('/child-daily-reports') ||
    path.includes('/details')
  ) {
    return {
      contextKey: 'daily_reports',
      contextName: isAr ? 'التقارير اليومية والمستلزمات' : 'Bilans Journaliers & Fournitures',
      welcomeMessage: isAr
        ? 'أنت في فضاء التقارير اليومية: متابعة الوجبات، القيلولة، النظافة وتنبيهات المستلزمات.'
        : 'Vous êtes dans le suivi quotidien : repas, siestes, changes et approvisionnement en fournitures.',
      suggestions: isAr
        ? [
            'كيف تعد المربية التقرير اليومي للطفل؟',
            'متى يُنشر التقرير ويظهر للأولياء؟',
            'كيف يتم التنبيه بنفاد الحفاضات أو المناديل؟',
            'كيف أسجل الملاحظات التربوية وسلوك الطفل؟'
          ]
        : [
            'Comment remplir le bilan journalier d’un enfant ?',
            'À quelle heure le bilan est-il visible par les parents ?',
            'Comment notifier les parents d’un besoin de fournitures ?',
            'Comment enregistrer les observations d’éveil ?'
          ],
      recommendedWorkflowId: 'wf-daily',
      recommendedFaqCategory: 'quotidien'
    };
  }

  // 5. Activités Pédagogiques & Planning
  if (
    path.includes('/activit') ||
    path.includes('/calendar') ||
    path.includes('/planning')
  ) {
    return {
      contextKey: 'activities_planning',
      contextName: isAr ? 'الأنشطة والروزنامة' : 'Activités & Planning Pédagogique',
      welcomeMessage: isAr
        ? 'أنت في قسم الأنشطة والروزنامة التربوية: استعراض الفعاليات، الصور والورشات المبرمجة.'
        : 'Vous êtes sur le fil des activités et du planning : ateliers, sorties et galerie photos.',
      suggestions: isAr
        ? [
            'كيف تنشر المربية صور وأنشطة الورشات؟',
            'من يستطيع مشاهدة صور الأطفال (الخصوصية)؟',
            'كيف أطلع على روزنامة الفعاليات والعطل؟',
            'كيف يتفاعل الأولياء مع المنشورات؟'
          ]
        : [
            'Comment publier des photos d’ateliers pédagogiques ?',
            'Qui a accès aux photos publiées (confidentialité) ?',
            'Comment consulter les dates d’événements et sorties ?',
            'Comment les parents peuvent-ils réagir aux publications ?'
          ],
      recommendedWorkflowId: 'wf-daily',
      recommendedFaqCategory: 'quotidien'
    };
  }

  // 6. Paramètres, Jours Fériés & Sauvegardes
  if (
    path.includes('/settings') ||
    path.includes('/activity-logs') ||
    path.includes('/mailbox') ||
    path.includes('/testimonials') ||
    path.includes('/storage')
  ) {
    return {
      contextKey: 'settings_admin',
      contextName: isAr ? 'الإعدادات والإدارة العامة' : 'Paramètres & Configuration Crèche',
      welcomeMessage: isAr
        ? 'لوحة الإعدادات والإدارة: ضبط مواعيد العمل، العطل الرسمية التونسية، والنسخ الاحتياطي.'
        : 'Module de configuration : horaires bilingues, 28 jours fériés tunisiens, permissions et sauvegardes.',
      suggestions: isAr
        ? [
            'كيف أضبط الـ 28 يوم عطلة رسمية في تونس؟',
            'كيف أقوم بإنشاء نسخة احتياطية فورية أو استرجاعها؟',
            'كيف أدير الصلاحيات الـ 14 الفردية للموظفين؟',
            'كيف أعتمد أو أعدل تقييمات الأولياء (Testimonials)؟'
          ]
        : [
            'Comment configurer les 28 jours fériés tunisiens ?',
            'Comment déclencher ou restaurer une sauvegarde ?',
            'Comment gérer les 14 permissions individuelles du personnel ?',
            'Comment modérer les témoignages parents ?'
          ],
      recommendedWorkflowId: 'wf-enrollment',
      recommendedFaqCategory: 'admin'
    };
  }

  // 7. Profil & Sécurité
  if (
    path.includes('/profile') ||
    path.includes('/forgot-password') ||
    path.includes('/reset-password')
  ) {
    return {
      contextKey: 'profile_security',
      contextName: isAr ? 'الملف الشخصي والأمان' : 'Profil & Sécurité du Compte',
      welcomeMessage: isAr
        ? 'أنت في صفحة الأمان والملف الشخصي. يمكنك تعديل بياناتك وتغيير كلمة المرور.'
        : 'Gestion de votre profil et de la sécurité de votre compte.',
      suggestions: isAr
        ? [
            'كيف أغير كلمة المرور الخاصة بي؟',
            'كم مدة صلاحية رابط استرجاع كلمة المرور (ساعة واحدة)؟',
            'كيف أحدث صورتي وبيانات الاتصال؟',
            'كيف أقوم بتغيير اللغة أو تفعيل الوضع الليلي؟'
          ]
        : [
            'Comment modifier mon mot de passe ?',
            'Combien de temps le lien de réinitialisation est-il valable (1h) ?',
            'Comment changer ma photo de profil ?',
            'Comment basculer en langue arabe ou mode sombre ?'
          ],
      recommendedWorkflowId: 'wf-enrollment',
      recommendedFaqCategory: 'general'
    };
  }

  // 8. Accueil & Tableau de bord (Fallback par rôle)
  if (effectiveRole === 'parent') {
    return {
      contextKey: 'home_parent',
      contextName: isAr ? 'فضاء الولي (مساحتي)' : 'Mon Espace Parent',
      welcomeMessage: isAr
        ? 'مرحباً بك في فضاء الولي. تابع حضور طفلك، التقارير اليومية، وتواصل مع إدارة الروضة.'
        : 'Bienvenue dans votre Espace Parent ! Suivez en direct les présences, bilans et la santé de vos enfants.',
      suggestions: isAr
        ? [
            'كيف أطلع على حضور طفلي اليوم؟',
            'كيف أقرأ التقرير اليومي للوجبات والنوم؟',
            'كيف أبلغ عن غياب أو أضيف علاجاً؟',
            'كيف أرسل رسالة للإدارة أو المربية؟'
          ]
        : [
            'Comment voir le calendrier de présence de mon enfant ?',
            'Comment consulter le bilan journalier du jour ?',
            'Comment signaler une absence ou déclarer un traitement ?',
            'Comment contacter l’équipe de la crèche ?'
          ],
      recommendedWorkflowId: 'wf-attendance',
      recommendedFaqCategory: 'presences'
    };
  }

  if (effectiveRole === 'staff') {
    return {
      contextKey: 'home_staff',
      contextName: isAr ? 'لوحة تحكم الفريق التربوي' : 'Tableau de Bord Personnel',
      welcomeMessage: isAr
        ? 'مرحباً بك في فضاء المربيات. جاهز لتسجيل الحضور، إعداد التقارير ومتابعة الأطفال اليوم.'
        : 'Bonjour ! Prêt pour le pointage des présences, la rédaction des bilans ou la publication d’activités ?',
      suggestions: isAr
        ? [
            'كيف أسجل حضور وخروج الأطفال؟',
            'كيف أعد التقرير اليومي وأتابع الحفاضات؟',
            'ما هي الصلاحيات الممنوحة لحسابي؟',
            'كيف أطلع على أدوية الأطفال المبرمجة اليوم؟'
          ]
        : [
            'Comment enregistrer les arrivées et départs ?',
            'Comment rédiger le bilan journalier (repas, sommeil, couches) ?',
            'Comment vérifier mes permissions actives ?',
            'Comment voir les traitements médicaux programmés ?'
          ],
      recommendedWorkflowId: 'wf-attendance',
      recommendedFaqCategory: 'staff'
    };
  }

  if (effectiveRole === 'admin' || effectiveRole === 'developer') {
    return {
      contextKey: 'home_admin',
      contextName: isAr ? 'لوحة تحكم الإدارة' : 'Tableau de Bord Direction',
      welcomeMessage: isAr
        ? 'مرحباً بكم في الإدارة العامة للروضة: متابعة التسجيلات، الموظفين، الإحصائيات والإعدادات.'
        : 'Bienvenue sur la console de direction : suivi des admissions, présences globales, sauvegardes et configuration.',
      suggestions: isAr
        ? [
            'كيف أراجع وأوافق على ملفات التسجيل المعلقة؟',
            'كيف أضبط الصلاحيات الفردية للموظفين؟',
            'أين أجد نسب الحضور والإحصائيات العامة؟',
            'كيف تتم إدارة النسخ الاحتياطي التلقائي؟'
          ]
        : [
            'Comment traiter les inscriptions en attente ?',
            'Comment gérer la matrice des permissions du personnel ?',
            'Où consulter les statistiques globales et assiduité ?',
            'Comment fonctionnent les sauvegardes automatiques nocturnes ?'
          ],
      recommendedWorkflowId: 'wf-enrollment',
      recommendedFaqCategory: 'admin'
    };
  }

  // Visiteur public par défaut
  return {
    contextKey: 'home_visitor',
    contextName: isAr ? 'دليل زوار روضة ميمة الغالية' : 'Guide Visiteurs & Inscriptions',
    welcomeMessage: isAr
      ? 'مرحباً بكم في روضة ميمة الغالية! أنا هنا لإرشادكم في التعرف على فضاءاتنا وتسجيل أطفالكم.'
      : 'Bienvenue à la crèche Mima Elghalia ! Je peux vous guider pour découvrir l’établissement et inscrire votre enfant.',
    suggestions: isAr
      ? [
          'كيف أُسجّل طفلي لأول مرة في الروضة؟',
          'ما هي الوثائق المطلوبة للتسجيل؟',
          'ما هي أوقات العمل وأيام العطل؟',
          'كيف أتواصل مع إدارة الروضة؟'
        ]
      : [
          'Comment inscrire un enfant pour la première fois ?',
          'Quelles sont les pièces justificatives demandées ?',
          'Quels sont les horaires d’ouverture de la crèche ?',
          'Comment contacter la direction ou visiter les lieux ?'
        ],
    recommendedWorkflowId: 'wf-enrollment',
    recommendedFaqCategory: 'general'
  };
}

/**
 * Moteur d'Assistance Temporelle (Time-Aware Engine)
 * Détecte le créneau de la journée pour orienter l'utilisateur vers l'action prioritaire
 */
export function getTimeAwareSuggestion(role = 'visitor', language = 'fr', date = new Date()) {
  const isAr = language === 'ar';
  const hours = date.getHours() + date.getMinutes() / 60;
  const isStaffOrAdmin = role === 'staff' || role === 'admin' || role === 'developer';

  // Matin (07h30 - 09h30)
  if (hours >= 7.5 && hours < 9.5) {
    if (isStaffOrAdmin) {
      return {
        period: 'morning',
        icon: 'sunrise',
        title: isAr ? 'الصباح : تسجيل الحضور والدخول' : 'Matin : Pointage des Arrivées',
        message: isAr
          ? 'فترة الصباح مخصصة لاستقبال الأطفال وتسجيل وقت الدخول، مع معاينة الغيابات المعلنة.'
          : 'Heure d’accueil : enregistrez l’heure d’arrivée exacte des enfants et consultez les absences prévues.',
        quickPrompt: isAr
          ? 'كيفاش نقيد دخول الأطفال هذا الصباح ومعاينة الغيابات المعلنة ؟'
          : 'Comment pointer les arrivées des enfants ce matin et traiter les absences ?',
        action: {
          label: isAr ? '⏱️ سجل الحضور اليومي' : '⏱️ Registre des présences',
          path: '/dashboard/attendance'
        }
      };
    }
    // Parent ou Visiteur le matin
    return {
      period: 'morning',
      icon: 'sunrise',
      title: isAr ? 'الصباح : بداية يوم ممتع' : 'Matin : Début de journée',
      message: isAr
        ? 'هل طفلك متغيب اليوم ؟ تذكر التبليغ عن الغياب في مساحتي لضبط برنامج الوجبات.'
        : 'Un empêchement ce matin ? Pensez à signaler toute absence imprévue pour ajuster les repas.',
      quickPrompt: isAr
        ? 'كيفاش نبلغ على غياب طفلي هذا الصباح ؟'
        : 'Comment signaler une absence imprévue ce matin ?',
      action: {
        label: isAr ? '📢 الإبلاغ عن غياب' : '📢 Signaler une absence',
        path: '/mon-espace/absence-request'
      }
    };
  }

  // Midi (11h30 - 13h30)
  if (hours >= 11.5 && hours < 13.5) {
    if (isStaffOrAdmin) {
      return {
        period: 'noon',
        icon: 'sun',
        title: isAr ? 'الظهيرة : الوجبات والقيلولة' : 'Midi : Repas & Siestes',
        message: isAr
          ? 'وقت وجبة الغداء وتحضير القيلولة. دون كميات الطعام ونوعية النوم في التقارير اليومية.'
          : 'Heure du déjeuner et sieste : consignez l’appétit et le repos dans les bilans journaliers.',
        quickPrompt: isAr
          ? 'كيفاش نكتب التقارير اليومية متاع الوجبة والقيلولة ؟'
          : 'Comment rédiger les bilans journaliers pour les repas et la sieste ?',
        action: {
          label: isAr ? '📋 التقارير اليومية' : '📋 Bilans journaliers',
          path: '/dashboard/daily-reports'
        }
      };
    }
    return {
      period: 'noon',
      icon: 'sun',
      title: isAr ? 'الظهيرة : وجبة الغداء' : 'Midi : Pause déjeuner & Repos',
      message: isAr
        ? 'التقارير اليومية للأطفال قيد التحرير من قبل المربيات لاطلاعكم على الوجبات وفترة القيلولة.'
        : 'Les éducatrices rédigent les bilans du midi (repas pris et temps de repos).',
      quickPrompt: isAr
        ? 'وقتاش نقدر نقرا التقرير اليومي متاع طفلي ؟'
        : 'À quelle heure puis-je consulter le bilan journalier de mon enfant ?',
      action: {
        label: isAr ? '📋 متابعة التقارير' : '📋 Suivi des bilans',
        path: '/mon-espace/daily-reports'
      }
    };
  }

  // Soir (17h00 - 18h30)
  if (hours >= 17.0 && hours <= 18.5) {
    if (isStaffOrAdmin) {
      return {
        period: 'evening',
        icon: 'sunset',
        title: isAr ? 'المساء : تسجيل الخروج والمغادرة' : 'Soir : Pointage des Sorties',
        message: isAr
          ? 'وقت مغادرة الأطفال : تأكد من هوية الشخص الموثوق به قبل اعتماد تسجيل الخروج.'
          : 'Heure des départs : vérifiez l’identité de la personne de confiance autorisée avant le Check-out.',
        quickPrompt: isAr
          ? 'كيفاش نسجل خروج الطفل مع شخص موثوق مرخص له ؟'
          : 'Comment valider la sortie d’un enfant avec une personne de confiance autorisée ?',
        action: {
          label: isAr ? '⏱️ تسجيل الخروج' : '⏱️ Pointer les sorties',
          path: '/dashboard/attendance'
        }
      };
    }
    return {
      period: 'evening',
      icon: 'sunset',
      title: isAr ? 'المساء : استلام الطفل' : 'Soir : Sortie de la crèche',
      message: isAr
        ? 'عند استلام طفلك أو إيفاد شخص موثوق، يرجى الاستظهار ببطاقة التعريف الوطنية عند الاستقبال.'
        : 'Pour récupérer votre enfant ou déléguer un proche, pensez à présenter une pièce d’identité à l’accueil.',
      quickPrompt: isAr
        ? 'كيفاش نتأكد من الأشخاص الموثوقين المرخص لهم باستلام طفلي ؟'
        : 'Comment vérifier ou modifier les personnes de confiance autorisées ?',
      action: {
        label: isAr ? '🛡️ بطاقة الطفل والأشخاص الموثوقين' : '🛡️ Personnes de confiance',
        path: '/profile'
      }
    };
  }

  // Hors créneau spécifique
  return {
    period: 'standard',
    icon: 'clock',
    title: isAr ? 'مساعدتك في أي وقت' : 'Assistance en temps réel',
    message: isAr
      ? 'مركز المساعدة المعتمد متاح دائماً للإجابة على جميع استفساراتكم والتنقل السريع في المنظومة.'
      : 'Notre assistant reste à votre disposition pour toute question sur la vie de la crèche.',
    quickPrompt: isAr
      ? 'ما هي أهم الإجراءات والخدمات المتاحة لي ؟'
      : 'Quelles sont les fonctionnalités principales adaptées à mon profil ?',
    action: {
      label: isAr ? '✨ استكشاف المنظومة' : '✨ Explorer les guides',
      path: '/'
    }
  };
}

/**
 * Générateur de conseils proactifs déclenchés par événements (403, 401, hésitation formulaire)
 */
export function getProactiveAdvice(eventType, payload = {}, language = 'fr') {
  const isAr = language === 'ar';

  if (eventType === 'permission_denied') {
    const url = (payload.url || '').toLowerCase();
    let specificDetail = '';

    if (url.includes('treatment')) {
      specificDetail = isAr
        ? 'هذه العملية تتطلب الصلاحية الفردية الخاصة «تقديم الأدوية والعلاجات».'
        : 'Cette action requiert la permission individuelle « Administrer les traitements ».';
    } else if (url.includes('phone') || url.includes('contact')) {
      specificDetail = isAr
        ? 'الاطلاع على أرقام الأولياء يتطلب تفعيل الصلاحية الخاصة من قبل الإدارة.'
        : 'L’accès aux coordonnées téléphoniques des familles nécessite l’accord de la direction.';
    } else if (url.includes('absence')) {
      specificDetail = isAr
        ? 'معالجة وتعديل طلبات الغياب تتطلب الصلاحية الفردية «معالجة الغيابات».'
        : 'Le traitement des demandes d’absence requiert la permission spécifique associée.';
    }

    return {
      type: 'permission_denied',
      title: isAr ? '🔒 تنبيه : صلاحية غير متوفرة (403)' : '🔒 Accès restreint (Erreur 403)',
      message: isAr
        ? `يبدو أن حسابك يفتقر للصلاحية المطلوبة. ${specificDetail} هل ترغب في معرفة كيفية طلبها من الإدارة؟`
        : `Il semble que votre compte n’ait pas la permission requise. ${specificDetail} Voulez-vous savoir comment la solliciter auprès de la direction ?`,
      actionLabel: isAr ? '💬 اسأل المساعد عن الصلاحيات' : '💬 Comment obtenir cette permission ?',
      suggestedQuestion: isAr
        ? 'كيفاش نطلب من الإدارة تفعيل الصلاحية الفردية الخاصة بحسابي ؟'
        : 'Comment demander à la direction d’activer une permission individuelle sur mon compte ?',
      targetTab: 'chat'
    };
  }

  if (eventType === 'form_hesitation') {
    const pathname = (payload.pathname || '').toLowerCase();
    let msg = isAr
      ? '💡 هل تحتاج لمساعدة في تعمير الاستمارة أو إرفاق الوثائق المطلوبة؟'
      : '💡 Besoin d’un coup de main pour remplir ce formulaire ou joindre les pièces obligatoires ?';
    let question = isAr
      ? 'ما هي الوثائق والبيانات المطلوبة لتعمير هذا النموذج ؟'
      : 'Quelles sont les pièces et informations nécessaires pour remplir ce formulaire ?';

    if (pathname.includes('/inscription')) {
      msg = isAr
        ? '💡 هل ترغب بمساعدة سريعة لمعرفة الوثائق الإجبارية للتسجيل (المضمون، الدفتر الصحي والشهادة الطبية)؟'
        : '💡 Besoin d’aide pour joindre l’acte de naissance, carnet de santé ou certificat médical ?';
      question = isAr
        ? 'كيفاش نكمل تسجيل طفلي وما هي الوثائق المطلوبة ؟'
        : 'Quelles sont les pièces obligatoires à fournir pour l’inscription ?';
    } else if (pathname.includes('medical') || pathname.includes('treatment')) {
      msg = isAr
        ? '💡 هل تجد صعوبة في تسجيل الوصفة الطبية، الجرعة، أو أوقات تقديم الدواء؟'
        : '💡 Besoin d’aide pour indiquer la posologie, l’ordonnance et les horaires d’administration du traitement ?';
      question = isAr
        ? 'كيف يتم تسجيل دواء ومتابعته في المنظومة ؟'
        : 'Comment déclarer un traitement médical et sa posologie pour mon enfant ?';
    }

    return {
      type: 'form_hesitation',
      title: isAr ? '💡 مساعدة في إكمال النموذج' : '💡 Besoin d’aide ?',
      message: msg,
      actionLabel: isAr ? '📝 استفسر الآن' : '📝 Poser la question',
      suggestedQuestion: question,
      targetTab: 'chat'
    };
  }

  return null;
}
