import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, X, ArrowRight, ClipboardList } from 'lucide-react';

const NotificationPopup = ({ onNewOrderReceived }) => {
  const { latestOrder, clearLatestOrder } = useSocket();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latestOrder) {
      setVisible(true);
      playBeep();
      if (onNewOrderReceived) {
        onNewOrderReceived(latestOrder);
      }
      
      // Auto-dismiss after 12 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 12000);
      
      return () => clearTimeout(timer);
    }
  }, [latestOrder]);

  const handleClose = () => {
    setVisible(false);
    clearLatestOrder();
  };

  // Synthesize a clean, gentle notification chime using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // First Tone
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, audioCtx.currentTime); // E5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.3);

      // Second Tone (offset)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 120);

    } catch (err) {
      console.warn('[NotificationPopup] Audio Context playback blocked by browser security policy:', err);
    }
  };

  if (!visible || !latestOrder) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-md w-96 bg-white rounded-2xl border-l-4 border-l-medical-600 shadow-2xl transition-all duration-300 transform scale-100 ${
      visible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-medical-50 text-medical-600 rounded-xl animate-bounce">
            <Bell size={20} />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-slate-800 text-sm tracking-wide">
                NEW ORDER RECEIVED!
              </span>
              <button 
                onClick={handleClose} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs font-semibold text-medical-600 mt-1">
              Order ID: #{latestOrder.order_number}
            </p>
            
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <div>
                <span className="font-medium text-slate-700">Customer: </span>
                {latestOrder.customer_name}
              </div>
              <div className="truncate">
                <span className="font-medium text-slate-700">Address: </span>
                {latestOrder.address}
              </div>
              <div className="line-clamp-2 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">
                "{latestOrder.medicines_requested}"
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-sm shadow-medical-100"
              >
                View Order
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
