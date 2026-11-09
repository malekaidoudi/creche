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
  FileText,
  Edit2,
  Check,
  TrendingDown,
  PlusCircle,
  Trash2,
  RotateCcw,
  Calendar,
  CreditCard,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  TrendingUp,
  AlertTriangle,
  Landmark,
  PieChart,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import { useLanguage } from '../../hooks/useLanguage';
import DatePicker from '../ui/DatePicker';

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_NAMES_AR = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const EXPENSE_CATEGORIES = [
  { value: 'supplies', label: 'Fournitures & Pédagogie', labelAr: 'أدوات ومستلزمات', icon: '📦', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { value: 'food', label: 'Alimentation & Goûters', labelAr: 'تغذية ولمجة', icon: '🍎', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'salaries', label: 'Salaires & Personnel', labelAr: 'رواتب وإطارات', icon: '👥', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'rent', label: 'Loyer & Locaux', labelAr: 'كراء ومقر', icon: '🏠', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'utilities', label: 'STEG / SONEDE / Net', labelAr: 'ماء وكهرباء وإنترنت', icon: '💡', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'maintenance', label: 'Entretien & Réparations', labelAr: 'صيانة وتصليح', icon: '🔧', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { value: 'activities', label: 'Sorties & Événements', labelAr: 'أنشطة وتظاهرات', icon: '🎨', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { value: 'other', label: 'Autres charges', labelAr: 'مصاريف أخرى', icon: '📝', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
];

export default function BillingManagementModal({ isOpen, onClose, onSuccess }) {
  const dialog = useDialogContext();
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'expenses' | 'quick_alert'

  // Filtre Période Mensuelle (Mois & Année universel pour Cotisations & Dépenses)
  const now = new Date();
  const currentActualMonth = now.getMonth() + 1;
  const currentActualYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentActualMonth);
  const [selectedYear, setSelectedYear] = useState(currentActualYear);

  const isNotCurrentMonth = selectedMonth !== currentActualMonth || selectedYear !== currentActualYear;
  const isPastMonth = selectedYear < currentActualYear || (selectedYear === currentActualYear && selectedMonth < currentActualMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentActualMonth);
    setSelectedYear(currentActualYear);
  };
  const [viewMode, setViewMode] = useState('family'); // 'family' | 'child'
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [families, setFamilies] = useState([]);
  const [expandedFamilyIds, setExpandedFamilyIds] = useState(new Set());
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleFamilyDetails = (familyId) => {
    setExpandedFamilyIds(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  };

  // Modal règlement familial & multi-mois
  const [payingFamily, setPayingFamily] = useState(null);
  const [familySelectedChildIds, setFamilySelectedChildIds] = useState([]);
  const [familyMonthsCount, setFamilyMonthsCount] = useState(1);
  const [familyAmountGiven, setFamilyAmountGiven] = useState('');
  const [familyPaymentMethod, setFamilyPaymentMethod] = useState('Règlement en espèces');
  const [familyCustomRef, setFamilyCustomRef] = useState('');
  const [familyPayingLoading, setFamilyPayingLoading] = useState(false);

  // Modal paiement individuel par enfant (conservé pour bascule vue enfant)
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashMethod, setCashMethod] = useState('Règlement en espèces');
  const [cashCustomRef, setCashCustomRef] = useState('');
  const [siblingInvoices, setSiblingInvoices] = useState([]);
  const [selectedSiblingIds, setSelectedSiblingIds] = useState([]);

  // Annulation / Rectification de paiement (Void)
  const [voidInvoice, setVoidInvoice] = useState(null);
  const [voidReason, setVoidReason] = useState('Erreur de saisie');
  const [voidLoading, setVoidLoading] = useState(false);

  // Annulation familiale
  const [voidFamily, setVoidFamily] = useState(null);
  const [voidFamilyReason, setVoidFamilyReason] = useState('Erreur de saisie');
  const [voidFamilyLoading, setVoidFamilyLoading] = useState(false);

  // Dépenses & Trésorerie
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'supplies',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Espèces',
    notes: ''
  });

  // États pour l'ajustement du tarif / de la remise sur facture
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustBasePrice, setAdjustBasePrice] = useState('');
  const [adjustDiscount, setAdjustDiscount] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [updateRecurringDiscount, setUpdateRecurringDiscount] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Remises personnalisées par enfant dans le Règlement Familial
  // Map: { [childId]: { discountAmount: string, updateRecurring: boolean } }
  const [familyDiscounts, setFamilyDiscounts] = useState({});

  // Formulaire Quick Alert
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
      loadExpenses();
      loadParents();
    }
  }, [isOpen, selectedMonth, selectedYear, statusFilter, expenseCategoryFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        year: selectedYear,
        month: selectedMonth
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const [invRes, sumRes] = await Promise.all([
        api.get('/api/billing/invoices', { params }),
        api.get('/api/billing/summary', { params: { year: selectedYear, month: selectedMonth } }).catch(() => null)
      ]);

      if (invRes.data?.success) {
        setInvoices(invRes.data.invoices || []);
        setFamilies(invRes.data.families || []);
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

  const loadExpenses = async () => {
    try {
      setExpensesLoading(true);
      const params = {
        year: selectedYear,
        month: selectedMonth
      };
      if (expenseCategoryFilter && expenseCategoryFilter !== 'all') {
        params.category = expenseCategoryFilter;
      }
      const [expRes, sumRes] = await Promise.all([
        api.get('/api/billing/expenses', { params }),
        api.get('/api/billing/summary', { params: { year: selectedYear, month: selectedMonth } }).catch(() => null)
      ]);

      if (expRes.data?.success) {
        setExpenses(expRes.data.expenses || []);
      }
      if (sumRes?.data?.success) {
        setSummary(sumRes.data.summary);
      }
    } catch (error) {
      console.error('Erreur chargement dépenses:', error);
    } finally {
      setExpensesLoading(false);
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
      const res = await api.post('/api/billing/invoices/generate', {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? `تم توليد ${res.data.generated_count || res.data.count} اشتراك لشهر ${selectedMonth}/${selectedYear}`
            : `${res.data.generated_count || res.data.count} cotisations générées pour ${MONTH_NAMES_FR[selectedMonth - 1]} ${selectedYear} !`
        );
        loadInvoices();
        loadExpenses();
      }
    } catch (err) {
      console.error('Erreur génération factures:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de la génération des cotisations');
    } finally {
      setGenerating(false);
    }
  };

  // -------------------------------------------------------------
  // Gestion Règlement Familial & Multi-mois
  // -------------------------------------------------------------
  const calculateFamilyExpectedDue = (family, childIds, months, discountsMap = familyDiscounts) => {
    if (!family || !childIds || childIds.length === 0) return 0;
    let total = 0;
    for (const inv of family.invoices) {
      if (childIds.includes(inv.child_id)) {
        const discEntry = discountsMap?.[inv.child_id];
        let effectiveDiscount = 0;

        if (discEntry) {
          // La remise ne s'applique que si elle est explicitement cochée/activée
          const isEnabled = discEntry.enabled === true;
          if (isEnabled && discEntry.discountAmount !== '' && !isNaN(parseFloat(discEntry.discountAmount))) {
            effectiveDiscount = Math.max(0, parseFloat(discEntry.discountAmount));
          }
        }

        const basePrice = parseFloat(inv.base_price || 0);
        const satPrice = parseFloat(inv.saturday_price || 0);
        const insPrice = parseFloat(inv.insurance_price || 0);
        const arrears = parseFloat(inv.previous_arrears || 0);

        // Mois 1 (en cours) : base + samedi + assurance - remise ponctuelle effective + arriérés
        const month1Due = Math.max(0, basePrice + satPrice + insPrice - effectiveDiscount) + arrears;
        const invAmountPaid = parseFloat(inv.amount_paid || 0) || 0;
        const remainingMonth1 = Math.max(0, month1Due - invAmountPaid);

        // Mois futurs : la remise du modal est strictement ponctuelle, les mois futurs sont au tarif normal (base + samedi)
        const futureBaseMonthly = Math.max(0, basePrice + satPrice);
        const futureMonthsTotal = Math.max(0, months - 1) * futureBaseMonthly;

        const childTotal = remainingMonth1 + futureMonthsTotal;
        total += childTotal;
      }
    }
    return total;
  };

  const handleOpenFamilyPayment = (family) => {
    setPayingFamily(family);
    // Cocher par défaut les enfants non encore soldés (ou tous si tous soldés)
    const unpaidChildren = family.invoices
      .filter(inv => inv.status !== 'paid')
      .map(inv => inv.child_id);
    const initialChildIds = unpaidChildren.length > 0 
      ? unpaidChildren 
      : family.invoices.map(inv => inv.child_id);

    // Initialiser les remises pour chaque enfant : DÉSACTIVÉE par défaut selon règle métier
    const initialDiscounts = {};
    for (const inv of family.invoices) {
      const currentDisc = parseFloat(inv.discount_amount || 0);
      initialDiscounts[inv.child_id] = {
        enabled: false, // Non activé par défaut
        discountAmount: currentDisc > 0 ? String(currentDisc) : '',
        updateRecurring: false
      };
    }
    setFamilyDiscounts(initialDiscounts);

    setFamilySelectedChildIds(initialChildIds);
    setFamilyMonthsCount(1);
    setFamilyPaymentMethod('Règlement en espèces');
    setFamilyCustomRef('');

    const initialTotal = calculateFamilyExpectedDue(family, initialChildIds, 1, initialDiscounts);
    setFamilyAmountGiven(initialTotal.toFixed(2));
  };

  const handleFamilyDiscountToggleEnabled = (childId, isEnabled) => {
    const prev = familyDiscounts[childId] || {};
    const defaultAmount = prev.discountAmount || String(parseFloat(payingFamily?.invoices?.find(i => i.child_id === childId)?.discount_amount || 0) || 0);
    const updated = {
      ...familyDiscounts,
      [childId]: {
        ...prev,
        enabled: isEnabled,
        updateRecurring: false,
        discountAmount: defaultAmount === '0' && isEnabled ? '' : defaultAmount
      }
    };
    setFamilyDiscounts(updated);
    const newTotal = calculateFamilyExpectedDue(payingFamily, familySelectedChildIds, familyMonthsCount, updated);
    setFamilyAmountGiven(newTotal.toFixed(2));
  };

  const handleFamilyDiscountChange = (childId, value) => {
    const updated = {
      ...familyDiscounts,
      [childId]: {
        ...(familyDiscounts[childId] || {}),
        enabled: true, // La saisie active automatiquement la remise
        discountAmount: value,
        updateRecurring: false
      }
    };
    setFamilyDiscounts(updated);
    const newTotal = calculateFamilyExpectedDue(payingFamily, familySelectedChildIds, familyMonthsCount, updated);
    setFamilyAmountGiven(newTotal.toFixed(2));
  };

  const handleToggleFamilyChild = (childId, isChecked) => {
    let next;
    if (isChecked) {
      next = [...familySelectedChildIds, childId];
    } else {
      next = familySelectedChildIds.filter(id => id !== childId);
    }
    setFamilySelectedChildIds(next);
    const newTotal = calculateFamilyExpectedDue(payingFamily, next, familyMonthsCount, familyDiscounts);
    setFamilyAmountGiven(newTotal.toFixed(2));
  };

  const handleChangeFamilyMonths = (months) => {
    setFamilyMonthsCount(months);
    const newTotal = calculateFamilyExpectedDue(payingFamily, familySelectedChildIds, months, familyDiscounts);
    setFamilyAmountGiven(newTotal.toFixed(2));
  };

  const submitFamilyPayment = async (e) => {
    e.preventDefault();
    if (!payingFamily || familySelectedChildIds.length === 0) {
      dialog.error(isRTL ? 'يرجى اختيار طفل واحد على الأقل' : 'Veuillez sélectionner au moins un enfant');
      return;
    }
    if (!familyAmountGiven || parseFloat(familyAmountGiven) <= 0) {
      dialog.error(isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Montant invalide');
      return;
    }

    let techMethod = 'cash';
    if (familyPaymentMethod.includes('chèque') || familyPaymentMethod === 'cheque') {
      techMethod = 'cheque';
    } else if (familyPaymentMethod.includes('virement') || familyPaymentMethod === 'transfer') {
      techMethod = 'transfer';
    }

    const fullNote = familyCustomRef.trim()
      ? `${familyPaymentMethod} - ${familyCustomRef.trim()}`
      : familyPaymentMethod;

    // Préparer le payload des remises saisies (remise strictement ponctuelle, jamais récurrente dans ce modal)
    const payloadDiscounts = {};
    for (const childId of familySelectedChildIds) {
      const dEntry = familyDiscounts[childId];
      if (dEntry && dEntry.enabled === true && dEntry.discountAmount !== '') {
        payloadDiscounts[childId] = {
          discountAmount: Math.max(0, parseFloat(dEntry.discountAmount) || 0),
          updateRecurring: false
        };
      } else if (dEntry && dEntry.enabled === false) {
        // Remise non appliquée / désactivée pour cet encaissement
        payloadDiscounts[childId] = {
          discountAmount: 0,
          updateRecurring: false
        };
      }
    }

    try {
      setFamilyPayingLoading(true);
      const res = await api.post('/api/billing/family-pay', {
        parentId: payingFamily.parent_id,
        childIds: familySelectedChildIds,
        monthsCount: familyMonthsCount,
        startMonth: payingFamily.period_month,
        startYear: payingFamily.period_year,
        amount: parseFloat(familyAmountGiven),
        paymentMethod: techMethod,
        notes: fullNote,
        discounts: payloadDiscounts
      });

      if (res.data?.success) {
        let msg = isRTL 
          ? `تم تسجيل الدفع العائلي بنجاح! رقم الإيصال: ${res.data.receipt_number}`
          : `Règlement familial validé avec succès ! Reçu : ${res.data.receipt_number}`;
        if (res.data.surplus_credit > 0) {
          msg += isRTL
            ? ` (+${res.data.surplus_credit.toFixed(2)} د.ت تم تسجيلها كـ تسبقة/فائض على حساب العائلة)`
            : ` (+${res.data.surplus_credit.toFixed(2)} DT enregistrés en avoir sur le compte familial)`;
        }
        dialog.success(msg);
        const receiptInvId = res.data.primary_invoice_id;
        setPayingFamily(null);
        loadInvoices();
        loadExpenses();
        if (receiptInvId) {
          handleViewReceipt({ id: receiptInvId });
        }
      }
    } catch (err) {
      console.error('Erreur règlement familial:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors du règlement familial');
    } finally {
      setFamilyPayingLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Encaissement Individuel par Enfant (Vue enfant)
  // -------------------------------------------------------------
  const handleOpenCashPayment = (invoice) => {
    setPayingInvoice(invoice);

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
    // Dans la vue par enfant, l'utilisateur souhaite régler l'enfant sélectionné.
    // Les frères et sœurs restent disponibles en options à cocher, non cochés par défaut.
    setSelectedSiblingIds([]);

    const mainDue = Math.max(0, (parseFloat(invoice.amount_due ?? invoice.total_due ?? invoice.amount ?? 0) || 0) - (parseFloat(invoice.amount_paid || 0) || 0));

    setCashAmount(mainDue.toFixed(2));
    setCashMethod('Règlement en espèces');
    setCashCustomRef('');

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
        loadExpenses();
        handleViewReceipt({ id: invId });
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'encaissement');
    } finally {
      setLoading(false);
    }
  };

  // Annulation / Rectification de Paiement
  const handleOpenVoid = (invoice) => {
    setVoidInvoice(invoice);
    setVoidReason('Erreur de saisie');
  };

  const submitVoidPayment = async (e) => {
    e.preventDefault();
    if (!voidInvoice) return;
    try {
      setVoidLoading(true);
      const res = await api.post(`/api/billing/invoices/${voidInvoice.id}/void-payment`, {
        reason: voidReason || 'Erreur de saisie'
      });
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? 'تم إلغاء الاستخلاص بنجاح وإعادة الفاتورة لحالة الانتظار'
            : 'Encaissement annulé avec succès ! La facture repasse en attente.'
        );
        setVoidInvoice(null);
        setVoidReason('Erreur de saisie');
        loadInvoices();
        loadExpenses();
      }
    } catch (err) {
      console.error('Erreur annulation encaissement:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'annulation de l\'encaissement');
    } finally {
      setVoidLoading(false);
    }
  };

  // Annulation Familiale
  const handleOpenVoidFamily = (fam) => {
    setVoidFamily(fam);
    setVoidFamilyReason('Erreur de saisie');
  };

  const handleCloseVoidFamily = () => {
    setVoidFamily(null);
    setVoidFamilyReason('Erreur de saisie');
  };

  const submitVoidFamily = async (e) => {
    e.preventDefault();
    if (!voidFamily) return;
    try {
      setVoidFamilyLoading(true);
      const sharedReceipt = voidFamily.invoices.find(i => i.receipt_number)?.receipt_number || null;
      const res = await api.post('/api/billing/family-void-payment', {
        parentId: voidFamily.parent_id,
        receiptNumber: sharedReceipt,
        periodMonth: voidFamily.period_month || (new Date().getMonth() + 1),
        periodYear: voidFamily.period_year || new Date().getFullYear(),
        reason: voidFamilyReason || 'Erreur de saisie'
      });
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? 'تم إلغاء الاستخلاص العائلي بنجاح وإعادة الفواتير لحالة الانتظار'
            : 'Encaissement familial annulé avec succès ! Les cotisations sont remises en attente.'
        );
        handleCloseVoidFamily();
        loadInvoices();
        loadExpenses();
      }
    } catch (err) {
      console.error('Erreur annulation familiale:', err);
      dialog.error(err.response?.data?.error || "Erreur lors de l'annulation du paiement familial");
    } finally {
      setVoidFamilyLoading(false);
    }
  };

  // Régularisation d'une cotisation passée (antérieure au logiciel)
  const handleSettlePastInvoice = async (inv) => {
    const ok = await dialog.confirm(
      isRTL
        ? `هل تريد تأكيد تسوية اشتراك ${inv.child_first_name} ${inv.child_last_name} لهذا الشهر السابق؟ سيتم تسجيله كمدفوع نقداً بتاريخه الأصلي دون التأثير على سيولة الشهر الحالي.`
        : `Confirmer la régularisation de la cotisation passée pour ${inv.child_first_name} ${inv.child_last_name} ? Elle sera marquée comme payée antérieurement en espèces avec sa date d'origine, sans impacter la trésorerie du mois en cours.`
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await api.post(`/api/billing/invoices/${inv.id}/settle-past`, {
        notes: 'Règlement historique en espèces antérieur au logiciel'
      });
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? 'تمت تسوية الاشتراك السابق بنجاح'
            : 'Cotisation passée régularisée avec succès'
        );
        loadInvoices();
        loadExpenses();
      }
    } catch (err) {
      console.error('Erreur régularisation cotisation passée:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de la régularisation');
    } finally {
      setLoading(false);
    }
  };

  // Régularisation familiale d'un mois passé
  const handleSettlePastFamily = async (fam) => {
    const ok = await dialog.confirm(
      isRTL
        ? `هل تريد تأكيد تسوية اشتراكات عائلة ${fam.parent_name} لهذا الشهر السابق؟ سيتم تسجيلها كمدفوعة نقداً بتاريخها الأصلي دون التأثير على سيولة الشهر الحالي.`
        : `Confirmer la régularisation de toutes les cotisations de la famille ${fam.parent_name} pour ce mois passé ? Elles seront enregistrées comme réglées antérieurement en espèces avec leur date d'origine, sans impacter la trésorerie du mois en cours.`
    );
    if (!ok) return;

    try {
      setFamilyPayingLoading(true);
      const res = await api.post('/api/billing/family-settle-past', {
        parentId: fam.parent_id,
        childIds: fam.invoices.map(i => i.child_id),
        periodMonth: fam.period_month,
        periodYear: fam.period_year,
        notes: 'Règlement historique antérieur au logiciel'
      });
      if (res.data?.success) {
        dialog.success(
          isRTL
            ? 'تمت تسوية اشتراكات العائلة للشهر السابق بنجاح'
            : `${res.data.count || ''} cotisation(s) passée(s) régularisée(s) avec succès pour la famille`
        );
        loadInvoices();
        loadExpenses();
      }
    } catch (err) {
      console.error('Erreur régularisation familiale passée:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de la régularisation familiale');
    } finally {
      setFamilyPayingLoading(false);
    }
  };

  // CRUD Dépenses
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    const defaultExpenseDate = isNotCurrentMonth
      ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      : new Date().toISOString().split('T')[0];
    setExpenseForm({
      title: '',
      category: 'supplies',
      amount: '',
      expense_date: defaultExpenseDate,
      payment_method: 'Espèces',
      notes: ''
    });
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    const dateFormatted = exp.expense_date
      ? new Date(exp.expense_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setExpenseForm({
      title: exp.title || '',
      category: exp.category || 'other',
      amount: parseFloat(exp.amount || 0).toString(),
      expense_date: dateFormatted,
      payment_method: exp.payment_method || 'Espèces',
      notes: exp.notes || ''
    });
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title?.trim()) {
      dialog.error(isRTL ? 'يرجى إدخال وصف النفقة' : 'Veuillez saisir un intitulé pour la dépense');
      return;
    }
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      dialog.error(isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Veuillez saisir un montant valide');
      return;
    }
    try {
      setExpenseSaving(true);
      const payload = {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        payment_method: expenseForm.payment_method,
        notes: expenseForm.notes
      };
      if (editingExpense) {
        await api.put(`/api/billing/expenses/${editingExpense.id}`, payload);
        dialog.success(isRTL ? 'تم تعديل النفقة بنجاح' : 'Dépense mise à jour avec succès');
      } else {
        await api.post('/api/billing/expenses', payload);
        dialog.success(isRTL ? 'تم تسجيل النفقة بنجاح' : 'Dépense enregistrée avec succès');
      }
      setExpenseModalOpen(false);
      loadExpenses();
      loadInvoices();
    } catch (err) {
      console.error('Erreur enregistrement dépense:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement de la dépense');
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleDeleteExpense = async (exp) => {
    const ok = await dialog.confirm(
      isRTL
        ? `هل أنت متأكد من حذف هذه النفقة (${exp.title} - ${parseFloat(exp.amount).toFixed(2)} د.ت)؟`
        : `Êtes-vous sûr de vouloir supprimer la dépense "${exp.title}" (${parseFloat(exp.amount).toFixed(2)} DT) ?`,
      isRTL ? 'تأكيد حذف النفقة' : 'Supprimer la dépense',
      { type: 'danger', confirmText: isRTL ? 'حذف' : 'Supprimer', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );
    if (!ok) return;

    try {
      await api.delete(`/api/billing/expenses/${exp.id}`);
      dialog.success(isRTL ? 'تم حذف النفقة بنجاح' : 'Dépense supprimée avec succès');
      loadExpenses();
      loadInvoices();
    } catch (err) {
      console.error('Erreur suppression dépense:', err);
      dialog.error(err.response?.data?.error || 'Erreur lors de la suppression');
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

  const handleSendReminder = async (target) => {
    try {
      const invId = target?.id || target?.primary_invoice_id || target?.invoices?.[0]?.id;
      if (!invId) {
        dialog.error(isRTL ? 'تعذر العثور على الفاتورة' : 'Facture introuvable pour ce rappel');
        return;
      }
      const res = await api.post(`/api/billing/invoices/${invId}/remind`);
      if (res.data?.success) {
        dialog.success(isRTL ? 'تم إرسال تذكير الدفع لولي الأمر بنجاح' : 'Rappel de paiement envoyé au parent avec succès');
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
    setPayingFamily(null);
    setVoidInvoice(null);
    setExpenseModalOpen(false);
    onClose();
  };

  // Filtrage des enfants individuels
  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const childName = `${inv.child_first_name || ''} ${inv.child_last_name || ''}`.toLowerCase();
    const parentName = `${inv.parent_first_name || ''} ${inv.parent_last_name || ''}`.toLowerCase();
    const receipt = (inv.receipt_number || '').toLowerCase();
    return childName.includes(term) || parentName.includes(term) || receipt.includes(term);
  });

  // Filtrage des familles
  const filteredFamilies = families.filter(fam => {
    // Filtre par statut
    if (statusFilter === 'pending' && fam.status === 'paid') return false;
    if (statusFilter === 'paid' && fam.status !== 'paid') return false;
    if (statusFilter === 'overdue' && fam.status !== 'overdue' && fam.status !== 'pending') return false;

    // Filtre de recherche
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const parentName = (fam.parent_name || '').toLowerCase();
    const phone = (fam.parent_phone || '').toLowerCase();
    const childrenNames = fam.invoices.map(i => `${i.child_first_name || ''} ${i.child_last_name || ''}`.toLowerCase()).join(' ');
    const receipts = fam.invoices.map(i => (i.receipt_number || '').toLowerCase()).join(' ');
    return parentName.includes(term) || phone.includes(term) || childrenNames.includes(term) || receipts.includes(term);
  });

  const filteredExpenses = expenses.filter(exp => {
    if (!expenseSearch) return true;
    const term = expenseSearch.toLowerCase();
    const title = (exp.title || '').toLowerCase();
    const notes = (exp.notes || '').toLowerCase();
    const method = (exp.payment_method || '').toLowerCase();
    return title.includes(term) || notes.includes(term) || method.includes(term);
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

  const getFamilyInitials = (parentName) => {
    if (!parentName) return 'FA';
    const clean = parentName.replace(/^(Famille\s+|M\.\s+|Mme\s+)/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  const getChildrenSummary = (invList) => {
    if (!invList || invList.length === 0) return '';
    if (invList.length === 1) {
      const inv = invList[0];
      const sched = inv.care_schedule === 'half_day' ? '☀️ Demi-journée' : '☀️ Journée';
      return `${inv.child_first_name} (${sched})`;
    }
    const names = invList.map(i => i.child_first_name).filter(Boolean);
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names.slice(0, 2).join(' & ')} (+${names.length - 2})`;
  };

  if (!isOpen) return null;

  // Calcul du montant dû attendu pour la modale espèces individuelle
  const cashMainDue = payingInvoice ? Math.max(0, (parseFloat(payingInvoice.amount_due ?? payingInvoice.total_due ?? payingInvoice.amount ?? 0) || 0) - (parseFloat(payingInvoice.amount_paid || 0) || 0)) : 0;
  const cashSiblingsDue = payingInvoice ? siblingInvoices
    .filter(s => selectedSiblingIds.includes(s.id))
    .reduce((acc, s) => {
      const sAmt = parseFloat(s.amount_due ?? s.total_due ?? s.amount ?? 0) || 0;
      const sPaid = parseFloat(s.amount_paid || 0) || 0;
      return acc + Math.max(0, sAmt - sPaid);
    }, 0) : 0;
  const cashTotalExpected = cashMainDue + cashSiblingsDue;

  // Calcul du montant attendu pour la modale familiale
  const familyComputedTotal = payingFamily 
    ? calculateFamilyExpectedDue(payingFamily, familySelectedChildIds, familyMonthsCount) 
    : 0;
  const familySurplus = payingFamily && parseFloat(familyAmountGiven || 0) > familyComputedTotal
    ? parseFloat(familyAmountGiven || 0) - familyComputedTotal
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#F4F7FA] dark:bg-gray-900 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-[96vw] 2xl:max-w-[1440px] h-full sm:h-auto sm:max-h-[94vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800">
        
        {/* En-tête (Dégradé émeraude éclatant + Protection Safe Area iOS / Dynamic Island) */}
        <div className="modal-ios-safe-header px-4 sm:px-6 pb-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm text-white shrink-0">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight truncate leading-tight">
                {isRTL ? 'إدارة المالية : الاشتراكات والمصاريف' : 'Cotisations & Dépenses'}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/90 leading-tight whitespace-nowrap">
                {isRTL ? 'المداخيل، المصاريف والوصولات PDF' : 'Recettes, charges & reçus PDF'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => setActiveTab('quick_alert')}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={isRTL ? 'تنبيه سريع' : 'Alerte rapide'}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={isRTL ? 'إغلاق' : 'Fermer'}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Navigation par Onglets (50/50 Grid) & Barre de Période Compacte (Photo 1 & 2) */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 flex flex-col gap-2.5 shrink-0">
          {/* Ligne 1 : Grille des 2 Onglets Principaux (50/50) */}
          <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700 w-full sm:max-w-md mx-auto sm:mx-0">
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? 'الاشتراكات' : 'Cotisations'}</span>
              {invoices.length > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-extrabold">
                  {invoices.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <TrendingDown className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{isRTL ? 'المصاريف' : 'Dépenses'}</span>
              {expenses.length > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold">
                  {expenses.length}
                </span>
              )}
            </button>
          </div>

          {/* Ligne 2 : Sélecteur de Période Pilule + Bouton d'action contextuel (Calibré anti-débordement mobile) */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl p-0.5 sm:p-1 gap-0.5 sm:gap-1 shadow-xs shrink-0">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title={isRTL ? 'الشهر السابق' : 'Mois précédent'}
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
              </button>
              <span className="px-1.5 sm:px-2.5 text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                {isRTL ? MONTH_NAMES_AR[selectedMonth - 1] : MONTH_NAMES_FR[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title={isRTL ? 'الشهر القادم' : 'Mois suivant'}
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
              </button>
              {isNotCurrentMonth && (
                <button
                  type="button"
                  onClick={handleResetToCurrentMonth}
                  className="mx-0.5 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 rounded-md border border-emerald-300 dark:border-emerald-700 transition-colors whitespace-nowrap shadow-xs"
                >
                  {isRTL ? 'الآن' : 'Ce mois'}
                </button>
              )}
            </div>

            {activeTab === 'invoices' && (
              <button
                type="button"
                onClick={handleGenerateMonthly}
                disabled={generating}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isNotCurrentMonth
                    ? (isRTL ? `توليد ${selectedMonth}/${selectedYear}` : `Générer ${MONTH_NAMES_FR[selectedMonth - 1]}`)
                    : (isRTL ? 'توليد هذا الشهر' : 'Générer ce mois')}
                </span>
                <span className="inline sm:hidden">
                  {isRTL ? 'توليد' : 'Générer'}
                </span>
              </button>
            )}
            {activeTab === 'expenses' && (
              <button
                type="button"
                onClick={handleOpenAddExpense}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRTL ? 'إضافة نفقة' : 'Nouvelle Dépense'}</span>
                <span className="inline sm:hidden">{isRTL ? 'نفقة' : 'Dépense'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Corps principal (Canvas fond épuré moderne #F4F7FA + Anti-coupure bas d'écran) */}
        <div className="modal-ios-safe-scroll flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 bg-[#F4F7FA] dark:bg-gray-900">

          {/* Résumé synthétique financier : Héro Trésorerie Nette + Grille 2x2 des 4 KPI (Photo 1 & 2) */}
          {summary && (activeTab === 'invoices' || activeTab === 'expenses') && (
            <div className="space-y-2.5">
              {/* Carte Héro Trésorerie Nette (Caisse) */}
              {(() => {
                const netVal = summary.treasury?.net_balance !== undefined
                  ? parseFloat(summary.treasury.net_balance)
                  : (parseFloat(summary.total_collected || 0) - parseFloat(summary.expenses?.total_expenses || 0));
                return (
                  <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white dark:from-[#0F172A] dark:to-gray-900 text-gray-900 dark:text-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-emerald-200/80 dark:border-white/10 flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold tracking-wider text-emerald-800/80 dark:text-slate-400 uppercase">
                          {isRTL ? 'السيولة الصافية (الصندوق)' : 'TRÉSORERIE NETTE (CAISSE)'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                          {isRTL ? 'المداخيل المستخلصة – مصاريف الشهر' : 'Cash perçu – Dépenses du mois'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 nowrap-dt leading-none">
                        {netVal >= 0 ? '+' : ''}{netVal.toFixed(0)} <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-300">DT</span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
                        {isRTL ? 'صافي السيولة النقدية' : 'Cash net du mois'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Grille des 4 KPI (2 cols sur mobile, 4 cols sur desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Total Attendu */}
                <div
                  onClick={() => setActiveTab('invoices')}
                  className="kpi-stripe kpi-stripe-expected bg-white dark:bg-gray-800 p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
                    <span>{isRTL ? 'إجمالي المطلوب' : 'Total Attendu'}</span>
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-1.5 nowrap-dt">
                    {parseFloat(summary.total_due || 0).toFixed(0)} <span className="text-xs font-semibold text-gray-400">DT</span>
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                    {isRTL ? 'اشتراكات الشهر' : 'Cotisations du mois'}
                  </div>
                </div>

                {/* 2. Cash Réel Perçu */}
                <div
                  onClick={() => setActiveTab('invoices')}
                  className="kpi-stripe kpi-stripe-collected bg-white dark:bg-gray-800 p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <span>{isRTL ? 'المحصل نقداً' : 'Cash Réel Perçu'}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1.5 nowrap-dt">
                    {parseFloat(summary.total_collected || 0).toFixed(0)} <span className="text-xs font-semibold text-emerald-500">DT</span>
                  </div>
                  <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 truncate">
                    {summary.incomes?.advance_cash_collected > 0
                      ? `dont +${summary.incomes.advance_cash_collected.toFixed(0)} DT av.`
                      : (isRTL ? 'مقبوضات نقدية فعلية' : 'Entrées réelles caisse')}
                  </div>
                </div>

                {/* 3. Reste à Percevoir */}
                <div
                  onClick={() => setActiveTab('invoices')}
                  className="kpi-stripe kpi-stripe-remaining bg-white dark:bg-gray-800 p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <span>{isRTL ? 'المتبقي' : 'Reste à Percevoir'}</span>
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-1.5 nowrap-dt">
                    {parseFloat(summary.total_remaining || 0).toFixed(0)} <span className="text-xs font-semibold text-rose-500">DT</span>
                  </div>
                  <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 truncate">
                    Recouvrement : {summary.collection_rate || 0}%
                  </div>
                </div>

                {/* 4. Dépenses du Mois */}
                <div
                  onClick={() => setActiveTab('expenses')}
                  className="kpi-stripe kpi-stripe-expenses bg-white dark:bg-gray-800 p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <span>{isRTL ? 'المصاريف' : 'Dépenses du Mois'}</span>
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1.5 nowrap-dt">
                    {parseFloat(summary.expenses?.total_expenses || 0).toFixed(0)} <span className="text-xs font-semibold text-amber-500">DT</span>
                  </div>
                  <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 truncate">
                    {summary.expenses?.count || 0} charge(s) du mois
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Cotisations du Mois */}
          {activeTab === 'invoices' && (
            <div className="space-y-3.5">
              
              {/* Barre d'outils : Recherche + Filtres Statut (Vue Famille épurée) */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2.5 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isRTL ? 'بحث parent, enfant, tel...' : 'Recherche parent, enfant, tél...'}
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto shrink-0">
                  {[
                    { key: 'all', label: isRTL ? 'الكل' : 'Tous' },
                    { key: 'pending', label: isRTL ? 'في الانتظار' : 'À régler' },
                    { key: 'paid', label: isRTL ? 'مدفوع' : 'Payés' }
                  ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all whitespace-nowrap ${
                          statusFilter === f.key
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

              {/* LISTE PRINCIPALE : VUE PAR FAMILLE UNIQUE (Style C Photo 1 & 2) */}
              <div>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                  ) : filteredFamilies.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-medium">
                        {isRTL ? 'لا توجد عائلات مسجلة لهذا الشهر' : 'Aucune famille trouvée pour cette période'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFamilies.map((fam) => {
                        const isFullyPaid = fam.remaining_due <= 0 && fam.total_due > 0;
                        const isAdvancePaid = fam.is_advance_paid;
                        const isPartial = !isFullyPaid && fam.amount_paid > 0;
                        const famArrears = fam.invoices.reduce((sum, i) => sum + (parseFloat(i.previous_arrears || 0) || 0), 0);
                        const famDiscount = fam.invoices.reduce((sum, i) => sum + (parseFloat(i.discount_amount || 0) || 0), 0);
                        const sharedReceipt = fam.invoices.find(i => i.receipt_number)?.receipt_number;
                        const isExpanded = expandedFamilyIds.has(fam.family_id);

                        // Liseré latéral et couleur avatar assortie au statut (Photo 1 & 2)
                        let stripeClass = 'cotis-stripe-pending';
                        let avatarBg = 'bg-gradient-to-br from-blue-500 to-indigo-600';
                        if (isAdvancePaid) {
                          stripeClass = 'cotis-stripe-advance';
                          avatarBg = 'bg-gradient-to-br from-teal-500 to-cyan-700';
                        } else if (isFullyPaid) {
                          stripeClass = 'cotis-stripe-paid';
                          avatarBg = 'bg-gradient-to-br from-emerald-500 to-teal-700';
                        } else if (isPartial) {
                          stripeClass = 'cotis-stripe-partial';
                          avatarBg = 'bg-gradient-to-br from-amber-500 to-orange-600';
                        }

                        return (
                          <div
                            key={fam.family_id}
                            className={`cotis-card-stripe ${stripeClass} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col gap-2.5`}
                          >
                            {/* En-tête de la carte : Avatar 2 lettres + Identité + Prix + Statut (Photo 1 & 2) */}
                            <div className="flex items-start justify-between gap-3">
                              {/* Identité : Avatar 2 lettres + Nom famille + Téléphone + Prénoms enfants */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl ${avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                                  {getFamilyInitials(fam.parent_name)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-gray-900 dark:text-white text-sm truncate">
                                    {fam.parent_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                                    {fam.parent_phone ? (
                                      <a
                                        href={`tel:${fam.parent_phone}`}
                                        className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 whitespace-nowrap"
                                      >
                                        <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span>{fam.parent_phone}</span>
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 italic text-[11px]">
                                        {isRTL ? 'رقم غير متوفر' : 'Sans tél.'}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span className="truncate">{getChildrenSummary(fam.invoices)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Bloc Prix à droite : Montant au-dessus, Statut pill directement dessous */}
                              <div className="text-right shrink-0 whitespace-nowrap nowrap-dt">
                                {isAdvancePaid ? (
                                  <>
                                    <div className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 nowrap-dt leading-tight">
                                      0 <span className="text-xs font-bold text-teal-500">DT dû</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-700 mt-1 nowrap-dt">
                                      <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                                      <span>
                                        {fam.advance_paid_date 
                                          ? `Soldé d'avance le ${new Date(fam.advance_paid_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` 
                                          : (isRTL ? 'خالص مسبقاً' : 'Soldé d\'avance')}
                                      </span>
                                    </span>
                                  </>
                                ) : isFullyPaid ? (
                                  <>
                                    <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 nowrap-dt leading-tight">
                                      {fam.total_due.toFixed(0)} <span className="text-xs font-bold text-gray-400">DT</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 mt-1 nowrap-dt">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>Soldé ({fam.invoices[0]?.payment_method || 'Espèces'})</span>
                                    </span>
                                  </>
                                ) : isPartial ? (
                                  <>
                                    <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 nowrap-dt leading-tight">
                                      {fam.remaining_due.toFixed(0)} <span className="text-xs font-bold text-amber-500">DT dû</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mt-1 nowrap-dt">
                                      <PieChart className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>Partiel ({fam.amount_paid.toFixed(0)}/{fam.total_due.toFixed(0)} DT)</span>
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white nowrap-dt leading-tight">
                                      {fam.total_due.toFixed(0)} <span className="text-xs font-bold text-gray-400">DT</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 mt-1 nowrap-dt">
                                      <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>À régler</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Ligne des badges méta */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap shrink-0">
                                👨‍👩‍👧‍👦 {fam.children_count} {fam.children_count > 1 ? (isRTL ? 'أطفال' : 'enfants') : (isRTL ? 'طفل' : 'enfant')}
                              </span>
                              {famArrears > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 whitespace-nowrap shrink-0">
                                  Arriéré : +{famArrears.toFixed(0)} DT
                                </span>
                              )}
                              {famDiscount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0">
                                  Remise : -{famDiscount.toFixed(0)} DT
                                </span>
                              )}
                              {fam.credit_balance > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 whitespace-nowrap shrink-0">
                                  💰 Avoir : +{fam.credit_balance.toFixed(0)} DT
                                </span>
                              )}
                              {isPartial && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shrink-0">
                                  ⏳ Reste dû : {fam.remaining_due.toFixed(0)} DT
                                </span>
                              )}
                              {sharedReceipt && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 border border-gray-200 dark:border-gray-600 whitespace-nowrap shrink-0">
                                  {sharedReceipt}
                                </span>
                              )}
                            </div>

                            {/* Accordéon Détail Fratrie */}
                            {isExpanded && (
                              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700/80 flex flex-col gap-2 text-xs">
                                {fam.invoices.map((inv) => {
                                  const invDue = parseFloat(inv.total_due || 0);
                                  const invPaid = parseFloat(inv.amount_paid || 0);
                                  const invRemaining = Math.max(0, invDue - invPaid);
                                  const invArrears = parseFloat(inv.previous_arrears || 0);
                                  const invDiscount = parseFloat(inv.discount_amount || 0);
                                  const isChildSettled = inv.status === 'paid' || (invDue > 0 && invPaid >= invDue);

                                  return (
                                    <div
                                      key={inv.id}
                                      className="flex items-center justify-between gap-2 pb-1.5 border-b border-dashed border-gray-200 dark:border-gray-700/80 last:border-b-0 last:pb-0"
                                    >
                                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        <strong className="text-gray-900 dark:text-white">
                                          • {inv.child_first_name} {inv.child_last_name}
                                        </strong>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                          {inv.care_schedule === 'half_day' ? '🌤️ Demi-journée (13h)' : '☀️ Journée complète'}
                                          {parseFloat(inv.base_price || 0) > 0 && ` (${parseFloat(inv.base_price).toFixed(0)} DT)`}
                                          {inv.saturday_price > 0 && ' + Samedi'}
                                        </span>
                                        {invArrears > 0 && (
                                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                                            (+{invArrears.toFixed(0)} DT arriéré)
                                          </span>
                                        )}
                                        {invDiscount > 0 && (
                                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                                            (-{invDiscount.toFixed(0)} DT remise)
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap nowrap-dt font-extrabold text-xs">
                                        {!isChildSettled ? (
                                          invPaid > 0 ? (
                                            <span className="text-amber-600 dark:text-amber-400 nowrap-dt">
                                              Reste {invRemaining.toFixed(0)} DT
                                            </span>
                                          ) : (
                                            <span className="text-gray-900 dark:text-white nowrap-dt">
                                              {invDue.toFixed(0)} DT
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-emerald-600 dark:text-emerald-400 nowrap-dt">
                                            {invDue.toFixed(0)} DT ✓ {inv.is_advance_paid 
                                              ? (inv.advance_paid_date ? `Soldé d'avance (${new Date(inv.advance_paid_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })})` : "Soldé d'avance")
                                              : (isRTL ? 'خالص' : 'Soldé')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {fam.amount_paid > 0 && (
                                  <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenVoidFamily(fam)}
                                      className="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                                      title={isRTL ? 'إلغاء الخلاص (حق التصحيح)' : "Annuler l'encaissement (droit à l'erreur)"}
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                      <span>{isRTL ? 'إلغاء الخلاص' : "Annuler l'encaissement"}</span>
                                    </button>
                                  </div>
                                )}
                                </div>
                              )}

                              {/* Barre d'actions inférieure responsive (Anti-coupure & Anti-masquage mobile) */}
                              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                {/* Ligne 1 sur mobile : Masquer/Détail + Outils secondaires (Reçu PDF, Rappel, Annuler) */}
                                <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleFamilyDetails(fam.family_id)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 py-1 px-1.5 rounded transition-colors whitespace-nowrap"
                                  >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    <span>{isExpanded ? (isRTL ? 'إخفاء' : 'Masquer') : (isRTL ? 'التفاصيل' : 'Détail')}</span>
                                  </button>

                                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                    {(isFullyPaid || sharedReceipt || isPartial) && fam.invoices[0] && (
                                      <button
                                        type="button"
                                        onClick={() => handleViewReceipt(fam.invoices[0])}
                                        className="h-7 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                                        title={isRTL ? 'معاينة وتنزيل الوصل' : 'Consulter et télécharger le reçu PDF'}
                                      >
                                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span>{isRTL ? 'وصل PDF' : 'Reçu PDF'}</span>
                                      </button>
                                    )}

                                    {!isFullyPaid && (
                                      <button
                                        type="button"
                                        onClick={() => handleSendReminder(fam.invoices[0] || fam)}
                                        className="h-7 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                                        title={isRTL ? 'إرسال تذكير بالخلاص للولي' : 'Envoyer un rappel de paiement au parent'}
                                      >
                                        <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span>{isRTL ? 'تذكير' : 'Rappel'}</span>
                                      </button>
                                    )}

                                  </div>
                                </div>

                              {/* Ligne 2 sur mobile (pleine largeur anti-débordement) ou aligné à droite sur desktop : CTA Principal Encaisser / Régler */}
                              {!isFullyPaid && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFamilyPayment(fam)}
                                    className="flex-1 sm:flex-initial sm:w-auto h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap min-w-0"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                                    <span className="nowrap-dt truncate">
                                      {isPartial
                                        ? (isRTL ? `خلاص ${fam.remaining_due.toFixed(0)} د.ت` : `Régler ${fam.remaining_due.toFixed(0)} DT`)
                                        : (isRTL ? `استخلاص ${fam.total_due.toFixed(0)} د.ت` : `Encaisser ${fam.total_due.toFixed(0)} DT`)}
                                    </span>
                                  </button>

                                  {isPastMonth && (
                                    <button
                                      type="button"
                                      onClick={() => handleSettlePastFamily(fam)}
                                      className="h-9 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0"
                                      title={isRTL ? 'تسوية اشتراكات شهر سابق نقداً' : 'Régulariser mois passé en espèces antérieures'}
                                    >
                                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>{isRTL ? 'تسوية' : 'Régulariser'}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

            </div>
          )}

          {/* Onglet Dépenses & Trésorerie (Cartes Style C avec liseré rose) */}
          {activeTab === 'expenses' && (
            <div className="space-y-3.5">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2.5 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder={isRTL ? 'بحث في المصاريف...' : 'Recherche dépenses, fournisseur...'}
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-0.5 max-w-full">
                  <button
                    onClick={() => setExpenseCategoryFilter('all')}
                    className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                      expenseCategoryFilter === 'all'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isRTL ? 'كل الفئات' : 'Toutes'}
                  </button>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setExpenseCategoryFilter(cat.value)}
                      className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        expenseCategoryFilter === cat.value
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{isRTL ? cat.labelAr : cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {expensesLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-rose-600" />
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <TrendingDown className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium">
                    {isRTL ? 'لا توجد مصاريف مسجلة لهذا الشهر' : 'Aucune dépense enregistrée pour ce mois'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRTL ? 'اضغط على "+ إضافة نفقة" لإدراج مصاريف التسيير والصيانة' : 'Cliquez sur "+ Nouvelle Dépense" pour enregistrer une charge'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((exp) => {
                    const catObj = EXPENSE_CATEGORIES.find(c => c.value === exp.category) || {
                      label: exp.category,
                      labelAr: exp.category,
                      icon: '📝',
                      color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    };
                    const dateStr = exp.expense_date
                      ? new Date(exp.expense_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '';
                    return (
                      <div
                        key={exp.id}
                        className="cotis-card-stripe cotis-stripe-expense bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg border border-rose-100 dark:border-rose-900/40 shrink-0">
                            {catObj.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-gray-900 dark:text-white text-sm truncate">
                                {exp.title}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${catObj.color}`}>
                                {isRTL ? catObj.labelAr : catObj.label}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {dateStr}
                              </span>
                              <span>•</span>
                              <span>Mode : {exp.payment_method || 'Espèces'}</span>
                              {exp.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-gray-600 dark:text-gray-300 truncate">{exp.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 nowrap-dt">
                              -{parseFloat(exp.amount || 0).toFixed(2)} <span className="text-xs font-bold text-gray-400">DT</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExpense(exp)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs transition-colors"
                              title={isRTL ? 'تعديل النفقة' : 'Modifier la dépense'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs transition-colors"
                              title={isRTL ? 'حذف النفقة' : 'Supprimer la dépense'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Onglet Quick Alert */}
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

        {/* MODALE D'ENCAISSEMENT FAMILIAL & MULTI-MOIS (Nouveau !) */}
        {payingFamily && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ zIndex: 70 }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span>{isRTL ? 'استخلاص اشتراك العائلة' : 'Règlement Familial'} : {payingFamily.parent_name}</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {payingFamily.parent_phone && `📞 ${payingFamily.parent_phone} • `}
                    {isRTL ? 'اختر الأطفال وعدد الأشهر المراد دفعها' : 'Sélectionnez les enfants et les mois à régler'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingFamily(null)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bandeau Avoir existant si applicable */}
              {payingFamily.credit_balance > 0 && (
                <div className="p-2.5 mb-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-200 flex items-center justify-between">
                  <span>💰 {isRTL ? 'رصيد تسبقة متاح على حساب العائلة :' : 'Avoir disponible sur le compte familial :'}</span>
                  <strong className="font-bold text-sm text-cyan-700 dark:text-cyan-300">
                    +{payingFamily.credit_balance.toFixed(2)} DT
                  </strong>
                </div>
              )}

              {/* 1. Sélecteur de Durée (1 mois, 2 mois, Trimestre) */}
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRTL ? 'الفترة وعدد الأشهر المراد دفعها :' : 'Période & Nombre de mois à régler :'}
                </label>
                {(() => {
                  const hasArrears = (payingFamily?.invoices || []).some(inv => parseFloat(inv.previous_arrears || 0) > 0);
                  const arrearsTotal = (payingFamily?.invoices || []).reduce((acc, inv) => acc + (parseFloat(inv.previous_arrears || 0) || 0), 0);

                  return (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleChangeFamilyMonths(m)}
                            className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                              familyMonthsCount === m
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            }`}
                          >
                            <div className="text-xs font-bold flex items-center justify-center gap-1">
                              {m === 1 && (isRTL ? 'شهر واحد' : '1 mois (en cours)')}
                              {m === 2 && (isRTL ? 'شهران (2 mois)' : '2 mois d\'avance')}
                              {m === 3 && (isRTL ? 'ثلاثية (3 mois)' : 'Trimestre (3 mois)')}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">
                              {m === 1 ? `${payingFamily.period_month}/${payingFamily.period_year}` : `+${m - 1} mois`}
                            </div>
                          </button>
                        ))}
                      </div>
                      {hasArrears && (
                        <div className="mt-1.5 text-[11px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg p-2 flex items-center gap-1.5">
                          <span className="font-bold text-sm">ℹ️</span>
                          <span>
                            {isRTL
                              ? `خلاص مجمع: متخلدات سابقة (${arrearsTotal.toFixed(0)} د.ت) + معلوم الشهر الحالي يقع خلاصهما أولاً، والباقي للأشهر القادمة.`
                              : `Règlement combiné : les arriérés (+${arrearsTotal.toFixed(0)} DT) et le mois en cours sont soldés en priorité, le surplus est affecté aux mois futurs.`}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* 2. Liste des Enfants avec cases à cocher */}
              <div className="mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  <span>{isRTL ? 'الأطفال المعنيون بالدفع :' : 'Cochez les enfants à régler :'}</span>
                  <span className="text-[11px] text-gray-500 font-normal">
                    {familySelectedChildIds.length} / {payingFamily.invoices.length} {isRTL ? 'محدد' : 'sélectionné(s)'}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                  {payingFamily.invoices.map((inv) => {
                    const isChecked = familySelectedChildIds.includes(inv.child_id);
                    const discEntry = familyDiscounts[inv.child_id];
                    const isDiscEnabled = Boolean(discEntry?.enabled);
                    const effectiveDiscount = isDiscEnabled && discEntry && discEntry.discountAmount !== '' && !isNaN(parseFloat(discEntry.discountAmount))
                      ? Math.max(0, parseFloat(discEntry.discountAmount))
                      : 0;

                    const basePrice = parseFloat(inv.base_price || 0);
                    const satPrice = parseFloat(inv.saturday_price || 0);
                    const insPrice = parseFloat(inv.insurance_price || 0);
                    const arrears = parseFloat(inv.previous_arrears || 0);

                    const month1Due = Math.max(0, basePrice + satPrice + insPrice - effectiveDiscount) + arrears;
                    const invAmountPaid = parseFloat(inv.amount_paid || 0) || 0;
                    const remainingMonth1 = Math.max(0, month1Due - invAmountPaid);

                    const futureBaseMonthly = Math.max(0, basePrice + satPrice);
                    const futureMonthsTotal = Math.max(0, familyMonthsCount - 1) * futureBaseMonthly;
                    const childTotal = remainingMonth1 + futureMonthsTotal;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                            : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleFamilyChild(inv.child_id, e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                                {inv.child_first_name} {inv.child_last_name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] leading-normal">
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                  {inv.care_schedule === 'half_day' ? (isRTL ? '🌤️ نصف يوم (13h)' : '🌤️ Demi-journée (13h)') : (isRTL ? '☀️ يوم كامل' : '☀️ Journée complète')}
                                  {basePrice > 0 && ` (${basePrice.toFixed(0)} DT)`}
                                </span>
                                {satPrice > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold whitespace-nowrap">
                                    {isRTL ? '+ السبت' : '+ Samedi'} (+{satPrice.toFixed(0)} DT)
                                  </span>
                                )}
                                {insPrice > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold whitespace-nowrap">
                                    {isRTL ? '+ تأمين' : '+ Assurance'} (+{insPrice.toFixed(0)} DT)
                                  </span>
                                )}
                                {arrears > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold whitespace-nowrap">
                                    {isRTL ? '+ متخلدات' : '+ Arriéré'} : +{arrears.toFixed(0)} DT
                                  </span>
                                )}
                                {effectiveDiscount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold whitespace-nowrap">
                                    -{effectiveDiscount.toFixed(0)} DT {isRTL ? 'تخفيض' : 'remise'}
                                  </span>
                                )}
                                {familyMonthsCount > 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold whitespace-nowrap">
                                    • {familyMonthsCount} {isRTL ? 'أشهر' : 'mois'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>

                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-sm sm:text-base text-emerald-700 dark:text-emerald-300 whitespace-nowrap block">
                              {childTotal.toFixed(0)} DT
                            </span>
                            {familyMonthsCount > 1 && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap block mt-0.5">
                                1×{(remainingMonth1).toFixed(0)} DT + {familyMonthsCount - 1}×{(futureBaseMonthly).toFixed(0)} DT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Zone de Remise ponctuelle intégrée (visible uniquement si l'enfant est coché) */}
                        {isChecked && (
                          <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isDiscEnabled}
                                  onChange={(e) => handleFamilyDiscountToggleEnabled(inv.child_id, e.target.checked)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className={`text-[11px] font-semibold ${isDiscEnabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                  🏷️ {isRTL ? 'تطبيق تخفيض لهذا الشهر :' : 'Remise ce mois :'}
                                </span>
                              </label>

                              <div className={`inline-flex items-center transition-opacity ${isDiscEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  disabled={!isDiscEnabled}
                                  value={discEntry?.discountAmount ?? ''}
                                  onChange={(e) => handleFamilyDiscountChange(inv.child_id, e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-7 px-2 text-xs font-bold text-center bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-100 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                                />
                                <span className="ml-1 text-[11px] font-bold text-gray-500">DT</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Formulaire de saisie du montant encaissé */}
              <form onSubmit={submitFamilyPayment} className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'المجموع المستحق المطلوب :' : 'Total dû calculé :'}
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {familyComputedTotal.toFixed(2)} DT
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'المبلغ المستلم فعلياً (د.ت) *' : 'Montant encaissé remis (DT) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={familyAmountGiven}
                    onChange={(e) => setFamilyAmountGiven(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Détection du Trop-perçu (Avoir sur mois suivant) */}
                {familySurplus > 0 && (
                  <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>
                      {isRTL
                        ? `✨ سيتم تسجيل الفائض (${familySurplus.toFixed(2)} د.ت) كـ رصيد تسبقة (Avoir) للعائلة يُخصم تلقائياً الشهر القادم.`
                        : `✨ Le trop-perçu de ${familySurplus.toFixed(2)} DT sera enregistré en avoir sur le compte familial et déduit automatiquement le mois prochain.`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'طريقة الدفع' : 'Mode de règlement'}
                    </label>
                    <select
                      value={familyPaymentMethod}
                      onChange={(e) => setFamilyPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Règlement en espèces">Règlement en espèces</option>
                      <option value="Règlement en chèque">Règlement en chèque</option>
                      <option value="Règlement en virement">Règlement en virement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'مرجع / ملاحظة' : 'Réf. Chèque / Note'}
                    </label>
                    <input
                      type="text"
                      value={familyCustomRef}
                      onChange={(e) => setFamilyCustomRef(e.target.value)}
                      placeholder="Ex: Chèque N° 4819..."
                      className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setPayingFamily(null)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={familyPayingLoading || familySelectedChildIds.length === 0}
                    className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${familyPayingLoading ? 'animate-spin' : ''}`} />
                    <span>{familyPayingLoading ? (isRTL ? 'جاري التأكيد...' : 'Validation...') : (isRTL ? 'تأكيد وإصدار الوصل العائلي' : 'Valider & Émettre le reçu familial')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Secondaire : Encaissement Individuel par Enfant */}
        {payingInvoice && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" style={{ zIndex: 70 }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <div>
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
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
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
                  {parseFloat(payingInvoice.amount_paid || 0) > 0 && (
                    <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                      <span>{isRTL ? 'المبلغ المدفوع مسبقاً (تسبقة) :' : 'Acompte déjà réglé :'}</span>
                      <span>-{parseFloat(payingInvoice.amount_paid).toFixed(0)} DT</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white text-sm pt-1.5 border-t border-gray-200 dark:border-gray-700">
                    <span>{parseFloat(payingInvoice.amount_paid || 0) > 0 ? (isRTL ? 'المتبقي للخلاص :' : 'Reste dû à régler :') : (isRTL ? 'المجموع المستحق :' : 'Total dû :')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {Math.max(0, (parseFloat(payingInvoice.amount_due ?? payingInvoice.total_due ?? 0) || 0) - (parseFloat(payingInvoice.amount_paid || 0) || 0)).toFixed(0)} DT
                    </span>
                  </div>

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

              {siblingInvoices.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{isRTL ? 'دفع موحد للعائلة (وصل خلاص واحد للإخوة) :' : 'Règlement groupé famille :'}</span>
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

                {parseFloat(cashAmount || 0) > cashTotalExpected && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isRTL
                        ? `تنبيه: المبلغ المدخل (${cashAmount} د.ت) يتجاوز المستحق المطلوب (${cashTotalExpected.toFixed(0)} د.ت).`
                        : `Attention : Le montant saisi (${cashAmount} DT) est supérieur au reste dû (${cashTotalExpected.toFixed(0)} DT).`}
                    </span>
                  </div>
                )}

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

        {/* Modal Secondaire : Annulation / Rectification d'encaissement (Droit à l'erreur) */}
        {voidInvoice && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" style={{ zIndex: 70 }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 text-rose-600">
                    <RotateCcw className="w-5 h-5 text-rose-600" />
                    {isRTL ? 'إلغاء استخلاص الفاتورة (حق التصحيح)' : "Annuler l'encaissement (Droit à l'erreur)"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isRTL
                      ? `هل أنت متأكد من إلغاء الدفع المسجل للطفل ${voidInvoice.child_first_name} ${voidInvoice.child_last_name}؟ ستتم إعادة الفاتورة قيد الانتظار.`
                      : `Êtes-vous sûr de vouloir annuler l'encaissement pour l'enfant ${voidInvoice.child_first_name} ${voidInvoice.child_last_name} ?`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoidInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl mb-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold">
                  ⚠️ {isRTL ? 'المبلغ المسترجع إلى قيد الانتظار :' : 'Montant actuellement encaissé :'}
                  <span className="font-bold text-gray-900 dark:text-white ml-1">
                    {parseFloat(voidInvoice.amount_paid || voidInvoice.total_due || 0).toFixed(2)} DT
                  </span>
                </div>
                {voidInvoice.receipt_number && (
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">
                    {isRTL ? 'الإيصال الملغى :' : 'Reçu associé :'} <span className="font-mono font-bold text-rose-600">{voidInvoice.receipt_number}</span>
                  </div>
                )}
              </div>

              <form onSubmit={submitVoidPayment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'سبب الإلغاء والتصحيح *' : "Motif de l'annulation *"}
                  </label>
                  <select
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 font-medium cursor-pointer"
                  >
                    <option value="Erreur de saisie">{isRTL ? 'خطأ في التسجيل' : 'Erreur de saisie'}</option>
                    <option value="Modifier le mode de paiement">{isRTL ? 'تعديل طريقة الدفع' : 'Modifier le mode de paiement'}</option>
                    <option value="Autre (sans précision)">{isRTL ? 'أخرى (دون تحديد)' : 'Autre (sans précision)'}</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setVoidInvoice(null)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {isRTL ? 'تراجع' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={voidLoading}
                    className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${voidLoading ? 'animate-spin' : ''}`} />
                    {voidLoading ? (isRTL ? 'جاري الإلغاء...' : 'Annulation...') : (isRTL ? 'تأكيد الإلغاء' : "Confirmer l'annulation")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Secondaire : Annulation d'un règlement familial groupé */}
        {voidFamily && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" style={{ zIndex: 70 }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 text-rose-600">
                    <RotateCcw className="w-5 h-5 text-rose-600" />
                    {isRTL ? 'إلغاء الخلاص العائلي (حق التصحيح)' : "Annuler l'encaissement familial"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isRTL
                      ? `هل أنت متأكد من إلغاء الدفع المسجل لعائلة ${voidFamily.parent_name}؟ ستتم إعادة فواتير جميع أفراد العائلة إلى حالة الانتظار.`
                      : `Êtes-vous sûr de vouloir annuler le règlement de la famille ${voidFamily.parent_name} ? Toutes les cotisations associées seront remises en attente.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseVoidFamily}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl mb-3 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>{isRTL ? 'المبلغ المسترجع إلى الانتظار :' : 'Montant à annuler :'}</span>
                  <span className="font-bold text-base text-gray-900 dark:text-white">
                    {parseFloat(voidFamily.amount_paid || voidFamily.total_due || 0).toFixed(2)} DT
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between">
                  <span>{isRTL ? 'الأطفال المعنيون :' : 'Enfants concernés :'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {voidFamily.invoices.map(i => i.child_first_name).join(', ')} ({voidFamily.children_count})
                  </span>
                </div>
                {voidFamily.invoices.find(i => i.receipt_number) && (
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between">
                    <span>{isRTL ? 'رقم الوصل الملغى :' : 'Reçu associé :'}</span>
                    <span className="font-mono font-bold text-rose-600">
                      {voidFamily.invoices.find(i => i.receipt_number)?.receipt_number}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={submitVoidFamily} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'سبب الإلغاء والتصحيح *' : "Motif de l'annulation *"}
                  </label>
                  <select
                    value={voidFamilyReason}
                    onChange={(e) => setVoidFamilyReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 font-medium cursor-pointer"
                  >
                    <option value="Erreur de saisie">{isRTL ? 'خطأ في التسجيل' : 'Erreur de saisie'}</option>
                    <option value="Modifier le mode de paiement">{isRTL ? 'تعديل طريقة الدفع' : 'Modifier le mode de paiement'}</option>
                    <option value="Autre (sans précision)">{isRTL ? 'أخرى (دون تحديد)' : 'Autre (sans précision)'}</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseVoidFamily}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {isRTL ? 'تراجع' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={voidFamilyLoading}
                    className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${voidFamilyLoading ? 'animate-spin' : ''}`} />
                    {voidFamilyLoading ? (isRTL ? 'جاري الإلغاء...' : 'Annulation...') : (isRTL ? 'تأكيد الإلغاء العائلي' : "Confirmer l'annulation")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Secondaire : Ajout / Édition d'une Dépense */}
        {expenseModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" style={{ zIndex: 70 }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 text-rose-600">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  {editingExpense
                    ? (isRTL ? 'تعديل النفقة' : 'Modifier la Dépense')
                    : (isRTL ? 'تسجيل نفقة جديدة' : 'Enregistrer une Dépense')}
                </h3>
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'بيان النفقة / العنوان *' : 'Intitulé / Titre *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    placeholder="Ex: Facture STEG Octobre, Achat gouache..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'الفئة *' : 'Catégorie *'}
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {isRTL ? cat.labelAr : cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'المبلغ (د.ت) *' : 'Montant (DT) *'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <DatePicker
                      label={isRTL ? 'تاريخ النفقة' : 'DATE DE LA DÉPENSE *'}
                      required
                      value={expenseForm.expense_date}
                      onChange={(value) => setExpenseForm({ ...expenseForm, expense_date: value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'طريقة الدفع' : 'Mode de règlement'}
                    </label>
                    <select
                      value={expenseForm.payment_method}
                      onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                      className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Chèque">Chèque</option>
                      <option value="Virement bancaire">Virement bancaire</option>
                      <option value="Carte bancaire">Carte bancaire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'ملاحظات / مرجع الفاتورة' : 'Notes / Référence facture (optionnel)'}
                  </label>
                  <input
                    type="text"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    placeholder="Ex: Facture N° 83910, payé à la livraison..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setExpenseModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={expenseSaving}
                    className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {expenseSaving ? (isRTL ? 'جاري الحفظ...' : 'Enregistrement...') : (editingExpense ? (isRTL ? 'تحديث' : 'Mettre à jour') : (isRTL ? 'حفظ النفقة' : 'Enregistrer'))}
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
