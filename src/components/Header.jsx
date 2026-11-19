import React from 'react';
import { 
  FileText, 
  History, 
  Users, 
  Package, 
  Settings, 
  Plus, 
  Printer, 
  Download,
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Header({
  activeTab,
  onTabChange,
  invoicesCount,
  syncStatus,
  syncText,
  businessName,
  onNewInvoice,
  onPrint,
  onDownloadPdf,
  isSaving
}) {
  const getSyncBadge = () => {
    if (syncStatus === 'connected') {
      return (
        <div className="status-badge status-connected" title="Google Sheet is live">
          <span className="dot dot-green"></span>
          <span>{syncText || `🟢 Google Sheet Database (${invoicesCount} Bills)`}</span>
        </div>
      );
    }
    if (syncStatus === 'loading') {
      return (
        <div className="status-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
          <RefreshCw size={12} className="spin" style={{ display: 'inline', marginRight: 4 }} />
          <span>{syncText || 'Syncing...'}</span>
        </div>
      );
    }
    return (
      <div className="status-badge status-error" title="Google Sheet sync offline">
        <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
        <span>{syncText || 'Offline / Reconnecting'}</span>
      </div>
    );
  };

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="brand-title" id="header-brand-name">
            {businessName || 'Vikas Digital Signature Shop'}
          </h1>
          <div className="brand-subtitle">
            Professional GST & Non-GST Billing System
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {getSyncBadge()}
      </div>

      <nav className="nav-tabs" id="main-nav-tabs">
        <button
          className={`nav-btn ${activeTab === 'tab-editor' ? 'active' : ''}`}
          onClick={() => onTabChange('tab-editor')}
        >
          <FileText size={15} />
          Editor & Preview
        </button>

        <button
          className={`nav-btn ${activeTab === 'tab-invoices' ? 'active' : ''}`}
          onClick={() => onTabChange('tab-invoices')}
        >
          <History size={15} />
          Invoices
          <span className="badge" id="invoices-count-badge">
            {invoicesCount}
          </span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'tab-customers' ? 'active' : ''}`}
          onClick={() => onTabChange('tab-customers')}
        >
          <Users size={15} />
          Customers
        </button>

        <button
          className={`nav-btn ${activeTab === 'tab-catalog' ? 'active' : ''}`}
          onClick={() => onTabChange('tab-catalog')}
        >
          <Package size={15} />
          Products
        </button>

        <button
          className={`nav-btn ${activeTab === 'tab-settings' ? 'active' : ''}`}
          onClick={() => onTabChange('tab-settings')}
        >
          <Settings size={15} />
          Settings <span style={{ fontSize: '0.75rem', marginLeft: 2 }} title="Password Protected">🔒</span>
        </button>
      </nav>
    </header>
  );
}
