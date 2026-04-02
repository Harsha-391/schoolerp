import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

export default function GradeManagement() {
  const [grades, setGrades] = useState([]);
  useEffect(() => { api.get('/admin/grades').then(res => setGrades(res.data)); }, []);

  return (
    <Layout title="Grades & Sections" subtitle="Class structure">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grades & Sections</h1>
          <p className="page-subtitle">{grades.length} grades configured</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {grades.map(g => (
          <div className="card" key={g.id}>
            <div className="card-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="stat-card-icon purple" style={{ width: '40px', height: '40px' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{g.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {g.sections?.length} sections · {g.student_count} students
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {g.sections?.map(s => (
                  <span key={s.id} className="badge badge-info">Section {s.name}</span>
                ))}
              </div>
              {g.student_count > 0 && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-primary-hover)' }}>
                    <GraduationCap size={14} /> {g.student_count} enrolled students
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
