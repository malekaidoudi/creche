import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  X, 
  Home, 
  Users, 
  Baby, 
  ClipboardList, 
  Clock, 
  FileText, 
  Settings, 
  BarChart3,
  UserCheck,
  Calendar,
  Upload,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx';

const DashboardSidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      key: 'dashboard',
      title: isRTL ? 'الرئيسية' : 'Tableau de bord',
      icon: Home,
      path: '/dashboard',
      roles: ['admin', 'staff']
    },
    {
      key: 'children',
      title: isRTL ? 'الأطفال' : 'Enfants',
      icon: Baby,
      roles: ['admin', 'staff'],
      submenu: [
        {
          title: isRTL ? 'قائمة الأطفال' : 'Liste des enfants',
          path: '/dashboard/children',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'إضافة طفل' : 'Ajouter un enfant',
          path: '/dashboard/children/add',
          roles: ['admin']
        }
      ]
    },
    {
      key: 'attendance',
      title: isRTL ? 'الحضور' : 'Présences',
      icon: Clock,
      roles: ['admin', 'staff'],
      submenu: [
        {
          title: isRTL ? 'اليوم' : 'Aujourd\'hui',
          path: '/dashboard/attendance/today',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'التاريخ' : 'Historique',
          path: '/dashboard/attendance/history',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'الإحصائيات' : 'Statistiques',
          path: '/dashboard/attendance/stats',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      key: 'enrollments',
      title: isRTL ? 'التسجيلات' : 'Inscriptions',
      icon: ClipboardList,
      roles: ['admin', 'staff'],
      submenu: [
        {
          title: isRTL ? 'الطلبات المعلقة' : 'Demandes en attente',
          path: '/dashboard/enrollments/pending',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'جميع التسجيلات' : 'Toutes les inscriptions',
          path: '/dashboard/enrollments',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'الوثائق' : 'Documents',
          path: '/dashboard/enrollments/documents',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      key: 'users',
      title: isRTL ? 'المستخدمون' : 'Utilisateurs',
      icon: Users,
      roles: ['admin'],
      submenu: [
        {
          title: isRTL ? 'الأولياء' : 'Parents',
          path: '/dashboard/users/parents',
          roles: ['admin']
        },
        {
          title: isRTL ? 'الموظفون' : 'Personnel',
          path: '/dashboard/users/staff',
          roles: ['admin']
        },
        {
          title: isRTL ? 'إضافة مستخدم' : 'Ajouter utilisateur',
          path: '/dashboard/users/add',
          roles: ['admin']
        }
      ]
    },
    {
      key: 'documents',
      title: isRTL ? 'الوثائق' : 'Documents',
      icon: FileText,
      roles: ['admin', 'staff'],
      submenu: [
        {
          title: isRTL ? 'وثائق التحميل' : 'Documents à télécharger',
          path: '/dashboard/documents/download',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'الوثائق المرفوعة' : 'Documents uploadés',
          path: '/dashboard/documents/uploaded',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      key: 'reports',
      title: isRTL ? 'التقارير' : 'Rapports',
      icon: BarChart3,
      roles: ['admin'],
      submenu: [
        {
          title: isRTL ? 'إحصائيات عامة' : 'Statistiques générales',
          path: '/dashboard/reports/stats',
          roles: ['admin']
        },
        {
          title: isRTL ? 'تقرير الحضور' : 'Rapport présences',
          path: '/dashboard/reports/attendance',
          roles: ['admin']
        }
      ]
    },
    {
      key: 'settings',
      title: isRTL ? 'الإعدادات' : 'Paramètres',
      icon: Settings,
      path: '/dashboard/settings',
      roles: ['admin']
    }
  ];

  const hasAccess = (roles) => {
    return roles.includes(user?.role);
  };

  const SidebarLink = ({ item, isSubmenu = false }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.key];
    const active = isActive(item.path);

    if (hasSubmenu) {
      return (
        <div>
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              active
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center">
              <item.icon className="w-5 h-5 mr-3 rtl:mr-0 rtl:ml-3" />
              {item.title}
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-8 rtl:ml-0 rtl:mr-8 mt-2 space-y-1">
              {item.submenu
                .filter(subItem => hasAccess(subItem.roles))
                .map((subItem, index) => (
                  <Link
                    key={index}
                    to={subItem.path}
                    onClick={onClose}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive(subItem.path)
                        ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {subItem.title}
                  </Link>
                ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          active
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <item.icon className="w-5 h-5 mr-3 rtl:mr-0 rtl:ml-3" />
        {item.title}
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8">
              <ImageWithFallback
                src="/images/logo.jpg"
                alt="Mima Elghalia"
                fallback={defaultImages.logo}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mima Elghalia
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </p>
            </div>
          </Link>
          
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems
            .filter(item => hasAccess(item.roles))
            .map((item) => (
              <SidebarLink key={item.key} item={item} />
            ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL ? (user?.role === 'admin' ? 'مدير' : 'موظف') : (user?.role === 'admin' ? 'Admin' : 'Staff')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
