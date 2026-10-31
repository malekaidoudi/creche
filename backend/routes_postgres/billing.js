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
    res.json({ success: true, invoices: data.invoices });
  } catch (error) {
    console.error('❌ Erreur GET /api/billing/my-invoices:', error);
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
 * Liste des dépenses enregistrées (admin)
 */
router.get('/expenses', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
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
 * Ajout d'une dépense (admin)
 */
router.post('/expenses', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
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

module.exports = router;
