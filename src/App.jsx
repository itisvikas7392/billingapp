import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InvoiceEditor from './components/InvoiceEditor/InvoiceEditor';
import InvoicesHistory from './components/InvoicesHistory/InvoicesHistory';
import CustomersList from './components/Customers/CustomersList';
import ProductsCatalog from './components/Products/ProductsCatalog';
import SettingsView from './components/Settings/SettingsView';
import SettingsModalAuth from './components/Settings/SettingsModalAuth';
import Toast from './components/Toast';
import { StorageManager, DEFAULT_SETTINGS } from './services/storage';
import { GoogleSheetSync } from './services/googleSheet';
import { calculateLineAmount, recalculateInvoice } from './utils/billingMath';

export default function App() {
  const [activeTab, setActiveTab] = useState('tab-editor');
  const [settings, setSettings] = useState(() => StorageManager.getSettings());
  const [invoices, setInvoices] = useState(() => StorageManager.getInvoices());
  const [customers, setCustomers] = useState(() => StorageManager.getCustomers());
  const [catalogItems, setCatalogItems] = useState(() => StorageManager.getItems());

  const [currentInvoice, setCurrentInvoice] = useState(() => {
    const activeId = StorageManager.getActiveInvoiceId();
    const inv = StorageManager.getInvoiceById(activeId);
    if (inv) return inv;
    const all = StorageManager.getInvoices();
    return all[0] || createBlankInvoiceHelper(StorageManager.computeNextInvoiceNumber().formattedInvoiceNumber, StorageManager.getSettings());
  });

  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [syncText, setSyncText] = useState('🔄 Connecting to Google Sheet...');
  const [toasts, setToasts] = useState([]);

  function showToast(message) {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }

  function createBlankInvoiceHelper(forcedNum, currentSettings) {
    const today = new Date().toISOString().split('T')[0];
    const num = forcedNum || StorageManager.computeNextInvoiceNumber().formattedInvoiceNumber;

    return {
      id: 'inv-' + Date.now(),
      invoiceNumber: num,
      invoiceType: currentSettings?.invoiceTitle || 'TAX INVOICE',
      copyType: 'ORIGINAL',
      date: today,
      terms: currentSettings?.defaultTerms || 'Due on Receipt',
      dueDate: today,
      customer: {
        name: '',
        address: '',
        phone: '',
        email: '',
        gstin: ''
      },
      items: [
        {
          id: 'row-' + Date.now(),
          description: 'Digital Signature Certificate',
          hsn: '998313',
          qty: 1,
          rate: 2500,
          amount: 2500
        }
      ],
      subTotal: 2500,
      discountType: 'flat',
      discountValue: 0,
      discountAmount: 0,
      taxType: 'none',
      taxRate: 0,
      taxAmount: 0,
      total: 2500,
      paymentMade: 2500,
      balanceDue: 0,
      notes: currentSettings?.defaultNotes || 'Thanks for your business.',
      status: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Startup Auto-Fetch from Google Sheet
  const autoFetchGoogleSheet = useCallback(async () => {
    if (!GoogleSheetSync.isEnabled()) {
      setSyncStatus('connected');
      setSyncText(`🟢 Local Cache (${invoices.length} Bills)`);
      return;
    }

    setSyncStatus('loading');
    setSyncText('🔄 Fetching Google Sheet Database...');

    try {
      const res = await GoogleSheetSync.fetchInvoices();
      if (res && res.success && Array.isArray(res.invoices)) {
        const sheetInvoices = res.invoices;
        setInvoices(sheetInvoices);
        setCustomers(StorageManager.getCustomers());
        setCatalogItems(StorageManager.getItems());

        const nextNum = await GoogleSheetSync.getNextInvoiceNumber();
        const matches = nextNum.match(/\d+/g);
        if (matches && matches.length > 0) {
          const num = parseInt(matches[matches.length - 1], 10);
          if (!isNaN(num)) {
            const updSettings = { ...settings, nextInvoiceNumber: num };
            setSettings(updSettings);
            StorageManager.saveSettings(updSettings);
          }
        }

        // Fresh draft with authoritative next number
        const freshDraft = createBlankInvoiceHelper(nextNum, settings);
        setCurrentInvoice(freshDraft);
        StorageManager.setActiveInvoiceId(freshDraft.id);

        setSyncStatus('connected');
        setSyncText(`🟢 Google Sheet Database (${sheetInvoices.length} Bills)`);
        showToast(`✅ Google Sheet Connected (${sheetInvoices.length} Bills) — Ready on ${nextNum}!`);
      } else {
        setSyncStatus('error');
        setSyncText('⚠️ Google Sheet Reconnecting...');
      }
    } catch (err) {
      console.warn('Auto fetch error:', err);
      setSyncStatus('error');
      setSyncText('⚠️ Google Sheet Offline');
    }
  }, [settings, invoices.length]);

  useEffect(() => {
    autoFetchGoogleSheet();
  }, []);

  // Handle Tab Switching with Password Gate
  const handleTabChange = (tabId) => {
    if (tabId === 'tab-settings' && !isSettingsUnlocked) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleUnlockSettings = () => {
    setIsSettingsUnlocked(true);
    setIsAuthModalOpen(false);
    setActiveTab('tab-settings');
    showToast('🔓 Settings unlocked!');
  };

  const handleLockSettings = () => {
    setIsSettingsUnlocked(false);
    setActiveTab('tab-editor');
    showToast('🔒 Settings locked successfully');
  };

  // Save current invoice
  const handleSaveInvoice = async () => {
    if (!currentInvoice.customer?.name?.trim()) {
      alert('Please enter a Customer Name before saving the bill.');
      return;
    }

    setIsSaving(true);
    showToast(`Saving ${currentInvoice.invoiceNumber}...`);

    // 1. Save locally
    const saved = StorageManager.saveInvoice(currentInvoice);
    if (saved.customer?.name) {
      StorageManager.addCustomerIfNew(saved.customer);
      setCustomers(StorageManager.getCustomers());
    }

    const updatedInvoices = StorageManager.getInvoices();
    setInvoices(updatedInvoices);

    // 2. Sync to Google Sheet
    if (GoogleSheetSync.isEnabled()) {
      try {
        const res = await GoogleSheetSync.saveInvoice(saved);
        setIsSaving(false);
        if (res && res.success) {
          showToast(`⚡ ${saved.invoiceNumber} Google Sheet में सुरक्षित हो गया!`);
          setSyncStatus('connected');
          setSyncText(`🟢 Google Sheet Database (${updatedInvoices.length} Bills)`);
        } else {
          showToast(`⚠️ Local Saved, Sheet sync pending: ${res?.error || ''}`);
        }
      } catch (err) {
        setIsSaving(false);
        showToast(`⚠️ Saved locally, sheet offline`);
      }
    } else {
      setIsSaving(false);
      showToast(`✅ ${saved.invoiceNumber} saved!`);
    }
  };

  // Save & Next Bill
  const handleSaveAndNext = async () => {
    await handleSaveInvoice();

    // Advance to next invoice
    const nextInfo = StorageManager.computeNextInvoiceNumber();
    const blank = createBlankInvoiceHelper(nextInfo.formattedInvoiceNumber, settings);
    setCurrentInvoice(blank);
    StorageManager.setActiveInvoiceId(blank.id);
    setActiveTab('tab-editor');
    showToast(`Ready for next bill: ${blank.invoiceNumber}!`);
  };

  // Clone Bill
  const handleCloneNext = () => {
    const nextInfo = StorageManager.computeNextInvoiceNumber();
    const cloned = {
      ...JSON.parse(JSON.stringify(currentInvoice)),
      id: 'inv-' + Date.now(),
      invoiceNumber: nextInfo.formattedInvoiceNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentInvoice(cloned);
    StorageManager.setActiveInvoiceId(cloned.id);
    setActiveTab('tab-editor');
    showToast(`Cloned items into new bill: ${cloned.invoiceNumber}!`);
  };

  // Start New Empty Bill
  const handleNewInvoice = () => {
    const nextInfo = StorageManager.computeNextInvoiceNumber();
    const blank = createBlankInvoiceHelper(nextInfo.formattedInvoiceNumber, settings);
    setCurrentInvoice(blank);
    StorageManager.setActiveInvoiceId(blank.id);
    setActiveTab('tab-editor');
    showToast(`Created blank invoice ${blank.invoiceNumber}`);
  };

  const handleSelectInvoice = (id) => {
    const inv = StorageManager.getInvoiceById(id);
    if (inv) {
      setCurrentInvoice(inv);
      StorageManager.setActiveInvoiceId(inv.id);
      setActiveTab('tab-editor');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    const remaining = StorageManager.deleteInvoice(id);
    setInvoices(remaining);

    if (GoogleSheetSync.isEnabled()) {
      GoogleSheetSync.deleteInvoice(id).then(res => {
        if (res && res.success) {
          showToast('Deleted from Google Sheet & local database');
        }
      });
    }

    if (currentInvoice.id === id) {
      if (remaining.length > 0) {
        setCurrentInvoice(remaining[0]);
        StorageManager.setActiveInvoiceId(remaining[0].id);
      } else {
        handleNewInvoice();
      }
    }
    showToast('Invoice deleted');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveInvoice();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInvoice]);

  // Customer Management
  const handleAddCustomer = (cust) => {
    const list = StorageManager.getCustomers();
    const existingIndex = list.findIndex(c => c.id === cust.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cust;
    } else {
      list.push(cust);
    }
    StorageManager.saveCustomers(list);
    setCustomers(list);
    showToast(`Customer "${cust.name}" saved!`);

    if (GoogleSheetSync.isEnabled()) {
      GoogleSheetSync.saveCustomer(cust).then(res => {
        if (res && res.success) {
          showToast(`⚡ Customer "${cust.name}" Google Sheet me save ho gaya!`);
        }
      });
    }
  };

  const handleDeleteCustomer = (id) => {
    let list = StorageManager.getCustomers().filter(c => c.id !== id);
    StorageManager.saveCustomers(list);
    setCustomers(list);
    showToast('Customer removed');
  };

  const handleSelectCustomerForBill = (cust) => {
    const nextInfo = StorageManager.computeNextInvoiceNumber();
    const blank = createBlankInvoiceHelper(nextInfo.formattedInvoiceNumber, settings);
    blank.customer = {
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      gstin: cust.gstin || ''
    };
    setCurrentInvoice(blank);
    StorageManager.setActiveInvoiceId(blank.id);
    setActiveTab('tab-editor');
    showToast(`Started fresh bill for ${cust.name || 'Customer'} (#${blank.invoiceNumber})`);
  };

  // Product Management
  const handleAddItem = (item) => {
    const list = StorageManager.getItems();
    const existingIndex = list.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }
    StorageManager.saveItems(list);
    setCatalogItems(list);
    showToast(`Product "${item.name}" saved!`);

    if (GoogleSheetSync.isEnabled()) {
      GoogleSheetSync.saveProduct(item).then(res => {
        if (res && res.success) {
          showToast(`⚡ Product "${item.name}" Google Sheet me save ho gaya!`);
        }
      });
    }
  };

  const handleDeleteItem = (id) => {
    let list = StorageManager.getItems().filter(i => i.id !== id);
    StorageManager.saveItems(list);
    setCatalogItems(list);
    showToast('Product removed');
  };

  const handleAddProductToBill = (item) => {
    let items = [...(currentInvoice.items || [])];

    // If there is only 1 item and it's empty / untouched default placeholder, replace it
    const isFirstItemEmpty = items.length === 1 && (!items[0].description || items[0].description.trim() === '' || items[0].amount === 0);

    const newItem = {
      id: 'row-' + Date.now(),
      description: item.name,
      hsn: item.hsn || '',
      qty: 1,
      rate: Number(item.rate) || 0,
      amount: calculateLineAmount(1, item.rate)
    };

    if (isFirstItemEmpty) {
      items = [newItem];
    } else {
      items.push(newItem);
    }

    const updated = recalculateInvoice(currentInvoice, { items });
    setCurrentInvoice(updated);
    setActiveTab('tab-editor');
    showToast(`Added ${item.name} to bill!`);
  };

  // Individual Bill Resync to Google Sheet
  const handleResyncInvoice = async (invId) => {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;
    if (!GoogleSheetSync.isEnabled()) {
      showToast('⚠️ Google Sheet URL not configured in Settings');
      return;
    }
    showToast(`Syncing ${inv.invoiceNumber} to Google Sheet...`);
    const res = await GoogleSheetSync.saveInvoice(inv);
    if (res && res.success) {
      showToast(`⚡ ${inv.invoiceNumber} synced to Google Sheet!`);
    } else {
      showToast(`❌ Sync failed: ${res?.error || 'Unknown error'}`);
    }
  };

  // Settings Save
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    StorageManager.saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        invoicesCount={invoices.length}
        syncStatus={syncStatus}
        syncText={syncText}
        businessName={settings.businessName}
        onNewInvoice={handleNewInvoice}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        isSaving={isSaving}
        isSettingsUnlocked={isSettingsUnlocked}
      />

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'tab-editor' && (
          <InvoiceEditor
            invoice={currentInvoice}
            onInvoiceChange={setCurrentInvoice}
            settings={settings}
            customers={customers}
            catalogItems={catalogItems}
            invoices={invoices}
            onSaveInvoice={handleSaveInvoice}
            onSaveAndNext={handleSaveAndNext}
            onCloneNext={handleCloneNext}
            onSelectPastInvoice={handleSelectInvoice}
            onNewInvoice={handleNewInvoice}
            isSaving={isSaving}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
          />
        )}

        {activeTab === 'tab-invoices' && (
          <InvoicesHistory
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onCloneInvoice={handleCloneNext}
            onDeleteInvoice={handleDeleteInvoice}
            onPrintInvoice={(id) => {
              handleSelectInvoice(id);
              setTimeout(() => handlePrint(), 150);
            }}
            onNewInvoice={handleNewInvoice}
            onResyncInvoice={handleResyncInvoice}
          />
        )}

        {activeTab === 'tab-customers' && (
          <CustomersList
            customers={customers}
            invoices={invoices}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForBill={handleSelectCustomerForBill}
          />
        )}

        {activeTab === 'tab-catalog' && (
          <ProductsCatalog
            items={catalogItems}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onAddProductToBill={handleAddProductToBill}
          />
        )}

        {activeTab === 'tab-settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            isUnlocked={isSettingsUnlocked}
            onLock={handleLockSettings}
            onUnlockRequest={() => setIsSettingsUnlocked(true)}
            showToast={showToast}
            onDataImported={() => {
              setInvoices(StorageManager.getInvoices());
              setCustomers(StorageManager.getCustomers());
              setCatalogItems(StorageManager.getItems());
              setSettings(StorageManager.getSettings());
            }}
          />
        )}
      </main>

      {/* Password Auth Modal */}
      <SettingsModalAuth
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUnlock={handleUnlockSettings}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
