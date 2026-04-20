import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, Users, DollarSign, TrendingUp, Phone, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SchoolAnalytics() {
  const [searchParams]   = useSearchParams();
  const [schools,        setSchools]        = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [analytics,      setAnalytics]      = useState(null);
  const [activeTab,      setActiveTab]      = useState('students');

  const exportData = () => {
    if (!analytics) return;
    const wb = XLSX.utils.book_new();

    const studentData = analytics.students?.map(s => ({
      'Roll Number': s.roll_number, 'Name': s.name,
      'Father Name': s.father_name, 'Mother Name': s.mother_name,
      'Phone': s.father_phone || s.mother_phone, 'DOB': s.dob,
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentData), 'Students');

    const staffData = analytics.staff?.map(s => ({
      'Name': s.name, 'Designation': s.designation,
      'Department': s.department, 'Email': s.email, 'Phone': s.phone,
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staffData), 'Staff');

    const txData = analytics.transactions?.map(t => ({
      'Receipt No': t.receipt_no, 'Amount': t.amount,
      'Method': t.payment_method, 'Status': t.status, 'Date': t.payment_date,
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), 'Transactions');

    const attData = analytics.attendance?.map(a => ({ 'Date': a.date, 'Status': a.status })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attData), 'Attendance');

    XLSX.writeFile(wb, `${analytics.school?.name}_Disclosure.xlsx`);
  };

  useEffect(() => {
    api.get('/developer/schools').then(res => {
      setSchools(res.data);
      const schoolId = searchParams.get('school') || res.data[0]?.id;
      if (schoolId) loadAnalytics(schoolId);
    });
  }, []);

  const loadAnalytics = (schoolId) => {
    setSelectedSchool(schoolId);
    api.get(`/developer/schools/${schoolId}/analytics`).then(res => setAnalytics(res.data));
  };

  return (
    <Layout title="School Analytics" subtitle="Per-school performance metrics">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Detailed school performance</p>
        </div>
        <button className="btn btn-primary" onClick={exportData} disabled={!analytics}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* ── School selector ── */}
      <div style={{ marginBottom: '20px' }}>
        <select className="form-select" value={selectedSchool || ''}
          onChange={e => loadAnalytics(e.target.value)}>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {analytics && (
        <>
          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-card-icon blue"><GraduationCap size={20} /></div></div>
              <div className="stat-card-label">Students</div>
              <div className="stat-card-value">{analytics.student_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-card-icon green"><Users size={20} /></div></div>
              <div className="stat-card-label">Staff</div>
              <div className="stat-card-value">{analytics.staff_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-card-icon yellow"><DollarSign size={20} /></div></div>
              <div className="stat-card-label">Fees Collected</div>
              <div className="stat-card-value">₹{analytics.paid_fees?.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-card-icon purple"><TrendingUp size={20} /></div></div>
              <div className="stat-card-label">Platform Revenue</div>
              <div className="stat-card-value">₹{analytics.platform_revenue?.toLocaleString()}</div>
              <div className="stat-card-change positive">@ ₹{analytics.school?.rate_per_student}/student</div>
            </div>
          </div>

          {/* ── Charts + School Info ── */}
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Grade Distribution</div></div>
              <div className="card-body">
                <div style={{ height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.grade_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="grade" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">School Info</div></div>
              <div className="card-body">
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{analytics.school?.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{analytics.school?.address}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>Avg Attendance</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: Number(analytics.avg_attendance) > 80 ? 'var(--success)' : 'var(--warning)' }}>
                      {analytics.avg_attendance}%
                    </div>
                  </div>
                  <div style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>Total Grades</div>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{analytics.grade_count}</div>
                  </div>
                  <div style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Payment Methods</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {analytics.payment_methods?.map(m => (
                        <span key={m} className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '10px' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Data Disclosure ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Data Disclosure</div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={exportData}>
                <Download size={13} /> Export All
              </button>
            </div>

            <div className="tabs" style={{ padding: '0 16px', borderBottom: '1px solid var(--border-primary)' }}>
              {['students', 'staff', 'transactions', 'attendance'].map(t => (
                <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ padding: '8px 0' }}>
              {/* Students */}
              {activeTab === 'students' && (analytics.students?.slice(0, 10).map(s => (
                <div key={s.id} className="list-item" style={{ padding: '12px 16px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                    background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700,
                  }}>
                    {s.name?.charAt(0)}
                  </div>
                  <div className="list-item-content">
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {s.father_name} & {s.mother_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>{s.roll_number}</span>
                    {(s.father_phone || s.mother_phone) && (
                      <a href={`tel:${s.father_phone || s.mother_phone}`}
                        style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                        <Phone size={13} />
                      </a>
                    )}
                  </div>
                </div>
              )))}
              {activeTab === 'students' && analytics.students?.length > 10 && (
                <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  ...and {analytics.students.length - 10} more. Export to see all.
                </div>
              )}

              {/* Staff */}
              {activeTab === 'staff' && (analytics.staff?.slice(0, 10).map(s => (
                <div key={s.id} className="list-item" style={{ padding: '12px 16px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                    background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700,
                  }}>
                    {s.name?.charAt(0)}
                  </div>
                  <div className="list-item-content">
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {s.designation}{s.department ? ` · ${s.department}` : ''}
                    </div>
                  </div>
                  {s.phone && (
                    <a href={`tel:${s.phone}`} style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
                      <Phone size={13} />
                    </a>
                  )}
                </div>
              )))}

              {/* Transactions */}
              {activeTab === 'transactions' && (analytics.transactions?.slice(0, 10).map(t => (
                <div key={t.id} className="list-item" style={{ padding: '12px 16px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                    background: 'var(--success-light)', border: '1px solid var(--success-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DollarSign size={14} color="var(--success)" />
                  </div>
                  <div className="list-item-content">
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.receipt_no}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.payment_date}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success)' }}>₹{t.amount}</span>
                    <span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                      {t.status}
                    </span>
                  </div>
                </div>
              )))}

              {/* Attendance */}
              {activeTab === 'attendance' && (analytics.attendance?.slice(0, 10).map(a => (
                <div key={a.id} className="list-item" style={{ padding: '12px 16px' }}>
                  <div className="list-item-content">
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{a.date}</div>
                  </div>
                  <span className={`badge ${a.status === 'present' ? 'badge-success' : 'badge-danger'}`}
                    style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {a.status}
                  </span>
                </div>
              )))}

              {activeTab === 'attendance' && analytics.attendance?.length > 10 && (
                <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  ...and {analytics.attendance.length - 10} more. Export to see all.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
