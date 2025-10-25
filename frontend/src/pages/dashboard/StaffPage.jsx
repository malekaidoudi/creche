import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Users
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const StaffPage = () => {
  const { isRTL } = useLanguage();
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Données simulées pour le personnel
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setTimeout(() => {
          const mockStaff = [
            {
              id: 1,
              first_name: 'Sarah',
              last_name: 'Benali',
              email: 'sarah.benali@mimaelghalia.tn',
              phone: '+216 25 111 222',
              role: 'admin',
              status: 'active',
              hire_date: '2023-01-15',
              last_login: '2024-10-22',
              department: 'Administration',
              experience_years: 5,
              specialization: 'Gestion pédagogique'
            },
            {
              id: 2,
              first_name: 'Amina',
              last_name: 'Khelifi',
              email: 'amina.khelifi@mimaelghalia.tn',
              phone: '+216 22 333 444',
              role: 'staff',
              status: 'active',
              hire_date: '2023-03-20',
              last_login: '2024-10-22',
              department: 'Éducation',
              experience_years: 3,
              specialization: 'Petite enfance'
            },
            {
              id: 3,
              first_name: 'Fatma',
              last_name: 'Trabelsi',
              email: 'fatma.trabelsi@mimaelghalia.tn',
              phone: '+216 28 555 666',
              role: 'staff',
              status: 'active',
              hire_date: '2023-06-10',
              last_login: '2024-10-21',
              department: 'Soins',
              experience_years: 4,
              specialization: 'Soins infirmiers'
            },
            {
              id: 4,
              first_name: 'Mohamed',
              last_name: 'Sassi',
              email: 'mohamed.sassi@mimaelghalia.tn',
              phone: '+216 26 777 888',
              role: 'staff',
              status: 'inactive',
              hire_date: '2023-09-05',
              last_login: '2024-09-30',
              department: 'Sécurité',
              experience_years: 2,
              specialization: 'Surveillance'
            }
          ];
          setStaff(mockStaff);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur chargement personnel:', error);
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterRole === 'all' || member.role === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (member) => {
    setSelectedStaff(member);
    setShowDetails(true);
  };

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

  const exportStaff = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nom,Email,Téléphone,Rôle,Département,Statut\n" +
      filteredStaff.map(member => 
        `${member.first_name} ${member.last_name},${member.email},${member.phone},${member.role},${member.department},${member.status}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "personnel.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(isRTL ? 'تم تصدير قائمة الموظفين' : 'Liste du personnel exportée');
  };

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
            <Button className="flex items-center bg-primary-500 hover:bg-primary-600">
              <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'إضافة موظف' : 'Ajouter Personnel'}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'المديرون' : 'Administrateurs'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {staff.filter(s => s.role === 'admin').length}
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
                  {staff.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'متوسط الخبرة' : 'Expérience Moy.'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(staff.reduce((sum, s) => sum + s.experience_years, 0) / staff.length || 0)} {isRTL ? 'سنوات' : 'ans'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  placeholder={isRTL ? 'البحث عن موظف...' : 'Rechercher un membre du personnel...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">{isRTL ? 'جميع الأدوار' : 'Tous les rôles'}</option>
                  <option value="admin">{isRTL ? 'مدير' : 'Administrateur'}</option>
                  <option value="staff">{isRTL ? 'موظف' : 'Personnel'}</option>
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
            <div className="overflow-x-auto">
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
                          {member.department}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {member.experience_years} {isRTL ? 'سنوات' : 'ans'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active'
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
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal détails personnel */}
      {showDetails && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
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
                  {isRTL ? 'الدور' : 'Rôle'}
                </label>
                <p className="text-gray-900 dark:text-white">{getRoleBadge(selectedStaff.role).label}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'القسم' : 'Département'}
                </label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.department}</p>
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
            <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
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

export default StaffPage;
