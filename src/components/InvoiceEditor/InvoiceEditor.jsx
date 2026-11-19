import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Download, 
  Copy, 
  ChevronRight, 
  FileText,
  RefreshCw,
  Sparkles,
  User,
  CreditCard,
  Layers
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
    <div className="flex flex-1 w-full h-[calc(100vh-65px)] overflow-hidden bg-slate-100">
      {/* LEFT COLUMN: FORM CONTROLS */}
      <div className="w-[48%] min-w-[460px] max-w-[620px] bg-white border-r border-slate-200 overflow-y-auto p-5 pb-20 flex flex-col gap-4.5 shadow-sm">
        {/* Top Mini Toolbar */}
        <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
          <div className="flex gap-2 items-center">
            <button 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
              onClick={onNewInvoice}
            >
              <Plus size={14} /> New Bill
            </button>
            <select
              className="w-52 text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

          <div className="flex gap-2 items-center">
            <button 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
              onClick={onPrint} 
              title="Print A4 Copy (Ctrl+P)"
            >
              <Printer size={13} /> Print
            </button>
            <button 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
              onClick={onDownloadPdf} 
              title="Download PDF"
            >
              <Download size={13} /> PDF
            </button>
          </div>
        </div>

        {/* 1. Invoice Header Details Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 transition hover:border-slate-300">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText size={15} className="text-blue-600" /> Invoice Metadata
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bill Type</label>
              <select
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium"
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

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Invoice Number *</label>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                value={invoice.invoiceNumber || ''}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Invoice Date</label>
              <input
                type="date"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium"
                value={invoice.date || ''}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Terms</label>
              <select
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium"
                value={invoice.terms || 'Due on Receipt'}
                onChange={(e) => updateField('terms', e.target.value)}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Due Date</label>
              <input
                type="date"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium"
                value={invoice.dueDate || invoice.date || ''}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 2. Customer Information Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 transition hover:border-slate-300">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User size={15} className="text-blue-600" /> Customer (Bill To)
            </div>
            <select
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
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

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name *</label>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                placeholder="Enter customer name"
                value={invoice.customer?.name || ''}
                onChange={(e) => updateCustomerField('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                placeholder="10-digit mobile number"
                value={invoice.customer?.phone || ''}
                onChange={(e) => updateCustomerField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white uppercase font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                placeholder="15-digit GSTIN"
                value={invoice.customer?.gstin || ''}
                onChange={(e) => updateCustomerField('gstin', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Billing Address</label>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                placeholder="City, State, PIN"
                value={invoice.customer?.address || ''}
                onChange={(e) => updateCustomerField('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 3. Line Items Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 transition hover:border-slate-300">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={15} className="text-amber-500" /> Items & Services
            </div>
            <div className="flex gap-2">
              <select
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none max-w-[200px]"
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                <option value="">-- Catalog Item --</option>
                {catalogItems.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.name} (₹{it.rate})
                  </option>
                ))}
              </select>
              <button 
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition"
                onClick={handleInsertCatalog}
              >
                + Insert
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-2 mb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10.5pt] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-1 w-[40%] text-xs">Description</th>
                  <th className="py-2 px-1 w-[16%] text-xs">HSN</th>
                  <th className="py-2 px-1 w-[14%] text-xs text-right">Qty</th>
                  <th className="py-2 px-1 w-[16%] text-xs text-right">Rate (₹)</th>
                  <th className="py-2 px-1 w-[14%] text-xs text-right">Amount (₹)</th>
                  <th className="py-2 px-1 w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items || []).map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="py-1.5 px-1">
                      <input
                        type="text"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        value={item.description || item.name || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item name"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="text"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 font-mono text-slate-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        value={item.hsn || ''}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        placeholder="HSN"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        step="any"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 text-right font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        value={item.qty || ''}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        step="any"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 text-right font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        value={item.rate || ''}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1 text-right font-bold text-xs text-slate-900 pr-1">
                      ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <button
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
          </div>

          <button 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mt-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition"
            onClick={() => addItemRow('New Item', 1, 0, '')}
          >
            <Plus size={14} /> + Add Line Item
          </button>
        </div>

        {/* 4. Financial Summary & Taxes Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 transition hover:border-slate-300">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CreditCard size={15} className="text-blue-600" /> Summary & Payment
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Discount</label>
                <div className="flex gap-2">
                  <select
                    className="w-24 text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={invoice.discountType || 'flat'}
                    onChange={(e) => handleDiscountChange(e.target.value, invoice.discountValue)}
                  >
                    <option value="flat">₹ Flat</option>
                    <option value="percent">% Pct</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    className="flex-1 text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                    value={invoice.discountValue || ''}
                    onChange={(e) => handleDiscountChange(invoice.discountType || 'flat', e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST / Tax Option</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
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
                      className="w-20 text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      placeholder="18%"
                      value={invoice.taxRate || ''}
                      onChange={(e) => handleTaxChange(invoice.taxType, e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes / Instructions</label>
                <textarea
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  rows={2}
                  value={invoice.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Notes to appear on invoice"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sub Total:</span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>(-) ₹{Number(invoice.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-blue-600 font-semibold">
                    <span>Tax Amount:</span>
                    <span>(+) ₹{Number(invoice.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2.5 border-t-2 border-slate-300 text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span>₹{Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-dashed border-slate-300">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Received (₹):</label>
                <input
                  type="number"
                  step="any"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  value={invoice.paymentMade !== undefined ? invoice.paymentMade : ''}
                  onChange={(e) => handlePaymentChange(e.target.value)}
                />

                <div className={`flex justify-between mt-2.5 pt-2 border-t border-slate-200 font-black text-xs ${invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <span>Balance Due:</span>
                  <span>₹{Number(invoice.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex gap-3 pt-2 pb-8">
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition transform active:scale-[0.99] disabled:opacity-50"
            onClick={onSaveInvoice}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Saving to Sheet...
              </>
            ) : (
              <>
                <Save size={16} /> Save Invoice (Ctrl + S)
              </>
            )}
          </button>

          <button
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-sm transition transform active:scale-[0.99] disabled:opacity-50"
            onClick={onSaveAndNext}
            disabled={isSaving}
          >
            <ChevronRight size={16} /> Save & Next Bill
          </button>

          <button
            className="inline-flex items-center justify-center gap-1.5 py-3.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition"
            onClick={onCloneNext}
            title="Clone items to next invoice"
          >
            <Copy size={15} /> Clone Bill
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE A4 SHEET PREVIEW */}
      <div className="flex-1 preview-pane-bg overflow-y-auto p-6 flex flex-col items-center">
        {/* Floating Top Indicator & Quick Actions */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md text-white border border-white/10 px-6 py-2.5 rounded-full flex items-center justify-between gap-6 shadow-2xl mb-6 max-w-xl w-full">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wide text-slate-100 flex items-center gap-1.5">
              📄 Single Page Invoice <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">A4 Ready</span>
            </span>
          </div>

          <div className="flex gap-2">
            <button 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition transform active:scale-95"
              onClick={onPrint} 
              title="Print Bill (Ctrl + P)"
            >
              <Printer size={13} /> Print Bill
            </button>
            <button 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
              onClick={onDownloadPdf} 
              title="Download PDF"
            >
              <Download size={13} /> PDF
            </button>
          </div>
        </div>

        {/* The Exact Single Page A4 Invoice floating on executive background */}
        <div className="overflow-x-auto p-4 flex justify-center w-full">
          <InvoicePrint invoice={invoice} settings={settings} />
        </div>
      </div>
    </div>
  );
}
