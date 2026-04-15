import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Check, X, Clock } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadLeaves = () => api.get('/admin/leaves').then(res => setLeaves(res.data));
  useEffect(() => { loadLeaves().finally(() => setLoading(false)); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/leaves/${id}`, { status });
    loadLeaves();
  };

  if (loading) return <Layout title="Leave Requests"><SkManagementPage cols={8} rows={6} /></Layout>;

  return (
    <Layout title="Leave Requests" subtitle="Staff leave management">
      <div className="page-header">
        <h1 className="page-title">Leave Requests</h1>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Staff</th><th>Designation</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.staff_name}</td>
                  <td>{l.designation}</td>
                  <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{l.type}</span></td>
                  <td>{l.start_date}</td>
                  <td>{l.end_date}</td>
                  <td>{l.reason}</td>
                  <td>
                    <span className={`badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    {l.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(l.id, 'approved')}><Check size={13} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(l.id, 'rejected')}><X size={13} /></button>
                      </div>
                    )}
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
