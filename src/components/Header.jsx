import React from 'react';
import { 
  FileText, 
  History, 
  Users, 
  Package, 
  Settings, 
  Plus, 
  RefreshCw,
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';

export default function Header({
  activeTab,
  onTabChange,
  invoicesCount,
  syncStatus,
  syncText,
  businessName,
  onNewInvoice,
  isSettingsUnlocked
}) {
  const getSyncBadge = () => {
    if (syncStatus === 'connected') {
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs" title="Google Sheet is live">
          <span className="w-2 h-2 rounded-full dot-green"></span>
          <span>{syncText || `Google Sheet Live (${invoicesCount} Bills)`}</span>
        </div>
      );
    }
    if (syncStatus === 'loading') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <RefreshCw size={12} className="animate-spin text-blue-600" />
          <span>{syncText || 'Syncing...'}</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200" title="Google Sheet sync offline">
        <AlertCircle size={12} className="text-rose-600" />
        <span>{syncText || 'Offline / Reconnecting'}</span>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight" id="header-brand-name">
            {businessName || 'Vikas Digital Signature Shop'}
          </h1>
          <div className="text-[11px] text-slate-500 font-medium">
            Professional GST & Non-GST Billing System
          </div>
        </div>
      </div>

      {/* Sync Status & New Bill Button */}
      <div className="flex items-center gap-3">
        {getSyncBadge()}
        <button
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition transform active:scale-95"
          onClick={onNewInvoice}
          title="Create New Invoice"
        >
          <Plus size={14} /> New Bill
        </button>
      </div>

      {/* Navigation Pills */}
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/90" id="main-nav-tabs">
        <button
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'tab-editor'
              ? 'bg-white text-blue-600 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          onClick={() => onTabChange('tab-editor')}
        >
          <FileText size={14} />
          Editor & Preview
        </button>

        <button
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'tab-invoices'
              ? 'bg-white text-blue-600 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          onClick={() => onTabChange('tab-invoices')}
        >
          <History size={14} />
          Invoices
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-800">
            {invoicesCount}
          </span>
        </button>

        <button
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'tab-customers'
              ? 'bg-white text-blue-600 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          onClick={() => onTabChange('tab-customers')}
        >
          <Users size={14} />
          Customers
        </button>

        <button
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'tab-catalog'
              ? 'bg-white text-blue-600 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          onClick={() => onTabChange('tab-catalog')}
        >
          <Package size={14} />
          Products
        </button>

        <button
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'tab-settings'
              ? 'bg-white text-blue-600 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          onClick={() => onTabChange('tab-settings')}
        >
          <Settings size={14} />
          Settings
          {isSettingsUnlocked ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full" title="Settings Unlocked">
              <Unlock size={10} className="text-emerald-600" /> Unlocked
            </span>
          ) : (
            <Lock size={12} className="text-amber-500 ml-0.5" title="Settings Locked" />
          )}
        </button>
      </nav>
    </header>
  );
}
