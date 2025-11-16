import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MessageSquare, StickyNote, Calendar, CheckSquare, Bell, DollarSign, CalendarCheck, Settings, Mail, Megaphone, FileText } from 'lucide-react';
import MemoModal from '../modals/MemoModal';
import EventModal from '../modals/EventModal';
import TaskModal from '../modals/TaskModal';
import PaymentAlertModal from '../modals/PaymentAlertModal';
import CreateAppointmentModal from '../modals/CreateAppointmentModal';
import RequestAppointmentModal from '../modals/RequestAppointmentModal';

export default function SideMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRequestAppointmentModal, setShowRequestAppointmentModal] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Permissions selon le rôle
  const canCreateMemo = user?.role === 'admin' || user?.role === 'staff';
  const canCreateEvent = user?.role === 'admin' || user?.role === 'staff';
  const canCreateTask = user?.role === 'admin';
  const canCreatePaymentAlert = user?.role === 'admin';
  const isParent = user?.role === 'parent';

  // Afficher le menu pour admin, staff ET parents
  if (!canCreateMemo && !canCreateEvent && !canCreateTask && !canCreatePaymentAlert && !isParent) {
    return null;
  }

  const menuItems = [
    {
      id: 'memo',
      icon: StickyNote,
      label: 'Mémo Personnel',
      color: 'from-yellow-500 to-amber-500',
      hoverColor: 'hover:from-yellow-600 hover:to-amber-600',
      show: canCreateMemo,
      onClick: () => setShowMemoModal(true)
    },
    // Admin: Bouton Événement
    {
      id: 'event',
      icon: Calendar,
      label: 'Événement',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600',
      show: user?.role === 'admin' && canCreateEvent,
      onClick: () => setShowEventModal(true)
    },
    // Admin: Messages
    {
      id: 'admin-messages',
      icon: Mail,
      label: 'Messages',
      color: 'from-blue-500 to-sky-500',
      hoverColor: 'hover:from-blue-600 hover:to-sky-600',
      show: user?.role === 'admin',
      onClick: () => navigate('/dashboard/messages')
    },
    // Staff: Lien vers Messages
    {
      id: 'messages-link',
      icon: Mail,
      label: 'Messages',
      color: 'from-blue-500 to-sky-500',
      hoverColor: 'hover:from-blue-600 hover:to-sky-600',
      show: user?.role === 'staff',
      onClick: () => navigate('/dashboard/messages')
    },
    // Staff: Paramètres
    {
      id: 'staff-settings',
      icon: Settings,
      label: 'Paramètres',
      color: 'from-gray-500 to-slate-600',
      hoverColor: 'hover:from-gray-600 hover:to-slate-700',
      show: user?.role === 'staff',
      onClick: () => navigate('/dashboard/staff-settings')
    },
    // Admin: Créer un Rendez-vous
    {
      id: 'create-appointment',
      icon: CalendarCheck,
      label: 'Créer un RDV',
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'hover:from-green-600 hover:to-emerald-600',
      show: user?.role === 'admin',
      onClick: () => setShowAppointmentModal(true)
    },
    {
      id: 'task',
      icon: CheckSquare,
      label: 'Nouvelle Tâche',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
      show: canCreateTask,
      onClick: () => setShowTaskModal(true)
    },
    {
      id: 'payment',
      icon: DollarSign,
      label: 'Alerte Paiement',
      color: 'from-red-500 to-orange-500',
      hoverColor: 'hover:from-red-600 hover:to-orange-600',
      show: canCreatePaymentAlert,
      onClick: () => setShowPaymentModal(true)
    },
    // Admin: Paramètres
    {
      id: 'admin-settings',
      icon: Settings,
      label: 'Paramètres',
      color: 'from-gray-500 to-slate-600',
      hoverColor: 'hover:from-gray-600 hover:to-slate-700',
      show: user?.role === 'admin',
      onClick: () => navigate('/dashboard/settings')
    },
    // Parent: Messages
    {
      id: 'parent-messages',
      icon: MessageSquare,
      label: 'Messages',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
      show: isParent,
      onClick: () => navigate('/mon-espace/messages')
    },
    // Parent: Annonces
    {
      id: 'parent-announcements',
      icon: Megaphone,
      label: 'Annonces',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600',
      show: isParent,
      onClick: () => navigate('/mon-espace/announcements')
    },
    // Parent: Calendrier
    {
      id: 'parent-calendar',
      icon: Calendar,
      label: 'Calendrier',
      color: 'from-purple-500 to-indigo-500',
      hoverColor: 'hover:from-purple-600 hover:to-indigo-600',
      show: isParent,
      onClick: () => navigate('/mon-espace/calendar')
    },
    // Parent: Rapport de présence
    {
      id: 'parent-attendance',
      icon: FileText,
      label: 'Rapport de présence',
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'hover:from-green-600 hover:to-emerald-600',
      show: isParent,
      onClick: () => navigate('/mon-espace/attendance-report')
    },
    // Parent: Demander un RDV
    {
      id: 'parent-request-appointment',
      icon: CalendarCheck,
      label: 'Demander un RDV',
      color: 'from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600',
      show: isParent,
      onClick: () => setShowRequestAppointmentModal(true)
    }
  ].filter(item => item.show);

  return (
    <>
      {/* Menu latéral moderne fixé à droite */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        {/* Conteneur avec effet de verre */}
        <div className="bg-white/10 backdrop-blur-md rounded-l-3xl p-3 shadow-2xl border-l-4 border-white/20 space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.id;

            return (
              <div
                key={item.id}
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Label au survol avec animation */}
                <div
                  className={`
                    absolute right-full mr-4 top-1/2 -translate-y-1/2
                    px-4 py-2.5 bg-gradient-to-r ${item.color}
                    text-white text-sm font-semibold rounded-xl
                    whitespace-nowrap shadow-2xl
                    transition-all duration-300 ease-out
                    ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
                  `}
                >
                  {item.label}
                  {/* Flèche moderne */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                    <div className={`w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] bg-gradient-to-r ${item.color}`}
                      style={{
                        borderLeftColor: 'currentColor',
                        filter: 'drop-shadow(2px 0 4px rgba(0,0,0,0.1))'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Bouton moderne avec effet 3D */}
                <button
                  onClick={item.onClick}
                  className={`
                    relative w-12 h-12 rounded-xl
                    bg-gradient-to-br ${item.color}
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    hover:scale-110 hover:-translate-x-2
                    shadow-lg hover:shadow-2xl
                    before:absolute before:inset-0 before:rounded-xl
                    before:bg-white/20 before:opacity-0 hover:before:opacity-100
                    before:transition-opacity before:duration-300
                    after:absolute after:inset-0 after:rounded-xl
                    after:shadow-inner after:opacity-0 hover:after:opacity-100
                    after:transition-opacity after:duration-300
                    group-hover:rotate-3
                  `}
                >
                  <Icon className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />

                  {/* Effet de brillance */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* Indicateur de position */}
                <div className={`
                  absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full
                  bg-gradient-to-b ${item.color}
                  transition-all duration-300
                  ${isHovered ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}
                `}></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showMemoModal && (
        <MemoModal
          isOpen={showMemoModal}
          onClose={() => setShowMemoModal(false)}
          onSuccess={() => {
            setShowMemoModal(false);
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
            window.dispatchEvent(new CustomEvent('taskUpdated'));
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            setShowTaskModal(false);
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

      {showAppointmentModal && (
        <CreateAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            setShowAppointmentModal(false);
          }}
        />
      )}

      {showRequestAppointmentModal && (
        <RequestAppointmentModal
          isOpen={showRequestAppointmentModal}
          onClose={() => setShowRequestAppointmentModal(false)}
          onSuccess={() => {
            setShowRequestAppointmentModal(false);
          }}
        />
      )}
    </>
  );
}
