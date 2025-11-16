import { useState } from 'react';
import { X, Calendar, CheckSquare, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const QuickEventModal = ({ isOpen, onClose, selectedDate, onTypeSelect }) => {
    const { isRTL } = useLanguage();

    const eventTypes = [
        {
            value: 'event',
            label: isRTL ? 'حدث' : 'Événement',
            icon: Calendar,
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600',
            description: isRTL ? 'إنشاء حدث جديد' : 'Créer un événement'
        },
        {
            value: 'task',
            label: isRTL ? 'مهمة' : 'Tâche',
            icon: CheckSquare,
            color: 'bg-green-500',
            hoverColor: 'hover:bg-green-600',
            description: isRTL ? 'إنشاء مهمة جديدة' : 'Créer une tâche'
        },
        {
            value: 'rdv',
            label: isRTL ? 'موعد' : 'Rendez-vous',
            icon: Stethoscope,
            color: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600',
            description: isRTL ? 'إنشاء موعد جديد' : 'Créer un rendez-vous'
        }
    ];

    const handleTypeSelect = (type) => {
        onTypeSelect(type);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isRTL ? 'إنشاء سريع' : 'Création Rapide'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Date sélectionnée */}
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {isRTL ? 'التاريخ المحدد' : 'Date sélectionnée'}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {new Date(selectedDate).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Type selection */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                            {isRTL ? 'اختر نوع العنصر الذي تريد إنشاءه' : 'Choisissez le type d\'élément à créer'}
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            {eventTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => handleTypeSelect(type.value)}
                                        className={`flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group ${type.hoverColor}`}
                                    >
                                        <div className={`${type.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                                {type.label}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {type.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {isRTL ? 'إلغاء' : 'Annuler'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickEventModal;
