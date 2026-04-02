import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { ClipboardList, Plus, X, Award } from 'lucide-react';

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    api.get('/admin/exams').then(res => setExams(res.data));
    api.get('/admin/subjects').then(res => setSubjects(res.data));
  }, []);

  return (
    <Layout title="Exams & Marks" subtitle="Exam schedules and results">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examinations</h1>
          <p className="page-subtitle">{exams.length} exams scheduled</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {exams.map(e => (
          <div className="card" key={e.id}>
            <div className="card-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="stat-card-icon purple" style={{ width: '40px', height: '40px' }}>
                  <ClipboardList size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{e.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{e.type?.replace('_', ' ')}</div>
                </div>
                <span className="badge badge-info" style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>{e.type?.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Start Date</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{e.start_date}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>End Date</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{e.end_date}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Subjects</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subjects.map(s => (
              <span key={s.id} className="badge badge-purple" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <Award size={12} /> {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
