/**
 * Service de gestion financière, tarification et cotisations
 * Crèche Mima Elghalia
 */

const db = require('../config/db_postgres');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pushNotificationService = require('./pushNotificationService');
const { createLog } = require('./activityLogService');

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

  const halfDayTariff = parseFloat(settings.tariff_half_day_monthly) || 100;
  const fullDayTariff = parseFloat(settings.tariff_full_day_monthly) || 130;
  const satTariff = parseFloat(settings.tariff_saturday_monthly) || 20;
  const insTariff = parseFloat(settings.tariff_insurance_annual) || 60;

  const basePrice = prorataAmount !== null
    ? (parseFloat(prorataAmount) || 0)
    : (careSchedule === 'half_day' ? halfDayTariff : fullDayTariff);

  const saturdayPrice = child.saturday_attendance ? satTariff : 0;

  // Déterminer si l'assurance annuelle obligatoire d'inscription doit être incluse :
  // - Si explicitement demandé (includeInsurance === true ou isFirstEnrollment === true)
  // - Ou si l'enfant n'a encore aucune facture avec assurance enregistrée dans cette année scolaire
  let finalIncludeInsurance = !!includeInsurance;
  if (!finalIncludeInsurance) {
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
  const prevUnpaidRes = await db.query(`
    SELECT COALESCE(SUM(total_due - amount_paid), 0) as arrears
    FROM child_invoices
    WHERE child_id = $1
      AND (period_year < $2 OR (period_year = $2 AND period_month < $3))
      AND status != 'paid'
      AND status != 'cancelled'
  `, [child.id, periodYear, periodMonth]);

  const previousArrears = Math.max(0, parseFloat(prevUnpaidRes.rows[0]?.arrears || 0));

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
      insurance_price = GREATEST(child_invoices.insurance_price, EXCLUDED.insurance_price),
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

  return result.rows[0];
}

/**
 * Génère les cotisations mensuelles pour tous les enfants actifs
 */
async function generateMonthlyInvoices(periodMonth, periodYear, createdBy = null) {
  const children = await db.query(`
    SELECT id, first_name, last_name, parent_id, care_schedule, saturday_attendance, monthly_discount
    FROM children
    WHERE is_active = true
  `);

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
    createdInvoices.push(inv);
  }

  return {
    success: true,
    count: createdInvoices.length,
    period: `${periodMonth}/${periodYear}`
  };
}

/**
 * Liste les factures avec filtres et pagination
 */
async function getInvoices(filters = {}) {
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
      u.phone as parent_phone
    FROM child_invoices ci
    JOIN children c ON ci.child_id = c.id
    LEFT JOIN users u ON ci.parent_id = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ci.period_year DESC, ci.period_month DESC, c.first_name ASC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(limit, offset);

  const result = await db.query(query, values);

  return {
    invoices: result.rows,
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

    // Logger l'activité
    try {
      await createLog(
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
 * Ajuste le montant d'une facture (ex: prorata, modification ou suppression de remise)
 * Permet également de mettre à jour la remise récurrente de l'enfant pour les mois futurs.
 */
async function adjustInvoice(invoiceId, adjustmentData) {
  const { totalDue, basePrice, discountAmount, notes, updateChildRecurringDiscount, updatedBy } = adjustmentData;

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
    await createLog(
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
 */
async function getFinancialSummary(periodMonth, periodYear) {
  const m = parseInt(periodMonth, 10);
  const y = parseInt(periodYear, 10);

  // Recettes des cotisations
  const invoicesRes = await db.query(`
    SELECT
      COUNT(*) as total_invoices,
      COALESCE(SUM(total_due), 0) as total_invoiced,
      COALESCE(SUM(amount_paid), 0) as total_collected,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as count_paid,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as count_pending,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as count_overdue,
      COUNT(CASE WHEN care_schedule = 'full_day' THEN 1 END) as count_full_day,
      COUNT(CASE WHEN care_schedule = 'half_day' THEN 1 END) as count_half_day
    FROM child_invoices
    WHERE period_month = $1 AND period_year = $2
  `, [m, y]);

  // Dépenses de la crèche (prévu et opérationnel)
  const expensesRes = await db.query(`
    SELECT
      COUNT(*) as total_expenses_count,
      COALESCE(SUM(amount), 0) as total_expenses_amount
    FROM nursery_expenses
    WHERE period_month = $1 AND period_year = $2
  `, [m, y]);

  const invSummary = invoicesRes.rows[0];
  const expSummary = expensesRes.rows[0];

  const totalCollected = parseFloat(invSummary.total_collected || 0);
  const totalInvoiced = parseFloat(invSummary.total_invoiced || 0);
  const totalRemaining = Math.max(0, totalInvoiced - totalCollected);
  const totalExpenses = parseFloat(expSummary.total_expenses_amount || 0);
  const netBalance = totalCollected - totalExpenses;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  return {
    period: { month: m, year: y },
    total_due: totalInvoiced,
    total_collected: totalCollected,
    total_remaining: totalRemaining,
    collection_rate: collectionRate,
    incomes: {
      total_invoiced: totalInvoiced,
      total_collected: totalCollected,
      total_pending: totalRemaining,
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
  adjustInvoice,
  sendPaymentReminder,
  getFinancialSummary,
  generateReceiptPDF
};
