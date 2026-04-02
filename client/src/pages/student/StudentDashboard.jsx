import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { GraduationCap, TrendingUp, DollarSign, Calendar, Award, BookOpen, Clock, Phone } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="empty-state">Loading...</div></Layout>;
  if (!data) return <Layout title="Dashboard"><div className="empty-state">Failed to load</div></Layout>;

  const attendancePieData = [
    { name: 'Present', value: data.attendance.present },
    { name: 'Absent', value: data.attendance.absent },
    { name: 'Late', value: data.attendance.late },
  ].filter(d => d.value > 0);

  return (
    <Layout title="Student Dashboard" subtitle={`Welcome, ${data.student?.name}`}>
      {/* Student Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', borderRadius: '18px' }}>
              {data.student?.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{data.student?.name}</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GraduationCap size={14} /> {data.student?.grade_name} - {data.student?.section_name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={14} /> Roll: {data.student?.roll_number}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  🏫 {data.school?.name}
                </span>
              </div>
            </div>
            {data.class_teacher && (
              <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Class Teacher</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{data.class_teacher.name}</div>
                <a href={`tel:${data.class_teacher.phone}`} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                  <Phone size={10} /> {data.class_teacher.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon green"><TrendingUp size={20} /></div></div>
          <div className="stat-card-label">Attendance</div>
          <div className="stat-card-value" style={{ color: Number(data.attendance.percentage) > 80 ? 'var(--success)' : 'var(--warning)' }}>
            {data.attendance.percentage}%
          </div>
          <div className="stat-card-change">{data.attendance.present}/{data.attendance.total_days} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon blue"><Award size={20} /></div></div>
          <div className="stat-card-label">Subjects</div>
          <div className="stat-card-value">{data.marks?.length || 0}</div>
          <div className="stat-card-change">marks recorded</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon yellow"><DollarSign size={20} /></div></div>
          <div className="stat-card-label">Fees Paid</div>
          <div className="stat-card-value">₹{data.fees?.total_paid?.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon purple"><Calendar size={20} /></div></div>
          <div className="stat-card-label">Holidays</div>
          <div className="stat-card-value">{data.upcoming_holidays?.length || 0}</div>
          <div className="stat-card-change">upcoming</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Attendance Overview</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '140px', height: '140px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value">
                      {attendancePieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="attendance-dot present" /> <span style={{ fontSize: '12px' }}>Present: {data.attendance.present}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="attendance-dot absent" /> <span style={{ fontSize: '12px' }}>Absent: {data.attendance.absent}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="attendance-dot late" /> <span style={{ fontSize: '12px' }}>Late: {data.attendance.late}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Recent Marks</div></div>
          <div className="card-body" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {data.marks?.length > 0 ? data.marks.slice(0, 6).map((m, i) => (
              <div className="list-item" key={i}>
                <div className="list-item-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                  <Award size={16} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{m.subject_name}</div>
                  <div className="list-item-subtitle">{m.exam_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{m.obtained_marks}/{m.total_marks}</div>
                  <span className="badge badge-purple">{m.grade}</span>
                </div>
              </div>
            )) : <div className="empty-state" style={{ padding: '16px' }}>No marks yet</div>}
          </div>
        </div>
      </div>

      {data.upcoming_holidays?.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Upcoming Holidays</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {data.upcoming_holidays.map((h, i) => (
                <div key={i} style={{
                  padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
                  border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{new Date(h.date).getDate()}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {new Date(h.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
