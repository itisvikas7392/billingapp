/**
 * Invoice Template Renderer
 * Replicates the exact layout, typography, and styling of INV-000155.pdf
 */

const InvoiceTemplate = {
  formatCurrency(num) {
    const val = Number(num) || 0;
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD to DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  renderInvoiceSheet(invoice, settings, copyType = null) {
    const activeCopy = copyType || invoice.copyType || 'ORIGINAL';
    const subTotal = invoice.subTotal || 0;
    const total = invoice.total || 0;
    const paymentMade = invoice.paymentMade || 0;
    const balanceDue = invoice.balanceDue || (total - paymentMade);
    const currency = settings.currencySymbol || '₹';

    const words = convertNumberToIndianWords(total, 'Indian Rupee');

    // Build line items rows
    const rowsHtml = (invoice.items || []).map((item, idx) => {
      const qtyFormatted = Number(item.qty || 0).toFixed(2);
      const rateFormatted = this.formatCurrency(item.rate);
      const amountFormatted = this.formatCurrency(item.amount || (item.qty * item.rate));

      return `
        <tr class="invoice-row">
          <td class="col-num">${idx + 1}</td>
          <td class="col-desc">
            <div class="item-name">${this.escapeHtml(item.description || item.name || '')}</div>
            ${item.hsn ? `<div class="item-hsn">HSN/SAC: ${this.escapeHtml(item.hsn)}</div>` : ''}
            ${item.notes ? `<div class="item-notes">${this.escapeHtml(item.notes)}</div>` : ''}
          </td>
          <td class="col-qty">
            <div>${qtyFormatted}</div>
          </td>
          <td class="col-rate">${rateFormatted}</td>
          <td class="col-amount">${amountFormatted}</td>
        </tr>
      `;
    }).join('');

    // Tax calculation breakdown rows (if GST applied)
    let taxRowsHtml = '';
    if (invoice.taxType === 'gst_intra' && invoice.taxAmount > 0) {
      const halfRate = (invoice.taxRate / 2).toFixed(1);
      const halfAmount = this.formatCurrency(invoice.taxAmount / 2);
      taxRowsHtml += `
        <tr>
          <td class="summary-label">CGST (${halfRate}%):</td>
          <td class="summary-value">${currency}${halfAmount}</td>
        </tr>
        <tr>
          <td class="summary-label">SGST (${halfRate}%):</td>
          <td class="summary-value">${currency}${halfAmount}</td>
        </tr>
      `;
    } else if (invoice.taxType === 'gst_inter' && invoice.taxAmount > 0) {
      taxRowsHtml += `
        <tr>
          <td class="summary-label">IGST (${invoice.taxRate}%):</td>
          <td class="summary-value">${currency}${this.formatCurrency(invoice.taxAmount)}</td>
        </tr>
      `;
    }

    // Discount row
    let discountRowHtml = '';
    if (invoice.discountAmount > 0) {
      discountRowHtml = `
        <tr>
          <td class="summary-label">Discount:</td>
          <td class="summary-value text-green-700">(-) ${currency}${this.formatCurrency(invoice.discountAmount)}</td>
        </tr>
      `;
    }

    // Payment row
    let paymentRowHtml = '';
    if (paymentMade > 0) {
      paymentRowHtml = `
        <tr>
          <td class="summary-label">Payment Made:</td>
          <td class="summary-value text-red-600">(-) ${this.formatCurrency(paymentMade)}</td>
        </tr>
      `;
    }

    // UPI QR Code section
    const upiUrl = (settings.showUpiQr && settings.upiId && balanceDue > 0) 
      ? UpiQR.createUpiQrUrl({
          upiId: settings.upiId,
          businessName: settings.businessName,
          amount: balanceDue,
          invoiceNo: invoice.invoiceNumber
        })
      : '';

    return `
      <div class="a4-sheet" data-copy="${activeCopy}">
        <!-- Top Header: Business & Title -->
        <div class="invoice-header">
          <div class="business-info">
            <h1 class="business-name">${this.escapeHtml(settings.businessName || 'Business Name')}</h1>
            ${settings.addressLine1 ? `<div class="info-line">${this.escapeHtml(settings.addressLine1)}</div>` : ''}
            ${settings.addressLine2 ? `<div class="info-line">${this.escapeHtml(settings.addressLine2)}</div>` : ''}
            ${settings.country ? `<div class="info-line">${this.escapeHtml(settings.country)}</div>` : ''}
            ${settings.phone ? `<div class="info-line">${this.escapeHtml(settings.phone)}</div>` : ''}
            ${settings.email ? `<div class="info-line">${this.escapeHtml(settings.email)}</div>` : ''}
            ${settings.gstin ? `<div class="info-line"><strong>GSTIN:</strong> ${this.escapeHtml(settings.gstin)}</div>` : ''}
          </div>

          <div class="invoice-meta-right">
            <div class="copy-badge">${activeCopy}</div>
            <div class="tax-invoice-title">${this.escapeHtml(invoice.invoiceType || settings.invoiceTitle || 'TAX INVOICE')}</div>
            <div class="invoice-number-tag"># ${this.escapeHtml(invoice.invoiceNumber || 'INV-000155')}</div>

            <div class="balance-due-mini">
              <span class="lbl">Balance Due</span>
              <span class="val">${currency}${this.formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        <!-- Meta info: Bill To & Dates -->
        <div class="invoice-meta-grid">
          <div class="bill-to-section">
            <div class="section-label">Bill To</div>
            <div class="customer-name">${this.escapeHtml(invoice.customer?.name || 'CASH CUSTOMER')}</div>
            ${invoice.customer?.address ? `<div class="customer-address">${this.escapeHtml(invoice.customer.address)}</div>` : ''}
            ${invoice.customer?.phone ? `<div class="customer-phone">Phone: ${this.escapeHtml(invoice.customer.phone)}</div>` : ''}
            ${invoice.customer?.email ? `<div class="customer-email">Email: ${this.escapeHtml(invoice.customer.email)}</div>` : ''}
            ${invoice.customer?.gstin ? `<div class="customer-gstin">GSTIN: ${this.escapeHtml(invoice.customer.gstin)}</div>` : ''}
          </div>

          <div class="dates-section">
            <table class="dates-table">
              <tr>
                <td class="dt-label">Invoice Date :</td>
                <td class="dt-value">${this.formatDate(invoice.date)}</td>
              </tr>
              <tr>
                <td class="dt-label">Terms :</td>
                <td class="dt-value">${this.escapeHtml(invoice.terms || 'Due on Receipt')}</td>
              </tr>
              <tr>
                <td class="dt-label">Due Date :</td>
                <td class="dt-value">${this.formatDate(invoice.dueDate || invoice.date)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Line items table -->
        <div class="items-table-wrapper">
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-desc">Item & Description</th>
                <th class="col-qty">Qty</th>
                <th class="col-rate">Rate</th>
                <th class="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary & Words Section -->
        <div class="invoice-bottom-grid">
          <div class="bottom-left-area">
            <div class="amount-in-words-block">
              <span class="words-label">Total In Words:</span>
              <span class="words-text">${words}</span>
            </div>

            ${upiUrl ? `
              <div class="upi-payment-box no-print-optional">
                <div class="upi-qr" id="sheet-upi-qr-${activeCopy.toLowerCase()}"></div>
                <div class="upi-text">
                  <strong>Scan & Pay via UPI</strong><br/>
                  <span>GPay / PhonePe / Paytm</span><br/>
                  <small style="color:#64748b;">${settings.upiId}</small>
                </div>
              </div>
            ` : ''}

            ${(settings.bankName && settings.accountNumber) ? `
              <div class="bank-details-box">
                <div class="bank-title">Bank Details</div>
                <div>Bank: ${this.escapeHtml(settings.bankName)}</div>
                <div>A/C: ${this.escapeHtml(settings.accountNumber)}</div>
                ${settings.ifscCode ? `<div>IFSC: ${this.escapeHtml(settings.ifscCode)}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="bottom-right-summary">
            <table class="summary-table">
              <tr>
                <td class="summary-label">Sub Total:</td>
                <td class="summary-value">${this.formatCurrency(subTotal)}</td>
              </tr>
              ${discountRowHtml}
              ${taxRowsHtml}
              <tr class="total-row">
                <td class="summary-label"><strong>Total:</strong></td>
                <td class="summary-value"><strong>${currency}${this.formatCurrency(total)}</strong></td>
              </tr>
              ${paymentRowHtml}
              <tr class="balance-due-highlight">
                <td class="summary-label"><strong>Balance Due:</strong></td>
                <td class="summary-value"><strong>${currency}${this.formatCurrency(balanceDue)}</strong></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Notes & Signature Section -->
        <div class="invoice-footer-section">
          <div class="notes-block">
            <div class="notes-label">Notes</div>
            <div class="notes-body">${this.escapeHtml(invoice.notes || settings.defaultNotes || 'Thanks for your business.')}</div>
          </div>

          <div class="signature-block">
            <div class="signature-line">
              <span class="sig-label">Authorized Signature</span>
              <div class="sig-border"></div>
            </div>
          </div>
        </div>

        <!-- Page Footer Branding -->
        <div class="invoice-page-bottom">
          <div class="footer-branding">
            <svg class="bolt-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>${this.escapeHtml(settings.footerTagline || 'Crafted with ease using Vikas Billing')}</span>
          </div>
          <div class="page-num">1</div>
        </div>
      </div>
    `;
  },

  renderMultiCopyInvoice(invoice, settings, mode = 'both') {
    if (mode === 'original') {
      return this.renderInvoiceSheet(invoice, settings, 'ORIGINAL');
    } else if (mode === 'duplicate') {
      return this.renderInvoiceSheet(invoice, settings, 'DUPLICATE');
    } else {
      // Both copies consecutive (page break between them)
      return `
        ${this.renderInvoiceSheet(invoice, settings, 'ORIGINAL')}
        <div class="print-page-break"></div>
        ${this.renderInvoiceSheet(invoice, settings, 'DUPLICATE')}
      `;
    }
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InvoiceTemplate };
}
