import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Plus,
  Edit,
  Shield,
  Mail,
  Phone,
  Calendar,
  Filter,
  Download,
  Eye,
  Clock,
  Award,
  Users,
  ChevronDown,
  BarChart3,
  UserX,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import useIsMobile from '../../hooks/useIsMobile';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import { TableToListAdapter } from '../../components/mobile/adapters';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import MobileHeader from '../../components/mobile/MobileHeader';
import EditStaffModal from '../../components/modals/EditStaffModal';
import StaffPermissionsModal from '../../components/modals/StaffPermissionsModal';

const StaffPage = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [staffForPermissions, setStaffForPermissions] = useState(null);

  // Dérivé de `role` à l'affichage (défini avant filteredStaff pour éviter toute TDZ ReferenceError)
  const getDepartmentLabel = (role) =>
    role === 'admin'
      ? (isRTL ? 'الإدارة' : 'Administration')
      : (isRTL ? 'التعليم' : 'Éducation');

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: {
        label: isRTL ? 'مدير' : 'Admin',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      },
      staff: {
        label: isRTL ? 'موظف' : 'Staff',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      }
    };
    return roleConfig[role] || roleConfig.staff;
  };

  // Charger le personnel depuis l'API (actifs ET inactifs pour permettre la gestion des comptes désactivés)
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);

        const [adminResponse, staffResponse] = await Promise.all([
          api.get('/api/users', { params: { role: 'admin', active: 'all' } }),
          api.get('/api/users', { params: { role: 'staff', active: 'all' } })
        ]);

        const admins = adminResponse.data.success ? adminResponse.data.users : [];
        const staffMembers = staffResponse.data.success ? staffResponse.data.users : [];

        // Combiner et formater les données
        const allStaff = [...admins, ...staffMembers].map(user => ({
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role,
          is_active: user.is_active,
          status: user.is_active ? 'active' : 'inactive',
          hire_date: user.created_at?.split('T')[0] || '',
          last_login: user.updated_at?.split('T')[0] || '',
          gender: user.gender || '',
          staff_position: user.staff_position || '',
          experience_years: 0,
          specialization: user.staff_position || ''
        }));

        setStaff(allStaff);
      } catch (error) {
        console.error('Erreur chargement personnel:', error);
        dialog.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement');
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const filteredStaff = staff.filter(member => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !q || (
      (member.first_name || '').toLowerCase().includes(q) ||
      (member.last_name || '').toLowerCase().includes(q) ||
      (member.email || '').toLowerCase().includes(q) ||
      (member.phone || '').toLowerCase().includes(q) ||
      getDepartmentLabel(member.role).toLowerCase().includes(q)
    );

    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleViewDetails = (member) => {
    setSelectedStaff(member);
    setShowDetails(true);
  };

  const handleEditStaff = (member) => {
    setStaffToEdit(member);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (member) => {
    const newActive = member.status !== 'active';
    const confirmMsg = newActive
      ? (isRTL ? `هل أنت متأكد من إعادة تفعيل حساب ${member.first_name} ${member.last_name}؟` : `Voulez-vous réactiver le compte de ${member.first_name} ${member.last_name} ?`)
      : (isRTL ? `هل أنت متأكد من تعطيل حساب ${member.first_name} ${member.last_name}؟` : `Voulez-vous désactiver le compte de ${member.first_name} ${member.last_name} ?`);

    const confirmed = await dialog.confirm({
      title: newActive ? (isRTL ? 'تفعيل الحساب' : 'Réactiver le compte') : (isRTL ? 'تعطيل الحساب' : 'Désactiver le compte'),
      message: confirmMsg,
      confirmText: newActive ? (isRTL ? 'تفعيل' : 'Réactiver') : (isRTL ? 'تعطيل' : 'Désactiver'),
      confirmVariant: newActive ? 'primary' : 'danger'
    });

    if (!confirmed) return;

    try {
      const response = await api.put(`/api/users/${member.id}`, { is_active: newActive });
      if (response.data.success) {
        setStaff(prev => prev.map(s => s.id === member.id ? {
          ...s,
          is_active: newActive,
          status: newActive ? 'active' : 'inactive'
        } : s));

        if (selectedStaff?.id === member.id) {
          setSelectedStaff(prev => ({
            ...prev,
            is_active: newActive,
            status: newActive ? 'active' : 'inactive'
          }));
        }

        dialog.success(newActive
          ? (isRTL ? 'تم تفعيل الحساب بنجاح' : 'Compte réactivé avec succès')
          : (isRTL ? 'تم تعطيل الحساب بنجاح' : 'Compte désactivé avec succès'));
      }
    } catch (error) {
      console.error('Erreur modification statut:', error);
      dialog.error(isRTL ? 'حدث خطأ أثناء تعديل الحساب' : 'Erreur lors de la modification du statut');
    }
  };

  const handleManagePermissions = (member) => {
    setStaffForPermissions(member);
    setShowPermissionsModal(true);
  };

  const handlePermissionsModalClose = (saved) => {
    setShowPermissionsModal(false);
    if (saved) {
      dialog.success(isRTL ? 'تم تحديث الصلاحيات بنجاح' : 'Accès mis à jour avec succès');
    }
    setStaffForPermissions(null);
  };

  const handleEditSuccess = (updatedStaff) => {
    setStaff(prev => prev.map(s =>
      s.id === updatedStaff.id ? {
        ...s,
        ...updatedStaff,
        status: updatedStaff.is_active ? 'active' : 'inactive'
      } : s
    ));
    if (selectedStaff?.id === updatedStaff.id) {
      setSelectedStaff(prev => ({
        ...prev,
        ...updatedStaff,
        status: updatedStaff.is_active ? 'active' : 'inactive'
      }));
    }
    dialog.success(isRTL ? 'تم تحديث معلومات الموظف بنجاح' : 'Informations mises à jour avec succès');
  };

  const exportStaff = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Nom,Email,Téléphone,Rôle,Département,Statut\n" +
      filteredStaff.map(member =>
        `${member.first_name} ${member.last_name},${member.email},${member.phone},${member.role},${getDepartmentLabel(member.role)},${member.status}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "personnel.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    dialog.success(isRTL ? 'تم تحميل البيانات بنجاح' : 'Données téléchargées avec succès');
  };

  // Colonnes pour TableToListAdapter
  const mobileColumns = [
    { key: 'full_name', label: isRTL ? 'الاسم' : 'Nom', isPrimary: true },
    {
      key: 'role_label', label: isRTL ? 'الدور' : 'Rôle', isBadge: true, badgeColors: {
        'Admin': 'purple',
        'مدير': 'purple',
        'Staff': 'blue',
        'موظف': 'blue'
      }
    },
    { key: 'department', label: isRTL ? 'القسم' : 'Département', isSecondary: true },
    {
      key: 'status_label', label: isRTL ? 'الحالة' : 'Statut', isBadge: true, badgeColors: {
        'Actif': 'green',
        'نشط': 'green',
        'Inactif': 'red',
        'غير نشط': 'red'
      }
    }
  ];

  // Préparer les données pour mobile
  const mobileStaff = filteredStaff.map(s => ({
    ...s,
    full_name: `${s.first_name} ${s.last_name}`,
    role_label: s.role === 'admin' ? (isRTL ? 'مدير' : 'Admin') : (isRTL ? 'موظف' : 'Staff'),
    status_label: s.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif'),
    department: getDepartmentLabel(s.role)
  }));

  // Version Mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader
          title={isRTL ? 'الموظفون' : 'Personnel'}
          subtitle={`${filteredStaff.length} ${isRTL ? 'موظف' : 'membre(s)'}`}
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
              rows={mobileStaff}
              onRowClick={(row) => {
                setSelectedStaff(row);
                setShowDetails(true);
              }}
              emptyMessage={isRTL ? 'لا يوجد موظفون' : 'Aucun personnel'}
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
            {isRTL ? 'إدارة الموظفين' : 'Gestion du Personnel'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL ? 'إدارة فريق العمل والأدوار والصلاحيات' : 'Gérer l\'équipe, les rôles et les permissions'}
          </p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse mt-4 sm:mt-0">
          <Button
            onClick={exportStaff}
            variant="outline"
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تصدير' : 'Exporter'}
          </Button>
          {isAdmin() && (
            <Button
              onClick={() => navigate('/dashboard/add-user', { state: { preselectedRole: 'staff' } })}
              className="flex items-center bg-primary-500 hover:bg-primary-600"
            >
              <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'إضافة موظف' : 'Ajouter Personnel'}
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
        <Card
          onClick={() => { setFilterRole('all'); setFilterStatus('all'); }}
          className={`cursor-pointer transition-all hover:shadow-md ${filterRole === 'all' && filterStatus === 'all' ? 'ring-2 ring-primary-500' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'إجمالي الموظفين' : 'Total Personnel'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {staff.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterRole(prev => prev === 'admin' ? 'all' : 'admin')}
          className={`cursor-pointer transition-all hover:shadow-md ${filterRole === 'admin' ? 'ring-2 ring-purple-500' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'المديرون' : 'Directeurs'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {staff.filter(s => s.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterStatus(prev => prev === 'active' ? 'all' : 'active')}
          className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'active' ? 'ring-2 ring-green-500' : ''}`}
        >
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
                  {staff.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterStatus(prev => prev === 'inactive' ? 'all' : 'inactive')}
          className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'inactive' ? 'ring-2 ring-red-500' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'غير نشط (معطل)' : 'Désactivés'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {staff.filter(s => s.status === 'inactive').length}
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
                {staff.length} {isRTL ? 'موظف' : 'personnel'}
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
                {/* Total Personnel */}
                <div
                  onClick={() => { setFilterRole('all'); setFilterStatus('all'); }}
                  className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'إجمالي الموظفين' : 'Total Personnel'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {staff.length}
                  </span>
                </div>

                {/* Directeurs */}
                <div
                  onClick={() => setFilterRole(prev => prev === 'admin' ? 'all' : 'admin')}
                  className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'المديرون' : 'Directeurs'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {staff.filter(s => s.role === 'admin').length}
                  </span>
                </div>

                {/* Actifs */}
                <div
                  onClick={() => setFilterStatus(prev => prev === 'active' ? 'all' : 'active')}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'نشط' : 'Actifs'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {staff.filter(s => s.status === 'active').length}
                  </span>
                </div>

                {/* Inactifs / Désactivés */}
                <div
                  onClick={() => setFilterStatus(prev => prev === 'inactive' ? 'all' : 'inactive')}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'غير نشط (معطل)' : 'Désactivés'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {staff.filter(s => s.status === 'inactive').length}
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
                  placeholder={isRTL ? 'البحث عن موظف (الاسم، البريد، الهاتف...)' : 'Rechercher un membre (nom, email, tél...)'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">{isRTL ? 'جميع الأدوار' : 'Tous les rôles'}</option>
                  <option value="admin">{isRTL ? 'المدير' : 'Directeur'}</option>
                  <option value="staff">{isRTL ? 'موظف' : 'Personnel'}</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="active">{isRTL ? 'النشطون فقط' : 'Actifs uniquement'}</option>
                  <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
                  <option value="inactive">{isRTL ? 'غير نشط (معطل)' : 'Désactivés uniquement'}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Liste du personnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'قائمة الموظفين' : 'Liste du Personnel'}
              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm font-normal text-gray-500">
                ({filteredStaff.length})
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
                      {isRTL ? 'الدور' : 'Rôle'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'القسم' : 'Département'}
                    </th>
                    <th className="text-left rtl:text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {isRTL ? 'الخبرة' : 'Expérience'}
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
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.specialization}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {member.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role).color}`}>
                          <Shield className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                          {getRoleBadge(member.role).label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 dark:text-gray-300">
                          {getDepartmentLabel(member.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {member.experience_years} {isRTL ? 'سنوات' : 'ans'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {member.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(member)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStaff(member);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin() && (
                            <Button
                              size="sm"
                              variant="outline"
                              title={member.status === 'active' ? (isRTL ? 'تعطيل الحساب' : 'Désactiver le compte') : (isRTL ? 'تفعيل الحساب' : 'Réactiver le compte')}
                              className={member.status === 'active' ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(member);
                              }}
                            >
                              {member.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          {isAdmin() && member.role === 'staff' && (
                            <Button
                              size="sm"
                              variant="outline"
                              title={isRTL ? 'إدارة الصلاحيات' : 'Gérer les accès'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManagePermissions(member);
                              }}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
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
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleViewDetails(member)}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role).color}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleBadge(member.role).label}
                        </span>
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {member.experience_years} {isRTL ? 'سنوات' : 'ans'}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {member.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
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
                {filteredStaff.map((member) => (
                  <div
                    key={member.id}
                    className="px-4 py-3 grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      onClick={() => handleViewDetails(member)}
                      className="cursor-pointer"
                    >
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role).color}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleBadge(member.role).label}
                        </span>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {member.experience_years} {isRTL ? 'سنوات' : 'ans'}
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {member.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(member)}
                        className="h-8 px-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {isAdmin() && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStaff(member);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isAdmin() && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          title={member.status === 'active' ? (isRTL ? 'تعطيل الحساب' : 'Désactiver le compte') : (isRTL ? 'تفعيل الحساب' : 'Réactiver le compte')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(member);
                          }}
                        >
                          {member.status === 'active' ? (
                            <UserX className="w-3.5 h-3.5 text-red-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-green-600" />
                          )}
                        </Button>
                      )}
                      {isAdmin() && member.role === 'staff' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          title={isRTL ? 'إدارة الصلاحيات' : 'Gérer les accès'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManagePermissions(member);
                          }}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal détails personnel */}
      {showDetails && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'تفاصيل الموظف' : 'Détails du Personnel'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <p className="text-gray-900 dark:text-white" dir="ltr">{selectedStaff.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'الحالة' : 'Statut'}
                </label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStaff.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {selectedStaff.status === 'active' ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط (معطل)' : 'Inactif (Désactivé)')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'الدور' : 'Rôle'}
                </label>
                <p className="text-gray-900 dark:text-white">{getRoleBadge(selectedStaff.role).label}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'القسم' : 'Département'}
                </label>
                <p className="text-gray-900 dark:text-white">{getDepartmentLabel(selectedStaff.role)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'التخصص' : 'Spécialisation'}
                </label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.specialization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'تاريخ التوظيف' : 'Date d\'embauche'}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedStaff.hire_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'سنوات الخبرة' : 'Années d\'expérience'}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedStaff.experience_years} {isRTL ? 'سنوات' : 'ans'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                {isRTL ? 'الإجراءات' : 'Actions'}
              </label>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                  }}
                  className="w-full justify-start"
                >
                  <Eye className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'عرض التفاصيل الكاملة' : 'Voir détails complets'}
                </Button>

                {isAdmin() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowDetails(false);
                      handleEditStaff(selectedStaff);
                    }}
                    className="w-full justify-start"
                  >
                    <Edit className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'تعديل' : 'Modifier'}
                  </Button>
                )}

                {isAdmin() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(selectedStaff)}
                    className={`w-full justify-start ${selectedStaff.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                  >
                    {selectedStaff.status === 'active' ? (
                      <>
                        <UserX className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'تعطيل الحساب' : 'Désactiver le compte'}
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'إعادة تفعيل الحساب' : 'Réactiver le compte'}
                      </>
                    )}
                  </Button>
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

      {/* Modal d'édition du personnel */}
      <EditStaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setStaffToEdit(null);
        }}
        staff={staffToEdit}
        onSuccess={handleEditSuccess}
        isRTL={isRTL}
      />

      {/* Modal de gestion des accès (permissions) */}
      <StaffPermissionsModal
        isOpen={showPermissionsModal}
        onClose={handlePermissionsModalClose}
        staff={staffForPermissions}
        isRTL={isRTL}
      />
    </div>
  );
};

export default StaffPage;
