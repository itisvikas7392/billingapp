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

export function InvoiceSheet({ invoice, settings }) {
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
    <div className="a4-sheet bg-white text-slate-800 flex flex-col justify-between">
      {/* 1. Header: Business Information & Invoice Metadata */}
      <div>
        <div className="flex justify-between items-start pb-3.5 mb-3.5 border-b-2 border-slate-200">
          <div className="max-w-[55%]">
            <h1 className="text-[15pt] font-black text-slate-900 tracking-tight leading-tight mb-0.5">
              {settings?.businessName || 'Business Name'}
            </h1>
            {settings?.addressLine1 && <div className="text-[9pt] text-slate-600 leading-snug">{settings.addressLine1}</div>}
            {settings?.addressLine2 && <div className="text-[9pt] text-slate-600 leading-snug">{settings.addressLine2}</div>}
            {settings?.country && <div className="text-[9pt] text-slate-600 leading-snug">{settings.country}</div>}
            {settings?.phone && <div className="text-[9pt] text-slate-600">Phone: {settings.phone}</div>}
            {settings?.email && <div className="text-[9pt] text-slate-600">Email: {settings.email}</div>}
            {settings?.gstin && <div className="text-[9pt] text-slate-800 font-semibold mt-0.5"><strong>GSTIN:</strong> {settings.gstin}</div>}
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="inline-block border border-slate-300 rounded px-2.5 py-0.5 text-[7.5pt] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 mb-1">
              Original Copy
            </div>
            <div className="text-[22pt] font-black text-slate-900 tracking-tight leading-none mb-1">
              {invoice.invoiceType || settings?.invoiceTitle || 'TAX INVOICE'}
            </div>
            <div className="text-[11pt] font-extrabold text-blue-600 mb-2">
              # {invoice.invoiceNumber || 'INV-000155'}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1 text-right flex flex-col items-end shadow-xs">
              <span className="text-[8pt] text-slate-500 uppercase font-bold tracking-wider">Balance Due</span>
              <span className="text-[12pt] font-black text-slate-900 leading-tight">
                {currency}{formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Customer (Bill To) & Invoice Dates */}
        <div className="flex justify-between items-start mb-3.5 gap-4">
          <div className="max-w-[50%]">
            <div className="text-[8.5pt] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bill To</div>
            <div className="text-[11pt] font-black text-slate-900 uppercase">{invoice.customer?.name || 'CASH CUSTOMER'}</div>
            {invoice.customer?.address && <div className="text-[9pt] text-slate-600 mt-0.5 leading-snug">{invoice.customer.address}</div>}
            {invoice.customer?.phone && <div className="text-[9pt] text-slate-600">Phone: {invoice.customer.phone}</div>}
            {invoice.customer?.email && <div className="text-[9pt] text-slate-600">Email: {invoice.customer.email}</div>}
            {invoice.customer?.gstin && <div className="text-[9pt] text-slate-800 font-semibold mt-0.5"><strong>GSTIN:</strong> {invoice.customer.gstin}</div>}
          </div>

          <div className="text-right">
            <table className="ml-auto text-[9pt] border-collapse">
              <tbody>
                <tr>
                  <td className="text-slate-500 pr-3.5 py-0.5 font-medium text-right">Invoice Date :</td>
                  <td className="text-slate-900 font-bold text-right">{formatDate(invoice.date)}</td>
                </tr>
                <tr>
                  <td className="text-slate-500 pr-3.5 py-0.5 font-medium text-right">Terms :</td>
                  <td className="text-slate-900 font-semibold text-right">{invoice.terms || 'Due on Receipt'}</td>
                </tr>
                <tr>
                  <td className="text-slate-500 pr-3.5 py-0.5 font-medium text-right">Due Date :</td>
                  <td className="text-slate-900 font-bold text-right">{formatDate(invoice.dueDate || invoice.date)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Line Items Table */}
        <div className="mb-3.5 overflow-hidden rounded border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white text-[8.5pt] font-bold tracking-wider uppercase">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Item & Description</th>
                <th className="py-2.5 px-3 text-right w-16">Qty</th>
                <th className="py-2.5 px-3 text-right w-24">Rate ({currency})</th>
                <th className="py-2.5 px-3 text-right w-28">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[9pt]">
              {(invoice.items || []).map((item, idx) => {
                const qtyFormatted = Number(item.qty || 0).toFixed(2);
                const rateFormatted = formatCurrency(item.rate);
                const amountFormatted = formatCurrency(item.amount || (Number(item.qty || 0) * Number(item.rate || 0)));

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.description || item.name || ''}</div>
                      {item.hsn && <div className="text-[8pt] text-slate-500 font-mono mt-0.5">HSN/SAC: {item.hsn}</div>}
                      {item.notes && <div className="text-[8pt] text-slate-500 italic mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">{qtyFormatted}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">{rateFormatted}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{amountFormatted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations & UPI QR */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="max-w-[52%] flex flex-col gap-2.5">
            {/* Amount in Words */}
            <div className="text-[8.5pt] bg-slate-50 p-2.5 rounded-lg border-l-4 border-blue-600 leading-snug">
              <span className="text-slate-500 font-semibold mr-1">Total In Words:</span>
              <span className="text-slate-900 font-bold">{words}</span>
            </div>

            {/* UPI QR Payment */}
            {qrSrc && (
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                <img
                  src={qrSrc}
                  alt="UPI QR Code"
                  width={85}
                  height={85}
                  className="rounded border border-slate-200 p-1 bg-white shadow-2xs"
                />
                <div className="text-[8.5pt] leading-relaxed">
                  <div className="font-extrabold text-slate-900">Scan & Pay via UPI</div>
                  <div className="text-blue-600 font-bold text-[8pt]">GPay / PhonePe / Paytm / BHIM</div>
                  <div className="text-slate-600 text-[8pt] font-mono mt-0.5 font-medium">{settings.upiId}</div>
                </div>
              </div>
            )}

            {/* Bank Details */}
            {settings?.bankName && settings?.accountNumber && (
              <div className="text-[8.5pt] p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="text-[7.5pt] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Bank Details</div>
                <div className="text-slate-800 font-semibold">Bank: {settings.bankName}</div>
                <div className="text-slate-800 font-mono">A/C: {settings.accountNumber}</div>
                {settings.ifscCode && <div className="text-slate-700 font-mono">IFSC: {settings.ifscCode}</div>}
              </div>
            )}
          </div>

          <div className="w-[44%]">
            <table className="w-full text-[9pt] border-collapse">
              <tbody>
                <tr>
                  <td className="text-slate-600 py-1 text-right font-medium">Sub Total:</td>
                  <td className="text-slate-900 py-1 text-right font-bold">{formatCurrency(subTotal)}</td>
                </tr>

                {invoice.discountAmount > 0 && (
                  <tr>
                    <td className="text-slate-600 py-1 text-right font-medium">Discount:</td>
                    <td className="text-emerald-700 py-1 text-right font-bold">
                      (-) {currency}{formatCurrency(invoice.discountAmount)}
                    </td>
                  </tr>
                )}

                {invoice.taxType === 'gst_intra' && invoice.taxAmount > 0 && (
                  <>
                    <tr>
                      <td className="text-slate-600 py-1 text-right font-medium">CGST ({(invoice.taxRate / 2).toFixed(1)}%):</td>
                      <td className="text-slate-900 py-1 text-right font-bold">
                        {currency}{formatCurrency(invoice.taxAmount / 2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-slate-600 py-1 text-right font-medium">SGST ({(invoice.taxRate / 2).toFixed(1)}%):</td>
                      <td className="text-slate-900 py-1 text-right font-bold">
                        {currency}{formatCurrency(invoice.taxAmount / 2)}
                      </td>
                    </tr>
                  </>
                )}

                {invoice.taxType === 'gst_inter' && invoice.taxAmount > 0 && (
                  <tr>
                    <td className="text-slate-600 py-1 text-right font-medium">IGST ({invoice.taxRate}%):</td>
                    <td className="text-slate-900 py-1 text-right font-bold">
                      {currency}{formatCurrency(invoice.taxAmount)}
                    </td>
                  </tr>
                )}

                <tr className="border-y-2 border-slate-900">
                  <td className="text-slate-900 py-1.5 text-right font-black text-[10.5pt]">Total:</td>
                  <td className="text-slate-900 py-1.5 text-right font-black text-[10.5pt]">
                    {currency}{formatCurrency(total)}
                  </td>
                </tr>

                {paymentMade > 0 && (
                  <tr>
                    <td className="text-slate-600 py-1 text-right font-medium">Payment Made:</td>
                    <td className="text-rose-600 py-1 text-right font-bold">
                      (-) {currency}{formatCurrency(paymentMade)}
                    </td>
                  </tr>
                )}

                <tr className="bg-slate-100 font-bold">
                  <td className="text-slate-900 py-1.5 px-2 text-right text-[9pt]">Balance Due:</td>
                  <td className="text-slate-900 py-1.5 px-2 text-right text-[10pt] font-black">
                    {currency}{formatCurrency(balanceDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Footer: Notes, Terms & Authorized Signatory */}
      <div>
        <div className="flex justify-between items-end pt-2 pb-1 border-t border-dashed border-slate-300">
          <div className="max-w-[58%] text-[8.5pt]">
            <div className="text-[7.5pt] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Notes</div>
            <div className="text-slate-700 leading-snug mb-2 font-medium">
              {invoice.notes || settings?.defaultNotes || 'Thanks for your business.'}
            </div>

            <div className="text-[7.5pt] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Terms & Conditions</div>
            <ol className="list-decimal pl-4 text-[7.5pt] text-slate-500 leading-tight">
              <li>Goods / Services once confirmed are non-refundable.</li>
              <li>Subject to local jurisdiction. Computer generated invoice.</li>
            </ol>
          </div>

          <div className="text-right">
            <div className="h-8"></div>
            <div className="w-36 border-b border-slate-900 ml-auto mb-1"></div>
            <div className="text-[8pt] text-slate-500 font-medium">Authorized Signatory</div>
            <div className="text-[8.5pt] font-bold text-slate-900">{settings?.businessName || ''}</div>
          </div>
        </div>

        {/* 6. Tagline */}
        <div className="border-t border-slate-100 pt-1 text-center text-[7.5pt] text-slate-400 font-medium">
          {settings?.footerTagline || 'Crafted with ease using Vikas Billing | Fast & Professional'}
        </div>
      </div>
    </div>
  );
}

export default function InvoicePrint({ invoice, settings }) {
  if (!invoice) return null;

  return (
    <div id="invoice-print-container" className="invoice-preview-wrapper flex flex-col items-center">
      <InvoiceSheet invoice={invoice} settings={settings} />
    </div>
  );
}
