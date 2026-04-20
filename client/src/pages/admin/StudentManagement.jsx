import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import IDCard from '../../components/IDCard';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, GraduationCap, Phone, CreditCard, Upload, ChevronDown } from 'lucide-react';
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

export default function StudentManagement() {
  const { school } = useAuth();
  const [students,      setStudents]      = useState([]);
  const [grades,        setGrades]        = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [showProfile,   setShowProfile]   = useState(null);
  const [idCardTarget,  setIdCardTarget]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [form, setForm] = useState({
    name: '', grade_id: '', section_id: '', father_name: '', mother_name: '',
    father_phone: '', mother_phone: '', address: '', dob: '', gender: '', blood_group: '', email: '', avatar: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/admin/grades').then(res => setGrades(res.data)),
      loadStudents(),
    ]).finally(() => setLoading(false));
  }, []);

  const loadStudents = (gradeId) => {
    const params = gradeId ? `?grade_id=${gradeId}` : '';
    return api.get(`/admin/students${params}`).then(res => setStudents(res.data));
  };

  const handleGradeFilter = (gradeId) => {
    setSelectedGrade(gradeId);
    loadStudents(gradeId);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setAvatarPreview(dataUrl);
    setForm(prev => ({ ...prev, avatar: dataUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/students', form);
    if (form.avatar) {
      await api.put(`/admin/students/${res.data.id}/avatar`, { avatar: form.avatar }).catch(() => {});
    }
    setShowModal(false);
    setAvatarPreview('');
    setForm({
      name: '', grade_id: '', section_id: '', father_name: '', mother_name: '',
      father_phone: '', mother_phone: '', address: '', dob: '', gender: '', blood_group: '', email: '', avatar: '',
    });
    loadStudents(selectedGrade);
  };

  const viewProfile = (studentId) => {
    api.get(`/admin/students/${studentId}`).then(res => setShowProfile(res.data));
  };

  if (loading) return <Layout title="Student Management"><SkManagementPage cols={4} rows={8} hasSearch /></Layout>;

  return (
    <Layout title="Student Management" subtitle="Manage all students">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* ── Grade filter ── */}
      <div style={{ marginBottom: '14px' }}>
        <select className="form-select" style={{ maxWidth: '240px' }}
          value={selectedGrade} onChange={e => handleGradeFilter(e.target.value)}>
          <option value="">All Grades ({students.length})</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name} ({g.student_count})</option>)}
        </select>
      </div>

      {/* ── Student list ── */}
      <div className="card">
        {students.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No students found</div>
          </div>
        ) : students.map(s => (
          <div key={s.id} className="list-item" style={{ padding: '14px 16px' }}>
            {/* Avatar */}
            {s.avatar
              ? <img src={s.avatar} alt={s.name} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{
                  width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 700,
                }}>
                  {s.name?.charAt(0)}
                </div>
            }

            {/* Content */}
            <div className="list-item-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span className="list-item-title">{s.name}</span>
                <span className="badge badge-purple" style={{ fontSize: '10px' }}>{s.roll_number}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                {s.grade_name} – {s.section_name}
                {s.gender && ` · ${s.gender}`}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className={`badge ${Number(s.attendance_percentage) > 80 ? 'badge-success' : Number(s.attendance_percentage) > 60 ? 'badge-warning' : 'badge-danger'}`}
                  style={{ fontSize: '10px' }}>
                  {s.attendance_percentage}% attendance
                </span>
                {s.total_fees_paid > 0 && (
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                    ₹{s.total_fees_paid?.toLocaleString()} paid
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => viewProfile(s.id)}
                style={{ padding: '6px 10px', fontSize: '11px' }}>
                Profile
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setIdCardTarget(s)}
                title="ID Card" style={{ padding: '6px 10px' }}>
                <CreditCard size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Student Profile Modal ── */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Student Profile</div>
              <button className="modal-close" onClick={() => setShowProfile(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {/* Profile hero */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
              }}>
                {showProfile.avatar
                  ? <img src={showProfile.avatar} alt={showProfile.name}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', fontWeight: 700,
                    }}>
                      {showProfile.name?.charAt(0)}
                    </div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{showProfile.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {showProfile.grade_name} – {showProfile.section_name} · Roll {showProfile.roll_number}
                  </div>
                  {showProfile.blood_group && (
                    <span className="badge badge-danger" style={{ marginTop: '4px', fontSize: '10px' }}>
                      {showProfile.blood_group}
                    </span>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  ['Date of Birth', showProfile.dob],
                  ['Gender',        showProfile.gender],
                  ['Father',        showProfile.father_name],
                  ['Mother',        showProfile.mother_name],
                ].map(([label, value], i) => value && (
                  <div key={i} style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{value}</div>
                  </div>
                ))}
                {(showProfile.father_phone || showProfile.mother_phone) && (
                  <div style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Contact</div>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {showProfile.father_phone && (
                        <a href={`tel:${showProfile.father_phone}`}
                          style={{ fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> Father
                        </a>
                      )}
                      {showProfile.mother_phone && (
                        <a href={`tel:${showProfile.mother_phone}`}
                          style={{ fontSize: '12px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> Mother
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {showProfile.address && (
                  <div style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Address</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{showProfile.address}</div>
                  </div>
                )}
              </div>

              {/* Marks */}
              {showProfile.marks?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Exam Marks</div>
                  <div className="card" style={{ marginBottom: 0 }}>
                    {showProfile.marks.map((m, i) => (
                      <div key={i} className="list-item" style={{ padding: '11px 14px' }}>
                        <div className="list-item-content">
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.subject_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{m.exam_name}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{m.obtained_marks}/{m.total_marks}</span>
                          <span className="badge badge-purple" style={{ fontSize: '10px' }}>{m.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => { setIdCardTarget(showProfile); setShowProfile(null); }}>
                  <CreditCard size={14} /> Generate ID Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Student Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Student</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Photo upload */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
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
                    <label className="form-label">Student Photo (optional)</label>
                    <input type="file" accept="image/*" onChange={handleAvatarChange}
                      style={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Used on ID card</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Student Name *</label>
                    <input className="form-input" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (for login)</label>
                    <input className="form-input" type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Grade *</label>
                    <select className="form-select" value={form.grade_id}
                      onChange={e => setForm({ ...form, grade_id: e.target.value, section_id: '' })} required>
                      <option value="">Select grade</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section *</label>
                    <select className="form-select" value={form.section_id}
                      onChange={e => setForm({ ...form, section_id: e.target.value })} required>
                      <option value="">Select section</option>
                      {grades.find(g => String(g.id) === String(form.grade_id))?.sections?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option><option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="form-input" type="date" value={form.dob}
                      onChange={e => setForm({ ...form, dob: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <input className="form-input" value={form.blood_group}
                    onChange={e => setForm({ ...form, blood_group: e.target.value })} placeholder="e.g. A+" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Father's Name</label>
                    <input className="form-input" value={form.father_name}
                      onChange={e => setForm({ ...form, father_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's Phone</label>
                    <input className="form-input" value={form.father_phone}
                      onChange={e => setForm({ ...form, father_phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mother's Name</label>
                    <input className="form-input" value={form.mother_name}
                      onChange={e => setForm({ ...form, mother_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother's Phone</label>
                    <input className="form-input" value={form.mother_phone}
                      onChange={e => setForm({ ...form, mother_phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ID Card Modal ── */}
      {idCardTarget && (
        <IDCard
          person={idCardTarget}
          type="student"
          school={school}
          onClose={() => setIdCardTarget(null)}
        />
      )}
    </Layout>
  );
}
