import React, { useState } from 'react';
import { 
  Lock, 
  Save, 
  Cloud, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle2,
  Eye,
  EyeOff
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
  const [showInlinePassword, setShowInlinePassword] = useState(false);
  const [inlineError, setInlineError] = useState(false);

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-1">Settings is Locked</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
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
          <div className="max-w-xs mx-auto mb-4">
            <div className="relative">
              <input
                type={showInlinePassword ? 'text' : 'password'}
                className={`w-full text-sm text-center tracking-widest p-2.5 pr-10 rounded-xl border ${
                  inlineError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                } focus:outline-none transition`}
                placeholder="Enter Password"
                value={inlinePassword}
                onChange={(e) => {
                  setInlinePassword(e.target.value);
                  if (inlineError) setInlineError(false);
                }}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowInlinePassword(prev => !prev)}
                title={showInlinePassword ? 'Hide password' : 'Show password'}
              >
                {showInlinePassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {inlineError && (
              <div className="text-rose-600 text-xs mt-2 font-medium">
                ❌ Incorrect password! Please try again.
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
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
    <div className="max-w-4xl mx-auto p-6 w-full flex-1 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Business & Billing Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set default business profile, bank details, and Google Sheet integration.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            type="button" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition" 
            onClick={onLock} 
            title="Lock Settings with Password"
          >
            <Lock size={13} /> Lock
          </button>
          <button 
            type="button" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition" 
            onClick={handleFormSubmit}
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Business Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Business Profile (Appears on top of Invoice)
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Business / Shop Name *</label>
            <input
              type="text"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.businessName || ''}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address Line 1</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.addressLine1 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City, State, PIN</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.addressLine2 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.country || 'India'}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone / WhatsApp</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN (Tax ID)</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PAN Number</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* UPI & Bank Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Payment, UPI & Bank Account
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">UPI ID (For Dynamic Invoice QR Code)</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. 7392045049@upi"
                value={formData.upiId || ''}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={Boolean(formData.showUpiQr)}
                  onChange={(e) => setFormData({ ...formData, showUpiQr: e.target.checked })}
                />
                <span>Print Dynamic UPI QR Code on invoice</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Account Number</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC Code</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.ifscCode || ''}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Invoice Formatting & Defaults */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Numbering & Default Formatting
          </div>
          <div className="grid grid-cols-3 gap-3 items-end mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Prefix</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.invoicePrefix || 'INV-'}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Next Counter Number</label>
              <input
                type="number"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.nextInvoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, nextInvoiceNumber: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
            <div>
              <button 
                type="button" 
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition" 
                onClick={handleSyncNextNumber}
              >
                <RefreshCw size={13} /> Sync Next # from Sheet
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Invoice Title</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.invoiceTitle || 'TAX INVOICE'}
                onChange={(e) => setFormData({ ...formData, invoiceTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Payment Terms</label>
              <select
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.defaultTerms || 'Due on Receipt'}
                onChange={(e) => setFormData({ ...formData, defaultTerms: e.target.value })}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Currency Symbol</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.currencySymbol || '₹'}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Tax / GST Type</label>
              <select
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.defaultTaxType || 'none'}
                onChange={(e) => setFormData({ ...formData, defaultTaxType: e.target.value })}
              >
                <option value="none">No Tax (Non-GST)</option>
                <option value="gst_intra">CGST + SGST (Intra-State / Within State)</option>
                <option value="gst_inter">IGST (Inter-State / Outside State)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.defaultTaxRate !== undefined ? formData.defaultTaxRate : 18}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Default Notes (Appears on Invoice)</label>
            <textarea
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.defaultNotes || ''}
              onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })}
              placeholder="e.g. Thanks for your business."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Footer Tagline (Bottom of Page)</label>
            <input
              type="text"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.footerTagline || ''}
              onChange={(e) => setFormData({ ...formData, footerTagline: e.target.value })}
              placeholder="e.g. Crafted with ease using Vikas Billing | Fast & Professional"
            />
          </div>
        </div>

        {/* Google Sheet Cloud Database Integration */}
        <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Cloud size={16} /> Google Sheets Cloud Database (Primary Master)
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            All invoices, customer records, and product catalogs are synchronized across 3 dedicated tabs in Google Sheets: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">Invoices</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">Customers</code>, and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">Products</code>.
          </p>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Google Apps Script Web App URL</label>
            <input
              type="text"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={formData.googleSheetUrl || ''}
              onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button 
              type="button" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50" 
              onClick={handleTestConnection} 
              disabled={isTesting}
            >
              {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button 
              type="button" 
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition" 
              onClick={handleFetchAllFromSheet}
            >
              Fetch Latest from Sheet
            </button>
            <button 
              type="button" 
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition" 
              onClick={handleSyncAllToSheet}
            >
              Sync All Local to Sheet
            </button>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Data Backup & Restore
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Download an offline JSON snapshot of all invoices, customers, and catalog items.
          </p>
          <div className="flex gap-3">
            <button 
              type="button" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition" 
              onClick={handleExportJson}
            >
              <Download size={14} /> Export All Data (JSON)
            </button>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer">
              <Upload size={14} /> Import Data (JSON)
              <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
            </label>
          </div>
        </div>

        <div className="text-right pt-2 pb-12">
          <button 
            type="submit" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          >
            <Save size={15} /> Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
