/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROUTES ANNIVERSAIRES & SOUVENIRS (WORKFLOW PARENT + DIRECTION/STAFF)
 * ═══════════════════════════════════════════════════════════════════════════
 * Règles métier :
 * 1. Le parent choisit de fêter l'anniversaire à la crèche ("yes") ou non ("no").
 * 2. Délai d'organisation recommandé : au moins 5 jours avant (J-5).
 * 3. Si < 5 jours (J-4 à J-1) : l'option "Oui" n'est PAS bloquée, mais affichée
 *    "Sous réserve d'acceptation par la direction" (même à J-1).
 * 4. Si le parent clique sur "Non, rien à prévoir" :
 *    - Message WhatsApp / notification à l'admin ("Rien à prévoir").
 *    - Avant J-5 (>= 5 jours) : un petit bouton "Changer d'avis" permet de passer à "Oui".
 *    - Après J-5 (< 5 jours) : le bouton "Changer d'avis" est bloqué et masqué.
 * 5. Si le parent clique sur "Oui" :
 *    - Précise le jour souhaité + alerte si co-anniversaire le même jour/semaine.
 *    - Message WhatsApp ou SMS pré-rempli.
 *    - Crée une Tâche Urgente pour la direction (Appeler le parent, Accepter/Refuser,
 *      Assigner la tâche pré-remplie et modifiable à un membre du staff).
 * 6. Widget Souvenirs (Diaporama) :
 *    - N'apparaît QUE lorsque l'enfant possède des souvenirs.
 *    - J+1 à J+30 : Notification "📸 Les souvenirs de l'anniversaire de [Enfant] sont disponibles !"
 *      + Diaporama interactif pendant 30 jours + Boutons pour télécharger les photos.
 *    - Année N+1 : Si l'enfant est toujours inscrit, les souvenirs de l'an dernier
 *      réapparaissent avant la date de son anniversaire.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../config/db_postgres');
const auth = require('../middleware/auth');
const taskService = require('../services/taskService');
const cloudinaryService = require('../services/cloudinaryService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB par photo
});

// Initialisation automatique des tables du workflow d'anniversaire et mise à niveau idempotente de `events` et `activities`
let tablesInitialized = false;
async function ensureBirthdayTables() {
  if (tablesInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS birthday_celebrations (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        decision VARCHAR(20) DEFAULT 'pending',
        preferred_date VARCHAR(120),
        celebration_iso_date VARCHAR(20),
        parent_message TEXT,
        contact_channel VARCHAR(30),
        notify_other_parents BOOLEAN DEFAULT false,
        event_id INTEGER,
        staff_event_task_id INTEGER,
        activity_id INTEGER,
        is_late_request BOOLEAN DEFAULT false,
        admin_status VARCHAR(30) DEFAULT 'pending',
        assigned_staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        task_id INTEGER,
        task_instructions TEXT,
        decided_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(child_id, year)
      )
    `);

    await pool.query(`ALTER TABLE birthday_celebrations ADD COLUMN IF NOT EXISTS celebration_iso_date VARCHAR(20)`);
    await pool.query(`ALTER TABLE birthday_celebrations ADD COLUMN IF NOT EXISTS notify_other_parents BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE birthday_celebrations ADD COLUMN IF NOT EXISTS event_id INTEGER`);
    await pool.query(`ALTER TABLE birthday_celebrations ADD COLUMN IF NOT EXISTS staff_event_task_id INTEGER`);
    await pool.query(`ALTER TABLE birthday_celebrations ADD COLUMN IF NOT EXISTS activity_id INTEGER`);

    // Garantir que la table `events` possède toutes les colonnes nécessaires et accepte type='birthday' et type='task'
    try {
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS color VARCHAR(20)`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS child_id INTEGER`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(255)`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_offset INTEGER DEFAULT 0`);
      await pool.query(`ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check`);
      await pool.query(`ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS event_comments (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          deleted_at TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS event_reminders (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          scheduled_for TIMESTAMP,
          sent BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS event_history (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(50),
          field_name VARCHAR(100),
          old_value TEXT,
          new_value TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch (evSchemaErr) {
      console.warn('⚠️ Mise à niveau schéma events:', evSchemaErr.message);
    }

    // Garantir que la table `activities` supporte les diaporamas multi-photos (`media_type = 'images'`, `media_urls`)
    try {
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb`);
      await pool.query(`ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_media_type_check`);
    } catch (actSchemaErr) {
      console.warn('⚠️ Mise à niveau schéma activities:', actSchemaErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS birthday_memories (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        caption TEXT,
        author_name VARCHAR(100),
        published_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `);

    // Nettoyage automatique unique des éventuelles données de test antérieures en base
    try {
      const legacyTestRes = await pool.query(
        `SELECT id FROM children WHERE COALESCE(last_name, '') LIKE '%(Test J-%' OR COALESCE(medical_notes, '') LIKE '%TEST_ANNIV%'`
      );
      if (legacyTestRes.rows.length > 0) {
        const legacyIds = legacyTestRes.rows.map((r) => r.id);
        await pool.query(`DELETE FROM events WHERE child_id = ANY($1)`, [legacyIds]);
        await pool.query(`DELETE FROM notifications WHERE related_id = ANY($1)`, [legacyIds]);
        await pool.query(`DELETE FROM children WHERE id = ANY($1)`, [legacyIds]);
      }
    } catch (cleanErr) {
      // Ignorer silencieusement
    }

    tablesInitialized = true;
  } catch (err) {
    console.warn('⚠️ Initialisation tables birthday_celebrations/memories:', err.message);
  }
}

ensureBirthdayTables();

/**
 * Calcule les informations temporelles d'anniversaire par rapport à aujourd'hui
 * Gère la fenêtre J+1 à J+30 (où daysUntil est entre -1 et -30)
 */
function computeBirthdayTiming(birthDateInput) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const birthDate = new Date(birthDateInput);

  const currentYear = today.getFullYear();
  const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  const diffMsThisYear = birthdayThisYear.getTime() - today.getTime();
  const diffDaysThisYear = Math.round(diffMsThisYear / (1000 * 60 * 60 * 24));

  let targetBirthday = birthdayThisYear;
  let targetYear = currentYear;
  let daysUntil = diffDaysThisYear;

  // Si l'anniversaire est passé depuis plus de 30 jours, on cible l'année prochaine
  if (diffDaysThisYear < -30) {
    targetYear = currentYear + 1;
    targetBirthday = new Date(targetYear, birthDate.getMonth(), birthDate.getDate());
    daysUntil = Math.round((targetBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const ageTurning = targetYear - birthDate.getFullYear();
  const isBeforeJ5 = daysUntil >= 5;
  const isLateWindow = daysUntil >= 0 && daysUntil < 5;
  const isToday = daysUntil === 0;
  const isPostBirthdayMonth = daysUntil < 0 && daysUntil >= -30;
  const daysRemainingInSlideshow = isPostBirthdayMonth ? Math.max(1, 30 + daysUntil) : 30;

  return {
    targetBirthday,
    targetYear,
    daysUntil,
    ageTurning,
    isBeforeJ5,
    isLateWindow,
    isToday,
    isPostBirthdayMonth,
    daysRemainingInSlideshow
  };
}

function fmtIsoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function cleanTaskInstructionsText(rawText) {
  if (!rawText) return '';
  return String(rawText)
    .split('\n')
    .filter((line) => !line.includes('Vérifier les allergies du groupe avant réception du gâteau'))
    .join('\n')
    .replace(/\s*Notes médicales\/allergies\s*:[^.]*\./gi, '')
    .trim();
}

/**
 * Génère 3 propositions de jours pour fêter l'anniversaire à la crèche
 */
function buildSuggestedDays(targetBirthday, coBirthdays = []) {
  const dayOfWeek = targetBirthday.getDay(); // 0 = Dimanche, 6 = Samedi
  const fmt = (d) =>
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const coSuffix = coBirthdays.length > 0 ? ` (avec ${coBirthdays[0].first_name} 🎉)` : '';

  if (dayOfWeek === 0) {
    // Dimanche -> Vendredi avant (-2j) ou Lundi après (+1j)
    const friday = new Date(targetBirthday);
    friday.setDate(friday.getDate() - 2);
    const monday = new Date(targetBirthday);
    monday.setDate(monday.getDate() + 1);
    const thursday = new Date(targetBirthday);
    thursday.setDate(thursday.getDate() - 3);
    return [
      {
        id: 'before',
        date: fmtIsoDate(friday),
        label: `📅 ${fmt(friday)} (Vendredi avant Dimanche)${coSuffix}`,
        value: `${fmt(friday)}${coSuffix}`,
        subtitle: coBirthdays.length > 0 ? `Avant le dimanche · +${coBirthdays.length} anniv prévu` : 'Vendredi avant le dimanche'
      },
      {
        id: 'after',
        date: fmtIsoDate(monday),
        label: `📅 ${fmt(monday)} (Lundi suivant)`,
        value: fmt(monday),
        subtitle: 'Lundi après le dimanche'
      },
      {
        id: 'custom',
        date: fmtIsoDate(thursday),
        label: `💬 ${fmt(thursday)} (ou autre jour avec la crèche)`,
        value: fmt(thursday),
        subtitle: 'Voir avec la crèche'
      }
    ];
  }

  if (dayOfWeek === 6) {
    // Samedi -> Vendredi avant (-1j) ou Lundi après (+2j)
    const friday = new Date(targetBirthday);
    friday.setDate(friday.getDate() - 1);
    const monday = new Date(targetBirthday);
    monday.setDate(monday.getDate() + 2);
    const thursday = new Date(targetBirthday);
    thursday.setDate(thursday.getDate() - 2);
    return [
      {
        id: 'before',
        date: fmtIsoDate(friday),
        label: `📅 ${fmt(friday)} (Vendredi veille du Samedi)${coSuffix}`,
        value: `${fmt(friday)}${coSuffix}`,
        subtitle: coBirthdays.length > 0 ? `Veille · +${coBirthdays.length} anniv prévu` : 'Vendredi (veille du samedi)'
      },
      {
        id: 'after',
        date: fmtIsoDate(monday),
        label: `📅 ${fmt(monday)} (Lundi suivant)`,
        value: fmt(monday),
        subtitle: 'Lundi suivant'
      },
      {
        id: 'custom',
        date: fmtIsoDate(thursday),
        label: `💬 ${fmt(thursday)} (ou autre jour avec la crèche)`,
        value: fmt(thursday),
        subtitle: 'Voir avec la crèche'
      }
    ];
  }

  // Jour de semaine ouvré
  const prevDay = new Date(targetBirthday);
  prevDay.setDate(prevDay.getDate() - (dayOfWeek === 1 ? 3 : 1));
  const nextDay = new Date(targetBirthday);
  nextDay.setDate(nextDay.getDate() + (dayOfWeek === 5 ? 3 : 1));
  return [
    {
      id: 'same_day',
      date: fmtIsoDate(targetBirthday),
      label: `📅 ${fmt(targetBirthday)} (Jour J à 15h30)${coSuffix}`,
      value: `${fmt(targetBirthday)} (Jour J)${coSuffix}`,
      subtitle: coBirthdays.length > 0 ? `Le jour même · +${coBirthdays.length} anniv prévu` : 'Le jour même à 15h30'
    },
    {
      id: 'before',
      date: fmtIsoDate(prevDay),
      label: `📅 ${fmt(prevDay)} (Un jour avant)`,
      value: fmt(prevDay),
      subtitle: 'Un jour avant'
    },
    {
      id: 'custom',
      date: fmtIsoDate(nextDay),
      label: `💬 ${fmt(nextDay)} (ou autre jour à convenir)`,
      value: fmt(nextDay),
      subtitle: 'Voir avec la crèche'
    }
  ];
}

/**
 * Synchronise l'événement dans la table `events` lorsque le parent décide de fêter l'anniversaire :
 * - Si decision === 'yes' et admin_status !== 'rejected' :
 *   Crée ou met à jour un événement `type = 'birthday'` dans la table `events`.
 *   - Si `notify_other_parents === false` : visible uniquement par le parent concerné, le staff et l'admin.
 *   - Si `notify_other_parents === true`  : visible par TOUT LE MONDE (tous les parents, le staff et l'admin).
 * - Si decision === 'no' ou admin_status === 'rejected' :
 *   Annule / supprime logiquement (deleted_at = NOW()) l'événement associé dans `events`.
 */
async function syncBirthdayEventInEventsTable({ child, timing, celebration, actorUserId }) {
  try {
    const shouldBeActive =
      celebration.decision === 'yes' && celebration.admin_status !== 'rejected';

    if (!shouldBeActive) {
      if (celebration.event_id) {
        await pool.query(
          `UPDATE events SET status = 'cancelled', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [celebration.event_id]
        );
      }
      return null;
    }

    const isoDate =
      (celebration.celebration_iso_date && /^\d{4}-\d{2}-\d{2}$/.test(celebration.celebration_iso_date))
        ? celebration.celebration_iso_date
        : fmtIsoDate(timing.targetBirthday);

    const startDateStr = `${isoDate} 15:30:00`;
    const endDateStr = `${isoDate} 16:30:00`;
    const notifyOthers = Boolean(celebration.notify_other_parents);

    const eventTitle = `🎂 Anniversaire de ${child.first_name} (${timing.ageTurning} ans)`;
    const visibilityNote = notifyOthers
      ? '🌍 Visible par tous les parents, le staff et la direction'
      : '🔒 Visible uniquement par le parent concerné, le staff et la direction';
    const eventDesc =
      `Fête d'anniversaire de ${child.first_name} ${child.last_name} (${timing.ageTurning} ans) à la crèche.\n` +
      `Jour choisi : ${celebration.preferred_date || isoDate}\n` +
      `${visibilityNote}`;

    const metadataObj = {
      is_birthday_celebration: true,
      notify_other_parents: notifyOthers,
      visibility: notifyOthers ? 'all' : 'concerned_only',
      parent_id: child.parent_id ? Number(child.parent_id) : null,
      child_id: Number(child.id),
      turning_age: timing.ageTurning,
      preferred_date: celebration.preferred_date || isoDate,
      admin_status: celebration.admin_status || 'pending'
    };

    // Trouver un admin ou staff assigné par défaut
    let assignedUserId = celebration.assigned_staff_id || null;
    if (!assignedUserId) {
      const adminRes = await pool.query(
        `SELECT id FROM users WHERE role = 'admin' AND is_active = true ORDER BY id ASC LIMIT 1`
      );
      assignedUserId = adminRes.rows[0]?.id || actorUserId || child.parent_id;
    }
    const createdByUserId = child.parent_id || actorUserId || assignedUserId;

    let eventRow = null;
    if (celebration.event_id) {
      const updRes = await pool.query(
        `UPDATE events
         SET title = $1,
             description = $2,
             start_date = $3,
             end_date = $4,
             assigned_to = COALESCE($5, assigned_to),
             child_id = $6,
             color = '#EC4899',
             status = 'pending',
             deleted_at = NULL,
             metadata = $7::jsonb,
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          eventTitle,
          eventDesc,
          startDateStr,
          endDateStr,
          assignedUserId,
          child.id,
          JSON.stringify(metadataObj),
          celebration.event_id
        ]
      );
      eventRow = updRes.rows[0] || null;
    }

    if (!eventRow) {
      const insRes = await pool.query(
        `INSERT INTO events (
           title, description, type, start_date, end_date, all_day,
           status, priority, created_by, assigned_to, child_id, color, metadata, created_at, updated_at
         ) VALUES ($1, $2, 'birthday', $3, $4, false, 'pending', 'high', $5, $6, $7, '#EC4899', $8::jsonb, NOW(), NOW())
         RETURNING *`,
        [
          eventTitle,
          eventDesc,
          startDateStr,
          endDateStr,
          createdByUserId,
          assignedUserId,
          child.id,
          JSON.stringify(metadataObj)
        ]
      );
      eventRow = insRes.rows[0];
      if (eventRow?.id) {
        await pool.query(
          `UPDATE birthday_celebrations SET event_id = $1 WHERE id = $2`,
          [eventRow.id, celebration.id]
        );
        celebration.event_id = eventRow.id;
      }
    }

    return eventRow;
  } catch (err) {
    console.error('⚠️ Erreur syncBirthdayEventInEventsTable:', err.message);
    return null;
  }
}

/**
 * Synchronise la tâche d'organisation d'anniversaire assignée au staff dans :
 * 1) `tasks` (pour TodayTasksWidget sur ordinateur)
 * 2) `events` avec `type = 'task'` (pour TodayTasksWidgetMobile sur mobile et `/dashboard/tasks`)
 */
async function syncStaffTaskInEventsAndTasks({ child, timing, celebration, staffId, taskNotes, dueDate, actorUserId }) {
  const taskTitle = `🎂 Préparer l'anniversaire de ${child.first_name} ${child.last_name} (${timing.ageTurning} ans)`;
  const creatorId = actorUserId || staffId;
  const isoDueDate = dueDate && /^\d{4}-\d{2}-\d{2}/.test(String(dueDate))
    ? String(dueDate).slice(0, 10)
    : fmtIsoDate(timing.targetBirthday >= new Date() ? timing.targetBirthday : new Date());

  const baseCleanNotes = cleanTaskInstructionsText(taskNotes);
  const linkLine = `🔗 Lien: /anniversaire/${child.id}`;
  const finalTaskNotes = baseCleanNotes.includes('/anniversaire/')
    ? baseCleanNotes
    : `${baseCleanNotes}\n${linkLine}`;

  let taskRow = null;
  let eventTaskRow = null;

  // 1. Table `tasks`
  try {
    if (celebration.task_id) {
      const updTask = await pool.query(
        `UPDATE tasks
         SET title = $1,
             description = $2,
             assigned_to = $3,
             due_date = $4,
             priority = 'high',
             status = 'pending'
         WHERE id = $5
         RETURNING *`,
        [taskTitle, finalTaskNotes, staffId, isoDueDate, celebration.task_id]
      );
      taskRow = updTask.rows[0] || null;
    }
    if (!taskRow) {
      const created = await taskService.createTask(
        {
          title: taskTitle,
          description: finalTaskNotes,
          assigned_to: staffId,
          due_date: isoDueDate,
          priority: 'high'
        },
        creatorId
      );
      taskRow = created?.task || null;
    }
  } catch (tErr) {
    console.warn('⚠️ syncStaffTaskInEventsAndTasks (table tasks):', tErr.message);
  }

  // 2. Table `events` (type = 'task') pour affichage dans TasksPage et TodayTasksWidgetMobile
  try {
    const startDateStr = fmtIsoDate(new Date()) + ' 08:30:00';
    const endDateStr = `${isoDueDate} 16:30:00`;
    const metaObj = {
      is_birthday_task: true,
      child_id: Number(child.id),
      year: timing.targetYear,
      turning_age: timing.ageTurning
    };

    if (celebration.staff_event_task_id) {
      const updEv = await pool.query(
        `UPDATE events
         SET title = $1,
             description = $2,
             start_date = $3,
             end_date = $4,
             assigned_to = $5,
             child_id = $6,
             priority = 'high',
             status = 'pending',
             deleted_at = NULL,
             color = '#8B5CF6',
             metadata = $7::jsonb,
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          taskTitle,
          finalTaskNotes,
          startDateStr,
          endDateStr,
          staffId,
          child.id,
          JSON.stringify(metaObj),
          celebration.staff_event_task_id
        ]
      );
      eventTaskRow = updEv.rows[0] || null;
    }

    if (!eventTaskRow) {
      const insEv = await pool.query(
        `INSERT INTO events (
           title, description, type, start_date, end_date, all_day,
           status, priority, created_by, assigned_to, child_id, color, metadata, created_at, updated_at
         ) VALUES ($1, $2, 'task', $3, $4, false, 'pending', 'high', $5, $6, $7, '#8B5CF6', $8::jsonb, NOW(), NOW())
         RETURNING *`,
        [
          taskTitle,
          finalTaskNotes,
          startDateStr,
          endDateStr,
          creatorId,
          staffId,
          child.id,
          JSON.stringify(metaObj)
        ]
      );
      eventTaskRow = insEv.rows[0] || null;
    }
  } catch (eErr) {
    console.warn('⚠️ syncStaffTaskInEventsAndTasks (table events):', eErr.message);
  }

  // 3. Notification en temps réel dans `notifications` pour le membre du staff assigné
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
       VALUES ($1, $2, $3, 'warning', $4, false, NOW())`,
      [
        staffId,
        `📋 Tâche Anniversaire assignée : ${child.first_name} (${timing.ageTurning} ans)`,
        taskNotes || `La direction vous a assigné la préparation de l'anniversaire de ${child.first_name}.`,
        child.id
      ]
    );
  } catch (nErr) {
    console.warn('⚠️ Notification staff assignation:', nErr.message);
  }

  return { taskRow, eventTaskRow };
}

/**
 * Publie ou met à jour un diaporama regroupant TOUTES les photos de l'anniversaire de l'enfant
 * dans la page Activités (`table activities`, `media_type = 'images'`, `media_urls = JSONB`)
 * à partir de J+1 ou sur action de partage.
 */
async function syncBirthdaySlideshowToActivities({ child, timing, celebration, memories = [], actorUserId }) {
  try {
    if (!Array.isArray(memories) || memories.length === 0) return null;

    const photoUrls = memories.map(m => m.photo_url).filter(Boolean);
    if (photoUrls.length === 0) return null;

    let authorId = actorUserId || celebration?.assigned_staff_id || null;
    if (!authorId) {
      const staffOrAdminRes = await pool.query(
        `SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = true ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id ASC LIMIT 1`
      );
      authorId = staffOrAdminRes.rows[0]?.id || child.parent_id;
    }

    const title = `🎂 Diaporama Souvenir : Les ${timing.ageTurning} ans de ${child.first_name} !`;
    const captionsSummary = memories
      .map(m => m.caption)
      .filter(Boolean)
      .slice(0, 3)
      .join(' · ');
    const description =
      `📸 Diaporama souvenir de l'anniversaire de ${child.first_name} (${timing.ageTurning} ans) célébré à la crèche avec ses petits camarades (${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''}).\n` +
      (captionsSummary ? `${captionsSummary}` : `Joyeux anniversaire ${child.first_name} ! 🎉🎈`);

    let activityRow = null;
    if (celebration?.activity_id) {
      const updAct = await pool.query(
        `UPDATE activities
         SET title = $1,
             description = $2,
             media_type = 'images',
             media_url = $3,
             media_urls = $4::jsonb,
             visible_to_parents = true,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [title, description, photoUrls[0], JSON.stringify(photoUrls), celebration.activity_id]
      );
      activityRow = updAct.rows[0] || null;
    }

    if (!activityRow) {
      // Chercher s'il existe déjà une publication d'activité pour cet anniversaire cette année
      const existingAct = await pool.query(
        `SELECT * FROM activities
         WHERE title = $1 AND EXTRACT(YEAR FROM created_at) = $2
         ORDER BY id DESC LIMIT 1`,
        [title, timing.targetYear]
      );
      if (existingAct.rows[0]) {
        const updExisting = await pool.query(
          `UPDATE activities
           SET description = $1,
               media_type = 'images',
               media_url = $2,
               media_urls = $3::jsonb,
               visible_to_parents = true,
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [description, photoUrls[0], JSON.stringify(photoUrls), existingAct.rows[0].id]
        );
        activityRow = updExisting.rows[0] || null;
      }
    }

    if (!activityRow) {
      const insAct = await pool.query(
        `INSERT INTO activities (
           author_id, title, description, media_type, media_url, media_urls, is_pinned, visible_to_parents, created_at, updated_at
         ) VALUES ($1, $2, $3, 'images', $4, $5::jsonb, false, true, NOW(), NOW())
         RETURNING *`,
        [authorId, title, description, photoUrls[0], JSON.stringify(photoUrls)]
      );
      activityRow = insAct.rows[0] || null;
    }

    if (activityRow?.id && celebration?.id) {
      await pool.query(
        `UPDATE birthday_celebrations SET activity_id = $1 WHERE id = $2`,
        [activityRow.id, celebration.id]
      );
      celebration.activity_id = activityRow.id;
    }

    return activityRow;
  } catch (err) {
    console.warn('⚠️ syncBirthdaySlideshowToActivities:', err.message);
    return null;
  }
}

/**
 * GET /api/birthdays/my-children
 * Récupère les anniversaires pertinents des enfants du parent connecté
 * (J-30 à J0 + J+1 à J+30 s'il y a des souvenirs)
 */
router.get('/my-children', auth.authenticateToken, async (req, res) => {
  try {
    await ensureBirthdayTables();
    const userId = req.user.userId || req.user.id;
    const role = req.user.role;

    let childrenQuery;
    let params = [];
    if (role === 'admin' || role === 'staff' || role === 'developer') {
      childrenQuery = `
        SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, c.photo_url, c.parent_id, c.medical_notes, c.allergies
        FROM children c
        WHERE c.is_active = true AND c.birth_date IS NOT NULL
        ORDER BY c.first_name ASC
      `;
    } else {
      childrenQuery = `
        SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, c.photo_url, c.parent_id, c.medical_notes, c.allergies
        FROM children c
        WHERE c.is_active = true
          AND c.parent_id = $1
          AND c.birth_date IS NOT NULL
        ORDER BY c.first_name ASC
      `;
      params = [userId];
    }

    const childrenRes = await pool.query(childrenQuery, params);
    const items = [];

    for (const child of childrenRes.rows) {
      const timing = computeBirthdayTiming(child.birth_date);

      // Récupérer la décision pour l'année cible
      const celebRes = await pool.query(
        `SELECT * FROM birthday_celebrations WHERE child_id = $1 AND year = $2 LIMIT 1`,
        [child.id, timing.targetYear]
      );
      const celebration = celebRes.rows[0] || null;

      // Récupérer les souvenirs (année cible si J+1..J+30, sinon N-1 ou année cible)
      const memRes = await pool.query(
        `SELECT * FROM birthday_memories
         WHERE child_id = $1 AND year IN ($2, $3)
         ORDER BY year DESC, published_at DESC`,
        [child.id, timing.targetYear, timing.targetYear - 1]
      );

      const currentYearMemories = memRes.rows.filter(m => Number(m.year) === timing.targetYear);
      const prevYearMemories = memRes.rows.filter(m => Number(m.year) === timing.targetYear - 1);
      const activeMemories = timing.isPostBirthdayMonth
        ? currentYearMemories
        : (currentYearMemories.length > 0 ? currentYearMemories : prevYearMemories);

      items.push({
        id: child.id,
        child_id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        child_name: `${child.first_name} ${child.last_name}`,
        gender: child.gender,
        photo_url: child.photo_url,
        birth_date: child.birth_date,
        medical_notes: child.medical_notes,
        allergies: child.allergies,
        target_birthday: fmtIsoDate(timing.targetBirthday),
        this_year_date: fmtIsoDate(timing.targetBirthday),
        days_until: timing.daysUntil,
        age_turning: timing.ageTurning,
        turning_age: timing.ageTurning,
        is_before_j5: timing.isBeforeJ5,
        is_late_window: timing.isLateWindow,
        is_today: timing.isToday,
        is_post_birthday_month: timing.isPostBirthdayMonth,
        days_remaining_slideshow: timing.daysRemainingInSlideshow,
        decision: celebration?.decision || 'pending',
        admin_status: celebration?.admin_status || 'pending',
        preferred_date: celebration?.preferred_date || null,
        notify_other_parents: Boolean(celebration?.notify_other_parents),
        event_id: celebration?.event_id || null,
        celebration: celebration
          ? {
              ...celebration,
              decision_status: celebration.decision,
              admin_approval_status: celebration.admin_status,
              celebration_date: celebration.celebration_iso_date || celebration.preferred_date,
              notify_other_parents: Boolean(celebration.notify_other_parents)
            }
          : null,
        has_memories: activeMemories.length > 0,
        memories_count: activeMemories.length
      });
    }

    res.json({
      success: true,
      children: items,
      birthdays: items
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/birthdays/my-children:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des anniversaires'
    });
  }
});

/**
 * GET /api/birthdays/child/:childId
 * Détails complets du workflow anniversaire & souvenirs pour un enfant
 */
router.get('/child/:childId', auth.authenticateToken, async (req, res) => {
  try {
    await ensureBirthdayTables();
    const childId = parseInt(req.params.childId, 10);
    if (isNaN(childId)) {
      return res.status(400).json({ success: false, error: 'ID enfant invalide' });
    }

    const userId = req.user.userId || req.user.id;
    const role = req.user.role;

    const childRes = await pool.query(
      `SELECT c.*,
              u.first_name as parent_first_name,
              u.last_name as parent_last_name,
              u.phone as parent_user_phone,
              u.email as parent_email
       FROM children c
       LEFT JOIN users u ON c.parent_id = u.id
       WHERE c.id = $1`,
      [childId]
    );

    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    const child = childRes.rows[0];
    const timing = computeBirthdayTiming(child.birth_date);
    const targetIsoDate = fmtIsoDate(timing.targetBirthday);

    // Récupérer l'enregistrement de célébration pour l'année cible
    const celebRes = await pool.query(
      `SELECT bc.*,
              s.first_name as staff_first_name,
              s.last_name as staff_last_name
       FROM birthday_celebrations bc
       LEFT JOIN users s ON bc.assigned_staff_id = s.id
       WHERE bc.child_id = $1 AND bc.year = $2
       LIMIT 1`,
      [childId, timing.targetYear]
    );

    const existingCelebration = celebRes.rows[0] || null;

    // Vérification de sécurité : Parent propriétaire OU Événement partagé aux autres parents OU Staff/Admin/Developer
    const isStaffOrAdmin = ['admin', 'staff', 'directrice', 'developer'].includes(role);
    const isSharedWithAllParents =
      existingCelebration?.decision === 'yes' && Boolean(existingCelebration?.notify_other_parents);
    if (!isStaffOrAdmin && Number(child.parent_id) !== Number(userId) && !isSharedWithAllParents) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé à cet enfant'
      });
    }

    // Chercher les co-anniversaires (autres enfants actifs nés le même jour ou à ±3 jours dans le même mois)
    const birthDateObj = new Date(child.birth_date);
    const birthMonth = birthDateObj.getMonth() + 1;
    const birthDay = birthDateObj.getDate();

    const coBirthdaysRes = await pool.query(
      `SELECT id, first_name, last_name, birth_date, gender
       FROM children
       WHERE is_active = true
         AND id != $1
         AND EXTRACT(MONTH FROM birth_date) = $2
         AND ABS(EXTRACT(DAY FROM birth_date) - $3) <= 3
       ORDER BY EXTRACT(DAY FROM birth_date) ASC`,
      [childId, birthMonth, birthDay]
    );

    const coBirthdays = coBirthdaysRes.rows.map(c => {
      const d = new Date(timing.targetYear, new Date(c.birth_date).getMonth(), new Date(c.birth_date).getDate());
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        celebration_date_label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }),
        same_exact_day: new Date(c.birth_date).getDate() === birthDay
      };
    });

    const suggestedDays = buildSuggestedDays(timing.targetBirthday, coBirthdays);

    const celebration = existingCelebration || {
      child_id: childId,
      year: timing.targetYear,
      decision: 'pending',
      preferred_date: suggestedDays[0]?.date || targetIsoDate,
      celebration_iso_date: suggestedDays[0]?.date || targetIsoDate,
      parent_message: '',
      notify_other_parents: false,
      event_id: null,
      is_late_request: timing.isLateWindow,
      admin_status: 'pending',
      assigned_staff_id: null,
      task_id: null,
      task_instructions: ''
    };

    // Récupérer l'événement lié dans la table `events` (ou le synchroniser automatiquement si decision === 'yes')
    let createdEvent = null;
    try {
      const evQuery = celebration.event_id
        ? await pool.query(`SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [celebration.event_id])
        : await pool.query(
            `SELECT * FROM events
             WHERE child_id = $1 AND type = 'birthday' AND deleted_at IS NULL
             ORDER BY id DESC LIMIT 1`,
            [childId]
          );
      createdEvent = evQuery.rows[0] || null;

      if (!createdEvent && celebration.id && celebration.decision === 'yes' && celebration.admin_status !== 'rejected') {
        createdEvent = await syncBirthdayEventInEventsTable({
          child,
          timing,
          celebration,
          actorUserId: userId
        });
      }
    } catch (evErr) {
      console.warn('⚠️ Lecture/sync événement anniversaire:', evErr.message);
    }

    // Récupérer la tâche staff liée (s'il y en a une)
    let assignedTask = null;
    if (celebration.assigned_staff_id) {
      try {
        if (celebration.task_id) {
          const tRes = await pool.query(`SELECT * FROM tasks WHERE id = $1 LIMIT 1`, [celebration.task_id]);
          assignedTask = tRes.rows[0] || null;
        }
        if (!assignedTask && celebration.staff_event_task_id) {
          const etRes = await pool.query(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [celebration.staff_event_task_id]);
          assignedTask = etRes.rows[0] || null;
        }
      } catch (tErr) {
        // Silencieux
      }
    }

    // Règle métier : Si le parent a choisi "Non", il peut changer d'avis UNIQUEMENT avant J-5 (daysUntil >= 5)
    // Après J-5 (daysUntil < 5), le bouton est bloqué et ne s'affiche plus.
    const canChangeMindFromNo = celebration.decision === 'no' && timing.isBeforeJ5;

    // Récupérer les souvenirs (J+1..J+30 -> année en cours, avant l'anniversaire -> souvenirs N-1 ou année en cours)
    const memoriesRes = await pool.query(
      `SELECT id, child_id, year, photo_url, caption, author_name, published_at, expires_at
       FROM birthday_memories
       WHERE child_id = $1 AND year IN ($2, $3)
       ORDER BY year DESC, id ASC`,
      [childId, timing.targetYear, timing.targetYear - 1]
    );

    const currentYearMemories = memoriesRes.rows.filter(m => Number(m.year) === timing.targetYear);
    const previousYearMemories = memoriesRes.rows.filter(m => Number(m.year) === timing.targetYear - 1);

    let memories = [];
    let memoriesType = null; // 'post_birthday_30d' | 'last_year_souvenir'

    if (timing.isPostBirthdayMonth || timing.isToday || currentYearMemories.length > 0) {
      memories = currentYearMemories;
      memoriesType = 'post_birthday_30d';
    } else if (previousYearMemories.length > 0 && timing.daysUntil > 0) {
      memories = previousYearMemories;
      memoriesType = 'last_year_souvenir';
    }

    const formattedMemories = memories.map(m => ({
      ...m,
      celebration_year: m.year
    }));

    // Récupérer ou synchroniser automatiquement à partir de J+1 le diaporama dans la page Activités (`table activities`)
    let createdActivity = null;
    try {
      if (celebration.activity_id) {
        const actRes = await pool.query(`SELECT * FROM activities WHERE id = $1 LIMIT 1`, [celebration.activity_id]);
        createdActivity = actRes.rows[0] || null;
      }
      if (!createdActivity && timing.isPostBirthdayMonth && currentYearMemories.length > 0) {
        createdActivity = await syncBirthdaySlideshowToActivities({
          child,
          timing,
          celebration,
          memories: currentYearMemories,
          actorUserId: userId
        });
      }
    } catch (actErr) {
      console.warn('⚠️ Lecture/sync activité diaporama:', actErr.message);
    }

    // Téléphone de la crèche pour WhatsApp / SMS
    let nurseryPhone = '+21625951532';
    try {
      const settingsRes = await pool.query(
        `SELECT value_fr FROM nursery_settings WHERE setting_key IN ('phone', 'contact_phone', 'whatsapp') AND is_active = true LIMIT 1`
      );
      if (settingsRes.rows[0]?.value_fr) {
        nurseryPhone = settingsRes.rows[0]?.value_fr;
      }
    } catch (e) {
      // Fallback silencieux
    }

    // Liste du staff pour l'assignation par la direction (disponible aussi en mode aperçu test)
    let staffList = [];
    try {
      const staffRes = await pool.query(
        `SELECT id, first_name, last_name, role
         FROM users
         WHERE role IN ('staff', 'admin') AND is_active = true
         ORDER BY CASE WHEN role = 'staff' THEN 0 ELSE 1 END, first_name ASC`
      );
      staffList = staffRes.rows;
    } catch (staffErr) {
      // Fallback silencieux
    }

    const parentPhone =
      child.parent_user_phone ||
      child.mother_phone ||
      child.father_phone ||
      child.emergency_contact_phone ||
      '+21625951532';

    const defaultTaskInstructions = cleanTaskInstructionsText(
      celebration.task_instructions ||
        `📋 TÂCHE ANNIVERSAIRE — ${celebration.preferred_date || suggestedDays[0]?.value || 'Jour J'} (15h30)\n` +
        `• Enfant : ${child.first_name} ${child.last_name} (${timing.ageTurning} ans)${coBirthdays.length > 0 ? ` — Fête groupée avec ${coBirthdays.map(c => c.first_name).join(', ')}` : ''}\n` +
        `• Préparer la couronne d'anniversaire et la décoration de la section\n` +
        `• Prendre des photos souvenirs pour le diaporama des parents (affiché 30 jours).`
    );

    const birthdayPayload = {
      this_year_date: targetIsoDate,
      target_birthday: targetIsoDate,
      target_birthday_label: timing.targetBirthday.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }),
      day_of_week_label: timing.targetBirthday.toLocaleDateString('fr-FR', { weekday: 'long' }),
      is_weekend: [0, 6].includes(timing.targetBirthday.getDay()),
      target_year: timing.targetYear,
      days_until: timing.daysUntil,
      turning_age: timing.ageTurning,
      age_turning: timing.ageTurning,
      is_before_j5: timing.isBeforeJ5,
      is_late_window: timing.isLateWindow,
      is_today: timing.isToday,
      is_post_birthday_month: timing.isPostBirthdayMonth,
      days_remaining_slideshow: timing.daysRemainingInSlideshow
    };

    const resolvedIsoDate =
      celebration.celebration_iso_date ||
      (/^\d{4}-\d{2}-\d{2}/.test(String(celebration.preferred_date || ''))
        ? String(celebration.preferred_date).slice(0, 10)
        : suggestedDays[0]?.date || targetIsoDate);

    res.json({
      success: true,
      child: {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        full_name: `${child.first_name} ${child.last_name}`,
        birth_date: child.birth_date,
        gender: child.gender,
        photo_url: child.photo_url,
        allergies: child.allergies,
        medical_notes: child.medical_notes,
        parent_id: child.parent_id,
        parent_first_name: child.parent_first_name || child.mother_name || 'Parent',
        parent_name: `${child.parent_first_name || ''} ${child.parent_last_name || ''}`.trim() || child.mother_name || child.father_name || 'Parent',
        parent_phone: parentPhone
      },
      birthday: birthdayPayload,
      timing: birthdayPayload,
      co_birthdays: coBirthdays,
      suggested_days: suggestedDays,
      celebration: {
        ...celebration,
        decision_status: celebration.decision,
        admin_approval_status: celebration.admin_status,
        celebration_date: resolvedIsoDate,
        parent_notes: celebration.parent_message || '',
        admin_task_notes: defaultTaskInstructions,
        task_instructions: defaultTaskInstructions,
        notify_other_parents: Boolean(celebration.notify_other_parents),
        event_id: celebration.event_id || createdEvent?.id || null,
        created_event: createdEvent,
        activity_id: celebration.activity_id || createdActivity?.id || null,
        created_activity: createdActivity,
        assigned_task: assignedTask,
        can_change_mind_from_no: canChangeMindFromNo
      },
      memories: {
        has_memories: formattedMemories.length > 0,
        type: memoriesType,
        year: memoriesType === 'last_year_souvenir' ? timing.targetYear - 1 : timing.targetYear,
        age_in_memories: memoriesType === 'last_year_souvenir' ? Math.max(1, timing.ageTurning - 1) : timing.ageTurning,
        items: formattedMemories,
        activity_id: celebration.activity_id || createdActivity?.id || null,
        created_activity: createdActivity
      },
      nursery_phone: nurseryPhone,
      staff_list: staffList
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/birthdays/child/:childId:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des détails de l\'anniversaire'
    });
  }
});

/**
 * POST /api/birthdays/child/:childId/decision
 * Enregistre la décision du parent ("yes" ou "no")
 * + Si "yes" : crée un événement dans la table `events` (affiché au parent concerné, staff et admin,
 *   ou à tout le monde si le toggle `notify_other_parents` est activé par le parent concerné).
 */
router.post('/child/:childId/decision', auth.authenticateToken, async (req, res) => {
  try {
    await ensureBirthdayTables();
    const childId = parseInt(req.params.childId, 10);
    const {
      decision,
      preferred_date,
      celebration_date,
      message,
      parent_notes,
      contact_channel = 'whatsapp',
      notify_other_parents = false
    } = req.body;

    if (!['yes', 'no'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Décision invalide (doit être "yes" ou "no")'
      });
    }

    const childRes = await pool.query(
      `SELECT c.*, u.first_name as parent_first_name, u.last_name as parent_last_name, u.phone as parent_phone
       FROM children c
       LEFT JOIN users u ON c.parent_id = u.id
       WHERE c.id = $1`,
      [childId]
    );

    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    const child = childRes.rows[0];
    const timing = computeBirthdayTiming(child.birth_date);

    // Vérifier s'il existe déjà une décision "no" verrouillée (< 5 jours)
    const existingRes = await pool.query(
      `SELECT * FROM birthday_celebrations WHERE child_id = $1 AND year = $2 LIMIT 1`,
      [childId, timing.targetYear]
    );
    const existing = existingRes.rows[0];

    if (existing && existing.decision === 'no' && decision === 'yes' && !timing.isBeforeJ5 && req.user.role === 'parent') {
      return res.status(400).json({
        success: false,
        error: 'Le délai de 5 jours étant dépassé, il n\'est plus possible de modifier le choix « Rien à prévoir ».'
      });
    }

    const wasPreviouslyYes = Boolean(existing && existing.decision === 'yes');
    const previousStaffId = existing?.assigned_staff_id ? Number(existing.assigned_staff_id) : null;
    const previousTaskId = existing?.task_id ? Number(existing.task_id) : null;
    const previousStaffEventTaskId = existing?.staff_event_task_id ? Number(existing.staff_event_task_id) : null;
    const previousEventId = existing?.event_id ? Number(existing.event_id) : null;

    const isLateRequest = decision === 'yes' && !timing.isBeforeJ5;
    const adminStatus = decision === 'yes'
      ? (isLateRequest ? 'pending_approval' : 'accepted')
      : (wasPreviouslyYes ? 'cancelled_by_parent' : 'none');

    const chosenDateStr = celebration_date || preferred_date || fmtIsoDate(timing.targetBirthday);
    const isoDate = /^\d{4}-\d{2}-\d{2}/.test(String(chosenDateStr))
      ? String(chosenDateStr).slice(0, 10)
      : fmtIsoDate(timing.targetBirthday);
    const parentMsg = parent_notes || message || null;

    // Règle stricte : Seul le parent concerné peut activer le partage à tous les parents (`notify_other_parents`).
    const userId = req.user.userId || req.user.id;
    const isConcernedParent = Number(child.parent_id) === Number(userId);
    const notifyOthersBool = decision === 'yes'
      ? (isConcernedParent ? Boolean(notify_other_parents) : Boolean(existing?.notify_other_parents))
      : false;

    const defaultTaskInstructions =
      `📋 TÂCHE ANNIVERSAIRE — ${chosenDateStr || 'Jour J'} (15h30)\n` +
      `• Enfant : ${child.first_name} ${child.last_name} (${timing.ageTurning} ans)\n` +
      `• Préparer la couronne d'anniversaire et la décoration\n` +
      `• Prendre des photos pour le diaporama souvenir des parents (affiché 30 jours).`;

    const upsertRes = await pool.query(
      `INSERT INTO birthday_celebrations (
         child_id, year, decision, preferred_date, celebration_iso_date, parent_message,
         contact_channel, notify_other_parents, is_late_request, admin_status, task_instructions, decided_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (child_id, year)
       DO UPDATE SET
         decision = EXCLUDED.decision,
         preferred_date = COALESCE(EXCLUDED.preferred_date, birthday_celebrations.preferred_date),
         celebration_iso_date = COALESCE(EXCLUDED.celebration_iso_date, birthday_celebrations.celebration_iso_date),
         parent_message = COALESCE(EXCLUDED.parent_message, birthday_celebrations.parent_message),
         contact_channel = EXCLUDED.contact_channel,
         notify_other_parents = EXCLUDED.notify_other_parents,
         is_late_request = EXCLUDED.is_late_request,
         admin_status = EXCLUDED.admin_status,
         assigned_staff_id = CASE WHEN EXCLUDED.decision = 'no' THEN NULL ELSE birthday_celebrations.assigned_staff_id END,
         task_id = CASE WHEN EXCLUDED.decision = 'no' THEN NULL ELSE birthday_celebrations.task_id END,
         staff_event_task_id = CASE WHEN EXCLUDED.decision = 'no' THEN NULL ELSE birthday_celebrations.staff_event_task_id END,
         event_id = CASE WHEN EXCLUDED.decision = 'no' THEN NULL ELSE birthday_celebrations.event_id END,
         task_instructions = COALESCE(birthday_celebrations.task_instructions, EXCLUDED.task_instructions),
         decided_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [
        childId,
        timing.targetYear,
        decision,
        chosenDateStr,
        isoDate,
        parentMsg,
        contact_channel,
        notifyOthersBool,
        isLateRequest,
        adminStatus,
        defaultTaskInstructions
      ]
    );

    const celebration = upsertRes.rows[0];

    // Synchroniser l'événement dans la table `events` (création / mise à jour si "yes", annulation si "no")
    const syncedEvent = await syncBirthdayEventInEventsTable({
      child,
      timing,
      celebration: { ...celebration, event_id: celebration.event_id || previousEventId },
      actorUserId: req.user.userId || req.user.id
    });

    // Notifier les administrateurs (et créer une tâche urgente si "yes")
    const adminsRes = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true`
    );

    if (decision === 'no') {
      // 1. Annuler / supprimer toutes les tâches et événements de préparation existants pour cet anniversaire
      try {
        if (previousTaskId) {
          await pool.query(
            `UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1`,
            [previousTaskId]
          );
        }
        await pool.query(
          `UPDATE tasks
           SET status = 'completed', completed_at = NOW()
           WHERE status != 'completed'
             AND (title LIKE $1 OR title LIKE $2)`,
          [
            `%Anniversaire%${child.first_name} ${child.last_name}%`,
            `%anniversaire de ${child.first_name} ${child.last_name}%`
          ]
        );
      } catch (cancelTaskErr) {
        console.warn('⚠️ Annulation tâche anniversaire (tasks):', cancelTaskErr.message);
      }

      try {
        const eventIdsToCancel = [previousEventId, previousStaffEventTaskId].filter(Boolean);
        if (eventIdsToCancel.length > 0) {
          await pool.query(
            `UPDATE events SET status = 'cancelled', deleted_at = NOW(), updated_at = NOW() WHERE id = ANY($1)`,
            [eventIdsToCancel]
          );
        }
        await pool.query(
          `UPDATE events
           SET status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
           WHERE child_id = $1 AND type IN ('birthday', 'task') AND deleted_at IS NULL`,
          [childId]
        );
      } catch (cancelEvErr) {
        console.warn('⚠️ Annulation événement/tâche anniversaire (events):', cancelEvErr.message);
      }

      // 2. Notifier clairement tous les administrateurs
      const notifType = wasPreviouslyYes ? 'warning' : 'info';
      const adminNotifTitle = wasPreviouslyYes
        ? `🚫 Annulation Fête Anniversaire — ${child.first_name} ${child.last_name}`
        : `🏠 Anniversaire de ${child.first_name} : Rien à prévoir`;
      const adminNotifMsg = wasPreviouslyYes
        ? `Le parent de ${child.first_name} ${child.last_name} (${timing.ageTurning} ans) a annulé l'organisation de la fête à la crèche (fêté uniquement en famille). L'événement calendrier et la tâche d'organisation ont été annulés automatiquement.`
        : `Le parent de ${child.first_name} ${child.last_name} a indiqué qu'aucune fête n'est à prévoir à la crèche.`;

      const adminIds = adminsRes.rows.map((a) => Number(a.id));
      for (const admin of adminsRes.rows) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, false, NOW())`,
            [admin.id, adminNotifTitle, adminNotifMsg, notifType, childId]
          );
        } catch (notifErr) {
          console.warn('⚠️ Notification admin (non/annulation):', notifErr.message);
        }
      }

      // 3. Si un membre du staff était déjà assigné à la préparation, le notifier aussi de l'annulation
      if (previousStaffId && !adminIds.includes(previousStaffId)) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
             VALUES ($1, $2, $3, 'warning', $4, false, NOW())`,
            [
              previousStaffId,
              `🚫 Tâche Anniversaire annulée — ${child.first_name} ${child.last_name}`,
              `Le parent de ${child.first_name} (${timing.ageTurning} ans) a annulé la fête d'anniversaire à la crèche. Votre tâche de préparation a été annulée automatiquement.`,
              childId
            ]
          );
        } catch (staffNotifErr) {
          console.warn('⚠️ Notification staff (annulation anniversaire):', staffNotifErr.message);
        }
      }
    } else if (decision === 'yes') {
      const visibilityNote = notifyOthersBool
        ? '📢 Événement partagé avec tous les parents de la crèche.'
        : '🔒 Événement visible uniquement par le parent concerné, le staff et la direction.';

      const urgentTitle = isLateRequest
        ? `🚨 Demande Anniversaire Tardive (J-${Math.max(0, timing.daysUntil)}) — ${child.first_name} ${child.last_name}`
        : `🎂 Organisation Anniversaire — ${child.first_name} ${child.last_name} (${timing.ageTurning} ans)`;

      const urgentDesc =
        `Parent : ${child.parent_first_name || ''} ${child.parent_last_name || ''} (${child.parent_phone || child.mother_phone || 'Tél non renseigné'})\n` +
        `Jour souhaité : ${chosenDateStr || 'À définir'}\n` +
        `${visibilityNote}\n` +
        (isLateRequest ? `⚠️ Demande effectuée à moins de 5 jours : en attente de votre validation.\n` : '') +
        `Message : ${parentMsg || 'Souhaite fêter l\'anniversaire à la crèche.'}\n` +
        `🔗 Lien: /anniversaire/${child.id}`;

      // Créer une tâche urgente pour le premier admin si pas encore créée
      const firstAdminId = adminsRes.rows[0]?.id;
      if (firstAdminId && !celebration.task_id) {
        try {
          const taskResult = await pool.query(
            `INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority, status)
             VALUES ($1, $2, $3, $4, CURRENT_DATE, 'urgent', 'pending')
             RETURNING id`,
            [urgentTitle, urgentDesc, firstAdminId, req.user.userId || firstAdminId]
          );
          if (taskResult.rows[0]?.id) {
            await pool.query(
              `UPDATE birthday_celebrations SET task_id = $1 WHERE id = $2`,
              [taskResult.rows[0].id, celebration.id]
            );
            celebration.task_id = taskResult.rows[0].id;
          }
        } catch (taskErr) {
          console.warn('⚠️ Création tâche urgente anniversaire:', taskErr.message);
        }
      }

      for (const admin of adminsRes.rows) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
             VALUES ($1, $2, $3, 'warning', $4, false, NOW())`,
            [admin.id, urgentTitle, urgentDesc, childId]
          );
        } catch (notifErr) {
          console.warn('⚠️ Notification admin (oui):', notifErr.message);
        }
      }

      // Si le parent a activé le toggle "Informer les autres parents", envoyer une notification aux autres parents
      if (notifyOthersBool) {
        try {
          const otherParentsRes = await pool.query(
            `SELECT id FROM users WHERE role = 'parent' AND is_active = true AND ($1::int IS NULL OR id != $1)`,
            [child.parent_id || null]
          );
          for (const p of otherParentsRes.rows) {
            await pool.query(
              `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
               VALUES ($1, $2, $3, 'info', $4, false, NOW())`,
              [
                p.id,
                `🎂 Anniversaire à la crèche : ${child.first_name} fête ses ${timing.ageTurning} ans !`,
                `La famille de ${child.first_name} a le plaisir d'informer les parents qu'une fête d'anniversaire aura lieu à la crèche (${chosenDateStr}).`,
                childId
              ]
            );
          }
        } catch (notifErr) {
          console.warn('⚠️ Notification autres parents:', notifErr.message);
        }
      }
    }

    res.json({
      success: true,
      message:
        decision === 'yes'
          ? notifyOthersBool
            ? `🎉 Décision enregistrée ! L'événement a été créé dans le calendrier et partagé avec tous les parents, le staff et la direction.`
            : `🎉 Décision enregistrée ! L'événement a été créé (visible par vous, le staff et la direction).`
          : `Décision enregistrée (« Rien à prévoir »).`,
      celebration: {
        ...celebration,
        decision_status: celebration.decision,
        admin_approval_status: celebration.admin_status,
        celebration_date: celebration.celebration_iso_date || celebration.preferred_date,
        notify_other_parents: Boolean(celebration.notify_other_parents),
        created_event: syncedEvent,
        can_change_mind_from_no: celebration.decision === 'no' && timing.isBeforeJ5
      }
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/birthdays/child/:childId/decision:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement de la décision'
    });
  }
});

/**
 * PATCH /api/birthdays/child/:childId/visibility
 * RÈGLE STRICTE : SEUL LE PARENT CONCERNÉ a le droit de publier/partager l'événement d'anniversaire
 * à tous les autres parents (`notify_other_parents`). L'admin et le staff n'ont pas ce droit.
 */
router.patch('/child/:childId/visibility', auth.authenticateToken, async (req, res) => {
  try {
    await ensureBirthdayTables();
    const childId = parseInt(req.params.childId, 10);
    const { notify_other_parents } = req.body;
    const notifyBool = Boolean(notify_other_parents);

    const childRes = await pool.query(`SELECT * FROM children WHERE id = $1`, [childId]);
    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childRes.rows[0];
    const userId = req.user.userId || req.user.id;

    // Seul le parent concerné peut modifier la visibilité
    if (Number(child.parent_id) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Seul le parent concerné a le droit de publier ou partager l\'événement d\'anniversaire à tous les parents.'
      });
    }

    const timing = computeBirthdayTiming(child.birth_date);

    const updRes = await pool.query(
      `UPDATE birthday_celebrations
       SET notify_other_parents = $1, updated_at = NOW()
       WHERE child_id = $2 AND year = $3
       RETURNING *`,
      [notifyBool, childId, timing.targetYear]
    );

    if (updRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Veuillez d\'abord enregistrer votre décision de fêter l\'anniversaire à la crèche.'
      });
    }

    const celebration = updRes.rows[0];
    const syncedEvent = await syncBirthdayEventInEventsTable({
      child,
      timing,
      celebration,
      actorUserId: userId
    });

    res.json({
      success: true,
      message: notifyBool
        ? '📢 L\'événement d\'anniversaire est maintenant affiché à tout le monde (tous les parents, le staff et la direction).'
        : '🔒 L\'événement d\'anniversaire est maintenant affiché uniquement pour vous, le staff et la direction.',
      celebration: {
        ...celebration,
        decision_status: celebration.decision,
        admin_approval_status: celebration.admin_status,
        notify_other_parents: Boolean(celebration.notify_other_parents),
        created_event: syncedEvent
      }
    });
  } catch (error) {
    console.error('❌ Erreur PATCH /api/birthdays/child/:childId/visibility:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la visibilité de l\'événement'
    });
  }
});

/**
 * POST /api/birthdays/child/:childId/admin-action
 * Actions Direction & Staff :
 * - accept / reject : Accepter/Refuser une demande tardive
 * - assign_staff : Assigner la tâche au staff (synchronisée dans `tasks`, `events(type='task')` et `notifications`)
 * - complete_staff_task : Marquer la tâche préparatoire staff comme terminée
 */
router.post('/child/:childId/admin-action', auth.authenticateToken, async (req, res) => {
  try {
    await ensureBirthdayTables();
    const childId = parseInt(req.params.childId, 10);
    const {
      action,
      assigned_staff_id,
      task_instructions,
      admin_task_notes,
      preferred_date,
      celebration_date
    } = req.body;

    const resolvedTaskNotes = task_instructions || admin_task_notes || '';
    const resolvedDate = celebration_date || preferred_date || null;

    const childRes = await pool.query(`SELECT * FROM children WHERE id = $1`, [childId]);
    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childRes.rows[0];
    const isStaffOrAdmin = ['admin', 'staff', 'directrice', 'developer'].includes(req.user.role);
    if (!isStaffOrAdmin) {
      return res.status(403).json({ success: false, error: 'Accès réservé à la direction et au staff' });
    }
    const timing = computeBirthdayTiming(child.birth_date);

    // S'assurer qu'une ligne birthday_celebrations existe
    await pool.query(
      `INSERT INTO birthday_celebrations (child_id, year, decision, admin_status)
       VALUES ($1, $2, 'yes', 'pending')
       ON CONFLICT (child_id, year) DO NOTHING`,
      [childId, timing.targetYear]
    );

    if (action === 'accept' || action === 'reject') {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      const upd = await pool.query(
        `UPDATE birthday_celebrations
         SET admin_status = $1,
             decision = CASE WHEN $1 = 'accepted' THEN 'yes' ELSE decision END,
             updated_at = NOW()
         WHERE child_id = $2 AND year = $3
         RETURNING *`,
        [newStatus, childId, timing.targetYear]
      );

      const updatedCelebration = upd.rows[0];
      const syncedEvent = await syncBirthdayEventInEventsTable({
        child,
        timing,
        celebration: updatedCelebration,
        actorUserId: req.user.userId || req.user.id
      });

      // Notifier le parent
      if (child.parent_id) {
        try {
          const notifTitle = action === 'accept'
            ? `🎉 Anniversaire de ${child.first_name} confirmé par la direction !`
            : `ℹ️ Information concernant l'anniversaire de ${child.first_name}`;
          const notifMsg = action === 'accept'
            ? `La direction a accepté votre demande pour fêter l'anniversaire de ${child.first_name} à la crèche.`
            : `En raison du délai court d'organisation, la direction ne pourra pas organiser la fête ce jour-là. Contactez-nous pour en discuter.`;

          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, false, NOW())`,
            [child.parent_id, notifTitle, notifMsg, action === 'accept' ? 'success' : 'info', childId]
          );
        } catch (notifErr) {
          console.warn('⚠️ Notification parent accept/reject:', notifErr.message);
        }
      }

      return res.json({
        success: true,
        message: action === 'accept' ? 'Demande acceptée avec succès et événement confirmé' : 'Demande refusée',
        celebration: {
          ...updatedCelebration,
          decision_status: updatedCelebration.decision,
          admin_approval_status: updatedCelebration.admin_status,
          created_event: syncedEvent
        }
      });
    }

    if (action === 'assign_staff') {
      const staffId = parseInt(assigned_staff_id, 10);
      if (isNaN(staffId)) {
        return res.status(400).json({ success: false, error: 'Veuillez sélectionner un membre du staff' });
      }

      const existingCelebRes = await pool.query(
        `SELECT * FROM birthday_celebrations WHERE child_id = $1 AND year = $2 LIMIT 1`,
        [childId, timing.targetYear]
      );
      const currentCeleb = existingCelebRes.rows[0] || {};

      const dueDate = resolvedDate && /^\d{4}-\d{2}-\d{2}/.test(String(resolvedDate))
        ? String(resolvedDate).slice(0, 10)
        : (timing.targetBirthday >= new Date()
          ? fmtIsoDate(timing.targetBirthday)
          : fmtIsoDate(new Date()));

      const { taskRow, eventTaskRow } = await syncStaffTaskInEventsAndTasks({
        child,
        timing,
        celebration: currentCeleb,
        staffId,
        taskNotes: resolvedTaskNotes,
        dueDate,
        actorUserId: req.user.userId || req.user.id
      });

      const upd = await pool.query(
        `UPDATE birthday_celebrations
         SET assigned_staff_id = $1,
             task_instructions = $2,
             preferred_date = COALESCE($3, preferred_date),
             celebration_iso_date = COALESCE($4, celebration_iso_date),
             admin_status = 'accepted',
             decision = 'yes',
             task_id = COALESCE($5, task_id),
             staff_event_task_id = COALESCE($6, staff_event_task_id),
             updated_at = NOW()
         WHERE child_id = $7 AND year = $8
         RETURNING *`,
        [
          staffId,
          resolvedTaskNotes,
          resolvedDate,
          /^\d{4}-\d{2}-\d{2}/.test(String(resolvedDate || '')) ? String(resolvedDate).slice(0, 10) : null,
          taskRow?.id || null,
          eventTaskRow?.id || null,
          childId,
          timing.targetYear
        ]
      );

      const updatedCelebration = upd.rows[0];
      const syncedEvent = await syncBirthdayEventInEventsTable({
        child,
        timing,
        celebration: updatedCelebration,
        actorUserId: req.user.userId || req.user.id
      });

      return res.json({
        success: true,
        message: 'Tâche anniversaire assignée au membre du staff (visible dans Tâches du jour & Tâches) !',
        celebration: {
          ...updatedCelebration,
          decision_status: updatedCelebration.decision,
          admin_approval_status: updatedCelebration.admin_status,
          created_event: syncedEvent,
          assigned_task: taskRow || eventTaskRow
        },
        task: taskRow || eventTaskRow
      });
    }

    if (action === 'complete_staff_task') {
      const celebRes = await pool.query(
        `SELECT * FROM birthday_celebrations WHERE child_id = $1 AND year = $2 LIMIT 1`,
        [childId, timing.targetYear]
      );
      const celeb = celebRes.rows[0];
      if (celeb?.task_id) {
        await pool.query(
          `UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [celeb.task_id]
        );
      }
      if (celeb?.staff_event_task_id) {
        await pool.query(
          `UPDATE events SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [celeb.staff_event_task_id]
        );
      }
      return res.json({
        success: true,
        message: '✅ Tâche préparatoire marquée comme terminée !'
      });
    }

    return res.status(400).json({ success: false, error: 'Action non reconnue' });
  } catch (error) {
    console.error('❌ Erreur POST /api/birthdays/child/:childId/admin-action:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de l\'action direction'
    });
  }
});

/**
 * POST /api/birthdays/child/:childId/memories
 * Publie des photos souvenirs depuis l'ordinateur/mobile (fichiers multipart ou base64/URL)
 * pour le diaporama de 30 jours, notifie le parent, et publie/met à jour le diaporama dans la page Activités.
 */
router.post('/child/:childId/memories', auth.authenticateToken, upload.array('photos_files', 10), async (req, res) => {
  try {
    await ensureBirthdayTables();
    const childId = parseInt(req.params.childId, 10);
    const {
      photos = [],
      photo_url,
      caption,
      author_name,
      share_to_activities = true
    } = req.body;

    const childRes = await pool.query(`SELECT * FROM children WHERE id = $1`, [childId]);
    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childRes.rows[0];
    const isStaffOrAdmin = ['admin', 'staff', 'directrice', 'developer'].includes(req.user.role);
    if (!isStaffOrAdmin) {
      return res.status(403).json({ success: false, error: 'Accès réservé à la direction et au staff' });
    }
    const timing = computeBirthdayTiming(child.birth_date);

    let itemsToInsert = [];

    // 1. Si des fichiers ont été envoyés via multipart/form-data (`photos_files`)
    if (Array.isArray(req.files) && req.files.length > 0) {
      const hasCloudinary = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );
      for (const file of req.files) {
        let uploadedUrl = null;
        if (hasCloudinary) {
          try {
            const up = await cloudinaryService.uploadFile(file.buffer, 'birthdays', 'image');
            uploadedUrl = up?.url || null;
          } catch (cloudErr) {
            console.warn('⚠️ Fallback base64 (Cloudinary indisponible):', cloudErr.message);
          }
        }
        if (!uploadedUrl) {
          const mime = file.mimetype || 'image/jpeg';
          uploadedUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
        }
        itemsToInsert.push({
          photo_url: uploadedUrl,
          caption: caption || `🎂 Joyeux anniversaire ${child.first_name} !`,
          author_name: author_name || `${req.user.first_name || 'Équipe'} ${req.user.last_name || 'éducative'}`.trim()
        });
      }
    }

    // 2. Si des photos ont été envoyées en JSON (tableau d'objets avec base64 ou URL)
    const parsedPhotos = typeof photos === 'string'
      ? (() => { try { return JSON.parse(photos); } catch { return []; } })()
      : photos;

    if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
      for (const p of parsedPhotos) {
        if (p && p.photo_url) {
          itemsToInsert.push({
            photo_url: p.photo_url,
            caption: p.caption || caption || `🎂 Joyeux anniversaire ${child.first_name} !`,
            author_name: p.author_name || author_name || 'Équipe éducative'
          });
        }
      }
    } else if (photo_url) {
      itemsToInsert.push({
        photo_url,
        caption: caption || `🎂 Joyeux anniversaire ${child.first_name} !`,
        author_name: author_name || 'Équipe éducative'
      });
    }

    if (itemsToInsert.length === 0) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner au moins une photo depuis votre appareil' });
    }

    const inserted = [];
    for (const item of itemsToInsert) {
      const r = await pool.query(
        `INSERT INTO birthday_memories (child_id, year, photo_url, caption, author_name, published_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '30 days')
         RETURNING *`,
        [
          childId,
          timing.targetYear,
          item.photo_url,
          item.caption || `🎂 Joyeux anniversaire ${child.first_name} !`,
          item.author_name || 'Équipe éducative'
        ]
      );
      inserted.push(r.rows[0]);
    }

    // Récupérer toutes les photos souvenirs de l'année cible pour synchroniser le diaporama dans la page Activités
    const allYearMemoriesRes = await pool.query(
      `SELECT * FROM birthday_memories WHERE child_id = $1 AND year = $2 ORDER BY id ASC`,
      [childId, timing.targetYear]
    );
    const celebRes = await pool.query(
      `SELECT * FROM birthday_celebrations WHERE child_id = $1 AND year = $2 LIMIT 1`,
      [childId, timing.targetYear]
    );
    const celebration = celebRes.rows[0] || null;

    let syncedActivity = null;
    const shouldShareActivity =
      share_to_activities === true ||
      share_to_activities === 'true' ||
      timing.isPostBirthdayMonth ||
      timing.isToday;

    if (shouldShareActivity && allYearMemoriesRes.rows.length > 0) {
      syncedActivity = await syncBirthdaySlideshowToActivities({
        child,
        timing,
        celebration,
        memories: allYearMemoriesRes.rows,
        actorUserId: req.user.userId || req.user.id
      });
    }

    // Envoyer la notification au parent : "📸 Les souvenirs de l'anniversaire de [Enfant] sont disponibles !"
    if (child.parent_id) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
           VALUES ($1, $2, $3, 'success', $4, false, NOW())`,
          [
            child.parent_id,
            `📸 Les souvenirs de l'anniversaire de ${child.first_name} sont disponibles !`,
            `Accédez au diaporama souvenir des ${timing.ageTurning} ans de ${child.first_name} et téléchargez ses photos (disponible pendant 30 jours).`,
            childId
          ]
        );
      } catch (notifErr) {
        console.warn('⚠️ Notification parent souvenirs:', notifErr.message);
      }
    }

    res.json({
      success: true,
      message: syncedActivity
        ? `📸 ${inserted.length} photo(s) ajoutée(s) au diaporama souvenir et publiée(s) sur la page Activités !`
        : `📸 ${inserted.length} photo(s) ajoutée(s) au diaporama souvenir et parent notifié !`,
      memories: inserted,
      activity: syncedActivity
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/birthdays/child/:childId/memories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout des souvenirs'
    });
  }
});

/**
 * POST /api/birthdays/child/:childId/share-activity
 * Publie ou met à jour manuellement le diaporama de TOUTES les photos d'anniversaire de l'enfant
 * dans la page Activités (`table activities`, `media_type = 'images'`).
 */
router.post('/child/:childId/share-activity', auth.authenticateToken, async (req, res) => {
  try {
    await ensureBirthdayTables();
    const childId = parseInt(req.params.childId, 10);

    const childRes = await pool.query(`SELECT * FROM children WHERE id = $1`, [childId]);
    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childRes.rows[0];
    const timing = computeBirthdayTiming(child.birth_date);

    const memoriesRes = await pool.query(
      `SELECT * FROM birthday_memories
       WHERE child_id = $1 AND year IN ($2, $3)
       ORDER BY year DESC, id ASC`,
      [childId, timing.targetYear, timing.targetYear - 1]
    );
    const currentYearMemories = memoriesRes.rows.filter(m => Number(m.year) === timing.targetYear);
    const memoriesToShare = currentYearMemories.length > 0 ? currentYearMemories : memoriesRes.rows;

    if (memoriesToShare.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune photo souvenir à partager dans la page Activités.'
      });
    }

    // S'assurer qu'une ligne birthday_celebrations existe
    await pool.query(
      `INSERT INTO birthday_celebrations (child_id, year, decision, admin_status)
       VALUES ($1, $2, 'yes', 'accepted')
       ON CONFLICT (child_id, year) DO NOTHING`,
      [childId, timing.targetYear]
    );
    const celebRes = await pool.query(
      `SELECT * FROM birthday_celebrations WHERE child_id = $1 AND year = $2 LIMIT 1`,
      [childId, timing.targetYear]
    );
    const celebration = celebRes.rows[0];

    const activityRow = await syncBirthdaySlideshowToActivities({
      child,
      timing,
      celebration,
      memories: memoriesToShare,
      actorUserId: req.user.userId || req.user.id
    });

    if (!activityRow) {
      return res.status(500).json({
        success: false,
        error: 'Impossible de créer la publication dans la page Activités.'
      });
    }

    res.json({
      success: true,
      message: `📰 Diaporama de ${memoriesToShare.length} photo(s) publié avec succès dans la page Activités !`,
      activity: activityRow
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/birthdays/child/:childId/share-activity:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du partage du diaporama vers la page Activités'
    });
  }
});

module.exports = router;

