import React, { useState, useMemo } from 'react';
import { Plus, Trash2, PlusCircle, X, Search, Edit3 } from 'lucide-react';

export default function ProductsCatalog({
  items,
  onAddItem,
  onDeleteItem,
  onAddProductToBill
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    hsn: '',
    description: ''
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', rate: '', hsn: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      rate: item.rate !== undefined ? String(item.rate) : '',
      hsn: item.hsn || '',
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      onAddItem({
        ...editingItem,
        name: formData.name.trim(),
        rate: parseFloat(formData.rate) || 0,
        hsn: formData.hsn.trim(),
        description: formData.description.trim()
      });
    } else {
      onAddItem({
        id: 'item-' + Date.now(),
        name: formData.name.trim(),
        rate: parseFloat(formData.rate) || 0,
        hsn: formData.hsn.trim(),
        description: formData.description.trim()
      });
    }

    setFormData({ name: '', rate: '', hsn: '', description: '' });
    setShowModal(false);
    setEditingItem(null);
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return (items || []).filter(item =>
      (item.name || '').toLowerCase().includes(term) ||
      (item.hsn || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-6 w-full flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Products & Services Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configure frequently billed items, services, HSN/SAC codes, and standard rates.
          </p>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition transform active:scale-95"
          onClick={openAddModal}
        >
          <Plus size={14} /> + Add Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            placeholder="Search products by name, HSN code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> of {items.length} items
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Item / Service Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">HSN / SAC</th>
                <th className="py-3 px-4 text-right">Standard Rate (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {searchTerm ? 'No products found matching your search.' : 'No catalog items found. Click "+ Add Item" to create your first product!'}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.description || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{item.hsn || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5 items-center">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                          onClick={() => onAddProductToBill(item)}
                          title="Add item directly to current invoice"
                        >
                          <PlusCircle size={13} /> + Add to Bill
                        </button>
                        <button
                          className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
                          onClick={() => openEditModal(item)}
                          title="Edit Product"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
      </div>

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingItem ? 'Edit Product / Service' : 'Add Product / Service'}
              </h3>
              <button 
                className="text-slate-400 hover:text-slate-600 p-1"
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item / Service Name *</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Class 3 DSC, DSC Token..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Standard Rate (₹) *</label>
                <input
                  type="number"
                  step="any"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">HSN / SAC Code</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 998313 or 8471"
                  value={formData.hsn}
                  onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
                <textarea
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="Brief description or specs"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
