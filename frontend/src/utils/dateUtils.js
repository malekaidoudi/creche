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
    // Parser directement avec new Date (gère ISO 8601, timestamps, etc.)
    const date = new Date(timeString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return '-';
    }

    // Formater en heure locale
    return date.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Tunis' // Fuseau horaire de la Tunisie
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

/**
 * Formate une saisie date avec slash automatique JJ/MM/AAAA
 * @param {string} rawValue - Valeur brute saisie par l'utilisateur
 * @returns {string} Valeur formatée avec slashes
 */
export const formatDateInput = (rawValue) => {
  if (!rawValue) return '';

  // Garder uniquement les chiffres
  const digits = rawValue.replace(/\D/g, '');

  let formatted = digits;
  if (digits.length >= 2) {
    formatted = digits.slice(0, 2) + '/' + digits.slice(2);
  }
  if (digits.length >= 4) {
    formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
  }
  if (formatted.length > 10) {
    formatted = formatted.slice(0, 10);
  }

  return formatted;
};

/**
 * Vérifie si une date au format dd/mm/yyyy est valide
 * @param {string} ddmmyyyy - Date au format dd/mm/yyyy
 * @returns {boolean} true si valide
 */
export const isValidDateFormat = (ddmmyyyy) => {
  if (!ddmmyyyy || ddmmyyyy.length !== 10) return false;

  const regex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
  if (!regex.test(ddmmyyyy)) return false;

  const [day, month, year] = ddmmyyyy.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

/**
 * Convertit une date dd/mm/yyyy en yyyy-mm-dd (format ISO pour backend)
 * @param {string} ddmmyyyy - Date au format dd/mm/yyyy
 * @returns {string} Date au format yyyy-mm-dd ou chaîne vide si invalide
 */
export const convertToISO = (ddmmyyyy) => {
  if (!ddmmyyyy) return '';

  try {
    // Si déjà au format ISO (yyyy-mm-dd), retourner tel quel
    if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) {
      return ddmmyyyy;
    }

    // Convertir dd/mm/yyyy → yyyy-mm-dd
    const parts = ddmmyyyy.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return '';
  } catch (error) {
    console.error('Erreur convertToISO:', error, 'pour:', ddmmyyyy);
    return '';
  }
};

/**
 * Convertit une date yyyy-mm-dd en dd/mm/yyyy (format français)
 * @param {string} yyyymmdd - Date au format yyyy-mm-dd
 * @returns {string} Date au format dd/mm/yyyy ou chaîne vide si invalide
 */
export const convertFromISO = (yyyymmdd) => {
  if (!yyyymmdd) return '';

  try {
    // Si déjà au format dd/mm/yyyy, retourner tel quel
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(yyyymmdd)) {
      return yyyymmdd;
    }

    // Convertir yyyy-mm-dd → dd/mm/yyyy
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    return '';
  } catch (error) {
    console.error('Erreur convertFromISO:', error, 'pour:', yyyymmdd);
    return '';
  }
};

/**
 * Calcule l'âge à partir d'une date de naissance (supporte dd/mm/yyyy et yyyy-mm-dd)
 * @param {string} birthDate - Date de naissance
 * @param {boolean} isRTL - Si l'interface est en RTL
 * @returns {string} Âge formaté ou chaîne vide si invalide
 */
export const calculateAge = (birthDate, isRTL = false) => {
  if (!birthDate) return '';

  try {
    let birth;

    // Détecter le format et convertir en Date
    if (birthDate.includes('/')) {
      // Format dd/mm/yyyy
      const [day, month, year] = birthDate.split('/');
      birth = new Date(year, month - 1, day);
    } else if (birthDate.includes('-')) {
      // Format yyyy-mm-dd
      birth = new Date(birthDate);
    } else {
      return '';
    }

    if (isNaN(birth.getTime())) {
      return '';
    }

    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

    if (ageInMonths < 0) {
      return isRTL ? 'تاريخ غير صالح' : 'Date invalide';
    }

    if (ageInMonths < 12) {
      return `${ageInMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''} ${months > 0 ? `${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
    }
  } catch (error) {
    console.error('Erreur calculateAge:', error, 'pour:', birthDate);
    return '';
  }
};
