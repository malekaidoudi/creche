import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, X, MessageSquare, BookOpen,
  Map, Sparkles, Send, Bot, User,
  ChevronRight, ChevronLeft, Search,
  Zap, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { helpData, chatBotResponses } from './HelpData';

const HelpSystem = () => {
  const { isRTL, language } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [faqFilter, setFaqFilter] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [tourStep, setTourStep] = useState(0);
  const [activeTour, setActiveTour] = useState(null);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(() => {
    return localStorage.getItem('helpSystemOpened') === 'true';
  });
  const chatEndRef = useRef(null);

  const data = helpData[language] || helpData.fr;
  const responses = chatBotResponses[language] || chatBotResponses.fr;

  // Initialize chat with welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        { type: 'bot', text: data.chat.welcome, time: new Date() }
      ]);
    }
  }, [language]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg = { type: 'user', text: chatInput.trim(), time: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Find response
    setTimeout(() => {
      const lowerInput = userMsg.text.toLowerCase();
      let foundResponse = null;

      for (const item of responses) {
        if (item.keywords.some(k => lowerInput.includes(k))) {
          foundResponse = item.answer;
          break;
        }
      }

      const botResponse = foundResponse || data.chat.noAnswer;
      setChatMessages(prev => [...prev, { type: 'bot', text: botResponse, time: new Date() }]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleQuickQuestion = (question) => {
    setChatInput(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const filteredFaq = data.faq.items.filter(item => {
    const matchesCategory = faqFilter === 'all' || item.category === faqFilter;
    const searchLower = faqSearch.toLowerCase();
    const matchesSearch = !faqSearch ||
      item.question.toLowerCase().includes(searchLower) ||
      item.answer.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const tabs = [
    { key: 'chat', icon: MessageSquare, label: data.tabs.chat },
    { key: 'faq', icon: BookOpen, label: data.tabs.faq },
    { key: 'guide', icon: Map, label: data.tabs.guide },
    { key: 'tours', icon: Sparkles, label: data.tabs.tours }
  ];

  const faqCategories = [
    { key: 'all', label: data.faq.categories.general },
    { key: 'admin', label: data.faq.categories.admin },
    { key: 'staff', label: data.faq.categories.staff },
    { key: 'parent', label: data.faq.categories.parent }
  ];

  const startTour = (tourKey) => {
    setActiveTour(tourKey);
    setTourStep(0);
    // Tour guide logic would be implemented with a highlighting overlay
    // For now, we show a toast/notification style guide
  };

  const getTourSteps = () => {
    const tourData = data.tours.steps;
    // Determine available tours based on user role
    if (!user) return [];
    if (user.role === 'admin') return ['dashboard', 'children', 'attendance'];
    if (user.role === 'staff') return ['dashboard', 'children', 'attendance'];
    return ['dashboard'];
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-6 z-50 ${isRTL ? 'left-6' : 'right-6'}`}>
        {!hasOpenedBefore && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} 
              w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 z-10`}
          />
        )}
        {!hasOpenedBefore && !isOpen && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-teal-400"
          />
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!hasOpenedBefore) {
              localStorage.setItem('helpSystemOpened', 'true');
              setHasOpenedBefore(true);
            }
            setIsOpen(!isOpen);
          }}
          className={`relative p-4 rounded-full shadow-2xl 
            bg-gradient-to-br from-teal-500 to-teal-700 
            hover:from-teal-400 hover:to-teal-600
            text-white transition-all duration-300
            ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: isRTL ? -400 : 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? -400 : 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 z-50 w-full max-w-md 
                bg-white dark:bg-gray-900 shadow-2xl
                flex flex-col
                ${isRTL ? 'left-0 border-r' : 'right-0 border-l'}
                border-gray-200 dark:border-gray-700`}
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {data.panelTitle}
                    </h2>
                    <p className="text-teal-100 text-sm mt-1">{data.panelSubtitle}</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-medium transition-all
                      ${activeTab === tab.key
                        ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 bg-white dark:bg-gray-900'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${msg.type === 'user' ? (isRTL ? 'flex-row-reverse' : 'flex-row-reverse') : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${msg.type === 'bot'
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {msg.type === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                            ${msg.type === 'bot'
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none'
                              : 'bg-teal-500 text-white rounded-tr-none'
                            }`}>
                            {msg.text}
                          </div>
                        </motion.div>
                      ))}

                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                            <div className="flex gap-1">
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                className="w-2 h-2 bg-teal-400 rounded-full"
                              />
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                className="w-2 h-2 bg-teal-400 rounded-full"
                              />
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                className="w-2 h-2 bg-teal-400 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {chatMessages.length <= 2 && (
                      <div className="px-4 pb-2">
                        <p className="text-xs text-gray-400 mb-2">{isRTL ? 'أسئلة سريعة:' : 'Questions rapides:'}</p>
                        <div className="flex flex-wrap gap-2">
                          {data.chat.quickQuestions.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickQuestion(q)}
                              className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 
                                rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 
                                dark:hover:text-teal-400 transition-colors border border-gray-200 dark:border-gray-700"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                          placeholder={data.chat.placeholder}
                          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 
                            dark:border-gray-700 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-teal-500/50
                            text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim()}
                          className="p-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 
                            disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAQ TAB */}
                {activeTab === 'faq' && (
                  <div className="p-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 
                        ${isRTL ? 'right-3' : 'left-3'}`} />
                      <input
                        type="text"
                        value={faqSearch}
                        onChange={e => setFaqSearch(e.target.value)}
                        placeholder={isRTL ? "ابحث في الأسئلة..." : "Rechercher dans la FAQ..."}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-700 rounded-xl text-sm
                          focus:outline-none focus:ring-2 focus:ring-teal-500/50
                          text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                          ${isRTL ? 'pr-10 pl-4 text-right' : ''}`}
                      />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                      {faqCategories.map(cat => (
                        <button
                          key={cat.key}
                          onClick={() => setFaqFilter(cat.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                            ${faqFilter === cat.key
                              ? 'bg-teal-500 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* FAQ Items */}
                    <div className="space-y-2">
                      {filteredFaq.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden
                            bg-white dark:bg-gray-800"
                        >
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                            className={`w-full px-4 py-3 flex items-center justify-between text-left
                              ${expandedFaq === item.id ? 'bg-teal-50 dark:bg-teal-900/10' : ''}`}
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {item.question}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0
                                ${expandedFaq === item.id ? 'rotate-90' : ''}
                                ${isRTL ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <AnimatePresence>
                            {expandedFaq === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed 
                                  whitespace-pre-line border-t border-gray-100 dark:border-gray-700 pt-3">
                                  {item.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GUIDE TAB */}
                {activeTab === 'guide' && (
                  <div className="p-4 space-y-3">
                    {/* Role badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                        {user?.role === 'admin' ? (isRTL ? 'إدارة' : 'Admin')
                          : user?.role === 'staff' ? (isRTL ? 'موظف' : 'Staff')
                            : (isRTL ? 'ولي' : 'Parent')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {isRTL ? 'دليل مخصص لدورك' : 'Guide adapté à votre rôle'}
                      </span>
                    </div>
                    {(data.guide.sectionsByRole[user?.role] || data.guide.sectionsByRole.parent || []).map((section, i) => (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl border 
                          border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 
                            flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                            {section.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* TOURS TAB */}
                {activeTab === 'tours' && (
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {isRTL
                        ? "اختر جولة إرشادية لاكتشاف الواجهة خطوة بخطوة"
                        : "Choisissez un tour guidé pour découvrir l'interface pas à pas"}
                    </p>

                    {getTourSteps().map((tourKey) => {
                      const tourSteps = data.tours.steps[tourKey];
                      if (!tourSteps) return null;
                      return (
                        <motion.div
                          key={tourKey}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-xl border 
                            border-gray-200 dark:border-gray-700 cursor-pointer group"
                          onClick={() => startTour(tourKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 
                                flex items-center justify-center text-white">
                                <Map className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm capitalize">
                                  {tourKey}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {tourSteps.length} {isRTL ? "خطوات" : "étapes"}
                                </p>
                              </div>
                            </div>
                            <Zap className="w-5 h-5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Contact admin hint */}
                    <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border 
                      border-teal-100 dark:border-teal-800">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                            {data.chat.contactAdmin}
                          </p>
                          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                            {isRTL
                              ? "إذا كنت بحاجة إلى مساعدة إضافية، تواصل مع المسؤول"
                              : "Si vous avez besoin d'aide supplémentaire, contactez l'administrateur"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpSystem;
