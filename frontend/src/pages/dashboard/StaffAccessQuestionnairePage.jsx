import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Phone,
  Mail,
  CreditCard,
  HeartPulse,
  Pill,
  FileText,
  MessageCircle,
  Megaphone,
  Clock,
  BookOpen,
  Image,
  Camera,
  CalendarX,
  CalendarCheck,
  Users,
  Boxes,
  ListTodo,
  Save,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import api from '../../services/api';

/**
 * Questionnaire simple (sans jargon technique) destiné au client (direction)
 * pour définir quels accès seront accordés aux éducatrices dans l'application.
 *
 * Les réponses sont enregistrées en base et serviront de base de travail
 * pour configurer ensuite le système de permissions par éducatrice.
 */

// Liste complète des questions, groupées par thème, en langage simple.
const QUESTION_GROUPS = [
  {
    key: 'familles',
    title: { fr: 'Informations sur les familles', ar: 'معلومات عن الأسر' },
    icon: Users,
    questions: [
      {
        key: 'voir_telephone_parents',
        icon: Phone,
        label: {
          fr: 'Les éducatrices peuvent-elles voir le numéro de téléphone des parents ?',
          ar: 'هل يمكن للمربيات رؤية رقم هاتف الوالدين؟'
        }
      },
      {
        key: 'voir_email_parents',
        icon: Mail,
        label: {
          fr: 'Les éducatrices peuvent-elles voir l\'adresse email des parents ?',
          ar: 'هل يمكن للمربيات رؤية البريد الإلكتروني للوالدين؟'
        }
      },
      {
        key: 'voir_impayes',
        icon: CreditCard,
        label: {
          fr: 'Les éducatrices peuvent-elles voir si une famille n\'a pas payé ?',
          ar: 'هل يمكن للمربيات معرفة ما إذا كانت الأسرة لم تدفع؟'
        }
      }
    ]
  },
  {
    key: 'sante',
    title: { fr: 'Santé des enfants', ar: 'صحة الأطفال' },
    icon: HeartPulse,
    questions: [
      {
        key: 'voir_infos_medicales',
        icon: HeartPulse,
        label: {
          fr: 'Les éducatrices peuvent-elles voir les informations médicales (allergies, maladies) ?',
          ar: 'هل يمكن للمربيات رؤية المعلومات الطبية (الحساسية، الأمراض)؟'
        }
      },
      {
        key: 'gerer_traitements',
        icon: Pill,
        label: {
          fr: 'Les éducatrices peuvent-elles voir et donner les médicaments prescrits aux enfants ?',
          ar: 'هل يمكن للمربيات رؤية وإعطاء الأدوية الموصوفة للأطفال؟'
        }
      },
      {
        key: 'voir_documents_enfant',
        icon: FileText,
        label: {
          fr: 'Les éducatrices peuvent-elles voir les documents administratifs de l\'enfant (certificats, dossiers) ?',
          ar: 'هل يمكن للمربيات رؤية الوثائق الإدارية للطفل (الشهادات، الملفات)؟'
        }
      }
    ]
  },
  {
    key: 'communication',
    title: { fr: 'Communication', ar: 'التواصل' },
    icon: MessageCircle,
    questions: [
      {
        key: 'messages_parents',
        icon: MessageCircle,
        label: {
          fr: 'Les éducatrices peuvent-elles envoyer et recevoir des messages avec les parents ?',
          ar: 'هل يمكن للمربيات إرسال واستقبال الرسائل مع الوالدين؟'
        }
      },
      {
        key: 'messages_direction',
        icon: MessageCircle,
        label: {
          fr: 'Les éducatrices peuvent-elles envoyer et recevoir des messages avec la direction ?',
          ar: 'هل يمكن للمربيات إرسال واستقبال الرسائل مع الإدارة؟'
        }
      },
      {
        key: 'voir_annonces',
        icon: Megaphone,
        label: {
          fr: 'Les éducatrices peuvent-elles voir les annonces officielles de la crèche ?',
          ar: 'هل يمكن للمربيات رؤية الإعلانات الرسمية للحضانة؟'
        }
      }
    ]
  },
  {
    key: 'quotidien',
    title: { fr: 'Suivi quotidien des enfants', ar: 'التتبع اليومي للأطفال' },
    icon: BookOpen,
    questions: [
      {
        key: 'gerer_presences',
        icon: Clock,
        label: {
          fr: 'Les éducatrices peuvent-elles enregistrer les arrivées et départs des enfants ?',
          ar: 'هل يمكن للمربيات تسجيل أوقات وصول ومغادرة الأطفال؟'
        }
      },
      {
        key: 'remplir_rapport_journalier',
        icon: BookOpen,
        label: {
          fr: 'Les éducatrices peuvent-elles remplir le rapport du jour (repas, sommeil, activités) ?',
          ar: 'هل يمكن للمربيات تعبئة التقرير اليومي (الأكل، النوم، الأنشطة)؟'
        }
      },
      {
        key: 'voir_photos_enfants',
        icon: Image,
        label: {
          fr: 'Les éducatrices peuvent-elles voir les photos des enfants ?',
          ar: 'هل يمكن للمربيات رؤية صور الأطفال؟'
        }
      },
      {
        key: 'publier_photos_activites',
        icon: Camera,
        label: {
          fr: 'Les éducatrices peuvent-elles publier des photos ou des activités ?',
          ar: 'هل يمكن للمربيات نشر الصور أو الأنشطة؟'
        }
      }
    ]
  },
  {
    key: 'organisation',
    title: { fr: 'Organisation du travail', ar: 'تنظيم العمل' },
    icon: ListTodo,
    questions: [
      {
        key: 'gerer_absences',
        icon: CalendarX,
        label: {
          fr: 'Les éducatrices peuvent-elles voir et traiter les demandes d\'absence des parents ?',
          ar: 'هل يمكن للمربيات رؤية ومعالجة طلبات غياب الوالدين؟'
        }
      },
      {
        key: 'gerer_rendez_vous',
        icon: CalendarCheck,
        label: {
          fr: 'Les éducatrices peuvent-elles voir et gérer les rendez-vous ?',
          ar: 'هل يمكن للمربيات رؤية وتنظيم المواعيد؟'
        }
      },
      {
        key: 'voir_planning_equipe',
        icon: Users,
        label: {
          fr: 'Les éducatrices peuvent-elles voir le planning / la répartition du personnel ?',
          ar: 'هل يمكن للمربيات رؤية الجدول الزمني / توزيع الفريق؟'
        }
      },
      {
        key: 'gerer_stock',
        icon: Boxes,
        label: {
          fr: 'Les éducatrices peuvent-elles gérer le stock de fournitures (couches, produits...) ?',
          ar: 'هل يمكن للمربيات إدارة مخزون اللوازم (الحفاضات، المنتجات...)؟'
        }
      },
      {
        key: 'gerer_taches',
        icon: ListTodo,
        label: {
          fr: 'Les éducatrices peuvent-elles voir et gérer les tâches internes de l\'équipe ?',
          ar: 'هل يمكن للمربيات رؤية وإدارة المهام الداخلية للفريق؟'
        }
      }
    ]
  }
];

// Questions générales (choix multiples, pas de simples oui/non)
const GENERAL_QUESTIONS = [
  {
    key: 'portee_acces',
    label: {
      fr: 'Une éducatrice doit-elle voir seulement les enfants de sa classe, ou tous les enfants de la crèche ?',
      ar: 'هل يجب أن ترى المربية فقط أطفال صفها، أم جميع أطفال الحضانة؟'
    },
    options: [
      { value: 'sa_classe', label: { fr: 'Seulement les enfants de sa classe', ar: 'فقط أطفال صفها' } },
      { value: 'tous', label: { fr: 'Tous les enfants de la crèche', ar: 'جميع أطفال الحضانة' } },
      { value: 'ne_sais_pas', label: { fr: 'Je ne sais pas / à discuter ensemble', ar: 'لا أعرف / للمناقشة معًا' } }
    ]
  },
  {
    key: 'meme_droits',
    label: {
      fr: 'Toutes les éducatrices doivent-elles avoir les mêmes droits, ou des droits différents selon la personne ?',
      ar: 'هل يجب أن تتمتع جميع المربيات بنفس الحقوق، أم حقوق مختلفة حسب الشخص؟'
    },
    options: [
      { value: 'memes_droits', label: { fr: 'Les mêmes droits pour toutes', ar: 'نفس الحقوق للجميع' } },
      { value: 'droits_differents', label: { fr: 'Des droits différents selon la personne', ar: 'حقوق مختلفة حسب الشخص' } },
      { value: 'ne_sais_pas', label: { fr: 'Je ne sais pas / à discuter ensemble', ar: 'لا أعرف / للمناقشة معًا' } }
    ]
  }
];

const StaffAccessQuestionnairePage = () => {
  const { isRTL, currentLanguage } = useLanguage();
  const lang = currentLanguage === 'ar' ? 'ar' : 'fr';

  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await api.get('/api/permissions-questionnaire');
        const existing = res.data?.response;
        if (existing) {
          setAnswers(existing.answers || {});
          setComment(existing.comment || '');
          setLastSavedAt(existing.updated_at);
        }
      } catch (error) {
        console.error('Erreur chargement questionnaire:', error);
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, []);

  const toggleAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.post('/api/permissions-questionnaire', { answers, comment });
      setLastSavedAt(res.data?.response?.updated_at);
      toast.success(
        lang === 'ar'
          ? 'شكراً، تم حفظ إجاباتكم بنجاح.'
          : 'Merci, vos réponses ont été enregistrées avec succès.'
      );
    } catch (error) {
      console.error('Erreur enregistrement questionnaire:', error);
      toast.error(
        lang === 'ar'
          ? 'حدث خطأ أثناء حفظ الإجابات.'
          : 'Une erreur est survenue lors de l\'enregistrement.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Introduction */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <ClipboardList className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'ar' ? 'استبيان صلاحيات المربيات' : 'Questionnaire : accès des éducatrices'}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ar'
            ? 'هذا الاستبيان بسيط ولا يتطلب أي معرفة تقنية. إجاباتكم ستساعدنا على ضبط ما يمكن للمربيات رؤيته واستخدامه في التطبيق. يمكنكم الإجابة بـ "نعم" أو "لا" لكل سؤال، ثم الحفظ. يمكنكم تعديل إجاباتكم في أي وقت.'
            : 'Ce questionnaire est simple et ne nécessite aucune connaissance en informatique. Vos réponses nous aideront à régler précisément ce que les éducatrices pourront voir et utiliser dans l\'application. Répondez par "Oui" ou "Non" à chaque question, puis enregistrez. Vous pourrez modifier vos réponses à tout moment.'}
        </p>
        {lastSavedAt && (
          <p className="text-sm text-gray-400 mt-2">
            {lang === 'ar' ? 'آخر حفظ: ' : 'Dernier enregistrement : '}
            {new Date(lastSavedAt).toLocaleString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
          </p>
        )}
      </motion.div>

      {/* Groupes de questions oui/non */}
      {QUESTION_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GroupIcon className="w-5 h-5 text-primary-600" />
                {group.title[lang]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.questions.map((q) => {
                const QIcon = q.icon;
                const checked = answers[q.key] === true;
                return (
                  <div
                    key={q.key}
                    className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <QIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-200">{q.label[lang]}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-400 w-8 text-center">
                        {checked ? (lang === 'ar' ? 'نعم' : 'Oui') : (lang === 'ar' ? 'لا' : 'Non')}
                      </span>
                      <ToggleSwitch
                        checked={checked}
                        onChange={(value) => toggleAnswer(q.key, value)}
                        size="md"
                        ariaLabel={q.label[lang]}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Questions générales à choix multiple */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary-600" />
            {lang === 'ar' ? 'أسئلة عامة' : 'Questions générales'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {GENERAL_QUESTIONS.map((q) => (
            <div key={q.key}>
              <p className="text-gray-700 dark:text-gray-200 mb-3 font-medium">{q.label[lang]}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleAnswer(q.key, opt.value)}
                    className={`flex-1 px-4 py-3 rounded-lg border text-sm transition-colors ${
                      answers[q.key] === opt.value
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {opt.label[lang]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Commentaire libre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {lang === 'ar' ? 'ملاحظات أو احتياجات أخرى' : 'Remarques ou besoins supplémentaires'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder={
              lang === 'ar'
                ? 'اكتب هنا أي ملاحظة أو احتياج لم يُذكر أعلاه...'
                : 'Écrivez ici toute remarque ou besoin non mentionné ci-dessus...'
            }
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </CardContent>
      </Card>

      {/* Bouton d'enregistrement */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {lang === 'ar' ? 'حفظ الإجابات' : 'Enregistrer mes réponses'}
        </Button>
      </div>
    </div>
  );
};

export default StaffAccessQuestionnairePage;
