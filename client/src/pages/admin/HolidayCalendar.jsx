import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, Calendar } from 'lucide-react';

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', type: 'national' });

  const loadHolidays = () => api.get('/admin/holidays').then(res => setHolidays(res.data));
  useEffect(() => { loadHolidays(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/admin/holidays', form);
    setShowModal(false);
    setForm({ name: '', date: '', type: 'national' });
    loadHolidays();
  };

  const typeColors = { national: 'badge-danger', festival: 'badge-warning', vacation: 'badge-success', other: 'badge-info' };

  return (
    <Layout title="Holiday Calendar" subtitle="School holidays and vacations">
      <div className="page-header">
        <div>
          <h1 className="page-title">Holidays</h1>
          <p className="page-subtitle">{holidays.length} holidays</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {holidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map(h => (
          <div className="card" key={h.id}>
            <div className="card-body" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px',
                background: 'rgba(99,102,241,0.08)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                  {new Date(h.date).getDate()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {new Date(h.date).toLocaleString('default', { month: 'short' })}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{h.name}</div>
                <span className={`badge ${typeColors[h.type] || 'badge-info'}`} style={{ marginTop: '4px', textTransform: 'capitalize' }}>
                  {h.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Holiday</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Holiday Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="national">National</option>
                      <option value="festival">Festival</option>
                      <option value="vacation">Vacation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
