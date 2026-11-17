/**
 * Firebase Firestore Cloud Sync Module for Vikas Billing App
 * Provides real-time bidirectional cloud sync and offline persistence.
 */

const FirebaseSync = {
  db: null,
  app: null,
  unsubscribeListener: null,

  getFirebaseConfig() {
    const settings = StorageManager.getSettings();
    return settings.firebaseConfig || null;
  },

  setFirebaseConfig(config) {
    const settings = StorageManager.getSettings();
    settings.firebaseConfig = config;
    StorageManager.saveSettings(settings);
    return this.init();
  },

  isConfigured() {
    const cfg = this.getFirebaseConfig();
    return Boolean(cfg && cfg.projectId && cfg.apiKey);
  },

  /**
   * Initialize Firebase App & Firestore
   */
  init() {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded.');
      return false;
    }

    const config = this.getFirebaseConfig();
    if (!config || !config.projectId || !config.apiKey) {
      return false;
    }

    try {
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.app();
      }

      this.db = firebase.firestore();

      // Enable offline persistence
      this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
          console.warn('Firebase persistence failed: multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firebase persistence is not supported by browser');
        }
      });

      return true;
    } catch (err) {
      console.error('Firebase init error:', err);
      return false;
    }
  },

  /**
   * Start real-time listener for incoming invoices from other devices
   */
  startRealtimeListener(onInvoicesChanged) {
    if (!this.init()) return;

    if (this.unsubscribeListener) {
      this.unsubscribeListener();
    }

    try {
      this.unsubscribeListener = this.db.collection('invoices').onSnapshot(snapshot => {
        const remoteInvoices = [];
        snapshot.forEach(doc => {
          remoteInvoices.push(doc.data());
        });

        if (remoteInvoices.length > 0) {
          // Merge remote invoices into local storage
          const localList = StorageManager.getInvoices();
          const map = new Map();

          localList.forEach(inv => map.set(inv.id || inv.invoiceNumber, inv));
          remoteInvoices.forEach(inv => map.set(inv.id || inv.invoiceNumber, inv));

          const merged = Array.from(map.values());
          StorageManager.saveInvoices(merged);

          if (typeof onInvoicesChanged === 'function') {
            onInvoicesChanged(merged);
          }
        }
      }, err => {
        console.warn('Firestore onSnapshot listener error:', err);
      });
    } catch (err) {
      console.error('Failed to attach Firestore listener:', err);
    }
  },

  /**
   * Save or Update an invoice in Cloud Firestore
   */
  async saveInvoice(invoice) {
    if (!this.init()) return null;

    try {
      const docId = invoice.id || invoice.invoiceNumber;
      await this.db.collection('invoices').doc(docId).set({
        ...invoice,
        syncedAt: new Date().toISOString()
      }, { merge: true });

      return { success: true };
    } catch (err) {
      console.warn('Firestore saveInvoice error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete an invoice from Cloud Firestore
   */
  async deleteInvoice(invoiceId) {
    if (!this.init()) return null;

    try {
      await this.db.collection('invoices').doc(invoiceId).delete();
      return { success: true };
    } catch (err) {
      console.warn('Firestore deleteInvoice error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Upload all local invoices to Firestore (Initial Batch Sync)
   */
  async syncAllLocalToFirebase() {
    if (!this.init()) return { success: false, error: 'Firebase is not initialized' };

    const invoices = StorageManager.getInvoices();
    try {
      const batch = this.db.batch();
      invoices.forEach(inv => {
        const docRef = this.db.collection('invoices').doc(inv.id || inv.invoiceNumber);
        batch.set(docRef, { ...inv, syncedAt: new Date().toISOString() }, { merge: true });
      });

      await batch.commit();
      return { success: true, count: invoices.length };
    } catch (err) {
      console.error('Firestore batch sync error:', err);
      return { success: false, error: err.message };
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FirebaseSync };
}
