import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, Users, Phone, Mail, Briefcase, DollarSign } from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: 'Teacher', department: '', salary: '' });

  const loadStaff = () => api.get('/admin/staff').then(res => setStaff(res.data));
  useEffect(() => { loadStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/admin/staff', { ...form, salary: Number(form.salary) });
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', designation: 'Teacher', department: '', salary: '' });
    loadStaff();
  };

  return (
    <Layout title="Staff Management" subtitle="Manage teachers and staff">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Members</h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {staff.map(s => (
          <div className="card" key={s.id} style={{ transition: 'transform 0.2s' }}>
            <div className="card-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', borderRadius: '14px' }}>
                  {s.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.designation} · {s.department}</div>
                </div>
                <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Attendance</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: Number(s.attendance_percentage) > 80 ? 'var(--success)' : 'var(--warning)' }}>
                    {s.attendance_percentage}%
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Salary</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>₹{s.salary?.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Mail size={13} /> {s.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Phone size={13} /> {s.phone}
                </div>
                {s.assigned_class && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent-primary-hover)' }}>
                    <Briefcase size={13} /> Class Teacher: {s.assigned_class}
                  </div>
                )}
              </div>

              {s.pending_leaves > 0 && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--warning-bg)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600 }}>
                    {s.pending_leaves} pending leave request(s)
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Staff Member</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <select className="form-select" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                      <option>Teacher</option>
                      <option>Vice Principal</option>
                      <option>Librarian</option>
                      <option>Lab Assistant</option>
                      <option>Office Staff</option>
                      <option>Peon</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Salary (₹)</label>
                  <input className="form-input" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
