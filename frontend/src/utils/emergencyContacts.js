/**
 * Helpers pour les contacts d'urgence des enfants
 *
 * Modèle unifié : quand `emergency_contact_choice` vaut 'father' ou 'mother',
 * les coordonnées réelles sont portées par les champs father_name/father_phone
 * ou mother_name/mother_phone (et non par emergency_contact_name/phone,
 * réservés au choix 'custom').
 */

/**
 * Résout le nom et le téléphone du contact d'urgence à afficher.
 * @param {Object} child - Objet enfant (peut être null)
 * @returns {{ name: string|null, phone: string|null }}
 */
export const getEmergencyContactDisplay = (child) => {
  if (!child) return { name: null, phone: null };

  if (child.emergency_contact_choice === 'father') {
    return { name: child.father_name || null, phone: child.father_phone || null };
  }

  if (child.emergency_contact_choice === 'mother') {
    return { name: child.mother_name || null, phone: child.mother_phone || null };
  }

  return {
    name: child.emergency_contact_name || null,
    phone: child.emergency_contact_phone || null
  };
};
