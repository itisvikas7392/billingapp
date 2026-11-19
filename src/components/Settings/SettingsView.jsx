import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Save, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Upload 
} from 'lucide-react';
import { GoogleSheetSync } from '../../services/googleSheet';
import { StorageManager } from '../../services/storage';

export default function SettingsView({
  settings,
  onSaveSettings,
  isUnlocked,
  onLock,
  onUnlockRequest,
  showToast,
  onDataImported
}) {
  const [formData, setFormData] = useState({ ...settings });
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineError, setInlineError] = useState(false);

  if (!isUnlocked) {
    return (
      <div className="content-page" style={{ maxWidth: 480, margin: '3rem auto', textAlign: 'center', background: '#ffffff', padding: '2.75rem 2rem', borderRadius: 12, border: '1px solid var(--border-light)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 1.25rem', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.85rem' }}>
          🔒
        </div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Settings is Locked</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Business profile, bank details, and Google Sheet database settings are password protected.
        </p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (inlinePassword === 'Vik@8604') {
            setInlineError(false);
            onUnlockRequest(true);
          } else {
            setInlineError(true);
          }
        }}>
          <div style={{ maxWidth: 300, margin: '0 auto 1rem' }}>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Password"
              style={{ textAlign: 'center', fontSize: '1rem', letterSpacing: 2, borderColor: inlineError ? '#ef4444' : '' }}
              value={inlinePassword}
              onChange={(e) => {
                setInlinePassword(e.target.value);
                if (inlineError) setInlineError(false);
              }}
              autoFocus
            />
            {inlineError && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                ❌ Incorrect password! Please try again.
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ minWidth: 140 }}>
            Unlock Settings
          </button>
        </form>
      </div>
    );
  }

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await GoogleSheetSync.testConnection();
      setIsTesting(false);
      setTestResult(res);
      if (res && res.success) {
        showToast('✅ Google Sheet is connected and active!');
      } else {
        showToast('❌ Google Sheet connection failed: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      setIsTesting(false);
      setTestResult({ success: false, error: e.message });
    }
  };

  const handleSyncNextNumber = async () => {
    showToast('Fetching authoritative next number from Google Sheet...');
    const nextNum = await GoogleSheetSync.getNextInvoiceNumber();
    const matches = nextNum.match(/\d+/g);
    if (matches && matches.length > 0) {
      const num = parseInt(matches[matches.length - 1], 10);
      setFormData(prev => ({ ...prev, nextInvoiceNumber: num }));
      showToast(`⚡ Next number set to ${nextNum} from Google Sheet!`);
    }
  };

  const handleFetchAllFromSheet = async () => {
    showToast('Fetching all bills from Google Sheet...');
    const res = await GoogleSheetSync.fetchInvoices();
    if (res && res.success) {
      showToast(`✅ Fetched ${res.invoices.length} invoices from Google Sheet!`);
      if (onDataImported) onDataImported();
    } else {
      alert('Fetch failed: ' + (res.error || 'Check internet connection'));
    }
  };

  const handleSyncAllToSheet = async () => {
    showToast('Syncing all bills, customers & products to Google Sheet...');
    const res = await GoogleSheetSync.syncAllLocalToSheet();
    if (res && res.success) {
      showToast('✅ All data synced to Invoices, Customers & Products sheets!');
    } else {
      alert('Sync failed: ' + (res.error || 'Check internet connection'));
    }
  };

  const handleExportJson = () => {
    const dataStr = StorageManager.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data backup downloaded successfully!');
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = StorageManager.importData(event.target.result);
      if (res && res.success) {
        showToast('✅ Backup data imported successfully!');
        setFormData(StorageManager.getSettings());
        if (onDataImported) onDataImported();
      } else {
        alert('Import failed: ' + (res.error || 'Invalid JSON'));
      }
    };
    reader.readAsText(file);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    showToast('✅ Settings saved successfully!');
  };

  return (
    <div className="content-page" style={{ maxWidth: 800 }}>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Business & Billing Settings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Set default business profile, bank details, and Google Sheet integration.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onLock} title="Lock Settings with Password">
            🔒 Lock
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleFormSubmit}>
            <Save size={14} style={{ display: 'inline', marginRight: 4 }} /> Save Changes
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        {/* Business Profile */}
        <div className="form-section">
          <div className="form-section-title">Business Profile (Appears on top of Invoice)</div>
          <div className="form-group">
            <label>Business / Shop Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.businessName || ''}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Address Line 1</label>
              <input
                type="text"
                className="form-control"
                value={formData.addressLine1 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>City, State, PIN</label>
              <input
                type="text"
                className="form-control"
                value={formData.addressLine2 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                className="form-control"
                value={formData.country || 'India'}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone / WhatsApp</label>
              <input
                type="text"
                className="form-control"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>GSTIN (Tax ID)</label>
              <input
                type="text"
                className="form-control"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>PAN Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* UPI & Bank Details */}
        <div className="form-section">
          <div className="form-section-title">Payment, UPI & Bank Account</div>
          <div className="grid-2">
            <div className="form-group">
              <label>UPI ID (For Dynamic Invoice QR Code)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. mobile@upi"
                value={formData.upiId || ''}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.showUpiQr)}
                  onChange={(e) => setFormData({ ...formData, showUpiQr: e.target.checked })}
                />
                <span>Print Dynamic UPI QR Code on invoices</span>
              </label>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                className="form-control"
                value={formData.ifscCode || ''}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Invoice Formatting */}
        <div className="form-section">
          <div className="form-section-title">Numbering & Default Formatting</div>
          <div className="grid-3">
            <div className="form-group">
              <label>Invoice Prefix</label>
              <input
                type="text"
                className="form-control"
                value={formData.invoicePrefix || 'INV-'}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Next Counter Number</label>
              <input
                type="number"
                className="form-control"
                value={formData.nextInvoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, nextInvoiceNumber: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
            <div className="form-group" style={{ paddingTop: '1.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSyncNextNumber}>
                <RefreshCw size={13} style={{ display: 'inline', marginRight: 4 }} /> Sync Next # from Sheet
              </button>
            </div>
          </div>
        </div>

        {/* Google Sheet Cloud Database Integration */}
        <div className="form-section" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a' }}>
            <Cloud size={18} /> Google Sheets Cloud Database (Primary Master)
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            All invoices, customer records, and product catalogs are synchronized across 3 dedicated tabs in Google Sheets: <code>Invoices</code>, <code>Customers</code>, and <code>Products</code>.
          </p>

          <div className="form-group">
            <label>Google Apps Script Web App URL</label>
            <input
              type="text"
              className="form-control"
              value={formData.googleSheetUrl || ''}
              onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleFetchAllFromSheet}>
              Fetch Latest from Sheet
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleSyncAllToSheet}>
              Sync All Local to Sheet
            </button>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="form-section">
          <div className="form-section-title">Data Backup & Restore</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Download an offline JSON snapshot of all invoices, customers, and catalog items.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportJson}>
              <Download size={14} style={{ display: 'inline', marginRight: 4 }} /> Export All Data (JSON)
            </button>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={14} style={{ display: 'inline', marginRight: 4 }} /> Import Data (JSON)
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJson} />
            </label>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: '1.5rem', paddingBottom: '3rem' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={16} style={{ display: 'inline', marginRight: 6 }} /> Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
