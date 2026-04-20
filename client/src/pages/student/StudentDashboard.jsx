import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { GraduationCap, TrendingUp, DollarSign, Calendar, Award, BookOpen, Phone } from 'lucide-react';
import { SkDashboard } from '../../components/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const s = {
  infoCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    marginBottom: '18px',
    boxShadow: 'var(--shadow-card)',
  },
  avatarLg: {
    width: '60px', height: '60px', borderRadius: '16px',
    background: 'var(--accent-gradient)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: 800, color: 'white', flexShrink: 0,
  },
  teacherBadge: {
    padding: '10px 14px',
    background: 'var(--accent-soft)',
    borderRadius: '10px',
    border: '1px solid var(--accent-soft-border)',
  },
  dateBox: {
    width: '44px', height: '44px', borderRadius: '10px',
    background: 'var(--warning-light)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
};

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><SkDashboard statCount={4} tableRows={4} /></Layout>;
  if (!data)   return <Layout title="Dashboard"><div className="empty-state">Failed to load.</div></Layout>;

  const pieParts = [
    { name: 'Present', value: data.attendance.present },
    { name: 'Absent',  value: data.attendance.absent  },
    { name: 'Late',    value: data.attendance.late    },
  ].filter(d => d.value > 0);

  const attPct = Number(data.attendance.percentage);

  return (
    <Layout title="Dashboard" subtitle={`Hi, ${data.student?.name?.split(' ')[0]} 👋`}>

      {/* ── Student identity card ── */}
      <div style={s.infoCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={s.avatarLg}>{data.student?.name?.charAt(0)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.student?.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <GraduationCap size={12} /> {data.student?.grade_name} – {data.student?.section_name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <BookOpen size={12} /> Roll {data.student?.roll_number}
              </span>
            </div>
          </div>
        </div>
        {data.class_teacher && (
          <div style={{ ...s.teacherBadge, marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Class Teacher</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{data.class_teacher.name}</div>
            </div>
            <a href={`tel:${data.class_teacher.phone}`}
               style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600 }}>
              <Phone size={14} /> Call
            </a>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon green"><TrendingUp size={18} /></div></div>
          <div className="stat-card-label">Attendance</div>
          <div className="stat-card-value" style={{ color: attPct > 80 ? 'var(--success)' : 'var(--warning)' }}>
            {data.attendance.percentage}%
          </div>
          <div className="stat-card-change">{data.attendance.present}/{data.attendance.total_days} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon blue"><Award size={18} /></div></div>
          <div className="stat-card-label">Subjects</div>
          <div className="stat-card-value">{data.marks?.length || 0}</div>
          <div className="stat-card-change">marks recorded</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon yellow"><DollarSign size={18} /></div></div>
          <div className="stat-card-label">Fees Paid</div>
          <div className="stat-card-value">₹{(data.fees?.total_paid || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon purple"><Calendar size={18} /></div></div>
          <div className="stat-card-label">Holidays</div>
          <div className="stat-card-value">{data.upcoming_holidays?.length || 0}</div>
          <div className="stat-card-change">upcoming</div>
        </div>
      </div>

      {/* ── Attendance chart + Recent marks ── */}
      <div className="grid-2" style={{ marginBottom: '18px' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Attendance</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieParts} cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={4} dataKey="value">
                      {pieParts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {[
                  { label: 'Present', val: data.attendance.present, cls: 'present' },
                  { label: 'Absent',  val: data.attendance.absent,  cls: 'absent'  },
                  { label: 'Late',    val: data.attendance.late,     cls: 'late'    },
                ].map(({ label, val, cls }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span className={`attendance-dot ${cls}`} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Recent Marks</div></div>
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {data.marks?.length > 0
              ? data.marks.slice(0, 6).map((m, i) => (
                <div className="list-item" key={i}>
                  <div className="list-item-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                    <Award size={15} />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{m.subject_name}</div>
                    <div className="list-item-subtitle">{m.exam_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{m.obtained_marks}/{m.total_marks}</div>
                    <span className="badge badge-purple" style={{ marginTop: '2px' }}>{m.grade}</span>
                  </div>
                </div>
              ))
              : <div className="empty-state" style={{ padding: '24px' }}>No marks yet</div>
            }
          </div>
        </div>
      </div>

      {/* ── Upcoming holidays ── */}
      {data.upcoming_holidays?.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Upcoming Holidays</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {data.upcoming_holidays.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-primary)', background: 'var(--bg-primary)',
                  flexShrink: 0,
                }}>
                  <div style={s.dateBox}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>
                      {new Date(h.date).getDate()}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {new Date(h.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
