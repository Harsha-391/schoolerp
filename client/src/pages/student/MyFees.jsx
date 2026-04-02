import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  DollarSign, CreditCard, CheckCircle, Clock, X, Copy,
  Building2, Smartphone, Banknote, FileCheck, AlertCircle,
  IndianRupee, ChevronRight, Send, XCircle
} from 'lucide-react';

export default function MyFees() {
  const [data, setData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [showPayModal, setShowPayModal] = useState(null); // fee object
  const [step, setStep] = useState(1); // 1=choose method, 2=pay & submit proof
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [form, setForm] = useState({ transaction_id: '', payment_proof_note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState('');

  const loadAll = () => {
    api.get('/student/fees').then(r => setData(r.data));
    api.get('/payments/school-methods').then(r => setPaymentMethods(r.data.methods || []));
    api.get('/payments/my-requests').then(r => setMyRequests(r.data));
  };

  useEffect(() => { loadAll(); }, []);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const openPayModal = (fee) => {
    setShowPayModal(fee);
    setStep(1);
    setSelectedMethod(null);
    setForm({ transaction_id: '', payment_proof_note: '' });
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) return;
    setSubmitting(true);
    try {
      await api.post('/payments/submit', {
        fee_structure_id: showPayModal.id,
        amount: showPayModal.amount,
        payment_method_id: selectedMethod.id,
        transaction_id: form.transaction_id,
        payment_proof_note: form.payment_proof_note,
      });
      setSubmitted(true);
      loadAll();
    } catch (err) {
      alert('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  if (!data) return <Layout title="My Fees"><div className="empty-state">Loading...</div></Layout>;

  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const METHOD_ICONS = {
    upi: <Smartphone size={20} />,
    bank_transfer: <Building2 size={20} />,
    cash: <Banknote size={20} />,
    cheque: <FileCheck size={20} />,
  };

  return (
    <Layout title="My Fees" subtitle="Fee payments">
      {/* Pending Verification Notice */}
      {pendingRequests.length > 0 && (
        <div className="slide-up" style={{
          padding: '16px 20px', marginBottom: '20px', borderRadius: 'var(--radius-md)',
          background: 'var(--warning-light)', border: '1px solid var(--warning-border)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <Clock size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e' }}>
              {pendingRequests.length} payment(s) awaiting verification
            </div>
            <div style={{ fontSize: '12px', color: '#a16207' }}>
              Your school will verify and issue receipts for pending payments
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Payments</h1>
          <p className="page-subtitle">Pay directly to your school — no middleman</p>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon green"><IndianRupee size={20} /></div></div>
          <div className="stat-card-label">Total Paid</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>₹{data.total_paid?.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon yellow"><Clock size={20} /></div></div>
          <div className="stat-card-label">Pending</div>
          <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{pendingRequests.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon blue"><CreditCard size={20} /></div></div>
          <div className="stat-card-label">Accepted Methods</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {paymentMethods.map(m => (
              <span key={m.id} className="badge badge-info" style={{ textTransform: 'capitalize', gap: '4px' }}>
                {m.method_type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Fee Structure / Pay */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} style={{ color: 'var(--accent-primary)' }} /> Fee Structure
            </div>
          </div>
          <div className="card-body" style={{ padding: '6px' }}>
            {data.structure?.map(fee => {
              const hasPending = myRequests.some(r => r.fee_structure_id === fee.id && r.status === 'pending');
              return (
                <div key={fee.id} className="list-item" style={{ padding: '18px 16px' }}>
                  <div className="list-item-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                    <DollarSign size={18} />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title" style={{ fontSize: '14px' }}>{fee.name}</div>
                    <div className="list-item-subtitle" style={{ textTransform: 'capitalize' }}>
                      {fee.frequency} · Due by {fee.due_day}th
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>₹{fee.amount?.toLocaleString()}</div>
                    {hasPending ? (
                      <span className="badge badge-warning" style={{ padding: '6px 14px' }}>
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <button className="btn btn-primary" onClick={() => openPayModal(fee)}>
                        <CreditCard size={15} /> Pay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History + Requests */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} style={{ color: 'var(--success)' }} /> Payment History
            </div>
          </div>
          <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto', padding: '6px' }}>
            {/* Show payment requests first */}
            {myRequests.map(r => (
              <div className="list-item" key={r.id} style={{ padding: '14px 16px' }}>
                <div className="list-item-icon" style={{
                  background: r.status === 'approved' ? 'var(--success-light)' : r.status === 'rejected' ? 'var(--danger-light)' : 'var(--warning-light)',
                  color: r.status === 'approved' ? 'var(--success)' : r.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                }}>
                  {r.status === 'approved' ? <CheckCircle size={16} /> : r.status === 'rejected' ? <XCircle size={16} /> : <Clock size={16} />}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{r.fee_name}</div>
                  <div className="list-item-subtitle" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>{new Date(r.submitted_at).toLocaleDateString()}</span>
                    <span className="badge badge-info" style={{ fontSize: '10px', padding: '1px 8px', textTransform: 'capitalize' }}>
                      {r.payment_method_type?.replace('_', ' ')}
                    </span>
                    {r.transaction_id && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>#{r.transaction_id}</span>}
                    {r.receipt_no && <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 8px' }}>{r.receipt_no}</span>}
                  </div>
                  {r.status === 'rejected' && r.reject_reason && (
                    <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>Reason: {r.reject_reason}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: r.status === 'approved' ? 'var(--success)' : 'var(--text-primary)' }}>
                    ₹{r.amount?.toLocaleString()}
                  </div>
                  <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}
                    style={{ fontSize: '10px', padding: '2px 8px', marginTop: '4px', textTransform: 'capitalize' }}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
            {myRequests.length === 0 && (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>🧾</div>
                <div style={{ fontSize: '13px' }}>No payment submissions yet</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== PAY MODAL ====== */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: submitted ? '480px' : '680px' }}>
            {/* SUCCESS STATE */}
            {submitted ? (
              <div style={{ padding: '48px 36px', textAlign: 'center' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px',
                  background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={36} style={{ color: 'var(--success)' }} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Payment Submitted!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Your payment of <strong>₹{showPayModal.amount?.toLocaleString()}</strong> for <strong>{showPayModal.name}</strong> has been
                  submitted for verification. Your school accounts team will review and approve it shortly.
                </p>
                <div style={{
                  padding: '14px 20px', background: 'var(--info-light)', border: '1px solid var(--info-border)',
                  borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#1e40af', marginBottom: '24px',
                }}>
                  You'll see a receipt once your school verifies the payment.
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowPayModal(null)} style={{ minWidth: '160px' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* MODAL HEADER */}
                <div className="modal-header">
                  <div>
                    <div className="modal-title">Pay {showPayModal.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Amount: <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>₹{showPayModal.amount?.toLocaleString()}</strong>
                    </div>
                  </div>
                  <button className="modal-close" onClick={() => setShowPayModal(null)}><X size={16} /></button>
                </div>

                {/* STEP 1: Choose Payment Method */}
                {step === 1 && (
                  <div className="modal-body">
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      How would you like to pay?
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {paymentMethods.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMethod(m); setStep(2); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '16px 18px', border: '1.5px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                            cursor: 'pointer', transition: 'all 150ms', textAlign: 'left', width: '100%',
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                        >
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {METHOD_ICONS[m.method_type] || <DollarSign size={20} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{m.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {m.method_type === 'upi' && `UPI ID: ${m.upi_id}`}
                              {m.method_type === 'bank_transfer' && `${m.bank_name} · ${m.account_holder}`}
                              {m.method_type === 'cash' && 'Pay at school office'}
                              {m.method_type === 'cheque' && `Payable to: ${m.cheque_payable_to}`}
                            </div>
                          </div>
                          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                          {m.is_primary && <span className="badge badge-purple" style={{ fontSize: '10px' }}>Preferred</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: Payment Details + Submit Proof */}
                {step === 2 && selectedMethod && (
                  <>
                    <div className="modal-body" style={{ paddingBottom: 0 }}>
                      <button onClick={() => setStep(1)} style={{
                        background: 'none', border: 'none', color: 'var(--accent-primary)',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        ← Change payment method
                      </button>

                      {/* Payment Details Card */}
                      <div style={{
                        padding: '20px', borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)',
                        marginBottom: '20px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'var(--accent-gradient)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {METHOD_ICONS[selectedMethod.method_type]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedMethod.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pay ₹{showPayModal.amount?.toLocaleString()} using this method</div>
                          </div>
                        </div>

                        {/* UPI Details */}
                        {selectedMethod.method_type === 'upi' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <DetailRow label="UPI ID" value={selectedMethod.upi_id} onCopy={() => copyToClipboard(selectedMethod.upi_id, 'upi')} copied={copied === 'upi'} />
                            <DetailRow label="Account Holder" value={selectedMethod.account_holder} />
                            <div style={{
                              padding: '12px', background: 'var(--info-light)', borderRadius: '8px',
                              border: '1px solid var(--info-border)', fontSize: '12px', color: '#1e40af',
                            }}>
                              💡 Open GPay/PhonePe/Paytm → Send to UPI ID above → Enter ₹{showPayModal.amount?.toLocaleString()} → Pay → Note the UTR/Transaction ID
                            </div>
                          </div>
                        )}

                        {/* Bank Transfer Details */}
                        {selectedMethod.method_type === 'bank_transfer' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <DetailRow label="Bank Name" value={selectedMethod.bank_name} />
                            <DetailRow label="Account Number" value={selectedMethod.account_number} onCopy={() => copyToClipboard(selectedMethod.account_number, 'acc')} copied={copied === 'acc'} />
                            <DetailRow label="IFSC Code" value={selectedMethod.ifsc_code} onCopy={() => copyToClipboard(selectedMethod.ifsc_code, 'ifsc')} copied={copied === 'ifsc'} />
                            <DetailRow label="Account Holder" value={selectedMethod.account_holder} />
                            <DetailRow label="Branch" value={selectedMethod.branch} />
                          </div>
                        )}

                        {/* Cash/Cheque */}
                        {(selectedMethod.method_type === 'cash' || selectedMethod.method_type === 'cheque') && (
                          <div style={{
                            padding: '14px', background: 'white', borderRadius: '8px',
                            fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)',
                          }}>
                            {selectedMethod.instructions}
                            {selectedMethod.cheque_payable_to && (
                              <div style={{ marginTop: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Payable to: {selectedMethod.cheque_payable_to}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Proof / Reference Section */}
                      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                        After paying, enter details below
                      </h3>
                      <div className="form-group">
                        <label className="form-label">
                          {selectedMethod.method_type === 'upi' ? 'UTR / Transaction ID' :
                           selectedMethod.method_type === 'bank_transfer' ? 'NEFT/RTGS Reference Number' :
                           selectedMethod.method_type === 'cheque' ? 'Cheque Number' : 'Receipt Number (if any)'}
                        </label>
                        <input className="form-input" placeholder="Enter reference/transaction ID"
                          value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Additional Note (optional)</label>
                        <textarea className="form-input" rows={2} placeholder="e.g. Paid via PhonePe at 2:30 PM"
                          value={form.payment_proof_note} onChange={e => setForm({ ...form, payment_proof_note: e.target.value })} />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                      <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}
                        style={{ minWidth: '170px' }}>
                        {submitting ? 'Submitting...' : <><Send size={15} /> Submit for Verification</>}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

// Reusable detail row component
function DetailRow({ label, value, onCopy, copied }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: 'white', borderRadius: '8px',
    }}>
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>{value}</div>
      </div>
      {onCopy && (
        <button onClick={onCopy} style={{
          background: copied ? 'var(--success-light)' : 'var(--bg-input)',
          border: `1px solid ${copied ? 'var(--success-border)' : 'var(--border-primary)'}`,
          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
          fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
          color: copied ? 'var(--success)' : 'var(--text-secondary)',
          transition: 'all 150ms',
        }}>
          {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      )}
    </div>
  );
}
