import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { School, GraduationCap, Users, DollarSign, TrendingUp, PercentCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function SchoolAnalytics() {
  const [searchParams] = useSearchParams();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('students');

  const exportData = () => {
    if (!analytics) return;
    const wb = XLSX.utils.book_new();

    // Students sheet
    const studentData = analytics.students?.map(s => ({
      'Roll Number': s.roll_number,
      'Name': s.name,
      'Father Name': s.father_name,
      'Mother Name': s.mother_name,
      'Phone': s.father_phone || s.mother_phone,
      'DOB': s.dob
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentData), "Students");

    // Staff sheet
    const staffData = analytics.staff?.map(s => ({
      'Name': s.name,
      'Designation': s.designation,
      'Department': s.department,
      'Email': s.email,
      'Phone': s.phone
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staffData), "Staff");

    // Transactions sheet
    const txData = analytics.transactions?.map(t => ({
      'Receipt No': t.receipt_no,
      'Amount': t.amount,
      'Method': t.payment_method,
      'Status': t.status,
      'Date': t.payment_date
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), "Transactions");

    // Attendance sheet
    const attData = analytics.attendance?.map(a => ({
      'Date': a.date,
      'Status': a.status
    })) || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attData), "Attendance");

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Detailed school performance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="form-select"
            style={{ width: '280px' }}
            value={selectedSchool || ''}
            onChange={e => loadAnalytics(e.target.value)}
          >
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={exportData} disabled={!analytics}>
            <Download size={16} /> Export All Data
          </button>
        </div>
      </div>

      {analytics && (
        <>
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

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Grade Distribution</div></div>
              <div className="card-body">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.grade_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="grade" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">School Info</div></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="list-item">
                    <div className="list-item-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}><School size={18} /></div>
                    <div className="list-item-content">
                      <div className="list-item-title">{analytics.school?.name}</div>
                      <div className="list-item-subtitle">{analytics.school?.address}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg Attendance</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: Number(analytics.avg_attendance) > 80 ? 'var(--success)' : 'var(--warning)' }}>
                        {analytics.avg_attendance}%
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Grades</div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{analytics.grade_count}</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Payment Methods</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {analytics.payment_methods?.map(m => (
                          <span key={m} className="badge badge-info" style={{ textTransform: 'capitalize' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Subdomain</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>{analytics.school?.subdomain}.erp.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <div className="card-title">School Data Disclosure</div>
            </div>
            <div className="tabs" style={{ padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '20px' }}>
              {['students', 'staff', 'transactions', 'attendance'].map(tab => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'transparent', border: 'none', color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                    padding: '12px 0', borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    cursor: 'pointer', textTransform: 'capitalize', fontWeight: 600
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="card-body">
              <div className="data-table-wrapper">
                {activeTab === 'students' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>Roll No</th><th>Name</th><th>Parents</th><th>Phone</th></tr>
                    </thead>
                    <tbody>
                      {analytics.students?.slice(0, 10).map(s => (
                        <tr key={s.id}>
                          <td>{s.roll_number}</td>
                          <td>{s.name}</td>
                          <td>{s.father_name} & {s.mother_name}</td>
                          <td>{s.father_phone || s.mother_phone}</td>
                        </tr>
                      ))}
                      {analytics.students?.length > 10 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>...and {analytics.students.length - 10} more. Export to see all.</td></tr>}
                    </tbody>
                  </table>
                )}
                {activeTab === 'staff' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Designation</th><th>Department</th><th>Phone</th></tr>
                    </thead>
                    <tbody>
                      {analytics.staff?.slice(0, 10).map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.designation}</td>
                          <td>{s.department}</td>
                          <td>{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'transactions' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>Receipt No</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {analytics.transactions?.slice(0, 10).map(t => (
                        <tr key={t.id}>
                          <td>{t.receipt_no}</td>
                          <td>₹{t.amount}</td>
                          <td><span className={`badge badge-${t.status === 'paid' ? 'success' : 'warning'}`}>{t.status}</span></td>
                          <td>{t.payment_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'attendance' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {analytics.attendance?.slice(0, 10).map(a => (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td>{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
