import { createContext, useContext, useEffect } from 'react';
import { useDialog } from '../hooks/useDialog';
import Dialog from '../components/ui/Dialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { listenToDialogEvents } from '../utils/dialogHelper';

const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
    const dialog = useDialog();

    // Écouter les événements de dialog depuis les services/utils
    useEffect(() => {
        const cleanup = listenToDialogEvents((type, message, options) => {
            dialog[type]?.(message, options);
        });
        return cleanup;
    }, [dialog]);

    return (
        <DialogContext.Provider value={dialog}>
            {children}

            {/* Render all active notification dialogs */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[10000] space-y-2 w-[calc(100%-2rem)] sm:w-auto max-w-md">
                {dialog.dialogs.map((d, index) => (
                    <div
                        key={d.id}
                        style={{ transform: `translateY(${index * 10}px)` }}
                    >
                        <Dialog
                            isOpen={true}
                            onClose={() => dialog.hideDialog(d.id)}
                            type={d.type}
                            title={d.title}
                            message={d.message}
                            autoClose={d.autoClose}
                            duration={d.duration}
                        />
                    </div>
                ))}
            </div>

            {/* Render confirmation dialog */}
            {dialog.confirmDialog && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={dialog.confirmDialog.onCancel}
                    onConfirm={dialog.confirmDialog.onConfirm}
                    title={dialog.confirmDialog.title}
                    message={dialog.confirmDialog.message}
                    type={dialog.confirmDialog.type}
                    confirmText={dialog.confirmDialog.confirmText}
                    cancelText={dialog.confirmDialog.cancelText}
                />
            )}
        </DialogContext.Provider>
    );
};

export const useDialogContext = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialogContext must be used within DialogProvider');
    }
    return context;
};
