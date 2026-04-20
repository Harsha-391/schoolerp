import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { SkManagementPage } from '../../components/Skeleton';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  present: { label: 'Present', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-light)', border: 'var(--success-border)' },
  absent:  { label: 'Absent',  icon: XCircle,     color: 'var(--danger)',  bg: 'var(--danger-light)',  border: 'var(--danger-border)'  },
  late:    { label: 'Late',    icon: Clock,        color: 'var(--warning)', bg: 'var(--warning-light)', border: 'var(--warning-border)' },
};

export default function MyAttendance() {
  const [data,   setData]   = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.get('/student/attendance').then(res => setData(res.data)); }, []);

  if (!data) return <Layout title="Attendance"><SkManagementPage cols={3} rows={8} /></Layout>;

  const records = filter === 'all'
    ? data.records
    : data.records.filter(r => r.status === filter);

  const pct = Number(data.summary.percentage);

  return (
    <Layout title="Attendance" subtitle="Your attendance records">

      {/* ── Summary stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Days</div>
          <div className="stat-card-value">{data.summary.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Present</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{data.summary.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Absent</div>
          <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{data.summary.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Percentage</div>
          <div className="stat-card-value" style={{ color: pct > 80 ? 'var(--success)' : 'var(--warning)' }}>
            {data.summary.percentage}%
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Overall Attendance</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: pct > 80 ? 'var(--success)' : 'var(--warning)' }}>
              {data.summary.percentage}%
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${data.summary.percentage}%`,
              background: pct > 80 ? 'var(--success)' : pct > 60 ? 'var(--warning)' : 'var(--danger)',
              transition: 'width 600ms ease',
            }} />
          </div>
          {pct < 75 && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--warning)', fontWeight: 500 }}>
              ⚠️ Attendance below 75% — please attend classes regularly
            </div>
          )}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="tabs" style={{ marginBottom: '14px' }}>
        {['all', 'present', 'absent', 'late'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${data.records.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)}`}
          </button>
        ))}
      </div>

      {/* ── Record cards ── */}
      <div className="card">
        {records.length === 0
          ? <div className="empty-state">No records found</div>
          : records.map(r => {
            const cfg   = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
            const Icon  = cfg.icon;
            const dayName = new Date(r.date).toLocaleDateString('en', { weekday: 'short' });
            const dateStr = new Date(r.date).toLocaleDateString('en', { day: 'numeric', month: 'short' });
            return (
              <div key={r.id} className="list-item">
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{dateStr}</div>
                  <div className="list-item-subtitle">{dayName}</div>
                </div>
                <span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-danger' : 'badge-warning'}`}
                  style={{ textTransform: 'capitalize' }}>
                  {r.status}
                </span>
              </div>
            );
          })
        }
      </div>
    </Layout>
  );
}
