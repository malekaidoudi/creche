import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Bot, User, X, Send, Search,
  ChevronDown, BookOpen, HelpCircle,
  Compass, Bookmark, Check, Copy,
  ShieldCheck, Clock, ArrowRight,
  Building2, Users, PhoneCall,
  Sunrise, Sun, Sunset, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  helpData,
  chatBotResponses,
  glossaryData,
  workflowData,
  getContextualHelp,
  getTimeAwareSuggestion,
  getProactiveAdvice
} from './HelpData';
import { filterValidActions, resolveValidRoute } from '../../utils/routeValidator';

/**
 * Détection précise des caractères arabes dans un texte
 * Couvre tous les blocs Unicode de l'arabe standard et étendu
 */
const isArabicText = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

/**
 * Formateur dynamique pour les messages du chat :
 * - Rendu natif du markdown : **gras** et *italique*
 * - Rendu élégant des listes à puces (•, -, *)
 * - Nettoyage des astérisques résiduels non fermés
 * - Alignement bidirectionnel fluide (RTL / LTR) basé sur la langue réelle du contenu
 */
const renderFormattedMessage = (rawText, isMsgArabic) => {
  if (!rawText) return null;
  const lines = String(rawText).split('\n');

  return (
    <div
      dir={isMsgArabic ? 'rtl' : 'ltr'}
      className={`space-y-1.5 ${isMsgArabic ? 'text-right font-sans' : 'text-left'}`}
    >
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`empty-${lineIdx}`} className="h-1.5" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.startsWith('**'));
        const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line;

        // Parse inline bold (**bold**) and italic (*italic*)
        const elements = [];
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        let lastIndex = 0;
        let match;
        let elemIdx = 0;

        while ((match = regex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            const textPart = content.substring(lastIndex, match.index).replace(/\*\*/g, '');
            if (textPart) {
              elements.push(<span key={`txt-${elemIdx++}`}>{textPart}</span>);
            }
          }
          const token = match[0];
          if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
            elements.push(
              <strong key={`bold-${elemIdx++}`} className="font-bold underline-offset-2">
                {token.slice(2, -2)}
              </strong>
            );
          } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
            elements.push(
              <em key={`italic-${elemIdx++}`} className="italic">
                {token.slice(1, -1)}
              </em>
            );
          }
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < content.length) {
          const tailPart = content.substring(lastIndex).replace(/\*\*/g, '');
          if (tailPart) {
            elements.push(<span key={`txt-${elemIdx++}`}>{tailPart}</span>);
          }
        }

        const renderedLineContent = elements.length > 0 ? elements : content.replace(/\*\*/g, '');

        if (isBullet) {
          return (
            <div
              key={`line-${lineIdx}`}
              className="flex items-start gap-2 my-0.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <span className="flex-1 leading-relaxed">{renderedLineContent}</span>
            </div>
          );
        }

        return (
          <div key={`line-${lineIdx}`} className="leading-relaxed">
            {renderedLineContent}
          </div>
        );
      })}
    </div>
  );
};

const HelpSystem = () => {
  const { isRTL, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // Contextual Help based on active route and role
  const contextualInfo = useMemo(() => {
    return getContextualHelp(location?.pathname || '', user?.role, language);
  }, [location?.pathname, user?.role, language]);

  // Time-Aware Help Engine (Matin, Midi, Soir)
  const timeSuggestion = useMemo(() => {
    return getTimeAwareSuggestion(user?.role, language);
  }, [user?.role, language]);

  // Event-Driven Proactive Assistance (403, 401, Form Hesitation)
  const [proactiveNotice, setProactiveNotice] = useState(null);
  const [hasProactiveGlow, setHasProactiveGlow] = useState(false);
  const formHesitationTimerRef = useRef(null);
  const seenHesitationPagesRef = useRef(new Set());

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Role & Guide state
  const [selectedRole, setSelectedRole] = useState(() => {
    if (user?.role === 'admin' || user?.role === 'developer') return 'admin';
    if (user?.role === 'staff') return 'staff';
    if (user?.role === 'parent') return 'parent';
    return 'visitor';
  });
  const [expandedGuideSection, setExpandedGuideSection] = useState(null);

  // FAQ state
  const [faqCategory, setFaqCategory] = useState(() => contextualInfo.recommendedFaqCategory || 'all');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Glossary state
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  // Workflow state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(() => contextualInfo.recommendedWorkflowId || 'wf-enrollment');

  // First time banner / badge state
  const [hasOpenedBefore, setHasOpenedBefore] = useState(() => {
    try {
      return localStorage.getItem('helpSystemOpened') === 'true';
    } catch {
      return false;
    }
  });

  const chatEndRef = useRef(null);

  // Synchronize active language data
  const data = useLanguageData(language);
  const responses = chatBotResponses[language] || chatBotResponses.fr;
  const currentGlossary = glossaryData[language] || glossaryData.fr;
  const currentWorkflows = workflowData[language] || workflowData.fr;

  // Sync role when user changes
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'developer') {
      setSelectedRole('admin');
    } else if (user?.role === 'staff') {
      setSelectedRole('staff');
    } else if (user?.role === 'parent') {
      setSelectedRole('parent');
    } else {
      setSelectedRole('visitor');
    }
  }, [user]);

  // Sync contextual defaults on route change
  useEffect(() => {
    if (contextualInfo.recommendedWorkflowId) {
      setSelectedWorkflowId(contextualInfo.recommendedWorkflowId);
    }
    if (contextualInfo.recommendedFaqCategory && faqCategory === 'all') {
      setFaqCategory(contextualInfo.recommendedFaqCategory);
    }
  }, [location?.pathname, contextualInfo]);

  // Initial welcome message in chat contextualized by page and role
  useEffect(() => {
    setChatMessages([
      {
        id: `msg-welcome-${location?.pathname || 'default'}`,
        type: 'bot',
        text: contextualInfo.welcomeMessage || data.chat.welcome,
        time: new Date()
      }
    ]);
  }, [location?.pathname, language, contextualInfo.welcomeMessage]);

  // Auto-scroll chat on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, activeTab]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 1. Écouteur d'Assistance Proactive (Erreurs 403 / 401 déclenchées par l'API)
  useEffect(() => {
    const handleProactiveEvent = (e) => {
      const detail = e.detail || {};
      const advice = getProactiveAdvice(detail.type, detail, language);
      if (advice) {
        setProactiveNotice(advice);
        setHasProactiveGlow(true);
        setTimeout(() => setHasProactiveGlow(false), 7000);
      }
    };

    window.addEventListener('creche:proactive-help', handleProactiveEvent);
    return () => window.removeEventListener('creche:proactive-help', handleProactiveEvent);
  }, [language]);

  // 2. Détection d'Hésitation sur les formulaires critiques (45 secondes)
  useEffect(() => {
    const path = (location?.pathname || '').toLowerCase();
    const formPaths = [
      '/inscription',
      '/upload-documents',
      '/create-password',
      '/mon-espace/medical',
      '/mon-espace/treatments',
      '/mon-espace/absence-request',
      '/dashboard/children/add',
      '/absences'
    ];

    const isFormPage = formPaths.some((p) => path.includes(p));

    if (formHesitationTimerRef.current) {
      clearTimeout(formHesitationTimerRef.current);
    }

    if (isFormPage && !isOpen && !seenHesitationPagesRef.current.has(path)) {
      formHesitationTimerRef.current = setTimeout(() => {
        if (!isOpen) {
          const advice = getProactiveAdvice('form_hesitation', { pathname: path }, language);
          if (advice) {
            seenHesitationPagesRef.current.add(path);
            setProactiveNotice(advice);
            setHasProactiveGlow(true);
            setTimeout(() => setHasProactiveGlow(false), 7000);
          }
        }
      }, 45000);
    }

    return () => {
      if (formHesitationTimerRef.current) {
        clearTimeout(formHesitationTimerRef.current);
      }
    };
  }, [location?.pathname, isOpen, language]);

  // 3. Auto-fermeture de la bulle proactive après 25 secondes si ignorée
  useEffect(() => {
    if (proactiveNotice) {
      const timer = setTimeout(() => {
        setProactiveNotice(null);
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [proactiveNotice]);

  // Fermer la notification proactive si l'utilisateur ouvre le centre d'aide
  useEffect(() => {
    if (isOpen) {
      setProactiveNotice(null);
      setHasProactiveGlow(false);
    }
  }, [isOpen]);

  const handleAcceptProactive = (notice) => {
    setProactiveNotice(null);
    setHasProactiveGlow(false);
    setIsOpen(true);
    setActiveTab(notice.targetTab || 'chat');
    if (notice.suggestedQuestion) {
      setTimeout(() => {
        handleQuickQuestion(notice.suggestedQuestion);
      }, 150);
    }
  };

  const handleOpenCenter = () => {
    if (!hasOpenedBefore) {
      try {
        localStorage.setItem('helpSystemOpened', 'true');
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }
      setHasOpenedBefore(true);
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (customMessage = null) => {
    const rawText = typeof customMessage === 'string' ? customMessage : chatInput;
    if (!rawText || !rawText.trim() || isTyping) return;

    const userText = rawText.trim();
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: userText,
      time: new Date()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      // 1. Appel en temps réel à l'Assistant IA Gemini
      const isInputArabic = isArabicText(userText);
      const queryLanguage = isInputArabic ? 'ar' : (language === 'ar' ? 'ar' : 'fr');

      const response = await api.post('/api/ai/chat', {
        message: userText,
        role: user?.role,
        pathname: location?.pathname,
        language: queryLanguage
      });

      if (response.data && response.data.success && response.data.answer) {
        const validatedActions = filterValidActions(response.data.suggestedActions, user?.role);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: response.data.answer,
            suggestedActions: validatedActions,
            suggestedFollowUps: response.data.suggestedFollowUps || [],
            source: 'gemini',
            time: new Date()
          }
        ]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('API IA non disponible, basculement vers moteur local:', err?.message || err);
    }

    // 2. Fallback de secours : moteur de règles local certifié
    const lowerInput = userText.toLowerCase();
    const isArabicScript = isArabicText(userText);
    const activeResponses = isArabicScript
      ? [...(chatBotResponses.ar || []), ...(chatBotResponses.fr || [])]
      : (language === 'ar' ? [...(chatBotResponses.ar || []), ...(chatBotResponses.fr || [])] : [...(chatBotResponses.fr || []), ...(chatBotResponses.ar || [])]);

    let matchedItem = null;

    for (const item of activeResponses) {
      if (item.keywords.some((k) => lowerInput.includes(k.toLowerCase()))) {
        matchedItem = item;
        break;
      }
    }

    const defaultNoAnswer = (isArabicScript || language === 'ar')
      ? (helpData.ar?.chat?.noAnswer || data.chat.noAnswer)
      : data.chat.noAnswer;

    const botText = matchedItem ? matchedItem.answer : defaultNoAnswer;
    const actions = filterValidActions(matchedItem?.actions || [], user?.role);
    const followUps = matchedItem?.followUps || [];

    setChatMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: botText,
        suggestedActions: actions,
        suggestedFollowUps: followUps,
        source: 'local',
        time: new Date()
      }
    ]);
    setIsTyping(false);
  };

  const handleQuickQuestion = (question) => {
    if (!question || isTyping) return;
    setChatInput('');
    handleSendMessage(question);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered FAQ items
  const filteredFaq = useMemo(() => {
    return data.faq.items.filter((item) => {
      const matchesCat = faqCategory === 'all' || item.category === faqCategory;
      const qLower = item.question.toLowerCase();
      const aLower = item.answer.toLowerCase();
      const sLower = faqSearch.toLowerCase().trim();
      const matchesSearch = !sLower || qLower.includes(sLower) || aLower.includes(sLower);
      return matchesCat && matchesSearch;
    });
  }, [data.faq.items, faqCategory, faqSearch]);

  // Filtered Glossary terms
  const glossaryCategories = useMemo(() => {
    const setCats = new Set(currentGlossary.map((g) => g.category));
    return ['all', ...Array.from(setCats)];
  }, [currentGlossary]);

  const filteredGlossary = useMemo(() => {
    return currentGlossary.filter((item) => {
      const matchesCat = glossaryCategory === 'all' || item.category === glossaryCategory;
      const tLower = item.term.toLowerCase();
      const dLower = item.definition.toLowerCase();
      const sLower = glossarySearch.toLowerCase().trim();
      const matchesSearch = !sLower || tLower.includes(sLower) || dLower.includes(sLower);
      return matchesCat && matchesSearch;
    });
  }, [currentGlossary, glossaryCategory, glossarySearch]);

  // Selected Workflow
  const currentWorkflow = useMemo(() => {
    return currentWorkflows.find((w) => w.id === selectedWorkflowId) || currentWorkflows[0];
  }, [currentWorkflows, selectedWorkflowId]);

  // Tabs configuration
  const tabs = [
    { key: 'chat', label: data.tabs.chat, icon: Bot },
    { key: 'guide', label: data.tabs.guide, icon: BookOpen },
    { key: 'faq', label: data.tabs.faq, icon: HelpCircle },
    { key: 'glossary', label: data.tabs.glossary, icon: Bookmark },
    { key: 'workflows', label: data.tabs.workflows, icon: Compass }
  ];

  // User role label badge (Discret: developer affiche Direction / Administrateur)
  const currentUserRoleBadge = useMemo(() => {
    if (!user) return data.roleBadge.visitor;
    if (user.role === 'admin' || user.role === 'developer') return data.roleBadge.admin;
    if (user.role === 'staff') return data.roleBadge.staff;
    return data.roleBadge.parent;
  }, [user, data]);

  return (
    <>
      {/* ======================================================== */}
      {/* FLOATING ACTION TRIGGER - Intelligent, Modern & Elegant   */}
      {/* ======================================================== */}
      {/* FLOATING ACTION LAUNCHER (Trigger Pill / Button)         */}
      {/* ======================================================== */}
      <div
        className={`fixed z-40 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 ${isRTL ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
          } ${isOpen ? 'hidden sm:block' : 'block'}`}
      >
        {/* Subtle breathing ambient glow (Cyan Diamant & Verre Saphir) */}
        {!isOpen && (
          <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-cyan-500/35 via-sky-500/30 to-blue-600/35 blur-lg animate-pulse pointer-events-none" />
        )}

        {/* First time badge indicator */}
        {!hasOpenedBefore && !isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -top-1.5 ${isRTL ? '-left-1.5' : '-right-1.5'} z-20 flex items-center justify-center`}
          >
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-white dark:border-slate-950"></span>
            </span>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* FLOATING PROACTIVE SPEECH BUBBLE (Event-Driven: 403, 401, Form Hesitation) */}
        {/* ======================================================== */}
        <AnimatePresence>
          {proactiveNotice && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className={`fixed bottom-20 sm:bottom-24 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm p-3.5 sm:p-4 rounded-2xl shadow-2xl border
                ${isRTL ? 'left-3 sm:left-6' : 'right-3 sm:right-6'}
                ${proactiveNotice.type === 'permission_denied'
                  ? 'bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950 text-white border-amber-500/50 shadow-amber-950/40 ring-1 ring-amber-400/30'
                  : 'bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 text-white border-cyan-500/50 shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                } backdrop-blur-md`}
            >
              {/* Header with icon and close button */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-xl flex items-center justify-center ${proactiveNotice.type === 'permission_denied'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      }`}
                  >
                    {proactiveNotice.type === 'permission_denied' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    {proactiveNotice.title}
                  </h4>
                </div>

                <button
                  onClick={() => setProactiveNotice(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message Body */}
              <p className="text-xs text-gray-200 mt-2.5 leading-relaxed font-normal">
                {proactiveNotice.message}
              </p>

              {/* Action button */}
              <div className="mt-3.5 pt-2.5 border-white/10 border-t flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400">
                  {isRTL ? 'مساعد الروضة الذكي' : 'Assistant Mima'}
                </span>
                <button
                  onClick={() => handleAcceptProactive(proactiveNotice)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer
                    ${proactiveNotice.type === 'permission_denied'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                      : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/40'
                    }`}
                >
                  <span>{proactiveNotice.actionLabel}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Launcher Button / Pill (Modèle 3: Liquid Aura - Cyan Diamant & Verre Saphir) */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenCenter}
          aria-label={data.panelTitle}
          className={`relative group flex items-center gap-2.5 p-2 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all duration-300 select-none
            ${hasProactiveGlow ? 'ring-4 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 animate-pulse' : ''}
            ${isOpen
              ? 'bg-slate-900/95 text-white border border-cyan-500/40 shadow-cyan-950/60'
              : 'bg-gradient-to-r from-slate-950 via-cyan-950 to-blue-950 text-white border border-cyan-400/50 shadow-[0_10px_28px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_15px_35px_-5px_rgba(6,182,212,0.7)] hover:border-cyan-300'
            }`}
        >
          {/* Animated Icon Avatar (Modèle 3: Liquid Aura Morphing Blob) */}
          <div
            className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-90 bg-white/10' : 'group-hover:scale-110'
              }`}
          >
            {isOpen ? (
              <X className="w-5 h-5 text-cyan-200" />
            ) : (
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Cyan Diamant & Verre Saphir Liquid Morphing Blob */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-sky-300 to-blue-600 animate-ai-morph shadow-[0_0_12px_rgba(6,182,212,0.85)]"></div>
                {/* Specular Inner Core / Eye */}
                <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white/40 backdrop-blur-xs flex items-center justify-center animate-ai-specular">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Text Pill on desktop / tablet (hidden on small mobile screens for compact elegance) */}
          <div className="hidden sm:flex flex-col text-left rtl:text-right">
            <span className="text-xs font-bold tracking-wide flex items-center gap-1.5 text-white">
              {isOpen ? data.close : (isRTL ? 'مركز المساعدة الذكي' : "Centre d'Aide IA")}
              {!isOpen && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.9)]"></span>
              )}
            </span>
            <span className="text-[10px] text-cyan-200/90 font-medium leading-none">
              {isOpen ? 'Mima Elghalia' : (isRTL ? 'مساعد افتراضي مباشر' : 'Assistance Live')}
            </span>
          </div>
        </motion.button>
      </div>

      {/* ======================================================== */}
      {/* MAIN SLIDE-OVER HELP CENTER DRAWER                       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: isRTL ? -500 : 500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? -500 : 500, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className={`fixed inset-y-0 z-50 w-full sm:w-[480px] lg:w-[540px] max-w-full sm:max-w-[calc(100vw-2rem)]
                h-full max-h-[100dvh] h-[100dvh]
                bg-white dark:bg-gray-900 shadow-2xl flex flex-col
                ${isRTL ? 'left-0 border-r' : 'right-0 border-l'} 
                border-gray-200 dark:border-gray-800 overflow-hidden overscroll-contain`}
            >
              {/* ==================== HEADER ==================== */}
              <div className="relative px-3.5 sm:px-5 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-4 pb-3 sm:pb-3.5 bg-gradient-to-r from-slate-950 via-cyan-950 to-blue-950 text-white shadow-md border-b border-cyan-500/20 shrink-0 overflow-hidden">
                {/* Decorative background glow (Cyan & Saphir) */}
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 rounded-full bg-blue-600/15 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
                  {/* Left: Icon + Title + discreet role badge */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-md border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white truncate max-w-[160px] xs:max-w-[200px] sm:max-w-none">
                          {data.panelTitle}
                        </h2>
                        {/* Discreet compact role badge */}
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-cyan-500/15 border border-cyan-400/25 text-cyan-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {currentUserRoleBadge}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-cyan-100/70 truncate mt-0.5">
                        {data.panelSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Close button with comfortable touch target */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setIsOpen(false)}
                      aria-label={data.close}
                      className="p-1.5 sm:p-2 rounded-xl text-cyan-200/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ==================== ACTIVE PAGE CONTEXT BANNER ==================== */}
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/5 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-blue-950/20 border-b border-cyan-200/60 dark:border-cyan-800/40 flex items-center justify-between text-xs backdrop-blur-xs gap-2 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden min-w-0 flex-1">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                    {isRTL ? 'الصفحة:' : 'Page :'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-cyan-900 dark:text-cyan-200 truncate">
                    {contextualInfo.contextName}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="text-[10px] sm:text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 shrink-0 transition-colors px-1.5 py-0.5 rounded-md hover:bg-cyan-500/10"
                >
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  <span>{isRTL ? 'اقتراحات' : 'Suggestions'}</span>
                </button>
              </div>

              {/* ==================== TABS BAR ==================== */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/80 backdrop-blur-xs overflow-x-auto no-scrollbar scroll-smooth flex-nowrap shrink-0 px-1 sm:px-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 sm:flex-1 cursor-pointer
                        ${isActive
                          ? 'text-cyan-700 dark:text-cyan-300 bg-white dark:bg-gray-900 shadow-xs'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800'
                        }`}
                    >
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400'}`} />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ==================== TAB CONTENT CONTAINER ==================== */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
                {/* ---------------------------------------------------- */}
                {/* 1. CHATBOT TAB                                       */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full">
                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">
                      {chatMessages.map((msg) => {
                        const isBot = msg.type === 'bot';
                        const isMsgArabic = isArabicText(msg.text);

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2.5 sm:gap-3 ${!isBot ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {/* Avatar */}
                            {isBot ? (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-600 shadow-sm flex items-center justify-center shrink-0 ring-1 ring-cyan-400/30">
                                <img
                                  src="/images/logo.jpg"
                                  alt="Logo Crèche Mima Elghalia"
                                  className="w-full h-full object-cover rounded-[7px] sm:rounded-[10px] bg-white"
                                />
                              </div>
                            ) : (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                            )}

                            {/* Message Bubble Container */}
                            <div className="relative group max-w-[88%] sm:max-w-[82%]">
                              {isBot && (
                                <div
                                  dir={isMsgArabic ? 'rtl' : 'ltr'}
                                  className="flex items-center gap-1.5 mb-1 px-1"
                                >
                                  <span className="text-[10px] font-bold text-cyan-800 dark:text-cyan-300">
                                    {msg.source === 'gemini'
                                      ? (isMsgArabic ? 'المساعد الذكي (Gemini) ✨' : 'Assistant IA (Gemini) ✨')
                                      : (isMsgArabic ? 'مساعد الروضة (Documents) 📚' : 'Assistant Mima (Documents) 📚')}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                    {isMsgArabic ? 'معتمد' : 'Certifié'}
                                  </span>
                                </div>
                              )}

                              <div
                                dir={isMsgArabic ? 'rtl' : 'ltr'}
                                className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs border ${
                                  isMsgArabic ? 'text-right' : 'text-left'
                                } ${
                                  isBot
                                    ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200/80 dark:border-gray-700/80 rounded-tl-sm'
                                    : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white border-cyan-400/30 rounded-tr-sm shadow-md'
                                }`}
                              >
                                {renderFormattedMessage(msg.text, isMsgArabic)}

                                {/* Action Buttons - Navigation Directe */}
                                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                  <div
                                    dir={isMsgArabic ? 'rtl' : 'ltr'}
                                    className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap gap-1.5 sm:gap-2"
                                  >
                                    {msg.suggestedActions.map((act, idx) => {
                                      const isActArabic = isArabicText(act.label) || isMsgArabic;
                                      return (
                                        <button
                                          key={idx}
                                          dir={isActArabic ? 'rtl' : 'ltr'}
                                          onClick={() => {
                                            const validPath = resolveValidRoute(act.path, user?.role);
                                            if (validPath) {
                                              setIsOpen(false);
                                              navigate(validPath);
                                            }
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold
                                            bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/70 dark:to-blue-950/50 
                                            text-cyan-800 dark:text-cyan-200 border border-cyan-300/80 dark:border-cyan-700
                                            hover:from-cyan-600 hover:to-blue-600 hover:text-white dark:hover:from-cyan-600 dark:hover:to-blue-600 dark:hover:text-white
                                            transition-all duration-200 shadow-2xs hover:shadow active:scale-95 cursor-pointer max-w-full"
                                        >
                                          <span className="truncate">{act.label}</span>
                                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isActArabic ? 'rotate-180' : ''}`} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Follow-up Question Chips */}
                              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                                <div
                                  dir={isMsgArabic ? 'rtl' : 'ltr'}
                                  className="flex flex-wrap gap-1.5 mt-2 px-1"
                                >
                                  {msg.suggestedFollowUps.map((fu, idx) => {
                                    const isFuArabic = isArabicText(fu);
                                    return (
                                      <button
                                        key={idx}
                                        dir={isFuArabic ? 'rtl' : 'ltr'}
                                        onClick={() => handleQuickQuestion(fu)}
                                        className={`text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-600 
                                          dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-400 
                                          hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-50/50 transition-colors shadow-2xs cursor-pointer ${
                                            isFuArabic ? 'text-right' : 'text-left'
                                          }`}
                                      >
                                        💬 {fu}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Time & Copy action */}
                              <div
                                dir={isMsgArabic ? 'rtl' : 'ltr'}
                                className={`flex items-center gap-2 mt-1 text-[10px] text-gray-400 dark:text-gray-500 px-1 ${
                                  !isBot ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <span>
                                  {new Date(msg.time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isBot && (
                                  <button
                                    onClick={() => handleCopyText(msg.id, msg.text)}
                                    className="opacity-0 group-hover:opacity-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-opacity flex items-center gap-1 cursor-pointer"
                                    title={isMsgArabic ? 'نسخ الإجابة' : 'Copier la réponse'}
                                  >
                                    {copiedId === msg.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-cyan-500" />
                                        <span className="text-cyan-500">
                                          {isMsgArabic ? 'تم النسخ' : (data.chat?.copySuccess || 'Copié')}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>{isMsgArabic ? 'نسخ' : 'Copier'}</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Typing indicator */}
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2.5 sm:gap-3 items-end"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-600 shadow-sm flex items-center justify-center shrink-0 ring-1 ring-cyan-400/30">
                            <img
                              src="/images/logo.jpg"
                              alt="Logo Crèche Mima Elghalia"
                              className="w-full h-full object-cover rounded-[7px] sm:rounded-[10px] bg-white"
                            />
                          </div>
                          <div className="bg-white dark:bg-gray-800 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-sm border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            <span className="text-[11px] text-gray-400 ml-1.5">{data.chat.typing}</span>
                          </div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Quick Contextual Questions Chips (Scrollable horizontalement sur mobile) */}
                    {chatMessages.length <= 4 && (
                      <div className="px-3 sm:px-4 py-2 border-t border-gray-100 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] sm:text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5 truncate">
                            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                            <span className="truncate">
                              {isRTL
                                ? `اقتراحات مخصصة:`
                                : `Suggestions (${contextualInfo.contextName}) :`}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1 scroll-smooth">
                          {/* Time-Aware Priority Prompt (Matin / Midi / Soir) */}
                          {timeSuggestion && timeSuggestion.quickPrompt && (
                            <button
                              dir={isArabicText(timeSuggestion.quickPrompt) ? 'rtl' : 'ltr'}
                              onClick={() => handleQuickQuestion(timeSuggestion.quickPrompt)}
                              className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 
                                dark:from-amber-950/50 dark:to-orange-950/40 text-amber-900 dark:text-amber-200
                                border border-amber-300 dark:border-amber-700/70 hover:border-amber-500 
                                hover:text-amber-700 dark:hover:text-amber-100 transition-all shadow-2xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
                                  isArabicText(timeSuggestion.quickPrompt) ? 'text-right' : 'text-left'
                                }`}
                            >
                              {timeSuggestion.period === 'morning' && <Sunrise className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
                              {timeSuggestion.period === 'noon' && <Sun className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
                              {timeSuggestion.period === 'evening' && <Sunset className="w-3 h-3 text-orange-600 dark:text-orange-400 shrink-0" />}
                              {timeSuggestion.period === 'standard' && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
                              <span className="whitespace-nowrap">{timeSuggestion.quickPrompt}</span>
                            </button>
                          )}

                          {(contextualInfo.suggestions && contextualInfo.suggestions.length > 0
                            ? contextualInfo.suggestions
                            : data.chat.quickQuestions
                          ).map((q, i) => {
                            const isQArabic = isArabicText(q);
                            return (
                              <button
                                key={i}
                                dir={isQArabic ? 'rtl' : 'ltr'}
                                onClick={() => handleQuickQuestion(q)}
                                className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white dark:bg-gray-800 text-cyan-900 dark:text-cyan-100
                                  border border-cyan-200 dark:border-cyan-700/70 hover:border-cyan-500 hover:text-cyan-600 
                                  dark:hover:text-cyan-300 hover:bg-cyan-50/70 dark:hover:bg-cyan-950/40 transition-all shadow-2xs shrink-0 whitespace-nowrap cursor-pointer ${
                                    isQArabic ? 'text-right' : 'text-left'
                                  }`}
                              >
                                {q}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Input Area (Safe-area bottom padding) */}
                    <div className="p-2.5 sm:p-3.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3.5 shrink-0 w-full max-w-full">
                      <div className="flex items-center gap-2 w-full max-w-full">
                        <input
                          type="text"
                          dir="auto"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={data.chat.placeholder}
                          className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                            rounded-xl text-[16px] sm:text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 
                            focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all text-start"
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!chatInput.trim()}
                          aria-label={data.chat.send}
                          className="p-2 sm:p-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 
                            disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all duration-200 active:scale-95 shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                        >
                          <Send className={`w-4 h-4 ${isArabicText(chatInput) || (isRTL && !chatInput) ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 2. GUIDES PAR RÔLE TAB                               */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'guide' && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Role Filter Selector */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        {data.guide.roleFilterLabel}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { roleKey: 'parent', label: data.guide.roles.parent, icon: User },
                          { roleKey: 'staff', label: data.guide.roles.staff, icon: Users },
                          { roleKey: 'admin', label: data.guide.roles.admin, icon: Building2 },
                          { roleKey: 'visitor', label: data.guide.roles.visitor, icon: ShieldCheck }
                        ].map((r) => {
                          const Icon = r.icon;
                          const isSel = selectedRole === r.roleKey;
                          return (
                            <button
                              key={r.roleKey}
                              onClick={() => {
                                setSelectedRole(r.roleKey);
                                setExpandedGuideSection(null);
                              }}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all
                                ${isSel
                                  ? 'bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 text-white border-cyan-500 shadow-md'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-cyan-400'
                                }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-center truncate w-full">{r.label.split(' ')[0]} {r.label.split(' ')[1] || ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sections Accordion */}
                    <div className="space-y-3 pt-2">
                      {(data.guide.sectionsByRole[selectedRole] || []).map((section, idx) => {
                        const isExpanded = expandedGuideSection === section.id;
                        return (
                          <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedGuideSection(isExpanded ? null : section.id)}
                              className={`w-full p-4 flex items-center justify-between text-left rtl:text-right transition-colors
                                ${isExpanded ? 'bg-cyan-50/60 dark:bg-cyan-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100">
                                  {section.title}
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0
                                  ${isExpanded ? 'rotate-180 text-cyan-600' : ''}`}
                              />
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-900/20">
                                    {section.content}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 3. FAQ TAB                                           */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'faq' && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 
                          ${isRTL ? 'right-3' : 'left-3'}`}
                      />
                      <input
                        type="text"
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        placeholder={data.faq.searchPlaceholder}
                        className={`w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                          rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 
                          focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-sm
                          ${isRTL ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'}`}
                      />
                      {faqSearch && (
                        <button
                          onClick={() => setFaqSearch('')}
                          className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                            ${isRTL ? 'left-3' : 'right-3'}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills (Scrollable horizontalement sur petits écrans) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 scroll-smooth">
                      {Object.entries(data.faq.categories).map(([catKey, catLabel]) => {
                        const isSel = faqCategory === catKey;
                        return (
                          <button
                            key={catKey}
                            onClick={() => setFaqCategory(catKey)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer
                              ${isSel
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-400'
                              }`}
                          >
                            {catLabel}
                          </button>
                        );
                      })}
                    </div>

                    {/* Results Counter */}
                    <p className="text-[11px] text-gray-400">
                      {filteredFaq.length} {isRTL ? 'أسئلة متاحة' : 'questions trouvées'}
                    </p>

                    {/* FAQ Accordion Items */}
                    <div className="space-y-2.5">
                      {filteredFaq.map((item) => {
                        const isExpanded = expandedFaq === item.id;
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFaq(isExpanded ? null : item.id)}
                              className={`w-full p-4 flex items-start justify-between gap-3 text-left rtl:text-right transition-colors
                                ${isExpanded ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                                <span className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100">
                                  {item.question}
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 mt-0.5
                                  ${isExpanded ? 'rotate-180 text-cyan-600' : ''}`}
                              />
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-900/20">
                                    {item.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 4. GLOSSAIRE MÉTIER TAB (DOCS V2 - 08)                */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'glossary' && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Header banner */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800/60 flex items-start gap-3">
                      <Bookmark className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-cyan-900 dark:text-cyan-200">
                          {isRTL ? 'قاموس مصطلحات الروضة المعتمد' : 'Glossaire des Termes Métier'}
                        </h4>
                        <p className="text-[11px] text-cyan-700 dark:text-cyan-300/90 mt-0.5">
                          {isRTL
                            ? 'تعريفات رسمية للأدوار، الإجراءات، والصلاحيات مستخلصة من وثيقة 08_GLOSSAIRE_METIER.md'
                            : 'Définitions officielles des rôles, statuts et flux issues du référentiel documentsV2'}
                        </p>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 
                          ${isRTL ? 'right-3' : 'left-3'}`}
                      />
                      <input
                        type="text"
                        value={glossarySearch}
                        onChange={(e) => setGlossarySearch(e.target.value)}
                        placeholder={isRTL ? 'ابحث عن مصطلح...' : 'Rechercher un terme (ex: Check-in, Bilan, Parent)...'}
                        className={`w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                          rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 
                          focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-sm
                          ${isRTL ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'}`}
                      />
                    </div>

                    {/* Category Filter Pills (Scrollable horizontalement sur petits écrans) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 scroll-smooth">
                      {glossaryCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setGlossaryCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer
                            ${glossaryCategory === cat
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-400'
                            }`}
                        >
                          {cat === 'all' ? (isRTL ? 'الكل' : 'Tout') : cat}
                        </button>
                      ))}
                    </div>

                    {/* Terms Cards */}
                    <div className="space-y-3">
                      {filteredGlossary.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm space-y-2 hover:border-cyan-400 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-cyan-800 dark:text-cyan-300">
                              {item.term}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item.definition}
                          </p>
                          {item.details && (
                            <p className="text-[11px] text-cyan-700 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/30 p-2 rounded-lg border border-cyan-100 dark:border-cyan-900/40">
                              💡 {item.details}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 5. PARCOURS & FLUX TAB (DOCS V2 - 21)                 */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'workflows' && (
                  <div className="p-4 sm:p-5 space-y-5">
                    {/* Intro */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        {data.tours.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {data.tours.subtitle}
                      </p>
                    </div>

                    {/* Workflow Switcher Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {currentWorkflows.map((wf) => {
                        const isSel = selectedWorkflowId === wf.id;
                        return (
                          <button
                            key={wf.id}
                            onClick={() => setSelectedWorkflowId(wf.id)}
                            className={`p-3 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between
                              ${isSel
                                ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/30 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-sm'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-cyan-400'
                              }`}
                          >
                            <span className="text-xs font-bold leading-snug line-clamp-2">
                              {wf.title}
                            </span>
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-2 font-semibold">
                              {wf.steps.length} {data.tours.stepsCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Workflow Steps Detailed View */}
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm space-y-4">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                          {currentWorkflow.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {currentWorkflow.description}
                        </p>
                      </div>

                      {/* Steps List */}
                      <div className="space-y-4 pt-1">
                        {currentWorkflow.steps.map((st, i) => (
                          <div key={i} className="flex gap-3 items-start relative">
                            {/* Numbered node */}
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                              {st.num}
                            </div>
                            {/* Content */}
                            <div className="flex-1 pb-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0 last:pb-0">
                              <h5 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {st.title}
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                {st.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================== FOOTER (Masqué dans l'onglet Chat pour maximiser la hauteur) ==================== */}
              {activeTab !== 'chat' && (
                <div className="p-3 sm:p-3.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Crèche Mima Elghalia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/contact"
                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'اتصل بنا' : 'Contact direction'}</span>
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper hook for language data fallback
function useLanguageData(lang) {
  return helpData[lang] || helpData.fr;
}

export default HelpSystem;
