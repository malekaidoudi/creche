import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import AbsenceFormModal from './AbsenceFormModal';

const CalendarPicker = ({ 
  selectedDate, 
  onDateSelect, 
  children, 
  selectedChild, 
  onChildSelect,
  reason,
  onReasonChange,
  notes,
  onNotesChange,
  onSubmit,
  submitting 
}) => {
  const { isRTL } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const absenceReasons = [
    { value: 'sick', label: isRTL ? 'مرض' : 'Maladie' },
    { value: 'vacation', label: isRTL ? 'عطلة' : 'Vacances' },
    { value: 'medical_visit', label: isRTL ? 'زيارة طبية' : 'Visite médicale' },
    { value: 'family_event', label: isRTL ? 'حدث عائلي' : 'Événement familial' },
    { value: 'other', label: isRTL ? 'أخرى' : 'Autre' }
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      onDateSelect(date);
      setShowModal(true);
    }
  };

  const handleModalSubmit = () => {
    if (selectedDate && selectedChild && reason) {
      onSubmit();
      setShowModal(false);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'اختر تاريخ الغياب' : 'Sélectionner la date d\'absence'}
            </CardTitle>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {currentMonth.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {isRTL ? 
                  ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].indexOf(day)] 
                  : day
                }
              </div>
            ))}
          </div>
          
          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isPast = day < today;
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  disabled={isPast}
                  className={`
                    p-3 min-h-[50px] border rounded-lg text-sm font-medium transition-all duration-200
                    ${isPast 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'hover:bg-primary-50 hover:border-primary-300 cursor-pointer'
                    }
                    ${isSelected 
                      ? 'bg-primary-500 text-white border-primary-500' 
                      : 'bg-white border-gray-200'
                    }
                    ${isWeekend && !isPast && !isSelected 
                      ? 'bg-gray-50 text-gray-600' 
                      : ''
                    }
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          
          {selectedDate && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <Clock className="w-4 h-4 inline mr-1" />
                {isRTL ? 'التاريخ المحدد:' : 'Date sélectionnée:'} {' '}
                <span className="font-medium">
                  {selectedDate.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulaire */}
      <AbsenceFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedDate={selectedDate}
        children={children}
        selectedChild={selectedChild}
        onChildSelect={onChildSelect}
        reason={reason}
        onReasonChange={onReasonChange}
        notes={notes}
        onNotesChange={onNotesChange}
        onSubmit={handleModalSubmit}
        submitting={submitting}
      />
    </div>
  );
};

export default CalendarPicker;
