import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Phone, Mail, RefreshCw, CheckCircle, FileText } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';

const TodayAppointments = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/enrollments/appointments/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des rendez-vous');
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments || []);
        // Rafraîchissement silencieux
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
      if (showToast) {
        dialog.error(isRTL ? 'خطأ في تحميل المواعيد' : 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(() => {
      fetchAppointments();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" />
          {isRTL ? 'مقبول' : 'Approuvé'}
        </span>
      );
    } else if (status === 'rejected_incomplete') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          <FileText className="w-3 h-3" />
          {isRTL ? 'وثائق ناقصة' : 'Docs manquants'}
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            {isRTL ? 'مواعيد اليوم' : 'Rendez-vous d\'aujourd\'hui'}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          {isRTL ? 'مواعيد اليوم' : 'Rendez-vous d\'aujourd\'hui'}
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
            {appointments.length}
          </span>
        </h3>
        <button
          onClick={() => fetchAppointments(true)}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title={isRTL ? 'تحديث' : 'Actualiser'}
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">
            {isRTL ? 'لا توجد مواعيد اليوم' : 'Aucun rendez-vous aujourd\'hui'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {isRTL ? 'سيتم عرض المواعيد المجدولة هنا' : 'Les rendez-vous programmés apparaîtront ici'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, index) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-4 hover:shadow-md transition-all"
            >
              {/* Time Badge */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full shadow-lg">
                  <Clock className="w-4 h-4" />
                  {apt.appointment_time}
                </div>
              </div>

              {/* Content */}
              <div className="pr-24">
                {/* Child Name */}
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {apt.child_name}
                </h4>

                {/* Parent Info */}
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{apt.parent_name}</span>
                  </div>

                  {apt.parent_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${apt.parent_phone}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {apt.parent_phone}
                      </a>
                    </div>
                  )}

                  {apt.parent_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${apt.parent_email}`}
                        className="hover:text-blue-600 transition-colors truncate"
                      >
                        {apt.parent_email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-3">
                  {getStatusBadge(apt.status)}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 rounded-xl transition-all pointer-events-none" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      {appointments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {isRTL
              ? `${appointments.length} موعد مجدول لهذا اليوم`
              : `${appointments.length} rendez-vous programmé${appointments.length > 1 ? 's' : ''} aujourd'hui`
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default TodayAppointments;
