import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Users, Phone, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

const STATUS_STYLES = {
  present: { bg: 'var(--success)',       color: 'white' },
  absent:  { bg: 'var(--danger)',        color: 'white' },
  late:    { bg: 'var(--warning)',       color: 'white' },
  default: { bg: 'var(--bg-input)',      color: 'var(--text-muted)' },
};

export default function MyClasses() {
  const [classes,       setClasses]       = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [date,          setDate]          = useState(new Date().toISOString().split('T')[0]);
  const [attendance,    setAttendance]    = useState({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    api.get('/staff/my-classes').then(res => {
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const mark = (id, status) => setAttendance(prev => ({ ...prev, [id]: status }));

  const markAll = (status) => {
    if (!selectedClass) return;
    const map = {};
    selectedClass.students.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  };

  const submit = async () => {
    const records = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }));
    if (records.length === 0) return alert('Mark attendance first');
    setSaving(true);
    try {
      await api.post('/staff/mark-bulk-attendance', { records, date });
      alert('Attendance submitted!');
      setAttendance({});
    } catch { alert('Failed to submit.'); }
    finally { setSaving(false); }
  };

  if (loading) return <Layout title="My Classes"><SkManagementPage cols={5} rows={8} /></Layout>;

  const marked = Object.keys(attendance).length;

  return (
    <Layout title="My Classes" subtitle="Manage assigned classes">

      {classes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No classes assigned to you</div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Class selector ── */}
          {classes.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {classes.map((c, i) => (
                <button key={i}
                  className={`btn btn-sm ${selectedClass === c ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flexShrink: 0 }}
                  onClick={() => { setSelectedClass(c); setAttendance({}); }}>
                  {c.grade_name} – {c.section_name}
                  <span style={{ marginLeft: '5px', opacity: 0.7 }}>({c.students.length})</span>
                </button>
              ))}
            </div>
          )}

          {selectedClass && (
            <>
              {/* ── Header bar ── */}
              <div className="card" style={{ marginBottom: '14px' }}>
                <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ width: '160px', minHeight: '38px', padding: '8px 12px', fontSize: '13px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-success" onClick={() => markAll('present')}>All Present</button>
                    <button className="btn btn-sm btn-danger"  onClick={() => markAll('absent')}>All Absent</button>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {marked > 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {marked}/{selectedClass.students.length} marked
                      </span>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
                      <Send size={13} /> {saving ? 'Saving…' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Student list ── */}
              <div className="card">
                {selectedClass.students.map(student => {
                  const status = attendance[student.id];
                  return (
                    <div key={student.id} className="list-item" style={{ padding: '14px 16px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700,
                      }}>
                        {student.name?.charAt(0)}
                      </div>
                      <div className="list-item-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="list-item-title">{student.name}</span>
                          <span className="badge badge-purple" style={{ fontSize: '10px' }}>{student.roll_number}</span>
                          <span className={`badge ${Number(student.attendance_percentage) > 80 ? 'badge-success' : Number(student.attendance_percentage) > 60 ? 'badge-warning' : 'badge-danger'}`}
                            style={{ fontSize: '10px' }}>
                            {student.attendance_percentage}%
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                          {student.father_phone && (
                            <a href={`tel:${student.father_phone}`}
                               style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={10} /> Father
                            </a>
                          )}
                          {student.mother_phone && (
                            <a href={`tel:${student.mother_phone}`}
                               style={{ fontSize: '11px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={10} /> Mother
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Attendance buttons */}
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {[
                          { s: 'present', Icon: CheckCircle },
                          { s: 'absent',  Icon: XCircle     },
                          { s: 'late',    Icon: Clock        },
                        ].map(({ s: st, Icon }) => {
                          const active = status === st;
                          const style  = active ? STATUS_STYLES[st] : STATUS_STYLES.default;
                          return (
                            <button
                              key={st}
                              onClick={() => mark(student.id, st)}
                              style={{
                                width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                                background: style.bg, color: style.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 150ms',
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={15} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
