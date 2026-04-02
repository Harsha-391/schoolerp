import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { CheckCircle, XCircle, Clock, Eye, X, AlertCircle } from 'lucide-react';

export default function PaymentVerification() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = () => {
    api.get('/payments/admin/pending').then(r => setPending(r.data));
    api.get('/payments/admin/all').then(r => setAll(r.data));
  };
  useEffect(() => { loadData(); }, []);

  const handleVerify = async (id, status) => {
    await api.put(`/payments/admin/verify/${id}`, { status, reject_reason: rejectReason });
    setShowDetail(null);
    setRejectReason('');
    loadData();
  };

  const displayList = tab === 'pending' ? pending : all;

  return (
    <Layout title="Payment Verification" subtitle="Verify student payments">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{pending.length} pending verification</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div style={{
          padding: '16px 20px', marginBottom: '20px', borderRadius: 'var(--radius-md)',
          background: 'var(--warning-light)', border: '1px solid var(--warning-border)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
          <span style={{ fontWeight: 600, color: '#92400e', fontSize: '13px' }}>
            {pending.length} payment(s) require your verification
          </span>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending ({pending.length})
        </button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Payments ({all.length})
        </button>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Fee</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Txn ID</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.student_name}</td>
                  <td><span className="badge badge-purple">{r.student_roll}</span></td>
                  <td>{r.fee_name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{r.amount?.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {r.payment_method_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.transaction_id || '—'}</td>
                  <td style={{ fontSize: '12px' }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}
                      style={{ textTransform: 'capitalize' }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleVerify(r.id, 'approved')} title="Approve">
                          <CheckCircle size={13} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setShowDetail(r)} title="Review / Reject">
                          <Eye size={13} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {r.reviewed_by && `By ${r.reviewed_by}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {displayList.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {tab === 'pending' ? 'No pending payments 🎉' : 'No payment records yet'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Review Payment</div>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  ['Student', showDetail.student_name],
                  ['Roll No', showDetail.student_roll],
                  ['Fee', showDetail.fee_name],
                  ['Amount', `₹${showDetail.amount?.toLocaleString()}`],
                  ['Method', showDetail.payment_method_label],
                  ['Txn/Ref ID', showDetail.transaction_id || 'Not provided'],
                  ['Submitted', new Date(showDetail.submitted_at).toLocaleString()],
                ].map(([label, value], i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{value}</div>
                  </div>
                ))}
              </div>

              {showDetail.payment_proof_note && (
                <div style={{ padding: '12px', background: 'var(--info-light)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--info-border)' }}>
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
