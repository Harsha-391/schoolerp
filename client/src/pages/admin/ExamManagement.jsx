import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { ClipboardList, Plus, X, Award, Trash2 } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

const EXAM_TYPES = ['unit_test', 'mid_term', 'final', 'quarterly', 'half_yearly', 'annual'];

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'unit_test', grade_id: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = () => Promise.all([
    api.get('/admin/exams').then(res => setExams(res.data)),
    api.get('/admin/subjects').then(res => setSubjects(res.data)),
    api.get('/admin/grades').then(res => setGrades(res.data)),
  ]);

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/exams', form);
      setShowModal(false);
      setForm({ name: '', type: 'unit_test', grade_id: '', start_date: '', end_date: '' });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam and all its marks?')) return;
    try {
      await api.delete(`/admin/exams/${id}`);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete exam');
    }
  };

  if (loading) return <Layout title="Exams & Marks"><SkManagementPage cards cardCount={6} /></Layout>;

  return (
    <Layout title="Exams & Marks" subtitle="Exam schedules and results">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examinations</h1>
          <p className="page-subtitle">{exams.length} exams scheduled</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Exam
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {exams.map(e => {
          const gradeLabel = grades.find(g => g.id === e.grade_id)?.name;
          return (
            <div className="card" key={e.id}>
              <div className="card-body" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="stat-card-icon purple" style={{ width: '40px', height: '40px' }}>
                    <ClipboardList size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{e.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{e.type?.replace(/_/g, ' ')}</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleDelete(e.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Trash2 size={13} />
                  </button>
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
                {gradeLabel && (
                  <div style={{ marginTop: '10px' }}>
                    <span className="badge badge-info">{gradeLabel}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">No exams scheduled yet. Click "Schedule Exam" to add one.</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Subjects</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subjects.map(s => (
              <span key={s.id} className="badge badge-purple" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <Award size={12} style={{ marginRight: '4px' }} />{s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Schedule Exam</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Exam Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mid-Term Examination 2025" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {EXAM_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grade (optional)</label>
                    <select className="form-select" value={form.grade_id} onChange={e => setForm({ ...form, grade_id: e.target.value })}>
                      <option value="">All Grades</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input className="form-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input className="form-input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Schedule Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
