/**
 * UPI QR Code Generator
 */

export function createUpiQrUrl(options = {}) {
  const { upiId, businessName, amount, invoiceNo } = options;
  if (!upiId) return '';
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent((businessName || 'Merchant').trim());
  const cleanAmount = (amount && Number(amount) > 0) ? Number(amount).toFixed(2) : '';
  const cleanRef = encodeURIComponent((invoiceNo || 'Invoice').trim());

  let url = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR&tn=${cleanRef}`;
  if (cleanAmount) {
    url += `&am=${cleanAmount}`;
  }
  return url;
}

export function getQrImageUrl(text, size = 120) {
  if (!text) return '';
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`;
}
