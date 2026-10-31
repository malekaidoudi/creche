import { useState, useEffect } from 'react';
import {
  X,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  Search,
  RefreshCw,
  Bell,
  Sliders,
  Wallet,
  FileText,
  Edit2,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import { useLanguage } from '../../hooks/useLanguage';
import DatePicker from '../ui/DatePicker';

export default function BillingManagementModal({ isOpen, onClose, onSuccess }) {
  const dialog = useDialogContext();
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'quick_alert'
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  // Modal paiement en espèces
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashMethod, setCashMethod] = useState('Règlement en espèces');
  const [cashCustomRef, setCashCustomRef] = useState('');
  const [siblingInvoices, setSiblingInvoices] = useState([]);
  const [selectedSiblingIds, setSelectedSiblingIds] = useState([]);

  // États pour l'ajustement du tarif / de la remise sur facture
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustBasePrice, setAdjustBasePrice] = useState('');
  const [adjustDiscount, setAdjustDiscount] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [updateRecurringDiscount, setUpdateRecurringDiscount] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Modal ajustement / prorata
  const [adjustingInvoice, setAdjustingInvoice] = useState(null);
  const [adjustedAmount, setAdjustedAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Formulaire Quick Alert (Legacy restauré et amélioré)
  const [parents, setParents] = useState([]);
  const [alertForm, setAlertForm] = useState({
    recipient_type: 'single',
    parent_ids: [],
    amount: '',
    due_date: '',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
      loadParents();
    }
  }, [isOpen, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const params = {
        year: now.getFullYear(),
        month: now.getMonth() + 1
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const [invRes, sumRes] = await Promise.all([
        api.get('/api/billing/invoices', { params }),
        api.get('/api/billing/summary', { params: { year: now.getFullYear(), month: now.getMonth() + 1 } }).catch(() => null)
      ]);

      if (invRes.data?.success) {
        setInvoices(invRes.data.invoices || []);
      }
      if (sumRes?.data?.success) {
        setSummary(sumRes.data.summary);
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParents = async () => {
    try {
      const response = await api.get('/api/users', {
        params: { role: 'parent' }
      });
      if (response.data?.success) {
        setParents(response.data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement parents:', error);
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/api/billing/invoices/generate');
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? `تم توليد ${res.data.generated_count || res.data.count} اشتراك لهذا الشهر`
            : `${res.data.generated_count || res.data.count} cotisations générées pour ce mois !`
        );
        loadInvoices();
      }
    } catch (err) {
      console.error('Erreur génération factures:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de la génération des cotisations');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenCashPayment = (invoice) => {
    setPayingInvoice(invoice);

    // Détecter si d'autres enfants du même parent ont des factures non soldées pour ce mois
    const siblings = invoices.filter(other =>
      other.id !== invoice.id &&
      other.status !== 'paid' &&
      parseInt(other.period_month, 10) === parseInt(invoice.period_month, 10) &&
      parseInt(other.period_year, 10) === parseInt(invoice.period_year, 10) &&
      (
        (invoice.parent_id && other.parent_id === invoice.parent_id) ||
        (invoice.parent_phone && other.parent_phone && other.parent_phone === invoice.parent_phone) ||
        (invoice.parent_first_name && invoice.parent_last_name && other.parent_first_name === invoice.parent_first_name && other.parent_last_name === invoice.parent_last_name)
      )
    );

    setSiblingInvoices(siblings);
    // Par défaut, cocher tous les frères et sœurs pour un règlement et reçu familial unique
    const initialSelected = siblings.map(s => s.id);
    setSelectedSiblingIds(initialSelected);

    const mainDue = Math.max(0, (parseFloat(invoice.amount_due ?? invoice.total_due ?? invoice.amount ?? 0) || 0) - (parseFloat(invoice.amount_paid || 0) || 0));
    const siblingsDue = siblings.reduce((acc, s) => {
      const sAmt = parseFloat(s.amount_due ?? s.total_due ?? s.amount ?? 0) || 0;
      const sPaid = parseFloat(s.amount_paid || 0) || 0;
      return acc + Math.max(0, sAmt - sPaid);
    }, 0);

    setCashAmount((mainDue + siblingsDue).toFixed(2));
    setCashMethod('Règlement en espèces');
    setCashCustomRef('');

    // Initialiser les valeurs d'ajustement
    setIsAdjusting(false);
    setAdjustBasePrice(parseFloat(invoice.base_price || 0).toString());
    setAdjustDiscount(parseFloat(invoice.discount_amount || 0).toString());
    setAdjustNotes(invoice.notes || '');
    setUpdateRecurringDiscount(false);
  };

  const handleSaveAdjustment = async () => {
    if (!payingInvoice) return;
    try {
      setAdjustLoading(true);
      const res = await api.put(`/api/billing/invoices/${payingInvoice.id}/adjust`, {
        basePrice: parseFloat(adjustBasePrice) || 0,
        discountAmount: parseFloat(adjustDiscount) || 0,
        notes: adjustNotes,
        updateChildRecurringDiscount: updateRecurringDiscount
      });
      if (res.data?.success) {
        dialog.success(isRTL ? 'تم تعديل الفاتورة بنجاح' : 'Facture et remise ajustées avec succès');
        const updatedInv = res.data.invoice;
        const updatedPaying = {
          ...payingInvoice,
          ...updatedInv,
          base_price: updatedInv.base_price,
          discount_amount: updatedInv.discount_amount,
          total_due: updatedInv.total_due,
          amount_due: updatedInv.total_due
        };
        setPayingInvoice(updatedPaying);
        const mainDue = Math.max(0, (parseFloat(updatedInv.total_due) || 0) - (parseFloat(updatedInv.amount_paid) || 0));
        const siblingsDue = siblingInvoices
          .filter(s => selectedSiblingIds.includes(s.id))
          .reduce((acc, s) => {
            const sAmt = parseFloat(s.amount_due ?? s.total_due ?? s.amount ?? 0) || 0;
            const sPaid = parseFloat(s.amount_paid || 0) || 0;
            return acc + Math.max(0, sAmt - sPaid);
          }, 0);
        setCashAmount((mainDue + siblingsDue).toFixed(2));
        setIsAdjusting(false);
        loadInvoices();
      }
    } catch (err) {
      console.error('Erreur ajustement facture:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'ajustement');
    } finally {
      setAdjustLoading(false);
    }
  };

  const toggleSiblingSelection = (siblingId, isChecked) => {
    let nextSelected;
    if (isChecked) {
      nextSelected = [...selectedSiblingIds, siblingId];
    } else {
      nextSelected = selectedSiblingIds.filter(id => id !== siblingId);
    }
    setSelectedSiblingIds(nextSelected);

    const mainDue = Math.max(0, (parseFloat(payingInvoice.amount_due ?? payingInvoice.total_due ?? payingInvoice.amount ?? 0) || 0) - (parseFloat(payingInvoice.amount_paid || 0) || 0));
    const siblingsDue = siblingInvoices
      .filter(s => nextSelected.includes(s.id))
      .reduce((acc, s) => {
        const sAmt = parseFloat(s.amount_due ?? s.total_due ?? s.amount ?? 0) || 0;
        const sPaid = parseFloat(s.amount_paid || 0) || 0;
        return acc + Math.max(0, sAmt - sPaid);
      }, 0);

    setCashAmount((mainDue + siblingsDue).toFixed(2));
  };

  const submitCashPayment = async (e) => {
    e.preventDefault();
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
      dialog.error('Montant invalide');
      return;
    }

    // Déterminer la méthode technique et la note complète
    let techMethod = 'cash';
    if (cashMethod === 'Règlement en chèque' || cashMethod === 'cheque') {
      techMethod = 'cheque';
    } else if (cashMethod === 'Règlement en virement' || cashMethod === 'transfer') {
      techMethod = 'transfer';
    }

    const fullNote = cashCustomRef.trim()
      ? `${cashMethod} - ${cashCustomRef.trim()}`
      : cashMethod;

    try {
      setLoading(true);
      const res = await api.post(`/api/billing/invoices/${payingInvoice.id}/pay`, {
        amount: parseFloat(cashAmount),
        payment_method: techMethod,
        notes: fullNote,
        includeInvoiceIds: selectedSiblingIds
      });
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? `تم تسجيل الدفع بنجاح! رقم الإيصال: ${res.data.receipt_number || res.data.invoice?.receipt_number}`
            : `Encaissement validé avec succès ! Reçu: ${res.data.receipt_number || res.data.invoice?.receipt_number}`
        );
        const invId = res.data.invoice?.id || payingInvoice.id;
        setPayingInvoice(null);
        setSiblingInvoices([]);
        setSelectedSiblingIds([]);
        loadInvoices();
        // Ouvrir automatiquement le reçu officiel en PDF pour consultation ou impression
        handleViewReceipt({ id: invId });
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'encaissement');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (inv) => {
    try {
      const res = await api.get(`/api/billing/invoices/${inv.id}/receipt`, {
        responseType: 'blob'
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Erreur ouverture reçu:', err);
      dialog.error(isRTL ? 'تعذر فتح وصل الخلاص' : 'Impossible d\'ouvrir le reçu PDF');
    }
  };

  const handleOpenAdjust = (invoice) => {
    setAdjustingInvoice(invoice);
    const amountVal = parseFloat(invoice.amount_due ?? invoice.total_due ?? invoice.amount ?? 0) || 0;
    setAdjustedAmount(amountVal.toFixed(2));
    setAdjustmentReason('');
  };

  const submitAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustedAmount || parseFloat(adjustedAmount) < 0) {
      dialog.error('Montant ajusté invalide');
      return;
    }
    try {
      setLoading(true);
      const res = await api.put(`/api/billing/invoices/${adjustingInvoice.id}/adjust`, {
        adjusted_amount: parseFloat(adjustedAmount),
        reason: adjustmentReason || 'Ajustement manuel / Prorata'
      });
      if (res.data?.success) {
        dialog.success(isRTL ? 'تم تعديل المبلغ بنجاح' : 'Montant ajusté avec succès');
        setAdjustingInvoice(null);
        loadInvoices();
      }
    } catch (err) {
      console.error('Erreur ajustement:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'ajustement');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (invoice) => {
    try {
      const res = await api.post(`/api/billing/invoices/${invoice.id}/remind`);
      if (res.data?.success) {
        dialog.success(isRTL ? 'تم إرسال تذكير الدفع لولي الأمر' : 'Rappel envoyé au parent avec succès');
        loadInvoices();
      }
    } catch (err) {
      console.error('Erreur rappel:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'envoi du rappel');
    }
  };

  const submitQuickAlert = async (e) => {
    e.preventDefault();
    if (alertForm.recipient_type === 'single' && alertForm.parent_ids.length === 0) {
      dialog.error('Veuillez sélectionner au moins un parent');
      return;
    }
    if (!alertForm.amount || parseFloat(alertForm.amount) <= 0) {
      dialog.error('Le montant doit être supérieur à 0');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        recipient_type: alertForm.recipient_type,
        parent_ids: alertForm.recipient_type === 'single' ? alertForm.parent_ids : [],
        amount: parseFloat(alertForm.amount),
        due_date: alertForm.due_date,
        message: alertForm.message
      };
      const res = await api.post('/api/payment-alerts', payload);
      if (res.data?.success) {
        dialog.success(isRTL ? 'تم إرسال التنبيه بنجاح' : 'Alerte envoyée avec succès');
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      console.error('Erreur alerte:', err);
      dialog.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPayingInvoice(null);
    setAdjustingInvoice(null);
    onClose();
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const childName = `${inv.child_first_name || ''} ${inv.child_last_name || ''}`.toLowerCase();
    const parentName = `${inv.parent_first_name || ''} ${inv.parent_last_name || ''}`.toLowerCase();
    const receipt = (inv.receipt_number || '').toLowerCase();
    return childName.includes(term) || parentName.includes(term) || receipt.includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            {isRTL ? 'مدفوع' : 'Payé'}
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <AlertCircle className="w-3 h-3" />
            {isRTL ? 'متأخر' : 'En retard'}
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            {isRTL ? 'جزئي' : 'Partiel'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            {isRTL ? 'في الانتظار' : 'En attente'}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
        
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {isRTL ? 'إدارة الاشتراكات والمدفوعات' : 'Gestion des Cotisations & Paiements'}
              </h2>
              <p className="text-xs text-white/80">
                {isRTL ? 'متابعة شهرية، تحصيل نقدي، إشعارات أولياء الأمور' : 'Suivi mensuel, encaissement espèces & rappels'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation par Onglets */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'invoices'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Receipt className="w-4 h-4" />
              {isRTL ? 'الاشتراكات الشهرية' : 'Cotisations du Mois'}
              {invoices.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                  {invoices.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quick_alert')}
              className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'quick_alert'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Bell className="w-4 h-4" />
              {isRTL ? 'إشعار / تنبيه سريع' : 'Alerte Rapide Personnalisée'}
            </button>
          </div>

          {activeTab === 'invoices' && (
            <button
              onClick={handleGenerateMonthly}
              disabled={generating}
              className="mb-2 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {isRTL ? 'توليد اشتراكات الشهر' : 'Générer ce mois'}
            </button>
          )}
        </div>

        {/* Corps principal */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {/* Résumé synthétique */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'إجمالي المطلوب' : 'Total Attendu'}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {parseFloat(summary.total_due || 0).toFixed(0)} <span className="text-xs font-semibold text-gray-400">DT</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                    <div className="text-xs text-emerald-700 dark:text-emerald-400">{isRTL ? 'المحصل نقداً' : 'Total Encaissé'}</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {parseFloat(summary.total_collected || 0).toFixed(0)} <span className="text-xs font-semibold text-emerald-500">DT</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                    <div className="text-xs text-rose-700 dark:text-rose-400">{isRTL ? 'المتبقي' : 'Restant Dû'}</div>
                    <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {parseFloat(summary.total_remaining || 0).toFixed(0)} <span className="text-xs font-semibold text-rose-500">DT</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                    <div className="text-xs text-blue-700 dark:text-blue-400">{isRTL ? 'نسبة الاستخلاص' : 'Taux Recouvrement'}</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {summary.collection_rate || 0}%
                    </div>
                  </div>
                </div>
              )}

              {/* Filtres & Recherche */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isRTL ? 'بحث بالاسم أو رقم الإيصال...' : 'Recherche enfant, parent, reçu...'}
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {['all', 'pending', 'paid', 'overdue'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        statusFilter === st
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {st === 'all' && (isRTL ? 'الكل' : 'Tous')}
                      {st === 'pending' && (isRTL ? 'في الانتظار' : 'En attente')}
                      {st === 'paid' && (isRTL ? 'مدفوع' : 'Payés')}
                      {st === 'overdue' && (isRTL ? 'متأخر' : 'En retard')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des factures */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium">
                    {isRTL ? 'لا توجد اشتراكات مسجلة حالياً' : 'Aucune cotisation pour ce mois'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRTL ? 'اضغط على "توليد هذا الشهر" لإنشاء اشتراكات الأطفال النشطين' : 'Cliquez sur "Générer ce mois" pour créer les cotisations'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                          {inv.child_first_name?.charAt(0)}{inv.child_last_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {inv.child_first_name} {inv.child_last_name}
                            </span>
                            {getStatusBadge(inv.status)}
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {inv.care_schedule === 'half_day' ? '🌤️ Demi-journée 13h' : '☀️ Journée complète'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Parent: {inv.parent_first_name} {inv.parent_last_name}</span>
                            {invoices.some(other => other.id !== inv.id && (inv.parent_id ? other.parent_id === inv.parent_id : false)) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                👨‍👩‍👧‍👦 {isRTL ? 'عائلة / إخوة' : 'Fratrie'}
                              </span>
                            )}
                            {inv.receipt_number && (
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                {invoices.some(other => other.id !== inv.id && inv.parent_id && other.parent_id === inv.parent_id) 
                                  ? `Reçu familial: ${inv.receipt_number}` 
                                  : `Reçu: ${inv.receipt_number}`}
                              </span>
                            )}
                            {parseFloat(inv.discount_amount || 0) > 0 && (
                              <span className="text-amber-600 dark:text-amber-400">
                                Remise: -{parseFloat(inv.discount_amount).toFixed(0)} DT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Montants et Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <div className="text-base font-bold text-gray-900 dark:text-white">
                            {(parseFloat(inv.amount_due ?? inv.total_due ?? inv.amount ?? 0) || 0).toFixed(0)} <span className="text-xs font-normal text-gray-400">DT</span>
                          </div>
                          {inv.status === 'paid' ? (
                            <div className="text-xs text-emerald-600 font-medium">
                              Payé ({inv.payment_method === 'cash' ? 'Espèces' : inv.payment_method})
                            </div>
                          ) : (
                            <div className="text-xs text-rose-500 font-medium">
                              Reste: {Math.max(0, (parseFloat(inv.amount_due ?? inv.total_due ?? inv.amount ?? 0) || 0) - (parseFloat(inv.amount_paid || 0) || 0)).toFixed(0)} DT
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleOpenCashPayment(inv)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                              title="Encaisser en espèces"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              {isRTL ? 'دفع نقدي' : 'Encaisser'}
                            </button>
                          )}
                          {(inv.status === 'paid' || inv.receipt_number || parseFloat(inv.amount_paid || 0) > 0) && (
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(inv)}
                              className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                              title={isRTL ? 'معاينة وتنزيل وصل الخلاص PDF' : 'Consulter et télécharger le reçu officiel en PDF'}
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>
                                {invoices.some(other => other.id !== inv.id && inv.parent_id && other.parent_id === inv.parent_id)
                                  ? (isRTL ? 'وصل العائلة PDF' : 'Reçu familial PDF')
                                  : (isRTL ? 'وصل PDF' : 'Reçu PDF')}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenAdjust(inv)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs"
                            title="Ajuster / Prorata"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleSendReminder(inv)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs"
                              title="Envoyer un rappel au parent"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Quick Alert (Restauration propre de l'ancien système) */}
          {activeTab === 'quick_alert' && (
            <form onSubmit={submitQuickAlert} className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Destinataire(s) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertForm({ ...alertForm, recipient_type: 'single', parent_ids: [] })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      alertForm.recipient_type === 'single'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">Parent(s) spécifique(s)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertForm({ ...alertForm, recipient_type: 'all', parent_ids: [] })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      alertForm.recipient_type === 'all'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">Tous les parents</span>
                  </button>
                </div>
              </div>

              {alertForm.recipient_type === 'single' && (
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Parents ({alertForm.parent_ids.length} sélectionnés)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAlertForm({ ...alertForm, parent_ids: parents.map(p => p.id) })}
                        className="text-emerald-600 hover:underline font-semibold"
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertForm({ ...alertForm, parent_ids: [] })}
                        className="text-gray-500 hover:underline"
                      >
                        Aucun
                      </button>
                    </div>
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1 bg-white dark:bg-gray-700">
                    {parents.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={alertForm.parent_ids.includes(p.id)}
                          onChange={() => {
                            setAlertForm(prev => ({
                              ...prev,
                              parent_ids: prev.parent_ids.includes(p.id)
                                ? prev.parent_ids.filter(id => id !== p.id)
                                : [...prev.parent_ids, p.id]
                            }));
                          }}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {p.first_name} {p.last_name} ({p.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Montant à régler (DT) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={alertForm.amount}
                  onChange={(e) => setAlertForm({ ...alertForm, amount: e.target.value })}
                  placeholder="Ex: 130.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <DatePicker
                  label="Date d'échéance"
                  required
                  value={alertForm.due_date}
                  onChange={(value) => setAlertForm({ ...alertForm, due_date: value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  placeholder="Rappel amical pour la mensualité..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Envoi en cours...' : 'Envoyer l\'alerte'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Secondaire : Encaissement & Reçu détaillé */}
        {payingInvoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="mb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  {isRTL ? 'تسجيل الدفع وإصدار الإيصال الرسمي' : 'Encaisser le règlement & Émettre le reçu'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isRTL 
                    ? 'تأكيد استلام المبلغ نقداً أو بشيك/تحويل وإصدار وصل الخلاص بصفة آلية' 
                    : 'Confirmez l\'encaissement pour émettre le reçu officiel et mettre à jour le compte'}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 mb-3 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{isRTL ? 'الطفل :' : 'Enfant :'}</span>
                  <strong className="text-gray-900 dark:text-white font-bold">{payingInvoice.child_first_name} {payingInvoice.child_last_name}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{isRTL ? 'الفترة :' : 'Période :'}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {payingInvoice.period_month}/{payingInvoice.period_year} ({payingInvoice.care_schedule === 'half_day' ? (isRTL ? '🌤️ نصف يوم 13h' : '🌤️ Demi-journée 13h') : (isRTL ? '☀️ يوم كامل' : '☀️ Journée complète')})
                  </span>
                </div>
                
                {/* Détail du reçu / arriérés */}
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700/80 space-y-1">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>{isRTL ? 'معلوم الاشتراك الأساسي :' : 'Tarif mensuel de base :'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{parseFloat(payingInvoice.base_price || 0).toFixed(0)} DT</span>
                  </div>
                  {parseFloat(payingInvoice.saturday_price || 0) > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>{isRTL ? 'خيار السبت :' : 'Option Samedi :'}</span>
                      <span className="font-medium text-gray-900 dark:text-white">+{parseFloat(payingInvoice.saturday_price).toFixed(0)} DT</span>
                    </div>
                  )}
                  {parseFloat(payingInvoice.insurance_price || 0) > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>{isRTL ? 'التأمين السنوي :' : 'Assurance annuelle :'}</span>
                      <span className="font-medium text-gray-900 dark:text-white">+{parseFloat(payingInvoice.insurance_price).toFixed(0)} DT</span>
                    </div>
                  )}
                  {parseFloat(payingInvoice.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                      <span>{isRTL ? 'تخفيض ممنوح :' : 'Remise accordée :'}</span>
                      <span>-{parseFloat(payingInvoice.discount_amount).toFixed(0)} DT</span>
                    </div>
                  )}
                  {parseFloat(payingInvoice.previous_arrears || 0) > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                      <span>{isRTL ? '⚠️ متخلدات أشهر سابقة :' : '⚠️ Report arriérés mois précédents :'}</span>
                      <span>+{parseFloat(payingInvoice.previous_arrears).toFixed(0)} DT</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white text-sm pt-1.5 border-t border-gray-200 dark:border-gray-700">
                    <span>{isRTL ? 'المجموع المستحق :' : 'Total dû :'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{(parseFloat(payingInvoice.amount_due ?? payingInvoice.total_due ?? 0) || 0).toFixed(0)} DT</span>
                  </div>

                  {/* Bouton bascule ajustement tarif ou remise */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAdjusting(!isAdjusting)}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      {isAdjusting
                        ? (isRTL ? 'إغلاق التعديل' : 'Fermer l\'ajustement')
                        : (isRTL ? 'تعديل معلوم الشهر أو التخفيض...' : 'Ajuster tarif ou remise...')}
                    </button>
                  </div>

                  {/* Panneau d'ajustement interactif */}
                  {isAdjusting && (
                    <div className="mt-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                            {isRTL ? 'معلوم الشهر / التناسبي (د.ت)' : 'Tarif base / Prorata (DT)'}
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={adjustBasePrice}
                            onChange={(e) => setAdjustBasePrice(e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                            {isRTL ? 'التخفيض الممنوح (د.ت)' : 'Remise accordée (DT)'}
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={adjustDiscount}
                            onChange={(e) => setAdjustDiscount(e.target.value)}
                            placeholder="0 = sans remise"
                            className="w-full px-2 py-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 font-semibold text-amber-600 dark:text-amber-400"
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={updateRecurringDiscount}
                          onChange={(e) => setUpdateRecurringDiscount(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                        />
                        <span className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                          {isRTL
                            ? 'تطبيق هذا التخفيض أيضًا على الأشهر القادمة (تحديث ملف الطفل)'
                            : 'Appliquer aussi cette modification aux mois suivants (mettre à jour la fiche de l\'enfant)'}
                        </span>
                      </label>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSaveAdjustment}
                          disabled={adjustLoading}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {adjustLoading ? (isRTL ? 'جاري الحفظ...' : 'Enregistrement...') : (isRTL ? 'تطبيق التعديل' : 'Appliquer l\'ajustement')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Encadré Fratrie / Règlement groupé famille */}
              {siblingInvoices.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{isRTL ? 'دفع موحد للعائلة (وصل خلاص واحد للإخوة) :' : 'Règlement groupé famille (Un seul reçu pour la fratrie) :'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {siblingInvoices.map(sib => (
                      <label key={sib.id} className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 cursor-pointer bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSiblingIds.includes(sib.id)}
                            onChange={(e) => toggleSiblingSelection(sib.id, e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-gray-900 dark:text-white">{sib.child_first_name} {sib.child_last_name}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">({sib.care_schedule === 'half_day' ? 'Demi-journée' : 'Journée complète'})</span>
                        </div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          {(parseFloat(sib.amount_due ?? sib.total_due ?? sib.amount ?? 0) || 0).toFixed(0)} DT
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
                    {isRTL ? 'سيتم إصدار وصل خلاص رسمي موحد يجمع أطفال العائلة.' : 'Un seul reçu officiel sera émis pour l\'ensemble des enfants de la famille.'}
                  </p>
                </div>
              )}

              <form onSubmit={submitCashPayment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Montant encaissé (DT) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Mode de règlement *
                  </label>
                  <select
                    value={cashMethod}
                    onChange={(e) => setCashMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Règlement en espèces">Règlement en espèces</option>
                    <option value="Règlement en chèque">Règlement en chèque</option>
                    <option value="Règlement en virement">Règlement en virement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Référence ou note complémentaire (optionnel)
                  </label>
                  <input
                    type="text"
                    value={cashCustomRef}
                    onChange={(e) => setCashCustomRef(e.target.value)}
                    placeholder="Ex: N° Chèque 48291, Reçu remis au père..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {loading ? 'Validation...' : 'Valider & Délivrer le reçu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Secondaire : Ajustement / Prorata */}
        {adjustingInvoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Sliders className="w-5 h-5 text-blue-600" />
                {isRTL ? 'تعديل المبلغ / حساب تناسبي' : 'Ajuster le montant / Prorata'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Enfant : <strong>{adjustingInvoice.child_first_name} {adjustingInvoice.child_last_name}</strong>
              </p>

              <form onSubmit={submitAdjustment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Nouveau montant dû (DT) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={adjustedAmount}
                    onChange={(e) => setAdjustedAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Motif de l'ajustement
                  </label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Ex: Entrée en milieu de mois au prorata"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setAdjustingInvoice(null)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {loading ? 'Enregistrement...' : 'Enregistrer l\'ajustement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
