import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { GraduationCap, Users, DollarSign, TrendingUp, Calendar, Clock, BookOpen } from 'lucide-react';
import { SkDashboard } from '../../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><SkDashboard statCount={4} tableRows={5} /></Layout>;
  if (!data) return <Layout title="Dashboard"><div className="empty-state">Failed to load dashboard data.</div></Layout>;

  return (
    <Layout title="School Dashboard" subtitle={data.school?.name}>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon blue"><GraduationCap size={20} /></div></div>
          <div className="stat-card-label">Total Students</div>
          <div className="stat-card-value">{data.total_students}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon green"><Users size={20} /></div></div>
          <div className="stat-card-label">Total Staff</div>
          <div className="stat-card-value">{data.total_staff}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon yellow"><DollarSign size={20} /></div></div>
          <div className="stat-card-label">Fees Collected</div>
          <div className="stat-card-value">₹{data.total_fees_collected?.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon purple"><TrendingUp size={20} /></div></div>
          <div className="stat-card-label">Avg Attendance</div>
          <div className="stat-card-value">{data.avg_attendance}%</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Grade-wise Students</div></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.grade_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="students" fill="url(#adminGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Recent Fee Payments</div></div>
          <div className="card-body" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {data.recent_payments?.map((p, i) => (
              <div className="list-item" key={i}>
                <div className="list-item-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <DollarSign size={16} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{p.student_name}</div>
                  <div className="list-item-subtitle">{p.fee_type} · {p.payment_method} · {p.payment_date}</div>
                </div>
                <div className="list-item-value" style={{ color: 'var(--success)' }}>₹{p.amount?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Stats</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.1)' }}>
                <BookOpen size={20} style={{ color: '#818cf8', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Grades</div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>{data.total_grades}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)' }}>
                <DollarSign size={20} style={{ color: 'var(--success)', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending Fees</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warning)' }}>₹{data.pending_fees?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">School Info</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>School Name</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{data.school?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Address</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{data.school?.address}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Phone</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{data.school?.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
