/**
 * ParentBillingPage - Page mobile dédiée aux Cotisations & Reçus de paiement pour les parents.
 * Accessible directement via le menu "Plus" de la barre de navigation mobile.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  Wallet,
  ChevronDown,
  FolderArchive,
  RefreshCw,
  Receipt,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import PaymentsHistoryModal from '../../components/modals/PaymentsHistoryModal';
import { useDialogContext } from '../../contexts/DialogContext';

const ParentBillingPage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dialog = useDialogContext?.() || { success: () => {}, error: () => {} };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/api/billing/my-invoices');
      if (res.data?.success) {
        setInvoices(res.data.invoices || []);
        setCreditBalance(parseFloat(res.data.credit_balance || res.data.invoices?.[0]?.parent_credit_balance || 0));
      }
    } catch (err) {
      console.error('Erreur chargement cotisations parent:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenReceipt = async (inv) => {
    try {
      const res = await api.get(`/api/billing/invoices/${inv.id}/receipt`, {
        responseType: 'blob'
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Erreur ouverture reçu PDF:', err);
      if (dialog?.error) {
        dialog.error(isRTL ? 'تعذر فتح وصل الخلاص' : 'Impossible d\'ouvrir le reçu PDF');
      }
    }
  };

  // Repère temporel dynamique : mois courant vs mois passés vs mois futurs
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const isFuturePeriod = (m, y) => {
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    return year > currentYear || (year === currentYear && month > currentMonth);
  };

  const isCurrentPeriod = (m, y) => {
    return parseInt(y, 10) === currentYear && parseInt(m, 10) === currentMonth;
  };

  // RÈGLE MÉTIER STRICTE : Les mois futurs ne sont JAMAIS affichés sous forme de factures
  // aux parents. Seuls les mois passés et le mois en cours (point courant) sont visibles.
  // Les versements d'avance sont quant à eux consultables dans l'historique des versements réels.
  // Les périodes de vacances fermées (ex: Août 0 DT) et factures annulées sont totalement exclues.
  const visibleInvoices = invoices.filter(inv => {
    if (isFuturePeriod(inv.period_month, inv.period_year)) return false;
    if (inv.status === 'cancelled') return false;
    const due = parseFloat(inv.amount_due ?? inv.total_due ?? inv.amount ?? 0) || 0;
    const paid = parseFloat(inv.amount_paid || 0) || 0;
    if (due === 0 && paid === 0) return false;
    return true;
  });

  // Groupement des factures par fratrie pour la même période mensuelle (mois passés et mois courant uniquement)
  const groups = [];
  const processedIds = new Set();

  visibleInvoices.forEach(inv => {
    if (processedIds.has(inv.id)) return;

    const siblings = visibleInvoices.filter(other =>
      other.id !== inv.id &&
      !processedIds.has(other.id) &&
      parseInt(other.period_month, 10) === parseInt(inv.period_month, 10) &&
      parseInt(other.period_year, 10) === parseInt(inv.period_year, 10)
    );

    if (siblings.length > 0) {
      const allFamily = [inv, ...siblings];
      allFamily.forEach(f => processedIds.add(f.id));

      const totalDueFamily = allFamily.reduce((sum, f) => sum + (parseFloat(f.amount_due ?? f.total_due ?? f.amount ?? 0) || 0), 0);
      const totalPaidFamily = allFamily.reduce((sum, f) => sum + (parseFloat(f.amount_paid || 0) || 0), 0);
      const isFamilyPaid = allFamily.every(f => 
        f.status === 'paid' || 
        parseFloat(f.total_due || 0) === 0 || 
        (parseFloat(f.amount_paid || 0) >= parseFloat(f.total_due || 0) && parseFloat(f.total_due || 0) > 0)
      );
      const isAdvancePaid = allFamily.every(f => f.is_advance_paid);
      const advancePaidDate = allFamily.find(f => f.advance_paid_date)?.advance_paid_date || null;
      const sharedReceipt = allFamily.find(f => f.receipt_number)?.receipt_number || inv.receipt_number;
      const sharedPaidAt = allFamily.find(f => f.paid_at)?.paid_at || inv.paid_at || null;

      groups.push({
        type: 'family',
        id: `family-${inv.period_year}-${inv.period_month}`,
        period_month: inv.period_month,
        period_year: inv.period_year,
        receipt_number: sharedReceipt,
        paid_at: sharedPaidAt,
        isPaid: isFamilyPaid,
        isAdvancePaid,
        advancePaidDate,
        totalDue: totalDueFamily,
        totalPaid: totalPaidFamily,
        invoices: allFamily,
        primaryInvoice: inv
      });
    } else {
      processedIds.add(inv.id);
      const invDue = parseFloat(inv.amount_due ?? inv.total_due ?? inv.amount ?? 0) || 0;
      const invPaid = parseFloat(inv.amount_paid || 0) || 0;
      const isPaid = inv.status === 'paid' || invDue === 0 || (invPaid >= invDue && invDue > 0);

      groups.push({
        type: 'single',
        id: inv.id,
        period_month: inv.period_month,
        period_year: inv.period_year,
        receipt_number: inv.receipt_number,
        paid_at: inv.paid_at || null,
        isPaid,
        isAdvancePaid: inv.is_advance_paid,
        advancePaidDate: inv.advance_paid_date || null,
        totalDue: invDue,
        totalPaid: invPaid,
        invoices: [inv],
        primaryInvoice: inv
      });
    }
  });

  // Calcul du solde restant dû réel échu (mois antérieurs et mois courant uniquement)
  const totalRemainingDue = visibleInvoices.reduce((sum, inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return sum;
    const due = parseFloat(inv.amount_due ?? inv.total_due ?? inv.amount ?? 0) || 0;
    const paid = parseFloat(inv.amount_paid || 0) || 0;
    return sum + Math.max(0, due - paid);
  }, 0);

  // Classification et ordonnancement méthodique :
  // 1. Dettes réelles échues (mois antérieurs impayés ou mois courant non soldé)
  const dueArrearsGroups = groups.filter(g => !g.isPaid);

  // 2. Point courant : Mois en cours (si déjà intégralement soldé, affiché fièrement en vedette !)
  const currentPaidGroups = groups.filter(g => g.isPaid && isCurrentPeriod(g.period_month, g.period_year));

  // 3. Historique des mois passés déjà soldés
  const pastPaidGroups = groups.filter(g => g.isPaid && !isCurrentPeriod(g.period_month, g.period_year));
  const olderPaidCount = Math.max(0, pastPaidGroups.length - 3);
  const visiblePastPaidGroups = showAllHistory ? pastPaidGroups : pastPaidGroups.slice(0, 3);

  // Affichage : Dettes réelles -> Point courant -> Historique
  const displayedGroups = [
    ...dueArrearsGroups,
    ...currentPaidGroups,
    ...visiblePastPaidGroups
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
          {isRTL ? 'جاري تحميل الاشتراكات...' : 'Chargement de vos cotisations...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'} ${isMobile ? 'pb-28' : 'pb-10'}`}>
      {/* Header Sticky Mobile */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 shadow-xs pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {isRTL ? 'الاشتراكات والوصولات' : 'Mes Cotisations & Reçus'}
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isRTL ? 'متابعة الدفعات والوصولات الرسمية' : 'Suivi des mensualités et reçus officiels'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadInvoices(true)}
            disabled={refreshing}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isRTL ? 'تحديث' : 'Actualiser'}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Synthèse rapide */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-xs">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">
              {isRTL ? 'مجموع الاشتراكات' : 'Total cotisations'}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {groups.length} <span className="text-xs text-gray-400 font-normal">{isRTL ? 'أشهر' : 'mois'}</span>
            </span>
          </div>

          <div className={`p-3 rounded-xl border shadow-xs ${
            totalRemainingDue > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
          }`}>
            <span className={`text-[11px] block font-medium ${
              totalRemainingDue > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {isRTL ? 'الحالة الحالية' : 'Situation du compte'}
            </span>
            <span className={`text-lg font-bold nowrap-dt whitespace-nowrap shrink-0 block mt-0.5 ${
              totalRemainingDue > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {totalRemainingDue > 0 ? `${totalRemainingDue.toFixed(0)} DT` : (isRTL ? '✓ خالص' : '✓ À jour')}
            </span>
          </div>
        </div>

        {/* Bannière Avoir disponible */}
        {creditBalance > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between shadow-xs gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                💳
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  {isRTL ? 'رصيد متاح على حساب العائلة' : 'Avoir disponible sur votre compte famille'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                  {isRTL ? 'سيتم خصم هذا المبلغ تلقائياً من الفاتورة القادمة' : 'Ce montant sera automatiquement déduit de votre prochaine cotisation'}
                </p>
              </div>
            </div>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 nowrap-dt whitespace-nowrap shrink-0">
              +{creditBalance.toFixed(0)} DT
            </span>
          </div>
        )}

        {/* Bannière Reste à payer */}
        {totalRemainingDue > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between shadow-xs gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ⏳
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
                  {isRTL ? 'المبلغ المتبقي للخلاص' : 'Reste à payer sur votre compte famille'}
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 truncate">
                  {isRTL ? 'المبلغ المستحق للدفع نقداً بمقر الروضة' : 'Montant restant dû à régler en espèces à l\'accueil de la crèche'}
                </p>
              </div>
            </div>
            <span className="text-base font-extrabold text-rose-700 dark:text-rose-300 nowrap-dt whitespace-nowrap shrink-0">
              {totalRemainingDue.toFixed(0)} DT
            </span>
          </div>
        )}

        {/* Bouton d'accès direct à l'Historique des Règlements Réels */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between shadow-xs gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                {isRTL ? 'سجل مدفوعاتي والوصولات' : 'Historique de mes versements'}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                {isRTL ? 'تواريخ ومبالغ الدفعات الفعلية مع الوصولات الرسمية PDF' : 'Consulter vos paiements réels et télécharger vos reçus PDF'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPaymentsModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>{isRTL ? 'عرض السجل' : 'Consulter'}</span>
            <span className="text-[10px]">→</span>
          </button>
        </div>

        {/* Liste des cotisations */}
        {displayedGroups.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isRTL ? 'لا توجد اشتراكات مسجلة حالياً' : 'Aucune cotisation enregistrée pour le moment'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isRTL ? 'سيتم إشعاركم فور إصدار معلوم الشهر القادم' : 'Vos prochaines mensualités et reçus s\'afficheront ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedGroups.map((group) => {
              const isFamily = group.type === 'family' || group.invoices.length > 1;
              const isFutureGroup = isFuturePeriod(group.period_month, group.period_year);
              const isCurrentGroup = isCurrentPeriod(group.period_month, group.period_year);
              const remainingDue = Math.max(0, group.totalDue - group.totalPaid);
              const groupArrears = group.invoices.reduce((sum, inv) => sum + (parseFloat(inv.previous_arrears || 0) || 0), 0);
              const groupDiscount = group.invoices.reduce((sum, inv) => sum + (parseFloat(inv.discount_amount || 0) || 0), 0);

              return (
                <div
                  key={group.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-xs overflow-hidden ${
                    isCurrentGroup
                      ? 'border-emerald-300 dark:border-emerald-700/80 bg-white dark:bg-gray-800/95 ring-1 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90'
                  }`}
                >
                  {/* En-tête de la carte */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                          {isFamily 
                            ? (isRTL ? 'اشتراك العائلة (إخوة)' : 'Cotisation Famille (Fratrie)') 
                            : (isRTL ? 'اشتراك شهري' : 'Cotisation Mensuelle')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isFamily 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}>
                          {isFamily 
                            ? `👨‍👩‍👧‍👦 ${group.invoices.length} ${isRTL ? 'أطفال' : 'enfants'}` 
                            : `👤 1 ${isRTL ? 'طفل' : 'enfant'}`}
                        </span>
                        {isCurrentGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider shadow-2xs">
                            {isRTL ? 'الشهر الحالي' : 'Point courant'}
                          </span>
                        )}
                        {isFutureGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                            {isRTL ? 'شهر قادم' : 'Mois futur'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>
                          {isRTL ? 'شهر' : 'Mois'} {group.period_month}/{group.period_year}
                        </span>
                        {group.receipt_number && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              N° Reçu: {group.receipt_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {groupArrears > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-700 inline-flex items-center whitespace-nowrap nowrap-dt shrink-0">
                          {isRTL ? `متخلدات : +${groupArrears.toFixed(0)} د.ت` : `Arriéré : +${groupArrears.toFixed(0)} DT`}
                        </span>
                      )}
                      {groupDiscount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 inline-flex items-center whitespace-nowrap nowrap-dt shrink-0">
                          {isRTL ? `تخفيض : -${groupDiscount.toFixed(0)} د.ت` : `Remise : -${groupDiscount.toFixed(0)} DT`}
                        </span>
                      )}
                      {isFutureGroup && (group.totalPaid > 0 || group.isAdvancePaid) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-700 whitespace-nowrap nowrap-dt shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          {isRTL ? 'تسبيق مسبق' : '✓ Règlement anticipé'} ({group.totalPaid.toFixed(0)}/{group.totalDue.toFixed(0)}&nbsp;DT)
                        </span>
                      ) : isFutureGroup && group.totalPaid === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 whitespace-nowrap nowrap-dt shrink-0">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {isRTL ? 'استحقاق قادم' : 'Échéance à venir'}
                        </span>
                      ) : group.isAdvancePaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-700 whitespace-nowrap nowrap-dt shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          {isRTL ? 'خالص مسبقاً' : '✓ Soldé par anticipation'}
                        </span>
                      ) : group.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 whitespace-nowrap nowrap-dt shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isRTL ? 'مدفوع بالكامل' : 'Payé'}
                        </span>
                      ) : group.totalPaid > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 whitespace-nowrap nowrap-dt shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {isRTL ? 'دفع جزئي' : 'Partiel'} ({group.totalPaid.toFixed(0)}/{group.totalDue.toFixed(0)}&nbsp;DT)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 whitespace-nowrap nowrap-dt shrink-0">
                          <Wallet className="w-3.5 h-3.5" />
                          {isRTL ? 'في انتظار الدفع' : 'À régler'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Liste détaillée des enfants */}
                  <div className="space-y-2 py-2.5 border-y border-gray-200/60 dark:border-gray-700 text-xs">
                    {group.invoices.map((item) => {
                      const itemDue = parseFloat(item.amount_due ?? item.total_due ?? item.amount ?? 0) || 0;
                      const itemPaid = parseFloat(item.amount_paid || 0) || 0;
                      const itemArrears = parseFloat(item.previous_arrears || 0) || 0;
                      const itemInsurance = parseFloat(item.insurance_price || 0) || 0;
                      const itemBase = parseFloat(item.base_price || 0) || (itemDue - itemArrears - itemInsurance);
                      const isItemPaid = item.status === 'paid' || (itemPaid >= itemDue && itemDue > 0);
                      const isItemPartial = !isItemPaid && itemPaid > 0;

                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-gray-700 dark:text-gray-300">
                            <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                              • <strong className="text-gray-900 dark:text-white">{item.child_first_name} {item.child_last_name}</strong>
                              <span className="text-gray-500 dark:text-gray-400 text-[11px] whitespace-nowrap">
                                ({item.care_schedule === 'half_day' ? (isRTL ? '🌤️ نصف يوم' : '🌤️ Demi-journée') : (isRTL ? '☀️ يوم كامل' : '☀️ Journée complète')})
                              </span>
                              {isFutureGroup && itemPaid > 0 ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-700 whitespace-nowrap nowrap-dt shrink-0">
                                  ✓ {isRTL ? 'تسبيق' : 'Règlement anticipé'} ({itemPaid.toFixed(0)}/{itemDue.toFixed(0)} DT)
                                </span>
                              ) : item.is_advance_paid ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-700 whitespace-nowrap nowrap-dt shrink-0">
                                  ✓ {isRTL ? 'خالص مسبقاً' : 'Soldé par anticipation'}
                                </span>
                              ) : isItemPaid ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium whitespace-nowrap nowrap-dt shrink-0">
                                  ✓ {isRTL ? 'خالص' : 'Réglé'}
                                </span>
                              ) : isItemPartial ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium whitespace-nowrap nowrap-dt shrink-0">
                                  {isRTL ? 'دفع جزئي' : 'Partiel'} ({itemPaid.toFixed(0)}/{itemDue.toFixed(0)}&nbsp;DT)
                                </span>
                              ) : isFutureGroup ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-medium whitespace-nowrap nowrap-dt shrink-0">
                                  {isRTL ? 'استحقاق قادم' : 'À venir'}
                                </span>
                              ) : null}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white nowrap-dt whitespace-nowrap shrink-0 ml-2">
                              {itemDue.toFixed(0)}&nbsp;DT
                            </span>
                          </div>

                          {/* Explication transparente si arriéré reporté */}
                          {itemArrears > 0 && (
                            <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 rounded px-2 py-0.5 flex items-center justify-between gap-2">
                              <span className="min-w-0">
                                ↳ {isRTL 
                                  ? `معلوم الشهر (${itemBase.toFixed(0)} د.ت) + متخلدات من شهر سابق:` 
                                  : `Forfait mensuel (${itemBase.toFixed(0)} DT) + report arriéré antérieur :`}
                              </span>
                              <span className="font-bold nowrap-dt whitespace-nowrap shrink-0 ml-2">+{itemArrears.toFixed(0)}&nbsp;DT</span>
                            </div>
                          )}

                          {/* Explication si assurance annuelle incluse */}
                          {itemInsurance > 0 && itemDue > 0 && (
                            <div className="text-[11px] text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 rounded px-2 py-0.5 flex items-center justify-between gap-2">
                              <span className="min-w-0">
                                ↳ {isRTL ? 'يشمل معلوماً سنوياً للتأمين :' : 'Dont assurance scolaire annuelle :'}
                              </span>
                              <span className="font-bold nowrap-dt whitespace-nowrap shrink-0 ml-2">+{itemInsurance.toFixed(0)}&nbsp;DT</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bas de carte (Section dédiée stylisée anti-débordement) */}
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/60 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const now = new Date();
                        const isFuturePeriod = (group.period_year > now.getFullYear()) || (group.period_year === now.getFullYear() && group.period_month > (now.getMonth() + 1));
                        const hasReceipt = group.receipt_number || group.isPaid || group.totalPaid > 0;

                        if (isFuturePeriod && hasReceipt) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                              <span>
                                {isRTL 
                                  ? `خالص مسبقاً • الوصل متاح يوم 01/${String(group.period_month).padStart(2, '0')}/${group.period_year}`
                                  : `Réglé d'avance • Quittance disponible le 01/${String(group.period_month).padStart(2, '0')}/${group.period_year}`}
                              </span>
                            </span>
                          );
                        }

                        if (hasReceipt) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(group.primaryInvoice)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                              title={isRTL ? (isFamily ? 'معاينة وتنزيل الوصل العائلي الموحد' : 'معاينة وتنزيل وصل الخلاص الرسمي بصيغة PDF') : 'Consulter et télécharger le reçu officiel en PDF'}
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{isRTL ? (isFamily ? 'وصل الخلاص العائلي PDF' : 'وصل الخلاص PDF') : 'Consulter le reçu PDF'}</span>
                            </button>
                          );
                        }

                        return (
                          <span className="text-gray-500 dark:text-gray-400 font-medium">
                            {isRTL ? 'الدفع نقداً في مقر الروضة' : 'Paiement en espèces à la crèche'}
                          </span>
                        );
                      })()}
                      {group.paid_at && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          • {isRTL ? 'بتاريخ' : 'Le'} {new Date(group.paid_at).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white sm:text-right shrink-0 min-w-fit">
                      <div className="flex items-center sm:justify-end gap-1.5 whitespace-nowrap nowrap-dt">
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 mr-1">{isRTL ? 'المجموع :' : 'Total :'}</span>
                        <span className="nowrap-dt whitespace-nowrap shrink-0 font-bold">{group.totalDue.toFixed(0)}&nbsp;<span className="text-xs text-gray-400 font-normal">DT</span></span>
                      </div>
                      {group.totalPaid > 0 && !group.isPaid ? (
                        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 break-words">
                          {isRTL 
                            ? `(تم دفع: ${group.totalPaid.toFixed(0)} د.ت • المتبقي: ${remainingDue.toFixed(0)} د.ت)` 
                            : `(Payé : ${group.totalPaid.toFixed(0)} DT • Reste dû : ${remainingDue.toFixed(0)} DT)`}
                        </div>
                      ) : null}
                      {group.isPaid && (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap nowrap-dt">
                          {isRTL ? '✓ تم الخلاص بالكامل' : '✓ Intégralement réglé'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bouton dépliable pour les mois précédents */}
            {olderPaidCount > 0 && (
              <div className="pt-2 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors shadow-xs cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {showAllHistory
                      ? (isRTL ? 'إخفاء الأرشيف القديم' : 'Masquer l\'historique des mois précédents')
                      : (isRTL 
                          ? `عرض الأرشيف للأشهر السابقة (${olderPaidCount})` 
                          : `Voir l'historique des mois précédents (${olderPaidCount})`)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modale Historique des Règlements Réels */}
      <PaymentsHistoryModal
        isOpen={showPaymentsModal}
        onClose={() => setShowPaymentsModal(false)}
      />

      {/* Navigation mobile */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default ParentBillingPage;

