import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  Baby, 
  CheckCircle, 
  XCircle,
  Download,
  Eye
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';

const HistorySection = ({ 
  attendanceData, 
  selectedDate, 
  onDateChange, 
  searchTerm, 
  onSearchChange,
  filterStatus,
  onFilterChange 
}) => {
  const { isRTL } = useLanguage();

  // Fonctions utilitaires d'abord
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''}`;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR');
  };

  const getRecordStatus = (record) => {
    // Vérifier si l'enregistrement existe
    if (!record) return 'absent';
    
    // Vérifier les valeurs null/undefined de manière plus stricte
    const hasCheckIn = record.check_in_time !== null && 
                      record.check_in_time !== undefined && 
                      record.check_in_time !== 'null' && 
                      typeof record.check_in_time === 'string' &&
                      record.check_in_time.trim() !== '';
                      
    const hasCheckOut = record.check_out_time !== null && 
                       record.check_out_time !== undefined && 
                       record.check_out_time !== 'null' && 
                       typeof record.check_out_time === 'string' &&
                       record.check_out_time.trim() !== '';
    
    if (!hasCheckIn) return 'absent';
    if (hasCheckIn && !hasCheckOut) return 'present';
    if (hasCheckIn && hasCheckOut) return 'completed';
    return 'absent';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      present: isRTL ? 'حاضر' : 'Présent',
      absent: isRTL ? 'غائب' : 'Absent',
      completed: isRTL ? 'مكتمل' : 'Terminé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  // Fonction pour voir les détails d'un enregistrement
  const handleViewDetails = (record) => {
    const details = {
      enfant: `${record.child?.first_name} ${record.child?.last_name}`,
      age: calculateAge(record.child?.birth_date),
      date: formatDate(record.date || selectedDate),
      arrivee: formatTime(record.check_in_time),
      depart: formatTime(record.check_out_time),
      duree: record.check_in_time && record.check_out_time 
        ? `${Math.round((new Date(record.check_out_time) - new Date(record.check_in_time)) / (1000 * 60 * 60) * 10) / 10}h`
        : '-',
      notes: record.notes || (isRTL ? 'لا توجد ملاحظات' : 'Aucune note')
    };

    const message = isRTL 
      ? `تفاصيل الحضور:\n\nالطفل: ${details.enfant}\nالعمر: ${details.age}\nالتاريخ: ${details.date}\nوقت الوصول: ${details.arrivee}\nوقت المغادرة: ${details.depart}\nالمدة: ${details.duree}\nالملاحظات: ${details.notes}`
      : `Détails de présence:\n\nEnfant: ${details.enfant}\nÂge: ${details.age}\nDate: ${details.date}\nArrivée: ${details.arrivee}\nDépart: ${details.depart}\nDurée: ${details.duree}\nNotes: ${details.notes}`;

    alert(message);
  };

  // Fonction pour exporter en CSV
  const exportToCSV = () => {
    if (filteredAttendance.length === 0) {
      return;
    }

    const headers = [
      isRTL ? 'الطفل' : 'Enfant',
      isRTL ? 'العمر' : 'Âge', 
      isRTL ? 'التاريخ' : 'Date',
      isRTL ? 'وقت الوصول' : 'Heure arrivée',
      isRTL ? 'وقت المغادرة' : 'Heure départ',
      isRTL ? 'المدة (ساعات)' : 'Durée (heures)',
      isRTL ? 'الحالة' : 'Statut',
      isRTL ? 'ملاحظات' : 'Notes'
    ];

    const csvData = filteredAttendance.map(record => {
      const status = getRecordStatus(record);
      const duration = record.check_in_time && record.check_out_time 
        ? Math.round((new Date(record.check_out_time) - new Date(record.check_in_time)) / (1000 * 60 * 60) * 10) / 10
        : '';

      return [
        `${record.child?.first_name} ${record.child?.last_name}`,
        calculateAge(record.child?.birth_date),
        formatDate(record.date || selectedDate),
        formatTime(record.check_in_time),
        formatTime(record.check_out_time),
        duration ? `${duration}h` : '',
        getStatusLabel(status),
        record.notes || ''
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `presences_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logique de filtrage
  const filteredAttendance = attendanceData?.filter(record => {
    const matchesSearch = record.child?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.child?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const status = getRecordStatus(record);
      matchesStatus = status === filterStatus;
    }
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تصفية البيانات' : 'Filtres'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sélecteur de date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'التاريخ' : 'Date'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'البحث' : 'Recherche'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isRTL ? 'البحث عن طفل...' : 'Rechercher un enfant...'}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'الحالة' : 'Statut'}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">{isRTL ? 'الكل' : 'Tous'}</option>
                <option value="present">{isRTL ? 'حاضر' : 'Présent'}</option>
                <option value="absent">{isRTL ? 'غائب' : 'Absent'}</option>
                <option value="completed">{isRTL ? 'مكتمل' : 'Terminé'}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'سجل الحضور' : 'Historique des présences'}
              <span className="ml-2 rtl:ml-0 rtl:mr-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full text-sm">
                {filteredAttendance.length}
              </span>
            </CardTitle>
            
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={filteredAttendance.length === 0}
              >
                <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'تصدير CSV' : 'Exporter CSV'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? 'لا توجد سجلات للتاريخ المحدد' : 'Aucun enregistrement pour cette date'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'الطفل' : 'Enfant'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'العمر' : 'Âge'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'وقت الوصول' : 'Arrivée'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'وقت المغادرة' : 'Départ'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'المدة' : 'Durée'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAttendance.map((record) => {
                    const status = getRecordStatus(record);
                    const duration = record.check_in_time && record.check_out_time 
                      ? Math.round((new Date(record.check_out_time) - new Date(record.check_in_time)) / (1000 * 60 * 60 * 100)) / 10
                      : null;

                    return (
                      <motion.tr
                        key={`${record.child_id}-${record.date}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                              <Baby className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="ml-3 rtl:ml-0 rtl:mr-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {record.child?.first_name} {record.child?.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {calculateAge(record.child?.birth_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatTime(record.check_in_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatTime(record.check_out_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {duration ? `${duration}h` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span className="ml-1 rtl:ml-0 rtl:mr-1">
                              {getStatusLabel(status)}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(record)}
                            title={isRTL ? 'عرض التفاصيل' : 'Voir les détails'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorySection;
