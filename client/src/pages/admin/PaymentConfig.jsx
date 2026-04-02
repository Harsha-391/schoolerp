import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Plus, X, Smartphone, Building2, Banknote, FileCheck, Trash2, Edit3 } from 'lucide-react';

const METHOD_ICONS = {
  upi: <Smartphone size={20} />,
  bank_transfer: <Building2 size={20} />,
  cash: <Banknote size={20} />,
  cheque: <FileCheck size={20} />,
};

export default function PaymentConfig() {
  const [configs, setConfigs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    method_type: 'upi', label: '', upi_id: '', bank_name: '', account_number: '',
    ifsc_code: '', account_holder: '', branch: '', instructions: '', cheque_payable_to: '', is_primary: false,
  });

  const loadConfigs = () => api.get('/payments/admin/config').then(r => setConfigs(r.data));
  useEffect(() => { loadConfigs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/payments/admin/config', form);
    setShowModal(false);
    setForm({ method_type: 'upi', label: '', upi_id: '', bank_name: '', account_number: '', ifsc_code: '', account_holder: '', branch: '', instructions: '', cheque_payable_to: '', is_primary: false });
    loadConfigs();
  };

  const handleDelete = async (id) => {
    if (confirm('Deactivate this payment method?')) {
      await api.delete(`/payments/admin/config/${id}`);
      loadConfigs();
    }
  };

  return (
    <Layout title="Payment Settings" subtitle="Configure your school's payment methods">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Methods</h1>
          <p className="page-subtitle">Students will see these options when paying fees</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Method
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {configs.filter(c => c.is_active).map(c => (
          <div className="card" key={c.id}>
            <div className="card-body" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {METHOD_ICONS[c.method_type] || <Banknote size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.label}</div>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize', marginTop: '4px' }}>
                    {c.method_type.replace('_', ' ')}
                  </span>
                  {c.is_primary && <span className="badge badge-purple" style={{ marginLeft: '6px' }}>Primary</span>}
                </div>
                <button onClick={() => handleDelete(c.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px',
                }} title="Remove">
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {c.upi_id && <InfoLine label="UPI ID" value={c.upi_id} />}
                {c.bank_name && <InfoLine label="Bank" value={c.bank_name} />}
                {c.account_number && <InfoLine label="Account" value={c.account_number} />}
                {c.ifsc_code && <InfoLine label="IFSC" value={c.ifsc_code} />}
                {c.account_holder && <InfoLine label="Holder" value={c.account_holder} />}
                {c.branch && <InfoLine label="Branch" value={c.branch} />}
                {c.instructions && <InfoLine label="Instructions" value={c.instructions} />}
                {c.cheque_payable_to && <InfoLine label="Payable To" value={c.cheque_payable_to} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Payment Method</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Method Type *</label>
                    <select className="form-select" value={form.method_type} onChange={e => setForm({ ...form, method_type: e.target.value })}>
                      <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                      <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="cash">Cash at Office</option>
                      <option value="cheque">Cheque / Demand Draft</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Display Label *</label>
                    <input className="form-input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                      placeholder="e.g. School UPI Payment" required />
                  </div>
                </div>

                {form.method_type === 'upi' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">UPI ID *</label>
                        <input className="form-input" value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })}
                          placeholder="e.g. school@sbi" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Account Holder Name</label>
                        <input className="form-input" value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                          placeholder="e.g. Delhi Public School Trust" />
                      </div>
                    </div>
                  </>
                )}

                {form.method_type === 'bank_transfer' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Bank Name *</label>
                        <input className="form-input" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                          placeholder="e.g. State Bank of India" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Account Number *</label>
                        <input className="form-input" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })}
                          placeholder="Account number" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">IFSC Code *</label>
                        <input className="form-input" value={form.ifsc_code} onChange={e => setForm({ ...form, ifsc_code: e.target.value })}
                          placeholder="e.g. SBIN0001234" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Account Holder *</label>
                        <input className="form-input" value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                          placeholder="Account holder name" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch</label>
                      <input className="form-input" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}
                        placeholder="e.g. Connaught Place, New Delhi" />
                    </div>
                  </>
                )}

                {(form.method_type === 'cash' || form.method_type === 'cheque') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Instructions for Parents/Students</label>
                      <textarea className="form-input" rows={3} value={form.instructions}
                        onChange={e => setForm({ ...form, instructions: e.target.value })}
                        placeholder="Where and when to pay, who to contact..." />
                    </div>
                    {form.method_type === 'cheque' && (
                      <div className="form-group">
                        <label className="form-label">Cheque Payable To</label>
                        <input className="form-input" value={form.cheque_payable_to}
                          onChange={e => setForm({ ...form, cheque_payable_to: e.target.value })}
                          placeholder="e.g. Delhi Public School Trust" />
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input type="checkbox" id="is_primary" checked={form.is_primary}
                    onChange={e => setForm({ ...form, is_primary: e.target.checked })} />
                  <label htmlFor="is_primary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Mark as preferred/primary payment method
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Payment Method</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, minWidth: '70px' }}>{label}:</span>
      <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
