import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Home, 
  Users, 
  Baby, 
  UserPlus, 
  Calendar, 
  FileText, 
  Newspaper, 
  MessageSquare,
  BarChart3,
  Settings,
  Image
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const DashboardSidebar = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()

  // Navigation selon le rôle
  const getNavigation = () => {
    const baseNavigation = [
      {
        name: t('nav.dashboard'),
        href: '/dashboard',
        icon: Home,
        roles: ['admin', 'staff', 'parent']
      }
    ]

    const adminStaffNavigation = [
      {
        name: t('nav.children'),
        href: '/dashboard/children',
        icon: Baby,
        roles: ['admin', 'staff']
      },
      {
        name: t('nav.enrollments'),
        href: '/dashboard/enrollments',
        icon: UserPlus,
        roles: ['admin', 'staff']
      },
      {
        name: t('nav.attendance'),
        href: '/dashboard/attendance',
        icon: Calendar,
        roles: ['admin', 'staff']
      },
      {
        name: t('nav.articlesManagement'),
        href: '/dashboard/articles',
        icon: FileText,
        roles: ['admin', 'staff']
      },
      {
        name: t('nav.newsManagement'),
        href: '/dashboard/news',
        icon: Newspaper,
        roles: ['admin', 'staff']
      },
      {
        name: 'Médias',
        href: '/dashboard/media',
        icon: Image,
        roles: ['admin', 'staff']
      }
    ]

    const adminOnlyNavigation = [
      {
        name: t('nav.users'),
        href: '/dashboard/users',
        icon: Users,
        roles: ['admin']
      },
      {
        name: 'Rapports',
        href: '/dashboard/reports',
        icon: BarChart3,
        roles: ['admin']
      },
      {
        name: 'Paramètres',
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['admin']
      }
    ]

    let navigation = [...baseNavigation]

    if (user?.role === 'admin') {
      navigation = [...navigation, ...adminOnlyNavigation, ...adminStaffNavigation]
    } else if (user?.role === 'staff') {
      navigation = [...navigation, ...adminStaffNavigation]
    }

    return navigation.filter(item => item.roles.includes(user?.role))
  }

  const navigation = getNavigation()

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'nav-link-active'
                      : 'nav-link-inactive'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  <Icon
                    className={`${
                      isActive(item.href)
                        ? 'text-primary-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0 h-5 w-5`}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Informations utilisateur en bas */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {user?.first_name?.charAt(0)}
            </span>
          </div>
          <div className="ml-3 rtl:ml-0 rtl:mr-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name}
            </p>
            <p className="text-xs text-gray-500">
              {t(`roles.${user?.role}`)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default DashboardSidebar
