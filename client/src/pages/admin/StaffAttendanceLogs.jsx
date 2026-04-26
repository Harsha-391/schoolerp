import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Users, ChevronDown, Clock, CalendarDays } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calcDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const [h1, m1] = checkIn.split(':').map(Number);
  const [h2, m2] = checkOut.split(':').map(Number);
  const mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function todayMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function StaffAttendanceLogs() {
  const [staffList,     setStaffList]     = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [month,         setMonth]         = useState(todayMonth());
  const [records,       setRecords]       = useState([]);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    api.get('/admin/staff').then(res => setStaffList(res.data));
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedStaff, month]);

  const fetchRecords = () => {
    setLoading(true);
    const params = { month };
    if (selectedStaff) params.staff_id = selectedStaff;
    api.get('/admin/attendance/staff', { params })
      .then(res => setRecords(res.data))
      .finally(() => setLoading(false));
  };

  const present = records.filter(r => r.status === 'present').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const pct     = records.length ? Math.round((present / records.length) * 100) : 0;

  const selectedStaffName = staffList.find(s => s.id === selectedStaff)?.name || 'All Staff';

  return (
    <Layout title="Staff Attendance" subtitle="Punch-in / punch-out logs">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Attendance Logs</h1>
          <p className="page-subtitle">{selectedStaffName} · {month}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <select className="form-select" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}
            style={{ minWidth: '200px', paddingRight: '32px' }}>
            <option value="">All Staff</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.designation}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>
        <input
          type="month"
          className="form-input"
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Days',   value: records.length, color: 'var(--accent-primary)' },
          { label: 'Present',      value: present,         color: '#22c55e' },
          { label: 'Absent',       value: absent,          color: '#ef4444' },
          { label: 'Attendance %', value: `${pct}%`,       color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444' },
        ].map(c => (
          <div className="card" key={c.label}>
            <div className="card-body" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : records.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px' }}>
            <CalendarDays size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontWeight: 600 }}>No attendance records found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Try a different month or staff member
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Date', 'Day', 'Staff', 'Designation', 'Status', 'Check-in', 'Check-out', 'Duration'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const dayName = DAYS[new Date(r.date).getDay()];
                  const isPresent = r.status === 'present';
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                      <td style={{ padding: '10px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{dayName}</td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{r.staff_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.designation || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={`badge ${isPresent ? 'badge-success' : 'badge-error'}`}
                          style={{ fontSize: '11px', background: isPresent ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', color: isPresent ? '#22c55e' : '#ef4444', border: `1px solid ${isPresent ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px' }}>
                        {r.check_in
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 600 }}><Clock size={12} />{r.check_in}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px' }}>
                        {r.check_out
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 600 }}><Clock size={12} />{r.check_out}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {calcDuration(r.check_in, r.check_out)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
