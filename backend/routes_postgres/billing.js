/**
 * Routes pour la gestion de la facturation, cotisations et finances
 * Crèche Mima Elghalia
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const billingService = require('../services/billingService');
const db = require('../config/db_postgres');

/**
 * GET /api/billing/settings
 * Récupère les tarifs et l'état d'activation (accessible authentifié)
 */
router.get('/settings', auth.authenticateToken, async (req, res) => {
  try {
    const settings = await billingService.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/public-tariffs
 * Tarifs publics visibles dans le formulaire d'inscription (sans authentification)
 */
router.get('/public-tariffs', async (req, res) => {
  try {
    const settings = await billingService.getSettings();
    res.json({
      success: true,
      tariffs: {
        billing_enabled: settings.billing_enabled,
        full_day: settings.tariff_full_day_monthly,
        half_day: settings.tariff_half_day_monthly,
        saturday: settings.tariff_saturday_monthly,
        insurance: settings.tariff_insurance_annual,
        due_day: settings.billing_due_day
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/public-tariffs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/billing/settings
 * Met à jour les paramètres de tarification (admin uniquement)
 */
router.put('/settings', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const updated = await billingService.updateSettings(req.body);
    res.json({ success: true, message: 'Paramètres mis à jour', settings: updated });
  } catch (error) {
    console.error('❌ Erreur PUT /api/billing/settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/invoices
 * Liste des factures (admin / staff)
 */
router.get('/invoices', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const data = await billingService.getInvoices(req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/invoices/generate
 * Génère les cotisations pour un mois donné (admin / staff)
 */
router.post('/invoices/generate', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const month = parseInt(req.body.month, 10) || (new Date().getMonth() + 1);
    const year = parseInt(req.body.year, 10) || new Date().getFullYear();

    const result = await billingService.generateMonthlyInvoices(month, year, req.user.id);
    res.json({
      success: true,
      message: `${result.count} cotisation(s) générée(s) pour la période ${result.period}`,
      count: result.count,
      generated_count: result.count
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/invoices/generate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/invoices/:id/pay
 * Enregistre un paiement (espèces par défaut)
 */
router.post('/invoices/:id/pay', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { amount, paymentMethod, payment_method, receiptNumber, notes, includeInvoiceIds } = req.body;

    const invoice = await billingService.recordPayment(invoiceId, {
      amount,
      paymentMethod: paymentMethod || payment_method || 'cash',
      receiptNumber,
      notes,
      includeInvoiceIds: Array.isArray(includeInvoiceIds) ? includeInvoiceIds : [],
      recordedBy: req.user.id
    });

    res.json({ success: true, message: 'Paiement enregistré avec succès', invoice });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/invoices/:id/pay:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/family-pay
 * Enregistrement d'un règlement groupé pour une famille (multi-enfants et/ou multi-mois)
 */
router.post('/family-pay', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const {
      parentId,
      childIds,
      monthsCount,
      startMonth,
      startYear,
      amount,
      paymentMethod,
      payment_method,
      notes,
      discounts
    } = req.body;

    const result = await billingService.recordFamilyPayment({
      parentId: parentId ? parseInt(parentId, 10) : null,
      childIds: Array.isArray(childIds) ? childIds.map(id => parseInt(id, 10)) : [],
      monthsCount: parseInt(monthsCount, 10) || 1,
      startMonth: startMonth ? parseInt(startMonth, 10) : undefined,
      startYear: startYear ? parseInt(startYear, 10) : undefined,
      amountGiven: amount !== undefined ? parseFloat(amount) : undefined,
      paymentMethod: paymentMethod || payment_method || 'cash',
      notes: notes || '',
      discounts,
      recordedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Règlement familial enregistré avec succès (${result.receipt_number})`,
      ...result
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/family-pay:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/invoices/:id/void-payment
 * Annule un encaissement (droit à l'erreur / remise en statut pending pour correction)
 */
router.post('/invoices/:id/void-payment', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { reason } = req.body;

    const invoice = await billingService.voidPayment(invoiceId, {
      reason,
      voidedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Encaissement annulé avec succès',
      invoice
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/invoices/:id/void-payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/family-void-payment
 * Annule un encaissement familial (ou multi-mois)
 */
router.post('/family-void-payment', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { parentId, receiptNumber, periodMonth, periodYear, reason } = req.body;

    const result = await billingService.voidFamilyPayment({
      parentId: parentId ? parseInt(parentId, 10) : null,
      receiptNumber: receiptNumber || null,
      periodMonth: periodMonth ? parseInt(periodMonth, 10) : undefined,
      periodYear: periodYear ? parseInt(periodYear, 10) : undefined,
      reason: reason || 'Annulation direction',
      voidedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Encaissement familial annulé avec succès (${result.total_voided.toFixed(2)} DT réinitialisés)`,
      ...result
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/family-void-payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/invoices/:id/settle-past
 * Régularise une cotisation d'un mois passé (historique payé en espèces avant mise en place du logiciel)
 */
router.post('/invoices/:id/settle-past', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { notes } = req.body;

    const invoice = await billingService.settlePastInvoice(invoiceId, {
      notes,
      recordedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Cotisation passée régularisée avec succès (sans impact sur la trésorerie du mois en cours)',
      invoice
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/invoices/:id/settle-past:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/family-settle-past
 * Régularise toutes les cotisations d'un mois passé pour une famille
 */
router.post('/family-settle-past', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { parentId, childIds, periodMonth, periodYear, notes } = req.body;

    const result = await billingService.settlePastFamily({
      parentId: parentId ? parseInt(parentId, 10) : null,
      childIds: Array.isArray(childIds) ? childIds.map(id => parseInt(id, 10)) : [],
      periodMonth: periodMonth ? parseInt(periodMonth, 10) : undefined,
      periodYear: periodYear ? parseInt(periodYear, 10) : undefined,
      notes,
      recordedBy: req.user.id
    });

    res.json({
      success: true,
      message: `${result.count} cotisation(s) passée(s) régularisée(s) avec succès pour la famille`,
      ...result
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/family-settle-past:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/invoices/:id/receipt
 * Téléchargement ou consultation du reçu de paiement officiel en PDF
 * Accessible par les administrateurs/personnel et par le parent concerné
 */
router.get('/invoices/:id/receipt', auth.authenticateToken, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { buffer, receiptNum } = await billingService.generateReceiptPDF(invoiceId, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    // Content-Disposition: inline permet la consultation directe dans le navigateur,
    // avec nom de fichier prêt lors d'un téléchargement
    res.setHeader('Content-Disposition', `inline; filename="Recu_${receiptNum}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/invoices/:id/receipt:', error);
    if (error.status === 403) {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/billing/invoices/:id/adjust
 * Ajuste le montant d'une facture (ex: prorata)
 */
router.put('/invoices/:id/adjust', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await billingService.adjustInvoice(invoiceId, {
      ...req.body,
      updatedBy: req.user.id
    });

    res.json({ success: true, message: 'Facture ajustée avec succès', invoice });
  } catch (error) {
    console.error('❌ Erreur PUT /api/billing/invoices/:id/adjust:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/invoices/:id/remind
 * Envoie un rappel de paiement ciblé au parent
 */
router.post('/invoices/:id/remind', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { customMessage } = req.body;

    const result = await billingService.sendPaymentReminder(invoiceId, {
      customMessage,
      senderId: req.user.id
    });

    res.json({
      success: true,
      message: `Rappel envoyé avec succès au parent de ${result.recipient} (${result.amount} TND)`
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/invoices/:id/remind:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/my-invoices
 * Consultation par le parent de ses cotisations et reçus
 */
router.get('/my-invoices', auth.authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const data = await billingService.getInvoices({ parent_id: parentId });
    const userRes = await db.query('SELECT credit_balance FROM users WHERE id = $1', [parentId]);
    const creditBalance = parseFloat(userRes.rows[0]?.credit_balance || 0);
    res.json({ success: true, invoices: data.invoices, credit_balance: creditBalance });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/my-invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/my-payments
 * Historique chronologique des versements réels effectués par le parent (avec dates, montants et reçus)
 */
router.get('/my-payments', auth.authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const paymentsRes = await db.query(`
      SELECT 
        COALESCE(ci.receipt_number, 'REC-' || ci.id) as receipt_number,
        MAX(COALESCE(ci.paid_at, ci.created_at)) as paid_at,
        MAX(COALESCE(ci.payment_method, 'Espèces')) as payment_method,
        SUM(ci.amount_paid) as total_amount,
        ARRAY_AGG(ci.id) as invoice_ids,
        ARRAY_AGG(DISTINCT (c.first_name || ' ' || c.last_name)) as children_names,
        ARRAY_AGG(DISTINCT (ci.period_month || '/' || ci.period_year)) as periods
      FROM child_invoices ci
      JOIN children c ON ci.child_id = c.id
      WHERE ci.parent_id = $1
        AND ci.amount_paid > 0
      GROUP BY COALESCE(ci.receipt_number, 'REC-' || ci.id)
      ORDER BY MAX(COALESCE(ci.paid_at, ci.created_at)) DESC
    `, [parentId]);

    const payments = paymentsRes.rows.map(row => ({
      receipt_number: row.receipt_number,
      paid_at: row.paid_at,
      payment_method: row.payment_method === 'cash' ? 'Espèces' : row.payment_method,
      total_amount: parseFloat(row.total_amount || 0),
      invoice_ids: row.invoice_ids,
      primary_invoice_id: row.invoice_ids[0],
      children_names: row.children_names,
      periods: row.periods
    }));

    res.json({ success: true, payments });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/my-payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/summary
 * Synthèse financière mensuelle (recettes, dépenses, solde)
 */
router.get('/summary', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const summary = await billingService.getFinancialSummary(month, year);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billing/expenses
 * Liste des dépenses enregistrées (admin / staff)
 */
router.get('/expenses', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { month, year, category } = req.query;
    const conditions = ['1=1'];
    const values = [];
    let idx = 1;

    if (month) {
      conditions.push(`period_month = $${idx++}`);
      values.push(parseInt(month, 10));
    }
    if (year) {
      conditions.push(`period_year = $${idx++}`);
      values.push(parseInt(year, 10));
    }
    if (category && category !== 'all') {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }

    const result = await db.query(`
      SELECT * FROM nursery_expenses
      WHERE ${conditions.join(' AND ')}
      ORDER BY expense_date DESC, created_at DESC
    `, values);

    res.json({ success: true, expenses: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/expenses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/expenses
 * Ajout d'une dépense (admin / staff)
 */
router.post('/expenses', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const {
      title,
      category = 'other',
      amount,
      expense_date = new Date().toISOString().split('T')[0],
      payment_method = 'cash',
      receipt_url,
      notes
    } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ success: false, error: 'Titre et montant requis' });
    }

    const expDate = new Date(expense_date);
    const period_month = expDate.getMonth() + 1;
    const period_year = expDate.getFullYear();
    const school_year = billingService.getSchoolYear(expDate);

    const result = await db.query(`
      INSERT INTO nursery_expenses (
        title, category, amount, expense_date, period_month, period_year,
        school_year, payment_method, receipt_url, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      title, category, parseFloat(amount), expense_date, period_month, period_year,
      school_year, payment_method, receipt_url || null, notes || null, req.user.id
    ]);

    res.status(201).json({ success: true, message: 'Dépense enregistrée', expense: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur POST /api/billing/expenses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/billing/expenses/:id
 * Modification / rectification d'une dépense (admin / staff)
 */
router.put('/expenses/:id', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      amount,
      expense_date,
      payment_method,
      receipt_url,
      notes
    } = req.body;

    const check = await db.query('SELECT * FROM nursery_expenses WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dépense introuvable' });
    }

    const current = check.rows[0];
    const newTitle = title !== undefined ? title : current.title;
    const newAmount = amount !== undefined ? parseFloat(amount) : parseFloat(current.amount);
    const newCategory = category !== undefined ? category : current.category;
    const newDate = expense_date !== undefined ? expense_date : current.expense_date;
    const newPaymentMethod = payment_method !== undefined ? payment_method : current.payment_method;
    const newReceiptUrl = receipt_url !== undefined ? receipt_url : current.receipt_url;
    const newNotes = notes !== undefined ? notes : current.notes;

    const expDate = new Date(newDate);
    const period_month = expDate.getMonth() + 1;
    const period_year = expDate.getFullYear();
    const school_year = billingService.getSchoolYear(expDate);

    const result = await db.query(`
      UPDATE nursery_expenses
      SET
        title = $1,
        category = $2,
        amount = $3,
        expense_date = $4,
        period_month = $5,
        period_year = $6,
        school_year = $7,
        payment_method = $8,
        receipt_url = $9,
        notes = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      newTitle, newCategory, newAmount, newDate, period_month, period_year,
      school_year, newPaymentMethod, newReceiptUrl || null, newNotes || null, id
    ]);

    res.json({
      success: true,
      message: 'Dépense modifiée avec succès',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur PUT /api/billing/expenses/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/billing/expenses/:id
 * Suppression d'une dépense (admin / staff)
 */
router.delete('/expenses/:id', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM nursery_expenses WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dépense introuvable' });
    }

    await db.query('DELETE FROM nursery_expenses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Dépense supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE /api/billing/expenses/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
