import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { DollarSign, School, CreditCard, Settings } from 'lucide-react';

export default function BillingSettings() {
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    api.get('/developer/schools').then(res => setSchools(res.data));
  }, []);

  const updateRate = async (schoolId, newRate) => {
    await api.put(`/developer/schools/${schoolId}`, { rate_per_student: Number(newRate) });
    api.get('/developer/schools').then(res => setSchools(res.data));
  };

  const togglePaymentMethod = async (school, method) => {
    const methods = school.payment_methods?.includes(method)
      ? school.payment_methods.filter(m => m !== method)
      : [...(school.payment_methods || []), method];
    await api.put(`/developer/schools/${school.id}`, { payment_methods: methods });
    api.get('/developer/schools').then(res => setSchools(res.data));
  };

  return (
    <Layout title="Billing & Payments" subtitle="Manage pricing and payment methods">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing Settings</h1>
          <p className="page-subtitle">Configure rates and payment methods per school</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {schools.map(school => (
          <div className="card" key={school.id}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-card-icon purple" style={{ width: '36px', height: '36px' }}>
                  <School size={18} />
                </div>
                <div>
                  <div className="card-title">{school.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{school.subdomain}.erp.com · {school.student_count} students</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{(school.student_count * school.rate_per_student).toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Monthly Revenue</div>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rate per Student (₹/month)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="form-input"
                      type="number"
                      defaultValue={school.rate_per_student}
                      id={`rate-${school.id}`}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => updateRate(school.id, document.getElementById(`rate-${school.id}`).value)}
                    >
                      Update
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Methods</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['online', 'cash', 'cheque', 'upi', 'bank_transfer'].map(method => (
                      <button
                        key={method}
                        className={`btn btn-sm ${school.payment_methods?.includes(method) ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => togglePaymentMethod(school, method)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        <CreditCard size={12} /> {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
