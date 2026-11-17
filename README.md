# 🧾 Vikas Billing App

A lightweight, high-performance, and pixel-accurate **Tax Invoice & Billing Web App** modeled directly from **`INV-000155.pdf`** (*Vikas Digital Signature Shop*). 

Designed to run **100% client-side with zero dependencies**, making it instantly deployable to **GitHub Pages** with zero build configuration.

---

## 🌟 Key Features

1. **Exact Replica of `INV-000155.pdf`**:
   - Matches typography, dark charcoal table headers, layout, spacing, and styling.
   - Pre-loaded with default business information:
     - **Business**: Vikas Digital Signature Shop
     - **Address**: Ram Krishan Nagar Gursahaiganj, Uttar Pradesh 209722, India
     - **Phone**: 7392045049
     - **Email**: itisvikasprajapati@gmail.com
     - **Sample Items**: Digital Signature Certificate (₹2,000.00), DSC TOKEN (₹500.00)
     - **Customer**: BHARAT SINGH

2. **Dual-Copy Support (Original & Duplicate)**:
   - Toggle between **`ORIGINAL` (Page 1)** and **`DUPLICATE` (Page 2)**.
   - Choose to print either copy individually or print both consecutively with seamless page breaks.

3. **Indian Currency Number-to-Words Converter**:
   - Converts amounts in real-time into the Indian numbering format (*Lakhs & Crores*).
   - *Example:* ₹2,500.00 converts to:
     > **`Indian Rupee Two Thousand Five Hundred Only`**

4. **Dynamic UPI Payment QR Code**:
   - Generates dynamic UPI payment QR codes (`upi://pay?pa=...&am=...`) using the merchant UPI ID (`7392045049@upi`).
   - Customers can scan with Google Pay, PhonePe, or Paytm to pay the exact balance due.

5. **Tax & Discount Calculations**:
   - Support for **No Tax**, **Intra-State GST (CGST + SGST)**, and **Inter-State GST (IGST)**.
   - Flat discount deductions and advance/payment made tracking with dynamic Balance Due calculation.

6. **Local Browser Persistence (LocalStorage)**:
   - All invoices, customer records, product catalogs, and business settings persist automatically.
   - **JSON Backup & Restore**: Export full data or import backups anytime.

7. **A4 Print & Direct PDF Export**:
   - Fully optimized `@media print` CSS for standard A4 paper with zero UI distractions.
   - 1-click **Download PDF** via bundled HTML5 PDF generator.

---

## 🚀 Live GitHub Pages Deployment Guide

### Option 1: Standard GitHub Pages (Easiest - 2 Minutes)

1. **Initialize Git & Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: initial billing web app commit"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<REPO-NAME>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Open your repository on GitHub.
   - Click on **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, select:
     - Source: **Deploy from a branch**
     - Branch: **`main`** / Folder: **`/ (root)`**
   - Click **Save**.
   - Your billing app will be live at:
     ```
     https://<YOUR-USERNAME>.github.io/<REPO-NAME>/
     ```

### Option 2: Automated GitHub Actions Workflow

A pre-configured GitHub Actions workflow is included at `.github/workflows/deploy.yml`.

1. Go to repository **Settings** > **Pages**.
2. Under **Source**, choose **GitHub Actions**.
3. Push to `main`, and the deployment action will trigger automatically!

---

## 💻 Local Testing & Usage

Since this is a pure client-side static web app, no build step or package installations are required:

### Option A: Direct Browser Launch
Simply double-click `index.html` in your file explorer to open it in any browser (Chrome, Edge, Firefox, Safari).

### Option B: Local Web Server
You can launch a lightweight web server with Node:
```bash
# Using npx serve
npx serve .

# Or using Python 3
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📁 Project Architecture

```
billing/
├── INV-000155.pdf              # Original reference invoice
├── prd.json                    # Ralph autonomous agent PRD specification
├── index.html                  # Main application UI (dashboard & live preview)
├── css/
│   └── styles.css              # Custom styling & A4 print media queries
├── js/
│   ├── app.js                  # Master application controller & event handlers
│   ├── invoice-template.js     # Exact HTML invoice renderer (Original & Duplicate)
│   ├── number-to-words.js      # Indian Rupee words conversion (Crores, Lakhs)
│   ├── qr.js                   # UPI payment QR generator
│   └── storage.js              # LocalStorage state management
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages automated deployment workflow
└── README.md                   # Documentation & setup guide
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | Open Print / Save as PDF Dialog |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save Current Invoice |

---

## 📄 License
MIT License. Free to use and customize for business invoicing.
