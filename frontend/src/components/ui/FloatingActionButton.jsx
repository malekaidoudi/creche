import { useState } from 'react';
import { Plus, X, Calendar, CheckSquare, Mail, FileText, DollarSign, Megaphone, CalendarCheck, Clock, Zap, ChevronRight, Settings, CalendarX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import { useNavigate } from 'react-router-dom';
import CreateAppointmentModal from '../modals/CreateAppointmentModal';
import TaskModal from '../modals/TaskModal';
import MemoModal from '../modals/MemoModal';
import EventModal from '../modals/EventModal';
import PaymentAlertModal from '../modals/PaymentAlertModal';
import RequestAppointmentModal from '../modals/RequestAppointmentModal';

export default function FloatingActionButton() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showQuickActionsSubmenu, setShowQuickActionsSubmenu] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequestAppointmentModal, setShowRequestAppointmentModal] = useState(false);

  // Vérifier les permissions
  const canCreateAppointment = user?.role === 'admin';
  const canCreateTask = user?.role === 'admin';
  const canCreateMemo = user?.role === 'admin' || user?.role === 'staff';
  const canCreateEvent = user?.role === 'admin' || user?.role === 'staff';
  const isParent = user?.role === 'parent';

  // Si aucune permission ET pas parent, ne pas afficher le bouton
  if (!canCreateAppointment && !canCreateTask && !canCreateMemo && !canCreateEvent && !isParent) {
    return null;
  }

  const handleAction = (action) => {
    // Si c'est l'action "quick-actions", toggle le sous-menu
    if (action === 'quick-actions') {
      setShowQuickActionsSubmenu(!showQuickActionsSubmenu);
      return;
    }

    setIsOpen(false);
    setShowQuickActionsSubmenu(false);

    switch (action) {
      case 'appointment':
        setShowAppointmentModal(true);
        break;
      case 'task':
        setShowTaskModal(true);
        break;
      case 'memo':
        setShowMemoModal(true);
        break;
      case 'event':
        setShowEventModal(true);
        break;
      case 'payment':
        setShowPaymentModal(true);
        break;
      case 'messages':
        navigate('/dashboard/messages');
        break;
      case 'calendar':
        navigate('/mon-espace/calendar');
        break;
      case 'messages-parent':
        navigate('/mon-espace/messages');
        break;
      case 'announcements':
        navigate('/mon-espace/announcements');
        break;
      case 'request-appointment':
        setShowRequestAppointmentModal(true);
        break;
      case 'attendance-report':
        navigate('/mon-espace/attendance-report');
        break;
      case 'absence-request':
        navigate('/mon-espace/absence-request');
        break;
      case 'attendance-today':
        navigate('/dashboard/attendance/today');
        break;
      case 'pending-enrollments':
        navigate('/dashboard/pending-enrollments');
        break;
      case 'absence-management':
        navigate('/dashboard/absence-management');
        break;
      case 'settings':
        navigate(user?.role === 'admin' ? '/dashboard/settings' : '/dashboard/staff-settings');
        break;
      default:
        break;
    }
  };

  // Sous-menu Actions rapides
  const quickActionsSubmenu = [
    {
      icon: Clock,
      label: 'Enregistrer présence',
      action: 'attendance-today',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      icon: Calendar,
      label: 'Gestion absences',
      action: 'absence-management',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: FileText,
      label: 'Réviser demandes',
      action: 'pending-enrollments',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  // Menu selon le rôle
  const menuItems = user?.role === 'staff' ? [
    // Menu Staff
    {
      icon: FileText,
      label: 'Mémo Personnel',
      action: 'memo',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      icon: Zap,
      label: 'Actions rapides',
      action: 'quick-actions',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      hasSubmenu: true
    }
  ] : user?.role === 'parent' ? [
    // Menu Parent
    {
      icon: Calendar,
      label: 'Calendrier',
      action: 'calendar',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      icon: Mail,
      label: 'Messages',
      action: 'messages-parent',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: Megaphone,
      label: 'Annonces',
      action: 'announcements',
      color: 'bg-cyan-600 hover:bg-cyan-700'
    },
    {
      icon: CalendarCheck,
      label: 'Demander un RDV',
      action: 'request-appointment',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      icon: FileText,
      label: 'Rapport de présence',
      action: 'attendance-report',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      icon: CalendarX,
      label: 'Demande d\'absence',
      action: 'absence-request',
      color: 'bg-red-600 hover:bg-red-700'
    }
  ] : [
    // Menu Admin
    canCreateAppointment && {
      icon: Calendar,
      label: 'Rendez-vous',
      action: 'appointment',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    canCreateTask && {
      icon: CheckSquare,
      label: 'Tâche',
      action: 'task',
      color: 'bg-green-600 hover:bg-green-700'
    },
    canCreateMemo && {
      icon: FileText,
      label: 'Mémo',
      action: 'memo',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    canCreateEvent && {
      icon: Calendar,
      label: 'Événement',
      action: 'event',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    user?.role === 'admin' && {
      icon: DollarSign,
      label: 'Alerte paiement',
      action: 'payment',
      color: 'bg-red-600 hover:bg-red-700'
    },
    // Actions rapides avec sous-menu
    {
      icon: Zap,
      label: 'Actions rapides',
      action: 'quick-actions',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      hasSubmenu: true
    },
    // Paramètres
    {
      icon: Settings,
      label: 'Paramètres',
      action: 'settings',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ].filter(Boolean);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => {
            setIsOpen(false);
            setShowQuickActionsSubmenu(false);
          }}
        />
      )}

      {/* Sous-menu Actions rapides */}
      {isOpen && showQuickActionsSubmenu && (
        <div className="fixed bottom-24 right-24 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-2 min-w-[200px] animate-in slide-in-from-right-5 fade-in">
          {quickActionsSubmenu.map((subItem, subIndex) => {
            const SubIcon = subItem.icon;
            return (
              <button
                key={subItem.action}
                onClick={() => handleAction(subItem.action)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className={`${subItem.color} text-white p-2 rounded-lg`}>
                  <SubIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {subItem.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Menu items */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.action;
            const isQuickActionsActive = item.hasSubmenu && showQuickActionsSubmenu;

            return (
              <div
                key={item.action}
                className="flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onMouseEnter={() => setHoveredItem(item.action)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Label au survol uniquement */}
                <span
                  className={`
                    bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap
                    transition-all duration-200 flex items-center gap-2
                    ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
                  `}
                >
                  {item.label}
                  {item.hasSubmenu && <ChevronRight className="w-4 h-4" />}
                </span>
                <button
                  onClick={() => handleAction(item.action)}
                  className={`${item.color} text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 ${isQuickActionsActive ? 'ring-4 ring-white/50' : ''}`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main button - z-40 pour être en dessous des modals plein écran (z-50) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowQuickActionsSubmenu(false);
        }}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all ${isOpen
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          }`}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <Plus className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Modals */}
      {showAppointmentModal && (
        <CreateAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            setShowAppointmentModal(false);
            // Recharger si nécessaire
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            setShowTaskModal(false);
            // Déclencher un événement pour recharger les widgets
            window.dispatchEvent(new CustomEvent('taskUpdated'));
          }}
        />
      )}

      {showMemoModal && (
        <MemoModal
          isOpen={showMemoModal}
          onClose={() => setShowMemoModal(false)}
          onSuccess={() => {
            setShowMemoModal(false);
            // Déclencher un événement pour recharger les widgets
            window.dispatchEvent(new CustomEvent('taskUpdated'));
          }}
        />
      )}

      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => {
            setShowEventModal(false);
            // Déclencher un événement pour recharger les widgets
            window.dispatchEvent(new CustomEvent('taskUpdated'));
          }}
        />
      )}

      {showPaymentModal && (
        <PaymentAlertModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
          }}
        />
      )}

      {showRequestAppointmentModal && (
        <RequestAppointmentModal
          isOpen={showRequestAppointmentModal}
          onClose={() => setShowRequestAppointmentModal(false)}
          onSuccess={() => {
            setShowRequestAppointmentModal(false);
            dialog.success('Demande de rendez-vous envoyée');
          }}
        />
      )}
    </>
  );
}
