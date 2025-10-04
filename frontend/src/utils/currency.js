/**
 * Utilitaires pour la gestion des devises
 */

/**
 * Formate un montant en dinar tunisien
 * @param {number} amount - Le montant à formater
 * @param {string} locale - La locale (par défaut 'fr-TN')
 * @returns {string} Le montant formaté
 */
export const formatTND = (amount, locale = 'fr-TN') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 TND'
  }

  try {
    // Utiliser Intl.NumberFormat pour un formatage correct
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    })
    
    return formatter.format(amount)
  } catch (error) {
    // Fallback si la locale n'est pas supportée
    return `${amount.toLocaleString()} TND`
  }
}

/**
 * Formate un montant simple avec TND
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté
 */
export const formatSimpleTND = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 TND'
  }
  
  return `${amount.toLocaleString()} TND`
}

/**
 * Parse un montant depuis une chaîne
 * @param {string} amountString - La chaîne contenant le montant
 * @returns {number} Le montant parsé
 */
export const parseAmount = (amountString) => {
  if (typeof amountString !== 'string') {
    return 0
  }
  
  // Supprimer les espaces, TND, et autres caractères non numériques sauf . et ,
  const cleanString = amountString.replace(/[^\d.,]/g, '')
  
  // Remplacer la virgule par un point pour le parsing
  const normalizedString = cleanString.replace(',', '.')
  
  const parsed = parseFloat(normalizedString)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Constantes pour les devises
 */
export const CURRENCY = {
  TND: 'TND',
  SYMBOL: 'د.ت', // Symbole du dinar tunisien en arabe
  NAME_FR: 'Dinar Tunisien',
  NAME_AR: 'دينار تونسي'
}

export default {
  formatTND,
  formatSimpleTND,
  parseAmount,
  CURRENCY
}
