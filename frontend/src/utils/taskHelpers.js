/**
 * Utilitaires centralisés pour la classification, le nettoyage d'affichage
 * et la résolution d'actions des tâches automatiques et manuelles.
 */

/**
 * Indique si une tâche est réservée uniquement au grand écran (Desktop).
 * Ex: "📋 Compléter dossier admin & cotisation : [Nom Enfant]" créée via Express Mobile.
 */
export function isDesktopOnlyTask(task) {
  if (!task) return false;
  if (task.desktop_only === true) return true;
  const title = task.title || '';
  return /Compléter dossier admin/i.test(title);
}

/**
 * Indique si une tâche correspond à l'ancienne tâche automatique #3 devenue inutile
 * ("📄 Compléter le dossier de [Prénom Nom]").
 */
export function isObsoleteDocTask(task) {
  if (!task) return false;
  const title = task.title || '';
  return /^📄\s*Compléter le dossier/i.test(title);
}

/**
 * Détermine la nature métier d'une tâche / événement pour afficher le bouton d'action adéquat
 * et masquer le bouton générique "Terminer" sur les tâches automatiques.
 *
 * Valeurs retournées :
 * - 'express_child'           : Compléter dossier admin & cotisation (ouverture modale édition enfant)
 * - 'enrollment_review'       : Demande d'inscription à examiner (/dashboard/pending-enrollments)
 * - 'birthday'                : Organisation ou préparation d'anniversaire
 * - 'pending_appointment'     : RDV à confirmer / en attente / rappel RDV
 * - 'inscription_appointment' : RDV Inscription confirmé (entretien d'admission)
 * - 'standard_appointment'    : Autre RDV confirmé
 * - 'manual'                  : Tâche manuelle ou mémo personnel (seul type avec bouton "✅ Terminer")
 */
export function getTaskAutoKind(task) {
  if (!task) return 'manual';
  const title = task.title || '';

  if (task.auto_action_type === 'edit_express_child' || /Compléter dossier admin/i.test(title)) {
    return 'express_child';
  }

  if (
    task.auto_action_type === 'enrollment_review' ||
    /Traiter dossier inscription|Demande d'inscription/i.test(title)
  ) {
    return 'enrollment_review';
  }

  if (
    task.auto_action_type === 'birthday' ||
    Boolean(task.birthday_child_id) ||
    /^🎂|^🚨\s*Demande Anniversaire/i.test(title) ||
    title.includes('Anniversaire') ||
    title.includes('anniversaire')
  ) {
    return 'birthday';
  }

  const isPendingConfirmAppt =
    title.includes('RDV à confirmer') ||
    title.includes('RDV en attente') ||
    title.includes('Rappel RDV') ||
    (task.type === 'appointment' && ['proposed', 'counter_proposed', 'pending'].includes(task.status));

  if (isPendingConfirmAppt) {
    return 'pending_appointment';
  }

  if (title.includes('RDV Inscription')) {
    return 'inscription_appointment';
  }

  if (task.type === 'appointment' || title.startsWith('📅') || title.startsWith('📋 RDV')) {
    return 'standard_appointment';
  }

  return 'manual';
}

/**
 * Indique si la tâche est une tâche automatique système (qui ne doit pas afficher un bouton "Terminer" brut).
 */
export function isAutomaticTask(task) {
  return getTaskAutoKind(task) !== 'manual';
}

/**
 * Résout la cible (ID enfant ou nom complet de l'enfant) pour la tâche Express "Compléter dossier admin & cotisation".
 */
export function resolveExpressChildTarget(task) {
  if (!task) return { childId: null, childName: '' };
  const desc = task.description || '';
  const title = task.title || '';

  const idFromProp = task.edit_child_id ? Number(task.edit_child_id) : null;
  const idFromDesc = desc.match(/editChildId=(\d+)/)?.[1]
    ? Number(desc.match(/editChildId=(\d+)/)[1])
    : null;

  const afterColon = title.includes(':') ? title.split(':').slice(1).join(':').trim() : '';
  const firstChildName = (task.edit_child_name || afterColon.split(',')[0] || '').trim();

  return {
    childId: idFromProp || idFromDesc || null,
    childName: firstChildName
  };
}

/**
 * Résout la cible (ID dossier d'inscription ou nom de l'enfant) pour la tâche "Demande d'inscription".
 */
export function resolveEnrollmentTarget(task) {
  if (!task) return { enrollmentId: null, childName: '' };
  const desc = task.description || '';
  const title = task.title || '';

  const idFromProp = task.enrollment_id ? Number(task.enrollment_id) : null;
  const idFromDesc = desc.match(/highlight=(\d+)/)?.[1]
    ? Number(desc.match(/highlight=(\d+)/)[1])
    : null;
  const idFromTitle = title.match(/#(\d+)/)?.[1]
    ? Number(title.match(/#(\d+)/)[1])
    : null;

  const childFromProp = task.enrollment_child_name || '';
  const childFromDesc = desc.match(/pour\s+([^(.\n]+)/i)?.[1]?.trim() || '';
  const childFromTitle = title.includes(':')
    ? title.split(':').slice(1).join(':').replace(/#\d+/g, '').trim()
    : '';

  return {
    enrollmentId: idFromProp || idFromDesc || idFromTitle || null,
    childName: childFromProp || childFromDesc || childFromTitle || ''
  };
}

/**
 * Nettoie et traduit le titre d'une tâche en supprimant tout identifiant technique (#ID, (ID: XX)).
 */
export function cleanTaskTitle(taskOrTitle, isRTL = false) {
  if (!taskOrTitle) return '';
  const isObj = typeof taskOrTitle === 'object';
  let rawTitle = isObj ? (taskOrTitle.title || '') : String(taskOrTitle);
  const desc = isObj ? (taskOrTitle.description || '') : '';

  // Remplacer l'ancien intitulé "📋 Traiter dossier inscription #30" par le nom de l'enfant
  if (/Traiter dossier inscription/i.test(rawTitle)) {
    const childFromProp = isObj ? (taskOrTitle.enrollment_child_name || '') : '';
    const childFromDesc = desc.match(/pour\s+([^(.\n]+)/i)?.[1]?.trim() || '';
    const childName = childFromProp || childFromDesc;
    rawTitle = childName
      ? `📋 Demande d'inscription : ${childName}`
      : `📋 Demande d'inscription`;
  }

  // Supprimer systématiquement tout #ID ou (ID: XX)
  let cleaned = rawTitle
    .replace(/\s*\(ID\s*:\s*\d+\)/gi, '')
    .replace(/\s*#\d+\b/g, '')
    .trim();

  if (!isRTL) return cleaned;

  return cleaned
    .replace(/Compléter dossier admin & cotisation\s*:/gi, 'استكمال الملف الإداري والاشتراك :')
    .replace(/Demande d'inscription\s*:/gi, 'طلب تسجيل :')
    .replace(/Demande d'inscription/gi, 'طلب تسجيل')
    .replace(/Organisation Anniversaire\s*:/gi, 'تنظيم عيد ميلاد:')
    .replace(/Préparer l'anniversaire de/gi, 'تحضير عيد ميلاد')
    .replace(/Demande Anniversaire\s*:/gi, 'طلب عيد ميلاد:')
    .replace(/Rendez-vous/gi, 'موعد')
    .replace(/RDV Inscription/gi, 'موعد تسجيل')
    .replace(/RDV à confirmer/gi, 'موعد للتأكيد')
    .replace(/RDV en attente/gi, 'موعد في الانتظار')
    .replace(/Rappel RDV/gi, 'تذكير بالموعد')
    .replace(/Mémo/gi, 'مذكرة')
    .replace(/Tâche/gi, 'مهمة')
    .replace(/\(\s*dans\s+(\d+)\s*j\s*\)/gi, '(خلال $1 أيام)')
    .replace(/\(\s*J-(\d+)\s*\)/gi, '(باقي $1 يوم)');
}

/**
 * Nettoie la description d'une tâche en retirant les liens techniques internes,
 * les identifiants techniques (#ID, (ID: XX)) et les anciennes lignes d'allergies redondantes.
 */
export function cleanTaskDescription(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/🔗\s*Lien\s*:\s*\S+/gi, '')
    .replace(/🔗\s*Accéder aux documents\s*:\s*\S+/gi, '')
    .replace(/\bLien\s*:\s*\/\S+/gi, '')
    .replace(/\s*\(ID\s*:\s*\d+\)/gi, '')
    .replace(/\s*#\d+\b/g, '')
    .split('\n')
    .filter(line => !/^[•\-*]?\s*⚠️?\s*Allergies\s*:/i.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

