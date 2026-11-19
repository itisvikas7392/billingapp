/**
 * Google Sheet Sync Service for Vikas Billing App (React)
 * Master Database for Invoices, Customers, and Products
 */

import { StorageManager } from './storage';

export const GoogleSheetSync = {
  getAppScriptUrl() {
    const settings = StorageManager.getSettings();
    return (settings.googleSheetUrl || '').trim();
  },

  isEnabled() {
    const url = this.getAppScriptUrl();
    return Boolean(url && url.startsWith('http'));
  },

  async testConnection() {
    if (!this.isEnabled()) return { success: false, error: 'No URL configured' };
    const url = this.getAppScriptUrl();

    try {
      const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
      const res = await fetch(pingUrl, { method: 'GET' });
      return await res.json();
    } catch (err) {
      console.warn('Google Sheet ping failed:', err);
      return { success: false, error: err.message };
    }
  },

  async getNextInvoiceNumber() {
    if (!this.isEnabled()) return StorageManager.computeNextInvoiceNumber().formattedInvoiceNumber;

    const url = this.getAppScriptUrl();
    try {
      const reqUrl = url.includes('?') ? `${url}&action=getNextNumber` : `${url}?action=getNextNumber`;
      const res = await fetch(reqUrl, { method: 'GET' });
      const data = await res.json();
      if (data && data.success && data.nextInvoiceNumber) {
        return data.nextInvoiceNumber;
      }
    } catch (err) {
      console.warn('Failed to fetch next number from Google Sheet:', err);
    }
    return StorageManager.computeNextInvoiceNumber().formattedInvoiceNumber;
  },

  async saveInvoice(invoice) {
    if (!this.isEnabled()) return null;

    const url = this.getAppScriptUrl();
    const cleanInvoice = JSON.parse(JSON.stringify(invoice));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveInvoice',
          invoice: cleanInvoice
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Sync invoice to Google Sheet failed:', err);
      return { success: false, error: err.name === 'AbortError' ? 'Timeout saving to Google Sheet' : err.message };
    }
  },

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

  async fetchInvoices() {
    if (!this.isEnabled()) return { success: false, error: 'Not enabled' };

    const url = this.getAppScriptUrl();
    try {
      const reqUrl = url.includes('?') ? `${url}&action=getInvoices` : `${url}?action=getInvoices`;
      const res = await fetch(reqUrl, { method: 'GET' });
      const data = await res.json();

      if (data && data.success && Array.isArray(data.invoices)) {
        const sheetInvoices = data.invoices;

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

        // Dedicated customers list from Sheet
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          data.customers.forEach(cust => {
            if (cust && cust.name) StorageManager.addCustomerIfNew(cust);
          });
        }

        // Dedicated products list from Sheet
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
      console.warn('Failed to fetch from Google Sheet:', err);
      return { success: false, error: err.message };
    }
  },

  async deleteInvoice(id) {
    if (!this.isEnabled()) return null;

    const url = this.getAppScriptUrl();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteInvoice',
          id: id
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('Delete invoice from Google Sheet failed:', err);
      return { success: false, error: err.message };
    }
  },

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

export default GoogleSheetSync;
