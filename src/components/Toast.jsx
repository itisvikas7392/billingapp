import React from 'react';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
