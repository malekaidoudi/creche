import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  Baby, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  X,
  AlertTriangle,
  FileEdit
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatTime, formatDate, calculateDuration } from '../../utils/dateUtils';
import { useDialogContext } from '../../contexts/DialogContext';
import attendanceService from '../../services/attendanceService';

const HistorySection = ({ 
  attendanceData = [], 
  allChildren = [],
  attendanceMode = 'hourly',
  selectedDate, 
  onDateChange, 
  searchTerm, 
  onSearchChange,
  filterStatus,
  onFilterChange,
  onUpdateSuccess
}) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();

  // États pour la modale d'édition / correction
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'present',
    check_in_time: '',
    check_out_time: '',
    notes: ''
  });

  // États pour la modale d'ajout d'une présence rétroactive
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    child_id: '',
    status: 'present',
    check_in_time: '',
    check_out_time: '',
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Enfants qui n'ont pas encore d'enregistrement sur la date sélectionnée
  const unrecordedChildren = useMemo(() => {
    const recordedIds = new Set(attendanceData.map(a => a.child_id));
    return allChildren.filter(c => !recordedIds.has(c.id));
  }, [allChildren, attendanceData]);

  // Fonctions utilitaires
  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
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

  const getRecordStatus = (record) => {
    if (!record) return 'absent';
    if (record.status === 'absent') return 'absent';
    
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
    
    if (record.status === 'present' && !hasCheckIn) return 'present';
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

  // Ouverture modale d'édition
  const handleOpenEdit = (record) => {
    setEditingRecord(record);

    let inTime = '';
    if (record.check_in_time) {
      const d = new Date(record.check_in_time);
      if (!isNaN(d.getTime())) {
        inTime = d.toTimeString().slice(0, 5);
      }
    }
    let outTime = '';
    if (record.check_out_time) {
      const d = new Date(record.check_out_time);
      if (!isNaN(d.getTime())) {
        outTime = d.toTimeString().slice(0, 5);
      }
    }

    setEditForm({
      status: record.status || (record.check_in_time ? 'present' : 'absent'),
      check_in_time: inTime,
      check_out_time: outTime,
      notes: record.notes || ''
    });
    setEditModalOpen(true);
  };

  // Sauvegarde rectification
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setActionLoading(true);
    try {
      let checkInIso = null;
      let checkOutIso = null;
      if (editForm.status === 'present') {
        if (editForm.check_in_time) {
          checkInIso = `${selectedDate} ${editForm.check_in_time}:00`;
        }
        if (editForm.check_out_time) {
          checkOutIso = `${selectedDate} ${editForm.check_out_time}:00`;
        }
      }

      await attendanceService.updateAttendance(editingRecord.id, {
        status: editForm.status,
        check_in_time: checkInIso,
        check_out_time: checkOutIso,
        notes: editForm.notes
      });

      dialog.success(isRTL ? 'تم تعديل الحضور بنجاح' : 'Pointage rectifié avec succès');
      setEditModalOpen(false);
      setEditingRecord(null);
      onUpdateSuccess?.();
    } catch (err) {
      console.error('Erreur rectification:', err);
      dialog.error(err.response?.data?.error || (isRTL ? 'خطأ في التعديل' : 'Erreur lors de la modification'));
    } finally {
      setActionLoading(false);
    }
  };

  // Suppression / remise en absent
  const handleDeleteRecord = async (record) => {
    const childName = `${record.child_first_name || record.child?.first_name || ''} ${record.child_last_name || record.child?.last_name || ''}`;
    const confirmed = await dialog.confirm(
      isRTL 
        ? `هل أنت متأكد من إلغاء حضور ${childName} (إرجاعه كغائب) ؟` 
        : `Êtes-vous sûr(e) d'annuler le pointage de ${childName} (remise à l'état absent) ?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await attendanceService.deleteAttendance(record.id);
      dialog.success(isRTL ? 'تم إلغاء الحضور' : 'Pointage annulé');
      onUpdateSuccess?.();
    } catch (err) {
      console.error('Erreur annulation:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(false);
    }
  };

  // Sauvegarde ajout présence rétroactive
  const handleSaveAdd = async () => {
    if (!addForm.child_id) {
      dialog.warning(isRTL ? 'يرجى اختيار طفل' : 'Veuillez sélectionner un enfant');
      return;
    }
    setActionLoading(true);
    try {
      let checkInIso = null;
      let checkOutIso = null;
      if (addForm.status === 'present') {
        if (addForm.check_in_time) {
          checkInIso = `${selectedDate} ${addForm.check_in_time}:00`;
        }
        if (addForm.check_out_time) {
          checkOutIso = `${selectedDate} ${addForm.check_out_time}:00`;
        }
      }

      await attendanceService.togglePresence(addForm.child_id, {
        date: selectedDate,
        target_status: addForm.status,
        check_in_time: checkInIso,
        check_out_time: checkOutIso,
        notes: addForm.notes ? `${addForm.notes} | [Rectification manuelle]` : '[Rectification manuelle]'
      });

      dialog.success(isRTL ? 'تم تسجيل الحضور' : 'Pointage enregistré avec succès');
      setAddModalOpen(false);
      setAddForm({ child_id: '', status: 'present', check_in_time: '', check_out_time: '', notes: '' });
      onUpdateSuccess?.();
    } catch (err) {
      console.error('Erreur ajout présence:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setActionLoading(false);
    }
  };

  // Détails d'un enregistrement
  const handleViewDetails = (record) => {
    const details = {
      enfant: `${record.child_first_name || record.child?.first_name} ${record.child_last_name || record.child?.last_name}`,
      age: calculateAge(record.child_birth_date || record.child?.birth_date),
      date: formatDate(record.date || selectedDate, isRTL),
      arrivee: formatTime(record.check_in_time, isRTL),
      depart: formatTime(record.check_out_time, isRTL),
      duree: calculateDuration(record.check_in_time, record.check_out_time) 
        ? `${calculateDuration(record.check_in_time, record.check_out_time)}h`
        : '-',
      notes: record.notes || (isRTL ? 'لا توجد ملاحظات' : 'Aucune note')
    };

    const message = isRTL 
      ? `تفاصيل الحضور:\n\nالطفل: ${details.enfant}\nالعمر: ${details.age}\nالتاريخ: ${details.date}\nوقت الوصول: ${details.arrivee}\nوقت المغادرة: ${details.depart}\nالمدة: ${details.duree}\nالملاحظات: ${details.notes}`
      : `Détails de présence:\n\nEnfant: ${details.enfant}\nÂge: ${details.age}\nDate: ${details.date}\nArrivée: ${details.arrivee}\nDépart: ${details.depart}\nDurée: ${details.duree}\nNotes: ${details.notes}`;

    dialog.showDialog('info', message, isRTL ? 'تفاصيل الحضور' : 'Détails de présence', { autoClose: false });
  };

  // Export CSV
  const exportToCSV = () => {
    if (filteredAttendance.length === 0) return;

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
      const duration = calculateDuration(record.check_in_time, record.check_out_time);

      return [
        `${record.child_first_name || record.child?.first_name} ${record.child_last_name || record.child?.last_name}`,
        calculateAge(record.child_birth_date || record.child?.birth_date),
        formatDate(record.date || selectedDate, isRTL),
        formatTime(record.check_in_time, isRTL),
        formatTime(record.check_out_time, isRTL),
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

  // Filtrage
  const filteredAttendance = attendanceData?.filter(record => {
    const firstName = record.child_first_name || record.child?.first_name || '';
    const lastName = record.child_last_name || record.child?.last_name || '';
    const matchesSearch = firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const status = getRecordStatus(record);
      matchesStatus = status === filterStatus;
    }
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Filtres & Recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تصفية البيانات والتحكم بالتواريخ' : 'Filtres & Sélection de Date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sélecteur de date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'التاريخ المراد تصحيحه' : 'Date à consulter / rectifier'}
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
                {isRTL ? 'البحث عن طفل' : 'Recherche par nom'}
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
                {isRTL ? 'الحالة' : 'Filtrer par statut'}
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

      {/* Tableau de présence & rectification */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center flex-wrap gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <span>{isRTL ? 'سجل الحضور والتصحيح' : 'Tableau de présence & correction'}</span>
              <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                {filteredAttendance.length} {isRTL ? 'سجلات' : 'enregistrements'}
              </span>
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <PlusCircle className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                {isRTL ? 'إضافة / تصحيح لطفل' : '+ Rectifier / Ajouter présence'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={filteredAttendance.length === 0}
              >
                <Download className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                {isRTL ? 'تصدير CSV' : 'Exporter CSV'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {isRTL ? 'لا توجد سجلات لهذا التاريخ' : 'Aucun enregistrement pour cette date'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(true)}
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                {isRTL ? 'تسجيل حضور طفل لهذا اليوم' : 'Enregistrer une présence pour cette date'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الطفل' : 'Enfant'}
                    </th>
                    <th className="px-3 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'العمر' : 'Âge'}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'وقت الوصول' : 'Arrivée'}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'وقت المغادرة' : 'Départ'}
                    </th>
                    <th className="px-3 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'المدة' : 'Durée'}
                    </th>
                    <th className="px-3 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'ملاحظة' : 'Note'}
                    </th>
                    <th className="px-4 py-3 text-right rtl:text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions / Correction'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAttendance.map((record) => {
                    const status = getRecordStatus(record);
                    const duration = calculateDuration(record.check_in_time, record.check_out_time);

                    return (
                      <motion.tr
                        key={`${record.child_id}-${record.date || selectedDate}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                              <Baby className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {record.child_first_name || record.child?.first_name} {record.child_last_name || record.child?.last_name}
                              </div>
                              {record.is_exceptional_saturday && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.2 rounded font-medium">
                                  {isRTL ? 'سبت استثنائي' : 'Samedi exceptionnel'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          {calculateAge(record.child_birth_date || record.child?.birth_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                          {formatTime(record.check_in_time, isRTL)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                          {formatTime(record.check_out_time, isRTL)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                          {duration ? `${duration}h` : '-'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span>{getStatusLabel(status)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 max-w-[150px] truncate" title={record.notes}>
                          {record.notes || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right rtl:text-left">
                          <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                            <button 
                              type="button"
                              onClick={() => handleViewDetails(record)}
                              title={isRTL ? 'عرض التفاصيل' : 'Détails'}
                              className="compact-btn icon-only inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleOpenEdit(record)}
                              title={isRTL ? 'تصحيح هذا السجل' : 'Corriger ce pointage'}
                              className="compact-btn icon-only inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteRecord(record)}
                              title={isRTL ? 'إلغاء الحضور / تحويل لغائب' : 'Annuler / Marquer absent'}
                              className="compact-btn icon-only inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal Rectification d'un pointage existant */}
      <AnimatePresence>
        {editModalOpen && editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {isRTL ? 'تصحيح حضور طفل' : 'Rectification de pointage'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {editingRecord.child_first_name || editingRecord.child?.first_name} {editingRecord.child_last_name || editingRecord.child?.last_name} • {formatDate(selectedDate, isRTL)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Statut */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'الحالة' : 'Statut'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, status: 'present' }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${editForm.status === 'present'
                          ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600'}`}
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{isRTL ? 'حاضر' : 'Présent'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, status: 'absent' }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${editForm.status === 'absent'
                          ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600'}`}
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{isRTL ? 'غائب' : 'Absent'}</span>
                    </button>
                  </div>
                </div>

                {editForm.status === 'present' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? 'وقت الوصول (اختياري)' : 'Heure d\'arrivée'}
                        <span className="text-[10px] text-gray-400 block font-normal">(Optionnel)</span>
                      </label>
                      <input
                        type="time"
                        value={editForm.check_in_time}
                        onChange={(e) => setEditForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="07:00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? 'وقت المغادرة (اختياري)' : 'Heure de départ'}
                        <span className="text-[10px] text-gray-400 block font-normal">(Optionnel)</span>
                      </label>
                      <input
                        type="time"
                        value={editForm.check_out_time}
                        onChange={(e) => setEditForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="18:00"
                      />
                    </div>
                  </div>
                )}

                {/* Motif / Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'سبب التصحيح / ملاحظات' : 'Motif de correction / Notes'}
                  </label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRTL ? 'مثال: نسيان تسجيل الحضور...' : 'Ex: Oubli de pointage, correction éducatrice...'}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {isRTL ? 'تحديد الساعة اختياري — سيتم احتساب ساعات الدوام التلقائية' : 'Préciser l\'heure n\'est pas obligatoire (les horaires contractuels s\'appliquent).'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : (isRTL ? 'حفظ التعديل' : 'Enregistrer')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ajout / Régularisation rétroactive d'un enfant */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {isRTL ? 'تسجيل حضور جديد لتاريخ سابق' : 'Ajouter un pointage pour cette date'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedDate, isRTL)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Sélection de l'enfant */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'اختر الطفل' : 'Sélectionner l\'enfant'} *
                  </label>
                  <select
                    value={addForm.child_id}
                    onChange={(e) => setAddForm(prev => ({ ...prev, child_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{isRTL ? '-- اختر طفلاً --' : '-- Sélectionner un enfant --'}</option>
                    {(unrecordedChildren.length > 0 ? unrecordedChildren : allChildren).map(child => (
                      <option key={child.id} value={child.id}>
                        {child.first_name} {child.last_name} ({child.care_schedule === 'half_day' ? 'Mi-journée' : 'Journée'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'الحالة' : 'Statut'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddForm(prev => ({ ...prev, status: 'present' }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${addForm.status === 'present'
                          ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600'}`}
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{isRTL ? 'حاضر' : 'Présent'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddForm(prev => ({ ...prev, status: 'absent' }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${addForm.status === 'absent'
                          ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600'}`}
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{isRTL ? 'غائب' : 'Absent'}</span>
                    </button>
                  </div>
                </div>

                {addForm.status === 'present' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? 'وقت الوصول' : 'Heure d\'arrivée'}
                        <span className="text-[10px] text-gray-400 block font-normal">(Optionnel)</span>
                      </label>
                      <input
                        type="time"
                        value={addForm.check_in_time}
                        onChange={(e) => setAddForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="07:00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? 'وقت المغادرة' : 'Heure de départ'}
                        <span className="text-[10px] text-gray-400 block font-normal">(Optionnel)</span>
                      </label>
                      <input
                        type="time"
                        value={addForm.check_out_time}
                        onChange={(e) => setAddForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="18:00"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'ملاحظة' : 'Motif / Remarque'}
                  </label>
                  <input
                    type="text"
                    value={addForm.notes}
                    onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRTL ? 'مثال: تسوية حضور سابق...' : 'Ex: Régularisation de présence passée...'}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {isRTL ? 'تحديد الساعة اختياري — سيتم تطبيق الساعات العادية تلقائياً' : 'Préciser l\'heure n\'est pas obligatoire (même en mode horaire).'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAdd}
                  disabled={actionLoading || !addForm.child_id}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : (isRTL ? 'تسجيل' : 'Enregistrer')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistorySection;
