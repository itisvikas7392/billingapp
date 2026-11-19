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

  const itemCount = (invoice.items || []).length;
  let densityClass = 'density-normal';
  if (itemCount > 8) {
    densityClass = 'density-ultra';
  } else if (itemCount > 4) {
    densityClass = 'density-compact';
  }

  return (
    <div className={`a4-sheet ${densityClass} bg-white text-slate-800 flex flex-col justify-between`}>
      {/* 1. Header: Business Information & Invoice Metadata */}
      <div>
        <div className="flex justify-between items-start pb-3 mb-3 border-b-2 border-[#adadad] section-gap">
          <div className="max-w-[55%]">
            <h1 className="text-[14pt] font-black text-slate-900 tracking-tight leading-tight mb-0.5">
              {settings?.businessName || 'Business Name'}
            </h1>
            {settings?.addressLine1 && <div className="text-[8.5pt] text-slate-700 leading-snug">{settings.addressLine1}</div>}
            {settings?.addressLine2 && <div className="text-[8.5pt] text-slate-700 leading-snug">{settings.addressLine2}</div>}
            {settings?.country && <div className="text-[8.5pt] text-slate-700 leading-snug">{settings.country}</div>}
            {settings?.phone && <div className="text-[8.5pt] text-slate-700">Phone: {settings.phone}</div>}
            {settings?.email && <div className="text-[8.5pt] text-slate-700">Email: {settings.email}</div>}
            {settings?.gstin && <div className="text-[8.5pt] text-slate-800 font-semibold mt-0.5"><strong>GSTIN:</strong> {settings.gstin}</div>}
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="border border-slate-400 px-2 py-0.5 text-[6.5pt] font-bold text-slate-700 uppercase tracking-widest bg-white mb-1 shadow-2xs">
              {invoice.copyType || 'ORIGINAL'}
            </div>
            <div className="text-[24pt] font-black text-slate-900 tracking-tight leading-none mb-1">
              {invoice.invoiceType || settings?.invoiceTitle || 'TAX INVOICE'}
            </div>
            <div className="text-[10pt] font-extrabold text-slate-800 mb-1.5">
              # {invoice.invoiceNumber || 'INV-000155'}
            </div>

            <div className="bg-[#f5f4f3] border border-[#adadad] rounded px-3 py-1 text-right flex flex-col items-end shadow-2xs">
              <span className="text-[7.5pt] text-slate-600 uppercase font-bold tracking-wider">Balance Due</span>
              <span className="text-[11.5pt] font-black text-slate-900 leading-tight">
                {currency}{formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Customer (Bill To) & Invoice Dates */}
        <div className="flex justify-between items-start mb-3 gap-4 section-gap">
          <div className="max-w-[50%]">
            <div className="text-[8pt] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Bill To</div>
            <div className="text-[10.5pt] font-black text-slate-900 uppercase">{invoice.customer?.name || 'CASH CUSTOMER'}</div>
            {invoice.customer?.address && <div className="text-[8.5pt] text-slate-700 mt-0.5 leading-snug">{invoice.customer.address}</div>}
            {invoice.customer?.phone && <div className="text-[8.5pt] text-slate-700">Phone: {invoice.customer.phone}</div>}
            {invoice.customer?.email && <div className="text-[8.5pt] text-slate-700">Email: {invoice.customer.email}</div>}
            {invoice.customer?.gstin && <div className="text-[8.5pt] text-slate-800 font-semibold mt-0.5"><strong>GSTIN:</strong> {invoice.customer.gstin}</div>}
          </div>

          <div className="text-right">
            <table className="ml-auto text-[8.5pt] border-collapse">
              <tbody>
                <tr>
                  <td className="text-slate-500 pr-3 py-0.5 font-medium text-right">Invoice Date :</td>
                  <td className="text-slate-900 font-bold text-right">{formatDate(invoice.date)}</td>
                </tr>
                <tr>
                  <td className="text-slate-500 pr-3 py-0.5 font-medium text-right">Terms :</td>
                  <td className="text-slate-900 font-semibold text-right">{invoice.terms || 'Due on Receipt'}</td>
                </tr>
                <tr>
                  <td className="text-slate-500 pr-3 py-0.5 font-medium text-right">Due Date :</td>
                  <td className="text-slate-900 font-bold text-right">{formatDate(invoice.dueDate || invoice.date)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Line Items Table */}
        <div className="mb-3 overflow-hidden rounded border border-[#adadad] section-gap">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#3c3d3a] text-white text-[8.5pt] font-bold tracking-wider uppercase">
                <th className="py-2 px-3 text-center w-10">#</th>
                <th className="py-2 px-3">Item & Description</th>
                <th className="py-2 px-3 text-right w-16">Qty</th>
                <th className="py-2 px-3 text-right w-24">Rate</th>
                <th className="py-2 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#adadad] text-[8.5pt]">
              {(invoice.items || []).map((item, idx) => {
                const qtyFormatted = Number(item.qty || 0).toFixed(2);
                const rateFormatted = formatCurrency(item.rate);
                const amountFormatted = formatCurrency(item.amount || (Number(item.qty || 0) * Number(item.rate || 0)));

                return (
                  <tr key={item.id || idx} className="item-row hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{item.description || item.name || ''}</div>
                      {item.hsn && <div className="text-[7.5pt] text-slate-600 font-mono mt-0.5">HSN/SAC: {item.hsn}</div>}
                      {item.notes && <div className="text-[7.5pt] text-slate-600 italic mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700">{qtyFormatted}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700">{rateFormatted}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{amountFormatted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations & Notes / QR */}
        <div className="flex justify-between items-start gap-4 mb-2.5 section-gap">
          <div className="max-w-[54%] flex flex-col gap-2">
            {/* Amount in Words */}
            <div className="text-[8.5pt] text-slate-700 leading-snug">
              <span className="text-slate-500 font-medium mr-1.5">Total In Words:</span>
              <span className="text-slate-900 font-bold italic">{words}</span>
            </div>

            {/* UPI QR & Bank Details Compact Layout */}
            {(qrSrc || (settings?.bankName && settings?.accountNumber)) && (
              <div className="flex items-center gap-3 p-2 bg-[#fbfbfa] border border-[#adadad] rounded text-[8pt] leading-tight">
                {qrSrc && (
                  <img
                    src={qrSrc}
                    alt="UPI QR Code"
                    width={65}
                    height={65}
                    className="rounded border border-slate-300 p-0.5 bg-white shrink-0"
                  />
                )}
                <div className="flex-1 space-y-0.5">
                  {qrSrc && (
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Scan & Pay via UPI</span>
                      <span className="text-[7.5pt] font-mono text-slate-600">({settings.upiId})</span>
                    </div>
                  )}
                  {settings?.bankName && settings?.accountNumber && (
                    <div className="text-[7.5pt] text-slate-700">
                      <span className="font-semibold text-slate-900">A/C:</span> {settings.bankName} - {settings.accountNumber}
                      {settings.ifscCode && <> | <span className="font-semibold text-slate-900">IFSC:</span> {settings.ifscCode}</>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-[44%]">
            <table className="w-full text-[8.5pt] border-collapse">
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
                  <td className="text-slate-900 py-1.5 text-right font-black text-[10pt]">Total:</td>
                  <td className="text-slate-900 py-1.5 text-right font-black text-[10pt]">
                    {currency}{formatCurrency(total)}
                  </td>
                </tr>

                {paymentMade > 0 && (
                  <tr>
                    <td className="text-slate-600 py-1 text-right font-medium">Payment Made:</td>
                    <td className="text-red-600 py-1 text-right font-bold">
                      (-) {currency}{formatCurrency(paymentMade)}
                    </td>
                  </tr>
                )}

                <tr className="bg-[#f5f4f3] font-bold">
                  <td className="text-slate-900 py-1.5 px-2 text-right text-[8.5pt]">Balance Due:</td>
                  <td className="text-slate-900 py-1.5 px-2 text-right text-[9.5pt] font-black">
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
        <div className="flex justify-between items-end pt-2 pb-1 border-t border-[#adadad]">
          <div className="max-w-[58%] text-[8pt]">
            <div className="text-[7.5pt] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Notes</div>
            <div className="text-slate-800 leading-snug mb-2 font-medium">
              {invoice.notes || settings?.defaultNotes || 'Thanks for your business.'}
            </div>

            <div className="text-[7.5pt] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Terms & Conditions</div>
            <ol className="list-decimal pl-4 text-[7pt] text-slate-600 leading-tight">
              <li>Goods / Services once confirmed are non-refundable.</li>
              <li>Subject to local jurisdiction. Computer generated invoice.</li>
            </ol>
          </div>

          <div className="text-right">
            <div className="h-6"></div>
            <div className="w-36 border-b border-slate-900 ml-auto mb-1"></div>
            <div className="text-[7.5pt] text-slate-600 font-medium">Authorized Signatory</div>
            <div className="text-[8pt] font-bold text-slate-900">{settings?.businessName || ''}</div>
          </div>
        </div>

        {/* 6. Tagline */}
        <div className="border-t border-slate-200 pt-1 text-center text-[7pt] text-slate-500 font-medium">
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
