import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

const LEAVE_TYPES = [
  { value: 'casual',    label: 'Casual Leave'    },
  { value: 'sick',      label: 'Sick Leave'       },
  { value: 'earned',    label: 'Earned Leave'     },
  { value: 'maternity', label: 'Maternity Leave'  },
];

const STATUS_CONFIG = {
  approved: { badge: 'badge-success', icon: CheckCircle, color: 'var(--success)' },
  rejected: { badge: 'badge-danger',  icon: XCircle,     color: 'var(--danger)'  },
  pending:  { badge: 'badge-warning', icon: Clock,       color: 'var(--warning)' },
};

export default function LeaveApplication() {
  const [leaves,     setLeaves]     = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState({ type: 'casual', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/staff/leaves').then(res => setLeaves(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/staff/leave', form);
      setShowModal(false);
      setForm({ type: 'casual', start_date: '', end_date: '', reason: '' });
      load();
    } catch { alert('Failed to submit.'); }
    finally { setSubmitting(false); }
  };

  const counts = {
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <Layout title="Leave" subtitle="Apply and track leave requests">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Leaves</h1>
          <p className="page-subtitle">{leaves.length} total requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Apply
        </button>
      </div>

      {/* ── Summary chips ── */}
      {leaves.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span className="badge badge-warning">{counts.pending} Pending</span>
          <span className="badge badge-success">{counts.approved} Approved</span>
          <span className="badge badge-danger">{counts.rejected} Rejected</span>
        </div>
      )}

      {/* ── Leave cards ── */}
      {leaves.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No leave requests yet</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
              Apply for Leave
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          {leaves.map(l => {
            const cfg  = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const days = l.start_date === l.end_date ? '1 day'
              : `${Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1} days`;
            return (
              <div key={l.id} className="list-item" style={{ padding: '16px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                  background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span className="list-item-title" style={{ textTransform: 'capitalize' }}>{l.type} Leave</span>
                    <span className={`badge ${cfg.badge}`} style={{ textTransform: 'capitalize', fontSize: '10px' }}>{l.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {l.start_date} → {l.end_date} · {days}
                  </div>
                  {l.reason && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {l.reason}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {l.applied_on}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Apply modal (bottom sheet on mobile) ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Apply for Leave</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">From Date *</label>
                    <input className="form-input" type="date" value={form.start_date}
                      onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date *</label>
                    <input className="form-input" type="date" value={form.end_date}
                      onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea className="form-input" rows={3} value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    placeholder="Briefly describe the reason for leave…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
