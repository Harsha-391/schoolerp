import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, School, Globe, X, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';
import { useNavigate } from 'react-router-dom';
import { getSchoolUrl } from '../../utils/subdomain';

export default function ManageSchools() {
  const [schools,      setSchools]      = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInput,  setDeleteInput]  = useState('');
  const [deleting,     setDeleting]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const navigate = useNavigate();

  const initialForm = {
    name: '', address: '', city: '', state: '', phone: '', email: '',
    subdomain: '', rate_per_student: 250, payment_methods: ['online', 'cash'], razorpay_account_id: '',
    admin_name: '', admin_email: '', admin_password: 'school123',
  };
  const [form, setForm] = useState(initialForm);

  const loadSchools = () => api.get('/developer/schools').then(res => setSchools(res.data));
  useEffect(() => { loadSchools().finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/developer/schools/${editingId}`, form);
      } else {
        await api.post('/developer/schools', form);
      }
      setShowModal(false);
      setEditingId(null);
      setForm(initialForm);
      loadSchools();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save school');
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== deleteTarget.name) return;
    setDeleting(true);
    try {
      await api.delete(`/developer/schools/${deleteTarget.id}`);
      setDeleteTarget(null);
      setDeleteInput('');
      loadSchools();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete school');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (school) => {
    setForm({
      ...initialForm, ...school,
      admin_name: school.admin?.name || '',
      admin_email: school.admin?.email || '',
      admin_password: '',
    });
    setEditingId(school.id);
    setShowModal(true);
  };

  if (loading) return <Layout title="Manage Schools"><SkManagementPage cols={4} rows={6} /></Layout>;

  return (
    <Layout title="Manage Schools" subtitle="Add and manage schools on the platform">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Schools</h1>
          <p className="page-subtitle">{schools.length} schools registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> Add School
        </button>
      </div>

      {/* ── School cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schools.length === 0 ? (
          <div className="card">
            <div className="empty-state">No schools registered yet.</div>
          </div>
        ) : schools.map(school => (
          <div className="card" key={school.id}>
            <div className="card-body" style={{ padding: '18px 20px' }}>
              {/* School header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                  background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <School size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{school.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {school.city}{school.state ? `, ${school.state}` : ''}
                  </div>
                  <a
                    href={getSchoolUrl(school.subdomain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-purple"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                  >
                    <Globe size={9} /> {school.subdomain}.localhost <ExternalLink size={8} />
                  </a>
                </div>
                <span className={`badge ${school.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {school.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Students</div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>{school.student_count}</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Staff</div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>{school.staff_count}</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Revenue</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success)' }}>
                    ₹{(school.student_count * school.rate_per_student).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Rate chip + actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ₹{school.rate_per_student}/student/month
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/developer/analytics?school=${school.id}`)}
                    title="Analytics" style={{ padding: '7px 11px' }}>
                    <Eye size={13} />
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(school)}
                    title="Edit" style={{ padding: '7px 11px' }}>
                    <Edit size={13} />
                  </button>
                  <button className="btn btn-sm"
                    onClick={() => { setDeleteTarget(school); setDeleteInput(''); }}
                    title="Delete"
                    style={{ padding: '7px 11px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add/Edit School Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit School' : 'Add New School'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  School Details
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">School Name *</label>
                    <input className="form-input" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subdomain *</label>
                    <input className="form-input" value={form.subdomain}
                      onChange={e => setForm({ ...form, subdomain: e.target.value })}
                      placeholder="e.g. greenvalley" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rate per Student (₹/month) *</label>
                    <input className="form-input" type="number" value={form.rate_per_student}
                      onChange={e => setForm({ ...form, rate_per_student: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Razorpay Account ID</label>
                    <input className="form-input" value={form.razorpay_account_id}
                      onChange={e => setForm({ ...form, razorpay_account_id: e.target.value })} placeholder="acc_..." />
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: '20px' }}>
                  School Admin Login
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Admin Name</label>
                    <input className="form-input" value={form.admin_name}
                      onChange={e => setForm({ ...form, admin_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Email *</label>
                    <input className="form-input" type="email" value={form.admin_email}
                      onChange={e => setForm({ ...form, admin_email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Password {editingId && '(leave blank to keep current)'}</label>
                  <input className="form-input" value={form.admin_password}
                    onChange={e => setForm({ ...form, admin_password: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create School'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--danger)' }}>Delete School</div>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--danger)',
              }}>
                This will permanently delete <strong>{deleteTarget.name}</strong> and erase all of its data —{' '}
                {deleteTarget.student_count} students, {deleteTarget.staff_count} staff, all records. This cannot be undone.
              </div>
              <div className="form-group">
                <label className="form-label">Type <strong>{deleteTarget.name}</strong> to confirm</label>
                <input className="form-input" value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder={deleteTarget.name} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="btn"
                disabled={deleteInput !== deleteTarget.name || deleting}
                onClick={handleDelete}
                style={{
                  background: deleteInput === deleteTarget.name ? 'var(--danger)' : 'rgba(239,68,68,0.3)',
                  color: '#fff', cursor: deleteInput === deleteTarget.name ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
