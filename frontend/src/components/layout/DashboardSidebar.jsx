import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRight,
  ChevronLeft,
  User,
  MessageSquare,
  Image,
  Activity,
  Mail
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useHasChildren } from '../../hooks/useHasChildren';
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx';

const DashboardSidebar = ({ isOpen, onClose, onCollapsedChange }) => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL, currentLanguage } = useLanguage();
  const { hasChildren } = useHasChildren();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapsedChange) {
      onCollapsedChange(newState);
    }
  };


  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => {
      const newState = {
        ...prev,
        [menuKey]: !prev[menuKey]
      };
      console.log('Toggle menu:', menuKey, 'isExpanded:', newState[menuKey], 'isCollapsed:', isCollapsed);
      return newState;
    });
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
    // Mon Espace - Affiché seulement si l'utilisateur a des enfants
    ...(hasChildren ? [{
      key: 'my-space',
      title: isRTL ? 'مساحتي' : 'Mon Espace',
      icon: User,
      path: '/mon-espace',
      roles: ['admin', 'staff', 'parent']
    }] : []),
    {
      key: 'messages',
      title: isRTL ? 'الرسائل' : 'Messages',
      icon: MessageSquare,
      path: '/dashboard/messages',
      roles: ['admin', 'staff']
    },
    {
      key: 'mailbox',
      title: isRTL ? 'البريد' : 'Courrier',
      icon: Mail,
      path: '/dashboard/mailbox',
      roles: ['admin']
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
        },
        {
          title: isRTL ? 'إدارة الغيابات' : 'Gestion des absences',
          path: '/dashboard/absence-management',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      key: 'activities',
      title: isRTL ? 'الأنشطة' : 'Activités',
      icon: Image,
      path: '/dashboard/activities',
      roles: ['admin', 'staff', 'parent']
    },
    {
      key: 'planning',
      title: isRTL ? 'التخطيط' : 'Planning',
      icon: Calendar,
      roles: ['admin', 'staff'],
      submenu: [
        {
          title: isRTL ? 'شهري' : 'Mensuelle',
          path: '/dashboard/planning/calendar',
          roles: ['admin', 'staff']
        },
        {
          title: isRTL ? 'أسبوعي' : 'Hebdomadaire',
          path: '/dashboard/planning/weekly',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      key: 'daily-reports',
      title: isRTL ? 'التقارير اليومية' : 'Rapports Journaliers',
      icon: FileText,
      path: '/dashboard/daily-reports',
      roles: ['admin', 'staff']
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
      roles: ['admin'],
      submenu: [
        {
          title: isRTL ? 'الطلبات المعلقة' : 'Demandes en attente',
          path: '/dashboard/pending-enrollments',
          roles: ['admin']
        },
        {
          title: isRTL ? 'جميع التسجيلات' : 'Toutes les inscriptions',
          path: '/dashboard/enrollments',
          roles: ['admin']
        },
        {
          title: isRTL ? 'الوثائق' : 'Documents',
          path: '/dashboard/documents',
          roles: ['admin']
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
          path: '/dashboard/parents',
          roles: ['admin']
        },
        {
          title: isRTL ? 'الموظفون' : 'Personnel',
          path: '/dashboard/staff',
          roles: ['admin']
        },
        {
          title: isRTL ? 'إضافة مستخدم' : 'Ajouter utilisateur',
          path: '/dashboard/add-user',
          roles: ['admin']
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
          path: '/dashboard/general-stats',
          roles: ['admin']
        },
        {
          title: isRTL ? 'تقرير الحضور' : 'Rapport présences',
          path: '/dashboard/attendance-report',
          roles: ['admin']
        }
      ]
    },
    // Journal d'activité - Lien direct pour admin/staff
    {
      key: 'activity-logs',
      title: isRTL ? 'سجل النشاط' : 'Journal d\'activité',
      icon: Activity,
      path: '/dashboard/activity-logs',
      roles: ['admin', 'staff']
    },
    // Paramètres supprimé de la sidebar (accessible via menu utilisateur)
  ];

  const hasAccess = (roles) => {
    return roles.includes(user?.role);
  };

  const SidebarLink = ({ item, isSubmenu = false }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.key];
    const active = isActive(item.path);
    const buttonRef = useRef(null);
    const popupRef = useRef(null);
    const [tooltipTop, setTooltipTop] = useState(0);

    useEffect(() => {
      if (isCollapsed && buttonRef.current) {
        const updatePosition = () => {
          const rect = buttonRef.current.getBoundingClientRect();
          setTooltipTop(rect.top + rect.height / 2);
        };
        updatePosition();
        window.addEventListener('scroll', updatePosition);
        return () => window.removeEventListener('scroll', updatePosition);
      }
    }, [isCollapsed]);

    // Fermer le popup quand on clique en dehors
    useEffect(() => {
      if (isExpanded && isCollapsed) {
        const handleClickOutside = (event) => {
          if (popupRef.current && !popupRef.current.contains(event.target) &&
            buttonRef.current && !buttonRef.current.contains(event.target)) {
            toggleMenu(item.key);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isExpanded, isCollapsed, item.key]);

    if (hasSubmenu) {
      return (
        <div className="relative group">
          <button
            ref={buttonRef}
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex ${isCollapsed ? 'flex-col items-center gap-1' : 'flex-row items-center justify-between'} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <div className="flex items-center">
              <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3 rtl:mr-0 rtl:ml-3'}`} />
              {!isCollapsed && item.title}
            </div>
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3" />
            ) : (isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
          </button>

          {/* Tooltip avec Portal */}
          {isCollapsed && createPortal(
            <span className="fixed px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-[9999]"
              style={{
                left: isRTL ? 'auto' : '5.5rem',
                right: isRTL ? '5.5rem' : 'auto',
                top: `${tooltipTop}px`,
                transform: 'translateY(-50%)'
              }}
            >
              {item.title}
            </span>,
            document.body
          )}

          {isExpanded && (
            <div
              ref={popupRef}
              onMouseLeave={() => isCollapsed && toggleMenu(item.key)}
              className={isCollapsed ? 'fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-[9999]' : 'ml-8 rtl:ml-0 rtl:mr-8 mt-2 space-y-1'}
              style={isCollapsed ? {
                left: isRTL ? 'auto' : '6rem',
                right: isRTL ? '6rem' : 'auto',
                top: `${tooltipTop - 20}px`
              } : {}}
            >
              {item.submenu
                .filter(subItem => hasAccess(subItem.roles))
                .map((subItem, index) => (
                  <Link
                    key={index}
                    to={subItem.path}
                    onClick={onClose}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${isActive(subItem.path)
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
      <div className="relative group">
        <Link
          ref={buttonRef}
          to={item.path}
          onClick={onClose}
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3 rtl:mr-0 rtl:ml-3'}`} />
          {!isCollapsed && item.title}
        </Link>

        {/* Tooltip avec Portal */}
        {isCollapsed && createPortal(
          <span className="fixed px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-[9999]"
            style={{
              left: isRTL ? 'auto' : '5.5rem',
              right: isRTL ? '5.5rem' : 'auto',
              top: `${tooltipTop}px`,
              transform: 'translateY(-50%)'
            }}
          >
            {item.title}
          </span>,
          document.body
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out ${isRTL
          ? `right-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`
          : `left-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`
          }`}
        style={{
          direction: isRTL ? 'rtl' : 'ltr',
          overflow: 'visible'
        }}
      >
        {/* Bouton toggle collapse - Desktop uniquement */}
        <button
          onClick={handleToggleCollapse}
          className={`hidden lg:flex absolute top-20 ${isRTL ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} z-50 w-8 h-8 items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300`}
          title={isCollapsed ? (isRTL ? 'إظهار القائمة' : 'Afficher le menu') : (isRTL ? 'إخفاء القائمة' : 'Masquer le menu')}
        >
          {isCollapsed ? (
            isRTL ? <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          ) : (
            isRTL ? <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          )}
        </button>

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
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mima Elghalia
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                </p>
              </div>
            )}
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-visible">
          {menuItems
            .filter(item => hasAccess(item.roles))
            .map((item) => (
              <SidebarLink key={item.key} item={item} />
            ))}
        </nav>

        {/* Lien retour au site - Visible sur mobile uniquement */}
        <div className="lg:hidden px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="w-5 h-5" />
            {!isCollapsed && (
              <span className="font-medium">
                {isRTL ? 'العودة للموقع' : 'Retour au site'}
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
