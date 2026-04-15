import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Users, Phone, GraduationCap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/staff/my-classes').then(res => {
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const handleMark = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    const records = Object.entries(attendanceMap).map(([student_id, status]) => ({ student_id, status }));
    if (records.length === 0) return alert('Mark attendance first');
    await api.post('/staff/mark-bulk-attendance', { records, date: attendanceDate });
    alert('Attendance submitted!');
    setAttendanceMap({});
  };

  const markAll = (status) => {
    if (!selectedClass) return;
    const map = {};
    selectedClass.students.forEach(s => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  if (loading) return <Layout title="My Classes"><SkManagementPage cols={5} rows={8} /></Layout>;

  return (
    <Layout title="My Classes" subtitle="Manage assigned classes">
      <div className="page-header">
        <h1 className="page-title">My Classes</h1>
      </div>

      {classes.length === 0 ? (
        <div className="card"><div className="empty-state">No classes assigned to you as class teacher</div></div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {classes.map((c, i) => (
              <button
                key={i}
                className={`btn ${selectedClass === c ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setSelectedClass(c); setAttendanceMap({}); }}
              >
                {c.grade_name} - {c.section_name} ({c.students.length} students)
              </button>
            ))}
          </div>

          {selectedClass && (
            <>
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">
                  <div className="card-title">Mark Attendance - {selectedClass.grade_name} {selectedClass.section_name}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input className="form-input" type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} style={{ width: '160px' }} />
                    <button className="btn btn-sm btn-success" onClick={() => markAll('present')}>All Present</button>
                    <button className="btn btn-sm btn-danger" onClick={() => markAll('absent')}>All Absent</button>
                    <button className="btn btn-primary btn-sm" onClick={submitAttendance}>Submit</button>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>Student</th><th>Roll No</th><th>Attendance %</th><th>Father's Phone</th><th>Mother's Phone</th><th>Mark</th></tr>
                    </thead>
                    <tbody>
                      {selectedClass.students.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '11px', borderRadius: '8px' }}>{s.name?.charAt(0)}</div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-purple">{s.roll_number}</span></td>
                          <td>
                            <span className={`badge ${Number(s.attendance_percentage) > 80 ? 'badge-success' : Number(s.attendance_percentage) > 60 ? 'badge-warning' : 'badge-danger'}`}>
                              {s.attendance_percentage}%
                            </span>
                          </td>
                          <td>
                            <a href={`tel:${s.father_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '12px' }}>
                              <Phone size={12} /> {s.father_phone}
                            </a>
                          </td>
                          <td>
                            <a href={`tel:${s.mother_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '12px' }}>
                              <Phone size={12} /> {s.mother_phone}
                            </a>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className={`btn btn-sm ${attendanceMap[s.id] === 'present' ? 'btn-success' : 'btn-secondary'}`}
                                onClick={() => handleMark(s.id, 'present')}
                                title="Present"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                className={`btn btn-sm ${attendanceMap[s.id] === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                                onClick={() => handleMark(s.id, 'absent')}
                                title="Absent"
                              >
                                <XCircle size={14} />
                              </button>
                              <button
                                className={`btn btn-sm ${attendanceMap[s.id] === 'late' ? '' : 'btn-secondary'}`}
                                onClick={() => handleMark(s.id, 'late')}
                                title="Late"
                                style={attendanceMap[s.id] === 'late' ? { background: 'var(--warning)', color: 'white' } : {}}
                              >
                                <Clock size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
