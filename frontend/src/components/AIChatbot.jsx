import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { 
  Bot, MessageSquare, X, Send, Sparkles, 
  ShieldAlert, RefreshCw, User, ShoppingBag, 
  HelpCircle, ChevronDown, Phone, MapPin, Pill
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  { icon: ShoppingBag, label: "Product Categories", text: "What categories of products do you sell?" },
  { icon: Pill, label: "How to Order", text: "How do I order prescription medicines on your website?" },
  { icon: MapPin, label: "Store Timings & Address", text: "What is your store address and business hours?" },
  { icon: Phone, label: "Contact Pharmacist", text: "How can I contact your store pharmacists?" }
];

const INITIAL_MESSAGE = {
  id: 'welcome',
  role: 'model',
  text: "Hello! 👋 I am the **Sai Rajo Medical Shop AI Assistant**.\n\nI can help answer questions about our product categories (**Medicines, Personal Care, Healthcare, Baby Care, Medical Devices, Ayurvedic Products, Supplements**), order process, store timings, and local offers.\n\nHow can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation context history for API payload
      const historyContext = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const res = await API.post('/chatbot/chat', {
        message: queryText,
        history: historyContext
      });

      if (res.data && res.data.success) {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.data?.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('[Chatbot Error]:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I am having trouble connecting right now. Please try asking again or feel free to call our pharmacists directly at **+91 8127152715** or **+91 9565187777**.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  // Helper to format basic markdown (bold text, lists, linebreaks) cleanly
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, lineIdx) => {
      let formattedLine = line;

      // Handle bold tags **text**
      const parts = formattedLine.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {parts}
          {lineIdx < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-medical-600 to-teal-700 hover:from-medical-700 hover:to-teal-800 text-white p-3.5 px-4 rounded-full shadow-2xl hover:shadow-medical-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
          aria-label="Open AI Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          
          <div className="p-1 bg-white/20 rounded-full">
            <Bot size={22} className="text-white" />
          </div>

          <div className="text-left hidden sm:block pr-1">
            <div className="text-xs font-bold leading-tight">Sai Rajo AI</div>
            <div className="text-[10px] text-teal-100 font-medium">Click to chat</div>
          </div>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-medical-950 to-teal-950 text-white p-4 px-5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-medical-500 to-teal-400 p-0.5 shadow-inner">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                    <Bot size={22} className="text-teal-400 animate-pulse-subtle" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Sai Rajo AI Assistant
                  <Sparkles size={13} className="text-teal-300" />
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Instant Support • Verified Medical Shop
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Reset Chat"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close Chat"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="bg-amber-50/90 border-b border-amber-200/60 p-2.5 px-4 flex items-start gap-2 text-[11px] text-amber-800">
            <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-tight font-medium">
              AI provides store info & general guidance only. Always consult a doctor for diagnosis or serious symptoms.
            </p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-medical-600 text-white shadow-sm'
                      : 'bg-gradient-to-tr from-slate-800 to-teal-900 text-teal-300 shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-medical-600 text-white rounded-tr-none font-normal'
                      : 'bg-white text-slate-700 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div>{renderFormattedText(msg.text)}</div>
                  <div
                    className={`text-[9px] mt-1.5 text-right font-medium opacity-70 ${
                      msg.role === 'user' ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length < 3 && !isLoading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.text)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-medical-50 hover:text-medical-700 hover:border-medical-200 border border-slate-200 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors"
                  >
                    <Icon size={12} className="text-medical-600 shrink-0" />
                    <span>{q.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200/80">
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 focus-within:border-medical-500 focus-within:ring-2 focus-within:ring-medical-500/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about products, orders, or timings..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-medical-600 to-teal-600 text-white rounded-xl hover:from-medical-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-1.5 font-medium">
              Powered by Sai Rajo AI • Healthcare Support
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AIChatbot;
