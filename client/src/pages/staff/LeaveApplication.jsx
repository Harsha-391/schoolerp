import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X } from 'lucide-react';

export default function LeaveApplication() {
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'casual', start_date: '', end_date: '', reason: '' });

  const loadLeaves = () => api.get('/staff/leaves').then(res => setLeaves(res.data));
  useEffect(() => { loadLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/staff/leave', form);
    setShowModal(false);
    setForm({ type: 'casual', start_date: '', end_date: '', reason: '' });
    loadLeaves();
  };

  return (
    <Layout title="Leave Application" subtitle="Apply and track leaves">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Leaves</h1>
          <p className="page-subtitle">{leaves.length} leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Applied</th><th>Status</th></tr></thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{l.type}</span></td>
                  <td>{l.start_date}</td>
                  <td>{l.end_date}</td>
                  <td>{l.reason}</td>
                  <td>{l.applied_on}</td>
                  <td>
                    <span className={`badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="earned">Earned Leave</option>
                    <option value="maternity">Maternity Leave</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">From Date *</label>
                    <input className="form-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date *</label>
                    <input className="form-input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea className="form-input" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
