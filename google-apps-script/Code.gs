/**
 * ==============================================================================
 * Google Apps Script for Vikas Billing App (Google Sheet Cloud Database)
 * Multi-Sheet Database: Invoices, Customers & Products
 * ==============================================================================
 * Instructions to Update/Deploy:
 * 1. Open your Google Sheet
 * 2. Click: Extensions -> Apps Script
 * 3. Select all code, delete it, and paste this entire code.
 * 4. Click 'Deploy' -> 'Manage deployments' -> Edit (pencil icon) -> Version: 'New version' -> Click 'Deploy'
 *    (Or 'Deploy' -> 'New deployment' -> Type: 'Web app' -> Who has access: 'Anyone')
 * ==============================================================================
 */

const SHEET_NAMES = {
  INVOICES: 'Invoices',
  CUSTOMERS: 'Customers',
  PRODUCTS: 'Products',
  SETTINGS: 'Settings'
};

/**
 * Handle HTTP GET Requests
 * Actions: getInvoices, getCustomers, getProducts, getNextNumber, ping
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'getInvoices';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    ensureSheetsExist(ss);

    if (action === 'getInvoices') {
      const invoices = fetchInvoicesFromSheet(ss);
      const customers = fetchCustomersFromSheet(ss);
      const products = fetchProductsFromSheet(ss);
      return createJsonResponse({
        success: true,
        invoices: invoices,
        customers: customers,
        products: products
      });
    }

    if (action === 'getCustomers') {
      const customers = fetchCustomersFromSheet(ss);
      return createJsonResponse({ success: true, customers: customers });
    }

    if (action === 'getProducts') {
      const products = fetchProductsFromSheet(ss);
      return createJsonResponse({ success: true, products: products });
    }

    if (action === 'getNextNumber') {
      const nextNumber = calculateNextInvoiceNumber(ss);
      return createJsonResponse({ success: true, nextNumber: nextNumber });
    }

    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'Vikas Billing Google Sheet Connected!',
        sheets: [SHEET_NAMES.INVOICES, SHEET_NAMES.CUSTOMERS, SHEET_NAMES.PRODUCTS]
      });
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 * Actions: saveInvoice, saveCustomer, saveProduct, deleteInvoice, syncAll
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

    // 1. Save / Update Invoice (also auto-updates Customers & Products sheets)
    if (action === 'saveInvoice') {
      const invoice = payload.invoice;
      if (!invoice || !invoice.invoiceNumber) {
        return createJsonResponse({ success: false, error: 'Missing invoice data' });
      }

      saveInvoiceToSheet(ss, invoice);
      autoSyncCustomerFromInvoice(ss, invoice);
      autoSyncProductsFromInvoice(ss, invoice);

      return createJsonResponse({
        success: true,
        message: 'Invoice ' + invoice.invoiceNumber + ' saved to Invoices, Customers & Products sheets!',
        invoiceNumber: invoice.invoiceNumber
      });
    }

    // 2. Save / Update Customer directly
    if (action === 'saveCustomer') {
      const customer = payload.customer;
      if (!customer || !customer.name) {
        return createJsonResponse({ success: false, error: 'Customer name is required' });
      }
      saveCustomerToSheet(ss, customer);
      return createJsonResponse({ success: true, message: 'Customer saved to Customers sheet' });
    }

    // 3. Save / Update Product directly
    if (action === 'saveProduct') {
      const product = payload.product;
      if (!product || !product.name) {
        return createJsonResponse({ success: false, error: 'Product name is required' });
      }
      saveProductToSheet(ss, product);
      return createJsonResponse({ success: true, message: 'Product saved to Products sheet' });
    }

    // 4. Delete Invoice
    if (action === 'deleteInvoice') {
      const id = payload.id;
      deleteInvoiceFromSheet(ss, id);
      return createJsonResponse({ success: true, message: 'Invoice deleted from sheet' });
    }

    // 5. Sync All Data (Invoices, Customers, Catalog)
    if (action === 'syncAll') {
      const invoices = payload.invoices || [];
      invoices.forEach(function (inv) {
        saveInvoiceToSheet(ss, inv);
        autoSyncCustomerFromInvoice(ss, inv);
        autoSyncProductsFromInvoice(ss, inv);
      });

      const customers = payload.customers || [];
      customers.forEach(function (c) {
        saveCustomerToSheet(ss, c);
      });

      const products = payload.products || [];
      products.forEach(function (p) {
        saveProductToSheet(ss, p);
      });

      return createJsonResponse({
        success: true,
        invoicesCount: invoices.length,
        customersCount: customers.length,
        productsCount: products.length,
        message: 'All invoices, customers, and products synced to Google Sheet!'
      });
    }

    return createJsonResponse({ success: false, error: 'Unsupported POST action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Ensures required sheets and column headers exist with clean dark formatting
 */
function ensureSheetsExist(ss) {
  // 1. Invoices Sheet
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
    formatHeaderRow(invSheet, headers.length, '#1e293b');
  }

  // 2. Customers Sheet
  let custSheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  if (!custSheet) {
    custSheet = ss.insertSheet(SHEET_NAMES.CUSTOMERS);
    const custHeaders = [
      'Customer ID', 'Customer Name', 'Phone', 'Address', 'GSTIN',
      'Total Bills', 'Total Billed (₹)', 'Last Bill No', 'Last Bill Date', 'Updated At'
    ];
    custSheet.appendRow(custHeaders);
    formatHeaderRow(custSheet, custHeaders.length, '#0f766e'); // Teal header
  }

  // 3. Products Sheet
  let prodSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!prodSheet) {
    prodSheet = ss.insertSheet(SHEET_NAMES.PRODUCTS);
    const prodHeaders = [
      'Product ID', 'Item Name', 'Rate / Price (₹)', 'HSN / SAC Code', 'Description', 'Updated At'
    ];
    prodSheet.appendRow(prodHeaders);
    formatHeaderRow(prodSheet, prodHeaders.length, '#4338ca'); // Indigo header

    // Seed default products
    prodSheet.appendRow([
      'item-1',
      'Digital Signature Certificate',
      2000,
      '998313',
      'Class 3 DSC (2 Years Validity)',
      new Date().toISOString()
    ]);
    prodSheet.appendRow([
      'item-2',
      'DSC TOKEN',
      500,
      '8471',
      'HYP2003 / ProxKey USB Crypto Token',
      new Date().toISOString()
    ]);
  }
}

function formatHeaderRow(sheet, colCount, bgColor) {
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setFontWeight('bold')
    .setBackground(bgColor)
    .setFontColor('#ffffff')
    .setFontSize(10);
  sheet.setFrozenRows(1);
}

/**
 * Read all invoices from Invoices sheet
 */
function fetchInvoicesFromSheet(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const invoices = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawJson = row[19];

    if (rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
      try {
        invoices.push(JSON.parse(rawJson));
        continue;
      } catch (ex) {}
    }

    invoices.push({
      id: String(row[0]),
      invoiceNumber: String(row[1]),
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
 * Read all customers from Customers sheet
 */
function fetchCustomersFromSheet(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const customers = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1]) continue; // Skip empty customer names

    customers.push({
      id: String(row[0] || ('cust-' + i)),
      name: String(row[1]).trim(),
      phone: String(row[2] || '').trim(),
      address: String(row[3] || '').trim(),
      gstin: String(row[4] || '').trim(),
      totalBills: Number(row[5]) || 1,
      totalBilled: Number(row[6]) || 0,
      lastBillNo: String(row[7] || ''),
      lastBillDate: formatDate(row[8]),
      updatedAt: row[9] || ''
    });
  }

  return customers;
}

/**
 * Read all products from Products sheet
 */
function fetchProductsFromSheet(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const products = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1]) continue;

    products.push({
      id: String(row[0] || ('item-' + i)),
      name: String(row[1]).trim(),
      rate: Number(row[2]) || 0,
      hsn: String(row[3] || '').trim(),
      description: String(row[4] || '').trim(),
      updatedAt: row[5] || ''
    });
  }

  return products;
}

/**
 * Save or update invoice in Invoices sheet
 */
function saveInvoiceToSheet(ss, invoice) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  const data = sheet.getDataRange().getValues();

  let targetRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(invoice.id) || String(data[i][1]) === String(invoice.invoiceNumber)) {
      targetRowIndex = i + 1;
      break;
    }
  }

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
 * Auto-sync / upsert customer in Customers sheet from invoice
 */
function autoSyncCustomerFromInvoice(ss, invoice) {
  if (!invoice.customer || !invoice.customer.name) return;
  const custName = String(invoice.customer.name).trim();
  const custPhone = String(invoice.customer.phone || '').trim();

  const sheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    const existingName = String(data[i][1] || '').trim();
    const existingPhone = String(data[i][2] || '').trim();

    if ((custPhone && existingPhone && custPhone === existingPhone) ||
        (custName.toLowerCase() === existingName.toLowerCase())) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex > 0) {
    const existingRow = data[targetRowIndex - 1];
    const prevCount = Number(existingRow[5]) || 1;
    const prevTotal = Number(existingRow[6]) || 0;

    const updatedRow = [
      existingRow[0] || ('cust-' + Date.now()),
      custName,
      custPhone || existingRow[2] || '',
      invoice.customer.address || existingRow[3] || '',
      invoice.customer.gstin || existingRow[4] || '',
      prevCount + 1,
      prevTotal + (Number(invoice.total) || 0),
      invoice.invoiceNumber,
      invoice.date || formatDate(new Date()),
      new Date().toISOString()
    ];
    sheet.getRange(targetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  } else {
    sheet.appendRow([
      'cust-' + Date.now(),
      custName,
      custPhone,
      invoice.customer.address || '',
      invoice.customer.gstin || '',
      1,
      Number(invoice.total) || 0,
      invoice.invoiceNumber,
      invoice.date || formatDate(new Date()),
      new Date().toISOString()
    ]);
  }
}

/**
 * Auto-sync / upsert products in Products sheet from invoice
 */
function autoSyncProductsFromInvoice(ss, invoice) {
  const items = invoice.items || [];
  if (!items.length) return;

  const sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();

  items.forEach(function (it, idx) {
    const itemName = String(it.description || it.name || '').trim();
    if (!itemName) return;

    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1] || '').trim().toLowerCase() === itemName.toLowerCase()) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex > 0) {
      // Update price / HSN if changed
      if (it.rate) sheet.getRange(targetRowIndex, 3).setValue(Number(it.rate) || 0);
      if (it.hsn) sheet.getRange(targetRowIndex, 4).setValue(it.hsn);
      sheet.getRange(targetRowIndex, 6).setValue(new Date().toISOString());
    } else {
      sheet.appendRow([
        'item-' + Date.now() + '-' + idx,
        itemName,
        Number(it.rate) || 0,
        it.hsn || '',
        it.description || itemName,
        new Date().toISOString()
      ]);
    }
  });
}

/**
 * Save single customer to Customers sheet
 */
function saveCustomerToSheet(ss, customer) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(customer.id) ||
        (customer.phone && String(data[i][2]).trim() === String(customer.phone).trim()) ||
        String(data[i][1]).trim().toLowerCase() === String(customer.name).trim().toLowerCase()) {
      targetRowIndex = i + 1;
      break;
    }
  }

  const row = [
    customer.id || ('cust-' + Date.now()),
    customer.name,
    customer.phone || '',
    customer.address || '',
    customer.gstin || '',
    Number(customer.totalBills) || 0,
    Number(customer.totalBilled) || 0,
    customer.lastBillNo || '',
    customer.lastBillDate || '',
    new Date().toISOString()
  ];

  if (targetRowIndex > 0) {
    sheet.getRange(targetRowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

/**
 * Save single product to Products sheet
 */
function saveProductToSheet(ss, product) {
  const sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(product.id) ||
        String(data[i][1]).trim().toLowerCase() === String(product.name).trim().toLowerCase()) {
      targetRowIndex = i + 1;
      break;
    }
  }

  const row = [
    product.id || ('item-' + Date.now()),
    product.name,
    Number(product.rate) || 0,
    product.hsn || '',
    product.description || '',
    new Date().toISOString()
  ];

  if (targetRowIndex > 0) {
    sheet.getRange(targetRowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

/**
 * Delete invoice by ID or Number
 */
function deleteInvoiceFromSheet(ss, id) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id) || String(data[i][1]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Scan Invoices sheet to calculate next available invoice number
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
