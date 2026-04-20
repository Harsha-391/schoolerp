import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, Edit, Trash2, BookOpen, FileText, Upload, ChevronDown } from 'lucide-react';

export default function SyllabusManagement() {
  const [grades,        setGrades]        = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [units,         setUnits]         = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [pdfName,       setPdfName]       = useState('');

  const emptyForm = { unit_number: 1, unit_name: '', description: '', outcomes: '', weightage: '', pdf_data: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api.get('/admin/grades').then(res => {
      setGrades(res.data);
      if (res.data[0]) setSelectedGrade(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedGrade) loadUnits();
  }, [selectedGrade]);

  const loadUnits = () => {
    setLoading(true);
    api.get(`/admin/syllabus/${selectedGrade}`)
      .then(res => setUnits(res.data))
      .finally(() => setLoading(false));
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, pdf_data: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setForm({ ...emptyForm, unit_number: units.length + 1 });
    setEditingId(null);
    setPdfName('');
    setShowModal(true);
  };

  const openEdit = (unit) => {
    setForm({
      unit_number: unit.unit_number, unit_name: unit.unit_name,
      description: unit.description || '', outcomes: unit.outcomes || '',
      weightage: unit.weightage || '', pdf_data: unit.pdf_data || '',
    });
    setPdfName(unit.pdf_data ? 'Existing PDF' : '');
    setEditingId(unit.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, grade_id: selectedGrade, weightage: Number(form.weightage) || 0 };
      if (editingId) await api.put(`/admin/syllabus/${editingId}`, payload);
      else           await api.post('/admin/syllabus', payload);
      setShowModal(false);
      loadUnits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this unit?')) return;
    await api.delete(`/admin/syllabus/${id}`);
    loadUnits();
  };

  const totalWeightage = units.reduce((s, u) => s + Number(u.weightage), 0);
  const selectedGradeName = grades.find(g => g.id === selectedGrade)?.name || '';

  return (
    <Layout title="Syllabus" subtitle="Manage curriculum units per grade">

      <div className="page-header">
        <div>
          <h1 className="page-title">Syllabus & Curriculum</h1>
          <p className="page-subtitle">{selectedGradeName} — {units.length} unit{units.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Unit
        </button>
      </div>

      {/* Grade selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <select className="form-select" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
            style={{ paddingRight: '32px', minWidth: '160px' }}>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>
        {totalWeightage > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Total weightage: <strong style={{ color: totalWeightage === 100 ? 'var(--success)' : 'var(--warning)' }}>{totalWeightage.toFixed(1)}%</strong>
            {totalWeightage !== 100 && <span style={{ color: 'var(--warning)' }}> (should sum to 100%)</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="empty-state">Loading…</div></div>
      ) : units.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '48px 20px' }}>
            <BookOpen size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>No units yet</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add syllabus units for {selectedGradeName}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {units.map(unit => (
            <div className="card" key={unit.id}>
              <div className="card-body" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Unit number badge */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '15px',
                  }}>
                    {unit.unit_number}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{unit.unit_name}</span>
                      {unit.weightage > 0 && (
                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>{unit.weightage}% weight</span>
                      )}
                      {unit.pdf_data && (
                        <span className="badge badge-info" style={{ fontSize: '10px', cursor: 'pointer' }}
                          onClick={() => {
                            const w = window.open(); w.document.write(`<iframe src="${unit.pdf_data}" style="width:100%;height:100vh;border:none;"></iframe>`);
                          }}>
                          <FileText size={9} style={{ marginRight: '3px' }} /> PDF
                        </span>
                      )}
                    </div>
                    {unit.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{unit.description}</div>
                    )}
                    {unit.outcomes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        <strong>Outcomes:</strong> {unit.outcomes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(unit)} style={{ padding: '6px 10px' }}>
                      <Edit size={13} />
                    </button>
                    <button className="btn btn-sm" onClick={() => handleDelete(unit.id)}
                      style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit Unit' : 'Add Syllabus Unit'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group" style={{ flex: '0 0 100px' }}>
                    <label className="form-label">Unit No.</label>
                    <input className="form-input" type="number" min="1" value={form.unit_number}
                      onChange={e => setForm({ ...form, unit_number: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Name *</label>
                    <input className="form-input" value={form.unit_name}
                      onChange={e => setForm({ ...form, unit_name: e.target.value })} required
                      placeholder="e.g. Algebra Basics, Photosynthesis…" />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 110px' }}>
                    <label className="form-label">Weightage (%)</label>
                    <input className="form-input" type="number" min="0" max="100" step="0.5" value={form.weightage}
                      onChange={e => setForm({ ...form, weightage: e.target.value })}
                      placeholder="0" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief overview of what this unit covers…" style={{ resize: 'vertical' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Learning Outcomes</label>
                  <textarea className="form-input" rows={2} value={form.outcomes}
                    onChange={e => setForm({ ...form, outcomes: e.target.value })}
                    placeholder="What students will learn / be able to do…" style={{ resize: 'vertical' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Syllabus PDF (optional)</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    background: 'var(--bg-input)', border: '1px dashed var(--border-primary)',
                    borderRadius: '8px', cursor: 'pointer',
                  }}>
                    <Upload size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '13px', color: pdfName ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {pdfName || 'Click to upload PDF'}
                    </span>
                    <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} />
                  </label>
                  {form.pdf_data && (
                    <button type="button" style={{ marginTop: '6px', fontSize: '11px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => { setForm(f => ({ ...f, pdf_data: '' })); setPdfName(''); }}>
                      Remove PDF
                    </button>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Unit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
