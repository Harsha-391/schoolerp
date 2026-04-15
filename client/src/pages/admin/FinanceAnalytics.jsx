import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Plus, X, Trash2, AlertCircle,
} from 'lucide-react';
import { SkAnalyticsPage } from '../../components/Skeleton';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];
const EXPENSE_CATEGORIES = ['Utilities', 'Maintenance', 'Stationery', 'Transport', 'Rent', 'Marketing', 'Other'];

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtK = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

function KPICard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${color}`}><Icon size={20} /></div>
        {trend !== undefined && (
          <span style={{ fontSize: '12px', color: trend >= 0 ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={color === 'red' ? { color: 'var(--error)' } : color === 'green' ? { color: 'var(--success)' } : {}}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
      <div style={{ fontWeight: 700, marginBottom: '6px', color: '#e2e8f0' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function FinanceAnalytics() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'Utilities', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/finance/analytics?year=${year}`),
      api.get(`/admin/finance/expenses?year=${year}`),
    ]).then(([analyticsRes, expensesRes]) => {
      setData(analyticsRes.data);
      setExpenses(expensesRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [year]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/finance/expenses', { ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ category: 'Utilities', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/admin/finance/expenses/${id}`);
    load();
  };

  if (loading) return <Layout title="Finance Analytics"><SkAnalyticsPage /></Layout>;
  if (!data) return <Layout title="Finance Analytics"><div className="empty-state">Failed to load</div></Layout>;

  const { summary, monthly, income_by_fee_type, income_by_method, salary_breakdown, other_by_category } = data;
  const isProfitable = summary.net_profit >= 0;

  // Pie data for expense composition
  const expensePieData = [
    { name: 'Staff Salaries', amount: summary.total_salary_expense },
    ...other_by_category.map(e => ({ name: e.category, amount: e.amount })),
  ].filter(d => d.amount > 0);

  return (
    <Layout title="Finance Analytics" subtitle="Monthly income, expenses & profitability">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Track income, expenses and profitability by month
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '100px' }}
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <KPICard label="Total Income" value={fmt(summary.total_income)} sub={`${year} year-to-date`} color="green" icon={TrendingUp} />
        <KPICard label="Total Expenses" value={fmt(summary.total_expenses)} sub={`Salary + Other`} color="red" icon={TrendingDown} />
        <KPICard
          label="Net Profit"
          value={fmt(summary.net_profit)}
          sub={`${summary.profit_margin}% margin`}
          color={isProfitable ? 'green' : 'red'}
          icon={DollarSign}
        />
        <KPICard
          label="Monthly Salary Cost"
          value={fmt(summary.monthly_salary_cost)}
          sub={`${summary.total_staff} staff members`}
          color="purple"
          icon={Users}
        />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab ${tab === 'breakdown' ? 'active' : ''}`} onClick={() => setTab('breakdown')}>Breakdown</button>
        <button className={`tab ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>Expenses Log</button>
        <button className={`tab ${tab === 'staff' ? 'active' : ''}`} onClick={() => setTab('staff')}>Salary Details</button>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <>
          {/* Monthly Income vs Expenses (Combo Chart) */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div className="card-title">Monthly Income vs Expenses</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bars = Income & Expense · Line = Net Profit</span>
            </div>
            <div className="card-body">
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickFormatter={fmtK} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.85} />
                    <Bar yAxisId="left" dataKey="total_expense" name="Total Expense" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.75} />
                    <Line yAxisId="right" type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="card">
            <div className="card-header"><div className="card-title">Monthly Summary Table</div></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Salary Exp.</th>
                    <th>Other Exp.</th>
                    <th>Total Exp.</th>
                    <th>Net Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m) => (
                    <tr key={m.month_key}>
                      <td style={{ fontWeight: 600 }}>{m.month}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(m.income)}</td>
                      <td>{fmt(m.salary_expense)}</td>
                      <td>{fmt(m.other_expense)}</td>
                      <td style={{ color: 'var(--error)' }}>{fmt(m.total_expense)}</td>
                      <td style={{ fontWeight: 700, color: m.profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                        {m.profit >= 0 ? '' : '−'}{fmt(Math.abs(m.profit))}
                      </td>
                      <td>
                        {m.income > 0 ? (
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                            background: m.profit_margin >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: m.profit_margin >= 0 ? 'var(--success)' : 'var(--error)',
                          }}>
                            {m.profit_margin}%
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,0.06)', fontWeight: 700 }}>
                    <td>Total</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(summary.total_income)}</td>
                    <td>{fmt(summary.total_salary_expense)}</td>
                    <td>{fmt(summary.total_other_expense)}</td>
                    <td style={{ color: 'var(--error)' }}>{fmt(summary.total_expenses)}</td>
                    <td style={{ color: isProfitable ? 'var(--success)' : 'var(--error)' }}>{fmt(summary.net_profit)}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: isProfitable ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: isProfitable ? 'var(--success)' : 'var(--error)',
                      }}>
                        {summary.profit_margin}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* BREAKDOWN TAB */}
      {tab === 'breakdown' && (
        <div className="grid-2">
          {/* Income by Fee Type */}
          <div className="card">
            <div className="card-header"><div className="card-title">Income by Fee Type</div></div>
            <div className="card-body">
              {income_by_fee_type.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>No income data for {year}</div>
              ) : (
                <>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={income_by_fee_type} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {income_by_fee_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {income_by_fee_type.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '12px' }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success)' }}>{fmt(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Expense Composition */}
          <div className="card">
            <div className="card-header"><div className="card-title">Expense Composition</div></div>
            <div className="card-body">
              {expensePieData.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>No expense data for {year}</div>
              ) : (
                <>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensePieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {expensePieData.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '12px' }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--error)' }}>{fmt(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Income by Payment Method */}
          <div className="card">
            <div className="card-header"><div className="card-title">Income by Payment Method</div></div>
            <div className="card-body">
              {income_by_method.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>No data for {year}</div>
              ) : (
                <div style={{ height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={income_by_method} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={fmtK} />
                      <YAxis type="category" dataKey="method" stroke="#64748b" fontSize={11} width={70}
                        tickFormatter={m => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Amount" fill="#6366f1" radius={[0, 4, 4, 0]}>
                        {income_by_method.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Other Expenses by Category */}
          <div className="card">
            <div className="card-header"><div className="card-title">Other Expenses by Category</div></div>
            <div className="card-body">
              {other_by_category.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>No other expenses logged for {year}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {other_by_category.sort((a, b) => b.amount - a.amount).map((item, i) => {
                    const pct = summary.total_other_expense > 0 ? (item.amount / summary.total_other_expense) * 100 : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px' }}>{item.category}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{fmt(item.amount)}</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES LOG TAB */}
      {tab === 'expenses' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Other Expenses — {year}</div>
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Log Expense
            </button>
          </div>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <div>No expenses logged for {year}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Salary costs are tracked automatically from staff records.</div>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td><span className="badge badge-purple">{e.category}</span></td>
                      <td>{e.description || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--error)' }}>{fmt(e.amount)}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(e.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SALARY DETAILS TAB */}
      {tab === 'staff' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Staff Salary Details</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Annual cost: {fmt(summary.monthly_salary_cost * 12)}
            </span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Designation</th><th>Department</th><th>Monthly Salary</th><th>Annual Cost</th></tr>
              </thead>
              <tbody>
                {salary_breakdown.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                    <td>{s.designation}</td>
                    <td><span className="badge badge-purple">{s.department}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--error)' }}>{fmt(s.monthly_salary)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{fmt(s.annual_cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(99,102,241,0.06)', fontWeight: 700 }}>
                  <td colSpan={3}>Total</td>
                  <td style={{ color: 'var(--error)' }}>{fmt(summary.monthly_salary_cost)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmt(summary.monthly_salary_cost * 12)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Log Other Expense</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="e.g. Electricity bill" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" min="1" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px' }}>
                  Note: Staff salaries are tracked automatically. Use this form for utilities, maintenance, and other non-salary expenses.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Log Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
