/**
 * ==============================================================================
 * Google Apps Script for Vikas Billing App (Google Sheet Backend)
 * ==============================================================================
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click: Extensions -> Apps Script
 * 3. Delete any code in the editor and paste this entire code.
 * 4. Click 'Deploy' -> 'New deployment'
 * 5. Select type: 'Web app'
 *    - Description: Vikas Billing API
 *    - Execute as: 'Me' (your email)
 *    - Who has access: 'Anyone' (IMPORTANT!)
 * 6. Click 'Deploy', grant permissions, and copy the Web App URL.
 * 7. Paste that URL into the 'Google Sheets Sync' setting in Vikas Billing App!
 * ==============================================================================
 */

const SHEET_NAMES = {
  INVOICES: 'Invoices',
  CUSTOMERS: 'Customers',
  SETTINGS: 'Settings'
};

/**
 * Handle HTTP GET Requests (Fetch Invoices, Customers, Next Number)
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'getInvoices';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    ensureSheetsExist(ss);

    if (action === 'getInvoices') {
      const data = fetchInvoicesFromSheet(ss);
      return createJsonResponse({ success: true, invoices: data });
    }

    if (action === 'getNextNumber') {
      const nextNumber = calculateNextInvoiceNumber(ss);
      return createJsonResponse({ success: true, nextNumber: nextNumber });
    }

    if (action === 'ping') {
      return createJsonResponse({ success: true, message: 'Vikas Billing Google Sheet Connected!' });
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests (Save, Update, Delete Invoice)
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);

    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || 'saveInvoice';

    if (action === 'saveInvoice') {
      const invoice = payload.invoice;
      if (!invoice || !invoice.invoiceNumber) {
        return createJsonResponse({ success: false, error: 'Missing invoice data' });
      }
      saveInvoiceToSheet(ss, invoice);
      return createJsonResponse({
        success: true,
        message: 'Invoice ' + invoice.invoiceNumber + ' saved to Google Sheet!',
        invoiceNumber: invoice.invoiceNumber
      });
    }

    if (action === 'deleteInvoice') {
      const id = payload.id;
      deleteInvoiceFromSheet(ss, id);
      return createJsonResponse({ success: true, message: 'Invoice deleted from sheet' });
    }

    if (action === 'syncAll') {
      const invoices = payload.invoices || [];
      invoices.forEach(function (inv) {
        saveInvoiceToSheet(ss, inv);
      });
      return createJsonResponse({ success: true, count: invoices.length, message: 'Synced all invoices' });
    }

    return createJsonResponse({ success: false, error: 'Unsupported POST action' });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Ensures required sheets and column headers exist
 */
function ensureSheetsExist(ss) {
  let invSheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (!invSheet) {
    invSheet = ss.insertSheet(SHEET_NAMES.INVOICES);
    const headers = [
      'ID', 'Invoice Number', 'Type', 'Date', 'Due Date',
      'Customer Name', 'Phone', 'Address', 'GSTIN',
      'Items Summary', 'SubTotal', 'Discount', 'Tax Type',
      'Tax Amount', 'Total (₹)', 'Payment Made', 'Balance Due',
      'Status', 'Notes', 'Raw JSON', 'Updated At'
    ];
    invSheet.appendRow(headers);
    invSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#262626').setFontColor('#ffffff');
    invSheet.setFrozenRows(1);
  }
}

/**
 * Read all invoices from the sheet
 */
function fetchInvoicesFromSheet(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header exists

  const invoices = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawJson = row[19]; // Col T (Raw JSON)

    if (rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
      try {
        invoices.push(JSON.parse(rawJson));
        continue;
      } catch (ex) {
        // Fallback to row fields if JSON parse fails
      }
    }

    // Reconstruct invoice object from columns
    invoices.push({
      id: row[0],
      invoiceNumber: row[1],
      invoiceType: row[2] || 'TAX INVOICE',
      date: formatDate(row[3]),
      dueDate: formatDate(row[4]),
      customer: {
        name: row[5],
        phone: row[6],
        address: row[7],
        gstin: row[8]
      },
      subTotal: Number(row[10]) || 0,
      discountAmount: Number(row[11]) || 0,
      taxType: row[12],
      taxAmount: Number(row[13]) || 0,
      total: Number(row[14]) || 0,
      paymentMade: Number(row[15]) || 0,
      balanceDue: Number(row[16]) || 0,
      status: row[17] || 'paid',
      notes: row[18] || '',
      updatedAt: row[20]
    });
  }

  return invoices;
}

/**
 * Insert or update an invoice in the sheet
 */
function saveInvoiceToSheet(ss, invoice) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  const data = sheet.getDataRange().getValues();

  let targetRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(invoice.id) || String(data[i][1]) === String(invoice.invoiceNumber)) {
      targetRowIndex = i + 1; // 1-indexed for Sheet API
      break;
    }
  }

  // Generate readable items summary (e.g. "2x DSC, 1x Token")
  const itemsSummary = (invoice.items || []).map(function (it) {
    return (it.qty || 1) + 'x ' + (it.description || it.name || 'Item') + ' (@₹' + (it.rate || 0) + ')';
  }).join('; ');

  const rowData = [
    invoice.id || ('inv-' + Date.now()),
    invoice.invoiceNumber || 'INV-000155',
    invoice.invoiceType || 'TAX INVOICE',
    invoice.date || '',
    invoice.dueDate || invoice.date || '',
    invoice.customer ? (invoice.customer.name || '') : '',
    invoice.customer ? (invoice.customer.phone || '') : '',
    invoice.customer ? (invoice.customer.address || '') : '',
    invoice.customer ? (invoice.customer.gstin || '') : '',
    itemsSummary,
    Number(invoice.subTotal) || 0,
    Number(invoice.discountAmount) || 0,
    invoice.taxType || 'none',
    Number(invoice.taxAmount) || 0,
    Number(invoice.total) || 0,
    Number(invoice.paymentMade) || 0,
    Number(invoice.balanceDue) || 0,
    invoice.status || 'paid',
    invoice.notes || '',
    JSON.stringify(invoice),
    new Date().toISOString()
  ];

  if (targetRowIndex > 0) {
    sheet.getRange(targetRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Delete invoice by ID or Number
 */
function deleteInvoiceFromSheet(ss, id) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id) || String(data[i][1]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Scan sheet to calculate next available invoice number
 */
function calculateNextInvoiceNumber(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (!sheet) return 'INV-000156';

  const data = sheet.getDataRange().getValues();
  let maxNum = 155;

  for (let i = 1; i < data.length; i++) {
    const invNum = String(data[i][1] || '');
    const matches = invNum.match(/\d+/g);
    if (matches && matches.length > 0) {
      const num = parseInt(matches[matches.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const next = maxNum + 1;
  return 'INV-' + ('000000' + next).slice(-6);
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
