import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler', type = 'danger' }) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            icon: 'text-red-600 dark:text-red-400',
            button: 'bg-red-600 hover:bg-red-700 text-white'
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            icon: 'text-yellow-600 dark:text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: 'text-blue-600 dark:text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    };

    const style = typeStyles[type] || typeStyles.danger;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`${style.bg} px-6 py-4 rounded-t-lg border-b border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className={`w-6 h-6 ${style.icon}`} />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <p className="text-gray-700 dark:text-gray-300">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${style.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
