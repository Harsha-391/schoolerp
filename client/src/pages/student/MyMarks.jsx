import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Award } from 'lucide-react';

export default function MyMarks() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/student/marks').then(res => setData(res.data)); }, []);

  if (!data) return <Layout title="My Marks"><div className="empty-state">Loading...</div></Layout>;

  return (
    <Layout title="My Marks" subtitle="Exam results and grades">
      <div className="page-header">
        <h1 className="page-title">Marks & Grades</h1>
      </div>

      {Object.entries(data.grouped || {}).map(([exam, marks]) => (
        <div className="card" key={exam} style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} style={{ color: 'var(--accent-primary)' }} /> {exam}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total: {marks.reduce((s, m) => s + m.obtained_marks, 0)}/{marks.reduce((s, m) => s + m.total_marks, 0)}
              {' · '}
              Avg: {(marks.reduce((s, m) => s + m.obtained_marks, 0) / marks.length).toFixed(1)}
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Subject</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Grade</th></tr></thead>
              <tbody>
                {marks.map((m, i) => {
                  const pct = ((m.obtained_marks / m.total_marks) * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.subject_name}</td>
                      <td>{m.obtained_marks}</td>
                      <td>{m.total_marks}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, maxWidth: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: '3px',
                              background: Number(pct) >= 80 ? 'var(--success)' : Number(pct) >= 60 ? 'var(--warning)' : 'var(--danger)',
                            }} />
                          </div>
                          <span style={{ fontSize: '12px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span className="badge badge-purple">{m.grade}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </Layout>
  );
}
