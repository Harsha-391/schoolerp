import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function StaffAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');

  useEffect(() => {
    api.get('/staff/my-attendance')
      .then(res => setAttendance(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="My Attendance"><SkManagementPage cols={4} rows={8} /></Layout>;

  const present    = attendance.filter(a => a.status === 'present').length;
  const absent     = attendance.filter(a => a.status === 'absent').length;
  const total      = attendance.length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
  const pct        = Number(percentage);

  const sorted   = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered = filter === 'all' ? sorted : sorted.filter(a => a.status === filter);

  const STATUS_MAP = {
    present: { icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-light)', border: 'var(--success-border)' },
    absent:  { icon: XCircle,     color: 'var(--danger)',  bg: 'var(--danger-light)',  border: 'var(--danger-border)'  },
    late:    { icon: Clock,        color: 'var(--warning)', bg: 'var(--warning-light)', border: 'var(--warning-border)' },
  };

  return (
    <Layout title="My Attendance" subtitle="Your attendance records">

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Days</div>
          <div className="stat-card-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Present</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Absent</div>
          <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Percentage</div>
          <div className="stat-card-value" style={{ color: pct > 80 ? 'var(--success)' : 'var(--warning)' }}>
            {percentage}%
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Attendance Rate</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: pct > 80 ? 'var(--success)' : 'var(--warning)' }}>
              {percentage}%
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${percentage}%`,
              background: pct > 80 ? 'var(--success)' : pct > 60 ? 'var(--warning)' : 'var(--danger)',
              transition: 'width 600ms ease',
            }} />
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="tabs" style={{ marginBottom: '14px' }}>
        {['all', 'present', 'absent'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${total})` : `${f.charAt(0).toUpperCase() + f.slice(1)}`}
          </button>
        ))}
      </div>

      {/* ── Card list ── */}
      <div className="card">
        {filtered.length === 0
          ? <div className="empty-state">No records found</div>
          : filtered.map(a => {
            const cfg  = STATUS_MAP[a.status] || STATUS_MAP.present;
            const Icon = cfg.icon;
            const dateStr = new Date(a.date).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <div key={a.id} className="list-item">
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{dateStr}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                    {a.check_in  && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In: {a.check_in}</span>}
                    {a.check_out && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Out: {a.check_out}</span>}
                  </div>
                </div>
                <span className={`badge ${a.status === 'present' ? 'badge-success' : 'badge-danger'}`}
                  style={{ textTransform: 'capitalize' }}>
                  {a.status}
                </span>
              </div>
            );
          })
        }
      </div>
    </Layout>
  );
}
