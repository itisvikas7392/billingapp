import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Eye, 
  Copy, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileCheck,
  Cloud,
  CloudUpload
} from 'lucide-react';

export default function InvoicesHistory({
  invoices,
  onSelectInvoice,
  onCloneInvoice,
  onDeleteInvoice,
  onPrintInvoice,
  onNewInvoice,
  onResyncInvoice
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalReceived = 0;
    let totalDue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    invoices.forEach(inv => {
      const tot = Number(inv.total) || 0;
      const rec = Number(inv.paymentMade) || 0;
      const due = Number(inv.balanceDue !== undefined ? inv.balanceDue : (tot - rec));

      totalBilled += tot;
      totalReceived += rec;
      totalDue += due;

      if (due <= 0 && tot > 0) {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalCount: invoices.length,
      totalBilled,
      totalReceived,
      totalDue,
      paidCount,
      pendingCount
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer?.phone || '').includes(searchTerm);

      if (!matchSearch) return false;

      if (statusFilter === 'paid') {
        return (Number(inv.balanceDue) || 0) <= 0;
      }
      if (statusFilter === 'pending') {
        return (Number(inv.balanceDue) || 0) > 0;
      }
      return true;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto p-6 w-full flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Invoices History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse, search, duplicate, and print all single-page tax bills.
          </p>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition transform active:scale-95"
          onClick={onNewInvoice}
        >
          <Plus size={14} /> + Create New Bill
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bills</span>
            <FileCheck size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Billed</span>
            <DollarSign size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            ₹{stats.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Received</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ₹{stats.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Dues</span>
            <Clock size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            ₹{stats.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="relative w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-2xs"
            placeholder="Search by invoice # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            All ({stats.totalCount})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setStatusFilter('paid')}
          >
            Paid ({stats.paidCount})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending Dues ({stats.pendingCount})
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Balance (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Cloud Sync</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const total = Number(inv.total) || 0;
                  const bal = Number(inv.balanceDue !== undefined ? inv.balanceDue : (total - (Number(inv.paymentMade) || 0)));
                  const isPaid = bal <= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-blue-600 font-mono">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{inv.date || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {inv.customer?.name || 'CASH CUSTOMER'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{inv.customer?.phone || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${bal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Synchronized to Cloud">
                          <Cloud size={11} className="text-emerald-600" /> Synced
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5 items-center">
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
                            onClick={() => onSelectInvoice(inv.id)}
                            title="Open & Edit in Editor"
                          >
                            <Eye size={12} /> Edit
                          </button>
                          {onResyncInvoice && (
                            <button
                              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition hover:text-blue-600"
                              onClick={() => onResyncInvoice(inv.id)}
                              title="Resync Bill to Google Sheet"
                            >
                              <CloudUpload size={13} />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
                            onClick={() => onPrintInvoice(inv.id)}
                            title="Quick Print"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
                            onClick={() => onCloneInvoice(inv.id)}
                            title="Duplicate as Next Bill"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            onClick={() => onDeleteInvoice(inv.id)}
                            title="Delete Bill"
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
    </div>
  );
}
