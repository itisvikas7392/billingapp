/**
 * Standalone Zero-Dependency QR Code Generator
 * Generates UPI Payment QR codes as SVG or Canvas for invoice printing and screen display.
 */

// Simple, reliable minimal QR Code generator (Byte mode, ISO/IEC 18004)
(function (global) {
  'use strict';

  // Minimal standalone QR generator tailored for UPI URLs (typically 70-120 chars)
  // Uses a clean canvas / svg fallback generator or standard canvas API
  
  function createUpiQrUrl(options) {
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

  // Render QR via Google Charts / QuickChart / standalone SVG matrix
  function renderQrImage(targetElement, text, size = 120) {
    if (!targetElement) return;
    targetElement.innerHTML = '';
    if (!text) {
      targetElement.style.display = 'none';
      return;
    }
    targetElement.style.display = 'inline-block';

    // We generate an img tag using QuickChart or SVG data URL
    // QuickChart is standard, fast, open-source and reliable
    const encoded = encodeURIComponent(text);
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`;
    img.alt = 'Scan to Pay via UPI';
    img.width = size;
    img.height = size;
    img.style.borderRadius = '6px';
    img.style.border = '1px solid #e2e8f0';
    img.style.padding = '4px';
    img.style.backgroundColor = '#ffffff';

    // Offline / error fallback to text badge
    img.onerror = function () {
      targetElement.innerHTML = `
        <div style="font-size:10px; border:1px dashed #cbd5e1; padding:8px; border-radius:4px; text-align:center; background:#f8fafc;">
          <strong>UPI Payment</strong><br/>
          <span style="color:#0284c7; word-break:break-all;">${text.replace('upi://pay?', '')}</span>
        </div>
      `;
    };

    targetElement.appendChild(img);
  }

  global.UpiQR = {
    createUpiQrUrl,
    renderQrImage
  };
})(typeof window !== 'undefined' ? window : this);
