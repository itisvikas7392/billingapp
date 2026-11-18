/**
 * Google Sheets Cloud Database Module for Vikas Billing App
 * Uses Google Apps Script Web App as the primary serverless cloud database.
 */

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycby9S2Sxi7lHCQ5GfqKp6z54pGmgzX5i1vifq4dDeOIs2IUAVm-stYzR7L6RntFiLA/exec';

const GoogleSheetSync = {
  getAppScriptUrl() {
    const settings = StorageManager.getSettings();
    return (settings.googleSheetUrl || APPSCRIPT_URL).trim();
  },

  setAppScriptUrl(url) {
    const settings = StorageManager.getSettings();
    settings.googleSheetUrl = (url || APPSCRIPT_URL).trim();
    StorageManager.saveSettings(settings);
  },

  isEnabled() {
    return true; // Permanently enabled with bound Google Sheet database
  },

  /**
   * Test connection to Google Apps Script Web App
   */
  async testConnection(customUrl = null) {
    const url = customUrl || this.getAppScriptUrl();
    if (!url) {
      return { success: false, error: 'Google Sheet Web App URL is empty.' };
    }

    try {
      const target = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
      const res = await fetch(target, { method: 'GET' });
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn('Google Sheet ping error:', err);
      return { success: false, error: err.message || 'Connection failed' };
    }
  },

  /**
   * Fetch the server-authoritative next sequential invoice number from Google Sheet
   */
  async getNextInvoiceNumber() {
    if (!this.isEnabled()) {
      return StorageManager.computeNextInvoiceNumber().formattedInvoiceNumber;
    }

    const url = this.getAppScriptUrl();
    try {
      const target = url.includes('?') ? `${url}&action=getNextNumber` : `${url}?action=getNextNumber`;
      const res = await fetch(target, { method: 'GET' });
      const data = await res.json();
      if (data && data.success && data.nextNumber) {
        return data.nextNumber;
      }
    } catch (err) {
      console.warn('Failed to fetch next number from Google Sheet, falling back to local calculation:', err);
    }

    // Client-side fallback if offline
    return StorageManager.computeNextInvoiceNumber().formattedInvoiceNumber;
  },

  /**
   * Save or Update invoice in Google Sheet (Primary Cloud Database)
   */
  async saveInvoice(invoice) {
    if (!this.isEnabled()) return { success: false, error: 'Google Sheet Sync is disabled' };
    if (!invoice || !invoice.invoiceNumber) {
      return { success: false, error: 'Invalid invoice data' };
    }

    const url = this.getAppScriptUrl();
    try {
      // Deep clone to ensure stability during serialization
      const payloadInvoice = JSON.parse(JSON.stringify(invoice));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // Use text/plain to avoid preflight CORS options in Google Apps Script
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveInvoice',
          invoice: payloadInvoice
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Failed to sync invoice to Google Sheet:', err);
      return { success: false, error: err.message || 'Network request failed' };
    }
  },

  /**
   * Delete invoice in Google Sheet
   */
  async deleteInvoice(invoiceId) {
    if (!this.isEnabled()) return null;

    const url = this.getAppScriptUrl();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteInvoice',
          id: invoiceId
        })
      });

      return await res.json();
    } catch (err) {
      console.warn('Delete in Google Sheet failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save or Update a Customer in Google Sheet
   */
  async saveCustomer(customer) {
    if (!this.isEnabled()) return null;

    const url = this.getAppScriptUrl();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveCustomer',
          customer: customer
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('Sync customer to Google Sheet failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save or Update a Product in Google Sheet
   */
  async saveProduct(product) {
    if (!this.isEnabled()) return null;

    const url = this.getAppScriptUrl();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveProduct',
          product: product
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('Sync product to Google Sheet failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch all invoices from Google Sheet (Primary Master Database)
   */
  async fetchInvoices() {
    if (!this.isEnabled()) return { success: false, error: 'Not enabled' };

    const url = this.getAppScriptUrl();
    try {
      const target = url.includes('?') ? `${url}&action=getInvoices` : `${url}?action=getInvoices`;
      const res = await fetch(target, { method: 'GET' });
      const data = await res.json();

      if (data && data.success && Array.isArray(data.invoices)) {
        const sheetInvoices = data.invoices;
        // Overwrite cache with master sheet invoices
        if (sheetInvoices.length > 0) {
          StorageManager.saveInvoices(sheetInvoices);

          // Extract customers and catalog items
          sheetInvoices.forEach(inv => {
            if (inv.customer && inv.customer.name) {
              StorageManager.addCustomerIfNew(inv.customer);
            }
            if (inv.items && Array.isArray(inv.items)) {
              inv.items.forEach(it => {
                const itemName = (it.description || it.name || '').trim();
                if (itemName) {
                  const existing = StorageManager.getItems();
                  if (!existing.some(x => x.name.toLowerCase() === itemName.toLowerCase())) {
                    existing.push({
                      id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                      name: itemName,
                      rate: Number(it.rate) || 0,
                      hsn: it.hsn || '',
                      description: it.description || itemName
                    });
                    StorageManager.saveItems(existing);
                  }
                }
              });
            }
          });
        }

        // If Google Sheet backend returned dedicated customers list
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          data.customers.forEach(cust => {
            if (cust && cust.name) StorageManager.addCustomerIfNew(cust);
          });
        }

        // If Google Sheet backend returned dedicated products list
        if (Array.isArray(data.products) && data.products.length > 0) {
          const currentItems = StorageManager.getItems();
          data.products.forEach(p => {
            if (p && p.name && !currentItems.some(x => x.name.toLowerCase() === p.name.toLowerCase())) {
              currentItems.push(p);
            }
          });
          StorageManager.saveItems(currentItems);
        }

        return {
          success: true,
          count: sheetInvoices.length,
          invoices: sheetInvoices,
          customers: data.customers || [],
          products: data.products || []
        };
      }

      return data;
    } catch (err) {
      console.warn('Fetch from Google Sheet failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Sync all existing local invoices, customers, and products to Google Sheet
   */
  async syncAllLocalToSheet() {
    if (!this.isEnabled()) return { success: false, error: 'Not enabled' };

    const invoices = StorageManager.getInvoices();
    const customers = StorageManager.getCustomers();
    const products = StorageManager.getItems();
    const url = this.getAppScriptUrl();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAll',
          invoices: invoices,
          customers: customers,
          products: products
        })
      });

      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

if (typeof window !== 'undefined') {
  window.GoogleSheetSync = GoogleSheetSync;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoogleSheetSync };
}
