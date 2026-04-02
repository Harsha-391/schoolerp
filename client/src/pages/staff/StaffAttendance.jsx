import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function StaffAttendance() {
  const [attendance, setAttendance] = useState([]);
  useEffect(() => { api.get('/staff/my-attendance').then(res => setAttendance(res.data)); }, []);

  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const percentage = attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0;

  return (
    <Layout title="My Attendance" subtitle="Your attendance records">
      <div className="page-header">
        <h1 className="page-title">My Attendance</h1>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Days</div>
          <div className="stat-card-value">{attendance.length}</div>
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
          <div className="stat-card-value" style={{ color: Number(percentage) > 80 ? 'var(--success)' : 'var(--warning)' }}>{percentage}%</div>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead>
            <tbody>
              {attendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.date}</td>
                  <td>
                    <span className={`badge ${a.status === 'present' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span>
                  </td>
                  <td>{a.check_in || '-'}</td>
                  <td>{a.check_out || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
