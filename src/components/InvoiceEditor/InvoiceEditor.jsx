import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Download, 
  Copy, 
  ChevronRight, 
  UserCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import InvoicePrint from '../InvoicePrint/InvoicePrint';

export default function InvoiceEditor({
  invoice,
  onInvoiceChange,
  settings,
  customers,
  catalogItems,
  invoices,
  onSaveInvoice,
  onSaveAndNext,
  onCloneNext,
  onSelectPastInvoice,
  onNewInvoice,
  isSaving,
  onPrint,
  onDownloadPdf
}) {
  const [copyMode, setCopyMode] = useState('both');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');

  const updateField = (field, value) => {
    onInvoiceChange({ ...invoice, [field]: value });
  };

  const updateCustomerField = (field, value) => {
    onInvoiceChange({
      ...invoice,
      customer: { ...invoice.customer, [field]: value }
    });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...(invoice.items || [])];
    items[index] = { ...items[index], [field]: value };

    // Auto-calculate amount
    const qty = Number(items[index].qty) || 0;
    const rate = Number(items[index].rate) || 0;
    items[index].amount = Number((qty * rate).toFixed(2));

    recalculateWithItems(items, invoice.discountType, invoice.discountValue, invoice.taxType, invoice.taxRate, invoice.paymentMade);
  };

  const addItemRow = (name = '', qty = 1, rate = 0, hsn = '') => {
    const items = [...(invoice.items || [])];
    items.push({
      id: 'row-' + Date.now(),
      description: name,
      hsn: hsn,
      qty: Number(qty) || 1,
      rate: Number(rate) || 0,
      amount: Number(((Number(qty) || 1) * (Number(rate) || 0)).toFixed(2))
    });
    recalculateWithItems(items, invoice.discountType, invoice.discountValue, invoice.taxType, invoice.taxRate, invoice.paymentMade);
  };

  const removeItemRow = (index) => {
    const items = (invoice.items || []).filter((_, i) => i !== index);
    recalculateWithItems(items, invoice.discountType, invoice.discountValue, invoice.taxType, invoice.taxRate, invoice.paymentMade);
  };

  const recalculateWithItems = (items, discType, discVal, taxType, taxRate, paidVal) => {
    const subTotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    // Discount
    let discountAmount = 0;
    const dVal = Number(discVal) || 0;
    if (discType === 'percent') {
      discountAmount = (subTotal * dVal) / 100;
    } else {
      discountAmount = dVal;
    }
    if (discountAmount > subTotal) discountAmount = subTotal;

    const afterDiscount = Math.max(0, subTotal - discountAmount);

    // Tax
    let taxAmount = 0;
    const tRate = Number(taxRate) || 0;
    if (taxType && taxType !== 'none' && tRate > 0) {
      taxAmount = (afterDiscount * tRate) / 100;
    }

    const total = Number((afterDiscount + taxAmount).toFixed(2));
    const paymentMade = Number(paidVal) || 0;
    const balanceDue = Math.max(0, Number((total - paymentMade).toFixed(2)));

    let status = 'paid';
    if (balanceDue === total && total > 0) {
      status = 'unpaid';
    } else if (balanceDue > 0) {
      status = 'partial';
    }

    onInvoiceChange({
      ...invoice,
      items,
      subTotal: Number(subTotal.toFixed(2)),
      discountType: discType,
      discountValue: dVal,
      discountAmount: Number(discountAmount.toFixed(2)),
      taxType,
      taxRate: tRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      total,
      paymentMade,
      balanceDue,
      status
    });
  };

  const handleDiscountChange = (type, val) => {
    recalculateWithItems(invoice.items, type, val, invoice.taxType, invoice.taxRate, invoice.paymentMade);
  };

  const handleTaxChange = (type, rate) => {
    recalculateWithItems(invoice.items, invoice.discountType, invoice.discountValue, type, rate, invoice.paymentMade);
  };

  const handlePaymentChange = (val) => {
    recalculateWithItems(invoice.items, invoice.discountType, invoice.discountValue, invoice.taxType, invoice.taxRate, val);
  };

  const handleInsertCatalog = () => {
    if (!selectedCatalogId) return;
    const item = catalogItems.find(i => i.id === selectedCatalogId);
    if (item) {
      addItemRow(item.name, 1, item.rate, item.hsn);
      setSelectedCatalogId('');
    }
  };

  const handleQuickCustomerSelect = (e) => {
    const custId = e.target.value;
    if (!custId) return;
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      onInvoiceChange({
        ...invoice,
        customer: {
          name: cust.name || '',
          phone: cust.phone || '',
          email: cust.email || '',
          address: cust.address || '',
          gstin: cust.gstin || ''
        }
      });
    }
  };

  return (
    <div className="workspace-split">
      {/* LEFT COLUMN: FORM CONTROLS */}
      <div className="editor-pane">
        <div className="editor-toolbar">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={onNewInvoice}>
              <Plus size={14} /> New Bill
            </button>
            <select
              className="form-control"
              style={{ width: '190px', fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
              value={invoice.id}
              onChange={(e) => onSelectPastInvoice(e.target.value)}
            >
              <option value="">-- Choose past bill --</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customer?.name || 'Customer'} (₹{inv.total})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={onPrint} title="Print A4 Copy (Ctrl+P)">
              <Printer size={14} /> Print
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onDownloadPdf} title="Download PDF">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Invoice Header Details */}
        <div className="form-section">
          <div className="form-section-title">Invoice Details</div>
          <div className="grid-3">
            <div className="form-group">
              <label>Bill Type</label>
              <select
                className="form-control"
                value={invoice.invoiceType || 'TAX INVOICE'}
                onChange={(e) => updateField('invoiceType', e.target.value)}
              >
                <option value="TAX INVOICE">TAX INVOICE</option>
                <option value="RETAIL INVOICE">RETAIL INVOICE</option>
                <option value="BILL OF SUPPLY">BILL OF SUPPLY</option>
                <option value="CASH MEMO">CASH MEMO</option>
                <option value="PROFORMA INVOICE">PROFORMA INVOICE</option>
              </select>
            </div>

            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                className="form-control"
                value={invoice.invoiceNumber || ''}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Invoice Date</label>
              <input
                type="date"
                className="form-control"
                value={invoice.date || ''}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Terms</label>
              <select
                className="form-control"
                value={invoice.terms || 'Due on Receipt'}
                onChange={(e) => updateField('terms', e.target.value)}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                className="form-control"
                value={invoice.dueDate || invoice.date || ''}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="form-section-title" style={{ margin: 0 }}>Customer (Bill To)</div>
            <select
              className="form-control"
              style={{ width: '220px', fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
              onChange={handleQuickCustomerSelect}
              defaultValue=""
            >
              <option value="">⚡ Select Saved Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter customer name"
                value={invoice.customer?.name || ''}
                onChange={(e) => updateCustomerField('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="10-digit mobile number"
                value={invoice.customer?.phone || ''}
                onChange={(e) => updateCustomerField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>GSTIN (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="15-digit GSTIN"
                value={invoice.customer?.gstin || ''}
                onChange={(e) => updateCustomerField('gstin', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="City, State, PIN"
                value={invoice.customer?.address || ''}
                onChange={(e) => updateCustomerField('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="form-section-title" style={{ margin: 0 }}>Items & Services</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                style={{ width: '220px', fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                <option value="">-- Choose from Catalog --</option>
                {catalogItems.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.name} (₹{it.rate})
                  </option>
                ))}
              </select>
              <button className="btn btn-secondary btn-sm" onClick={handleInsertCatalog}>
                + Insert
              </button>
            </div>
          </div>

          <table className="editor-items-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Item / Description</th>
                <th style={{ width: '16%' }}>HSN/SAC</th>
                <th style={{ width: '12%' }}>Qty</th>
                <th style={{ width: '16%' }}>Rate (₹)</th>
                <th style={{ width: '14%' }}>Amount (₹)</th>
                <th style={{ width: '20px' }}></th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, index) => (
                <tr key={item.id || index}>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={item.description || item.name || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item name"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={item.hsn || ''}
                      onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                      placeholder="HSN code"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={item.qty || ''}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={item.rate || ''}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, paddingRight: '0.5rem' }}>
                    ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.2rem 0.4rem' }}
                      onClick={() => removeItemRow(index)}
                      title="Delete row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => addItemRow('New Item', 1, 0, '')}>
            <Plus size={14} /> + Add Line Item
          </button>
        </div>

        {/* Financial Summary & Taxes */}
        <div className="form-section">
          <div className="form-section-title">Summary & Payment</div>
          <div className="grid-2">
            <div>
              <div className="form-group">
                <label>Discount</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-control"
                    style={{ width: '100px' }}
                    value={invoice.discountType || 'flat'}
                    onChange={(e) => handleDiscountChange(e.target.value, invoice.discountValue)}
                  >
                    <option value="flat">₹ Flat</option>
                    <option value="percent">% Pct</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="0"
                    value={invoice.discountValue || ''}
                    onChange={(e) => handleDiscountChange(invoice.discountType || 'flat', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>GST / Tax Option</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-control"
                    value={invoice.taxType || 'none'}
                    onChange={(e) => handleTaxChange(e.target.value, invoice.taxRate)}
                  >
                    <option value="none">No Tax (Exempted / Zero)</option>
                    <option value="gst_intra">Intra-State GST (CGST + SGST)</option>
                    <option value="gst_inter">Inter-State GST (IGST)</option>
                  </select>
                  {invoice.taxType && invoice.taxType !== 'none' && (
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      style={{ width: '90px' }}
                      placeholder="18%"
                      value={invoice.taxRate || ''}
                      onChange={(e) => handleTaxChange(invoice.taxType, e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Notes / Instructions</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={invoice.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Notes to appear on invoice"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sub Total:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#16a34a' }}>
                  <span>Discount:</span>
                  <span>(-) ₹{Number(invoice.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#0284c7' }}>
                  <span>Tax Amount:</span>
                  <span>(+) ₹{Number(invoice.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '2px solid #e2e8f0', marginTop: '0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                <span>Total Amount:</span>
                <span>₹{Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Payment Received (₹):</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={invoice.paymentMade !== undefined ? invoice.paymentMade : ''}
                  onChange={(e) => handlePaymentChange(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px dashed #cbd5e1', marginTop: '0.5rem', fontWeight: 700, color: invoice.balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
                <span>Balance Due:</span>
                <span>₹{Number(invoice.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingBottom: '2rem' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1.2, padding: '0.75rem 1rem', fontSize: '0.95rem' }}
            onClick={onSaveInvoice}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="spin" style={{ display: 'inline', marginRight: 6 }} />
                Saving to Sheet...
              </>
            ) : (
              <>
                <Save size={16} style={{ display: 'inline', marginRight: 6 }} />
                Save Invoice (Ctrl + S)
              </>
            )}
          </button>

          <button
            className="btn btn-secondary"
            style={{ flex: 1.2, padding: '0.75rem 1rem', fontSize: '0.95rem' }}
            onClick={onSaveAndNext}
            disabled={isSaving}
          >
            <ChevronRight size={16} style={{ display: 'inline', marginRight: 4 }} />
            Save & Next Bill
          </button>

          <button
            className="btn btn-secondary"
            style={{ flex: 0.8, padding: '0.75rem 0.5rem', fontSize: '0.88rem' }}
            onClick={onCloneNext}
            title="Clone items to next invoice"
          >
            <Copy size={14} style={{ display: 'inline', marginRight: 4 }} />
            Clone Bill
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE A4 SHEET PREVIEW */}
      <div className="preview-pane">
        <div className="preview-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Print View:</span>
            <select
              className="form-control"
              style={{ width: '160px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              value={copyMode}
              onChange={(e) => setCopyMode(e.target.value)}
            >
              <option value="both">Both (Original + Duplicate)</option>
              <option value="original">Original Only (1 Page)</option>
              <option value="duplicate">Duplicate Only (1 Page)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={onPrint}>
              <Printer size={14} /> Print Bill
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onDownloadPdf}>
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
          <InvoicePrint invoice={invoice} settings={settings} copyMode={copyMode} />
        </div>
      </div>
    </div>
  );
}
