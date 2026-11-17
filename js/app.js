/**
 * Vikas Billing App - Main Application Controller
 * Handles state, UI events, real-time calculations, tabs, and export.
 */

(function () {
  'use strict';

  // State
  let settings = StorageManager.getSettings();
  let currentInvoice = null;
  let activeTab = 'tab-editor';
  let copyMode = 'original'; // 'original', 'duplicate', 'both'

  // DOM Elements cache
  const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    invoicesCountBadge: document.getElementById('invoices-count-badge'),
    headerBrandName: document.getElementById('header-brand-name'),

    // Global Actions
    btnNewInvoice: document.getElementById('btn-new-invoice'),
    btnDownloadPdf: document.getElementById('btn-download-pdf'),
    btnPrint: document.getElementById('btn-print'),
    btnToolbarPrint: document.getElementById('btn-toolbar-print'),
    btnToolbarPdf: document.getElementById('btn-toolbar-pdf'),
    selectCopyMode: document.getElementById('select-copy-mode'),

    // Editor Form Fields
    invType: document.getElementById('inv-type'),
    invNumber: document.getElementById('inv-number'),
    invDate: document.getElementById('inv-date'),
    invTerms: document.getElementById('inv-terms'),
    invDueDate: document.getElementById('inv-due-date'),
    custName: document.getElementById('cust-name'),
    custPhone: document.getElementById('cust-phone'),
    custEmail: document.getElementById('cust-email'),
    custAddress: document.getElementById('cust-address'),
    custGstin: document.getElementById('cust-gstin'),
    editorItemsBody: document.getElementById('editor-items-body'),
    btnAddItem: document.getElementById('btn-add-item'),
    selectQuickCatalog: document.getElementById('select-quick-catalog'),
    btnInsertCatalogItem: document.getElementById('btn-insert-catalog-item'),
    btnSelectCustomer: document.getElementById('btn-select-customer'),

    // Financials in Editor
    taxType: document.getElementById('tax-type'),
    taxRateGroup: document.getElementById('tax-rate-group'),
    taxRate: document.getElementById('tax-rate'),
    discountVal: document.getElementById('discount-val'),
    paymentMade: document.getElementById('payment-made'),
    editorSubtotal: document.getElementById('editor-subtotal'),
    editorDiscountRow: document.getElementById('editor-discount-row'),
    editorDiscount: document.getElementById('editor-discount'),
    editorTaxRow: document.getElementById('editor-tax-row'),
    editorTax: document.getElementById('editor-tax'),
    editorTotal: document.getElementById('editor-total'),
    editorPaymentDisplay: document.getElementById('editor-payment-display'),
    editorBalance: document.getElementById('editor-balance'),
    editorStatusBadge: document.getElementById('editor-status-badge'),
    invNotes: document.getElementById('inv-notes'),

    // Editor Actions
    btnSaveInvoice: document.getElementById('btn-save-invoice'),
    btnDuplicateInvoice: document.getElementById('btn-duplicate-invoice'),
    btnDeleteInvoice: document.getElementById('btn-delete-invoice'),

    // Preview Container
    invoicePrintContainer: document.getElementById('invoice-print-container'),

    // History Tab
    invoicesHistoryBody: document.getElementById('invoices-history-body'),
    searchInvoicesInput: document.getElementById('search-invoices-input'),
    btnHistoryNewInv: document.getElementById('btn-history-new-inv'),

    // Customer Tab
    customersTableBody: document.getElementById('customers-table-body'),
    btnModalAddCustomer: document.getElementById('btn-modal-add-customer'),

    // Catalog Tab
    catalogTableBody: document.getElementById('catalog-table-body'),
    btnModalAddItem: document.getElementById('btn-modal-add-item'),

    // Settings Tab
    settingsForm: document.getElementById('settings-form'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJsonTrigger: document.getElementById('btn-import-json-trigger'),
    importJsonFile: document.getElementById('import-json-file'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  /**
   * Application Initialization
   */
  function init() {
    loadSettingsIntoUI();
    populateCatalogDropdown();

    // Load active invoice from storage or default sample
    const activeId = StorageManager.getActiveInvoiceId();
    currentInvoice = StorageManager.getInvoiceById(activeId) || StorageManager.getInvoices()[0] || createBlankInvoice();

    loadInvoiceIntoEditor(currentInvoice);
    renderPreview();
    renderInvoicesList();
    renderCustomersList();
    renderCatalogList();
    updateInvoicesCount();

    bindEvents();
  }

  /**
   * Bind DOM Events
   */
  function bindEvents() {
    // Navigation Tabs
    elements.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Editor input changes -> Live update
    const liveInputs = [
      elements.invType, elements.invNumber, elements.invDate,
      elements.invTerms, elements.invDueDate, elements.custName,
      elements.custPhone, elements.custEmail, elements.custAddress,
      elements.custGstin, elements.taxType, elements.taxRate,
      elements.discountVal, elements.paymentMade, elements.invNotes
    ];

    liveInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', onEditorInputChange);
        input.addEventListener('change', onEditorInputChange);
      }
    });

    // Tax type toggle
    elements.taxType.addEventListener('change', () => {
      if (elements.taxType.value === 'none') {
        elements.taxRateGroup.style.display = 'none';
      } else {
        elements.taxRateGroup.style.display = 'block';
      }
      onEditorInputChange();
    });

    // Line items
    elements.btnAddItem.addEventListener('click', () => {
      addNewItemRow('', 1, 0);
      recalculateInvoice();
    });

    elements.btnInsertCatalogItem.addEventListener('click', () => {
      const selectedId = elements.selectQuickCatalog.value;
      if (!selectedId) return;
      const items = StorageManager.getItems();
      const item = items.find(i => i.id === selectedId);
      if (item) {
        addNewItemRow(item.name, 1, item.rate, item.hsn);
        recalculateInvoice();
      }
    });

    // Buttons
    elements.btnSaveInvoice.addEventListener('click', saveCurrentInvoice);
    elements.btnNewInvoice.addEventListener('click', startNewInvoice);
    elements.btnHistoryNewInv.addEventListener('click', () => {
      startNewInvoice();
      switchTab('tab-editor');
    });

    elements.btnDuplicateInvoice.addEventListener('click', duplicateCurrentInvoice);
    elements.btnDeleteInvoice.addEventListener('click', deleteCurrentInvoice);

    // Printing & PDF
    elements.btnPrint.addEventListener('click', handlePrint);
    elements.btnToolbarPrint.addEventListener('click', handlePrint);
    elements.btnDownloadPdf.addEventListener('click', handleDownloadPdf);
    elements.btnToolbarPdf.addEventListener('click', handleDownloadPdf);

    elements.selectCopyMode.addEventListener('change', (e) => {
      copyMode = e.target.value;
      renderPreview();
    });

    // History Search
    elements.searchInvoicesInput.addEventListener('input', (e) => {
      renderInvoicesList(e.target.value);
    });

    // Quick Customer Select
    elements.btnSelectCustomer.addEventListener('click', showCustomerQuickSelect);

    // Customer & Item Management modals/prompts
    elements.btnModalAddCustomer.addEventListener('click', promptAddCustomer);
    elements.btnModalAddItem.addEventListener('click', promptAddItem);

    // Settings
    elements.btnSaveSettings.addEventListener('click', handleSaveSettings);
    elements.btnExportJson.addEventListener('click', handleExportJson);
    elements.btnImportJsonTrigger.addEventListener('click', () => elements.importJsonFile.click());
    elements.importJsonFile.addEventListener('change', handleImportJson);

    // Keyboard Shortcuts (Ctrl+P, Ctrl+S)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentInvoice();
      }
    });
  }

  /**
   * Switch Active Tab
   */
  function switchTab(tabId) {
    activeTab = tabId;
    elements.navBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    elements.tabContents.forEach(c => c.classList.toggle('active', c.id === tabId));

    if (tabId === 'tab-invoices') {
      renderInvoicesList();
    } else if (tabId === 'tab-customers') {
      renderCustomersList();
    } else if (tabId === 'tab-catalog') {
      renderCatalogList();
    } else if (tabId === 'tab-editor') {
      renderPreview();
    }
  }

  /**
   * Create Blank Invoice
   */
  function createBlankInvoice() {
    const today = new Date().toISOString().split('T')[0];
    const prefix = settings.invoicePrefix || 'INV-';
    const num = String(settings.nextInvoiceNumber || 101).padStart(6, '0');

    return {
      id: 'inv-' + Date.now(),
      invoiceNumber: `${prefix}${num}`,
      invoiceType: settings.invoiceTitle || 'TAX INVOICE',
      copyType: 'ORIGINAL',
      date: today,
      terms: settings.defaultTerms || 'Due on Receipt',
      dueDate: today,
      customer: {
        name: '',
        address: '',
        phone: '',
        email: '',
        gstin: ''
      },
      items: [
        { id: 'row-1', description: '', hsn: '', qty: 1, rate: 0, amount: 0 }
      ],
      subTotal: 0,
      discountType: 'flat',
      discountValue: 0,
      discountAmount: 0,
      taxType: 'none',
      taxRate: 0,
      taxAmount: 0,
      total: 0,
      paymentMade: 0,
      balanceDue: 0,
      notes: settings.defaultNotes || 'Thanks for your business.',
      status: 'unpaid'
    };
  }

  /**
   * Load Invoice Data into Editor Form
   */
  function loadInvoiceIntoEditor(invoice) {
    currentInvoice = invoice;

    elements.invType.value = invoice.invoiceType || 'TAX INVOICE';
    elements.invNumber.value = invoice.invoiceNumber || 'INV-000155';
    elements.invDate.value = invoice.date || '';
    elements.invTerms.value = invoice.terms || 'Due on Receipt';
    elements.invDueDate.value = invoice.dueDate || invoice.date || '';

    elements.custName.value = invoice.customer?.name || '';
    elements.custPhone.value = invoice.customer?.phone || '';
    elements.custEmail.value = invoice.customer?.email || '';
    elements.custAddress.value = invoice.customer?.address || '';
    elements.custGstin.value = invoice.customer?.gstin || '';

    elements.taxType.value = invoice.taxType || 'none';
    elements.taxRate.value = invoice.taxRate || 18;
    elements.taxRateGroup.style.display = invoice.taxType === 'none' ? 'none' : 'block';

    elements.discountVal.value = invoice.discountAmount || 0;
    elements.paymentMade.value = invoice.paymentMade || 0;
    elements.invNotes.value = invoice.notes || settings.defaultNotes || 'Thanks for your business.';

    // Populate Item Rows
    elements.editorItemsBody.innerHTML = '';
    const items = (invoice.items && invoice.items.length) ? invoice.items : [{ description: '', qty: 1, rate: 0, amount: 0 }];
    items.forEach(item => {
      addNewItemRow(item.description, item.qty, item.rate, item.hsn);
    });

    recalculateInvoice();
  }

  /**
   * Add a line item row to the editor table
   */
  function addNewItemRow(description = '', qty = 1, rate = 0, hsn = '') {
    const tr = document.createElement('tr');
    tr.className = 'editor-row';
    const amount = (Number(qty) * Number(rate)) || 0;

    tr.innerHTML = `
      <td>
        <input type="text" class="form-control item-desc-input" placeholder="Item name / description" value="${escapeQuotes(description)}">
        <input type="text" class="form-control item-hsn-input" placeholder="HSN/SAC (optional)" value="${escapeQuotes(hsn)}" style="font-size:0.75rem; margin-top:2px; padding:0.25rem 0.5rem;">
      </td>
      <td>
        <input type="number" class="form-control item-qty-input" min="0.01" step="any" value="${qty}">
      </td>
      <td>
        <input type="number" class="form-control item-rate-input" min="0" step="any" value="${rate}">
      </td>
      <td style="font-weight:600; font-size:0.88rem; padding-top:0.7rem;">
        <span class="row-amount-display">₹${InvoiceTemplate.formatCurrency(amount)}</span>
      </td>
      <td>
        <button type="button" class="btn-icon btn-remove-row" title="Delete row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </td>
    `;

    const qtyInput = tr.querySelector('.item-qty-input');
    const rateInput = tr.querySelector('.item-rate-input');
    const descInput = tr.querySelector('.item-desc-input');
    const hsnInput = tr.querySelector('.item-hsn-input');
    const removeBtn = tr.querySelector('.btn-remove-row');

    const updateRow = () => {
      const q = parseFloat(qtyInput.value) || 0;
      const r = parseFloat(rateInput.value) || 0;
      const rowAmt = q * r;
      tr.querySelector('.row-amount-display').textContent = `₹${InvoiceTemplate.formatCurrency(rowAmt)}`;
      recalculateInvoice();
    };

    qtyInput.addEventListener('input', updateRow);
    rateInput.addEventListener('input', updateRow);
    descInput.addEventListener('input', onEditorInputChange);
    hsnInput.addEventListener('input', onEditorInputChange);

    removeBtn.addEventListener('click', () => {
      tr.remove();
      if (elements.editorItemsBody.children.length === 0) {
        addNewItemRow('', 1, 0);
      }
      recalculateInvoice();
    });

    elements.editorItemsBody.appendChild(tr);
  }

  /**
   * Recalculate Invoice totals in editor
   */
  function recalculateInvoice() {
    const rows = elements.editorItemsBody.querySelectorAll('.editor-row');
    const items = [];
    let subTotal = 0;

    rows.forEach((row, idx) => {
      const description = row.querySelector('.item-desc-input').value.trim();
      const hsn = row.querySelector('.item-hsn-input').value.trim();
      const qty = parseFloat(row.querySelector('.item-qty-input').value) || 0;
      const rate = parseFloat(row.querySelector('.item-rate-input').value) || 0;
      const amount = qty * rate;

      subTotal += amount;
      items.push({
        id: `row-${idx + 1}`,
        description,
        hsn,
        qty,
        rate,
        amount
      });
    });

    const discountAmount = parseFloat(elements.discountVal.value) || 0;
    const taxableAmount = Math.max(0, subTotal - discountAmount);

    let taxRate = 0;
    let taxAmount = 0;
    const taxType = elements.taxType.value;
    if (taxType !== 'none') {
      taxRate = parseFloat(elements.taxRate.value) || 18;
      taxAmount = (taxableAmount * taxRate) / 100;
    }

    const total = Math.max(0, taxableAmount + taxAmount);
    const paymentMade = parseFloat(elements.paymentMade.value) || 0;
    const balanceDue = Math.max(0, total - paymentMade);

    // Determine status
    let status = 'unpaid';
    if (balanceDue === 0 && total > 0) {
      status = 'paid';
    } else if (paymentMade > 0 && balanceDue > 0) {
      status = 'partial';
    }

    // Update current invoice state object
    currentInvoice.invoiceType = elements.invType.value;
    currentInvoice.invoiceNumber = elements.invNumber.value.trim() || 'INV-000155';
    currentInvoice.date = elements.invDate.value;
    currentInvoice.terms = elements.invTerms.value;
    currentInvoice.dueDate = elements.invDueDate.value;

    currentInvoice.customer = {
      name: elements.custName.value.trim() || 'CASH CUSTOMER',
      phone: elements.custPhone.value.trim(),
      email: elements.custEmail.value.trim(),
      address: elements.custAddress.value.trim(),
      gstin: elements.custGstin.value.trim()
    };

    currentInvoice.items = items;
    currentInvoice.subTotal = subTotal;
    currentInvoice.discountAmount = discountAmount;
    currentInvoice.taxType = taxType;
    currentInvoice.taxRate = taxRate;
    currentInvoice.taxAmount = taxAmount;
    currentInvoice.total = total;
    currentInvoice.paymentMade = paymentMade;
    currentInvoice.balanceDue = balanceDue;
    currentInvoice.notes = elements.invNotes.value.trim();
    currentInvoice.status = status;

    // Update Editor Summary UI
    elements.editorSubtotal.textContent = `₹${InvoiceTemplate.formatCurrency(subTotal)}`;
    
    if (discountAmount > 0) {
      elements.editorDiscountRow.style.display = 'flex';
      elements.editorDiscount.textContent = `(-) ₹${InvoiceTemplate.formatCurrency(discountAmount)}`;
    } else {
      elements.editorDiscountRow.style.display = 'none';
    }

    if (taxAmount > 0) {
      elements.editorTaxRow.style.display = 'flex';
      elements.editorTax.textContent = `+ ₹${InvoiceTemplate.formatCurrency(taxAmount)} (${taxRate}%)`;
    } else {
      elements.editorTaxRow.style.display = 'none';
    }

    elements.editorTotal.textContent = `₹${InvoiceTemplate.formatCurrency(total)}`;
    elements.editorPaymentDisplay.textContent = `(-) ₹${InvoiceTemplate.formatCurrency(paymentMade)}`;
    elements.editorBalance.textContent = `₹${InvoiceTemplate.formatCurrency(balanceDue)}`;

    // Status Badge
    elements.editorStatusBadge.className = `badge badge-${status}`;
    elements.editorStatusBadge.textContent = status.toUpperCase();

    // Re-render Preview Sheet
    renderPreview();
  }

  function onEditorInputChange() {
    recalculateInvoice();
  }

  /**
   * Render Live Invoice Preview into DOM
   */
  function renderPreview() {
    if (!currentInvoice) return;

    elements.invoicePrintContainer.innerHTML = InvoiceTemplate.renderMultiCopyInvoice(
      currentInvoice,
      settings,
      copyMode
    );

    // Render UPI QR Codes if enabled
    if (settings.showUpiQr && settings.upiId && currentInvoice.balanceDue > 0) {
      const qrElOriginal = document.getElementById('sheet-upi-qr-original');
      const qrElDuplicate = document.getElementById('sheet-upi-qr-duplicate');

      const upiUrl = UpiQR.createUpiQrUrl({
        upiId: settings.upiId,
        businessName: settings.businessName,
        amount: currentInvoice.balanceDue,
        invoiceNo: currentInvoice.invoiceNumber
      });

      if (qrElOriginal) UpiQR.renderQrImage(qrElOriginal, upiUrl, 84);
      if (qrElDuplicate) UpiQR.renderQrImage(qrElDuplicate, upiUrl, 84);
    }
  }

  /**
   * Save Current Invoice
   */
  function saveCurrentInvoice() {
    recalculateInvoice();
    StorageManager.saveInvoice(currentInvoice);

    // Auto-save customer to customer list if new
    if (currentInvoice.customer && currentInvoice.customer.name) {
      StorageManager.addCustomerIfNew(currentInvoice.customer);
      renderCustomersList();
    }

    updateInvoicesCount();
    showToast(`Invoice ${currentInvoice.invoiceNumber} saved successfully!`);
  }

  /**
   * Start New Blank Invoice
   */
  function startNewInvoice() {
    // Increment counter in settings
    settings.nextInvoiceNumber = (settings.nextInvoiceNumber || 155) + 1;
    StorageManager.saveSettings(settings);

    const blank = createBlankInvoice();
    StorageManager.saveInvoice(blank);
    loadInvoiceIntoEditor(blank);
    switchTab('tab-editor');
    showToast(`New Invoice ${blank.invoiceNumber} created!`);
  }

  /**
   * Duplicate Current Invoice
   */
  function duplicateCurrentInvoice() {
    settings.nextInvoiceNumber = (settings.nextInvoiceNumber || 155) + 1;
    StorageManager.saveSettings(settings);

    const prefix = settings.invoicePrefix || 'INV-';
    const num = String(settings.nextInvoiceNumber).padStart(6, '0');

    const copy = JSON.parse(JSON.stringify(currentInvoice));
    copy.id = 'inv-' + Date.now();
    copy.invoiceNumber = `${prefix}${num}`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();

    StorageManager.saveInvoice(copy);
    loadInvoiceIntoEditor(copy);
    updateInvoicesCount();
    showToast(`Duplicated to ${copy.invoiceNumber}!`);
  }

  /**
   * Delete Current Invoice
   */
  function deleteCurrentInvoice() {
    if (!confirm(`Are you sure you want to delete invoice ${currentInvoice.invoiceNumber}?`)) {
      return;
    }

    StorageManager.deleteInvoice(currentInvoice.id);
    const remaining = StorageManager.getInvoices();
    if (remaining.length > 0) {
      loadInvoiceIntoEditor(remaining[0]);
    } else {
      const blank = createBlankInvoice();
      StorageManager.saveInvoice(blank);
      loadInvoiceIntoEditor(blank);
    }

    updateInvoicesCount();
    showToast('Invoice deleted.');
  }

  /**
   * Handle Print / Browser PDF Save
   */
  function handlePrint() {
    saveCurrentInvoice();
    window.print();
  }

  /**
   * Handle Direct PDF Download using html2pdf
   */
  function handleDownloadPdf() {
    saveCurrentInvoice();
    showToast('Generating PDF file, please wait...');

    const element = document.getElementById('invoice-print-container');
    const opt = {
      margin: 0,
      filename: `${currentInvoice.invoiceNumber || 'Invoice'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => {
        showToast('PDF downloaded successfully!');
      }).catch(err => {
        console.error('html2pdf error:', err);
        window.print();
      });
    } else {
      window.print();
    }
  }

  /**
   * Render Invoices History Table
   */
  function renderInvoicesList(query = '') {
    const invoices = StorageManager.getInvoices();
    const cleanQ = query.toLowerCase().trim();

    const filtered = invoices.filter(inv => {
      if (!cleanQ) return true;
      const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(cleanQ);
      const custMatch = (inv.customer?.name || '').toLowerCase().includes(cleanQ);
      return numMatch || custMatch;
    });

    if (filtered.length === 0) {
      elements.invoicesHistoryBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No invoices found.
          </td>
        </tr>
      `;
      return;
    }

    elements.invoicesHistoryBody.innerHTML = filtered.map(inv => {
      const status = inv.status || 'unpaid';
      return `
        <tr>
          <td><strong>${InvoiceTemplate.escapeHtml(inv.invoiceNumber)}</strong></td>
          <td>${InvoiceTemplate.formatDate(inv.date)}</td>
          <td>${InvoiceTemplate.escapeHtml(inv.customer?.name || 'Cash Customer')}</td>
          <td>₹${InvoiceTemplate.formatCurrency(inv.total)}</td>
          <td>₹${InvoiceTemplate.formatCurrency(inv.paymentMade)}</td>
          <td style="font-weight:600; color:${inv.balanceDue > 0 ? '#b91c1c' : '#15803d'};">
            ₹${InvoiceTemplate.formatCurrency(inv.balanceDue)}
          </td>
          <td><span class="badge badge-${status}">${status.toUpperCase()}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm btn-table-open" data-id="${inv.id}">Edit</button>
            <button class="btn btn-secondary btn-sm btn-table-print" data-id="${inv.id}">Print</button>
            <button class="btn btn-danger btn-sm btn-table-del" data-id="${inv.id}">×</button>
          </td>
        </tr>
      `;
    }).join('');

    // Row Actions
    elements.invoicesHistoryBody.querySelectorAll('.btn-table-open').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = StorageManager.getInvoiceById(btn.dataset.id);
        if (inv) {
          loadInvoiceIntoEditor(inv);
          switchTab('tab-editor');
        }
      });
    });

    elements.invoicesHistoryBody.querySelectorAll('.btn-table-print').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = StorageManager.getInvoiceById(btn.dataset.id);
        if (inv) {
          loadInvoiceIntoEditor(inv);
          switchTab('tab-editor');
          setTimeout(() => window.print(), 200);
        }
      });
    });

    elements.invoicesHistoryBody.querySelectorAll('.btn-table-del').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this invoice?')) {
          StorageManager.deleteInvoice(btn.dataset.id);
          renderInvoicesList(elements.searchInvoicesInput.value);
          updateInvoicesCount();
          showToast('Invoice deleted.');
        }
      });
    });
  }

  /**
   * Render Customers Directory
   */
  function renderCustomersList() {
    const customers = StorageManager.getCustomers();
    elements.customersTableBody.innerHTML = customers.map(cust => `
      <tr>
        <td><strong>${InvoiceTemplate.escapeHtml(cust.name)}</strong></td>
        <td>${InvoiceTemplate.escapeHtml(cust.phone || '-')}</td>
        <td>${InvoiceTemplate.escapeHtml(cust.email || '-')}</td>
        <td>${InvoiceTemplate.escapeHtml(cust.address || '-')}</td>
        <td>${InvoiceTemplate.escapeHtml(cust.gstin || '-')}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm btn-use-cust" data-id="${cust.id}">Use on Invoice</button>
          <button class="btn btn-danger btn-sm btn-del-cust" data-id="${cust.id}">×</button>
        </td>
      </tr>
    `).join('');

    elements.customersTableBody.querySelectorAll('.btn-use-cust').forEach(btn => {
      btn.addEventListener('click', () => {
        const cust = StorageManager.getCustomers().find(c => c.id === btn.dataset.id);
        if (cust) {
          elements.custName.value = cust.name;
          elements.custPhone.value = cust.phone;
          elements.custEmail.value = cust.email;
          elements.custAddress.value = cust.address;
          elements.custGstin.value = cust.gstin;
          switchTab('tab-editor');
          recalculateInvoice();
          showToast(`Customer ${cust.name} selected!`);
        }
      });
    });

    elements.customersTableBody.querySelectorAll('.btn-del-cust').forEach(btn => {
      btn.addEventListener('click', () => {
        let list = StorageManager.getCustomers();
        list = list.filter(c => c.id !== btn.dataset.id);
        StorageManager.saveCustomers(list);
        renderCustomersList();
      });
    });
  }

  /**
   * Render Products Catalog
   */
  function renderCatalogList() {
    const items = StorageManager.getItems();
    elements.catalogTableBody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${InvoiceTemplate.escapeHtml(item.name)}</strong></td>
        <td>${InvoiceTemplate.escapeHtml(item.description || '-')}</td>
        <td>${InvoiceTemplate.escapeHtml(item.hsn || '-')}</td>
        <td>₹${InvoiceTemplate.formatCurrency(item.rate)}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm btn-add-cat-to-inv" data-id="${item.id}">+ Add to Bill</button>
          <button class="btn btn-danger btn-sm btn-del-cat-item" data-id="${item.id}">×</button>
        </td>
      </tr>
    `).join('');

    elements.catalogTableBody.querySelectorAll('.btn-add-cat-to-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const it = StorageManager.getItems().find(i => i.id === btn.dataset.id);
        if (it) {
          addNewItemRow(it.name, 1, it.rate, it.hsn);
          switchTab('tab-editor');
          recalculateInvoice();
          showToast(`Added ${it.name} to invoice!`);
        }
      });
    });

    elements.catalogTableBody.querySelectorAll('.btn-del-cat-item').forEach(btn => {
      btn.addEventListener('click', () => {
        let list = StorageManager.getItems();
        list = list.filter(i => i.id !== btn.dataset.id);
        StorageManager.saveItems(list);
        renderCatalogList();
        populateCatalogDropdown();
      });
    });
  }

  function populateCatalogDropdown() {
    const items = StorageManager.getItems();
    elements.selectQuickCatalog.innerHTML = '<option value="">-- Choose item from catalog --</option>' +
      items.map(i => `<option value="${i.id}">${InvoiceTemplate.escapeHtml(i.name)} (₹${i.rate})</option>`).join('');
  }

  function showCustomerQuickSelect() {
    const customers = StorageManager.getCustomers();
    if (customers.length === 0) {
      alert('No saved customers yet. Enter customer details directly in the form.');
      return;
    }
    const names = customers.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
    const input = prompt(`Select customer number:\n${names}`);
    const index = parseInt(input) - 1;
    if (!isNaN(index) && customers[index]) {
      const c = customers[index];
      elements.custName.value = c.name;
      elements.custPhone.value = c.phone || '';
      elements.custEmail.value = c.email || '';
      elements.custAddress.value = c.address || '';
      elements.custGstin.value = c.gstin || '';
      recalculateInvoice();
      showToast(`Selected ${c.name}`);
    }
  }

  function promptAddCustomer() {
    const name = prompt('Customer Name:');
    if (!name) return;
    const phone = prompt('Phone Number (optional):') || '';
    const email = prompt('Email Address (optional):') || '';
    const address = prompt('Address (optional):') || '';
    const gstin = prompt('GSTIN (optional):') || '';

    const list = StorageManager.getCustomers();
    list.push({
      id: 'cust-' + Date.now(),
      name,
      phone,
      email,
      address,
      gstin
    });
    StorageManager.saveCustomers(list);
    renderCustomersList();
    showToast('Customer added!');
  }

  function promptAddItem() {
    const name = prompt('Item Name:');
    if (!name) return;
    const rate = parseFloat(prompt('Rate / Price in ₹:') || '0');
    const hsn = prompt('HSN / SAC Code (optional):') || '';
    const description = prompt('Description (optional):') || '';

    const list = StorageManager.getItems();
    list.push({
      id: 'item-' + Date.now(),
      name,
      rate,
      hsn,
      description
    });
    StorageManager.saveItems(list);
    renderCatalogList();
    populateCatalogDropdown();
    showToast('Item added to catalog!');
  }

  /**
   * Settings management
   */
  function loadSettingsIntoUI() {
    document.getElementById('set-biz-name').value = settings.businessName || '';
    document.getElementById('set-addr-1').value = settings.addressLine1 || '';
    document.getElementById('set-addr-2').value = settings.addressLine2 || '';
    document.getElementById('set-country').value = settings.country || 'India';
    document.getElementById('set-phone').value = settings.phone || '';
    document.getElementById('set-email').value = settings.email || '';
    document.getElementById('set-gstin').value = settings.gstin || '';
    document.getElementById('set-pan').value = settings.pan || '';
    document.getElementById('set-upi-id').value = settings.upiId || '';
    document.getElementById('set-show-qr').checked = !!settings.showUpiQr;
    document.getElementById('set-bank-name').value = settings.bankName || '';
    document.getElementById('set-acc-no').value = settings.accountNumber || '';
    document.getElementById('set-ifsc').value = settings.ifscCode || '';
    document.getElementById('set-prefix').value = settings.invoicePrefix || 'INV-';
    document.getElementById('set-next-num').value = settings.nextInvoiceNumber || 156;
    document.getElementById('set-notes').value = settings.defaultNotes || 'Thanks for your business.';
    document.getElementById('set-footer-tagline').value = settings.footerTagline || '';

    elements.headerBrandName.textContent = settings.businessName || 'Vikas Billing';
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    settings.businessName = document.getElementById('set-biz-name').value.trim();
    settings.addressLine1 = document.getElementById('set-addr-1').value.trim();
    settings.addressLine2 = document.getElementById('set-addr-2').value.trim();
    settings.country = document.getElementById('set-country').value.trim();
    settings.phone = document.getElementById('set-phone').value.trim();
    settings.email = document.getElementById('set-email').value.trim();
    settings.gstin = document.getElementById('set-gstin').value.trim();
    settings.pan = document.getElementById('set-pan').value.trim();
    settings.upiId = document.getElementById('set-upi-id').value.trim();
    settings.showUpiQr = document.getElementById('set-show-qr').checked;
    settings.bankName = document.getElementById('set-bank-name').value.trim();
    settings.accountNumber = document.getElementById('set-acc-no').value.trim();
    settings.ifscCode = document.getElementById('set-ifsc').value.trim();
    settings.invoicePrefix = document.getElementById('set-prefix').value.trim();
    settings.nextInvoiceNumber = parseInt(document.getElementById('set-next-num').value) || 156;
    settings.defaultNotes = document.getElementById('set-notes').value.trim();
    settings.footerTagline = document.getElementById('set-footer-tagline').value.trim();

    StorageManager.saveSettings(settings);
    elements.headerBrandName.textContent = settings.businessName;
    renderPreview();
    showToast('Settings saved successfully!');
  }

  function handleExportJson() {
    const dataStr = StorageManager.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data backup downloaded!');
  }

  function handleImportJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const res = StorageManager.importData(event.target.result);
      if (res.success) {
        settings = StorageManager.getSettings();
        loadSettingsIntoUI();
        currentInvoice = StorageManager.getInvoices()[0] || createBlankInvoice();
        loadInvoiceIntoEditor(currentInvoice);
        renderInvoicesList();
        renderCustomersList();
        renderCatalogList();
        populateCatalogDropdown();
        updateInvoicesCount();
        showToast(`Successfully imported ${res.count} invoices!`);
      } else {
        alert('Failed to import JSON: ' + res.error);
      }
    };
    reader.readAsText(file);
  }

  function updateInvoicesCount() {
    const count = StorageManager.getInvoices().length;
    elements.invoicesCountBadge.textContent = count;
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      <span>${InvoiceTemplate.escapeHtml(message)}</span>
    `;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function escapeQuotes(str) {
    return String(str || '').replace(/"/g, '&quot;');
  }

  // Run init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
