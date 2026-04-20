import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

const STATUS_CONFIG = {
  approved: { badge: 'badge-success', icon: CheckCircle, color: 'var(--success)' },
  rejected: { badge: 'badge-danger',  icon: XCircle,     color: 'var(--danger)'  },
  pending:  { badge: 'badge-warning', icon: Clock,        color: 'var(--warning)' },
};

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadLeaves = () => api.get('/admin/leaves').then(res => setLeaves(res.data));
  useEffect(() => { loadLeaves().finally(() => setLoading(false)); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/leaves/${id}`, { status });
    loadLeaves();
  };

  if (loading) return <Layout title="Leave Requests"><SkManagementPage cols={4} rows={6} /></Layout>;

  const counts = {
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <Layout title="Leave Requests" subtitle="Staff leave management">

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Requests</div>
          <div className="stat-card-value">{leaves.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending</div>
          <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{counts.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Approved</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{counts.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rejected</div>
          <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{counts.rejected}</div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="tabs" style={{ marginBottom: '14px' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${leaves.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* ── Leave list ── */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No {filter === 'all' ? '' : filter} leave requests</div>
        ) : filtered.map(l => {
          const cfg  = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const days = l.start_date === l.end_date ? '1 day'
            : `${Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1} days`;
          return (
            <div key={l.id} className="list-item" style={{ padding: '16px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 700, marginTop: '2px',
              }}>
                {l.staff_name?.charAt(0)}
              </div>

              {/* Content */}
              <div className="list-item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <span className="list-item-title">{l.staff_name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.designation}</span>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '10px' }}>{l.type} Leave</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  {l.start_date} → {l.end_date} · {days}
                </div>
                {l.reason && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{l.reason}</div>
                )}
              </div>

              {/* Status + actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                <span className={`badge ${cfg.badge}`} style={{ textTransform: 'capitalize', fontSize: '10px' }}>
                  {l.status}
                </span>
                {l.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => updateStatus(l.id, 'approved')}
                      title="Approve"
                      style={{ padding: '6px 10px' }}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => updateStatus(l.id, 'rejected')}
                      title="Reject"
                      style={{ padding: '6px 10px' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
