/**
 * Libellés de poste du personnel avec accord de genre (masculin/féminin)
 * Utilisé partout où l'on affiche le rôle/poste d'un membre du personnel
 * (ex: fil d'activités, en-tête du dashboard, gestion du staff...)
 */

const STAFF_POSITIONS = {
  director: { male: { fr: 'Directeur', ar: 'مدير' }, female: { fr: 'Directrice', ar: 'مديرة' } },
  educator: { male: { fr: 'Éducateur', ar: 'مربي' }, female: { fr: 'Éducatrice', ar: 'مربية' } },
  assistant_educator: { male: { fr: 'Assistant éducateur', ar: 'مساعد مربي' }, female: { fr: 'Assistante éducatrice', ar: 'مساعدة مربية' } },
  nurse: { male: { fr: 'Infirmier', ar: 'ممرض' }, female: { fr: 'Infirmière', ar: 'ممرضة' } },
  psychologist: { male: { fr: 'Psychologue', ar: 'أخصائي نفسي' }, female: { fr: 'Psychologue', ar: 'أخصائية نفسية' } },
  cook: { male: { fr: 'Cuisinier', ar: 'طباخ' }, female: { fr: 'Cuisinière', ar: 'طباخة' } },
  cleaning: { male: { fr: 'Agent d\'entretien', ar: 'عامل نظافة' }, female: { fr: 'Agente d\'entretien', ar: 'عاملة نظافة' } },
  security: { male: { fr: 'Agent de sécurité', ar: 'حارس أمن' }, female: { fr: 'Agente de sécurité', ar: 'حارسة أمن' } },
  receptionist: { male: { fr: 'Réceptionniste', ar: 'موظف استقبال' }, female: { fr: 'Réceptionniste', ar: 'موظفة استقبال' } },
  driver: { male: { fr: 'Chauffeur', ar: 'سائق' }, female: { fr: 'Chauffeuse', ar: 'سائقة' } },
  other: { male: { fr: 'Autre', ar: 'آخر' }, female: { fr: 'Autre', ar: 'أخرى' } }
};

/**
 * Retourne le libellé du poste accordé au genre, ou null si le poste est inconnu/absent.
 */
export const getStaffPositionLabel = (position, gender, isRTL = false) => {
  if (!position || !STAFF_POSITIONS[position]) return null;
  const genderKey = gender === 'female' ? 'female' : 'male';
  return isRTL ? STAFF_POSITIONS[position][genderKey].ar : STAFF_POSITIONS[position][genderKey].fr;
};

export default STAFF_POSITIONS;
