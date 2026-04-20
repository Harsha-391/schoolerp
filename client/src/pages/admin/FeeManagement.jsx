import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { DollarSign, Plus, X, Calendar, CheckCircle, Clock } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function FeeManagement() {
  const [tab,        setTab]        = useState('structure');
  const [structures, setStructures] = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [grades,     setGrades]     = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [form, setForm] = useState({ grade_id: '', name: '', amount: '', frequency: 'monthly', due_day: 10 });

  useEffect(() => {
    Promise.all([
      api.get('/admin/fees/structure').then(res => setStructures(res.data)),
      api.get('/admin/fees/payments').then(res => setPayments(res.data)),
      api.get('/admin/grades').then(res => setGrades(res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/admin/fees/structure', { ...form, amount: Number(form.amount), due_day: Number(form.due_day) });
    setShowModal(false);
    setForm({ grade_id: '', name: '', amount: '', frequency: 'monthly', due_day: 10 });
    api.get('/admin/fees/structure').then(res => setStructures(res.data));
  };

  if (loading) return <Layout title="Fee Management"><SkManagementPage cols={3} rows={7} /></Layout>;

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount   = payments.filter(p => p.status !== 'paid').length;

  return (
    <Layout title="Fee Management" subtitle="Fee structures and payment tracking">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Fees</h1>
          <p className="page-subtitle">{structures.length} fee types configured</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Fee
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Fee Types</div>
          <div className="stat-card-value">{structures.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Payments</div>
          <div className="stat-card-value">{payments.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Collected</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>₹{totalCollected.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending</div>
          <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs" style={{ marginBottom: '14px' }}>
        <button className={`tab ${tab === 'structure' ? 'active' : ''}`} onClick={() => setTab('structure')}>
          Fee Structure ({structures.length})
        </button>
        <button className={`tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>
          Payments ({payments.length})
        </button>
      </div>

      {/* ── Fee Structure list ── */}
      {tab === 'structure' && (
        <div className="card">
          {structures.length === 0 ? (
            <div className="empty-state">No fee structures configured yet.</div>
          ) : structures.map(f => (
            <div key={f.id} className="list-item" style={{ padding: '16px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--success-light)', border: '1px solid var(--success-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DollarSign size={18} color="var(--success)" />
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{f.name}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">{f.grade_name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {f.frequency}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Due: {f.due_day}th
                  </span>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--success)', flexShrink: 0 }}>
                ₹{f.amount?.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Payments list ── */}
      {tab === 'payments' && (
        <div className="card">
          {payments.length === 0 ? (
            <div className="empty-state">No payment records yet.</div>
          ) : payments.map(p => (
            <div key={p.id} className="list-item" style={{ padding: '14px 16px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700,
              }}>
                {p.student_name?.charAt(0)}
              </div>
              <div className="list-item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="list-item-title">{p.student_name}</span>
                  <span className="badge badge-purple" style={{ fontSize: '10px' }}>{p.student_roll}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {p.fee_type} · <span style={{ textTransform: 'capitalize' }}>{p.payment_method}</span> · {p.payment_date}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success)' }}>
                  ₹{p.amount?.toLocaleString()}
                </span>
                <span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}
                  style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Fee Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Fee Structure</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Fee Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade *</label>
                  <select className="form-select" value={form.grade_id}
                    onChange={e => setForm({ ...form, grade_id: e.target.value })} required>
                    <option value="">Select grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="form-input" type="number" value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select className="form-select" value={form.frequency}
                      onChange={e => setForm({ ...form, frequency: e.target.value })}>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Fee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
