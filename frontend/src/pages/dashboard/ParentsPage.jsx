import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Baby,
  Filter,
  Download,
  UserCheck,
  UserX,
  Eye,
  ChevronDown,
  BarChart3,
  RefreshCw,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import useIsMobile from '../../hooks/useIsMobile';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import userWorkflowService from '../../services/userWorkflowService';
import { TableToListAdapter } from '../../components/mobile/adapters';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import MobileHeader from '../../components/mobile/MobileHeader';

const ParentsPage = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [resendingLink, setResendingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Charger les parents depuis l'API
  useEffect(() => {
    const loadParents = async () => {
      try {
        setLoading(true);

        // Récupérer les utilisateurs avec le rôle 'parent'
        const response = await api.get('/api/users', { params: { role: 'parent', active: 'true' } });

        if (response.data.success && response.data.users) {
          // Récupérer les enfants pour chaque parent
          const parentsWithChildren = await Promise.all(
            response.data.users.map(async (user) => {
              try {
                // Récupérer les enfants associés à ce parent
                const childrenResponse = await api.get(`/api/children`, { params: { parent_id: user.id } });
                const children = childrenResponse.data.success ? childrenResponse.data.children : [];

                return {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                  phone: user.phone || '',
                  status: user.is_active ? 'active' : 'inactive',
                  password_set: user.password_set,
                  children_count: children.length,
                  registration_date: user.created_at?.split('T')[0] || '',
                  last_login: user.updated_at?.split('T')[0] || '',
                  children: children.map(c => `${c.first_name} ${c.last_name}`)
                };
              } catch (childError) {
                console.error(`Erreur chargement enfants pour parent ${user.id}:`, childError);
                return {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                  phone: user.phone || '',
                  status: user.is_active ? 'active' : 'inactive',
                  password_set: user.password_set,
                  children_count: 0,
                  registration_date: user.created_at?.split('T')[0] || '',
                  last_login: user.updated_at?.split('T')[0] || '',
                  children: []
                };
              }
            })
          );

          setParents(parentsWithChildren);
        } else {
          setParents([]);
        }
      } catch (error) {
        console.error('Erreur chargement parents:', error);
        dialog.error(isRTL ? 'خطأ في تحميل الأولياء' : 'Erreur lors du chargement des parents');
        setParents([]);
      } finally {
        setLoading(false);
      }
    };

    loadParents();
  }, [isRTL]);

  const filteredParents = parents.filter(parent => {
    const matchesSearch =
      parent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || parent.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (parent) => {
    setSelectedParent(parent);
    setShowDetails(true);
    setGeneratedLink(null);
    setLinkCopied(false);
  };

  const handleStatusToggle = (parentId) => {
    setParents(prev => prev.map(parent =>
      parent.id === parentId
        ? { ...parent, status: parent.status === 'active' ? 'inactive' : 'active' }
        : parent
    ));
    dialog.success(isRTL ? 'تم تحديث حالة الولي' : 'Statut du parent mis à jour');
  };

  const handleDelete = async (parentId) => {
    const confirmed = await dialog.confirm(
      isRTL ? 'هل أنت متأكد من حذف هذا الولي؟' : 'Êtes-vous sûr de vouloir supprimer ce parent ?',
      isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression',
      { type: 'danger', confirmText: isRTL ? 'حذف' : 'Supprimer', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );

    if (!confirmed) return;

    try {
      // Appel API réel pour supprimer le parent
      await api.delete(`/api/users/${parentId}`);
      setParents(prev => prev.filter(parent => parent.id !== parentId));
      dialog.success(isRTL ? 'تم حذف الولي بنجاح' : 'Parent supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      dialog.error(isRTL ? 'خطأ في الحذف' : 'Erreur lors de la suppression');
    }
  };

  const exportParents = () => {
    // Simulation d'export CSV
    const csvContent = "data:text/csv;charset=utf-8," +
      "Nom,Email,Téléphone,Enfants,Statut\n" +
      filteredParents.map(parent =>
        `${parent.first_name} ${parent.last_name},${parent.email},${parent.phone},${parent.children_count},${parent.status}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "parents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    dialog.success(isRTL ? 'تم تصدير قائمة الأولياء' : 'Liste des parents exportée');
  };

  // Renvoyer le lien de création de mot de passe
  const handleResendPasswordLink = async (parentId) => {
    try {
      setResendingLink(true);
      setGeneratedLink(null);
      setLinkCopied(false);

      const result = await userWorkflowService.resendPasswordLink(parentId);

      if (result.success) {
        setGeneratedLink(result.passwordLink);
        dialog.success(isRTL ? 'تم إرسال رابط جديد بنجاح' : 'Nouveau lien envoyé avec succès');
      } else {
        dialog.error(result.error || (isRTL ? 'خطأ في إرسال الرابط' : 'Erreur lors de l\'envoi du lien'));
      }
    } catch (error) {
      console.error('Erreur renvoi lien:', error);
      const errorMessage = error.error || error.message || (isRTL ? 'خطأ في إرسال الرابط' : 'Erreur lors de l\'envoi du lien');
      dialog.error(errorMessage);
    } finally {
      setResendingLink(false);
    }
  };

  // Copier le lien dans le presse-papier
  const handleCopyLink = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setLinkCopied(true);
        dialog.success(isRTL ? 'تم نسخ الرابط' : 'Lien copié dans le presse-papier');
        setTimeout(() => setLinkCopied(false), 3000);
      } catch (error) {
        console.error('Erreur copie:', error);
        dialog.error(isRTL ? 'خطأ في النسخ' : 'Erreur lors de la copie');
      }
    }
  };

  // Colonnes pour TableToListAdapter
  const mobileColumns = [
    { key: 'full_name', label: isRTL ? 'الاسم' : 'Nom', isPrimary: true },
    { key: 'email', label: isRTL ? 'البريد' : 'Email', isSecondary: true },
    {
      key: 'status_label', label: isRTL ? 'الحالة' : 'Statut', isBadge: true, badgeColors: {
        'Actif': 'green',
        'نشط': 'green',
        'Inactif': 'red',
        'غير نشط': 'red'
      }
    },
    { key: 'children_count', label: isRTL ? 'الأطفال' : 'Enfants' }
  ];

  // Préparer les données pour mobile
  const mobileParents = filteredParents.map(p => ({
    ...p,
    full_name: `${p.first_name} ${p.last_name}`,
    status_label: p.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')
  }));

  // Version Mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader
          title={isRTL ? 'الأولياء' : 'Parents'}
          subtitle={`${filteredParents.length} ${isRTL ? 'ولي' : 'parent(s)'}`}
          showSearch={true}
          onSearch={setSearchTerm}
          searchPlaceholder={isRTL ? 'بحث...' : 'Rechercher...'}
        />

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <TableToListAdapter
              columns={mobileColumns}
              rows={mobileParents}
              onRowClick={(row) => {
                setSelectedParent(row);
                setShowDetails(true);
              }}
              emptyMessage={isRTL ? 'لا يوجد أولياء' : 'Aucun parent'}
              emptyIcon={Users}
            />
          )}
        </div>

        <MobileNavigation />
      </div>
    );
  }

  // Version Desktop
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'إدارة الأولياء' : 'Gestion des Parents'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL ? 'إدارة حسابات أولياء الأمور ومعلوماتهم' : 'Gérer les comptes et informations des parents'}
          </p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse mt-4 sm:mt-0">
          <Button
            onClick={exportParents}
            variant="outline"
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تصدير' : 'Exporter'}
          </Button>
          {isAdmin() && (
            <Button className="flex items-center bg-primary-500 hover:bg-primary-600">
              <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'إضافة ولي' : 'Ajouter Parent'}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Statistiques - Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'إجمالي الأولياء' : 'Total Parents'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {parents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'نشط' : 'Actifs'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {parents.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'غير نشط' : 'Inactifs'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {parents.filter(p => p.status === 'inactive').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Baby className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'إجمالي الأطفال' : 'Total Enfants'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {parents.reduce((sum, p) => sum + p.children_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistiques - Mobile Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="md:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        layout
      >
        <div
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'الإحصائيات' : 'Statistiques'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {parents.length} {isRTL ? 'ولي' : 'parents'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: statsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </div>

        <AnimatePresence>
          {statsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-700">
                {/* Total Parents */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'إجمالي الأولياء' : 'Total Parents'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {parents.length}
                  </span>
                </div>

                {/* Actifs */}
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'نشط' : 'Actifs'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {parents.filter(p => p.status === 'active').length}
                  </span>
                </div>

                {/* Inactifs */}
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'غير نشط' : 'Inactifs'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {parents.filter(p => p.status === 'inactive').length}
                  </span>
                </div>

                {/* Total Enfants */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'إجمالي الأطفال' : 'Total Enfants'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {parents.reduce((sum, p) => sum + p.children_count, 0)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={isRTL ? 'البحث عن ولي...' : 'Rechercher un parent...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
                  <option value="active">{isRTL ? 'نشط' : 'Actif'}</option>
                  <option value="inactive">{isRTL ? 'غير نشط' : 'Inactif'}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Liste des parents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'قائمة الأولياء' : 'Liste des Parents'}
              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm font-normal text-gray-500">
                ({filteredParents.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop: Tableau classique */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'الاسم' : 'Nom'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'الهاتف' : 'Téléphone'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'الأطفال' : 'Enfants'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParents.map((parent) => (
                    <tr key={parent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {parent.first_name} {parent.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {isRTL ? 'مسجل منذ' : 'Inscrit le'} {new Date(parent.registration_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {parent.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-300" dir="ltr">
                          <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {parent.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-blue-500" />
                          <span className="font-medium">{parent.children_count}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${parent.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {parent.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(parent)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin() && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusToggle(parent.id)}
                              >
                                {parent.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(parent.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Smartphone: Liste cliquable simple */}
            <div className="md:hidden space-y-2">
              {filteredParents.map((parent) => (
                <div
                  key={parent.id}
                  onClick={() => handleViewDetails(parent)}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                        {parent.first_name} {parent.last_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Baby className="w-3.5 h-3.5 mr-1" />
                          {parent.children_count} {isRTL ? 'طفل' : 'enfant(s)'}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${parent.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {parent.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
                        </span>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            {/* Tablette: Liste avec 2 colonnes (Nom + Actions) */}
            <div className="hidden md:block lg:hidden">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white text-right rtl:text-left">
                    {isRTL ? 'الإجراءات' : 'Actions'}
                  </div>
                </div>

                {/* Rows */}
                {filteredParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="px-4 py-3 grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      onClick={() => handleViewDetails(parent)}
                      className="cursor-pointer"
                    >
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {parent.first_name} {parent.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Baby className="w-3 h-3 mr-1" />
                          {parent.children_count}
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${parent.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {parent.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(parent)}
                        className="h-8 px-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {isAdmin() && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusToggle(parent.id)}
                            className="h-8 px-2"
                          >
                            {parent.status === 'active' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(parent.id)}
                            className="h-8 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal détails parent */}
      {showDetails && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'تفاصيل الولي' : 'Détails du Parent'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedParent.first_name} {selectedParent.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <p className="text-gray-900 dark:text-white">{selectedParent.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <p className="text-gray-900 dark:text-white" dir="ltr">{selectedParent.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'الأطفال' : 'Enfants'}
                </label>
                <ul className="text-gray-900 dark:text-white">
                  {selectedParent.children.map((child, index) => (
                    <li key={index} className="flex items-center">
                      <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-blue-500" />
                      {child}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'آخر تسجيل دخول' : 'Dernière connexion'}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedParent.last_login).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                {isRTL ? 'الإجراءات' : 'Actions'}
              </label>
              <div className="flex flex-col gap-2">

                {isAdmin() && (
                  <>
                    {/* Bouton Renvoyer le lien - visible si mot de passe non défini */}
                    {!selectedParent.password_set && (
                      <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            {isRTL ? 'كلمة المرور غير محددة' : 'Mot de passe non défini'}
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                          {isRTL
                            ? 'هذا الولي لم يحدد كلمة المرور بعد. يمكنك إعادة إرسال رابط الإنشاء.'
                            : 'Ce parent n\'a pas encore défini son mot de passe. Vous pouvez renvoyer le lien de création.'}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendPasswordLink(selectedParent.id)}
                          disabled={resendingLink}
                          className="w-full justify-center bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 border-amber-300 dark:border-amber-600"
                        >
                          {resendingLink ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                              {isRTL ? 'جاري الإرسال...' : 'Envoi en cours...'}
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              {isRTL ? 'إعادة إرسال رابط كلمة المرور' : 'Renvoyer le lien de mot de passe'}
                            </>
                          )}
                        </Button>

                        {/* Afficher le lien généré avec option de copie */}
                        {generatedLink && (
                          <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {isRTL ? 'الرابط المُنشأ (صالح لمدة 7 أيام):' : 'Lien généré (valide 7 jours) :'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={generatedLink}
                                readOnly
                                className="flex-1 text-xs p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded truncate"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopyLink}
                                className="shrink-0"
                              >
                                {linkCopied ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleStatusToggle(selectedParent.id);
                        setShowDetails(false);
                      }}
                      className="w-full justify-start"
                    >
                      {selectedParent.status === 'active' ? (
                        <>
                          <UserX className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {isRTL ? 'تعطيل' : 'Désactiver'}
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {isRTL ? 'تفعيل' : 'Activer'}
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        handleDelete(selectedParent.id);
                        setShowDetails(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Trash2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {isRTL ? 'حذف' : 'Supprimer'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
              >
                {isRTL ? 'إغلاق' : 'Fermer'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ParentsPage;
