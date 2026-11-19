import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Eye, 
  Copy, 
  Trash2, 
  Plus, 
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function InvoicesHistory({
  invoices,
  onSelectInvoice,
  onCloneInvoice,
  onDeleteInvoice,
  onPrintInvoice,
  onNewInvoice
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
    <div className="content-page">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Invoices History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Browse, search, duplicate, and print past invoices.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNewInvoice}>
          <Plus size={14} /> + Create New Bill
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Bills Issued</div>
          <div className="stat-val">{stats.totalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Billed (₹)</div>
          <div className="stat-val text-primary">
            ₹{stats.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Received (₹)</div>
          <div className="stat-val text-green-700">
            ₹{stats.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Dues (₹)</div>
          <div className="stat-val text-red-600">
            ₹{stats.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2rem' }}
            placeholder="Search by invoice # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({stats.totalCount})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('paid')}
          >
            Paid ({stats.paidCount})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending Dues ({stats.pendingCount})
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-responsive" style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th style={{ textAlign: 'right' }}>Total (₹)</th>
              <th style={{ textAlign: 'right' }}>Balance (₹)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => {
                const total = Number(inv.total) || 0;
                const bal = Number(inv.balanceDue !== undefined ? inv.balanceDue : (total - (Number(inv.paymentMade) || 0)));
                const isPaid = bal <= 0;

                return (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>{inv.invoiceNumber}</strong>
                    </td>
                    <td>{inv.date || '-'}</td>
                    <td>{inv.customer?.name || 'CASH CUSTOMER'}</td>
                    <td>{inv.customer?.phone || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: bal > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}`}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectInvoice(inv.id)}
                          title="Open & Edit in Editor"
                        >
                          <Eye size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onPrintInvoice(inv.id)}
                          title="Quick Print"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onCloneInvoice(inv.id)}
                          title="Duplicate as Next Bill"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
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
  );
}
