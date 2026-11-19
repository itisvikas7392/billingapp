import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const SETTINGS_PASSWORD = 'Vik@8604';

export default function SettingsModalAuth({ isOpen, onClose, onUnlock }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SETTINGS_PASSWORD) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-inner">
          🔒
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mb-1">
          Settings is Locked
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Enter master password to access system settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                className={`w-full text-sm text-center tracking-widest p-2.5 pr-10 rounded-xl border ${
                  error ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                } focus:outline-none transition`}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div className="text-rose-600 text-xs mt-2 font-medium">
                ❌ Incorrect password! Please try again.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
