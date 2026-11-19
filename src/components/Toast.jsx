import React from 'react';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className="bg-slate-900/95 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-white/10 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
