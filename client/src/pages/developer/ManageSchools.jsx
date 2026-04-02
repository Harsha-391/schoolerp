import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, School, Users, GraduationCap, MapPin, Globe, X, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManageSchools() {
  const [schools, setSchools] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const initialForm = {
    name: '', address: '', city: '', state: '', phone: '', email: '',
    subdomain: '', rate_per_student: 250, payment_methods: ['online', 'cash'], razorpay_account_id: '',
    admin_name: '', admin_email: '', admin_password: 'school123',
  };
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();

  const loadSchools = () => {
    api.get('/developer/schools').then(res => setSchools(res.data));
  };

  useEffect(() => { loadSchools(); }, []);

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

  const openEditModal = (school) => {
    setForm({
      ...initialForm,
      ...school,
      admin_name: school.admin?.name || '',
      admin_email: school.admin?.email || '',
      admin_password: '', // Leave empty to not change unless typed
    });
    setEditingId(school.id);
    setShowModal(true);
  };

  return (
    <Layout title="Manage Schools" subtitle="Add and manage schools on the platform">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schools</h1>
          <p className="page-subtitle">{schools.length} schools registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null);
          setForm(initialForm);
          setShowModal(true);
        }}>
          <Plus size={16} /> Add School
        </button>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Subdomain</th>
                <th>Students</th>
                <th>Staff</th>
                <th>Rate/Student</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(school => (
                <tr key={school.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="stat-card-icon purple" style={{ width: '34px', height: '34px', borderRadius: '8px' }}>
                        <School size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{school.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{school.city}, {school.state}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple">
                      <Globe size={10} /> {school.subdomain}.erp.com
                    </span>
                  </td>
                  <td><GraduationCap size={13} style={{ marginRight: '4px' }} />{school.student_count}</td>
                  <td><Users size={13} style={{ marginRight: '4px' }} />{school.staff_count}</td>
                  <td>₹{school.rate_per_student}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{(school.student_count * school.rate_per_student).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${school.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/developer/analytics?school=${school.id}`)}>
                        <Eye size={13} />
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(school)}><Edit size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit School' : 'Add New School'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>School Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">School Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subdomain *</label>
                    <input className="form-input" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value })} placeholder="e.g. greenvalley" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rate per Student (₹/month) *</label>
                    <input className="form-input" type="number" value={form.rate_per_student} onChange={e => setForm({ ...form, rate_per_student: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Razorpay Account ID (Route)</label>
                    <input className="form-input" value={form.razorpay_account_id} onChange={e => setForm({ ...form, razorpay_account_id: e.target.value })} placeholder="acc_..." />
                  </div>
                </div>

                <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>School Admin Login</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Admin Name</label>
                    <input className="form-input" value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Email *</label>
                    <input className="form-input" type="email" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Password</label>
                  <input className="form-input" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} />
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
    </Layout>
  );
}
