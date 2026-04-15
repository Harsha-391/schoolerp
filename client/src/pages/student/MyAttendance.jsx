import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { SkManagementPage } from '../../components/Skeleton';

export default function MyAttendance() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/student/attendance').then(res => setData(res.data)); }, []);

  if (!data) return <Layout title="My Attendance"><SkManagementPage cols={3} rows={8} /></Layout>;

  return (
    <Layout title="My Attendance" subtitle="Attendance records">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
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
          <div className="stat-card-value" style={{ color: Number(data.summary.percentage) > 80 ? 'var(--success)' : 'var(--warning)' }}>
            {data.summary.percentage}%
          </div>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead>
            <tbody>
              {data.records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.date}</td>
                  <td>{new Date(r.date).toLocaleDateString('en', { weekday: 'long' })}</td>
                  <td>
                    <span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-danger' : 'badge-warning'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
