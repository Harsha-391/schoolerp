import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import IDCard from '../../components/IDCard';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Eye, GraduationCap, Phone, CreditCard, Upload } from 'lucide-react';
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
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [idCardTarget, setIdCardTarget] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <Layout title="Student Management"><SkManagementPage cols={8} rows={8} hasSearch /></Layout>;

  return (
    <Layout title="Student Management" subtitle="Manage all students">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="form-select" style={{ width: '180px' }} value={selectedGrade} onChange={e => handleGradeFilter(e.target.value)}>
            <option value="">All Grades</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name} ({g.student_count})</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Class</th>
                <th>Father</th>
                <th>Contact</th>
                <th>Attendance</th>
                <th>Fees Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {s.avatar
                        ? <img src={s.avatar} alt={s.name} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                        : <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', borderRadius: '8px' }}>{s.name?.charAt(0)}</div>
                      }
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.gender} · {s.blood_group}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{s.roll_number}</span></td>
                  <td>{s.grade_name} - {s.section_name}</td>
                  <td>{s.father_name}</td>
                  <td><Phone size={12} style={{ marginRight: '4px' }} />{s.father_phone}</td>
                  <td>
                    <span className={`badge ${Number(s.attendance_percentage) > 80 ? 'badge-success' : Number(s.attendance_percentage) > 60 ? 'badge-warning' : 'badge-danger'}`}>
                      {s.attendance_percentage}%
                    </span>
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{s.total_fees_paid?.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => viewProfile(s.id)}>
                        <Eye size={13} /> Profile
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setIdCardTarget(s)} title="ID Card">
                        <CreditCard size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Student Profile Card</div>
              <button className="modal-close" onClick={() => setShowProfile(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="profile-card" style={{ border: 'none' }}>
                <div className="profile-cover">
                  {showProfile.avatar
                    ? <img src={showProfile.avatar} alt={showProfile.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} />
                    : <div className="profile-avatar-lg">{showProfile.name?.charAt(0)}</div>
                  }
                </div>
                <div className="profile-info">
                  <div className="profile-name">{showProfile.name}</div>
                  <div className="profile-detail">
                    <GraduationCap size={14} /> {showProfile.grade_name} - {showProfile.section_name} · Roll: {showProfile.roll_number}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Date of Birth</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{showProfile.dob}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Blood Group</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{showProfile.blood_group}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Father</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{showProfile.father_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{showProfile.father_phone}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mother</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{showProfile.mother_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{showProfile.mother_phone}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Address</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{showProfile.address}</div>
                </div>
              </div>

              {showProfile.marks?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Marks</h3>
                  <table className="data-table">
                    <thead>
                      <tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr>
                    </thead>
                    <tbody>
                      {showProfile.marks.map((m, i) => (
                        <tr key={i}>
                          <td>{m.exam_name}</td>
                          <td>{m.subject_name}</td>
                          <td>{m.obtained_marks}/{m.total_marks}</td>
                          <td><span className="badge badge-purple">{m.grade}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      {/* Add Student Modal */}
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
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Used on ID card</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Student Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (for login)</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Grade *</label>
                    <select className="form-select" value={form.grade_id} onChange={e => setForm({ ...form, grade_id: e.target.value, section_id: '' })} required>
                      <option value="">Select grade</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section *</label>
                    <select className="form-select" value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })} required>
                      <option value="">Select section</option>
                      {grades.find(g => g.id === form.grade_id)?.sections?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option><option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="form-input" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <input className="form-input" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })} placeholder="e.g. A+" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Father's Name</label>
                    <input className="form-input" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's Phone</label>
                    <input className="form-input" value={form.father_phone} onChange={e => setForm({ ...form, father_phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mother's Name</label>
                    <input className="form-input" value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother's Phone</label>
                    <input className="form-input" value={form.mother_phone} onChange={e => setForm({ ...form, mother_phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
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

      {/* ID Card Modal */}
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
