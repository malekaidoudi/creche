import { useState, useCallback } from 'react';

export const useDialog = () => {
    const [dialogs, setDialogs] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const showDialog = useCallback((type, message, title = '', options = {}) => {
        const id = Date.now() + Math.random();
        const dialog = {
            id,
            type,
            message,
            title,
            autoClose: options.autoClose !== false,
            duration: options.duration || 3000
        };

        setDialogs(prev => [...prev, dialog]);

        return id;
    }, []);

    const hideDialog = useCallback((id) => {
        setDialogs(prev => prev.filter(d => d.id !== id));
    }, []);

    const success = useCallback((message, title = 'Succès') => {
        return showDialog('success', message, title);
    }, [showDialog]);

    const error = useCallback((message, title = 'Erreur') => {
        return showDialog('error', message, title);
    }, [showDialog]);

    const warning = useCallback((message, title = 'Attention') => {
        return showDialog('warning', message, title);
    }, [showDialog]);

    const info = useCallback((message, title = 'Information') => {
        return showDialog('info', message, title);
    }, [showDialog]);

    const confirm = useCallback((message, title = 'Confirmation', options = {}) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                message,
                title,
                type: options.type || 'danger',
                confirmText: options.confirmText || 'Confirmer',
                cancelText: options.cancelText || 'Annuler',
                onConfirm: () => {
                    setConfirmDialog(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmDialog(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return {
        dialogs,
        confirmDialog,
        showDialog,
        hideDialog,
        success,
        error,
        warning,
        info,
        confirm
    };
};
