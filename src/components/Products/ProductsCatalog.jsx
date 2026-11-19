import React, { useState } from 'react';
import { Plus, Package, Trash2, PlusCircle } from 'lucide-react';

export default function ProductsCatalog({
  items,
  onAddItem,
  onDeleteItem,
  onAddProductToBill
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    hsn: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddItem({
      id: 'item-' + Date.now(),
      name: formData.name.trim(),
      rate: parseFloat(formData.rate) || 0,
      hsn: formData.hsn.trim(),
      description: formData.description.trim()
    });

    setFormData({ name: '', rate: '', hsn: '', description: '' });
    setShowAddModal(false);
  };

  return (
    <div className="content-page">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Products & Services Catalog</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Pre-configure frequently billed items, services, HSN/SAC codes, and standard rates.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> + Add Item
        </button>
      </div>

      <div className="table-responsive" style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item / Service Name</th>
              <th>Description</th>
              <th>HSN / SAC</th>
              <th style={{ textAlign: 'right' }}>Standard Rate (₹)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No catalog items found. Click "+ Add Item" to create your first product!
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ color: 'var(--text-dark)' }}>{item.name}</strong>
                  </td>
                  <td>{item.description || '-'}</td>
                  <td>{item.hsn || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onAddProductToBill(item)}
                        title="Add item directly to current invoice"
                      >
                        <PlusCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                        + Add to Bill
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDeleteItem(item.id)}
                        title="Delete from Catalog"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem' }}>Add Product / Service</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item / Service Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Class 3 DSC, DSC Token..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Standard Rate (₹) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>HSN / SAC Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 998313 or 8471"
                  value={formData.hsn}
                  onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Brief description or specs"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
