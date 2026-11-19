/**
 * Billing Math Utility for Vikas Billing App
 * Unified calculation of line item amounts, subtotal, discount, tax, total, payment made, and balance due.
 */

export function calculateLineAmount(qty, rate) {
  const q = Number(qty) || 0;
  const r = Number(rate) || 0;
  return Math.round(q * r * 100) / 100;
}

export function calculateInvoiceTotals({
  items = [],
  discountType = 'flat',
  discountValue = 0,
  taxType = 'none',
  taxRate = 0,
  paymentMade = 0
}) {
  // 1. Line items subtotal
  const subTotal = items.reduce((sum, item) => {
    const lineAmt = item.amount !== undefined ? Number(item.amount) : calculateLineAmount(item.qty, item.rate);
    return sum + (Number(lineAmt) || 0);
  }, 0);

  const roundedSubTotal = Math.round(subTotal * 100) / 100;

  // 2. Discount
  const discVal = Math.max(0, Number(discountValue) || 0);
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round((roundedSubTotal * (discVal / 100)) * 100) / 100;
  } else {
    discountAmount = Math.min(roundedSubTotal, discVal);
  }

  // 3. Taxable Amount
  const taxableAmount = Math.max(0, Math.round((roundedSubTotal - discountAmount) * 100) / 100);

  // 4. Tax (Intra-state CGST+SGST vs Inter-state IGST)
  const rate = Math.max(0, Number(taxRate) || 0);
  let taxAmount = 0;
  if (taxType === 'gst_intra' || taxType === 'gst_inter') {
    taxAmount = Math.round((taxableAmount * (rate / 100)) * 100) / 100;
  }

  // 5. Total
  const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // 6. Payment & Balance Due
  const payment = Math.max(0, Number(paymentMade) || 0);
  const balanceDue = Math.max(0, Math.round((total - payment) * 100) / 100);

  // 7. Status derivation
  let status = 'unpaid';
  if (balanceDue <= 0 && total > 0) {
    status = 'paid';
  } else if (payment > 0 && balanceDue > 0) {
    status = 'partial';
  }

  return {
    subTotal: roundedSubTotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
    balanceDue,
    status
  };
}

export function recalculateInvoice(invoice, updates = {}) {
  const merged = { ...invoice, ...updates };
  
  // Recalculate line items amounts
  const updatedItems = (merged.items || []).map(item => ({
    ...item,
    amount: calculateLineAmount(item.qty, item.rate)
  }));

  const totals = calculateInvoiceTotals({
    items: updatedItems,
    discountType: merged.discountType,
    discountValue: merged.discountValue,
    taxType: merged.taxType,
    taxRate: merged.taxRate,
    paymentMade: merged.paymentMade
  });

  return {
    ...merged,
    items: updatedItems,
    ...totals
  };
}
