import React, { useState } from 'react';
import { Plus, User, Phone, MapPin, Trash2, ArrowRight } from 'lucide-react';

export default function CustomersList({
  customers,
  invoices,
  onAddCustomer,
  onDeleteCustomer,
  onSelectCustomerForBill
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddCustomer({
      id: 'cust-' + Date.now(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      gstin: formData.gstin.trim()
    });

    setFormData({ name: '', phone: '', email: '', address: '', gstin: '' });
    setShowAddModal(false);
  };

  // Compute stats per customer from invoices
  const customerStats = {};
  invoices.forEach(inv => {
    const name = (inv.customer?.name || '').trim().toLowerCase();
    if (!name) return;
    if (!customerStats[name]) {
      customerStats[name] = { totalBills: 0, totalAmount: 0, lastBillNo: '', lastDate: '' };
    }
    customerStats[name].totalBills++;
    customerStats[name].totalAmount += (Number(inv.total) || 0);
    customerStats[name].lastBillNo = inv.invoiceNumber;
    customerStats[name].lastDate = inv.date;
  });

  return (
    <div className="content-page">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Customer Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Manage saved customer profiles, billing history, and GST details.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> + Add Customer
        </button>
      </div>

      <div className="table-responsive" style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>GSTIN</th>
              <th style={{ textAlign: 'center' }}>Total Bills</th>
              <th style={{ textAlign: 'right' }}>Total Billed (₹)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No customers saved yet. Customers are automatically saved as you bill them!
                </td>
              </tr>
            ) : (
              customers.map(c => {
                const key = (c.name || '').trim().toLowerCase();
                const stat = customerStats[key] || { totalBills: 0, totalAmount: 0 };

                return (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: 'var(--text-dark)' }}>{c.name}</strong>
                    </td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.address || '-'}</td>
                    <td>{c.gstin || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                        {stat.totalBills} Bills
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{stat.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onSelectCustomerForBill(c)}
                          title="Start Bill for Customer"
                        >
                          Bill Now <ArrowRight size={12} style={{ display: 'inline' }} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteCustomer(c.id)}
                          title="Delete Customer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem' }}>Add New Customer</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full Name / Company Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="City, State, PIN"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>GSTIN (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="15-digit GSTIN"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
