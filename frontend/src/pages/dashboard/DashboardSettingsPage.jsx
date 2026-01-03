import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Globe,
  Bell,
  Shield,
  Clock,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Palette,
  Moon,
  Sun,
  Languages,
  Database,
  Archive,
  Download,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Camera,
  Upload,
  Trash2,
  Image,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDialogContext } from '../../contexts/DialogContext';
import DatePicker from '../../components/ui/DatePicker';
import { convertToISO, convertFromISO } from '../../utils/dateUtils';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import HolidayPoliciesManager from '../../components/HolidayPoliciesManager';
import API_CONFIG from '../../config/api';

const DashboardSettingsPage = () => {
  const { isRTL, currentLanguage, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const dialog = useDialogContext();
  const [loading, setLoading] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [holidayFilter, setHolidayFilter] = useState('national'); // 'national', 'religious', 'school'
  const [menuType, setMenuType] = useState(() => {
    return localStorage.getItem('menuType') || 'side';
  });
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // État pour les images de visite virtuelle
  const [virtualTourImages, setVirtualTourImages] = useState({});
  const [loadingVirtualTour, setLoadingVirtualTour] = useState(false);
  const [uploadingView, setUploadingView] = useState(null);
  const [showVirtualTourSection, setShowVirtualTourSection] = useState(false); // État initial fermé

  // Liste des vues de la visite virtuelle
  const virtualTourViews = [
    { id: 'entrance', name: isRTL ? 'المدخل الرئيسي' : 'Hall d\'entrée', icon: '🚪' },
    { id: 'classroom', name: isRTL ? 'قاعة التعلم' : 'Salle de classe', icon: '📚' },
    { id: 'playground', name: isRTL ? 'منطقة اللعب' : 'Aire de jeux', icon: '🎠' },
    { id: 'dining', name: isRTL ? 'قاعة الطعام' : 'Salle à manger', icon: '🍽️' },
    { id: 'nap', name: isRTL ? 'غرفة النوم' : 'Salle de sieste', icon: '😴' },
    { id: 'garden', name: isRTL ? 'الحديقة' : 'Jardin', icon: '🌳' }
  ];

  const [settings, setSettings] = useState({
    // Informations générales
    nurseryName: '',
    address: '',
    phone: '',
    email: '',
    capacity: 0,
    openingTime: '',
    closingTime: '',

    // Horaires samedi
    saturdayOpen: false,
    saturdayOpeningTime: '08:00',
    saturdayClosingTime: '14:00',

    // Vacances annuelles
    annualVacationEnabled: false,
    annualVacationStartDate: '',
    annualVacationEndDate: '',

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    attendanceAlerts: true,
    enrollmentAlerts: true,

    // Sécurité
    sessionTimeout: 30,
    passwordExpiry: 90,
    twoFactorAuth: false,

    // Système
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365
  });

  // Charger les paramètres depuis la base de données (table nursery_settings)
  useEffect(() => {
    const fetchSettings = async () => {
      console.log('🔄 NOUVELLE FONCTION - Chargement des paramètres...');

      try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token présent:', !!token);

        const response = await api.get('/api/nursery-settings');
        const data = response.data;

        console.log('📡 Réponse API:', 200);
        console.log('📋 DONNÉES BRUTES REÇUES:', JSON.stringify(data, null, 2));
        console.log('🔍 STRUCTURE DATA:', {
          hasSuccess: 'success' in data,
          hasSettings: 'settings' in data,
          dataKeys: Object.keys(data),
          settingsKeys: data.settings ? Object.keys(data.settings) : 'N/A'
        });

        // Vérifier la structure des données
        if (data.success && data.settings) {
          console.log('✅ Structure détectée: {success, settings}');

          // Extraire les valeurs importantes pour debugging
          const { settings: apiSettings } = data;
          console.log('🏢 nursery_name:', apiSettings.nursery_name);
          console.log('📍 address:', apiSettings.address);
          console.log('📞 phone:', apiSettings.phone);
          console.log('📧 email:', apiSettings.email);
          console.log('👥 capacity:', apiSettings.capacity);
          console.log('🕐 working_hours_weekdays:', apiSettings.working_hours_weekdays);
          console.log('📅 saturday_open:', apiSettings.saturday_open);
          console.log('🕐 working_hours_saturday:', apiSettings.working_hours_saturday);

          console.log('🔍 VALEURS EXTRAITES:');
          console.log('  - nurseryName:', apiSettings.nursery_name);
          console.log('  - capacity:', apiSettings.capacity);
          console.log('  - saturday_open:', apiSettings.saturday_open);
          console.log('  - working_hours_saturday:', apiSettings.working_hours_saturday);

          // Transformer les données pour l'état local (clés unifiées)
          const transformedSettings = {
            nurseryName: apiSettings.nursery_name || 'Crèche Mima Elghalia',
            address: apiSettings.address || '16 Rue Bizerte, Medenine 4100, Tunisie',
            phone: apiSettings.phone || '+216 25 95 35 32',
            email: apiSettings.email || 'contact@mimaelghalia.tn',
            capacity: parseInt(apiSettings.max_capacity?.toString().replace(/\D/g, '')) || 30,
            openingTime: apiSettings.opening_time || '07:00',
            closingTime: apiSettings.closing_time || '18:00',
            saturdayOpen: apiSettings.saturday_open === 'true' || apiSettings.saturday_open === true,
            saturdayOpeningTime: apiSettings.saturday_opening_time || '08:00',
            saturdayClosingTime: apiSettings.saturday_closing_time || '12:00'
          };

          console.log('🎯 PARAMÈTRES FINAUX:', transformedSettings);
          setSettings(transformedSettings);

          // Charger les vacances annuelles séparément
          try {
            const vacationResponse = await api.get('/api/nursery-settings/annual-vacation');
            if (vacationResponse.data.success) {
              console.log('📅 Vacances annuelles chargées:', vacationResponse.data);
              setSettings(prev => ({
                ...prev,
                annualVacationEnabled: vacationResponse.data.enabled || false,
                annualVacationStartDate: convertFromISO(vacationResponse.data.start_date) || '',
                annualVacationEndDate: convertFromISO(vacationResponse.data.end_date) || ''
              }));
            }
          } catch (vacationError) {
            console.log('⚠️ Pas de vacances annuelles configurées');
          }

          setLoading(false);

        } else {
          console.error('❌ Structure de données non reconnue:', data);
          setError('Format de données non reconnu');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        setError('Erreur de connexion au serveur');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Charger la liste du staff avec leurs affectations
  useEffect(() => {
    const fetchStaffAssignments = async () => {
      if (user?.role !== 'admin') return;

      try {
        setLoadingStaff(true);
        const response = await api.get('/api/staff-assignments');
        if (response.data.success) {
          setStaffList(response.data.staff || []);
        }
      } catch (error) {
        console.error('Erreur chargement staff:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffAssignments();
  }, [user?.role]);

  // Charger les images de visite virtuelle
  useEffect(() => {
    const fetchVirtualTourImages = async () => {
      if (user?.role !== 'admin') return;

      try {
        setLoadingVirtualTour(true);
        const response = await api.get('/api/virtual-tour/images');
        if (response.data.success) {
          setVirtualTourImages(response.data.images || {});
        }
      } catch (error) {
        console.error('Erreur chargement images visite virtuelle:', error);
      } finally {
        setLoadingVirtualTour(false);
      }
    };

    fetchVirtualTourImages();
  }, [user?.role]);

  // Upload d'une image de visite virtuelle
  const handleVirtualTourUpload = async (viewId, file) => {
    if (!file) return;

    try {
      setUploadingView(viewId);

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/api/virtual-tour/images/${viewId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Mettre à jour l'état local avec la nouvelle image
        setVirtualTourImages(prev => ({
          ...prev,
          [viewId]: response.data.image
        }));
        dialog.showToast(
          isRTL ? 'تم تحميل الصورة بنجاح' : 'Image uploadée avec succès',
          'success'
        );
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      dialog.showToast(
        isRTL ? 'خطأ في تحميل الصورة' : 'Erreur lors de l\'upload',
        'error'
      );
    } finally {
      setUploadingView(null);
    }
  };

  // Supprimer une image de visite virtuelle
  const handleVirtualTourDelete = async (viewId) => {
    try {
      const confirmed = await dialog.showConfirm(
        isRTL ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Êtes-vous sûr de vouloir supprimer cette image ?',
        isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression'
      );

      if (!confirmed) return;

      setUploadingView(viewId);

      const response = await api.delete(`/api/virtual-tour/images/${viewId}`);

      if (response.data.success) {
        setVirtualTourImages(prev => ({
          ...prev,
          [viewId]: null
        }));
        dialog.showToast(
          isRTL ? 'تم حذف الصورة بنجاح' : 'Image supprimée avec succès',
          'success'
        );
      }
    } catch (error) {
      console.error('Erreur suppression image:', error);
      dialog.showToast(
        isRTL ? 'خطأ في حذف الصورة' : 'Erreur lors de la suppression',
        'error'
      );
    } finally {
      setUploadingView(null);
    }
  };

  // Mettre à jour l'affectation d'un membre du staff
  const handleStaffAssignmentChange = async (staffId, ageGroup) => {
    try {
      const response = await api.put(`/api/staff-assignments/${staffId}`, { age_group: ageGroup });
      if (response.data.success) {
        setStaffList(prev => prev.map(s =>
          s.id === staffId ? { ...s, age_group: ageGroup } : s
        ));
        dialog.showToast(isRTL ? 'تم تحديث التعيين' : 'Affectation mise à jour', 'success');
      }
    } catch (error) {
      console.error('Erreur mise à jour affectation:', error);
      dialog.showToast(isRTL ? 'خطأ في التحديث' : 'Erreur de mise à jour', 'error');
    }
  };

  // Charger les jours fériés depuis l'API externe et notre base de données
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoadingHolidays(true);
        const currentYear = new Date().getFullYear();

        // 1. Charger TOUS les jours fériés (Nationaux + Religieux + Scolaires)
        let allHolidays = [];

        // Dictionnaire de traduction anglais -> français
        const holidayTranslations = {
          "New Year's Day": "Jour de l'An",
          "Independence Day": "Fête de l'Indépendance",
          "Revolution Day": "Fête de la Révolution",
          "Martyrs' Day": "Fête des Martyrs",
          "Labour Day": "Fête du Travail",
          "Republic Day": "Fête de la République",
          "Women's Day": "Fête de la Femme",
          "Evacuation Day": "Fête de l'Évacuation"
        };

        // Essayer d'abord l'API externe pour les jours nationaux
        try {
          const externalResponse = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/TN`);
          if (externalResponse.ok) {
            const externalData = await externalResponse.json();
            const nationalHolidays = externalData.map((holiday, index) => {
              // Traduire le nom si disponible
              const translatedName = holidayTranslations[holiday.name] || holiday.name;
              return {
                external_id: `ext_${index}`,
                name: isRTL ? holiday.localName || translatedName : translatedName,
                date: holiday.date,
                type: 'national',
                is_active: false
              };
            });
            allHolidays = [...nationalHolidays];
          }
        } catch (error) {
          console.log('API externe non disponible pour les jours nationaux');
        }

        // 2. Ajouter TOUJOURS les jours religieux et scolaires (indépendamment de l'API)
        const religiousAndSchoolHolidays = [
          // Jours fériés religieux islamiques en Tunisie (dates approximatives pour ${currentYear})
          { external_id: 'rel_1', name: isRTL ? 'رأس السنة الهجرية' : 'Nouvel An Hégirien (1er Muharram)', date: `${currentYear}-07-07`, type: 'religious', is_active: false },
          { external_id: 'rel_2', name: isRTL ? 'عاشوراء' : 'Achoura (10 Muharram)', date: `${currentYear}-07-16`, type: 'religious', is_active: false },
          { external_id: 'rel_3', name: isRTL ? 'المولد النبوي الشريف' : 'Mawlid (Naissance du Prophète)', date: `${currentYear}-09-15`, type: 'religious', is_active: false },
          { external_id: 'rel_4', name: isRTL ? 'ليلة الإسراء والمعراج' : 'Isra et Miraj (Voyage Nocturne)', date: `${currentYear}-01-27`, type: 'religious', is_active: false },
          { external_id: 'rel_5', name: isRTL ? 'عيد الفطر (اليوم الأول)' : 'Aïd el-Fitr (1er jour)', date: `${currentYear}-04-10`, type: 'religious', is_active: false },
          { external_id: 'rel_6', name: isRTL ? 'عيد الفطر (اليوم الثاني)' : 'Aïd el-Fitr (2e jour)', date: `${currentYear}-04-11`, type: 'religious', is_active: false },
          { external_id: 'rel_7', name: isRTL ? 'عيد الفطر (اليوم الثالث)' : 'Aïd el-Fitr (3e jour)', date: `${currentYear}-04-12`, type: 'religious', is_active: false },
          { external_id: 'rel_8', name: isRTL ? 'وقفة عرفة' : 'Jour d\'Arafat', date: `${currentYear}-06-15`, type: 'religious', is_active: false },
          { external_id: 'rel_9', name: isRTL ? 'عيد الأضحى (اليوم الأول)' : 'Aïd el-Adha (1er jour)', date: `${currentYear}-06-16`, type: 'religious', is_active: false },
          { external_id: 'rel_10', name: isRTL ? 'عيد الأضحى (اليوم الثاني)' : 'Aïd el-Adha (2e jour)', date: `${currentYear}-06-17`, type: 'religious', is_active: false },
          { external_id: 'rel_11', name: isRTL ? 'عيد الأضحى (اليوم الثالث)' : 'Aïd el-Adha (3e jour)', date: `${currentYear}-06-18`, type: 'religious', is_active: false },
          { external_id: 'rel_12', name: isRTL ? 'عيد الأضحى (اليوم الرابع)' : 'Aïd el-Adha (4e jour)', date: `${currentYear}-06-19`, type: 'religious', is_active: false },

          // Vacances scolaires tunisiennes (année scolaire ${currentYear}-${currentYear + 1})
          { external_id: 'sch_1', name: isRTL ? 'عطلة الخريف (بداية)' : 'Vacances d\'Automne (Début)', date: `${currentYear}-10-28`, type: 'school', is_active: false },
          { external_id: 'sch_2', name: isRTL ? 'عطلة الخريف (نهاية)' : 'Vacances d\'Automne (Fin)', date: `${currentYear}-11-05`, type: 'school', is_active: false },
          { external_id: 'sch_3', name: isRTL ? 'عطلة الشتاء (بداية)' : 'Vacances d\'Hiver (Début)', date: `${currentYear}-12-23`, type: 'school', is_active: false },
          { external_id: 'sch_4', name: isRTL ? 'عطلة الشتاء (نهاية)' : 'Vacances d\'Hiver (Fin)', date: `${currentYear + 1}-01-08`, type: 'school', is_active: false },
          { external_id: 'sch_5', name: isRTL ? 'عطلة الربيع (بداية)' : 'Vacances de Printemps (Début)', date: `${currentYear}-03-25`, type: 'school', is_active: false },
          { external_id: 'sch_6', name: isRTL ? 'عطلة الربيع (نهاية)' : 'Vacances de Printemps (Fin)', date: `${currentYear}-04-08`, type: 'school', is_active: false },
          { external_id: 'sch_7', name: isRTL ? 'عطلة الصيف (بداية)' : 'Vacances d\'Été (Début)', date: `${currentYear}-06-15`, type: 'school', is_active: false },
          { external_id: 'sch_8', name: isRTL ? 'عطلة الصيف (نهاية)' : 'Vacances d\'Été (Fin)', date: `${currentYear}-09-15`, type: 'school', is_active: false }
        ];

        // Ajouter les jours religieux et scolaires à la liste
        allHolidays = [...allHolidays, ...religiousAndSchoolHolidays];

        // 3. Fallback pour les jours nationaux si API externe non disponible
        if (allHolidays.filter(h => h.type === 'national').length === 0) {
          const nationalFallback = [
            // Jours fériés nationaux
            { external_id: 'nat_1', name: isRTL ? 'رأس السنة الميلادية' : 'Jour de l\'An', date: `${currentYear}-01-01`, type: 'national', is_active: false },
            { external_id: 'nat_2', name: isRTL ? 'عيد الثورة والشباب' : 'Fête de la Révolution et de la Jeunesse', date: `${currentYear}-01-14`, type: 'national', is_active: false },
            { external_id: 'nat_3', name: isRTL ? 'عيد الاستقلال' : 'Fête de l\'Indépendance', date: `${currentYear}-03-20`, type: 'national', is_active: false },
            { external_id: 'nat_4', name: isRTL ? 'عيد الشهداء' : 'Fête des Martyrs', date: `${currentYear}-04-09`, type: 'national', is_active: false },
            { external_id: 'nat_5', name: isRTL ? 'عيد العمال' : 'Fête du Travail', date: `${currentYear}-05-01`, type: 'national', is_active: false },
            { external_id: 'nat_6', name: isRTL ? 'عيد الجمهورية' : 'Fête de la République', date: `${currentYear}-07-25`, type: 'national', is_active: false },
            { external_id: 'nat_7', name: isRTL ? 'عيد المرأة' : 'Fête de la Femme', date: `${currentYear}-08-13`, type: 'national', is_active: false },
            { external_id: 'nat_8', name: isRTL ? 'عيد الجلاء' : 'Fête de l\'Évacuation', date: `${currentYear}-10-15`, type: 'national', is_active: false }
          ];

          // Ajouter le fallback national à la liste
          allHolidays = [...nationalFallback, ...religiousAndSchoolHolidays];
        }

        // 4. Charger les jours fériés activés depuis notre base de données
        const token = localStorage.getItem('token');
        let activeHolidays = [];
        try {
          console.log('🔄 Chargement des jours fériés depuis la base de données...');
          const dbResponse = await api.get('/api/holidays');

          console.log('📡 Réponse DB holidays:', dbResponse.status);
          console.log('📊 Données DB reçues:', dbResponse.data);

          if (dbResponse.data.success) {
            activeHolidays = dbResponse.data.holidays;
            console.log('✅ Jours fériés en base de données:', activeHolidays.length);
            console.log('📋 Liste des jours fériés DB:', activeHolidays.map(h => ({
              id: h.id,
              name: h.name,
              date: h.date?.split('T')[0],
              is_closed: h.is_closed
            })));
          } else {
            console.log('❌ Erreur réponse DB:', dbResponse.data);
          }
        } catch (error) {
          console.log('❌ Erreur chargement base de données:', error);
        }

        // 5. Marquer les jours fériés comme actifs s'ils sont dans la base de données
        console.log('🔄 Début de la correspondance holidays...');

        const mergedHolidays = allHolidays.map(holiday => {
          // Rechercher par plusieurs critères pour une correspondance flexible
          let activeHoliday = activeHolidays.find(ah => {
            const dbDate = ah.date.split('T')[0]; // Format YYYY-MM-DD depuis la DB
            const holidayDate = holiday.date; // Format YYYY-MM-DD depuis la liste

            // Normaliser les noms pour la comparaison
            const normalizeString = (str) => str.toLowerCase().trim()
              .replace(/[àáâãäå]/g, 'a')
              .replace(/[èéêë]/g, 'e')
              .replace(/[ìíîï]/g, 'i')
              .replace(/[òóôõö]/g, 'o')
              .replace(/[ùúûü]/g, 'u')
              .replace(/[ç]/g, 'c')
              .replace(/['']/g, "'")
              .replace(/\s+/g, ' ');

            const dbName = normalizeString(ah.name);
            const holidayName = normalizeString(holiday.name);

            // Critères de correspondance (par ordre de priorité)
            const exactMatch = dbName === holidayName && dbDate === holidayDate;
            const nameMatch = dbName === holidayName;
            const dateMatch = dbDate === holidayDate;

            // Correspondance exacte prioritaire
            if (exactMatch) return true;

            // Correspondance par nom avec tolérance de date (7 jours)
            if (nameMatch) {
              const dateDiff = Math.abs(new Date(dbDate) - new Date(holidayDate));
              const daysDiff = dateDiff / (24 * 60 * 60 * 1000);
              return daysDiff <= 7;
            }

            return false;
          });

          // Si pas trouvé par nom, chercher par date exacte (pour les jours ajoutés manuellement)
          if (!activeHoliday) {
            activeHoliday = activeHolidays.find(ah => {
              const dbDate = ah.date.split('T')[0];
              const holidayDate = holiday.date;
              return dbDate === holidayDate;
            });

            if (activeHoliday) {
              console.log(`📅 Correspondance par DATE trouvée: ${holiday.name} = ${activeHoliday.name}`);
            }
          }

          console.log(`🔍 Résultat final ${holiday.name} (${holiday.date}):`, {
            found: !!activeHoliday,
            dbId: activeHoliday?.id,
            dbName: activeHoliday?.name,
            dbDate: activeHoliday?.date?.split('T')[0]
          });

          return {
            ...holiday,
            id: activeHoliday ? activeHoliday.id : null,
            is_active: !!activeHoliday,
            is_closed: activeHoliday ? activeHoliday.is_closed : true
          };
        });

        console.log('📋 Jours fériés chargés:', mergedHolidays.length);
        console.log('🏛️ Nationaux:', mergedHolidays.filter(h => h.type === 'national').length);
        console.log('🕌 Religieux:', mergedHolidays.filter(h => h.type === 'religious').length);
        console.log('🏫 Scolaires:', mergedHolidays.filter(h => h.type === 'school').length);
        // 6. Ajouter les jours fériés de la DB qui ne sont pas dans notre liste prédéfinie
        const unmatchedDbHolidays = activeHolidays.filter(ah => {
          return !mergedHolidays.some(mh => mh.id === ah.id);
        });

        console.log('🆕 Jours fériés en DB non trouvés dans la liste:', unmatchedDbHolidays.length);

        const additionalHolidays = unmatchedDbHolidays.map(ah => ({
          id: ah.id,
          external_id: `db_${ah.id}`,
          name: ah.name,
          date: ah.date.split('T')[0],
          type: 'custom', // Type spécial pour les jours ajoutés manuellement
          is_active: true,
          is_closed: ah.is_closed,
          description: ah.description || 'Jour férié personnalisé'
        }));

        const finalHolidays = [...mergedHolidays, ...additionalHolidays];

        console.log('📋 Jours fériés chargés TOTAL:', finalHolidays.length);
        console.log('🏛️ Nationaux:', finalHolidays.filter(h => h.type === 'national').length);
        console.log('🕌 Religieux:', finalHolidays.filter(h => h.type === 'religious').length);
        console.log('🏫 Scolaires:', finalHolidays.filter(h => h.type === 'school').length);
        console.log('🎯 Personnalisés:', finalHolidays.filter(h => h.type === 'custom').length);
        console.log('✅ Jours fériés ACTIFS (toggles ON):', finalHolidays.filter(h => h.is_active).length);
        console.log('⚪ Jours fériés INACTIFS (toggles OFF):', finalHolidays.filter(h => !h.is_active).length);

        setHolidays(finalHolidays);
      } catch (error) {
        console.error('Erreur lors du chargement des jours fériés:', error);

        // Fallback avec les vrais jours fériés tunisiens pour l'année courante
        const currentYear = new Date().getFullYear();
        const fallbackHolidays = [
          { id: 1, name: isRTL ? 'رأس السنة الميلادية' : 'Jour de l\'An', date: `${currentYear}-01-01`, type: 'national' },
          { id: 2, name: isRTL ? 'عيد الثورة والشباب' : 'Fête de la Révolution et de la Jeunesse', date: `${currentYear}-01-14`, type: 'national' },
          { id: 3, name: isRTL ? 'عيد الاستقلال' : 'Fête de l\'Indépendance', date: `${currentYear}-03-20`, type: 'national' },
          { id: 4, name: isRTL ? 'عيد الشهداء' : 'Fête des Martyrs', date: `${currentYear}-04-09`, type: 'national' },
          { id: 5, name: isRTL ? 'عيد العمال' : 'Fête du Travail', date: `${currentYear}-05-01`, type: 'national' },
          { id: 6, name: isRTL ? 'عيد الجمهورية' : 'Fête de la République', date: `${currentYear}-07-25`, type: 'national' },
          { id: 7, name: isRTL ? 'عيد المرأة' : 'Fête de la Femme', date: `${currentYear}-08-13`, type: 'national' },
          { id: 8, name: isRTL ? 'عيد الجلاء' : 'Fête de l\'Évacuation', date: `${currentYear}-10-15`, type: 'national' },
          { id: 9, name: isRTL ? 'عيد الفطر' : 'Aïd el-Fitr', date: `${currentYear}-04-10`, type: 'religious' },
          { id: 10, name: isRTL ? 'عيد الأضحى' : 'Aïd el-Adha', date: `${currentYear}-06-16`, type: 'religious' },
          { id: 11, name: isRTL ? 'رأس السنة الهجرية' : 'Nouvel An Hégirien', date: `${currentYear}-07-07`, type: 'religious' },
          { id: 12, name: isRTL ? 'المولد النبوي' : 'Mawlid (Naissance du Prophète)', date: `${currentYear}-09-16`, type: 'religious' }
        ];

        // Ajouter les vacances scolaires au fallback aussi
        const schoolHolidaysFallback = [
          { id: 200, name: isRTL ? 'عطلة الخريف (بداية)' : 'Vacances d\'Automne (Début)', date: `${currentYear}-10-28`, type: 'school' },
          { id: 201, name: isRTL ? 'عطلة الخريف (نهاية)' : 'Vacances d\'Automne (Fin)', date: `${currentYear}-11-05`, type: 'school' },
          { id: 202, name: isRTL ? 'عطلة الشتاء (بداية)' : 'Vacances d\'Hiver (Début)', date: `${currentYear}-12-23`, type: 'school' },
          { id: 203, name: isRTL ? 'عطلة الشتاء (نهاية)' : 'Vacances d\'Hiver (Fin)', date: `${currentYear + 1}-01-08`, type: 'school' },
          { id: 204, name: isRTL ? 'عطلة الربيع (بداية)' : 'Vacances de Printemps (Début)', date: `${currentYear}-03-25`, type: 'school' },
          { id: 205, name: isRTL ? 'عطلة الربيع (نهاية)' : 'Vacances de Printemps (Fin)', date: `${currentYear}-04-08`, type: 'school' },
          { id: 206, name: isRTL ? 'عطلة الصيف (بداية)' : 'Vacances d\'Été (Début)', date: `${currentYear}-06-15`, type: 'school' },
          { id: 207, name: isRTL ? 'عطلة الصيف (نهاية)' : 'Vacances d\'Été (Fin)', date: `${currentYear}-09-15`, type: 'school' }
        ];

        setHolidays([...fallbackHolidays, ...schoolHolidaysFallback]);
      } finally {
        setLoadingHolidays(false);
      }
    };

    fetchHolidays();
  }, [isRTL]);



  // Activer/désactiver un jour férié (insertion/suppression dans la base)
  const toggleHolidayStatus = async (holiday, isActive) => {
    try {
      console.log('🔄 Toggle holiday:', { holiday, isActive });
      console.log('👤 Utilisateur actuel:', {
        role: user?.role,
        email: user?.email,
        id: user?.id,
        fullUser: user
      });

      const token = localStorage.getItem('token');
      console.log('🔑 Token présent:', !!token);
      console.log('🔑 Token (premiers caractères):', token?.substring(0, 20) + '...');

      // Décoder le token JWT pour vérifier son contenu
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 Payload du token:', payload);
            console.log('⏰ Token expire à:', new Date(payload.exp * 1000));
            console.log('⏰ Maintenant:', new Date());
            console.log('✅ Token valide:', payload.exp * 1000 > Date.now());
          }
        } catch (e) {
          console.log('❌ Erreur décodage token:', e);
        }
      }

      if (!token) {
        dialog.error(isRTL ? 'خطأ في المصادقة' : 'Erreur d\'authentification');
        return;
      }

      // Vérifier si l'utilisateur a les privilèges admin
      if (user?.role !== 'admin') {
        console.log('❌ Rôle insuffisant:', user?.role, 'attendu: admin');
        dialog.error(isRTL ? 'هذه الوظيفة متاحة للمديرين فقط' : 'Cette fonctionnalité est réservée aux administrateurs');
        return;
      }

      console.log('🔄 ========== TOGGLE JOUR FÉRIÉ ==========');
      console.log('📋 Nom:', holiday.name);
      console.log('📅 Date:', holiday.date);
      console.log('🎯 Action:', isActive ? 'ACTIVER' : 'DÉSACTIVER');
      console.log('🆔 ID actuel:', holiday.id);
      console.log('✅ is_active actuel:', holiday.is_active);
      console.log('👤 Utilisateur:', user?.email, '- Rôle:', user?.role);
      console.log('=========================================');

      console.log('✅ Vérifications passées, envoi de la requête...');

      // Test de l'endpoint API  
      const API_BASE_URL = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '192.168.1.60'
        ? 'http://localhost:3003'
        : 'https://creche-backend-prod.onrender.com';
      console.log('🌐 URL de base:', API_BASE_URL);
      console.log('📍 Endpoint cible:', `${API_BASE_URL}/api/holidays`);

      if (isActive) {
        // ACTIVATION : Vérifier d'abord si le jour férié est déjà activé
        if (holiday.id && holiday.is_active) {
          // Le jour férié est déjà activé, rien à faire
          console.log('⚠️ Jour férié déjà activé avec ID:', holiday.id);
          console.log('⏭️ Aucune action nécessaire');
          // Pas de notification pour "déjà activé" (silencieux)
          return;
        }

        // INSERTION : Ajouter le jour férié dans la base de données
        console.log('➕ INSERTION - Ajout du jour férié:', holiday.name);
        console.log('📤 Données à envoyer:', {
          name: holiday.name,
          date: holiday.date,
          is_closed: true,
          description: `Jour férié de type ${holiday.type}`
        });

        try {
          const response = await api.post('/api/holidays', {
            name: holiday.name,
            date: holiday.date,
            is_closed: true,
            description: `Jour férié de type ${holiday.type}`
          });

          console.log('📡 Réponse POST:', response.status);
          console.log('✅ Données reçues:', response.data);

          if (response.data.success) {
            setHolidays(prev => prev.map(h =>
              h.external_id === holiday.external_id
                ? { ...h, id: response.data.holiday.id, is_active: true }
                : h
            ));
            dialog.success(isRTL ? 'تم تفعيل العطلة - الحضانة ستكون مغلقة' : 'Jour férié activé');
          }
        } catch (postError) {
          if (postError.response?.status === 409) {
            console.log('⚠️ Jour férié déjà existant, récupération de l\'ID...');
            const dbResponse = await api.get('/api/holidays');
            if (dbResponse.data.success) {
              const existingHoliday = dbResponse.data.holidays.find(h => {
                const dbDate = h.date.split('T')[0];
                return dbDate === holiday.date;
              });
              if (existingHoliday) {
                console.log('✅ ID trouvé:', existingHoliday.id);
                setHolidays(prev => prev.map(h =>
                  h.external_id === holiday.external_id
                    ? { ...h, id: existingHoliday.id, is_active: true }
                    : h
                ));
                dialog.success(isRTL ? 'تم تفعيل العطلة - الحضانة ستكون مغلقة' : 'Jour férié activé');
              }
            }
          } else {
            throw postError;
          }
        }
      } else {
        // SUPPRESSION : Supprimer le jour férié de la base de données
        if (holiday.id) {
          console.log('🗑️ Suppression du jour férié ID:', holiday.id);
          const response = await api.delete(`/api/holidays/${holiday.id}`);

          console.log('📡 Réponse DELETE:', response.status);

          // Mettre à jour l'état local
          setHolidays(prev => prev.map(h =>
            h.external_id === holiday.external_id
              ? { ...h, id: null, is_active: false }
              : h
          ));

          dialog.success(isRTL ? 'تم إلغاء تفعيل العطلة - الحضانة ستكون مفتوحة' : 'Jour férié désactivé - La crèche sera ouverte');
        } else {
          console.warn('⚠️ Pas d\'ID pour supprimer le jour férié');
        }
      }
    } catch (error) {
      console.error('❌ Erreur toggle holiday:', {
        message: error.message,
        stack: error.stack,
        holiday: holiday?.name,
        isActive
      });
      dialog.error(isRTL ? 'خطأ في تحديث حالة العطلة' : `Erreur: ${error.message}`);
    }
  };

  // Fonction de test pour vérifier l'API
  const testHolidaysAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🧪 Test de l\'API holidays...');

      // Test GET
      const getResponse = await api.get('/api/holidays');
      console.log('📡 Réponse GET:', getResponse.status);

      // Test POST avec données minimales
      const postResponse = await api.post('/api/holidays', {
        name: 'Test Holiday',
        date: '2025-12-31',
        is_closed: true,
        description: 'Test'
      });

      console.log('📡 Réponse POST:', postResponse.status);
      console.log('✅ POST fonctionne:', postResponse.data);
      // Test API silencieux (pas de notification)
      console.log('✅ Test API réussi');

    } catch (error) {
      console.error('❌ Erreur test API:', error);
      dialog.error(isRTL ? 'فشل في الاتصال بـ API' : 'Échec de connexion à l\'API');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };


  const saveSettings = async () => {
    console.log('💾 Début de la sauvegarde des paramètres...');
    console.log('📝 Settings actuels:', settings);

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Utiliser les clés unifiées pour la sauvegarde
      const updateData = {
        nursery_name: settings.nurseryName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        max_capacity: settings.capacity.toString(),
        opening_time: settings.openingTime,
        closing_time: settings.closingTime,
        saturday_open: settings.saturdayOpen.toString(),
        saturday_opening_time: settings.saturdayOpeningTime,
        saturday_closing_time: settings.saturdayClosingTime
      };

      console.log('📤 Données à envoyer (API simple):', updateData);

      const response = await api.post('/api/nursery-settings/simple-update', updateData);
      const result = response.data;

      console.log('📡 Réponse sauvegarde:', 200);
      console.log('✅ Sauvegarde réussie:', result);

      // Sauvegarder les vacances annuelles séparément
      if (settings.annualVacationEnabled || settings.annualVacationStartDate || settings.annualVacationEndDate) {
        console.log('💾 Sauvegarde des vacances annuelles...');
        console.log('📋 Données vacances:', {
          enabled: settings.annualVacationEnabled,
          start_date: settings.annualVacationStartDate,
          end_date: settings.annualVacationEndDate
        });

        try {
          const vacationResponse = await api.put('/api/nursery-settings/annual-vacation', {
            enabled: settings.annualVacationEnabled,
            start_date: convertToISO(settings.annualVacationStartDate) || null,
            end_date: convertToISO(settings.annualVacationEndDate) || null
          });
          console.log('✅ Vacances annuelles sauvegardées:', vacationResponse.data);
        } catch (vacationError) {
          console.error('❌ Erreur vacances annuelles:', vacationError);
          console.error('📋 Détails:', vacationError.response?.data);
          throw new Error(`Erreur vacances: ${vacationError.response?.data?.error || vacationError.message}`);
        }
      }

      dialog.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      const errorMessage = error.message || (isRTL ? 'خطأ في حفظ الإعدادات' : 'Erreur lors de la sauvegarde');
      dialog.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      settings: settings,
      version: '2.0.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    // Export silencieux (pas de notification)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations générales */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'معلومات الحضانة' : 'Informations Crèche'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'اسم الحضانة' : 'Nom de la crèche'}
                  </label>
                  <input
                    type="text"
                    value={settings.nurseryName}
                    onChange={(e) => handleSettingChange('nurseryName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'العنوان' : 'Adresse'}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => handleSettingChange('address', e.target.value)}
                      className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'الهاتف' : 'Téléphone'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => handleSettingChange('phone', e.target.value)}
                        className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleSettingChange('email', e.target.value)}
                        className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'السعة القصوى' : 'Capacité max'}
                    </label>
                    <input
                      type="number"
                      value={settings.capacity}
                      onChange={(e) => handleSettingChange('capacity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'ساعة الافتتاح' : 'Heure ouverture'}
                    </label>
                    <input
                      type="time"
                      dir="ltr"
                      value={settings.openingTime}
                      onChange={(e) => handleSettingChange('openingTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'ساعة الإغلاق' : 'Heure fermeture'}
                    </label>
                    <input
                      type="time"
                      dir="ltr"
                      value={settings.closingTime}
                      onChange={(e) => handleSettingChange('closingTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Horaires du samedi */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    {isRTL ? 'ساعات العمل يوم السبت' : 'Horaires du Samedi'}
                  </h4>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'فتح يوم السبت' : 'Ouvert le samedi'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'تفعيل العمل يوم السبت' : 'Activer l\'ouverture le samedi'}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={settings.saturdayOpen}
                      onChange={(value) => handleSettingChange('saturdayOpen', value)}
                      ariaLabel={isRTL ? 'فتح يوم السبت' : 'Ouvert le samedi'}
                    />
                  </div>

                  {settings.saturdayOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'ساعة الافتتاح (السبت)' : 'Heure ouverture (samedi)'}
                        </label>
                        <input
                          type="time"
                          dir="ltr"
                          value={settings.saturdayOpeningTime}
                          onChange={(e) => handleSettingChange('saturdayOpeningTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'ساعة الإغلاق (السبت)' : 'Heure fermeture (samedi)'}
                        </label>
                        <input
                          type="time"
                          dir="ltr"
                          value={settings.saturdayClosingTime}
                          onChange={(e) => handleSettingChange('saturdayClosingTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vacances Annuelles */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    {isRTL ? 'العطلة السنوية' : 'Vacances Annuelles'}
                  </h4>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'تفعيل العطلة السنوية' : 'Activer les vacances annuelles'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'تحديد فترة إغلاق الحضانة' : 'Définir la période de fermeture de la crèche'}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={settings.annualVacationEnabled}
                      onChange={(value) => handleSettingChange('annualVacationEnabled', value)}
                      ariaLabel={isRTL ? 'تفعيل العطلة السنوية' : 'Activer les vacances annuelles'}
                    />
                  </div>

                  {settings.annualVacationEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DatePicker
                        label={isRTL ? 'تاريخ البداية' : 'Date de début'}
                        title={isRTL ? 'تاريخ البداية' : 'Date de début des vacances'}
                        value={settings.annualVacationStartDate || ''}
                        onChange={(value) => handleSettingChange('annualVacationStartDate', value)}
                      />
                      <DatePicker
                        label={isRTL ? 'تاريخ النهاية' : 'Date de fin'}
                        title={isRTL ? 'تاريخ النهاية' : 'Date de fin des vacances'}
                        value={settings.annualVacationEndDate || ''}
                        onChange={(value) => handleSettingChange('annualVacationEndDate', value)}
                      />
                    </div>
                  )}
                </div>

                {/* Bouton de sauvegarde */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <Button
                    onClick={saveSettings}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {loading ?
                      (isRTL ? 'جاري الحفظ...' : 'Sauvegarde...') :
                      (isRTL ? 'حفظ الإعدادات' : 'Sauvegarder les paramètres')
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Colonne droite - Préférences, Sécurité et Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Préférences Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'تفضيلات الواجهة' : 'Préférences Interface'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'المظهر المظلم' : 'Mode sombre'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تفعيل المظهر المظلم للواجهة' : 'Activer le thème sombre'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                    ariaLabel={isRTL ? 'المظهر المظلم' : 'Mode sombre'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'اللغة' : 'Langue'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تغيير لغة الواجهة' : 'Changer la langue de l\'interface'}
                    </p>
                  </div>
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                    <span className="font-medium">
                      {currentLanguage === 'fr' ? 'Français' : 'العربية'}
                    </span>
                  </button>
                </div>

                {/* Menu Latéral (Admin & Staff uniquement) */}
                {(user?.role === 'admin' || user?.role === 'staff') && (
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'القائمة الجانبية' : 'Menu Latéral'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'عرض القائمة الجانبية بدلاً من الزر العائم' : 'Afficher le menu latéral au lieu du bouton flottant'}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={menuType === 'side'}
                      onChange={() => {
                        const newType = menuType === 'side' ? 'floating' : 'side';
                        setMenuType(newType);
                        localStorage.setItem('menuType', newType);
                        console.log('✅ Préférence menu enregistrée:', newType);
                        setTimeout(() => window.location.reload(), 500);
                      }}
                      ariaLabel={isRTL ? 'القائمة الجانبية' : 'Menu Latéral'}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paramètres Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'إعدادات الإشعارات' : 'Paramètres Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'إشعارات البريد الإلكتروني' : 'Notifications Email'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تلقي الإشعارات عبر البريد الإلكتروني' : 'Recevoir les notifications par email'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={settings.emailNotifications}
                    onChange={(value) => handleSettingChange('emailNotifications', value)}
                    ariaLabel={isRTL ? 'إشعارات البريد الإلكتروني' : 'Notifications Email'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'تنبيهات الحضور' : 'Alertes Présence'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تنبيهات عند وصول أو مغادرة الأطفال' : 'Alertes lors des arrivées/départs'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={settings.attendanceAlerts}
                    onChange={(value) => handleSettingChange('attendanceAlerts', value)}
                    ariaLabel={isRTL ? 'تنبيهات الحضور' : 'Alertes Présence'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'تنبيهات التسجيل' : 'Alertes Inscription'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تنبيهات عند طلبات التسجيل الجديدة' : 'Alertes pour nouvelles inscriptions'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={settings.enrollmentAlerts}
                    onChange={(value) => handleSettingChange('enrollmentAlerts', value)}
                    ariaLabel={isRTL ? 'تنبيهات التسجيل' : 'Alertes Inscription'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Affectation Staff - Tranches d'âge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'تعيين الموظفين' : 'Affectation Staff'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {isRTL
                    ? 'حدد الفئة العمرية لكل موظف. سيرى كل موظف فقط الأطفال المعينين له.'
                    : 'Définissez la tranche d\'âge pour chaque membre du staff. Chaque staff ne verra que les enfants correspondants.'}
                </p>
                {loadingStaff ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                ) : staffList.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {isRTL ? 'لا يوجد موظفين' : 'Aucun membre du staff'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {staffList.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {staff.profile_image ? (
                            <img
                              src={staff.profile_image}
                              alt={staff.first_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <span className="text-primary-600 dark:text-primary-300 font-medium">
                                {staff.first_name?.charAt(0)}{staff.last_name?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {staff.first_name} {staff.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {staff.role === 'admin' ? (isRTL ? 'مدير' : 'Admin') : (isRTL ? 'موظف' : 'Staff')}
                            </p>
                          </div>
                        </div>
                        <select
                          value={staff.age_group || 'both'}
                          onChange={(e) => handleStaffAssignmentChange(staff.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="baby">👶 {isRTL ? 'رضع فقط' : 'Bébés uniquement'}</option>
                          <option value="child">🧒 {isRTL ? 'أطفال فقط' : 'Enfants uniquement'}</option>
                          <option value="both">👶🧒 {isRTL ? 'الكل' : 'Tous'}</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gestion des images de visite virtuelle - Admin seulement */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setShowVirtualTourSection(!showVirtualTourSection)}
              >
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                    <span className="truncate">{isRTL ? 'صور الجولة الافتراضية' : 'Images Visite Virtuelle'}</span>
                  </div>
                  {showVirtualTourSection ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </CardTitle>
              </CardHeader>
              {showVirtualTourSection && (
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {isRTL
                      ? 'قم بتحميل صور لكل منطقة في الحضانة. سيتم استبدال الصورة القديمة تلقائياً عند تحميل صورة جديدة.'
                      : 'Uploadez une image pour chaque zone de la crèche. L\'ancienne image sera automatiquement remplacée.'}
                  </p>

                  {loadingVirtualTour ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {virtualTourViews.map((view) => (
                        <div
                          key={view.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
                        >
                          {/* Aperçu de l'image */}
                          <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                            {virtualTourImages[view.id] ? (
                              <>
                                <img
                                  src={`${API_CONFIG.BASE_URL}${virtualTourImages[view.id]}`}
                                  alt={view.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a
                                    href={`${API_CONFIG.BASE_URL}${virtualTourImages[view.id]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                    title={isRTL ? 'عرض' : 'Voir'}
                                  >
                                    <Eye className="w-5 h-5 text-gray-700" />
                                  </a>
                                  <button
                                    onClick={() => handleVirtualTourDelete(view.id)}
                                    disabled={uploadingView === view.id}
                                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                                    title={isRTL ? 'حذف' : 'Supprimer'}
                                  >
                                    <Trash2 className="w-5 h-5 text-white" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <Image className="w-12 h-12 mb-2" />
                                <span className="text-sm">{isRTL ? 'لا توجد صورة' : 'Aucune image'}</span>
                              </div>
                            )}

                            {/* Indicateur de chargement */}
                            {uploadingView === view.id && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-white" />
                              </div>
                            )}
                          </div>

                          {/* Infos et bouton upload */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <span>{view.icon}</span>
                                <span className="text-sm">{view.name}</span>
                              </span>
                            </div>

                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleVirtualTourUpload(view.id, file);
                                    e.target.value = ''; // Reset input
                                  }
                                }}
                                disabled={uploadingView === view.id}
                              />
                              <div className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50">
                                <Upload className="w-4 h-4" />
                                {virtualTourImages[view.id]
                                  ? (isRTL ? 'تغيير الصورة' : 'Changer l\'image')
                                  : (isRTL ? 'تحميل صورة' : 'Uploader une image')
                                }
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 {isRTL
                        ? 'الصور المدعومة: JPG, PNG, WebP. الحجم الأقصى: 5 ميغابايت. سيتم عرض الصور في صفحة الجولة الافتراضية.'
                        : 'Formats supportés: JPG, PNG, WebP. Taille max: 5MB. Les images seront affichées sur la page Visite Virtuelle.'}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Gestion des jours fériés - sur toute la largeur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Calendar className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                <span className="truncate">{isRTL ? 'إدارة الأعياد والعطل' : 'Gestion des Jours Fériés'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user?.role === 'admin' ? (
                <HolidayPoliciesManager />
              ) : (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-yellow-800 dark:text-yellow-200 text-base">
                        {isRTL ? '⚠️ صلاحيات محدودة' : '⚠️ Accès limité'}
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                        {isRTL
                          ? 'أنت تستطيع فقط عرض قائمة الأعياد والعطل. لتعديل حالة الأعياد، يجب أن تكون مديراً للنظام.'
                          : 'Vous pouvez uniquement consulter les jours fériés. Pour les modifier, vous devez être administrateur.'
                        }
                      </p>
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mt-2">
                        {isRTL ? `👤 دورك الحالي: ${user?.role?.toUpperCase()}` : `👤 Votre rôle: ${user?.role?.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};

export default DashboardSettingsPage;
