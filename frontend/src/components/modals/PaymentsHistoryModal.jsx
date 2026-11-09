/**
 * PaymentsHistoryModal - Modale affichant l'historique chronologique des règlements réels d'un parent
 * Affiche dates, montants réels versés, modes de paiement, enfants/périodes couverts et boutons reçus PDF.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Receipt,
  FileText,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowDownCircle,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const PaymentsHistoryModal = ({ isOpen, onClose }) => {
  const { isRTL } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPayments();
    }
  }, [isOpen]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/billing/my-payments');
      if (res.data?.success) {
        setPayments(res.data.payments || []);
      } else {
        setError(res.data?.error || 'Erreur lors du chargement des règlements');
      }
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (payment) => {
    try {
      setDownloadingId(payment.receipt_number);
      const invId = payment.primary_invoice_id || payment.invoice_ids?.[0];
      if (!invId) return;

      const res = await api.get(`/api/billing/invoices/${invId}/receipt`, {
        responseType: 'blob'
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Erreur ouverture reçu:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return isRTL ? 'تاريخ غير محدد' : 'Date non spécifiée';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalPaidSum = payments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden ${
          isRTL ? 'rtl' : 'ltr'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {isRTL ? 'سجل المدفوعات والوصولات' : 'Historique de mes versements'}
              </h2>
              <p className="text-[11px] text-white/80">
                {isRTL ? 'جميع الدفعات المسددة نقداً وموثقة بوصولات رسمية' : 'Suivi chronologique des paiements réels enregistrés'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sommaire des versements */}
        <div className="px-4 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
            <span>{isRTL ? 'مجموع المدفوعات المسجلة :' : 'Total versé enregistré :'}</span>
          </div>
          <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm whitespace-nowrap nowrap-dt">
            +{totalPaidSum.toFixed(0)}&nbsp;DT
          </span>
        </div>

        {/* Corps défilable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <LoadingSpinner />
              <p className="text-xs mt-3 font-medium">
                {isRTL ? 'جاري تحميل سجل المدفوعات...' : 'Chargement de vos versements...'}
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {isRTL ? 'لا توجد دفعات مسجلة حتى الآن' : 'Aucun versement enregistré'}
              </p>
              <p className="text-xs mt-1">
                {isRTL ? 'سيظهر هنا كل وصل استخلاص يتم تسليمه لكم في الروضة' : 'Chaque règlement en espèces à l\'accueil génère un reçu officiel ici'}
              </p>
            </div>
          ) : (
            payments.map((p, idx) => (
              <div
                key={p.receipt_number || idx}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                        {p.receipt_number}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {p.payment_method || 'Espèces'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(p.paid_at)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap nowrap-dt">
                      +{parseFloat(p.total_amount).toFixed(0)}&nbsp;<span className="text-xs font-normal">DT</span>
                    </span>
                  </div>
                </div>

                {/* Détails : Enfants et Périodes couvertes */}
                <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-750/50 rounded-lg p-2 space-y-1">
                  {p.children_names && p.children_names.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-normal">{isRTL ? 'الأطفال :' : 'Enfants :'}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {p.children_names.join(', ')}
                      </span>
                    </div>
                  )}
                  {p.periods && p.periods.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-normal">{isRTL ? 'الفترات المغطاة :' : 'Mois couverts :'}</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-300">
                        {p.periods.map(pr => `Mois ${pr}`).join(' • ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bouton Téléchargement Reçu */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(p)}
                    disabled={downloadingId === p.receipt_number}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {downloadingId === p.receipt_number
                        ? (isRTL ? 'جاري التحميل...' : 'Téléchargement...')
                        : (isRTL ? 'تحميل الوصل PDF' : 'Consulter le reçu PDF')}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>
            {isRTL ? `المجموع : ${payments.length} دفعات` : `Total : ${payments.length} versement(s)`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold transition-colors cursor-pointer"
          >
            {isRTL ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentsHistoryModal;

