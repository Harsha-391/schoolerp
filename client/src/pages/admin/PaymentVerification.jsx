import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { CheckCircle, XCircle, Clock, Eye, X, AlertCircle } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

const STATUS_CONFIG = {
  approved: { badge: 'badge-success', color: 'var(--success)' },
  rejected: { badge: 'badge-danger',  color: 'var(--danger)'  },
  pending:  { badge: 'badge-warning', color: 'var(--warning)' },
};

const METHOD_LABEL = (m) => (m || '').replace('_', ' ');

export default function PaymentVerification() {
  const [tab,          setTab]          = useState('pending');
  const [pending,      setPending]      = useState([]);
  const [all,          setAll]          = useState([]);
  const [showDetail,   setShowDetail]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading,      setLoading]      = useState(true);

  const loadData = () => Promise.all([
    api.get('/payments/admin/pending').then(r => setPending(r.data)),
    api.get('/payments/admin/all').then(r => setAll(r.data)),
  ]);
  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  const handleVerify = async (id, status) => {
    await api.put(`/payments/admin/verify/${id}`, { status, reject_reason: rejectReason });
    setShowDetail(null);
    setRejectReason('');
    loadData();
  };

  if (loading) return <Layout title="Payment Verification"><SkManagementPage cols={4} rows={7} /></Layout>;

  const displayList = tab === 'pending' ? pending : all;

  return (
    <Layout title="Payment Verification" subtitle="Verify student payments">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{pending.length} pending verification</p>
        </div>
      </div>

      {/* ── Pending alert ── */}
      {pending.length > 0 && (
        <div style={{
          padding: '14px 18px', marginBottom: '16px', borderRadius: 'var(--radius-md)',
          background: 'var(--warning-light)', border: '1px solid var(--warning-border)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#92400e', fontSize: '13px' }}>
            {pending.length} payment{pending.length > 1 ? 's' : ''} require your verification
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tabs" style={{ marginBottom: '14px' }}>
        <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending ({pending.length})
        </button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All ({all.length})
        </button>
      </div>

      {/* ── Payment list ── */}
      <div className="card">
        {displayList.length === 0 ? (
          <div className="empty-state">
            {tab === 'pending' ? 'No pending payments 🎉' : 'No payment records yet'}
          </div>
        ) : displayList.map(r => {
          const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
          return (
            <div key={r.id} className="list-item" style={{ padding: '16px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, marginTop: '2px',
              }}>
                {r.student_name?.charAt(0)}
              </div>

              {/* Content */}
              <div className="list-item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <span className="list-item-title">{r.student_name}</span>
                  <span className="badge badge-purple" style={{ fontSize: '10px' }}>{r.student_roll}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  {r.fee_name} ·{' '}
                  <span className="badge badge-info" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                    {METHOD_LABEL(r.payment_method_type)}
                  </span>
                </div>
                {r.transaction_id && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Txn: {r.transaction_id}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {new Date(r.submitted_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Right: amount + status + actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--success)' }}>
                  ₹{r.amount?.toLocaleString()}
                </span>
                <span className={`badge ${cfg.badge}`} style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                  {r.status}
                </span>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleVerify(r.id, 'approved')}
                      title="Approve"
                      style={{ padding: '5px 9px' }}
                    >
                      <CheckCircle size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setShowDetail(r)}
                      title="Review & Reject"
                      style={{ padding: '5px 9px' }}
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                )}
                {r.status !== 'pending' && r.reviewed_by && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>By {r.reviewed_by}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Review Detail Modal ── */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Review Payment</div>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  ['Student',    showDetail.student_name],
                  ['Roll No',    showDetail.student_roll],
                  ['Fee',        showDetail.fee_name],
                  ['Amount',     `₹${showDetail.amount?.toLocaleString()}`],
                  ['Method',     showDetail.payment_method_label],
                  ['Txn/Ref ID', showDetail.transaction_id || 'Not provided'],
                  ['Submitted',  new Date(showDetail.submitted_at).toLocaleString()],
                ].map(([label, value], i) => (
                  <div key={i} style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{value}</div>
                  </div>
                ))}
              </div>

              {showDetail.payment_proof_note && (
                <div style={{ padding: '12px', background: 'var(--info-light)', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--info-border)' }}>
                  <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Student's Note</div>
                  <div style={{ fontSize: '13px', color: '#1e40af' }}>{showDetail.payment_proof_note}</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Rejection Reason (if rejecting)</label>
                <textarea className="form-input" rows={2} value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction ID doesn't match our records" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleVerify(showDetail.id, 'rejected')}>
                <XCircle size={15} /> Reject
              </button>
              <button className="btn btn-success" onClick={() => handleVerify(showDetail.id, 'approved')}>
                <CheckCircle size={15} /> Approve & Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
