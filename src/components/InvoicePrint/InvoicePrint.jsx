import React from 'react';
import { convertNumberToIndianWords } from '../../utils/numberToWords';
import { createUpiQrUrl, getQrImageUrl } from '../../utils/qr';

function formatCurrency(num) {
  const val = Number(num) || 0;
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function InvoiceSheet({ invoice, settings, copyType }) {
  const activeCopy = copyType || invoice.copyType || 'ORIGINAL';
  const subTotal = Number(invoice.subTotal) || 0;
  const total = Number(invoice.total) || 0;
  const paymentMade = Number(invoice.paymentMade) || 0;
  const balanceDue = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : (total - paymentMade));
  const currency = settings?.currencySymbol || '₹';

  const words = convertNumberToIndianWords(total, 'Indian Rupee');

  const upiUrl = (settings?.showUpiQr && settings?.upiId && balanceDue > 0)
    ? createUpiQrUrl({
        upiId: settings.upiId,
        businessName: settings.businessName,
        amount: balanceDue,
        invoiceNo: invoice.invoiceNumber
      })
    : '';

  const qrSrc = upiUrl ? getQrImageUrl(upiUrl, 100) : '';

  return (
    <div className="a4-sheet" data-copy={activeCopy}>
      {/* Top Header: Business & Title */}
      <div className="invoice-header">
        <div className="business-info">
          <h1 className="business-name">{settings?.businessName || 'Business Name'}</h1>
          {settings?.addressLine1 && <div className="info-line">{settings.addressLine1}</div>}
          {settings?.addressLine2 && <div className="info-line">{settings.addressLine2}</div>}
          {settings?.country && <div className="info-line">{settings.country}</div>}
          {settings?.phone && <div className="info-line">Phone: {settings.phone}</div>}
          {settings?.email && <div className="info-line">Email: {settings.email}</div>}
          {settings?.gstin && <div className="info-line"><strong>GSTIN:</strong> {settings.gstin}</div>}
        </div>

        <div className="invoice-meta-right">
          <div className="copy-badge">{activeCopy}</div>
          <div className="tax-invoice-title">{invoice.invoiceType || settings?.invoiceTitle || 'TAX INVOICE'}</div>
          <div className="invoice-number-tag"># {invoice.invoiceNumber || 'INV-000155'}</div>

          <div className="balance-due-mini">
            <span className="lbl">Balance Due</span>
            <span className="val">{currency}{formatCurrency(balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Meta info: Bill To & Dates */}
      <div className="invoice-meta-grid">
        <div className="bill-to-section">
          <div className="section-label">Bill To</div>
          <div className="customer-name">{invoice.customer?.name || 'CASH CUSTOMER'}</div>
          {invoice.customer?.address && <div className="customer-address">{invoice.customer.address}</div>}
          {invoice.customer?.phone && <div className="customer-phone">Phone: {invoice.customer.phone}</div>}
          {invoice.customer?.email && <div className="customer-email">Email: {invoice.customer.email}</div>}
          {invoice.customer?.gstin && <div className="customer-gstin">GSTIN: {invoice.customer.gstin}</div>}
        </div>

        <div className="dates-section">
          <table className="dates-table">
            <tbody>
              <tr>
                <td className="dt-label">Invoice Date :</td>
                <td className="dt-value">{formatDate(invoice.date)}</td>
              </tr>
              <tr>
                <td className="dt-label">Terms :</td>
                <td className="dt-value">{invoice.terms || 'Due on Receipt'}</td>
              </tr>
              <tr>
                <td className="dt-label">Due Date :</td>
                <td className="dt-value">{formatDate(invoice.dueDate || invoice.date)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Line items table */}
      <div className="items-table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-desc">Item & Description</th>
              <th className="col-qty">Qty</th>
              <th className="col-rate">Rate</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => {
              const qtyFormatted = Number(item.qty || 0).toFixed(2);
              const rateFormatted = formatCurrency(item.rate);
              const amountFormatted = formatCurrency(item.amount || (Number(item.qty || 0) * Number(item.rate || 0)));

              return (
                <tr key={item.id || idx} className="invoice-row">
                  <td className="col-num">{idx + 1}</td>
                  <td className="col-desc">
                    <div className="item-name">{item.description || item.name || ''}</div>
                    {item.hsn && <div className="item-hsn">HSN/SAC: {item.hsn}</div>}
                    {item.notes && <div className="item-notes">{item.notes}</div>}
                  </td>
                  <td className="col-qty">
                    <div>{qtyFormatted}</div>
                  </td>
                  <td className="col-rate">{rateFormatted}</td>
                  <td className="col-amount">{amountFormatted}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Words Section */}
      <div className="invoice-bottom-grid">
        <div className="bottom-left-area">
          <div className="amount-in-words-block">
            <span className="words-label">Total In Words:</span>
            <span className="words-text">{words}</span>
          </div>

          {qrSrc && (
            <div className="upi-payment-box no-print-optional" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <img
                src={qrSrc}
                alt="Scan to Pay via UPI"
                width={85}
                height={85}
                style={{ borderRadius: 6, border: '1px solid #e2e8f0', padding: 2, backgroundColor: '#ffffff' }}
              />
              <div className="upi-text" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                <strong style={{ color: '#0f172a' }}>Scan & Pay via UPI</strong><br/>
                <span style={{ color: '#0284c7', fontWeight: 500 }}>GPay / PhonePe / Paytm</span><br/>
                <small style={{ color: '#64748b' }}>{settings.upiId}</small>
              </div>
            </div>
          )}

          {settings?.bankName && settings?.accountNumber && (
            <div className="bank-details-box">
              <div className="bank-title">Bank Details</div>
              <div>Bank: {settings.bankName}</div>
              <div>A/C: {settings.accountNumber}</div>
              {settings.ifscCode && <div>IFSC: {settings.ifscCode}</div>}
            </div>
          )}
        </div>

        <div className="bottom-right-summary">
          <table className="summary-table">
            <tbody>
              <tr>
                <td className="summary-label">Sub Total:</td>
                <td className="summary-value">{formatCurrency(subTotal)}</td>
              </tr>

              {invoice.discountAmount > 0 && (
                <tr>
                  <td className="summary-label">Discount:</td>
                  <td className="summary-value text-green-700">(-) {currency}{formatCurrency(invoice.discountAmount)}</td>
                </tr>
              )}

              {invoice.taxType === 'gst_intra' && invoice.taxAmount > 0 && (
                <>
                  <tr>
                    <td className="summary-label">CGST ({(invoice.taxRate / 2).toFixed(1)}%):</td>
                    <td className="summary-value">{currency}{formatCurrency(invoice.taxAmount / 2)}</td>
                  </tr>
                  <tr>
                    <td className="summary-label">SGST ({(invoice.taxRate / 2).toFixed(1)}%):</td>
                    <td className="summary-value">{currency}{formatCurrency(invoice.taxAmount / 2)}</td>
                  </tr>
                </>
              )}

              {invoice.taxType === 'gst_inter' && invoice.taxAmount > 0 && (
                <tr>
                  <td className="summary-label">IGST ({invoice.taxRate}%):</td>
                  <td className="summary-value">{currency}{formatCurrency(invoice.taxAmount)}</td>
                </tr>
              )}

              <tr className="total-row">
                <td className="summary-label"><strong>Total:</strong></td>
                <td className="summary-value"><strong>{currency}{formatCurrency(total)}</strong></td>
              </tr>

              {paymentMade > 0 && (
                <tr>
                  <td className="summary-label">Payment Made:</td>
                  <td className="summary-value text-red-600">(-) {formatCurrency(paymentMade)}</td>
                </tr>
              )}

              <tr className="balance-due-highlight">
                <td className="summary-label"><strong>Balance Due:</strong></td>
                <td className="summary-value"><strong>{currency}{formatCurrency(balanceDue)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & Signature Section */}
      <div className="invoice-footer-section">
        <div className="notes-block">
          <div className="notes-label">Notes</div>
          <div className="notes-content">{invoice.notes || settings?.defaultNotes || 'Thanks for your business.'}</div>

          <div className="terms-conditions-block">
            <div className="terms-label">Terms & Conditions</div>
            <ol className="terms-list">
              <li>Goods / Services once confirmed are non-refundable.</li>
              <li>Subject to local jurisdiction. Computer generated invoice.</li>
            </ol>
          </div>
        </div>

        <div className="signature-block">
          <div className="sig-space"></div>
          <div className="sig-line"></div>
          <div className="sig-label">Authorized Signatory</div>
          <div className="sig-biz-name">{settings?.businessName || ''}</div>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div className="invoice-bottom-tagline">
        {settings?.footerTagline || 'Crafted with ease using Vikas Billing | Fast & Professional'}
      </div>
    </div>
  );
}

export default function InvoicePrint({ invoice, settings, copyMode = 'both' }) {
  if (!invoice) return null;

  if (copyMode === 'original') {
    return (
      <div id="invoice-print-container" className="invoice-preview-wrapper">
        <InvoiceSheet invoice={invoice} settings={settings} copyType="ORIGINAL" />
      </div>
    );
  }

  if (copyMode === 'duplicate') {
    return (
      <div id="invoice-print-container" className="invoice-preview-wrapper">
        <InvoiceSheet invoice={invoice} settings={settings} copyType="DUPLICATE" />
      </div>
    );
  }

  return (
    <div id="invoice-print-container" className="invoice-preview-wrapper">
      <InvoiceSheet invoice={invoice} settings={settings} copyType="ORIGINAL" />
      <div className="print-page-break"></div>
      <InvoiceSheet invoice={invoice} settings={settings} copyType="DUPLICATE" />
    </div>
  );
}
