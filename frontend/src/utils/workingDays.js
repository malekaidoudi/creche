/**
 * Utilitaire pour calculer le prochain jour ouvré
 * Exclut: samedi, dimanche, jours fériés, vacances
 */

import api from '../services/api';

// Cache pour les jours fériés (évite les appels API répétés)
let holidaysCache = null;
let holidaysCacheExpiry = null;

/**
 * Récupère les jours fériés depuis l'API
 * @returns {Promise<Array>} Liste des jours fériés avec leurs dates
 */
export const fetchHolidays = async () => {
    // Utiliser le cache si valide (1 heure)
    if (holidaysCache && holidaysCacheExpiry && Date.now() < holidaysCacheExpiry) {
        return holidaysCache;
    }

    try {
        const response = await api.get('/api/holidays');
        if (response.data.success) {
            holidaysCache = response.data.holidays || [];
            holidaysCacheExpiry = Date.now() + 60 * 60 * 1000; // 1 heure
            return holidaysCache;
        }
    } catch (error) {
        console.error('Erreur chargement jours fériés:', error);
    }
    return [];
};

/**
 * Vérifie si une date est un jour férié
 * @param {Date} date - Date à vérifier
 * @param {Array} holidays - Liste des jours fériés
 * @returns {boolean}
 */
export const isHoliday = (date, holidays) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => {
        const holidayDate = h.date?.split('T')[0];
        return holidayDate === dateStr;
    });
};

/**
 * Vérifie si une date est un weekend (samedi ou dimanche)
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
};

/**
 * Vérifie si une date est un jour ouvré
 * @param {Date} date - Date à vérifier
 * @param {Array} holidays - Liste des jours fériés
 * @returns {boolean}
 */
export const isWorkingDay = (date, holidays) => {
    return !isWeekend(date) && !isHoliday(date, holidays);
};

/**
 * Calcule le prochain jour ouvré à partir d'une date
 * @param {Date} startDate - Date de départ (par défaut: demain)
 * @param {Array} holidays - Liste des jours fériés (optionnel, sera chargé si non fourni)
 * @returns {Promise<Date>} Le prochain jour ouvré
 */
export const getNextWorkingDay = async (startDate = null, holidays = null) => {
    // Si pas de jours fériés fournis, les charger
    if (!holidays) {
        holidays = await fetchHolidays();
    }

    // Date de départ: demain par défaut
    let date = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
        date.setDate(date.getDate() + 1); // Demain
    }

    // Réinitialiser l'heure à minuit
    date.setHours(0, 0, 0, 0);

    // Chercher le prochain jour ouvré (max 30 jours pour éviter boucle infinie)
    let attempts = 0;
    while (!isWorkingDay(date, holidays) && attempts < 30) {
        date.setDate(date.getDate() + 1);
        attempts++;
    }

    return date;
};

/**
 * Formate une date en format dd/mm/yyyy
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée
 */
export const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Calcule et retourne le prochain jour ouvré formaté en dd/mm/yyyy
 * @returns {Promise<string>} Date formatée du prochain jour ouvré
 */
export const getNextWorkingDayFormatted = async () => {
    const nextWorkingDay = await getNextWorkingDay();
    return formatDateDDMMYYYY(nextWorkingDay);
};

export default {
    fetchHolidays,
    isHoliday,
    isWeekend,
    isWorkingDay,
    getNextWorkingDay,
    formatDateDDMMYYYY,
    getNextWorkingDayFormatted
};
