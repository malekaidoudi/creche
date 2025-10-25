import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Eye
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ParentsPage = () => {
  const { isRTL } = useLanguage();
  const { isAdmin } = useAuth();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Données simulées pour les parents
  useEffect(() => {
    const loadParents = async () => {
      try {
        // Simulation d'appel API
        setTimeout(() => {
          const mockParents = [
            {
              id: 1,
              first_name: 'Ahmed',
              last_name: 'Ben Ali',
              email: 'ahmed.benali@email.com',
              phone: '+216 25 123 456',
              status: 'active',
              children_count: 2,
              registration_date: '2024-01-15',
              last_login: '2024-10-20',
              children: ['Lina Ben Ali', 'Omar Ben Ali']
            },
            {
              id: 2,
              first_name: 'Fatma',
              last_name: 'Trabelsi',
              email: 'fatma.trabelsi@email.com',
              phone: '+216 22 987 654',
              status: 'active',
              children_count: 1,
              registration_date: '2024-02-20',
              last_login: '2024-10-22',
              children: ['Youssef Trabelsi']
            },
            {
              id: 3,
              first_name: 'Mohamed',
              last_name: 'Khelifi',
              email: 'mohamed.khelifi@email.com',
              phone: '+216 28 456 789',
              status: 'inactive',
              children_count: 1,
              registration_date: '2024-03-10',
              last_login: '2024-09-15',
              children: ['Amina Khelifi']
            },
            {
              id: 4,
              first_name: 'Amel',
              last_name: 'Sassi',
              email: 'amel.sassi@email.com',
              phone: '+216 26 321 987',
              status: 'active',
              children_count: 3,
              registration_date: '2023-12-05',
              last_login: '2024-10-21',
              children: ['Sarra Sassi', 'Khalil Sassi', 'Nour Sassi']
            }
          ];
          setParents(mockParents);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur chargement parents:', error);
        setLoading(false);
      }
    };

    loadParents();
  }, []);

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
  };

  const handleStatusToggle = (parentId) => {
    setParents(prev => prev.map(parent => 
      parent.id === parentId 
        ? { ...parent, status: parent.status === 'active' ? 'inactive' : 'active' }
        : parent
    ));
    toast.success(isRTL ? 'تم تحديث حالة الولي' : 'Statut du parent mis à jour');
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
    
    toast.success(isRTL ? 'تم تصدير قائمة الأولياء' : 'Liste des parents exportée');
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parent.status === 'active'
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
                              >
                                <Edit className="w-4 h-4" />
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal détails parent */}
      {showDetails && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
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

export default ParentsPage;
