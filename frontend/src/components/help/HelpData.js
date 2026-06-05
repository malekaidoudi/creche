export const helpData = {
  fr: {
    panelTitle: "Centre d'aide",
    panelSubtitle: "Comment puis-je vous aider ?",
    tabs: {
      chat: "Assistant",
      faq: "FAQ",
      guide: "Guide",
      tours: "Tours"
    },
    chat: {
      welcome: "Bonjour ! Je suis votre assistant virtuel. Posez-moi vos questions sur l'utilisation de la crèche.",
      placeholder: "Posez votre question...",
      send: "Envoyer",
      typing: "L'assistant écrit...",
      noAnswer: "Je n'ai pas trouvé de réponse précise. Contactez l'administrateur.",
      contactAdmin: "Contacter l'admin",
      quickQuestions: [
        "Comment inscrire un enfant ?",
        "Comment gérer les présences ?",
        "Comment modifier les paramètres ?",
        "Comment voir les rapports ?"
      ]
    },
    faq: {
      title: "Questions fréquentes",
      categories: {
        general: "Général",
        admin: "Administration",
        staff: "Personnel",
        parent: "Parents"
      },
      items: [
        {
          id: "faq-1",
          category: "general",
          question: "Comment changer la langue ?",
          answer: "Cliquez sur le bouton FR/AR dans la barre de navigation en haut à droite. L'interface bascule automatiquement entre français et arabe avec support RTL complet."
        },
        {
          id: "faq-2",
          category: "general",
          question: "Comment activer le mode sombre ?",
          answer: "Cliquez sur l'icône de lune dans la barre de navigation. Le mode sombre s'applique à toute l'interface."
        },
        {
          id: "faq-3",
          category: "general",
          question: "Où trouver mon profil ?",
          answer: "Cliquez sur votre avatar en haut à droite, puis sélectionnez 'Modifier le profil'."
        },
        {
          id: "faq-4",
          category: "admin",
          question: "Comment approuver une inscription ?",
          answer: "Allez dans Inscriptions > En attente. Cliquez sur le bouton vert 'Approuver', choisissez une date de rendez-vous. Le parent recevra un email automatique."
        },
        {
          id: "faq-5",
          category: "admin",
          question: "Comment configurer les jours fériés ?",
          answer: "Allez dans Paramètres > Jours fériés. Activez/désactivez les jours avec les toggles. Les changements sont appliqués automatiquement."
        },
        {
          id: "faq-6",
          category: "admin",
          question: "Comment ajouter un utilisateur ?",
          answer: "Allez dans Paramètres > Utilisateurs > Ajouter un utilisateur. Remplissez le formulaire et attribuez un rôle (admin, staff ou parent)."
        },
        {
          id: "faq-7",
          category: "staff",
          question: "Comment faire un check-in ?",
          answer: "Allez dans Présences > Aujourd'hui. Cliquez sur le bouton 'Entrée' à côté de l'enfant. L'heure est enregistrée automatiquement."
        },
        {
          id: "faq-8",
          category: "staff",
          question: "Comment créer un rapport journalier ?",
          answer: "Allez dans Rapports > Nouveau. Sélectionnez l'enfant, remplissez les informations (repas, sieste, couches) et sauvegardez."
        },
        {
          id: "faq-9",
          category: "parent",
          question: "Comment voir le calendrier de présence ?",
          answer: "Dans Mon Espace, cliquez sur 'Présences'. Vous verrez un calendrier avec les jours présent, absent ou fermé."
        },
        {
          id: "faq-10",
          category: "parent",
          question: "Comment signaler une absence ?",
          answer: "Dans Mon Espace, cliquez sur 'Signaler une absence'. Remplissez la raison et la période. Le staff sera notifié."
        },
        {
          id: "faq-11",
          category: "parent",
          question: "Comment ajouter un traitement médical pour mon enfant ?",
          answer: "Dans Mon Espace, cliquez sur la carte de votre enfant puis 'Informations médicales'. Ajoutez les traitements, allergies et contacts d'urgence. Ces informations sont visibles par le staff."
        },
        {
          id: "faq-12",
          category: "parent",
          question: "Comment partager un avis ou une suggestion ?",
          answer: "Dans Mon Espace, descendez jusqu'à la section 'Votre avis compte'. Remplissez le formulaire de feedback. Vous pouvez aussi contacter l'administrateur via le chat d'aide."
        },
        {
          id: "faq-13",
          category: "parent",
          question: "Où trouver les activités de la crèche ?",
          answer: "Les activités sont affichées dans le calendrier du dashboard et dans Mon Espace sous 'Activités récentes'. Vous pouvez aussi consulter la galerie photos dans l'onglet Médias."
        },
        {
          id: "faq-14",
          category: "parent",
          question: "Comment savoir les jours fériés de la crèche ?",
          answer: "Dans Mon Espace, consultez le widget 'Jours fériés'. Vous y verrez les prochaines dates de fermeture (nationales, religieuses et scolaires)."
        },
        {
          id: "faq-15",
          category: "staff",
          question: "Comment créer une activité pour les enfants ?",
          answer: "Allez dans Activités > Nouvelle activité. Remplissez le titre, la description, la date et ajoutez des photos. Les parents seront notifiés automatiquement."
        },
        {
          id: "faq-16",
          category: "staff",
          question: "Comment consulter les jours fériés ?",
          answer: "Dans votre dashboard principal, le widget 'Jours fériés' affiche les prochaines fermetures. Vous pouvez aussi aller dans Paramètres > Jours fériés pour la liste complète."
        },
        {
          id: "faq-17",
          category: "admin",
          question: "Comment créer une activité ?",
          answer: "Allez dans Activités > Nouvelle activité. Remplissez les détails, ajoutez des médias et publiez. L'activité apparaîtra dans le calendrier des parents."
        },
        {
          id: "faq-18",
          category: "admin",
          question: "Comment consulter et gérer les jours fériés ?",
          answer: "Allez dans Paramètres > Jours fériés. Vous y verrez les 28 jours (nationaux, religieux, scolaires). Activez ceux où la crèche ferme avec les toggles. Les parents et staff voient automatiquement les mises à jour."
        }
      ]
    },
    guide: {
      title: "Guide utilisateur",
      sectionsByRole: {
        parent: [
          {
            id: "guide-parent-1",
            title: "Mon Espace",
            content: "Votre espace personnel regroupe tout ce qui concerne votre enfant : présences, rapports journaliers, absences et informations médicales. Accédez-y depuis le menu principal ou en cliquant sur 'Mon Espace'."
          },
          {
            id: "guide-parent-2",
            title: "Ajouter un traitement",
            content: "Pour ajouter un traitement ou une allergie :\n1. Dans Mon Espace, cliquez sur la carte de votre enfant\n2. Allez dans l'onglet 'Informations médicales'\n3. Cliquez sur 'Ajouter un traitement'\n4. Remplissez le nom, dosage, horaires et durée\n5. Sauvegardez. Le staff sera automatiquement informé."
          },
          {
            id: "guide-parent-3",
            title: "Partager un avis",
            content: "Votre avis compte ! Dans Mon Espace, descendez à la section 'Votre avis compte'. Remplissez le formulaire avec votre note et commentaire. Vous pouvez aussi suggérer des améliorations. L'administrateur reçoit votre feedback directement."
          },
          {
            id: "guide-parent-4",
            title: "Activités de la crèche",
            content: "Consultez les activités dans Mon Espace sous 'Activités récentes' ou dans la galerie Médias. Vous y trouverez des photos, descriptions et dates des événements passés et à venir."
          },
          {
            id: "guide-parent-5",
            title: "Jours fériés et fermetures",
            content: "Le widget 'Jours fériés' dans Mon Espace affiche les prochaines dates de fermeture : jours nationaux, religieux islamiques et vacances scolaires. Cela vous aide à planifier vos congés."
          },
          {
            id: "guide-parent-6",
            title: "Signaler une absence",
            content: "Prévenez la crèche en cas d'absence :\n1. Mon Espace > Signaler une absence\n2. Sélectionnez les dates\n3. Indiquez la raison (maladie, voyage, etc.)\n4. Le staff reçoit la notification immédiatement"
          }
        ],
        staff: [
          {
            id: "guide-staff-1",
            title: "Tableau de bord",
            content: "Votre dashboard affiche les enfants présents aujourd'hui, les tâches prioritaires et les actions rapides. Utilisez les raccourcis pour accéder rapidement aux fonctionnalités les plus utilisées."
          },
          {
            id: "guide-staff-2",
            title: "Gestion des présences",
            content: "Marquez les entrées et sorties des enfants dans Présences > Aujourd'hui. Les heures sont enregistrées automatiquement. Vous pouvez aussi consulter l'historique et générer des rapports mensuels."
          },
          {
            id: "guide-staff-3",
            title: "Rapports journaliers",
            content: "Créez un rapport pour chaque enfant : repas (quantité/consommation), sieste (durée/qualité), couches, activités et observations spéciales. Les parents y accèdent en temps réel depuis Mon Espace."
          },
          {
            id: "guide-staff-4",
            title: "Créer une activité",
            content: "Pour créer une activité :\n1. Allez dans Activités > Nouvelle activité\n2. Donnez un titre et une description\n3. Choisissez la date et l'heure\n4. Ajoutez des photos si disponibles\n5. Publiez. Les parents seront notifiés automatiquement."
          },
          {
            id: "guide-staff-5",
            title: "Jours fériés",
            content: "Consultez les jours de fermeture dans le widget 'Jours fériés' sur votre dashboard. La liste complète est visible dans Paramètres > Jours fériés. Seul l'admin peut modifier les toggles."
          }
        ],
        admin: [
          {
            id: "guide-admin-1",
            title: "Tableau de bord administrateur",
            content: "Le dashboard admin affiche les métriques globales : nombre d'enfants inscrits, taux de présence, inscriptions en attente et revenus estimés. Utilisez les filtres pour affiner les données."
          },
          {
            id: "guide-admin-2",
            title: "Gestion des inscriptions",
            content: "Traitez les demandes d'inscription :\n1. Inscriptions > En attente\n2. Consultez le dossier complet (documents, infos famille)\n3. Approuvez avec un RDV ou rejetez avec motif\n4. Un email automatique est envoyé au parent à chaque étape."
          },
          {
            id: "guide-admin-3",
            title: "Gestion des utilisateurs",
            content: "Ajoutez, modifiez ou désactivez les comptes utilisateurs dans Paramètres > Utilisateurs. Attribuez les rôles (admin, staff, parent) et gérez les permissions d'accès."
          },
          {
            id: "guide-admin-4",
            title: "Créer une activité",
            content: "Organisez des activités pour la crèche :\n1. Activités > Nouvelle activité\n2. Remplissez le formulaire (titre, description, date)\n3. Ajoutez des photos ou documents\n4. Publiez. L'activité apparaît dans le calendrier public et Mon Espace des parents."
          },
          {
            id: "guide-admin-5",
            title: "Configuration des jours fériés",
            content: "Gérez les 28 jours fériés tunisiens dans Paramètres > Jours fériés :\n- Nationaux (8 jours) : Indépendance, Révolution, etc.\n- Religieux (12 jours) : Aïd el-Fitr, Aïd el-Adha, Mawlid, etc.\n- Scolaires (8 périodes) : Vacances d'automne, hiver, printemps, été\nActivez les toggles rouges pour les jours de fermeture."
          },
          {
            id: "guide-admin-6",
            title: "Paramètres système",
            content: "Configurez les horaires d'ouverture, la capacité maximale, les informations de contact et les emails. Toutes les modifications sont appliquées en temps réel à l'ensemble du système."
          }
        ]
      }
    },
    tours: {
      title: "Tours guidés",
      start: "Démarrer le tour",
      next: "Suivant",
      prev: "Précédent",
      finish: "Terminer",
      skip: "Passer",
      steps: {
        dashboard: [
          { target: ".dashboard-stats", title: "Statistiques", text: "Vue d'ensemble des chiffres clés de la crèche." },
          { target: ".quick-actions", title: "Actions rapides", text: "Accédez rapidement aux fonctionnalités les plus utilisées." },
          { target: ".today-tasks", title: "Tâches du jour", text: "Vos rendez-vous et tâches prioritaires." }
        ],
        children: [
          { target: ".children-table", title: "Liste des enfants", text: "Consultez et gérez tous les enfants inscrits." },
          { target: ".add-child-btn", title: "Ajouter", text: "Créez une nouvelle fiche enfant." }
        ],
        attendance: [
          { target: ".checkin-btn", title: "Check-in", text: "Marquez l'entrée d'un enfant." },
          { target: ".checkout-btn", title: "Check-out", text: "Marquez la sortie d'un enfant." }
        ]
      }
    },
    close: "Fermer",
    back: "Retour"
  },
  ar: {
    panelTitle: "مركز المساعدة",
    panelSubtitle: "كيف يمكنني مساعدتك؟",
    tabs: {
      chat: "مساعد",
      faq: "أسئلة شائعة",
      guide: "دليل",
      tours: "جولات"
    },
    chat: {
      welcome: "مرحباً! أنا مساعدك الافتراضي. اسألني أي سؤال حول استخدام الحضانة.",
      placeholder: "اكتب سؤالك...",
      send: "إرسال",
      typing: "المساعد يكتب...",
      noAnswer: "لم أجد إجابة دقيقة. تواصل مع المسؤول.",
      contactAdmin: "تواصل مع المسؤول",
      quickQuestions: [
        "كيف أُسجّل طفلاً؟",
        "كيف أدير الحضور؟",
        "كيف أعدّل الإعدادات؟",
        "كيف أرى التقارير؟"
      ]
    },
    faq: {
      title: "أسئلة شائعة",
      categories: {
        general: "عام",
        admin: "إدارة",
        staff: "موظفون",
        parent: "أولياء"
      },
      items: [
        {
          id: "faq-1",
          category: "general",
          question: "كيف أغيّر اللغة؟",
          answer: "اضغط على زر FR/AR في شريط التنقل العلوي الأيمن. يتبدّل التطبيق تلقائياً بين الفرنسية والعربية مع دعم كامل للاتجاه من اليمين إلى اليسار."
        },
        {
          id: "faq-2",
          category: "general",
          question: "كيف أفعل الوضع الداكن؟",
          answer: "اضغط على أيقونة القمر في شريط التنقل. يُطبّق الوضع الداكن على كامل الواجهة."
        },
        {
          id: "faq-3",
          category: "general",
          question: "أين أجد ملفي الشخصي؟",
          answer: "اضغط على صورتك في الأعلى الأيمن، ثم اختر 'تعديل الملف الشخصي'."
        },
        {
          id: "faq-4",
          category: "admin",
          question: "كيف أُوافق على تسجيل؟",
          answer: "اذهب إلى التسجيلات > المعلّقة. اضغط الزر الأخضر 'موافقة'، اختر تاريخ الموعد. يُرسل للولي بريد إلكتروني تلقائياً."
        },
        {
          id: "faq-5",
          category: "admin",
          question: "كيف أضبط العطل؟",
          answer: "اذهب إلى الإعدادات > العطل. فعّل/عطّل الأيام باستخدام المفاتيح. يُطبّق التغيير تلقائياً."
        },
        {
          id: "faq-6",
          category: "admin",
          question: "كيف أضيف مستخدماً؟",
          answer: "اذهب إلى الإعدادات > المستخدمين > إضافة مستخدم. املأ النموذج وحدد الدور (مسؤول، موظف، أو ولي)."
        },
        {
          id: "faq-7",
          category: "staff",
          question: "كيف أسجّل دخول طفل؟",
          answer: "اذهب إلى الحضور > اليوم. اضغط 'دخول' بجانب الطفل. يُسجّل الوقت تلقائياً."
        },
        {
          id: "faq-8",
          category: "staff",
          question: "كيف أُنشئ تقريراً يومياً؟",
          answer: "اذهب إلى التقارير > جديد. اختر الطفل، املأ المعلومات (وجبات، نوم، حفاضات) واحفظ."
        },
        {
          id: "faq-9",
          category: "parent",
          question: "كيف أرى تقويم الحضور؟",
          answer: "في مساحتي، اضغط 'الحضور'. سترى تقويماً بالأيام: حاضر، غائب، أو مغلق."
        },
        {
          id: "faq-10",
          category: "parent",
          question: "كيف أُبلّغ عن غياب؟",
          answer: "في مساحتي، اضغط 'تبليغ غياب'. اكتب السبب والمدة. يُخطّر الموظفون."
        },
        {
          id: "faq-11",
          category: "parent",
          question: "كيف أضيف علاجاً لطفلي؟",
          answer: "في مساحتي، اضغط على بطاقة طفلك ثم 'المعلومات الطبية'. أضف الأدوية، الحساسية وجهات الطوارئ. يراها الموظفون."
        },
        {
          id: "faq-12",
          category: "parent",
          question: "كيف أشارك رأي أو اقتراح؟",
          answer: "في مساحتي، نزل إلى 'رأيك يهمنا'. املأ نموذج التقييم. يمكنك أيضاً التواصل مع المسؤول عبر مساعدة الدردشة."
        },
        {
          id: "faq-13",
          category: "parent",
          question: "أين أجد أنشطة الحضانة؟",
          answer: "تظهر الأنشطة في تقويم لوحة التحكم وفي مساحتي ضمن 'الأنشطة الأخيرة'. يمكنك أيضاً تصفح معرض الصور في لسان 'الوسائط'."
        },
        {
          id: "faq-14",
          category: "parent",
          question: "كيف أعرف أيام العطل؟",
          answer: "في مساحتي، راجع ودجت 'العطل'. ستجد مواعيد الإغلاق القادمة (وطنية، دينية، مدرسية)."
        },
        {
          id: "faq-15",
          category: "staff",
          question: "كيف أُنشئ نشاطاً للأطفال؟",
          answer: "اذهب إلى الأنشطة > نشاط جديد. املأ العنوان، الوصف، التاريخ وأضف صوراً. يُخطّر الأهالي تلقائياً."
        },
        {
          id: "faq-16",
          category: "staff",
          question: "كيف أستعرض أيام العطل؟",
          answer: "في لوحة التحكم الرئيسية، يعرض ودجت 'العطل' مواعيد الإغلاق القادمة. يمكنك أيضاً الذهاب إلى الإعدادات > العطل للقائمة الكاملة."
        },
        {
          id: "faq-17",
          category: "admin",
          question: "كيف أُنشئ نشاطاً؟",
          answer: "اذهب إلى الأنشطة > نشاط جديد. املأ التفاصيل، أضف الوسائط وانشر. يظهر النشاط في التقويم العام ومساحة الأهالي."
        },
        {
          id: "faq-18",
          category: "admin",
          question: "كيف أستعرض وأدير العطل؟",
          answer: "اذهب إلى الإعدادات > العطل. ستجد 28 يوماً (وطنية، دينية، مدرسية). فعّل المفاتيح الحمراء لأيام الإغلاق. يرى الأهالي والموظفون التحديثات فوراً."
        }
      ]
    },
    guide: {
      title: "دليل المستخدم",
      sectionsByRole: {
        parent: [
          {
            id: "guide-parent-1",
            title: "مساحتي",
            content: "تجمع مساحتك الشخصية كل ما يخص طفلك: الحضور، التقارير اليومية، الغيابات والمعلومات الطبية. اذهب إليها من القائمة الرئيسية أو بالضغط على 'مساحتي'."
          },
          {
            id: "guide-parent-2",
            title: "إضافة علاج",
            content: "لإضافة علاج أو حساسية:\n1. في مساحتي، اضغط على بطاقة طفلك\n2. اذهب إلى لسان 'المعلومات الطبية'\n3. اضغط 'إضافة علاج'\n4. املأ الاسم، الجرعة، الأوقات والمدة\n5. احفظ. يُبلّغ الموظفون تلقائياً."
          },
          {
            id: "guide-parent-3",
            title: "مشاركة رأيك",
            content: "رأيك يهمنا! في مساحتي، نزل إلى قسم 'رأيك يهمنا'. املأ نموذج التقييم بتقييمك وتعليقك. يمكنك أيضاً اقتراح تحسينات. يصل تعليقك للمسؤول مباشرة."
          },
          {
            id: "guide-parent-4",
            title: "أنشطة الحضانة",
            content: "استعرض الأنشطة في مساحتي ضمن 'الأنشطة الأخيرة' أو معرض الصور في لسان 'الوسائط'. ستجد صوراً، أوصافاً ومواعيد الفعاليات السابقة والقادمة."
          },
          {
            id: "guide-parent-5",
            title: "العطل والإغلاق",
            content: "يعرض ودجت 'العطل' في مساحتي مواعيد الإغلاق القادمة: أيام وطنية، دينية إسلامية وعطل مدرسية. يساعدك هذا في تخطيط إجازاتك."
          },
          {
            id: "guide-parent-6",
            title: "تبليغ غياب",
            content: "أبلّغ الحضانة في حال غياب:\n1. مساحتي > تبليغ غياب\n2. اختر التواريخ\n3. اذكر السبب (مرض، سفر، إلخ)\n4. يتلقّى الموظفون الإشعار فوراً"
          }
        ],
        staff: [
          {
            id: "guide-staff-1",
            title: "لوحة التحكم",
            content: "تعرض لوحتك الأطفال الحاضرين اليوم، المهام ذات الأولوية والإجراءات السريعة. استخدم الاختصارات للوصول السريع إلى أكثر الميزات استخداماً."
          },
          {
            id: "guide-staff-2",
            title: "إدارة الحضور",
            content: "سجّل دخول وخروج الأطفال في الحضور > اليوم. يُسجّل الوقت تلقائياً. يمكنك أيضاً استعراض السجل وإنشاء تقارير شهرية."
          },
          {
            id: "guide-staff-3",
            title: "التقارير اليومية",
            content: "أنشئ تقريراً لكل طفل: الوجبات (الكمية/الاستهلاك)، القيلولة (المدة/الجودة)، الحفاضات، الأنشطة والملاحظات الخاصة. يصلها الأهالي فوراً في مساحتهم."
          },
          {
            id: "guide-staff-4",
            title: "إنشاء نشاط",
            content: "لإنشاء نشاط:\n1. اذهب إلى الأنشطة > نشاط جديد\n2. أعطِ عنواناً ووصفاً\n3. اختر التاريخ والوقت\n4. أضف صوراً إن وُجدت\n5. انشر. يُخطّر الأهالي تلقائياً."
          },
          {
            id: "guide-staff-5",
            title: "العطل",
            content: "استعرض أيام الإغلاق في ودجت 'العطل' في لوحة التحكم. القائمة الكاملة في الإعدادات > العطل. يقتصر تعديل المفاتيح على المسؤول."
          }
        ],
        admin: [
          {
            id: "guide-admin-1",
            title: "لوحة التحكم الإدارية",
            content: "تعرض لوحة التحكم الإدارية المقاييس العامة: عدد الأطفال المسجّلين، معدل الحضور، التسجيلات المعلّقة والإيرادات المتوقعة. استخدم الفلاتر لتحسين البيانات."
          },
          {
            id: "guide-admin-2",
            title: "إدارة التسجيلات",
            content: "عالج طلبات التسجيل:\n1. التسجيلات > المعلّقة\n2. راجع الملف الكامل (مستندات، معلومات العائلة)\n3. وافق مع موعد أو ارفض مع سبب\n4. يُرسل بريد إلكتروني تلقائي للولي في كل مرحلة."
          },
          {
            id: "guide-admin-3",
            title: "إدارة المستخدمين",
            content: "أضف، عدّل أو عطّل حسابات المستخدمين في الإعدادات > المستخدمين. حدد الأدوار (مسؤول، موظف، ولي) وأدِر أذونات الوصول."
          },
          {
            id: "guide-admin-4",
            title: "إنشاء نشاط",
            content: "نظّم أنشطة للحضانة:\n1. الأنشطة > نشاط جديد\n2. املأ النموذج (عنوان، وصف، تاريخ)\n3. أضف صوراً أو مستندات\n4. انشر. يظهر النشاط في التقويم العام ومساحة الأهالي."
          },
          {
            id: "guide-admin-5",
            title: "ضبط العطل",
            content: "أدِر 28 يوم عطل تونسي في الإعدادات > العطل:\n- وطنية (8 أيام): الاستقلال، الثورة، إلخ\n- دينية (12 يوماً): عيد الفطر، عيد الأضحى، المولد، إلخ\n- مدرسية (8 فترات): عطل الخريف، الشتاء، الربيع، الصيف\nفعّل المفاتيح الحمراء لأيام الإغلاق."
          },
          {
            id: "guide-admin-6",
            title: "إعدادات النظام",
            content: "اضبط أوقات الفتح، السعة القصوى، معلومات التواصل والبريد الإلكتروني. تُطبّق كل التعديلات فوراً على النظام بأكمله."
          }
        ]
      }
    },
    tours: {
      title: "جولات إرشادية",
      start: "ابدأ الجولة",
      next: "التالي",
      prev: "السابق",
      finish: "إنهاء",
      skip: "تخطي",
      steps: {
        dashboard: [
          { target: ".dashboard-stats", title: "إحصائيات", text: "نظرة عامة على أرقام الحضانة الرئيسية." },
          { target: ".quick-actions", title: "إجراءات سريعة", text: "وصول سريع إلى أكثر الميزات استخداماً." },
          { target: ".today-tasks", title: "مهام اليوم", text: "مواعيدك ومهامك ذات الأولوية." }
        ],
        children: [
          { target: ".children-table", title: "قائمة الأطفال", text: "استعرض و أدِر جميع الأطفال المسجّلين." },
          { target: ".add-child-btn", title: "إضافة", text: "أنشئ بطاقة طفل جديدة." }
        ],
        attendance: [
          { target: ".checkin-btn", title: "دخول", text: "سجّل دخول طفل." },
          { target: ".checkout-btn", title: "خروج", text: "سجّل خروج طفل." }
        ]
      }
    },
    close: "إغلاق",
    back: "رجوع"
  }
};

export const chatBotResponses = {
  fr: [
    { keywords: ["inscrire", "inscription", "enfant", "demande"], answer: "Pour inscrire un enfant :\n1. Le parent remplit le formulaire public\n2. L'admin consulte les inscriptions en attente\n3. Cliquez sur 'Approuver' et choisissez un RDV\n4. Le parent reçoit un email avec le lien pour créer son compte" },
    { keywords: ["présence", "présences", "attendance", "check-in", "checkin", "entrée"], answer: "Pour gérer les présences :\n1. Allez dans Présences > Aujourd'hui\n2. Cliquez 'Entrée' pour marquer l'arrivée\n3. Cliquez 'Sortie' pour marquer le départ\n4. Les statistiques se mettent à jour en temps réel" },
    { keywords: ["paramètres", "settings", "configuration", "jours fériés", "horaires"], answer: "Pour modifier les paramètres :\n1. Allez dans Paramètres (icône engrenage)\n2. Choisissez l'onglet souhaité\n3. Modifiez les valeurs\n4. Les changements sont sauvegardés automatiquement" },
    { keywords: ["rapport", "report", "daily", "journalier", "quotidien"], answer: "Pour créer un rapport :\n1. Allez dans Rapports > Nouveau\n2. Sélectionnez l'enfant\n3. Remplissez les sections (repas, sieste, couches)\n4. Sauvegardez. Les parents voient le rapport immédiatement." },
    { keywords: ["absence", "absent", "manqué", "signaler"], answer: "Pour signaler une absence :\n1. Dans Mon Espace, cliquez 'Signaler une absence'\n2. Indiquez la raison et la période\n3. Le staff sera notifié et pourra valider" },
    { keywords: ["photo", "image", "profil", "avatar"], answer: "Pour changer votre photo :\n1. Cliquez sur votre avatar en haut à droite\n2. Sélectionnez 'Modifier le profil'\n3. Cliquez sur la photo pour uploader une nouvelle image" },
    { keywords: ["mot de passe", "password", "connexion", "login"], answer: "Pour changer le mot de passe :\n1. Allez dans votre profil\n2. Section 'Sécurité'\n3. Entrez l'ancien mot de passe puis le nouveau\n4. Sauvegardez" },
    { keywords: ["document", "fichier", "upload", "télécharger"], answer: "Pour gérer les documents :\n1. Dans la fiche d'un enfant, allez dans l'onglet Documents\n2. Glissez-déposez ou sélectionnez un fichier\n3. Les documents sont stockés de manière sécurisée" },
    { keywords: ["notification", "alerte", "message"], answer: "Les notifications apparaissent dans le centre de notifications (cloche en haut à droite). Vous recevez des alertes pour les inscriptions, absences et messages importants." },
    { keywords: ["bonjour", "salut", "hello", "hi"], answer: "Bonjour ! Je suis l'assistant virtuel de la crèche Mima Elghalia. Posez-moi vos questions sur l'utilisation du système." },
    { keywords: ["traitement", "médical", "médicament", "allergie", "docteur"], answer: "Pour ajouter un traitement :\n1. Mon Espace > carte de l'enfant\n2. Onglet 'Informations médicales'\n3. 'Ajouter un traitement'\n4. Remplissez le nom, dosage, horaires\n5. Le staff sera informé automatiquement" },
    { keywords: ["avis", "suggestion", "feedback", "opinion", "évaluer"], answer: "Pour partager un avis :\n1. Dans Mon Espace, descendez à 'Votre avis compte'\n2. Remplissez le formulaire de feedback\n3. Vous pouvez aussi suggérer des améliorations\n4. L'administrateur reçoit votre message directement" },
    { keywords: ["activité", "événement", "galerie", "photo activité"], answer: "Pour consulter les activités :\n1. Mon Espace > 'Activités récentes'\n2. Ou allez dans la galerie Médias\n3. Vous y trouverez photos, descriptions et dates\n4. Le staff peut aussi créer de nouvelles activités" },
    { keywords: ["jour férié", "fermeture", "vacances", "congé", "fermé"], answer: "Pour consulter les jours fériés :\n1. Mon Espace > widget 'Jours fériés'\n2. Vous verrez les prochaines fermetures (nationales, religieuses, scolaires)\n3. Le staff/admin peuvent aussi aller dans Paramètres > Jours fériés" }
  ],
  ar: [
    { keywords: ["تسجيل", "تسجيلات", "طفل", "طفلة", "طلب"], answer: "لتسجيل طفل:\n1. يملأ الولي النموذج العام\n2. يراجع المسؤول الطلبات المعلّقة\n3. اضغط 'موافقة' واختر موعداً\n4. يتلقّى الولي بريداً إلكترونياً برابط إنشاء الحساب" },
    { keywords: ["حضور", "غياب", "دخول", "خروج", "check-in"], answer: "لإدارة الحضور:\n1. اذهب إلى الحضور > اليوم\n2. اضغط 'دخول' لتسجيل الوصول\n3. اضغط 'خروج' لتسجيل المغادرة\n4. تُحدّث الإحصائيات في الوقت الفعلي" },
    { keywords: ["إعدادات", "ضبط", "عطل", "أوقات"], answer: "لتعديل الإعدادات:\n1. اذهب إلى الإعدادات (أيقونة الترس)\n2. اختر اللسان المطلوب\n3. عدّل القيم\n4. تُحفظ التغييرات تلقائياً" },
    { keywords: ["تقرير", "تقارير", "يومي", "journalier"], answer: "لإنشاء تقرير:\n1. اذهب إلى التقارير > جديد\n2. اختر الطفل\n3. املأ الأقسام (وجبات، نوم، حفاضات)\n4. احفظ. يراه الأهالي فوراً." },
    { keywords: ["غياب", "غائب", "تبليغ", "تغيب"], answer: "للإبلاغ عن غياب:\n1. في مساحتي، اضغط 'تبليغ غياب'\n2. اذكر السبب والمدة\n3. يُخطّر الموظفون ويُمكنهم التحقق" },
    { keywords: ["صورة", "صور", "ملف", "profile", "avatar"], answer: "لتغيير صورتك:\n1. اضغط على صورتك في الأعلى الأيمن\n2. اختر 'تعديل الملف الشخصي'\n3. اضغط على الصورة لرفع صورة جديدة" },
    { keywords: ["كلمة السر", "mot de passe", "رقم", "دخول"], answer: "لتغيير كلمة السر:\n1. اذهب إلى ملفك الشخصي\n2. قسم 'الأمان'\n3. أدخل كلمة السر القديمة ثم الجديدة\n4. احفظ" },
    { keywords: ["مستند", "ملف", "رفع", "تحميل"], answer: "لإدارة المستندات:\n1. في بطاقة الطفل، اذهب إلى لسان المستندات\n2. اسحب وأسقط أو اختر ملفاً\n3. تُخزّن المستندات بأمان" },
    { keywords: ["إشعار", "تنبيه", "رسالة"], answer: "تظهر الإشعارات في مركز الإشعارات (الجرس في الأعلى الأيمن). تتلقّى تنبيهات للتسجيلات والغيابات والرسائل المهمة." },
    { keywords: ["مرحبا", "صباح", "أهلا", "bonjour"], answer: "مرحباً! أنا مساعد الحضانة ميمة الغالية الافتراضي. اسألني عن استخدام النظام." },
    { keywords: ["علاج", "دواء", "طبيب", "حساسية", "مستشفى"], answer: "لإضافة علاج:\n1. مساحتي > بطاقة الطفل\n2. لسان 'المعلومات الطبية'\n3. 'إضافة علاج'\n4. املأ الاسم، الجرعة، الأوقات\n5. يُبلّغ الموظفون تلقائياً" },
    { keywords: ["رأي", "اقتراح", "تقييم", "feedback", "ملاحظة"], answer: "لمشاركة رأيك:\n1. في مساحتي، نزل إلى 'رأيك يهمنا'\n2. املأ نموذج التقييم\n3. يمكنك اقتراح تحسينات\n4. يصل تعليقك للمسؤول مباشرة" },
    { keywords: ["نشاط", "فعالية", "معرض", "صور نشاط"], answer: "لاستعراض الأنشطة:\n1. مساحتي > 'الأنشطة الأخيرة'\n2. أو اذهب إلى معرض الوسائط\n3. ستجد صوراً وأوصافاً ومواعيد\n4. يمكن للموظفين أيضاً إنشاء أنشطة جديدة" },
    { keywords: ["عطل", "إجازة", "إغلاق", " vacation", "مغلق"], answer: "لمعرفة أيام العطل:\n1. مساحتي > ودجت 'العطل'\n2. ستجد مواعيد الإغلاق القادمة (وطنية، دينية، مدرسية)\n3. يمكن للموظفين/المسؤولين أيضاً الذهاب إلى الإعدادات > العطل" }
  ]
};
