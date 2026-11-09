/**
 * Service de gestion financière, tarification et cotisations
 * Crèche Mima Elghalia
 */

const db = require('../config/db_postgres');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pushNotificationService = require('./pushNotificationService');

async function logActivity(userId, action, description, metadata = {}) {
  try {
    const title = metadata.title || description?.slice(0, 200) || action || 'Opération financière';
    await db.query(`
      INSERT INTO activity_logs (user_id, action, category, severity, title, description, metadata, created_at)
      VALUES ($1, $2, 'payment', 'info', $3, $4, $5, NOW())
    `, [userId || null, action, title, description, JSON.stringify(metadata)]);
  } catch (err) {
    console.warn('[BillingService] Log activity error:', err.message);
  }
}

let datesColumnsChecked = false;
async function ensureBillingDateColumns() {
  if (datesColumnsChecked) return;
  try {
    await db.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS admission_date DATE;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS departure_date TIMESTAMP;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS departure_reason TEXT;
      UPDATE children SET admission_date = created_at::date WHERE admission_date IS NULL;
    `);
    datesColumnsChecked = true;
  } catch (err) {
    console.warn('[BillingService] Note: vérification colonnes dates children:', err.message);
  }
}
ensureBillingDateColumns();

/**
 * Calcule l'année scolaire pour une date donnée (ex: Septembre 2026 -> '2026-2027', Janvier 2027 -> '2026-2027')
 */
function getSchoolYear(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();

  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Récupère les paramètres de tarification depuis nursery_settings
 */
async function getSettings() {
  try {
    const res = await db.query(`
      SELECT setting_key, value_fr
      FROM nursery_settings
      WHERE setting_key IN (
        'billing_enabled',
        'tariff_full_day_monthly',
        'tariff_half_day_monthly',
        'tariff_saturday_monthly',
        'tariff_insurance_annual',
        'billing_due_day'
      )
    `);

    const map = {};
    res.rows.forEach(r => {
      map[r.setting_key] = r.value_fr;
    });

    return {
      billing_enabled: map.billing_enabled === 'true',
      tariff_full_day_monthly: parseFloat(map.tariff_full_day_monthly || '130') || 130,
      tariff_half_day_monthly: parseFloat(map.tariff_half_day_monthly || '100') || 100,
      tariff_saturday_monthly: parseFloat(map.tariff_saturday_monthly || '20') || 20,
      tariff_insurance_annual: parseFloat(map.tariff_insurance_annual || '60') || 60,
      billing_due_day: parseInt(map.billing_due_day || '5', 10) || 5
    };
  } catch (error) {
    console.warn('[BillingService] Erreur lecture settings, valeurs de repli:', error.message);
    return {
      billing_enabled: false,
      tariff_full_day_monthly: 130,
      tariff_half_day_monthly: 100,
      tariff_saturday_monthly: 20,
      tariff_insurance_annual: 60,
      billing_due_day: 5
    };
  }
}

/**
 * Met à jour les paramètres de tarification
 */
async function updateSettings(settingsData) {
  const keys = [
    'billing_enabled',
    'tariff_full_day_monthly',
    'tariff_half_day_monthly',
    'tariff_saturday_monthly',
    'tariff_insurance_annual',
    'billing_due_day'
  ];

  for (const key of keys) {
    if (settingsData[key] !== undefined) {
      const val = String(settingsData[key]);
      await db.query(`
        INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
        VALUES ($1, $2, $2, 'billing', true)
        ON CONFLICT (setting_key)
        DO UPDATE SET value_fr = $2, value_ar = $2, updated_at = NOW()
      `, [key, val]);
    }
  }

  return await getSettings();
}

/**
 * Génère une facture / cotisation mensuelle pour un enfant
 */
async function generateInvoiceForChild(child, periodMonth, periodYear, options = {}) {
  await ensureBillingDateColumns();
  const {
    isFirstEnrollment = false,
    prorataAmount = null,
    includeInsurance = isFirstEnrollment,
    customDiscount = null,
    createdBy = null
  } = options;

  const settings = await getSettings();
  const schoolYear = getSchoolYear(new Date(periodYear, periodMonth - 1, 1));
  const careSchedule = (child.care_schedule === 'half_day') ? 'half_day' : 'full_day';

  // Règle Métier 0 : Vérification formelle de la date d'admission et de départ / suspension de l'enfant
  // Un enfant ne peut JAMAIS être facturé pour une période antérieure à son mois d'admission officiel,
  // ni pour un mois où il a été suspendu avant le 1er jour du mois (actif 0 jour).
  const childInfoRes = await db.query(`
    SELECT c.id, c.created_at, c.admission_date, c.departure_date, c.is_active, e.enrollment_date
    FROM children c
    LEFT JOIN enrollments e ON e.child_id = c.id
    WHERE c.id = $1
    ORDER BY e.enrollment_date ASC NULLS LAST
    LIMIT 1
  `, [child.id]);
  const cInfo = childInfoRes.rows[0] || child;
  const rawAdmission = cInfo.admission_date || cInfo.enrollment_date || cInfo.created_at || child.created_at;
  if (rawAdmission) {
    const admitDate = new Date(rawAdmission);
    const admitYear = admitDate.getFullYear();
    const admitMonth = admitDate.getMonth() + 1;
    if (periodYear < admitYear || (periodYear === admitYear && periodMonth < admitMonth)) {
      // Période antérieure à l'admission de l'enfant : ne jamais facturer
      return null;
    }
  }

  // Règle suspension : si l'enfant est suspendu/inactif et sa date de départ est antérieure au 1er jour du mois visé
  const startOfMonth = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
  const isSuspended = cInfo.is_active === false || child.is_active === false;
  const depDate = cInfo.departure_date || child.departure_date;
  if (isSuspended && depDate && new Date(depDate) < startOfMonth) {
    // Enfant suspendu avant ce mois (aucun jour actif ce mois-ci) : aucune facture à émettre
    return null;
  }

  // Règle Métier 3 : Le mois d'Août (mois 8) est la période de fermeture annuelle (congé) de la crèche par défaut
  const isAugustVacation = (periodMonth === 8 && !options.allowSummerClub && settings.summer_club_active !== 'true');
  if (isAugustVacation) {
    const result = await db.query(`
      INSERT INTO child_invoices (
        child_id, parent_id, period_month, period_year, school_year,
        care_schedule, base_price, saturday_price, insurance_price,
        discount_amount, previous_arrears, total_due, amount_paid, status,
        payment_method, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 0, 0, 0, 0, 'cancelled', 'cash', $7, $8, NOW(), NOW())
      ON CONFLICT (child_id, period_year, period_month)
      DO UPDATE SET
        base_price = 0,
        saturday_price = 0,
        insurance_price = 0,
        discount_amount = 0,
        previous_arrears = 0,
        total_due = 0,
        status = 'cancelled',
        notes = $7,
        updated_at = NOW()
      WHERE child_invoices.status != 'paid'
      RETURNING *
    `, [
      child.id,
      child.parent_id || null,
      periodMonth,
      periodYear,
      schoolYear,
      careSchedule,
      'Fermeture annuelle crèche (Congé d\'août)',
      createdBy
    ]);
    return result.rows[0];
  }

  const halfDayTariff = parseFloat(settings.tariff_half_day_monthly) || 100;
  const fullDayTariff = parseFloat(settings.tariff_full_day_monthly) || 130;
  const satTariff = parseFloat(settings.tariff_saturday_monthly) || 20;
  const insTariff = parseFloat(settings.tariff_insurance_annual) || 60;

  const basePrice = prorataAmount !== null
    ? (parseFloat(prorataAmount) || 0)
    : (careSchedule === 'half_day' ? halfDayTariff : fullDayTariff);

  const saturdayPrice = child.saturday_attendance ? satTariff : 0;

  // Déterminer si l'assurance annuelle obligatoire d'inscription doit être incluse :
  // 1. Si explicitement demandé (includeInsurance === true, ex: rentrée de septembre)
  // 2. Si l'assurance pour cette année scolaire est déjà acquittée sur la fiche enfant (insurance_paid_school_year === schoolYear) -> FALSE (0 DT)
  // 3. Sinon, si aucune facture antérieure dans cette année scolaire ne l'a encore comptabilisée -> TRUE (+60 DT sur 1ère facture)
  let finalIncludeInsurance = false;
  if (includeInsurance === true) {
    finalIncludeInsurance = true;
  } else if (child.insurance_paid_school_year === schoolYear) {
    finalIncludeInsurance = false;
  } else {
    const existingIns = await db.query(`
      SELECT id FROM child_invoices
      WHERE child_id = $1 AND school_year = $2 AND insurance_price > 0
      LIMIT 1
    `, [child.id, schoolYear]);
    if (existingIns.rows.length === 0) {
      finalIncludeInsurance = true;
    }
  }

  const insurancePrice = finalIncludeInsurance ? insTariff : 0;
  const discountAmount = customDiscount !== null
    ? (parseFloat(customDiscount) || 0)
    : (parseFloat(child.monthly_discount) || 0);

  // OPTION A : Calcul du report des arriérés / reste à payer des mois précédents
  let previousArrears = 0;
  if (options.forceArrears !== undefined) {
    previousArrears = Math.max(0, parseFloat(options.forceArrears) || 0);
  } else {
    const prevUnpaidRes = await db.query(`
      SELECT GREATEST(0,
        COALESCE(SUM(GREATEST(0, base_price + saturday_price + insurance_price - discount_amount)), 0)
        - COALESCE(SUM(amount_paid), 0)
      ) as arrears
      FROM child_invoices
      WHERE child_id = $1
        AND (period_year < $2 OR (period_year = $2 AND period_month < $3))
        AND status != 'cancelled'
    `, [child.id, periodYear, periodMonth]);

    previousArrears = Math.max(0, parseFloat(prevUnpaidRes.rows[0]?.arrears || 0));
  }

  const monthCharges = Math.max(0, basePrice + saturdayPrice + insurancePrice - discountAmount);
  const totalDue = monthCharges + previousArrears;

  const result = await db.query(`
    INSERT INTO child_invoices (
      child_id, parent_id, period_month, period_year, school_year,
      care_schedule, base_price, saturday_price, insurance_price,
      discount_amount, previous_arrears, total_due, amount_paid, status,
      payment_method, notes, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 'pending', 'cash', $13, $14, NOW(), NOW())
    ON CONFLICT (child_id, period_year, period_month)
    DO UPDATE SET
      care_schedule = EXCLUDED.care_schedule,
      base_price = EXCLUDED.base_price,
      saturday_price = EXCLUDED.saturday_price,
      insurance_price = EXCLUDED.insurance_price,
      discount_amount = EXCLUDED.discount_amount,
      previous_arrears = EXCLUDED.previous_arrears,
      total_due = EXCLUDED.total_due,
      updated_at = NOW()
    WHERE child_invoices.status != 'paid'
    RETURNING *
  `, [
    child.id,
    child.parent_id || null,
    periodMonth,
    periodYear,
    schoolYear,
    careSchedule,
    basePrice,
    saturdayPrice,
    insurancePrice,
    discountAmount,
    previousArrears,
    totalDue,
    prorataAmount !== null
      ? `Calcul prorata appliqué (${basePrice} DT)`
      : (previousArrears > 0 ? `Report arriérés antérieur(s) inclus : +${previousArrears} DT` : null),
    createdBy
  ]);

  if (insurancePrice > 0) {
    try {
      await db.query(`
        UPDATE children
        SET insurance_paid_school_year = $1
        WHERE id = $2 AND (insurance_paid_school_year IS NULL OR insurance_paid_school_year != $1)
      `, [schoolYear, child.id]);
    } catch (e) {
      console.warn('[BillingService] Mise à jour insurance_paid_school_year ignorée:', e.message);
    }
  }

  return result.rows[0];
}

/**
 * Génère les cotisations mensuelles pour tous les enfants actifs
 */
async function generateMonthlyInvoices(periodMonth, periodYear, createdBy = null) {
  await ensureBillingDateColumns();
  const m = parseInt(periodMonth, 10);
  const y = parseInt(periodYear, 10);
  const startOfTargetMonth = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const endOfTargetMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString();

  // Nettoyer automatiquement d'éventuelles factures fantômes 'pending' non payées :
  // 1. Pour les enfants admis après cette période
  // 2. Pour les enfants suspendus avant le début de cette période (règle : suspendu tout le mois = 0 facture)
  try {
    await db.query(`
      DELETE FROM child_invoices ci
      USING children c
      LEFT JOIN enrollments e ON e.child_id = c.id
      WHERE ci.child_id = c.id
        AND ci.period_month = $1 AND ci.period_year = $2
        AND ci.status = 'pending' AND COALESCE(ci.amount_paid, 0) = 0
        AND (
          COALESCE(c.admission_date, e.enrollment_date, c.created_at::date) > $3::date
          OR (c.is_active = false AND c.departure_date IS NOT NULL AND c.departure_date::date < $4::date)
        )
    `, [m, y, endOfTargetMonth, startOfTargetMonth]);
  } catch (cleanErr) {
    console.warn('[BillingService] Purge factures postérieures/suspendues ignorée:', cleanErr.message);
  }

  // Règle suspension : Si l'enfant est resté actif au moins 1 jour dans le mois, il a une facture.
  // S'il est suspendu depuis un mois antérieur, il n'est plus comptabilisé.
  const children = await db.query(`
    SELECT DISTINCT ON (c.id) c.id, c.first_name, c.last_name, c.parent_id, c.care_schedule,
           c.saturday_attendance, c.monthly_discount, c.insurance_paid_school_year, c.created_at,
           COALESCE(c.admission_date, e.enrollment_date, c.created_at::date) as effective_admission_date
    FROM children c
    LEFT JOIN enrollments e ON e.child_id = c.id
    WHERE (c.is_active = true OR (c.departure_date IS NOT NULL AND c.departure_date::date >= $2::date))
      AND (COALESCE(c.admission_date, e.enrollment_date, c.created_at::date) <= $1::date)
    ORDER BY c.id, e.enrollment_date ASC NULLS LAST
  `, [endOfTargetMonth, startOfTargetMonth]);

  const createdInvoices = [];

  for (let i = 0; i < children.rows.length; i++) {
    const child = children.rows[i];
    
    // Pour les inscriptions antérieures sans régime configuré, simuler une répartition réaliste :
    // 2/3 en journée complète, 1/3 en demi-journée, et 1 sur 3 avec le samedi
    let simulatedSchedule = child.care_schedule;
    if (!simulatedSchedule) {
      simulatedSchedule = (i % 3 === 0) ? 'half_day' : 'full_day';
      // Mettre à jour en base pour pérenniser la donnée
      await db.query(`UPDATE children SET care_schedule = $1 WHERE id = $2`, [simulatedSchedule, child.id]);
      child.care_schedule = simulatedSchedule;
    }

    if (child.saturday_attendance === null || child.saturday_attendance === undefined) {
      child.saturday_attendance = (i % 4 === 1);
      await db.query(`UPDATE children SET saturday_attendance = $1 WHERE id = $2`, [child.saturday_attendance, child.id]);
    }

    // Si c'est septembre (mois 9), inclure l'assurance annuelle obligatoire pour tous
    const isSeptember = periodMonth === 9;
    const inv = await generateInvoiceForChild(child, periodMonth, periodYear, {
      includeInsurance: isSeptember,
      createdBy
    });
    if (inv) {
      createdInvoices.push(inv);
    }
  }

  // Après génération des cotisations mensuelles, imputer automatiquement l'avoir des parents créditeurs
  try {
    const credParents = await db.query(`
      SELECT DISTINCT u.id as parent_id
      FROM users u
      JOIN child_invoices ci ON ci.parent_id = u.id
      WHERE u.credit_balance > 0 AND ci.status != 'paid' AND ci.status != 'cancelled'
    `);
    for (const cp of credParents.rows) {
      await autoApplyParentCredit(cp.parent_id);
    }
  } catch (gCredErr) {
    console.warn('[BillingService] autoApplyParentCredit après génération:', gCredErr.message);
  }

  return {
    success: true,
    count: createdInvoices.length,
    period: `${periodMonth}/${periodYear}`
  };
}

/**
 * Applique automatiquement le solde d'avoir (credit_balance) d'un parent
 * sur ses cotisations impayées par ordre chronologique.
 */
async function autoApplyParentCredit(parentId) {
  if (!parentId) return 0;

  const userRes = await db.query(
    'SELECT id, credit_balance FROM users WHERE id = $1',
    [parentId]
  );
  if (userRes.rows.length === 0) return 0;

  let currentCredit = parseFloat(userRes.rows[0].credit_balance || 0);
  if (currentCredit <= 0) return 0;

  const unpaidRes = await db.query(`
    SELECT ci.*
    FROM child_invoices ci
    WHERE ci.parent_id = $1
      AND ci.status != 'paid'
      AND ci.status != 'cancelled'
    ORDER BY ci.period_year ASC, ci.period_month ASC, ci.id ASC
  `, [parentId]);

  if (unpaidRes.rows.length === 0) return 0;

  let totalCreditConsumed = 0;

  for (const inv of unpaidRes.rows) {
    if (currentCredit <= 0) break;

    const due = Math.max(0, parseFloat(inv.total_due || 0) - parseFloat(inv.amount_paid || 0));
    if (due <= 0) continue;

    const applyAmount = Math.min(due, currentCredit);
    const newPaid = parseFloat(inv.amount_paid || 0) + applyAmount;
    const newStatus = newPaid >= parseFloat(inv.total_due) ? 'paid' : 'partial';
    const newCreditUsed = parseFloat(inv.credit_used || 0) + applyAmount;
    const autoReceipt = inv.receipt_number || `REC-${inv.period_year}${String(inv.period_month).padStart(2, '0')}-AVOIR-${String(inv.id).padStart(4, '0')}`;

    currentCredit = Math.max(0, currentCredit - applyAmount);
    totalCreditConsumed += applyAmount;

    await db.query(`
      UPDATE child_invoices
      SET amount_paid = $1,
          status = $2::varchar,
          credit_used = $3,
          receipt_number = $4,
          paid_at = CASE WHEN $2::varchar = 'paid' THEN NOW() ELSE paid_at END,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $5
            ELSE notes || ' ' || $5
          END,
          updated_at = NOW()
      WHERE id = $6
    `, [
      newPaid,
      newStatus,
      newCreditUsed,
      autoReceipt,
      `[Avoir déduit : ${applyAmount.toFixed(2)} DT]`,
      inv.id
    ]);
  }

  if (totalCreditConsumed > 0) {
    await db.query(`
      UPDATE users
      SET credit_balance = $1
      WHERE id = $2
    `, [currentCredit, parentId]);

    try {
      await logActivity(
        parentId,
        'payment_received',
        `Déduction automatique d'avoir : ${totalCreditConsumed.toFixed(2)} TND appliqués sur les cotisations du foyer (solde restant : ${currentCredit.toFixed(2)} TND)`,
        { parent_id: parentId, credit_consumed: totalCreditConsumed, remaining_credit: currentCredit }
      );
    } catch (e) {
      console.warn('[BillingService] Log autoApply error:', e.message);
    }
  }

  return totalCreditConsumed;
}

/**
 * Liste les factures avec filtres et pagination
 */
async function getInvoices(filters = {}) {
  await ensureBillingDateColumns();
  const {
    month,
    year,
    status,
    child_id,
    parent_id,
    search = '',
    page = 1,
    limit = 50
  } = filters;

  if (parent_id) {
    try {
      await autoApplyParentCredit(parent_id);
    } catch (credErr) {
      console.warn('[BillingService] autoApplyParentCredit ignoré:', credErr.message);
    }
  } else {
    try {
      const credParents = await db.query(`
        SELECT DISTINCT u.id as parent_id
        FROM users u
        JOIN child_invoices ci ON ci.parent_id = u.id
        WHERE u.credit_balance > 0 AND ci.status != 'paid' AND ci.status != 'cancelled'
      `);
      for (const cp of credParents.rows) {
        await autoApplyParentCredit(cp.parent_id);
      }
    } catch (gCredErr) {
      console.warn('[BillingService] autoApplyParentCredit global ignoré:', gCredErr.message);
    }
  }

  const conditions = ['1=1'];
  const values = [];
  let idx = 1;

  if (month) {
    conditions.push(`ci.period_month = $${idx++}`);
    values.push(parseInt(month, 10));
  }

  if (year) {
    conditions.push(`ci.period_year = $${idx++}`);
    values.push(parseInt(year, 10));
  }

  // Si une période mensuelle précise est demandée, n'afficher que les enfants inscrits au plus tard pendant ce mois-là
  // et exclure les enfants suspendus avant le début du mois (sauf s'ils ont déjà un règlement dessus)
  if (month && year) {
    const startOfTargetMonth = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1)).toISOString();
    const endOfTargetMonth = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59, 999)).toISOString();
    conditions.push(`(COALESCE(c.admission_date, c.created_at::date) <= $${idx++}::date)`);
    values.push(endOfTargetMonth);
    conditions.push(`(c.is_active = true OR (c.departure_date IS NOT NULL AND c.departure_date::date >= $${idx++}::date) OR ci.amount_paid > 0)`);
    values.push(startOfTargetMonth);
  }

  if (status && status !== 'all') {
    conditions.push(`ci.status = $${idx++}`);
    values.push(status);
  }

  if (child_id) {
    conditions.push(`ci.child_id = $${idx++}`);
    values.push(child_id);
  }

  if (parent_id) {
    conditions.push(`ci.parent_id = $${idx++}`);
    values.push(parent_id);

    // Espace Parent : n'afficher que les mois passés et le mois en cours,
    // OU les mois futurs qui ont fait l'objet d'un paiement ou d'un acompte anticipé !
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    conditions.push(`(
      ci.period_year < ${curYear} 
      OR (ci.period_year = ${curYear} AND ci.period_month <= ${curMonth})
      OR (ci.status = 'paid' OR ci.amount_paid > 0)
    )`);
    conditions.push(`NOT (ci.status = 'cancelled' AND ci.total_due = 0)`);
  }

  if (search && search.trim() !== '') {
    conditions.push(`(
      LOWER(c.first_name) LIKE LOWER($${idx}) OR
      LOWER(c.last_name) LIKE LOWER($${idx}) OR
      LOWER(u.first_name) LIKE LOWER($${idx}) OR
      LOWER(u.last_name) LIKE LOWER($${idx}) OR
      ci.receipt_number LIKE $${idx}
    )`);
    values.push(`%${search.trim()}%`);
    idx++;
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    LEFT JOIN users u ON ci.parent_id = u.id
    WHERE ${conditions.join(' AND ')}
  `;
  const countRes = await db.query(countQuery, values);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  const query = `
    SELECT 
      ci.*,
      ci.total_due as amount_due,
      c.first_name as child_first_name,
      c.last_name as child_last_name,
      c.photo_url as child_photo_url,
      c.birth_date as child_birth_date,
      u.first_name as parent_first_name,
      u.last_name as parent_last_name,
      u.email as parent_email,
      u.phone as parent_phone,
      COALESCE(u.credit_balance, 0.00) as parent_credit_balance
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    LEFT JOIN users u ON ci.parent_id = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ci.period_year DESC, ci.period_month DESC, c.first_name ASC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(limit, offset);

  const result = await db.query(query, values);

  // Détection des encaissements réels du mois calendaire (Comptabilité de Caisse Réelle)
  const selectedM = month ? parseInt(month, 10) : null;
  const selectedY = year ? parseInt(year, 10) : null;
  const cashCollectedMap = new Map();

  if (selectedM && selectedY) {
    try {
      const cashRes = await db.query(`
        SELECT 
          ci.parent_id,
          COALESCE(SUM(ci.amount_paid), 0) as total_cash_collected,
          COALESCE(SUM(CASE WHEN (ci.period_year > $2) OR (ci.period_year = $2 AND ci.period_month > $1) THEN ci.amount_paid ELSE 0 END), 0) as advance_cash_amount,
          COALESCE(SUM(CASE WHEN ci.period_month = $1 AND ci.period_year = $2 THEN ci.amount_paid ELSE 0 END), 0) as current_month_cash,
          COALESCE(SUM(CASE WHEN (ci.period_year < $2) OR (ci.period_year = $2 AND ci.period_month < $1) THEN ci.amount_paid ELSE 0 END), 0) as arrears_cash
        FROM child_invoices ci
        WHERE EXTRACT(MONTH FROM ci.paid_at) = $1
          AND EXTRACT(YEAR FROM ci.paid_at) = $2
          AND ci.status != 'cancelled'
          AND ci.amount_paid > 0
        GROUP BY ci.parent_id
      `, [selectedM, selectedY]);

      for (const row of cashRes.rows) {
        if (row.parent_id) {
          cashCollectedMap.set(`parent_${row.parent_id}`, {
            total_cash_collected: parseFloat(row.total_cash_collected || 0),
            advance_cash_amount: parseFloat(row.advance_cash_amount || 0),
            current_month_cash: parseFloat(row.current_month_cash || 0),
            arrears_cash: parseFloat(row.arrears_cash || 0)
          });
        }
      }
    } catch (cashErr) {
      console.warn('[BillingService] Erreur récupération cashCollectedMap:', cashErr.message);
    }
  }

  // Annotation de chaque facture : détection si soldée par anticipation
  for (const inv of result.rows) {
    let isAdvancePaid = false;
    let advancePaidDate = null;
    let advancePaidMonth = null;
    let advancePaidYear = null;

    if (inv.paid_at && (inv.status === 'paid' || parseFloat(inv.amount_paid || 0) >= parseFloat(inv.total_due || 0))) {
      const pDate = new Date(inv.paid_at);
      const pMonth = pDate.getUTCMonth() + 1;
      const pYear = pDate.getUTCFullYear();
      if (pYear < inv.period_year || (pYear === inv.period_year && pMonth < inv.period_month)) {
        isAdvancePaid = true;
        advancePaidDate = inv.paid_at;
        advancePaidMonth = pMonth;
        advancePaidYear = pYear;
      }
    }

    inv.is_advance_paid = isAdvancePaid;
    inv.advance_paid_date = advancePaidDate;
    inv.advance_paid_month = advancePaidMonth;
    inv.advance_paid_year = advancePaidYear;
  }

  // Construction du regroupement par famille (Foyer)
  const familyMap = new Map();
  for (const inv of result.rows) {
    const parentKey = inv.parent_id 
      ? `parent_${inv.parent_id}` 
      : `orphan_${inv.parent_first_name || ''}_${inv.parent_last_name || ''}_${inv.id}`;

    if (!familyMap.has(parentKey)) {
      const cashInfo = cashCollectedMap.get(parentKey) || {
        total_cash_collected: 0,
        advance_cash_amount: 0,
        current_month_cash: 0,
        arrears_cash: 0
      };

      familyMap.set(parentKey, {
        family_id: parentKey,
        parent_id: inv.parent_id || null,
        parent_name: (inv.parent_first_name && inv.parent_last_name)
          ? `${inv.parent_first_name} ${inv.parent_last_name}`
          : (inv.parent_first_name || inv.parent_last_name || 'Parent non renseigné'),
        parent_email: inv.parent_email,
        parent_phone: inv.parent_phone,
        credit_balance: parseFloat(inv.parent_credit_balance || 0),
        period_month: inv.period_month,
        period_year: inv.period_year,
        invoices: [],
        children_count: 0,
        total_due: 0,
        amount_paid: 0,
        remaining_due: 0,
        status: 'paid',
        cash_collected_in_period: cashInfo.total_cash_collected,
        advance_cash_amount: cashInfo.advance_cash_amount,
        current_month_cash: cashInfo.current_month_cash,
        arrears_cash: cashInfo.arrears_cash,
        is_advance_paid: false,
        advance_paid_date: null,
        advance_receipt_number: null
      });
    }

    const fam = familyMap.get(parentKey);
    fam.invoices.push(inv);
    fam.children_count = fam.invoices.length;
    const invDue = parseFloat(inv.total_due || 0);
    const invPaid = parseFloat(inv.amount_paid || 0);
    fam.total_due += invDue;
    fam.amount_paid += invPaid;
    fam.remaining_due += Math.max(0, invDue - invPaid);
  }

  const families = Array.from(familyMap.values()).map(f => {
    if (f.remaining_due <= 0 && f.total_due > 0) {
      f.status = 'paid';
    } else if (f.amount_paid > 0) {
      f.status = 'partial';
    } else {
      f.status = 'pending';
    }

    // Si toutes les factures de cette famille pour ce mois ont été réglées en avance
    const allAdvancePaid = f.invoices.length > 0 && f.invoices.every(i => i.is_advance_paid);
    f.is_advance_paid = allAdvancePaid;
    if (allAdvancePaid) {
      const advInv = f.invoices.find(i => i.advance_paid_date) || f.invoices[0];
      f.advance_paid_date = advInv.advance_paid_date;
      f.advance_receipt_number = advInv.receipt_number;
    }

    return f;
  });

  return {
    invoices: result.rows,
    families,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Enregistre un encaissement (individuel ou groupé pour fratrie)
 */
async function recordPayment(invoiceId, paymentData) {
  const {
    amount,
    paymentMethod = 'cash',
    receiptNumber,
    notes,
    recordedBy,
    includeInvoiceIds = []
  } = paymentData;

  const targetIds = [parseInt(invoiceId, 10), ...includeInvoiceIds.map(id => parseInt(id, 10))]
    .filter((v, i, a) => !isNaN(v) && a.indexOf(v) === i);

  const invsRes = await db.query(
    `SELECT * FROM child_invoices WHERE id = ANY($1::int[]) ORDER BY id ASC`,
    [targetIds]
  );

  if (invsRes.rows.length === 0) {
    throw new Error('Facture(s) introuvable(s)');
  }

  const primaryInvoice = invsRes.rows.find(r => r.id === parseInt(invoiceId, 10)) || invsRes.rows[0];
  const autoReceipt = receiptNumber || `REC-${primaryInvoice.period_year}${String(primaryInvoice.period_month).padStart(2, '0')}-${String(primaryInvoice.id).padStart(4, '0')}`;

  const totalDueAll = invsRes.rows.reduce((sum, inv) => sum + parseFloat(inv.total_due || 0), 0);
  const totalPaidGiven = amount !== undefined && amount !== null && !isNaN(parseFloat(amount))
    ? parseFloat(amount)
    : totalDueAll;

  let remainingToDistribute = totalPaidGiven;
  let primaryUpdated = null;
  const allUpdated = [];

  for (const inv of invsRes.rows) {
    const invDue = parseFloat(inv.total_due || 0);
    let invPaid = 0;
    if (remainingToDistribute >= invDue) {
      invPaid = invDue;
      remainingToDistribute -= invDue;
    } else {
      invPaid = remainingToDistribute;
      remainingToDistribute = 0;
    }

    const finalStatus = invPaid >= invDue ? 'paid' : (invPaid > 0 ? 'partial' : inv.status);

    const updated = await db.query(`
      UPDATE child_invoices
      SET
        amount_paid = $1,
        status = $2,
        payment_method = $3,
        receipt_number = $4,
        notes = COALESCE($5, notes),
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [invPaid, finalStatus, paymentMethod, autoReceipt, notes || null, inv.id]);

    const updatedRow = updated.rows[0];
    allUpdated.push(updatedRow);
    if (updatedRow.id === primaryInvoice.id) {
      primaryUpdated = updatedRow;
    }

    if (parseFloat(inv.insurance_price || 0) > 0) {
      try {
        await db.query(`
          UPDATE children
          SET insurance_paid_school_year = $1
          WHERE id = $2
        `, [inv.school_year, inv.child_id]);
      } catch (insErr) {
        console.warn('[BillingService] Maj insurance_paid_school_year ignorée:', insErr.message);
      }
    }

    // Logger l'activité
    try {
      await logActivity(
        recordedBy,
        'payment_received',
        `Paiement reçu : ${invPaid} TND (${paymentMethod}) pour la facture #${inv.id} (reçu groupé ${autoReceipt})`,
        { invoice_id: inv.id, child_id: inv.child_id, amount: invPaid, receipt_number: autoReceipt }
      );
    } catch (logErr) {
      console.warn('[BillingService] Log payment error:', logErr.message);
    }
  }

  return {
    ...(primaryUpdated || primaryInvoice),
    receipt_number: autoReceipt,
    invoices: allUpdated,
    total_paid: totalPaidGiven
  };
}

/**
 * Enregistrement d'un règlement groupé pour une famille (multi-enfants et/ou multi-mois)
 */
async function recordFamilyPayment(paymentData) {
  const {
    parentId,
    childIds = [],
    monthsCount = 1,
    startMonth,
    startYear,
    amountGiven,
    paymentMethod = 'cash',
    notes = '',
    discounts,
    recordedBy
  } = paymentData;

  if (!childIds || childIds.length === 0) {
    throw new Error('Veuillez sélectionner au moins un enfant à régler');
  }

  const now = new Date();
  const baseMonth = parseInt(startMonth, 10) || (now.getMonth() + 1);
  const baseYear = parseInt(startYear, 10) || now.getFullYear();
  const countMonths = Math.min(6, Math.max(1, parseInt(monthsCount, 10) || 1));

  // Règle Métier : Ordre chronologique strict.
  // Si le foyer a des arriérés, ils sont imputés en priorité sur la facture du mois en cours
  // avant que les fonds résiduels ne soient alloués aux mois futurs (ou reversés en avoir).

  // 1. Déterminer les périodes à régler (chronologique)
  const periods = [];
  let curM = baseMonth;
  let curY = baseYear;
  for (let m = 0; m < countMonths; m++) {
    periods.push({ month: curM, year: curY });
    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
  }

  // 2. Récupérer les informations des enfants sélectionnés
  const childrenRes = await db.query(
    `SELECT id, first_name, last_name, parent_id, care_schedule, saturday_attendance, monthly_discount, insurance_paid_school_year
     FROM children WHERE id = ANY($1::int[])`,
    [childIds]
  );
  const children = childrenRes.rows;
  if (children.length === 0) {
    throw new Error('Aucun enfant valide sélectionné');
  }

  // 3. Pour chaque période et chaque enfant, s'assurer que la facture existe
  const targetInvoices = [];
  for (let pIndex = 0; pIndex < periods.length; pIndex++) {
    const period = periods[pIndex];
    for (const child of children) {
      const existing = await db.query(
        `SELECT * FROM child_invoices WHERE child_id = $1 AND period_month = $2 AND period_year = $3`,
        [child.id, period.month, period.year]
      );
      let inv;
      if (existing.rows.length > 0) {
        inv = existing.rows[0];
      } else {
        inv = await generateInvoiceForChild(child, period.month, period.year, {
          createdBy: recordedBy,
          includeInsurance: (period.month === 9),
          forceArrears: pIndex > 0 ? 0 : undefined
        });
      }
      if (inv) {
        targetInvoices.push(inv);
      }
    }
  }

  // 3.b Traitement des remises saisies directement dans le Règlement Familial
  if (discounts && typeof discounts === 'object') {
    for (const [cIdStr, discInfo] of Object.entries(discounts)) {
      const cId = parseInt(cIdStr, 10);
      const discAmt = parseFloat(discInfo?.discountAmount !== undefined ? discInfo.discountAmount : discInfo);
      if (!isNaN(discAmt) && discAmt >= 0) {
        const updateRec = Boolean(discInfo?.updateRecurring);
        const invRow = targetInvoices.find(inv => inv.child_id === cId && inv.period_month === baseMonth && inv.period_year === baseYear);
        if (invRow) {
          await adjustInvoice(invRow.id, {
            discountAmount: discAmt,
            updateChildRecurringDiscount: updateRec,
            updatedBy: recordedBy
          });
          const refreshed = await db.query(`SELECT * FROM child_invoices WHERE id = $1`, [invRow.id]);
          if (refreshed.rows[0]) {
            Object.assign(invRow, refreshed.rows[0]);
          }
        }
      }
    }
  }

  // 4. Calculer le total attendu restant dû
  let totalRemainingDue = 0;
  for (const inv of targetInvoices) {
    const due = Math.max(0, parseFloat(inv.total_due || 0) - parseFloat(inv.amount_paid || 0));
    totalRemainingDue += due;
  }

  // 5. Récupérer l'avoir / crédit actuel du parent
  let parentCredit = 0;
  if (parentId) {
    const pRes = await db.query(`SELECT id, first_name, last_name, credit_balance FROM users WHERE id = $1`, [parentId]);
    if (pRes.rows.length > 0) {
      parentCredit = parseFloat(pRes.rows[0].credit_balance || 0);
    }
  }

  const effectiveCashGiven = amountGiven !== undefined && amountGiven !== null && !isNaN(parseFloat(amountGiven))
    ? parseFloat(amountGiven)
    : totalRemainingDue;

  // Calcul des fonds utilisables
  let totalFundsAvailable = effectiveCashGiven;
  let creditUsedTotal = 0;

  // Si le paiement versé ne couvre pas tout mais qu'il y a un crédit/avoir disponible :
  if (totalFundsAvailable < totalRemainingDue && parentCredit > 0) {
    const needed = totalRemainingDue - totalFundsAvailable;
    creditUsedTotal = Math.min(needed, parentCredit);
    totalFundsAvailable += creditUsedTotal;
  }

  // Générer un numéro de reçu unique pour toute la famille et l'ensemble de la période
  const firstInv = targetInvoices[0];
  const autoReceipt = `REC-${baseYear}${String(baseMonth).padStart(2, '0')}-FAM-${String(firstInv.id).padStart(4, '0')}`;

  // 6. Répartir les fonds sur les factures (chronologiquement)
  let fundsLeft = totalFundsAvailable;
  const updatedInvoices = [];

  for (const inv of targetInvoices) {
    const invRemaining = Math.max(0, parseFloat(inv.total_due || 0) - parseFloat(inv.amount_paid || 0));
    const payThis = Math.min(fundsLeft, invRemaining);
    const newPaid = parseFloat(inv.amount_paid || 0) + payThis;
    fundsLeft = Math.max(0, fundsLeft - payThis);

    const finalStatus = newPaid >= parseFloat(inv.total_due) ? 'paid' : (newPaid > 0 ? 'partial' : inv.status);

    const periodRangeLabel = countMonths > 1
      ? `[Paiement groupé ${countMonths} mois : ${baseMonth}/${baseYear} à ${periods[periods.length-1].month}/${periods[periods.length-1].year}]`
      : '';
    const combinedNotes = [notes, periodRangeLabel].filter(Boolean).join(' - ');

    const updRes = await db.query(`
      UPDATE child_invoices
      SET amount_paid = $1,
          status = $2,
          payment_method = $3,
          receipt_number = $4,
          paid_at = NOW(),
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $5
            ELSE notes || ' ' || $5
          END,
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [newPaid, finalStatus, paymentMethod, autoReceipt, combinedNotes, inv.id]);

    updatedInvoices.push(updRes.rows[0]);
  }

  // 7. Gestion de l'excédent (surplus) -> versé sur l'avoir du compte parent
  let surplusCredit = 0;
  if (fundsLeft > 0 && parentId) {
    surplusCredit = fundsLeft;
    await db.query(`
      UPDATE users
      SET credit_balance = credit_balance + $1
      WHERE id = $2
    `, [surplusCredit, parentId]);
  }

  // Déduire l'avoir consommé du compte parent
  if (creditUsedTotal > 0 && parentId) {
    await db.query(`
      UPDATE users
      SET credit_balance = GREATEST(0, credit_balance - $1)
      WHERE id = $2
    `, [creditUsedTotal, parentId]);
  }

  // 8. Journalisation d'audit
  try {
    const childNames = children.map(c => `${c.first_name} ${c.last_name}`).join(', ');
    await logActivity(
      recordedBy,
      'family_payment_received',
      `Règlement familial : ${effectiveCashGiven} TND (${paymentMethod}) pour ${children.length} enfant(s) (${childNames}) sur ${countMonths} mois - Reçu ${autoReceipt}` +
      (surplusCredit > 0 ? ` (+${surplusCredit} TND en avoir)` : '') +
      (creditUsedTotal > 0 ? ` (${creditUsedTotal} TND d'avoir déduits)` : ''),
      {
        parent_id: parentId,
        receipt_number: autoReceipt,
        amount: effectiveCashGiven,
        surplus_credit: surplusCredit,
        credit_used: creditUsedTotal,
        months_count: countMonths,
        periods
      }
    );
  } catch (logErr) {
    console.warn('[BillingService] Log family payment error:', logErr.message);
  }

  return {
    success: true,
    receipt_number: autoReceipt,
    primary_invoice_id: firstInv.id,
    total_paid: effectiveCashGiven,
    total_due: totalRemainingDue,
    surplus_credit: surplusCredit,
    credit_used: creditUsedTotal,
    months_count: countMonths,
    periods,
    invoices: updatedInvoices
  };
}

/**
 * Annule un encaissement (droit à l'erreur / remise en statut pending pour correction)
 */
async function voidPayment(invoiceId, voidData = {}) {
  const { reason, voidedBy } = voidData;

  const invCheck = await db.query(`
    SELECT ci.*, c.first_name as child_first_name, c.last_name as child_last_name 
    FROM child_invoices ci 
    JOIN children c ON ci.child_id = c.id 
    WHERE ci.id = $1
  `, [invoiceId]);

  if (invCheck.rows.length === 0) {
    throw new Error('Facture introuvable');
  }

  const invoice = invCheck.rows[0];

  if (invoice.status !== 'paid' && invoice.status !== 'partial' && parseFloat(invoice.amount_paid || 0) <= 0) {
    throw new Error('Cette cotisation n\'a aucun paiement enregistré à annuler');
  }

  const previousReceipt = invoice.receipt_number || 'N/A';
  const previousAmount = parseFloat(invoice.amount_paid || 0);

  const voidNote = `[Encaissement annulé le ${new Date().toISOString().slice(0, 10)} - Reçu ${previousReceipt} (${previousAmount} TND)${reason ? ' - Motif : ' + reason : ''}]`;
  const newNotes = invoice.notes ? `${invoice.notes}\n${voidNote}` : voidNote;

  const result = await db.query(`
    UPDATE child_invoices
    SET
      amount_paid = 0.00,
      status = 'pending',
      receipt_number = NULL,
      paid_at = NULL,
      notes = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [newNotes, invoiceId]);

  // Logger l'activité
  try {
    await logActivity(
      voidedBy,
      'payment_voided',
      `Encaissement annulé : ${previousAmount} TND (reçu ${previousReceipt}) pour la cotisation #${invoice.id} (${invoice.child_first_name} ${invoice.child_last_name})${reason ? ' - Motif : ' + reason : ''}`,
      { invoice_id: invoice.id, child_id: invoice.child_id, voided_receipt: previousReceipt, amount: previousAmount, reason }
    );
  } catch (logErr) {
    console.warn('[BillingService] Log void payment error:', logErr.message);
  }

  return result.rows[0];
}

/**
 * Annule un encaissement familial (ou multi-mois)
 */
async function voidFamilyPayment(params = {}) {
  const { parentId, receiptNumber, periodMonth, periodYear, reason, voidedBy } = params;

  const pMonth = periodMonth ? parseInt(periodMonth, 10) : (new Date().getMonth() + 1);
  const pYear = periodYear ? parseInt(periodYear, 10) : new Date().getFullYear();

  let invoices = [];
  if (receiptNumber) {
    const res = await db.query(`
      SELECT ci.*, c.first_name as child_first_name, c.last_name as child_last_name
      FROM child_invoices ci
      JOIN children c ON ci.child_id = c.id
      WHERE ci.receipt_number = $1
    `, [receiptNumber]);
    invoices = res.rows;
  }

  // Englober toutes les factures de la fratrie pour ce mois et les mois d'avance
  if (parentId) {
    const res = await db.query(`
      SELECT ci.*, c.first_name as child_first_name, c.last_name as child_last_name
      FROM child_invoices ci
      JOIN children c ON ci.child_id = c.id
      WHERE ci.parent_id = $1
        AND (
          (ci.period_year = $2 AND ci.period_month = $3)
          OR (ci.receipt_number = $4)
          OR (ci.period_year > $2 OR (ci.period_year = $2 AND ci.period_month > $3))
        )
        AND (ci.status = 'paid' OR ci.status = 'partial' OR ci.amount_paid > 0 OR ci.receipt_number IS NOT NULL)
    `, [parentId, pYear, pMonth, receiptNumber || '']);

    const seenIds = new Set(invoices.map(i => i.id));
    for (const inv of res.rows) {
      if (!seenIds.has(inv.id)) {
        invoices.push(inv);
        seenIds.add(inv.id);
      }
    }
  }

  if (invoices.length === 0) {
    throw new Error('Aucun encaissement trouvé à annuler pour cette famille');
  }

  const resolvedReceipt = receiptNumber || invoices.find(i => i.receipt_number)?.receipt_number || 'N/A';
  const totalVoidedAmount = invoices.reduce((sum, i) => sum + parseFloat(i.amount_paid || 0), 0);

  const voidNote = `[Encaissement familial annulé le ${new Date().toISOString().slice(0, 10)} - Reçu ${resolvedReceipt} (${totalVoidedAmount.toFixed(2)} TND)${reason ? ' - Motif : ' + reason : ''}]`;

  for (const inv of invoices) {
    const newNotes = inv.notes ? `${inv.notes}\n${voidNote}` : voidNote;

    // Si c'est une facture générée pour un mois futur (avance multi-mois), la supprimer purement et simplement
    const isFutureMonth = (inv.period_year > pYear) || (inv.period_year === pYear && inv.period_month > pMonth);
    if (isFutureMonth) {
      await db.query(`DELETE FROM child_invoices WHERE id = $1`, [inv.id]);
    } else {
      await db.query(`
        UPDATE child_invoices
        SET
          amount_paid = 0.00,
          status = 'pending',
          receipt_number = NULL,
          paid_at = NULL,
          credit_used = 0.00,
          notes = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [newNotes, inv.id]);
    }
  }

  // Annuler également tout surplus / avoir ou restituer le crédit utilisé lié à cet encaissement
  if (parentId) {
    try {
      const logRes = await db.query(`
        SELECT metadata FROM activity_logs
        WHERE action = 'family_payment_received'
          AND (metadata->>'receipt_number' = $1 OR (metadata->>'parent_id')::text = $2)
        ORDER BY id DESC LIMIT 1
      `, [resolvedReceipt, String(parentId)]);

      if (logRes.rows.length > 0 && logRes.rows[0].metadata) {
        const surplus = parseFloat(logRes.rows[0].metadata.surplus_credit || 0);
        const creditUsed = parseFloat(logRes.rows[0].metadata.credit_used || 0);

        if (surplus > 0) {
          await db.query(`
            UPDATE users
            SET credit_balance = GREATEST(0.00, credit_balance - $1)
            WHERE id = $2
          `, [surplus, parentId]);
        }

        if (creditUsed > 0) {
          await db.query(`
            UPDATE users
            SET credit_balance = credit_balance + $1
            WHERE id = $2
          `, [creditUsed, parentId]);
        }
      } else {
        // Fallback de sécurité : réinitialiser l'avoir pour éviter tout résidu orphelin après annulation
        await db.query(`
          UPDATE users
          SET credit_balance = 0.00
          WHERE id = $1
        `, [parentId]);
      }
    } catch (creditErr) {
      console.warn('[BillingService] Annulation avoir parent ignorée:', creditErr.message);
    }
  }

  // Journaliser dans activity_logs
  try {
    await logActivity(
      voidedBy,
      'family_payment_voided',
      `Encaissement familial annulé : ${totalVoidedAmount.toFixed(2)} TND (reçu ${resolvedReceipt}) pour ${invoices.length} cotisation(s)${reason ? ' - Motif : ' + reason : ''}`,
      { parent_id: parentId, voided_receipt: resolvedReceipt, amount: totalVoidedAmount, reason }
    );
  } catch (logErr) {
    console.warn('[BillingService] Log family void error:', logErr.message);
  }

  return {
    success: true,
    voided_receipt: resolvedReceipt,
    total_voided: totalVoidedAmount,
    invoices_count: invoices.length
  };
}

/**
 * Ajuste le montant d'une facture (ex: prorata, modification ou suppression de remise)
 * Permet également de mettre à jour la remise récurrente de l'enfant pour les mois futurs.
 */
async function adjustInvoice(invoiceId, adjustmentData) {
  const totalDue = adjustmentData.totalDue !== undefined && adjustmentData.totalDue !== null ? adjustmentData.totalDue : adjustmentData.adjusted_amount;
  const notes = adjustmentData.notes !== undefined ? adjustmentData.notes : adjustmentData.reason;
  const { basePrice, discountAmount, updateChildRecurringDiscount, updatedBy } = adjustmentData;

  const invCheck = await db.query(`SELECT * FROM child_invoices WHERE id = $1`, [invoiceId]);
  if (invCheck.rows.length === 0) {
    throw new Error('Facture introuvable');
  }
  const currentInv = invCheck.rows[0];

  const updates = [];
  const params = [];
  let pIdx = 1;

  let newBase = currentInv.base_price;
  let newDiscount = currentInv.discount_amount;

  if (basePrice !== undefined && basePrice !== null) {
    newBase = parseFloat(basePrice);
    updates.push(`base_price = $${pIdx++}`);
    params.push(newBase);
  }

  if (discountAmount !== undefined && discountAmount !== null) {
    newDiscount = parseFloat(discountAmount);
    updates.push(`discount_amount = $${pIdx++}`);
    params.push(newDiscount);

    // Si demandé, mettre à jour la remise récurrente sur la fiche de l'enfant pour tous les mois futurs
    if (updateChildRecurringDiscount && currentInv.child_id) {
      await db.query(`UPDATE children SET monthly_discount = $1, updated_at = NOW() WHERE id = $2`, [newDiscount, currentInv.child_id]);
    }
  }

  // Recalculer le total dû si non spécifié explicitement
  let finalTotalDue;
  if (totalDue !== undefined && totalDue !== null) {
    finalTotalDue = parseFloat(totalDue);
  } else {
    const sat = parseFloat(currentInv.saturday_price || 0);
    const ins = parseFloat(currentInv.insurance_price || 0);
    const arr = parseFloat(currentInv.previous_arrears || 0);
    finalTotalDue = Math.max(0, parseFloat(newBase) + sat + ins - parseFloat(newDiscount)) + arr;
  }

  updates.push(`total_due = $${pIdx++}`);
  params.push(finalTotalDue);

  if (notes !== undefined) {
    updates.push(`notes = $${pIdx++}`);
    params.push(notes);
  }

  updates.push(`updated_at = NOW()`);
  params.push(invoiceId);

  const res = await db.query(`
    UPDATE child_invoices
    SET ${updates.join(', ')}
    WHERE id = $${pIdx}
    RETURNING *
  `, params);

  return res.rows[0];
}

/**
 * Envoie un rappel de paiement ciblé Push + In-app
 */
async function sendPaymentReminder(invoiceId, options = {}) {
  const { customMessage, senderId } = options;

  const res = await db.query(`
    SELECT 
      ci.*,
      c.first_name as child_first_name,
      c.last_name as child_last_name,
      u.id as parent_user_id,
      u.first_name as parent_first_name
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    LEFT JOIN users u ON ci.parent_id = u.id
    WHERE ci.id = $1
  `, [invoiceId]);

  if (res.rows.length === 0) {
    throw new Error('Facture introuvable');
  }

  const inv = res.rows[0];
  const parentId = inv.parent_user_id || inv.parent_id;

  if (!parentId) {
    throw new Error('Aucun compte parent associé à cet enfant');
  }

  const amountToPay = (parseFloat(inv.total_due) - parseFloat(inv.amount_paid)).toFixed(2);
  const monthName = new Date(inv.period_year, inv.period_month - 1).toLocaleString('fr-FR', { month: 'long' });

  const title = '💰 Rappel de cotisation crèche';
  const message = customMessage || 
    `Bonjour, la cotisation du mois de ${monthName} ${inv.period_year} pour ${inv.child_first_name} (${amountToPay} TND) est en attente de règlement. Merci de vous rapprocher de la direction.`;

  // 1. Notification in-app
  await db.query(`
    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
    VALUES ($1, $2, $3, 'payment_alert', false, NOW())
  `, [parentId, title, message]);

  // 2. Notification Push PWA
  pushNotificationService.sendPushToUser(parentId, {
    title,
    message,
    url: '/mon-espace'
  });

  // 3. Logger l'action
  try {
    await logActivity(
      senderId,
      'payment_alert_sent',
      `Rappel de paiement envoyé au parent #${parentId} pour ${inv.child_first_name} - ${amountToPay} TND`,
      { invoice_id: invoiceId, child_id: inv.child_id, parent_id: parentId, amount: amountToPay }
    );
  } catch (logErr) {
    console.warn('[BillingService] Log alert error:', logErr.message);
  }

  return {
    success: true,
    recipient: inv.parent_first_name,
    amount: amountToPay
  };
}

/**
 * Résumé financier mensuel pour la crèche
 * Distingue clairement la Comptabilité d'Engagement (Attendu / Facturé)
 * et la Comptabilité de Caisse Réelle (Cash réellement encaissé dans le mois sans fausse accumulation)
 */
async function getFinancialSummary(periodMonth, periodYear) {
  const m = parseInt(periodMonth, 10);
  const y = parseInt(periodYear, 10);
  const endOfTargetMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString();

  // 1. Recettes attendues et facturées pour ce mois spécifique (Comptabilité d'Engagement)
  const invoicesRes = await db.query(`
    SELECT
      COUNT(*) as total_invoices,
      COALESCE(SUM(ci.total_due), 0) as total_invoiced,
      COALESCE(SUM(ci.amount_paid), 0) as total_paid_for_period,
      COALESCE(SUM(GREATEST(0, ci.total_due - ci.amount_paid)), 0) as total_remaining,
      COUNT(CASE WHEN ci.status = 'paid' THEN 1 END) as count_paid,
      COUNT(CASE WHEN ci.status = 'pending' THEN 1 END) as count_pending,
      COUNT(CASE WHEN ci.status = 'overdue' THEN 1 END) as count_overdue,
      COUNT(CASE WHEN ci.care_schedule = 'full_day' THEN 1 END) as count_full_day,
      COUNT(CASE WHEN ci.care_schedule = 'half_day' THEN 1 END) as count_half_day
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    WHERE ci.period_month = $1 AND ci.period_year = $2
      AND (c.created_at IS NULL OR c.created_at <= $3)
      AND ci.status != 'cancelled'
  `, [m, y, endOfTargetMonth]);

  // 2. Flux réels de trésorerie perçus durant le mois calendaire m/y (Comptabilité de Caisse Réelle)
  const cashFlowRes = await db.query(`
    SELECT
      COALESCE(SUM(ci.amount_paid), 0) as total_cash_collected,
      COALESCE(SUM(CASE WHEN ci.period_month = $1 AND ci.period_year = $2 THEN ci.amount_paid ELSE 0 END), 0) as current_month_cash,
      COALESCE(SUM(CASE WHEN (ci.period_year > $2) OR (ci.period_year = $2 AND ci.period_month > $1) THEN ci.amount_paid ELSE 0 END), 0) as advance_cash_collected,
      COALESCE(SUM(CASE WHEN (ci.period_year < $2) OR (ci.period_year = $2 AND ci.period_month < $1) THEN ci.amount_paid ELSE 0 END), 0) as arrears_cash_collected
    FROM child_invoices ci
    WHERE EXTRACT(MONTH FROM ci.paid_at) = $1 
      AND EXTRACT(YEAR FROM ci.paid_at) = $2
      AND ci.status != 'cancelled'
      AND ci.amount_paid > 0
  `, [m, y]);

  // 3. Montant des cotisations de ce mois m/y ayant été déjà réglées en avance lors d'un mois antérieur
  const prepaidEarlierRes = await db.query(`
    SELECT
      COALESCE(SUM(ci.amount_paid), 0) as prepaid_earlier_amount,
      COUNT(*) as count_prepaid_earlier
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    WHERE ci.period_month = $1 AND ci.period_year = $2
      AND ci.paid_at IS NOT NULL
      AND (EXTRACT(YEAR FROM ci.paid_at) < $2 OR (EXTRACT(YEAR FROM ci.paid_at) = $2 AND EXTRACT(MONTH FROM ci.paid_at) < $1))
      AND ci.status != 'cancelled'
      AND ci.amount_paid > 0
      AND (c.created_at IS NULL OR c.created_at <= $3)
  `, [m, y, endOfTargetMonth]);

  // 4. Dépenses de la crèche pour ce mois
  const expensesRes = await db.query(`
    SELECT
      COUNT(*) as total_expenses_count,
      COALESCE(SUM(amount), 0) as total_expenses_amount
    FROM nursery_expenses
    WHERE period_month = $1 AND period_year = $2
  `, [m, y]);

  const invSummary = invoicesRes.rows[0];
  const cashSummary = cashFlowRes.rows[0];
  const prepaidSummary = prepaidEarlierRes.rows[0];
  const expSummary = expensesRes.rows[0];

  const totalInvoiced = parseFloat(invSummary.total_invoiced || 0);
  const totalRemaining = parseFloat(invSummary.total_remaining || 0);
  const totalCashCollected = parseFloat(cashSummary.total_cash_collected || 0);
  const advanceCashCollected = parseFloat(cashSummary.advance_cash_collected || 0);
  const currentMonthCash = parseFloat(cashSummary.current_month_cash || 0);
  const arrearsCashCollected = parseFloat(cashSummary.arrears_cash_collected || 0);
  const prepaidEarlier = parseFloat(prepaidSummary.prepaid_earlier_amount || 0);

  const totalExpenses = parseFloat(expSummary.total_expenses_amount || 0);
  // Trésorerie nette du mois = Total des espèces/virements physiquement encaissés ce mois - Dépenses engagées ce mois
  const netBalance = totalCashCollected - totalExpenses;
  const collectionRate = totalInvoiced > 0 ? Math.round(((totalInvoiced - totalRemaining) / totalInvoiced) * 100) : 0;

  return {
    period: { month: m, year: y },
    total_due: totalInvoiced,
    total_collected: totalCashCollected, // Cash réel disponible en caisse perçu ce mois-ci
    total_remaining: totalRemaining,
    collection_rate: collectionRate,
    incomes: {
      total_invoiced: totalInvoiced,
      total_collected: totalCashCollected,
      total_pending: totalRemaining,
      current_month_cash: currentMonthCash,
      advance_cash_collected: advanceCashCollected,
      arrears_cash_collected: arrearsCashCollected,
      prepaid_earlier: prepaidEarlier,
      count_paid: parseInt(invSummary.count_paid || 0, 10),
      count_pending: parseInt(invSummary.count_pending || 0, 10),
      count_overdue: parseInt(invSummary.count_overdue || 0, 10),
      count_full_day: parseInt(invSummary.count_full_day || 0, 10),
      count_half_day: parseInt(invSummary.count_half_day || 0, 10)
    },
    expenses: {
      total_expenses: totalExpenses,
      count: parseInt(expSummary.total_expenses_count || 0, 10)
    },
    treasury: {
      net_balance: netBalance
    }
  };
}

/**
 * Régularise une cotisation d'un mois passé (historique payé en espèces avant mise en place du logiciel)
 * La date de paiement paid_at est fixée au 15 du mois concerné pour ne pas fausser le cash flow du mois en cours
 */
async function settlePastInvoice(invoiceId, options = {}) {
  const { recordedBy, notes = 'Règlement historique antérieur au logiciel' } = options;
  const invRes = await db.query(`SELECT * FROM child_invoices WHERE id = $1`, [invoiceId]);
  if (invRes.rows.length === 0) {
    const err = new Error('Cotisation introuvable');
    err.status = 404;
    throw err;
  }
  const inv = invRes.rows[0];
  const targetDue = parseFloat(inv.total_due || 0);

  // Date historique : 15 du mois de la facture
  const historicalDate = new Date(Date.UTC(inv.period_year, inv.period_month - 1, 15, 12, 0, 0));
  const autoReceipt = inv.receipt_number || `REC-${inv.period_year}${String(inv.period_month).padStart(2, '0')}-HIST-${String(inv.id).padStart(4, '0')}`;

  const updRes = await db.query(`
    UPDATE child_invoices
    SET amount_paid = $1,
        status = 'paid',
        payment_method = 'Espèces (antérieur)',
        receipt_number = $2,
        paid_at = $3,
        notes = CASE 
          WHEN notes IS NULL OR notes = '' THEN $4
          ELSE notes || ' - ' || $4
        END,
        updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `, [
    targetDue,
    autoReceipt,
    historicalDate.toISOString(),
    `[Régularisation historique : ${notes}]`,
    invoiceId
  ]);

  try {
    await logActivity(
      recordedBy,
      'invoice_settled_past',
      `Régularisation historique validée pour cotisation ${inv.period_month}/${inv.period_year} : ${targetDue} DT (Espèces antérieur)`,
      { invoice_id: invoiceId, child_id: inv.child_id, amount: targetDue, historical_date: historicalDate }
    );
  } catch (e) {
    console.warn('[BillingService] Log settlePastInvoice error:', e.message);
  }

  return updRes.rows[0];
}

/**
 * Régularise toutes les cotisations d'un mois passé pour une famille
 */
async function settlePastFamily(familyData) {
  const { parentId, childIds = [], periodMonth, periodYear, recordedBy, notes = 'Règlement historique antérieur au logiciel' } = familyData;
  const conditions = ['status != $1', 'status != $2'];
  const values = ['paid', 'cancelled'];
  let idx = 3;

  if (periodMonth) {
    conditions.push(`period_month = $${idx++}`);
    values.push(parseInt(periodMonth, 10));
  }
  if (periodYear) {
    conditions.push(`period_year = $${idx++}`);
    values.push(parseInt(periodYear, 10));
  }

  if (parentId) {
    conditions.push(`parent_id = $${idx++}`);
    values.push(parseInt(parentId, 10));
  } else if (childIds && childIds.length > 0) {
    conditions.push(`child_id = ANY($${idx++}::int[])`);
    values.push(childIds);
  } else {
    throw new Error('Identifiant parent ou enfants requis pour la régularisation');
  }

  const query = `
    SELECT * FROM child_invoices
    WHERE ${conditions.join(' AND ')}
  `;
  const targets = await db.query(query, values);
  const settled = [];

  for (const inv of targets.rows) {
    const res = await settlePastInvoice(inv.id, { recordedBy, notes });
    settled.push(res);
  }

  return {
    success: true,
    count: settled.length,
    invoices: settled
  };
}

/**
 * Génère le reçu de paiement officiel en PDF
 * Supporte le reçu individuel et le reçu groupé pour fratrie (plusieurs enfants d'une même famille)
 */
async function generateReceiptPDF(invoiceId, user) {
  const query = `
    SELECT 
      ci.*,
      c.first_name as child_first_name,
      c.last_name as child_last_name,
      c.birth_date as child_birth_date,
      c.saturday_attendance as child_saturday,
      c.care_schedule as child_schedule,
      c.parent_id as child_parent_id,
      COALESCE(u.first_name, '') as parent_first_name,
      COALESCE(u.last_name, '') as parent_last_name,
      COALESCE(u.email, '') as parent_email,
      COALESCE(u.phone, '') as parent_phone
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    LEFT JOIN users u ON u.id = COALESCE(ci.parent_id, c.parent_id)
    WHERE ci.id = $1
  `;
  const res = await db.query(query, [invoiceId]);
  if (res.rows.length === 0) {
    const err = new Error('Facture introuvable');
    err.status = 404;
    throw err;
  }

  const invoice = res.rows[0];

  // Contrôle d'accès : si parent, vérifier qu'il s'agit bien de son enfant
  if (user && user.role === 'parent') {
    const isOwner = (invoice.parent_id && String(invoice.parent_id) === String(user.id)) ||
                    (invoice.child_parent_id && String(invoice.child_parent_id) === String(user.id));
    if (!isOwner) {
      const err = new Error('Accès non autorisé à ce reçu');
      err.status = 403;
      throw err;
    }
  }

  // Récupérer les paramètres réels de la crèche depuis la table nursery_settings
  const settingsRes = await db.query(`
    SELECT setting_key, value_fr
    FROM nursery_settings
    WHERE setting_key IN ('address', 'phone', 'email', 'nursery_name')
  `);
  const settingsMap = {};
  settingsRes.rows.forEach(r => {
    settingsMap[r.setting_key] = r.value_fr;
  });

  const nurseryName = 'CRÈCHE MIMA ELGHALIA';
  const nurseryAddress = settingsMap.address || '8 Rue Bizerte, Medenine 4100, Tunisie';
  const nurseryPhone = settingsMap.phone || '+216 25 95 35 32';
  const nurseryEmail = settingsMap.email || 'contact@mimaelghalia.tn';

  // Détection prioritaire de tous les enfants de la famille (fratrie) pour le mois
  let relatedInvoices = [invoice];
  const effectiveParentId = invoice.parent_id || invoice.child_parent_id;

  if (effectiveParentId) {
    const siblingRes = await db.query(`
      SELECT 
        ci.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date as child_birth_date,
        c.saturday_attendance as child_saturday,
        c.care_schedule as child_schedule
      FROM child_invoices ci
      JOIN children c ON ci.child_id = c.id
      WHERE (ci.parent_id = $1 OR c.parent_id = $1)
        AND ci.period_year = $2
        AND ci.period_month = $3
        AND ci.status != 'cancelled'
      ORDER BY c.first_name ASC
    `, [effectiveParentId, invoice.period_year, invoice.period_month]);

    if (siblingRes.rows.length > 0) {
      relatedInvoices = siblingRes.rows;
    }
  } else if (invoice.receipt_number) {
    const siblingRes = await db.query(`
      SELECT 
        ci.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date as child_birth_date,
        c.saturday_attendance as child_saturday,
        c.care_schedule as child_schedule
      FROM child_invoices ci
      JOIN children c ON ci.child_id = c.id
      WHERE ci.receipt_number = $1
      ORDER BY c.first_name ASC
    `, [invoice.receipt_number]);
    if (siblingRes.rows.length > 0) {
      relatedInvoices = siblingRes.rows;
    }
  }

  // Formatage des données
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const periodMonthName = monthNames[(invoice.period_month - 1) % 12] || `Mois ${invoice.period_month}`;
  const periodLabel = `${periodMonthName} ${invoice.period_year}`;
  
  // Numéro de reçu harmonisé pour toute la fratrie
  const minInvoiceId = Math.min(...relatedInvoices.map(i => i.id));
  const existingSharedReceipt = relatedInvoices.find(i => i.receipt_number)?.receipt_number;
  const receiptNum = existingSharedReceipt || `REC-${invoice.period_year}${String(invoice.period_month).padStart(2, '0')}-${String(minInvoiceId).padStart(4, '0')}`;

  // Synchronisation en base pour que toutes les factures de la fratrie partagent ce même reçu
  if (relatedInvoices.length > 1) {
    const idsToSync = relatedInvoices.map(i => i.id);
    try {
      await db.query(`
        UPDATE child_invoices
        SET receipt_number = $1
        WHERE id = ANY($2::int[]) AND (receipt_number IS NULL OR receipt_number != $1)
      `, [receiptNum, idsToSync]);
    } catch (syncErr) {
      console.warn('[BillingService] Synchronisation numéro de reçu fratrie:', syncErr.message);
    }
  }
  
  const paymentDate = invoice.paid_at 
    ? new Date(invoice.paid_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Totaux combinés pour la fratrie
  const totalDueAll = relatedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_due || 0), 0);
  const amountPaidAll = relatedInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount_paid || 0), 0);
  const balanceAll = Math.max(0, totalDueAll - amountPaidAll);
  const isFamilyGroup = relatedInvoices.length > 1;

  let paymentMethodLabel = 'Règlement en espèces';
  if (invoice.payment_method === 'check') paymentMethodLabel = 'Règlement en chèque';
  else if (invoice.payment_method === 'bank_transfer') paymentMethodLabel = 'Règlement en virement';
  else if (invoice.notes && invoice.notes.toLowerCase().includes('chèque')) paymentMethodLabel = 'Règlement en chèque';
  else if (invoice.notes && invoice.notes.toLowerCase().includes('virement')) paymentMethodLabel = 'Règlement en virement';

  // Fichier logo
  const logoPathBackend = path.join(__dirname, '../assets/logo.jpg');
  const logoPathFrontend = path.join(__dirname, '../../frontend/public/images/logo.jpg');
  const logoFile = fs.existsSync(logoPathBackend)
    ? logoPathBackend
    : (fs.existsSync(logoPathFrontend) ? logoPathFrontend : null);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), receiptNum }));
      doc.on('error', reject);

      // --- STYLES & COULEURS ---
      const primaryColor = '#065f46'; // Emerald 800
      const primaryLight = '#ecfdf5'; // Emerald 50
      const accentGreen = '#059669';  // Emerald 600
      const textDark = '#1e293b';      // Slate 800
      const textMuted = '#64748b';     // Slate 500
      const borderColor = '#cbd5e1';   // Slate 300

      // 1. HEADER (Bandeau de marque avec LOGO)
      doc.rect(40, 40, 515, 4).fill(primaryColor);

      // Insertion du logo si disponible
      if (logoFile) {
        try {
          doc.image(logoFile, 40, 48, { width: 48, height: 48 });
        } catch (imgErr) {
          console.warn('[BillingService] Erreur affichage logo PDF:', imgErr.message);
        }
      }

      const textStartX = logoFile ? 96 : 40;

      // Nom de la crèche (ELGHALIA attaché) & sous-titre
      doc.fontSize(15).fillColor(primaryColor).font('Helvetica-Bold')
         .text(nurseryName, textStartX, 46, { width: 255 });
      
      doc.fontSize(8.5).fillColor(textMuted).font('Helvetica')
         .text('Établissement d\'accueil & d\'éveil de la petite enfance', textStartX, 65, { width: 255 });

      // Adresse réelle dynamique issue de nursery_settings (sur 2 lignes aérées pour éviter tout débordement)
      doc.fontSize(7.5).fillColor(textMuted).font('Helvetica')
         .text(nurseryAddress, textStartX, 78, { width: 255 })
         .text(`Tél : ${nurseryPhone}   •   Email : ${nurseryEmail}`, textStartX, 89, { width: 255 });

      // Badge Reçu (Haut Droit)
      const badgeX = 360;
      const badgeY = 48;
      const badgeW = 195;
      const badgeH = 55;
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6)
         .fillAndStroke(primaryLight, '#a7f3d0');

      doc.fontSize(10.5).fillColor(primaryColor).font('Helvetica-Bold')
         .text('REÇU DE RÈGLEMENT', badgeX + 10, badgeY + 10);
      doc.fontSize(9).fillColor(accentGreen).font('Helvetica-Bold')
         .text(`N° : ${receiptNum}`, badgeX + 10, badgeY + 25);
      doc.fontSize(7.5).fillColor(textDark).font('Helvetica')
         .text(`Date d'émission : ${paymentDate}`, badgeX + 10, badgeY + 39);

      // Ligne de séparation
      doc.strokeColor(borderColor).lineWidth(0.5)
         .moveTo(40, 116).lineTo(555, 116).stroke();

      // 2. ENCADRÉS INFORMATIONS (Bénéficiaires & Période)
      const boxY = 126;
      const boxH = isFamilyGroup ? 98 : 88;
      const colW = 250;

      // Encadré Enfant(s) / Parent (Gauche)
      doc.roundedRect(40, boxY, colW, boxH, 6)
         .fillAndStroke('#f8fafc', borderColor);
      
      doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold')
         .text(isFamilyGroup ? 'BÉNÉFICIAIRES (FRATRIE) & PARENT' : 'BÉNÉFICIAIRE & PARENT', 50, boxY + 8);
      
      const parentName = (invoice.parent_first_name || invoice.parent_last_name)
        ? `${invoice.parent_first_name} ${invoice.parent_last_name}`
        : 'Non renseigné';

      doc.fontSize(8.5).fillColor(textDark).font('Helvetica-Bold')
         .text('Parent :', 50, boxY + 23);
      doc.font('Helvetica').text(parentName, 95, boxY + 23);

      doc.font('Helvetica-Bold').text('Contact :', 50, boxY + 37);
      doc.font('Helvetica').text(invoice.parent_phone || invoice.parent_email || '-', 95, boxY + 37);

      if (isFamilyGroup) {
        doc.font('Helvetica-Bold').text('Enfants :', 50, boxY + 51);
        let childLineY = boxY + 51;
        relatedInvoices.forEach((invItem) => {
          const itemCare = (invItem.care_schedule === 'half_day') ? 'Demi-journée' : 'Journée complète';
          doc.font('Helvetica')
             .text(`• ${invItem.child_first_name} ${invItem.child_last_name} (${itemCare})`, 95, childLineY);
          childLineY += 13;
        });
      } else {
        const careLabel = (invoice.care_schedule === 'half_day') ? 'Demi-journée' : 'Journée complète';
        doc.font('Helvetica-Bold').text('Enfant :', 50, boxY + 51);
        doc.font('Helvetica')
           .text(`${invoice.child_first_name} ${invoice.child_last_name}`, 95, boxY + 51);
        doc.font('Helvetica-Bold').text('Régime :', 50, boxY + 65);
        doc.font('Helvetica').text(`${careLabel}${invoice.child_saturday ? ' (avec samedi)' : ''}`, 95, boxY + 65);
      }

      // Encadré Période / Facturation (Droite)
      const rightBoxX = 305;
      doc.roundedRect(rightBoxX, boxY, colW, boxH, 6)
         .fillAndStroke('#f8fafc', borderColor);

      doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold')
         .text('DÉTAILS DU RÈGLEMENT', rightBoxX + 10, boxY + 8);

      doc.fontSize(8.5).fillColor(textDark).font('Helvetica-Bold')
         .text('Période :', rightBoxX + 10, boxY + 23);
      doc.font('Helvetica').text(periodLabel, rightBoxX + 75, boxY + 23);

      doc.font('Helvetica-Bold').text('Année scol. :', rightBoxX + 10, boxY + 37);
      doc.font('Helvetica').text(invoice.school_year || '-', rightBoxX + 75, boxY + 37);

      doc.font('Helvetica-Bold').text('Mode :', rightBoxX + 10, boxY + 51);
      doc.font('Helvetica').text(paymentMethodLabel, rightBoxX + 75, boxY + 51);

      doc.font('Helvetica-Bold').text('Statut :', rightBoxX + 10, boxY + 65);
      const isPaid = balanceAll <= 0;
      doc.fillColor(isPaid ? accentGreen : '#d97706').font('Helvetica-Bold')
         .text(isPaid ? 'RÉGLÉ INTÉGRALEMENT' : 'PAIEMENT PARTIEL', rightBoxX + 75, boxY + 65);

      // 3. TABLEAU DÉTAILLÉ DES RUBRIQUES (MULTI-ENFANTS OU INDIVIDUEL)
      let tableY = boxY + boxH + 15;
      
      // En-tête du tableau
      doc.roundedRect(40, tableY, 515, 22, 4).fill('#0f172a');
      doc.fontSize(8.5).fillColor('#ffffff').font('Helvetica-Bold')
         .text('DÉSIGNATION DE LA PRESTATION', 50, tableY + 6)
         .text('MONTANT', 460, tableY + 6, { align: 'right', width: 85 });

      tableY += 22;

      let rowIndex = 0;

      relatedInvoices.forEach((invItem) => {
        const itemCare = (invItem.care_schedule === 'half_day') ? 'Demi-journée' : 'Journée complète';
        const base = parseFloat(invItem.base_price || 0);
        const sat = parseFloat(invItem.saturday_price || 0);
        const ins = parseFloat(invItem.insurance_price || 0);
        const disc = parseFloat(invItem.discount_amount || 0);
        const arr = parseFloat(invItem.previous_arrears || 0);

        if (isFamilyGroup) {
          // Ligne intercalaire pour identifier l'enfant
          doc.rect(40, tableY, 515, 18).fill('#e2e8f0');
          doc.fontSize(8.5).fillColor('#334155').font('Helvetica-Bold')
             .text(`Cotisation pour : ${invItem.child_first_name} ${invItem.child_last_name}`, 50, tableY + 4);
          tableY += 18;
        }

        const childRows = [
          { label: `Frais d'accueil mensuels (${itemCare})`, amount: `${base.toFixed(2)} DT`, show: true },
          { label: 'Option accueil samedi matin', amount: `+ ${sat.toFixed(2)} DT`, show: sat > 0 },
          { label: 'Assurance annuelle obligatoire', amount: `+ ${ins.toFixed(2)} DT`, show: ins > 0 },
          { label: 'Remise fratrie / réduction accordée', amount: `- ${disc.toFixed(2)} DT`, show: disc > 0 },
          { label: 'Report solde impayé mois précédent', amount: `+ ${arr.toFixed(2)} DT`, show: arr > 0 }
        ].filter(r => r.show);

        childRows.forEach((row) => {
          const rowH = 20;
          const bg = (rowIndex % 2 === 0) ? '#ffffff' : '#f8fafc';
          doc.rect(40, tableY, 515, rowH).fill(bg);
          doc.strokeColor('#f1f5f9').lineWidth(0.5).rect(40, tableY, 515, rowH).stroke();

          doc.fontSize(8.5).fillColor(textDark).font('Helvetica')
             .text(row.label, isFamilyGroup ? 60 : 50, tableY + 5);
          doc.font('Helvetica-Bold')
             .text(row.amount, 460, tableY + 5, { align: 'right', width: 85 });

          tableY += rowH;
          rowIndex++;
        });
      });

      // Ligne Total Dû Combiné
      doc.rect(40, tableY, 515, 24).fill('#f1f5f9');
      doc.strokeColor(borderColor).lineWidth(0.5).rect(40, tableY, 515, 24).stroke();
      doc.fontSize(9.5).fillColor(textDark).font('Helvetica-Bold')
         .text(isFamilyGroup ? `TOTAL NET EXIGIBLE (Fratrie : ${relatedInvoices.length} enfants)` : 'TOTAL NET EXIGIBLE', 50, tableY + 7);
      doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold')
         .text(`${totalDueAll.toFixed(2)} DT`, 460, tableY + 7, { align: 'right', width: 85 });

      tableY += 34;

      // 4. RÉCAPITULATIF RÈGLEMENT & REÇU
      const payBoxY = tableY;
      const payBoxH = 60;
      doc.roundedRect(40, payBoxY, 515, payBoxH, 6)
         .fillAndStroke(primaryLight, '#6ee7b7');

      doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold')
         .text('RÈGLEMENT EFFECTUÉ', 50, payBoxY + 10);
      
      doc.fontSize(15).fillColor(accentGreen).font('Helvetica-Bold')
         .text(`${amountPaidAll.toFixed(2)} DT`, 50, payBoxY + 25);
      
      const paymentNotes = invoice.notes ? `Note : ${invoice.notes}` : `Mode : ${paymentMethodLabel}`;
      doc.fontSize(7.5).fillColor(textMuted).font('Helvetica')
         .text(`${paymentNotes} • Encaissé le ${paymentDate}`, 50, payBoxY + 44);

      // Solde restant à droite
      doc.fontSize(9.5).fillColor(balanceAll > 0 ? '#b45309' : textDark).font('Helvetica-Bold')
         .text('SOLDE RESTANT DÛ', 360, payBoxY + 10, { align: 'right', width: 185 });
      
      doc.fontSize(15).fillColor(balanceAll > 0 ? '#dc2626' : accentGreen).font('Helvetica-Bold')
         .text(`${balanceAll.toFixed(2)} DT`, 360, payBoxY + 25, { align: 'right', width: 185 });

      doc.fontSize(7.5).fillColor(textMuted).font('Helvetica')
         .text(balanceAll > 0 ? 'À régulariser prochainement' : 'Compte famille à jour pour ce mois', 360, payBoxY + 44, { align: 'right', width: 185 });

      // 5. CACHET & MENTION LÉGALE
      const footerY = Math.max(540, payBoxY + payBoxH + 25);

      // Mentions légales
      doc.fontSize(8).fillColor(textMuted).font('Helvetica-Oblique')
         .text('Pour servir et valoir ce que de droit.', 40, footerY);
      doc.text('Ce reçu est délivré sous réserve de bonne fin d\'encaissement.', 40, footerY + 13);
      doc.text(`Document certifié généré électroniquement par ${nurseryName}.`, 40, footerY + 26);

      // Cadre Cachet & Signature
      const stampX = 355;
      const stampY = footerY - 5;
      const stampW = 200;
      const stampH = 75;
      doc.roundedRect(stampX, stampY, stampW, stampH, 4)
         .strokeColor(borderColor).lineWidth(1).stroke();
      doc.fontSize(8).fillColor(textDark).font('Helvetica-Bold')
         .text('Cachet et Signature de la direction', stampX + 10, stampY + 8, { align: 'center', width: 180 });

      // Tampon virtuel élégant avec nom MIMA ELGHALIA attaché
      doc.circle(stampX + 100, stampY + 45, 20).strokeColor('#10b981').lineWidth(0.8).stroke();
      doc.fontSize(6).fillColor('#059669').font('Helvetica-Bold')
         .text('MIMA ELGHALIA', stampX + 70, stampY + 40, { align: 'center', width: 60 })
         .text('ACQUITTÉ', stampX + 70, stampY + 47, { align: 'center', width: 60 });

      // 6. PIED DE PAGE BAS DE PAGE
      doc.strokeColor(borderColor).lineWidth(0.5)
         .moveTo(40, 780).lineTo(555, 780).stroke();
      
      doc.fontSize(7.5).fillColor(textMuted).font('Helvetica')
         .text(`${nurseryName} • ${nurseryAddress} • Tél : ${nurseryPhone} • Email : ${nurseryEmail}`, 40, 788, { align: 'center', width: 515 });

      // --- FILIGRANE OFFICIEL (Dessiné en surimpression subtile sur toute la page, sans être tronqué) ---
      if (logoFile) {
        try {
          doc.save();
          doc.opacity(0.045); // Filigrane subtil, logo entier 100% visible
          const wmWidth = 300;
          const wmX = (595.28 - wmWidth) / 2; // ~147.6 pt centré sur page A4
          const wmY = 255;
          doc.image(logoFile, wmX, wmY, { width: wmWidth });
          doc.restore();
        } catch (wmErr) {
          console.warn('[BillingService] Erreur filigrane PDF:', wmErr.message);
        }
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  getSchoolYear,
  getSettings,
  updateSettings,
  generateInvoiceForChild,
  generateMonthlyInvoices,
  getInvoices,
  recordPayment,
  recordFamilyPayment,
  autoApplyParentCredit,
  voidPayment,
  voidFamilyPayment,
  adjustInvoice,
  sendPaymentReminder,
  getFinancialSummary,
  generateReceiptPDF,
  settlePastInvoice,
  settlePastFamily
};
