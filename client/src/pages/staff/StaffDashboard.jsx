import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Clock, BookOpen, Users, QrCode, FileText, Calendar, TrendingUp, GraduationCap } from 'lucide-react';
import { SkDashboard } from '../../components/Skeleton';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/staff/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Teacher Dashboard"><SkDashboard statCount={4} tableRows={4} /></Layout>;
  if (!data) return <Layout title="Teacher Dashboard"><div className="empty-state">Failed to load dashboard data.</div></Layout>;

  return (
    <Layout title="Teacher Dashboard" subtitle={`Welcome, ${data.staff?.name}`}>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon green"><TrendingUp size={20} /></div></div>
          <div className="stat-card-label">My Attendance</div>
          <div className="stat-card-value">{data.attendance_percentage}%</div>
          <div className="stat-card-change positive">{data.present_days}/{data.total_attendance_days} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon blue"><BookOpen size={20} /></div></div>
          <div className="stat-card-label">Assigned Classes</div>
          <div className="stat-card-value">{data.assigned_classes?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon yellow"><Clock size={20} /></div></div>
          <div className="stat-card-label">Today's Periods</div>
          <div className="stat-card-value">{data.today_schedule?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon red"><FileText size={20} /></div></div>
          <div className="stat-card-label">Pending Leaves</div>
          <div className="stat-card-value">{data.pending_leaves}</div>
          <div className="stat-card-change">{data.total_leaves} total</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Today's Schedule</div></div>
          <div className="card-body">
            {data.today_schedule?.length > 0 ? (
              data.today_schedule.map((s, i) => (
                <div className="list-item" key={i}>
                  <div className="list-item-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>P{s.period}</span>
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{s.subject_name}</div>
                    <div className="list-item-subtitle">{s.grade_name} - {s.section_name}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {s.start_time} - {s.end_time}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px' }}>No classes scheduled today</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header"><div className="card-title">My Classes</div></div>
            <div className="card-body">
              {data.assigned_classes?.map((c, i) => (
                <div className="list-item" key={i}>
                  <div className="list-item-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                    <GraduationCap size={18} />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{c.grade_name} - {c.section_name}</div>
                    <div className="list-item-subtitle">{c.student_count} students</div>
                  </div>
                </div>
              ))}
              {(!data.assigned_classes || data.assigned_classes.length === 0) && (
                <div className="empty-state" style={{ padding: '16px' }}>No class assigned</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Upcoming Holidays</div></div>
            <div className="card-body">
              {data.upcoming_holidays?.map((h, i) => (
                <div className="list-item" key={i}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(245,158,11,0.08)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>
                      {new Date(h.date).getDate()}
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
        </div>
      </div>
    </Layout>
  );
}
