import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { SkManagementPage } from '../../components/Skeleton';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';

function gradeColor(pct) {
  if (pct >= 80) return 'var(--success)';
  if (pct >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

function ExamCard({ exam, marks }) {
  const [open, setOpen] = useState(true);
  const total     = marks.reduce((s, m) => s + m.obtained_marks, 0);
  const maxTotal  = marks.reduce((s, m) => s + m.total_marks,    0);
  const avg       = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : 0;

  return (
    <div className="card" style={{ marginBottom: '14px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border-primary)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'var(--accent-soft)', color: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Award size={16} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{exam}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {total}/{maxTotal} · Avg {avg}%
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '15px', fontWeight: 800,
            color: gradeColor(Number(avg)),
          }}>{avg}%</span>
          {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </button>

      {open && (
        <div>
          {/* Desktop table */}
          <div className="data-table-wrapper" style={{ display: 'none' }}
            ref={el => { if (el) el.style.display = window.innerWidth >= 640 ? 'block' : 'none'; }}>
            <table className="data-table">
              <thead>
                <tr><th>Subject</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Grade</th></tr>
              </thead>
              <tbody>
                {marks.map((m, i) => {
                  const pct = ((m.obtained_marks / m.total_marks) * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.subject_name}</td>
                      <td style={{ fontWeight: 600 }}>{m.obtained_marks}</td>
                      <td>{m.total_marks}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, maxWidth: '80px', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: gradeColor(Number(pct)) }} />
                          </div>
                          <span style={{ fontSize: '12px', minWidth: '36px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span className="badge badge-purple">{m.grade}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div>
            {marks.map((m, i) => {
              const pct = ((m.obtained_marks / m.total_marks) * 100).toFixed(1);
              return (
                <div key={i} className="list-item" style={{ padding: '14px 18px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.subject_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: gradeColor(Number(pct)) }}>
                          {m.obtained_marks}/{m.total_marks}
                        </span>
                        <span className="badge badge-purple">{m.grade}</span>
                      </div>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: '3px',
                        background: gradeColor(Number(pct)),
                        transition: 'width 500ms ease',
                      }} />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyMarks() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/student/marks').then(res => setData(res.data)); }, []);

  if (!data) return <Layout title="Marks"><SkManagementPage cols={4} rows={6} /></Layout>;

  const exams = Object.entries(data.grouped || {});

  return (
    <Layout title="Marks" subtitle="Exam results and grades">
      {exams.length === 0
        ? (
          <div className="card">
            <div className="empty-state">
              <Award size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <div>No marks recorded yet</div>
            </div>
          </div>
        )
        : exams.map(([exam, marks]) => (
          <ExamCard key={exam} exam={exam} marks={marks} />
        ))
      }
    </Layout>
  );
}
