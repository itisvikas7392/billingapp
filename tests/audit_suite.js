/**
 * Comprehensive Automated Audit & Test Suite for Vikas Billing App
 * Tests all modules, DOM bindings, calculations, and live Google Sheet database.
 */

const fs = require('fs');
const path = require('path');

// Setup mock browser environment for Node.js
global.window = global;
global.document = {
  getElementById: (id) => ({
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => ({ style: {} }),
    appendChild: () => {},
    prepend: () => {},
    focus: () => {}
  }),
  querySelectorAll: () => []
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

// Load modules
const { convertNumberToIndianWords } = require('../js/number-to-words.js');
global.convertNumberToIndianWords = convertNumberToIndianWords;
const { StorageManager, DEFAULT_SETTINGS, DEFAULT_ITEMS, DEFAULT_CUSTOMERS, DEFAULT_INVOICE_SAMPLE } = require('../js/storage.js');
global.StorageManager = StorageManager;
const { GoogleSheetSync } = require('../js/google-sheet.js');
global.GoogleSheetSync = GoogleSheetSync;
const { InvoiceTemplate } = require('../js/invoice-template.js');
global.InvoiceTemplate = InvoiceTemplate;

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '- ' + details : ''}`);
    failedTests++;
  }
}

async function runAudit() {
  console.log('\n======================================================');
  console.log('🧪 VIKAS BILLING APP - COMPREHENSIVE COMPONENT AUDIT');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // 1. Number To Words Engine
  // -------------------------------------------------------------------------
  console.log('--- [1/6] Testing Number to Indian Words Engine ---');
  assert(convertNumberToIndianWords(0) === 'Indian Rupee Zero Only', 'Amount 0 converts to Zero Only');
  assert(convertNumberToIndianWords(2500) === 'Indian Rupee Two Thousand Five Hundred Only', 'Amount 2500 converts accurately');
  assert(convertNumberToIndianWords(2500.50).includes('Fifty Paise'), 'Decimal paise conversion works');
  assert(convertNumberToIndianWords(100000).includes('One Lakh'), 'Lakhs scale works');
  assert(convertNumberToIndianWords(10000000).includes('One Crore'), 'Crores scale works');

  // -------------------------------------------------------------------------
  // 2. Storage & Numbering Logic
  // -------------------------------------------------------------------------
  console.log('\n--- [2/6] Testing Local Storage & Next Number Computation ---');
  localStorage.clear();
  const settings = StorageManager.getSettings();
  assert(settings.businessName === 'Vikas Digital Signature Shop', 'Default settings loaded');
  assert(settings.googleSheetUrl && settings.googleSheetUrl.startsWith('https://script.google.com/'), 'Google Sheet URL set in settings');

  const defaultInvoices = StorageManager.getInvoices();
  assert(defaultInvoices.length > 0, 'Default invoices initialized');
  assert(defaultInvoices[0].invoiceNumber === 'INV-000155', 'Default invoice is INV-000155');

  const nextCalc = StorageManager.computeNextInvoiceNumber();
  assert(nextCalc.nextNumber === 156, `Next invoice number computed as 156 (got ${nextCalc.nextNumber})`);
  assert(nextCalc.formattedInvoiceNumber === 'INV-000156', `Formatted invoice number is INV-000156 (got ${nextCalc.formattedInvoiceNumber})`);

  // Test Customer Directory
  StorageManager.addCustomerIfNew({ name: 'TEST USER', phone: '9999999999' });
  const customers = StorageManager.getCustomers();
  assert(customers.some(c => c.name === 'TEST USER'), 'Customer successfully added');

  // Test Backup Export & Import
  const backupJson = StorageManager.exportAllData();
  assert(typeof backupJson === 'string' && backupJson.includes('Vikas Digital Signature Shop'), 'Backup JSON exported');
  const importRes = StorageManager.importData(backupJson);
  assert(importRes.success === true, 'Backup JSON imported successfully');

  // -------------------------------------------------------------------------
  // 3. Invoice Template & Calculations
  // -------------------------------------------------------------------------
  console.log('\n--- [3/6] Testing Invoice Template Rendering & Financials ---');
  assert(InvoiceTemplate.formatCurrency(2500) === '2,500.00', 'Currency format 2500 -> 2,500.00');
  assert(InvoiceTemplate.formatDate('2026-11-17') === '17/11/2026', 'Date format 2026-11-17 -> 17/11/2026');

  const htmlOriginal = InvoiceTemplate.renderMultiCopyInvoice(defaultInvoices[0], settings, 'original');
  assert(htmlOriginal.includes('<div class="copy-badge">ORIGINAL</div>'), 'Original copy badge rendered');
  assert(htmlOriginal.includes('INV-000155'), 'Invoice number in rendered HTML');
  assert(htmlOriginal.includes('BHARAT SINGH'), 'Customer name in rendered HTML');
  assert(htmlOriginal.includes('Digital Signature Certificate'), 'Line item in rendered HTML');

  const htmlDuplicate = InvoiceTemplate.renderMultiCopyInvoice(defaultInvoices[0], settings, 'duplicate');
  assert(htmlDuplicate.includes('<div class="copy-badge">DUPLICATE</div>'), 'Duplicate copy badge rendered');

  // -------------------------------------------------------------------------
  // 4. HTML DOM Bindings Integrity Audit
  // -------------------------------------------------------------------------
  console.log('\n--- [4/6] Auditing HTML Elements and ID Bindings ---');
  const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Check required IDs used in app.js
  const requiredIds = [
    'header-brand-name',
    'btn-new-invoice',
    'btn-download-pdf',
    'btn-print',
    'btn-toolbar-print',
    'btn-toolbar-pdf',
    'select-copy-mode',
    'select-past-invoice',
    'btn-quick-new-inv',
    'editor-active-mode',
    'inv-type',
    'inv-number',
    'inv-date',
    'inv-terms',
    'inv-due-date',
    'cust-name',
    'cust-phone',
    'cust-email',
    'cust-address',
    'cust-gstin',
    'editor-items-body',
    'btn-add-item',
    'select-quick-catalog',
    'btn-insert-catalog-item',
    'btn-select-customer',
    'tax-type',
    'tax-rate-group',
    'tax-rate',
    'discount-val',
    'payment-made',
    'editor-subtotal',
    'editor-discount-row',
    'editor-discount',
    'editor-tax-row',
    'editor-tax',
    'editor-total',
    'editor-payment-display',
    'editor-balance',
    'editor-status-badge',
    'inv-notes',
    'btn-save-invoice',
    'btn-save-and-next',
    'btn-clone-next-bill',
    'btn-duplicate-invoice',
    'btn-delete-invoice',
    'invoice-print-container',
    'invoices-history-body',
    'search-invoices-input',
    'btn-history-new-inv',
    'stat-total-count',
    'stat-total-billed',
    'stat-total-received',
    'stat-total-due',
    'count-filter-all',
    'count-filter-paid',
    'count-filter-pending',
    'customers-table-body',
    'btn-modal-add-customer',
    'catalog-table-body',
    'btn-modal-add-item',
    'settings-form',
    'btn-save-settings',
    'btn-sync-next-number',
    'set-auto-advance-print',
    'btn-export-json',
    'btn-import-json-trigger',
    'import-json-file',
    'set-sheet-url',
    'btn-test-sheet',
    'btn-fetch-from-sheet',
    'sheet-sync-status',
    'sheet-sync-text',
    'toast-container'
  ];

  let missingIds = [];
  requiredIds.forEach(id => {
    const pattern = new RegExp(`id=["']${id}["']`);
    if (!pattern.test(htmlContent)) {
      missingIds.push(id);
    }
  });

  assert(missingIds.length === 0, `All ${requiredIds.length} critical UI DOM elements exist in index.html`, missingIds.join(', '));
  assert(!htmlContent.includes('LocalStorage Mode'), 'Zero mentions of LocalStorage Mode in index.html');

  // -------------------------------------------------------------------------
  // 5. Live Google Sheet Database Endpoint Checks
  // -------------------------------------------------------------------------
  console.log('\n--- [5/6] Testing Live Google Sheet Web App Connection ---');
  const sheetUrl = GoogleSheetSync.getAppScriptUrl();
  console.log('  Database URL:', sheetUrl);

  try {
    // Ping Test
    const pingRes = await GoogleSheetSync.testConnection();
    assert(pingRes && pingRes.success === true, 'Google Sheet Database Ping successful', JSON.stringify(pingRes));

    // Next Number Test
    const nextNum = await GoogleSheetSync.getNextInvoiceNumber();
    assert(nextNum && nextNum.startsWith('INV-'), `Authoritative Next Number fetched from Google Sheet: ${nextNum}`);

    // Fetch Invoices Test
    const fetchRes = await GoogleSheetSync.fetchInvoices();
    assert(fetchRes && fetchRes.success === true && Array.isArray(fetchRes.invoices), `Fetched ${fetchRes.invoices ? fetchRes.invoices.length : 0} live invoices from Google Sheet`);

    // Live Save Test
    const testId = 'inv-audit-' + Date.now();
    const testInv = {
      id: testId,
      invoiceNumber: 'INV-TEST-999',
      invoiceType: 'TAX INVOICE',
      copyType: 'ORIGINAL',
      date: '2026-11-18',
      dueDate: '2026-11-18',
      customer: { name: 'AUDIT AUTOMATION', phone: '1234567890' },
      items: [{ id: 'r1', description: 'Audit Item', qty: 1, rate: 100, amount: 100 }],
      subTotal: 100,
      total: 100,
      paymentMade: 100,
      balanceDue: 0,
      status: 'paid',
      notes: 'Audit verification test row',
      updatedAt: new Date().toISOString()
    };

    console.log('  Testing live database WRITE (saveInvoice)...');
    const saveRes = await GoogleSheetSync.saveInvoice(testInv);
    assert(saveRes && saveRes.success === true, 'Live invoice saved to Google Sheet', JSON.stringify(saveRes));

    // Live Delete Cleanup Test
    console.log('  Testing live database DELETE (deleteInvoice)...');
    const delRes = await GoogleSheetSync.deleteInvoice(testId);
    assert(delRes && delRes.success === true, 'Live test invoice cleaned up from Google Sheet', JSON.stringify(delRes));

  } catch (netErr) {
    console.error('Network check error:', netErr);
    assert(false, 'Live Google Sheet network operations', netErr.message);
  }

  // -------------------------------------------------------------------------
  // 6. Final Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 AUDIT SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit();
