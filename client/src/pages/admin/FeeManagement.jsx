import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { DollarSign, Plus, X } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function FeeManagement() {
  const [tab, setTab] = useState('structure');
  const [structures, setStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
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
    api.get('/admin/fees/structure').then(res => setStructures(res.data));
  };

  if (loading) return <Layout title="Fee Management"><SkManagementPage cols={5} rows={7} hasSearch /></Layout>;

  return (
    <Layout title="Fee Management" subtitle="Fee structures and payment tracking">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fees</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Fee
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'structure' ? 'active' : ''}`} onClick={() => setTab('structure')}>Fee Structure</button>
        <button className={`tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>Payments</button>
      </div>

      {tab === 'structure' && (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Fee Name</th><th>Grade</th><th>Amount</th><th>Frequency</th><th>Due Day</th></tr></thead>
              <tbody>
                {structures.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</td>
                    <td><span className="badge badge-purple">{f.grade_name}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{f.amount?.toLocaleString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{f.frequency}</td>
                    <td>{f.due_day}th of month</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Roll No</th><th>Fee Type</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.student_name}</td>
                    <td>{p.student_roll}</td>
                    <td>{p.fee_type}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount?.toLocaleString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                    <td>{p.payment_date}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade *</label>
                  <select className="form-select" value={form.grade_id} onChange={e => setForm({ ...form, grade_id: e.target.value })} required>
                    <option value="">Select</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
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
