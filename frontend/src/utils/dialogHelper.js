/**
 * Helper pour afficher des dialogs depuis des fichiers non-React (services, utils, etc.)
 * Utilise un système d'événements pour communiquer avec le DialogContext
 */

// Événement personnalisé pour les dialogs
const DIALOG_EVENT = 'app:dialog';

/**
 * Affiche un dialog depuis n'importe où dans l'application
 * @param {string} type - Type de dialog: 'success', 'error', 'warning', 'info'
 * @param {string} message - Message à afficher
 * @param {object} options - Options supplémentaires (title, duration, etc.)
 */
export const showDialog = (type, message, options = {}) => {
    const event = new CustomEvent(DIALOG_EVENT, {
        detail: { type, message, options }
    });
    window.dispatchEvent(event);
};

/**
 * Raccourcis pour les différents types de dialogs
 */
export const dialogHelper = {
    success: (message, options) => showDialog('success', message, options),
    error: (message, options) => showDialog('error', message, options),
    warning: (message, options) => showDialog('warning', message, options),
    info: (message, options) => showDialog('info', message, options),
};

/**
 * Écoute les événements de dialog (à utiliser dans DialogContext)
 * @param {function} callback - Fonction appelée quand un dialog doit être affiché
 * @returns {function} Fonction de nettoyage
 */
export const listenToDialogEvents = (callback) => {
    const handler = (event) => {
        const { type, message, options } = event.detail;
        callback(type, message, options);
    };

    window.addEventListener(DIALOG_EVENT, handler);

    // Retourne la fonction de nettoyage
    return () => window.removeEventListener(DIALOG_EVENT, handler);
};

export default dialogHelper;
