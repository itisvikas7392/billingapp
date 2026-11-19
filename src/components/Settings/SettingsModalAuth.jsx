import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

const SETTINGS_PASSWORD = 'Vik@8604';

export default function SettingsModalAuth({ isOpen, onClose, onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
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
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '380px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 1rem', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
          🔒
        </div>
        <h3 style={{ marginBottom: '0.35rem', fontSize: '1.2rem', color: 'var(--text-dark)' }}>
          Settings is Locked
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Enter master password to access settings.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <input
              ref={inputRef}
              type="password"
              className="form-control"
              placeholder="Enter Password"
              style={{
                fontSize: '1rem',
                textAlign: 'center',
                letterSpacing: 2,
                borderColor: error ? '#ef4444' : ''
              }}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              autoComplete="current-password"
            />
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.4rem', textAlign: 'center' }}>
                ❌ Incorrect password! Please try again.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
