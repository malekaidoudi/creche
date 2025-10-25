/**
 * Utilitaires pour le formatage des dates et heures
 */

/**
 * Formate une heure en format lisible
 * @param {string} timeString - Chaîne de temps (HH:mm:ss ou YYYY-MM-DD HH:mm:ss)
 * @param {boolean} isRTL - Si l'interface est en RTL
 * @returns {string} Heure formatée ou '-' si invalide
 */
export const formatTime = (timeString, isRTL = false) => {
  if (!timeString || timeString === 'null' || timeString === null || timeString === undefined) {
    return '-';
  }
  
  try {
    let date;
    
    // Si c'est déjà au format complet (YYYY-MM-DD HH:mm:ss)
    if (timeString.includes(' ')) {
      date = new Date(timeString);
    }
    // Si c'est juste l'heure (HH:mm:ss)
    else if (timeString.includes(':')) {
      const today = new Date().toISOString().split('T')[0];
      date = new Date(`${today}T${timeString}`);
    }
    // Sinon, essayer de parser directement
    else {
      date = new Date(timeString);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erreur formatTime:', error, 'pour:', timeString);
    return '-';
  }
};

/**
 * Formate une date en format lisible
 * @param {string} dateString - Chaîne de date
 * @param {boolean} isRTL - Si l'interface est en RTL
 * @returns {string} Date formatée ou '-' si invalide
 */
export const formatDate = (dateString, isRTL = false) => {
  if (!dateString || dateString === 'null' || dateString === null || dateString === undefined) {
    return '-';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR');
  } catch (error) {
    console.error('Erreur formatDate:', error, 'pour:', dateString);
    return '-';
  }
};

/**
 * Formate une date et heure complète
 * @param {string} dateTimeString - Chaîne de date et heure
 * @param {boolean} isRTL - Si l'interface est en RTL
 * @returns {string} Date et heure formatées ou '-' si invalide
 */
export const formatDateTime = (dateTimeString, isRTL = false) => {
  if (!dateTimeString || dateTimeString === 'null' || dateTimeString === null || dateTimeString === undefined) {
    return '-';
  }
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleString(isRTL ? 'ar-TN' : 'fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erreur formatDateTime:', error, 'pour:', dateTimeString);
    return '-';
  }
};

/**
 * Calcule la durée entre deux heures en heures
 * @param {string} startTime - Heure de début
 * @param {string} endTime - Heure de fin
 * @returns {number|null} Durée en heures ou null si invalide
 */
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime || startTime === 'null' || endTime === 'null') {
    return null;
  }
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    return Math.round(durationHours * 10) / 10; // Arrondir à 1 décimale
  } catch (error) {
    console.error('Erreur calculateDuration:', error);
    return null;
  }
};

/**
 * Vérifie si une date/heure est valide
 * @param {string} dateTimeString - Chaîne à vérifier
 * @returns {boolean} True si valide, false sinon
 */
export const isValidDateTime = (dateTimeString) => {
  if (!dateTimeString || dateTimeString === 'null' || dateTimeString === null || dateTimeString === undefined) {
    return false;
  }
  
  try {
    const date = new Date(dateTimeString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};
