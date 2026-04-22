import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, Edit, Trash2, BookOpen, FileText, ChevronDown, Upload, CheckCircle } from 'lucide-react';

export default function SyllabusManagement() {
  const [grades,        setGrades]        = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [units,         setUnits]         = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [loading,       setLoading]       = useState(false);

  const emptyForm = { unit_number: 1, unit_name: '', description: '', outcomes: '', weightage: '', pdf_url: '', pdf_text: '' };
  const [form, setForm] = useState(emptyForm);
  const [pdfStatus, setPdfStatus] = useState('idle'); // idle | extracting | done | error
  const [pdfPages, setPdfPages]   = useState(0);
  const fileInputRef = useRef(null);

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

  const openAdd = () => {
    setForm({ ...emptyForm, unit_number: units.length + 1 });
    setEditingId(null);
    setPdfStatus('idle');
    setPdfPages(0);
    setShowModal(true);
  };

  const openEdit = (unit) => {
    setForm({
      unit_number: unit.unit_number, unit_name: unit.unit_name,
      description: unit.description || '', outcomes: unit.outcomes || '',
      weightage: unit.weightage || '', pdf_url: unit.pdf_url || '',
      pdf_text: '', // don't load existing text into form, just preserve on save
    });
    setEditingId(unit.id);
    setPdfStatus(unit.has_pdf_text ? 'done' : 'idle');
    setPdfPages(0);
    setShowModal(true);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    setPdfStatus('extracting');
    try {
      const base64 = await fileToBase64(file);
      const res = await api.post('/admin/syllabus/extract-pdf', { pdf_base64: base64 });
      setForm(f => ({ ...f, pdf_text: res.data.text }));
      setPdfPages(res.data.pages);
      setPdfStatus('done');
    } catch (err) {
      console.error(err);
      setPdfStatus('error');
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        grade_id: selectedGrade,
        weightage: Number(form.weightage) || 0,
        pdf_url: form.pdf_url || null,
        // Only send pdf_text if we just extracted something new
        pdf_text: form.pdf_text || undefined,
      };
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
                      {unit.pdf_url && (
                        <a href={unit.pdf_url} target="_blank" rel="noopener noreferrer"
                          className="badge badge-info" style={{ fontSize: '10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <FileText size={9} /> PDF
                        </a>
                      )}
                      {unit.has_pdf_text && (
                        <span className="badge" style={{ fontSize: '10px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle size={9} /> AI Ready
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
                  <label className="form-label">Syllabus PDF Link (optional)</label>
                  <input className="form-input" type="url" value={form.pdf_url}
                    onChange={e => setForm({ ...form, pdf_url: e.target.value })}
                    placeholder="https://drive.google.com/… or any public PDF URL" />
                </div>

                {/* PDF Upload for AI */}
                <div className="form-group">
                  <label className="form-label">Upload PDF for AI Analysis</label>
                  <div style={{
                    border: '1px dashed var(--border-color)', borderRadius: '8px',
                    padding: '14px 16px', background: 'var(--bg-input)',
                  }}>
                    {pdfStatus === 'done' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>PDF text extracted successfully</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {pdfPages > 0 ? `${pdfPages} page${pdfPages !== 1 ? 's' : ''} · ` : ''}{form.pdf_text.length.toLocaleString()} characters — AI will read this content
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => { setPdfStatus('idle'); setForm(f => ({ ...f, pdf_text: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                          Remove
                        </button>
                      </div>
                    ) : pdfStatus === 'extracting' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                        Extracting text from PDF…
                      </div>
                    ) : pdfStatus === 'error' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, fontSize: '13px', color: 'var(--error)' }}>Failed to extract text. Make sure it's a readable PDF (not scanned image).</div>
                        <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: '11px' }}
                          onClick={() => { setPdfStatus('idle'); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                          Try again
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <Upload size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>Click to upload PDF</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Text is extracted and stored — AI uses it for student predictions
                          </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} />
                      </label>
                    )}
                  </div>
                  {editingId && pdfStatus === 'idle' && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                      Upload a new PDF to replace the existing extracted content, or leave blank to keep current.
                    </div>
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
