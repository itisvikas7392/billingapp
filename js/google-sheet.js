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
   * Save or Update invoice in Google Sheet (background async)
   */
  async saveInvoice(invoice) {
    if (!this.isEnabled()) return null;

    const url = this.getAppScriptUrl();
    try {
      // Use text/plain to avoid preflight CORS options in Google Apps Script
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveInvoice',
          invoice: invoice
        })
      });

      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Failed to sync invoice to Google Sheet:', err);
      return { success: false, error: err.message };
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
          sheetInvoices.forEach(inv => {
            if (inv.customer && inv.customer.name) {
              StorageManager.addCustomerIfNew(inv.customer);
            }
          });
        }
        return { success: true, count: sheetInvoices.length, invoices: sheetInvoices };
      }

      return data;
    } catch (err) {
      console.warn('Fetch from Google Sheet failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Sync all existing local invoices to Google Sheet
   */
  async syncAllLocalToSheet() {
    if (!this.isEnabled()) return { success: false, error: 'Not enabled' };

    const invoices = StorageManager.getInvoices();
    const url = this.getAppScriptUrl();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAll',
          invoices: invoices
        })
      });

      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoogleSheetSync };
}
