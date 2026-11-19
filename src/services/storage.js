/**
 * Storage Manager for Vikas Billing App (Vite + React)
 */

export const STORAGE_KEYS = {
  SETTINGS: 'vikas_billing_settings_v1',
  INVOICES: 'vikas_billing_invoices_v1',
  CUSTOMERS: 'vikas_billing_customers_v1',
  ITEMS: 'vikas_billing_items_v1',
  ACTIVE_INVOICE_ID: 'vikas_billing_active_invoice_id_v1'
};

export const DEFAULT_SETTINGS = {
  businessName: 'Vikas Digital Signature Shop',
  addressLine1: 'Ram Krishan Nagar Gursahaiganj',
  addressLine2: 'Uttar Pradesh 209722',
  country: 'India',
  phone: '7392045049',
  email: 'itisvikasprajapati@gmail.com',
  gstin: '',
  pan: '',
  upiId: '7392045049@upi',
  bankName: 'State Bank of India',
  accountNumber: '',
  ifscCode: '',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 156,
  autoAdvanceOnPrint: true,
  defaultTerms: 'Due on Receipt',
  defaultNotes: 'Thanks for your business.',
  currencySymbol: '₹',
  showUpiQr: true,
  invoiceTitle: 'TAX INVOICE',
  footerTagline: 'Crafted with ease using Vikas Billing | Fast & Professional',
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycby9S2Sxi7lHCQ5GfqKp6z54pGmgzX5i1vifq4dDeOIs2IUAVm-stYzR7L6RntFiLA/exec'
};

export const DEFAULT_ITEMS = [
  { id: 'item-1', name: 'Digital Signature Certificate', rate: 2000.00, hsn: '998313', description: 'Class 3 DSC (2 Years)' },
  { id: 'item-2', name: 'DSC TOKEN', rate: 500.00, hsn: '8471', description: 'HYP2003 / ProxKey USB Crypto Token' },
  { id: 'item-3', name: 'DSC Renewal', rate: 1500.00, hsn: '998313', description: 'Class 3 Signature Only Renewal' },
  { id: 'item-4', name: 'Combo DSC + Token', rate: 2400.00, hsn: '998313', description: 'Complete Setup' }
];

export const DEFAULT_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'BHARAT SINGH rama',
    phone: '9876543210',
    email: '',
    address: 'Ram Krishan Nagar Gursahaiganj',
    gstin: ''
  }
];

export const DEFAULT_INVOICE_SAMPLE = {
  id: 'inv-sample-155',
  invoiceNumber: 'INV-000155',
  invoiceType: 'TAX INVOICE',
  copyType: 'ORIGINAL',
  date: '2026-11-17',
  terms: 'Due on Receipt',
  dueDate: '2026-11-17',
  customer: {
    name: 'BHARAT SINGH rama',
    address: 'Ram Krishan Nagar Gursahaiganj',
    phone: '9876543210',
    email: '',
    gstin: ''
  },
  items: [
    {
      id: 'row-1',
      description: 'Digital Signature Certificate',
      hsn: '998313',
      qty: 1.00,
      rate: 2000.00,
      taxPercent: 0,
      amount: 2000.00
    },
    {
      id: 'row-2',
      description: 'DSC TOKEN',
      hsn: '8471',
      qty: 1.00,
      rate: 500.00,
      taxPercent: 0,
      amount: 500.00
    }
  ],
  subTotal: 2500.00,
  discountType: 'flat',
  discountValue: 0,
  discountAmount: 0,
  taxType: 'none',
  taxRate: 0,
  taxAmount: 0,
  total: 2500.00,
  paymentMade: 2500.00,
  balanceDue: 0.00,
  notes: 'Thanks for your business.',
  status: 'paid',
  createdAt: '2026-11-17T12:00:00.000Z',
  updatedAt: '2026-11-17T12:00:00.000Z'
};

export const StorageManager = {
  getSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : {};
      const res = { ...DEFAULT_SETTINGS, ...parsed };
      if (!res.googleSheetUrl) {
        res.googleSheetUrl = DEFAULT_SETTINGS.googleSheetUrl;
      }
      return res;
    } catch (e) {
      console.warn('Storage read failed:', e);
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  },

  getInvoices() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const initial = [DEFAULT_INVOICE_SAMPLE];
      this.saveInvoices(initial);
      return initial;
    } catch (e) {
      console.warn('Failed to load invoices:', e);
      return [DEFAULT_INVOICE_SAMPLE];
    }
  },

  saveInvoices(invoices) {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      return true;
    } catch (e) {
      console.error('Failed to save invoices:', e);
      return false;
    }
  },

  getInvoiceById(id) {
    const list = this.getInvoices();
    return list.find(inv => inv.id === id) || null;
  },

  saveInvoice(invoice) {
    const list = this.getInvoices();
    const index = list.findIndex(item => item.id === invoice.id);
    invoice.updatedAt = new Date().toISOString();

    if (index >= 0) {
      list[index] = invoice;
    } else {
      invoice.createdAt = invoice.createdAt || new Date().toISOString();
      list.unshift(invoice);
    }
    this.saveInvoices(list);
    this.setActiveInvoiceId(invoice.id);
    return invoice;
  },

  deleteInvoice(id) {
    let list = this.getInvoices();
    list = list.filter(inv => inv.id !== id);
    this.saveInvoices(list);
    return list;
  },

  getActiveInvoiceId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_INVOICE_ID) || DEFAULT_INVOICE_SAMPLE.id;
  },

  setActiveInvoiceId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_INVOICE_ID, id);
  },

  computeNextInvoiceNumber(prefix = null) {
    const settings = this.getSettings();
    const invPrefix = prefix || settings.invoicePrefix || 'INV-';
    const invoices = this.getInvoices();

    let maxNumber = parseInt(settings.nextInvoiceNumber, 10) || 155;

    invoices.forEach(inv => {
      if (inv && inv.invoiceNumber) {
        const matches = inv.invoiceNumber.match(/\d+/g);
        if (matches && matches.length > 0) {
          const num = parseInt(matches[matches.length - 1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });

    const nextNum = maxNumber + 1;
    const formatted = `${invPrefix}${String(nextNum).padStart(6, '0')}`;
    return {
      nextNumber: nextNum,
      formattedInvoiceNumber: formatted
    };
  },

  getCustomers() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) return JSON.parse(saved);
      this.saveCustomers(DEFAULT_CUSTOMERS);
      return DEFAULT_CUSTOMERS;
    } catch (e) {
      return DEFAULT_CUSTOMERS;
    }
  },

  saveCustomers(customers) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      return true;
    } catch (e) {
      return false;
    }
  },

  addCustomerIfNew(cust) {
    if (!cust || !cust.name) return;
    const list = this.getCustomers();
    const cleanName = cust.name.trim();
    if (!cleanName) return;

    const exists = list.some(c => c.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      list.push({
        id: cust.id || ('cust-' + Date.now()),
        name: cleanName,
        phone: cust.phone || '',
        email: cust.email || '',
        address: cust.address || '',
        gstin: cust.gstin || ''
      });
      this.saveCustomers(list);
    }
  },

  getItems() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (saved) return JSON.parse(saved);
      this.saveItems(DEFAULT_ITEMS);
      return DEFAULT_ITEMS;
    } catch (e) {
      return DEFAULT_ITEMS;
    }
  },

  saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return true;
    } catch (e) {
      return false;
    }
  },

  exportAllData() {
    return JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      invoices: this.getInvoices(),
      customers: this.getCustomers(),
      items: this.getItems()
    }, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (Array.isArray(data.invoices)) this.saveInvoices(data.invoices);
      if (Array.isArray(data.customers)) this.saveCustomers(data.customers);
      if (Array.isArray(data.items)) this.saveItems(data.items);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

export default StorageManager;
