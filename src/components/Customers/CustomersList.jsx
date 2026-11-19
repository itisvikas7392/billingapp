import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ArrowRight, X, Search, Edit3 } from 'lucide-react';

export default function CustomersList({
  customers,
  invoices,
  onAddCustomer,
  onDeleteCustomer,
  onSelectCustomerForBill
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: ''
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', gstin: '' });
    setShowModal(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      gstin: cust.gstin || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      onAddCustomer({
        ...editingCustomer,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim()
      });
    } else {
      onAddCustomer({
        id: 'cust-' + Date.now(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim()
      });
    }

    setFormData({ name: '', phone: '', email: '', address: '', gstin: '' });
    setShowModal(false);
    setEditingCustomer(null);
  };

  // Compute stats per customer from invoices
  const customerStats = useMemo(() => {
    const stats = {};
    (invoices || []).forEach(inv => {
      const name = (inv.customer?.name || '').trim().toLowerCase();
      if (!name) return;
      if (!stats[name]) {
        stats[name] = { totalBills: 0, totalAmount: 0, lastBillNo: '', lastDate: '' };
      }
      stats[name].totalBills++;
      stats[name].totalAmount += (Number(inv.total) || 0);
      stats[name].lastBillNo = inv.invoiceNumber;
      stats[name].lastDate = inv.date;
    });
    return stats;
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return (customers || []).filter(c => 
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      (c.gstin || '').toLowerCase().includes(term) ||
      (c.address || '').toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-6 w-full flex-1 overflow-y-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage saved customer profiles, search directory, and start bills directly.
          </p>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition transform active:scale-95"
          onClick={openAddModal}
        >
          <Plus size={14} /> + Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            placeholder="Search by customer name, phone, address, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredCustomers.length}</span> of {customers.length} customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-center">Total Bills</th>
                <th className="py-3 px-4 text-right">Total Billed (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers saved yet. Customers are automatically saved as you bill them!'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const key = (c.name || '').trim().toLowerCase();
                  const stat = customerStats[key] || { totalBills: 0, totalAmount: 0 };

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.phone || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{c.address || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{c.gstin || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {stat.totalBills} Bills
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{stat.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5 items-center">
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                            onClick={() => onSelectCustomerForBill(c)}
                            title="Start fresh bill for customer"
                          >
                            Bill Now <ArrowRight size={12} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
                            onClick={() => openEditModal(c)}
                            title="Edit Customer"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button 
                className="text-slate-400 hover:text-slate-600 p-1"
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Full Name / Company Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="City, State, PIN"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="15-digit GSTIN"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
