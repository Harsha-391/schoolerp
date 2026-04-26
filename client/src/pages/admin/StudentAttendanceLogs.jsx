import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { GraduationCap, ChevronDown, Clock, CalendarDays, Users } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayDate()  { return new Date().toISOString().slice(0, 10); }
function todayMonth() { return new Date().toISOString().slice(0, 7); }

const STATUS_STYLE = {
  present: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  absent:  { bg: 'rgba(239,68,68,0.10)',  color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  late:    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
};

export default function StudentAttendanceLogs() {
  const [grades,          setGrades]          = useState([]);
  const [sections,        setSections]        = useState([]);
  const [selectedGrade,   setSelectedGrade]   = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // View: 'daily' = by date, 'summary' = by month
  const [view,    setView]    = useState('daily');
  const [date,    setDate]    = useState(todayDate());
  const [month,   setMonth]   = useState(todayMonth());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/grades').then(res => {
      setGrades(res.data);
      if (res.data[0]) {
        setSelectedGrade(res.data[0].id);
        setSections(res.data[0].sections || []);
        setSelectedSection(res.data[0].sections?.[0]?.id || '');
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedGrade) return;
    const grade = grades.find(g => g.id === selectedGrade);
    const secs = grade?.sections || [];
    setSections(secs);
    setSelectedSection(secs[0]?.id || '');
  }, [selectedGrade]);

  useEffect(() => {
    if (selectedGrade) fetchRecords();
  }, [selectedGrade, selectedSection, view, date, month]);

  const fetchRecords = () => {
    setLoading(true);
    const params = { grade_id: selectedGrade };
    if (selectedSection) params.section_id = selectedSection;
    if (view === 'daily') params.date = date;
    else                  params.month = month;
    api.get('/admin/attendance/students', { params })
      .then(res => setRecords(res.data))
      .finally(() => setLoading(false));
  };

  const gradeName   = grades.find(g => g.id === selectedGrade)?.name || '';
  const sectionName = sections.find(s => s.id === selectedSection)?.name || '';

  // ── Summary view: aggregate per student ──────────────────────────────────────
  const summaryMap = {};
  for (const r of records) {
    if (!summaryMap[r.student_id]) {
      summaryMap[r.student_id] = {
        student_id: r.student_id,
        student_name: r.student_name,
        roll_number: r.roll_number,
        present: 0, absent: 0, late: 0, total: 0,
      };
    }
    summaryMap[r.student_id].total++;
    summaryMap[r.student_id][r.status]++;
  }
  const summaryRows = Object.values(summaryMap).sort((a, b) =>
    (a.roll_number || '').localeCompare(b.roll_number || '', undefined, { numeric: true })
  );

  const totalPresent = records.filter(r => r.status === 'present').length;
  const totalAbsent  = records.filter(r => r.status === 'absent').length;
  const totalLate    = records.filter(r => r.status === 'late').length;
  const totalRecords = records.length;

  return (
    <Layout title="Student Attendance" subtitle="Class-wise attendance logs">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Attendance Logs</h1>
          <p className="page-subtitle">
            {gradeName}{sectionName ? ` — Section ${sectionName}` : ''} · {view === 'daily' ? date : month}
          </p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-card-hover)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          {[{ key: 'daily', label: 'By Date' }, { key: 'summary', label: 'By Month' }].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600,
                background: view === v.key ? 'var(--accent-primary)' : 'transparent',
                color: view === v.key ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >{v.label}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {/* Grade */}
        <div style={{ position: 'relative' }}>
          <select className="form-select" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ minWidth: '140px', paddingRight: '32px' }}>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>
        {/* Section */}
        {sections.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select className="form-select" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} style={{ minWidth: '120px', paddingRight: '32px' }}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        )}
        {/* Date or Month */}
        {view === 'daily' ? (
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
        ) : (
          <input type="month" className="form-input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }} />
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Records', value: totalRecords,  color: 'var(--accent-primary)' },
          { label: 'Present',       value: totalPresent,  color: '#22c55e' },
          { label: 'Absent',        value: totalAbsent,   color: '#ef4444' },
          { label: 'Late',          value: totalLate,     color: '#f59e0b' },
        ].map(c => (
          <div className="card" key={c.label}>
            <div className="card-body" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : records.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px' }}>
            <CalendarDays size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontWeight: 600 }}>No attendance records found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {view === 'daily' ? 'No attendance was marked for this date' : 'No records for this month'}
            </div>
          </div>
        ) : view === 'daily' ? (
          /* ── Daily view: one row per student ─────────────────────────── */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Roll No', 'Student', 'Date', 'Day', 'Status', 'Check-in', 'Check-out'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const st = STATUS_STYLE[r.status] || STATUS_STYLE.absent;
                  const dayName = DAYS[new Date(r.date).getDay()];
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.roll_number || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{r.student_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{dayName}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px' }}>
                        {r.check_in
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 600 }}><Clock size={12} />{r.check_in}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px' }}>
                        {r.check_out
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 600 }}><Clock size={12} />{r.check_out}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Monthly summary view: one row per student ────────────────── */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Roll No', 'Student', 'Total Days', 'Present', 'Absent', 'Late', 'Attendance %'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((s, i) => {
                  const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
                  const pctColor = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.roll_number || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{s.student_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', textAlign: 'center' }}>{s.total}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 700, fontSize: '13px' }}>
                          {s.present}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>{s.absent}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '13px' }}>{s.late}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border-color)', minWidth: '60px' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: pctColor, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: pctColor, minWidth: '36px' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
