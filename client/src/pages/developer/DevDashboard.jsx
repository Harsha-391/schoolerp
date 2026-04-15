import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { School, Users, GraduationCap, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { SkDashboard } from '../../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b'];

export default function DevDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/developer/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Platform Overview"><SkDashboard statCount={4} tableRows={4} /></Layout>;
  if (!data) return <Layout title="Platform Overview"><div className="empty-state">Failed to load dashboard data.</div></Layout>;

  return (
    <Layout title="Platform Overview" subtitle="Developer Admin Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple"><School size={20} /></div>
          </div>
          <div className="stat-card-label">Total Schools</div>
          <div className="stat-card-value">{data.totalSchools}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} /> {data.activeSchools} active
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue"><GraduationCap size={20} /></div>
          </div>
          <div className="stat-card-label">Total Students</div>
          <div className="stat-card-value">{data.totalStudents}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} /> Across all schools
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green"><Users size={20} /></div>
          </div>
          <div className="stat-card-label">Total Staff</div>
          <div className="stat-card-value">{data.totalStaff}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon yellow"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-label">Platform Revenue</div>
          <div className="stat-card-value">₹{data.totalRevenue?.toLocaleString()}</div>
          <div className="stat-card-change positive">
            <TrendingUp size={12} /> Monthly billing
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue Trend</div>
            <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="revenue" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
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
          <div className="card-header">
            <div className="card-title">Schools Overview</div>
          </div>
          <div className="card-body">
            {data.schoolStats?.map((school, idx) => (
              <div className="list-item" key={school.id}>
                <div className="list-item-icon" style={{ background: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}>
                  <School size={18} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{school.name}</div>
                  <div className="list-item-subtitle">
                    {school.student_count} students · {school.staff_count} staff · {school.subdomain}.erp.com
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="list-item-value" style={{ color: 'var(--success)' }}>₹{school.platform_revenue?.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@ ₹{school.rate_per_student}/student</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
