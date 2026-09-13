/**
 * Utilitaire de géolocalisation IP (offline, sans appel externe)
 * Utilise geoip-lite (base MaxMind GeoLite2 embarquée)
 */

const geoip = require('geoip-lite');

// Noms de pays en français pour les cas les plus fréquents (Tunisie / France)
const COUNTRY_NAMES_FR = {
  TN: 'Tunisie',
  FR: 'France',
  US: 'États-Unis',
  DE: 'Allemagne',
  GB: 'Royaume-Uni',
  IT: 'Italie',
  ES: 'Espagne',
  CA: 'Canada',
  MA: 'Maroc',
  DZ: 'Algérie',
  BE: 'Belgique',
  CH: 'Suisse',
  NL: 'Pays-Bas'
};

/**
 * Vérifie si une IP est locale/privée (non géolocalisable)
 */
function isPrivateIp(ip) {
  if (!ip) return true;
  const cleaned = ip.replace('::ffff:', '');
  return (
    cleaned === '127.0.0.1' ||
    cleaned === '::1' ||
    cleaned.startsWith('10.') ||
    cleaned.startsWith('192.168.') ||
    cleaned.startsWith('172.16.') ||
    cleaned === 'localhost'
  );
}

/**
 * Récupère le pays (code + nom) à partir d'une adresse IP
 * @param {string} ip
 * @returns {{code: string|null, name: string}}
 */
function getCountryFromIp(ip) {
  if (isPrivateIp(ip)) {
    return { code: null, name: 'Local' };
  }

  try {
    // geoip-lite n'accepte pas le préfixe IPv6-mapped
    const cleanIp = ip.replace('::ffff:', '');
    const result = geoip.lookup(cleanIp);

    if (!result || !result.country) {
      return { code: null, name: 'Inconnu' };
    }

    return {
      code: result.country,
      name: COUNTRY_NAMES_FR[result.country] || result.country
    };
  } catch (error) {
    return { code: null, name: 'Inconnu' };
  }
}

module.exports = { getCountryFromIp, isPrivateIp };
