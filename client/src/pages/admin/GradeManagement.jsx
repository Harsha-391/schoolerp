import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BookOpen, GraduationCap, Plus, X, Trash2, Tag } from 'lucide-react';
import { SkManagementPage } from '../../components/Skeleton';

export default function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Grade modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeName, setGradeName] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Add Section state (inline per card)
  const [addingSectionFor, setAddingSectionFor] = useState(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Subject assignment state (inline per card)
  const [assigningSubjectFor, setAssigningSubjectFor] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Manage subjects modal
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);

  const loadData = () => Promise.all([
    api.get('/admin/grades'),
    api.get('/admin/subjects'),
  ]).then(([gradesRes, subjectsRes]) => {
    setGrades(gradesRes.data);
    setAllSubjects(subjectsRes.data);
  });

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

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

  const handleAssignSubject = async (gradeId) => {
    if (!selectedSubjectId) return;
    try {
      const res = await api.post(`/admin/grades/${gradeId}/subjects`, { subject_id: selectedSubjectId });
      setGrades(prev => prev.map(g => g.id === gradeId
        ? { ...g, subjects: [...(g.subjects || []), res.data] }
        : g
      ));
      setSelectedSubjectId('');
      setAssigningSubjectFor(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign subject');
    }
  };

  const handleRemoveSubject = async (gradeId, subjectId) => {
    try {
      await api.delete(`/admin/grades/${gradeId}/subjects/${subjectId}`);
      setGrades(prev => prev.map(g => g.id === gradeId
        ? { ...g, subjects: g.subjects.filter(s => s.id !== subjectId) }
        : g
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove subject');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setSavingSubject(true);
    try {
      const res = await api.post('/admin/subjects', { name: newSubjectName.trim() });
      setAllSubjects(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubjectName('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add subject');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!confirm(`Delete subject "${subject.name}"? It will be removed from all grades.`)) return;
    try {
      await api.delete(`/admin/subjects/${subject.id}`);
      setAllSubjects(prev => prev.filter(s => s.id !== subject.id));
      setGrades(prev => prev.map(g => ({ ...g, subjects: (g.subjects || []).filter(s => s.id !== subject.id) })));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  if (loading) return <Layout title="Grades & Sections"><SkManagementPage cards cardCount={9} /></Layout>;

  return (
    <Layout title="Grades & Sections" subtitle="Class structure">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grades & Sections</h1>
          <p className="page-subtitle">{grades.length} grades · {allSubjects.length} subjects</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowSubjectsModal(true)}>
            <Tag size={15} /> Manage Subjects
          </button>
          <button className="btn btn-primary" onClick={() => setShowGradeModal(true)}>
            <Plus size={16} /> Add Grade
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {grades.map(g => {
          const unassignedSubjects = allSubjects.filter(s => !(g.subjects || []).some(gs => gs.id === s.id));
          return (
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
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Sections</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {g.sections?.map(s => (
                      <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="badge badge-info" style={{ paddingRight: '4px' }}>
                          Section {s.name}
                          <button
                            onClick={() => handleDeleteSection(g.id, s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, marginLeft: '2px', padding: '0 2px', lineHeight: 1 }}
                            title="Remove section"
                          >×</button>
                        </span>
                      </div>
                    ))}
                  </div>
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
                      onClick={() => { setAddingSectionFor(g.id); setNewSectionName(''); setAssigningSubjectFor(null); }}
                      style={{ fontSize: '11px' }}
                    >
                      <Plus size={12} /> Add Section
                    </button>
                  )}
                </div>

                {/* Subjects */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Subjects</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {(g.subjects || []).map(s => (
                      <span key={s.id} className="badge badge-purple" style={{ paddingRight: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {s.name}
                        <button
                          onClick={() => handleRemoveSubject(g.id, s.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: '0 2px', lineHeight: 1 }}
                          title="Remove subject"
                        >×</button>
                      </span>
                    ))}
                    {(g.subjects || []).length === 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No subjects assigned</span>
                    )}
                  </div>
                  {assigningSubjectFor === g.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        className="form-select"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                        value={selectedSubjectId}
                        onChange={e => setSelectedSubjectId(e.target.value)}
                        autoFocus
                      >
                        <option value="">— pick subject —</option>
                        {unassignedSubjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button className="btn btn-sm btn-primary" onClick={() => handleAssignSubject(g.id)} disabled={!selectedSubjectId}>Add</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setAssigningSubjectFor(null); setSelectedSubjectId(''); }}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => { setAssigningSubjectFor(g.id); setSelectedSubjectId(''); setAddingSectionFor(null); }}
                      style={{ fontSize: '11px' }}
                      disabled={unassignedSubjects.length === 0}
                    >
                      <Plus size={12} /> Assign Subject
                    </button>
                  )}
                </div>

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
          );
        })}

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

      {/* Manage Subjects Modal */}
      {showSubjectsModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectsModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Manage Subjects</div>
              <button className="modal-close" onClick={() => setShowSubjectsModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="New subject name (e.g. Physics)"
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" disabled={savingSubject || !newSubjectName.trim()}>
                  {savingSubject ? 'Adding…' : <><Plus size={14} /> Add</>}
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                {allSubjects.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No subjects yet</div>
                )}
                {allSubjects.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{s.name}</span>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleDeleteSubject(s)}
                      style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.15)', padding: '4px 8px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSubjectsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
