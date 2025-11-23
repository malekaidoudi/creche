import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Dialog = ({ isOpen, onClose, type = 'info', title, message, autoClose = true, duration = 3000 }) => {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, duration, onClose]);

    if (!isOpen) return null;

    // S'assurer que le titre et le message sont des chaînes
    const displayTitle = title
        ? (typeof title === 'string' ? title : String(title))
        : undefined;

    const displayMessage = typeof message === 'string'
        ? message
        : typeof message === 'object'
            ? JSON.stringify(message, null, 2)
            : String(message);

    const typeStyles = {
        success: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
            text: 'text-green-800 dark:text-green-200'
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
            text: 'text-red-800 dark:text-red-200'
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
            text: 'text-yellow-800 dark:text-yellow-200'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
            text: 'text-blue-800 dark:text-blue-200'
        }
    };

    const style = typeStyles[type] || typeStyles.info;

    return (
        <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-top-2 duration-300">
            <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {style.icon}
                    </div>
                    <div className="flex-1">
                        {displayTitle && (
                            <h3 className={`font-semibold ${style.text} mb-1`}>
                                {displayTitle}
                            </h3>
                        )}
                        <p className={`text-sm ${style.text} whitespace-pre-wrap`}>
                            {displayMessage}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dialog;
