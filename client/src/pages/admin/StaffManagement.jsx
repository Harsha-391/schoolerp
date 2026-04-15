import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import IDCard from '../../components/IDCard';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Mail, Phone, Briefcase, CreditCard, Upload } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

function compressImage(file, maxWidth = 300) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function StaffManagement() {
  const { school } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [idCardTarget, setIdCardTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: 'Teacher', department: '', salary: '', avatar: '' });
  const [avatarPreview, setAvatarPreview] = useState('');

  const loadStaff = () => api.get('/admin/staff').then(res => setStaff(res.data));

  useEffect(() => { loadStaff().finally(() => setLoading(false)); }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setAvatarPreview(dataUrl);
    setForm(prev => ({ ...prev, avatar: dataUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/staff', { ...form, salary: Number(form.salary) });
    // If photo was set, save it immediately after create
    if (form.avatar) {
      await api.put(`/admin/staff/${res.data.id}/avatar`, { avatar: form.avatar }).catch(() => {});
    }
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', designation: 'Teacher', department: '', salary: '', avatar: '' });
    setAvatarPreview('');
    loadStaff();
  };

  const openAddModal = () => {
    setForm({ name: '', email: '', phone: '', designation: 'Teacher', department: '', salary: '', avatar: '' });
    setAvatarPreview('');
    setShowModal(true);
  };

  if (loading) return <Layout title="Staff Management"><SkManagementPage cards cardCount={6} /></Layout>;

  return (
    <Layout title="Staff Management" subtitle="Manage teachers and staff">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Members</h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {staff.map(s => (
          <div className="card" key={s.id}>
            <div className="card-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                {s.avatar
                  ? <img src={s.avatar} alt={s.name} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
                  : <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', borderRadius: '14px' }}>{s.name?.charAt(0)}</div>
                }
                <div style={{ flex: 1 }}>
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

              <div style={{ marginTop: '12px' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIdCardTarget(s)}
                >
                  <CreditCard size={13} /> View ID Card
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Staff Member</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Photo upload */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '14px', flexShrink: 0,
                    background: avatarPreview ? 'none' : 'rgba(99,102,241,0.1)',
                    border: '2px dashed var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Upload size={22} style={{ color: 'var(--text-muted)' }} />
                    }
                  </div>
                  <div>
                    <label className="form-label">Photo (optional)</label>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Used on ID card</div>
                  </div>
                </div>

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

      {/* ID Card Modal */}
      {idCardTarget && (
        <IDCard
          person={idCardTarget}
          type="staff"
          school={school}
          onClose={() => setIdCardTarget(null)}
        />
      )}
    </Layout>
  );
}
