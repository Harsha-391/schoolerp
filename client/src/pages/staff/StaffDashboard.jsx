import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Clock, BookOpen, FileText, TrendingUp, GraduationCap, Calendar } from 'lucide-react';
import { SkDashboard } from '../../components/Skeleton';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/staff/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><SkDashboard statCount={4} tableRows={4} /></Layout>;
  if (!data)   return <Layout title="Dashboard"><div className="empty-state">Failed to load.</div></Layout>;

  return (
    <Layout title="Dashboard" subtitle={`Hi, ${data.staff?.name?.split(' ')[0]} 👋`}>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon green"><TrendingUp size={18} /></div></div>
          <div className="stat-card-label">My Attendance</div>
          <div className="stat-card-value">{data.attendance_percentage}%</div>
          <div className="stat-card-change positive">{data.present_days}/{data.total_attendance_days} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon blue"><BookOpen size={18} /></div></div>
          <div className="stat-card-label">My Classes</div>
          <div className="stat-card-value">{data.assigned_classes?.length || 0}</div>
          <div className="stat-card-change">assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon yellow"><Clock size={18} /></div></div>
          <div className="stat-card-label">Today's Periods</div>
          <div className="stat-card-value">{data.today_schedule?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon red"><FileText size={18} /></div></div>
          <div className="stat-card-label">Pending Leaves</div>
          <div className="stat-card-value">{data.pending_leaves}</div>
          <div className="stat-card-change">{data.total_leaves} total</div>
        </div>
      </div>

      {/* ── Today's schedule + Classes ── */}
      <div className="grid-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Today's Schedule</div>
            <span className="badge badge-purple">
              {new Date().toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div>
            {data.today_schedule?.length > 0
              ? data.today_schedule.map((s, i) => (
                <div className="list-item" key={i}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800 }}>P{s.period}</span>
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{s.subject_name}</div>
                    <div className="list-item-subtitle">{s.grade_name} – {s.section_name}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                    <div>{s.start_time}</div>
                    <div>{s.end_time}</div>
                  </div>
                </div>
              ))
              : <div className="empty-state" style={{ padding: '28px' }}>No classes today</div>
            }
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">My Classes</div></div>
            <div>
              {data.assigned_classes?.length > 0
                ? data.assigned_classes.map((c, i) => (
                  <div className="list-item" key={i}>
                    <div className="list-item-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                      <GraduationCap size={16} />
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{c.grade_name} – {c.section_name}</div>
                      <div className="list-item-subtitle">{c.student_count} students</div>
                    </div>
                  </div>
                ))
                : <div className="empty-state" style={{ padding: '20px' }}>No class assigned</div>
              }
            </div>
          </div>

          {data.upcoming_holidays?.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Upcoming Holidays</div></div>
              <div>
                {data.upcoming_holidays.slice(0, 4).map((h, i) => (
                  <div className="list-item" key={i}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'var(--warning-light)', flexShrink: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>
                        {new Date(h.date).getDate()}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {new Date(h.date).toLocaleString('default', { month: 'short' })}
                      </div>
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{h.name}</div>
                      <div className="list-item-subtitle" style={{ textTransform: 'capitalize' }}>{h.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
