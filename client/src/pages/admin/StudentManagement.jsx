import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, Eye, GraduationCap, Phone, User } from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [form, setForm] = useState({
    name: '', grade_id: '', section_id: '', father_name: '', mother_name: '',
    father_phone: '', mother_phone: '', address: '', dob: '', gender: '', blood_group: '', email: '',
  });

  useEffect(() => {
    api.get('/admin/grades').then(res => setGrades(res.data));
    loadStudents();
  }, []);

  const loadStudents = (gradeId) => {
    const params = gradeId ? `?grade_id=${gradeId}` : '';
    api.get(`/admin/students${params}`).then(res => setStudents(res.data));
  };

  const handleGradeFilter = (gradeId) => {
    setSelectedGrade(gradeId);
    loadStudents(gradeId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/admin/students', form);
    setShowModal(false);
    loadStudents(selectedGrade);
  };

  const viewProfile = (studentId) => {
    api.get(`/admin/students/${studentId}`).then(res => setShowProfile(res.data));
  };

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
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', borderRadius: '8px' }}>
                        {s.name?.charAt(0)}
                      </div>
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
                    <button className="btn btn-sm btn-secondary" onClick={() => viewProfile(s.id)}>
                      <Eye size={13} /> Profile
                    </button>
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
                  <div className="profile-avatar-lg">{showProfile.name?.charAt(0)}</div>
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
                    <select className="form-select" value={form.grade_id} onChange={e => setForm({ ...form, grade_id: e.target.value })} required>
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
    </Layout>
  );
}
