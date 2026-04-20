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

const fmt  = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtK = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

function KPICard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${color}`}><Icon size={20} /></div>
        {trend !== undefined && (
          <span style={{ fontSize: '12px', color: trend >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={color === 'red' ? { color: 'var(--danger)' } : color === 'green' ? { color: 'var(--success)' } : {}}>{value}</div>
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
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>{p.name}: {fmt(p.value)}</div>
      ))}
    </div>
  );
};

export default function FinanceAnalytics() {
  const currentYear = new Date().getFullYear();
  const [year,      setYear]      = useState(currentYear);
  const [data,      setData]      = useState(null);
  const [expenses,  setExpenses]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ category: 'Utilities', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [saving,    setSaving]    = useState(false);

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
  if (!data)   return <Layout title="Finance Analytics"><div className="empty-state">Failed to load</div></Layout>;

  const { summary, monthly, income_by_fee_type, income_by_method, salary_breakdown, other_by_category } = data;
  const isProfitable = summary.net_profit >= 0;

  const expensePieData = [
    { name: 'Staff Salaries', amount: summary.total_salary_expense },
    ...other_by_category.map(e => ({ name: e.category, amount: e.amount })),
  ].filter(d => d.amount > 0);

  return (
    <Layout title="Finance Analytics" subtitle="Monthly income, expenses & profitability">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Track income, expenses and profitability</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', minWidth: '100px' }}
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <KPICard label="Total Income"        value={fmt(summary.total_income)}        sub={`${year} year-to-date`}          color="green"                        icon={TrendingUp}   />
        <KPICard label="Total Expenses"      value={fmt(summary.total_expenses)}      sub="Salary + Other"                  color="red"                          icon={TrendingDown} />
        <KPICard label="Net Profit"          value={fmt(summary.net_profit)}          sub={`${summary.profit_margin}% margin`} color={isProfitable ? 'green' : 'red'} icon={DollarSign}   />
        <KPICard label="Monthly Salary Cost" value={fmt(summary.monthly_salary_cost)} sub={`${summary.total_staff} staff`} color="purple"                       icon={Users}        />
      </div>

      {/* ── Tabs ── */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab ${tab === 'overview'  ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab ${tab === 'breakdown' ? 'active' : ''}`} onClick={() => setTab('breakdown')}>Breakdown</button>
        <button className={`tab ${tab === 'expenses'  ? 'active' : ''}`} onClick={() => setTab('expenses')}>Expenses</button>
        <button className={`tab ${tab === 'staff'     ? 'active' : ''}`} onClick={() => setTab('staff')}>Salaries</button>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <div className="card-title">Monthly Income vs Expenses</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bars = Income & Expense · Line = Profit</span>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left"  stroke="#64748b" fontSize={11} tickFormatter={fmtK} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="income"        name="Income"        fill="#10b981" radius={[3,3,0,0]} opacity={0.85} />
                    <Bar yAxisId="left" dataKey="total_expense" name="Total Expense" fill="#ef4444" radius={[3,3,0,0]} opacity={0.75} />
                    <Line yAxisId="right" type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly summary cards */}
          <div className="card">
            <div className="card-header"><div className="card-title">Monthly Summary</div></div>
            {monthly.map((m) => {
              const pct = m.income > 0 ? m.profit_margin : null;
              return (
                <div key={m.month_key} className="list-item" style={{ padding: '14px 16px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: m.profit >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                    border: `1px solid ${m.profit >= 0 ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: m.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {m.month?.slice(0, 3)}
                    </span>
                  </div>
                  <div className="list-item-content">
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '3px' }}>{m.month}</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--success)' }}>In: {fmt(m.income)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--danger)' }}>Exp: {fmt(m.total_expense)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: m.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {m.profit >= 0 ? '+' : '−'}{fmt(Math.abs(m.profit))}
                    </span>
                    {pct !== null && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                        background: m.profit_margin >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: m.profit_margin >= 0 ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {m.profit_margin}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Totals footer */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(99,102,241,0.06)',
              borderTop: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px', flex: 1 }}>Year Total</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--success)' }}>In: {fmt(summary.total_income)}</span>
                <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Exp: {fmt(summary.total_expenses)}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isProfitable ? 'var(--success)' : 'var(--danger)' }}>
                  {isProfitable ? '+' : '−'}{fmt(Math.abs(summary.net_profit))}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BREAKDOWN TAB ── */}
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
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={income_by_fee_type} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
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
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensePieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
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
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--danger)' }}>{fmt(item.amount)}</span>
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
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={income_by_method} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={fmtK} />
                      <YAxis type="category" dataKey="method" stroke="#64748b" fontSize={11} width={70}
                        tickFormatter={m => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Amount" fill="#6366f1" radius={[0,4,4,0]}>
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
                <div className="empty-state" style={{ padding: '40px 0' }}>No other expenses for {year}</div>
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

      {/* ── EXPENSES LOG TAB ── */}
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Salary costs are tracked automatically from staff records.
              </div>
            </div>
          ) : expenses.map(e => (
            <div key={e.id} className="list-item" style={{ padding: '14px 16px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DollarSign size={16} color="var(--danger)" />
              </div>
              <div className="list-item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <span className="list-item-title">{e.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{e.date}</span>
                </div>
                {e.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>{fmt(e.amount)}</span>
                <button onClick={() => handleDelete(e.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SALARY DETAILS TAB ── */}
      {tab === 'staff' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Staff Salary Details</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Annual: {fmt(summary.monthly_salary_cost * 12)}
            </span>
          </div>
          {salary_breakdown.map(s => (
            <div key={s.id} className="list-item" style={{ padding: '14px 16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700,
              }}>
                {s.name?.charAt(0)}
              </div>
              <div className="list-item-content">
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{s.name}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.designation}</span>
                  {s.department && <span className="badge badge-purple" style={{ fontSize: '10px' }}>{s.department}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>{fmt(s.monthly_salary)}/mo</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmt(s.annual_cost)}/yr</span>
              </div>
            </div>
          ))}

          {/* Total footer */}
          <div style={{
            padding: '14px 16px', borderTop: '1px solid var(--border-primary)',
            background: 'rgba(99,102,241,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Total ({salary_breakdown.length} staff)</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(summary.monthly_salary_cost)}/mo</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmt(summary.monthly_salary_cost * 12)}/yr</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal ── */}
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
                    <select className="form-select" value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}>
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="e.g. Electricity bill" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" min="1" placeholder="0" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px' }}>
                  Salary costs are tracked automatically. Use this form for utilities, maintenance and other non-salary expenses.
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
