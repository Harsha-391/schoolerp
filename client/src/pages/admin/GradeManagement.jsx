import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BookOpen, GraduationCap, Plus, X, Trash2 } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Grade modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeName, setGradeName] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Add Section state (inline per card)
  const [addingSectionFor, setAddingSectionFor] = useState(null); // grade id
  const [newSectionName, setNewSectionName] = useState('');

  const loadGrades = () => api.get('/admin/grades').then(res => setGrades(res.data));
  useEffect(() => { loadGrades().finally(() => setLoading(false)); }, []);

  const handleAddGrade = async (e) => {
    e.preventDefault();
    setSavingGrade(true);
    try {
      const res = await api.post('/admin/grades', { name: gradeName });
      setGrades(prev => [...prev, res.data]);
      setShowGradeModal(false);
      setGradeName('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add grade');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDeleteGrade = async (grade) => {
    if (grade.student_count > 0) return alert(`Cannot delete "${grade.name}" — it has ${grade.student_count} active students.`);
    if (!confirm(`Delete grade "${grade.name}" and all its sections?`)) return;
    try {
      await api.delete(`/admin/grades/${grade.id}`);
      setGrades(prev => prev.filter(g => g.id !== grade.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete grade');
    }
  };

  const handleAddSection = async (gradeId) => {
    if (!newSectionName.trim()) return;
    try {
      const res = await api.post(`/admin/grades/${gradeId}/sections`, { name: newSectionName.trim() });
      setGrades(prev => prev.map(g => g.id === gradeId
        ? { ...g, sections: [...(g.sections || []), res.data] }
        : g
      ));
      setNewSectionName('');
      setAddingSectionFor(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add section');
    }
  };

  const handleDeleteSection = async (gradeId, section) => {
    if (!confirm(`Delete section "${section.name}"?`)) return;
    try {
      await api.delete(`/admin/sections/${section.id}`);
      setGrades(prev => prev.map(g => g.id === gradeId
        ? { ...g, sections: g.sections.filter(s => s.id !== section.id) }
        : g
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete section');
    }
  };

  if (loading) return <Layout title="Grades & Sections"><SkManagementPage cards cardCount={9} /></Layout>;

  return (
    <Layout title="Grades & Sections" subtitle="Class structure">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grades & Sections</h1>
          <p className="page-subtitle">{grades.length} grades configured</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGradeModal(true)}>
          <Plus size={16} /> Add Grade
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {grades.map(g => (
          <div className="card" key={g.id}>
            <div className="card-body" style={{ padding: '20px' }}>
              {/* Grade header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="stat-card-icon purple" style={{ width: '40px', height: '40px' }}>
                  <BookOpen size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{g.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {g.sections?.length || 0} sections · {g.student_count} students
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => handleDeleteGrade(g)}
                  style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.15)' }}
                  title="Delete grade"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Sections */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {g.sections?.map(s => (
                  <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span className="badge badge-info" style={{ paddingRight: '4px' }}>
                      Section {s.name}
                      <button
                        onClick={() => handleDeleteSection(g.id, s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, marginLeft: '2px', padding: '0 2px', lineHeight: 1 }}
                        title="Remove section"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              {/* Add section inline */}
              {addingSectionFor === g.id ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                    placeholder="e.g. C"
                    value={newSectionName}
                    onChange={e => setNewSectionName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddSection(g.id); }
                      if (e.key === 'Escape') { setAddingSectionFor(null); setNewSectionName(''); }
                    }}
                    autoFocus
                    maxLength={5}
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => handleAddSection(g.id)}>Add</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => { setAddingSectionFor(null); setNewSectionName(''); }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => { setAddingSectionFor(g.id); setNewSectionName(''); }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={13} /> Add Section
                </button>
              )}

              {/* Student count chip */}
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

        {grades.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">No grades configured yet. Click "Add Grade" to create one.</div>
          </div>
        )}
      </div>

      {/* Add Grade Modal */}
      {showGradeModal && (
        <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Grade</div>
              <button className="modal-close" onClick={() => setShowGradeModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddGrade}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Grade Name *</label>
                  <input
                    className="form-input"
                    value={gradeName}
                    onChange={e => setGradeName(e.target.value)}
                    placeholder="e.g. 11th, Nursery, UKG"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingGrade}>{savingGrade ? 'Adding…' : 'Add Grade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
