import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Clock } from 'lucide-react';
import { SkBox, SkLine } from '../../components/Skeleton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const todayName = () => {
  const d = new Date().getDay();
  // 0=Sun, 1=Mon...6=Sat
  const map = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  return map[d] || 'Monday';
};

export default function MySchedule() {
  const [schedule, setSchedule] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [activeDay, setActiveDay] = useState(todayName());

  useEffect(() => {
    api.get('/staff/schedule').then(res => setSchedule(res.data)).finally(() => setLoading(false));
  }, []);

  const allPeriods = [];
  Object.values(schedule).forEach(day => {
    day.forEach(s => {
      if (!allPeriods.find(p => p.period === s.period)) {
        allPeriods.push({ period: s.period, start_time: s.start_time, end_time: s.end_time });
      }
    });
  });
  allPeriods.sort((a, b) => a.period - b.period);

  if (loading) return (
    <Layout title="Schedule">
      <div className="card" style={{ padding: '20px' }}>
        <SkBox w="100%" h={300} />
      </div>
    </Layout>
  );

  const daySlots = schedule[activeDay] || [];

  return (
    <Layout title="Schedule" subtitle="Weekly timetable">

      {/* ── Day tabs ── */}
      <div className="tabs">
        {DAYS.map((day, i) => (
          <button key={day} className={`tab ${activeDay === day ? 'active' : ''}`} onClick={() => setActiveDay(day)}>
            <span style={{ display: 'none' }}
              ref={el => { if (el) el.style.display = window.innerWidth >= 640 ? 'inline' : 'none'; }}>
              {day}
            </span>
            <span>{SHORT[i]}</span>
          </button>
        ))}
      </div>

      {/* ── Mobile: period cards for active day ── */}
      <div style={{ display: 'block' }}>
        {allPeriods.length === 0 ? (
          <div className="card">
            <div className="empty-state">No schedule data</div>
          </div>
        ) : allPeriods.map(p => {
          const slot = daySlots.find(s => s.period === p.period);
          return (
            <div key={p.period} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', marginBottom: '8px',
              background: 'var(--bg-card)',
              border: `1px solid ${slot ? 'var(--border-accent)' : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
            }}>
              {/* Period bubble */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: slot ? 'var(--accent-soft)' : 'var(--bg-input)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: slot ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  P{p.period}
                </span>
              </div>

              {slot ? (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{slot.subject_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {slot.grade_name} – {slot.section_name}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Free period
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                <Clock size={11} />
                <span>{p.start_time}–{p.end_time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop full grid ── */}
      <div className="card" style={{ display: 'none', marginTop: '16px' }}
        ref={el => { if (el) el.style.display = window.innerWidth >= 1024 ? 'block' : 'none'; }}>
        <div className="card-body" style={{ padding: 0, overflow: 'auto' }}>
          <div className="schedule-grid" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)` }}>
            <div className="schedule-cell schedule-header">Period</div>
            {DAYS.map(d => <div key={d} className="schedule-cell schedule-header">{d}</div>)}
            {allPeriods.map(p => (
              <>
                <div key={`p-${p.period}`} className="schedule-cell schedule-period">
                  <div>
                    <div>P{p.period}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{p.start_time}</div>
                  </div>
                </div>
                {DAYS.map(day => {
                  const slot = schedule[day]?.find(s => s.period === p.period);
                  return (
                    <div key={`${day}-${p.period}`} className="schedule-cell">
                      {slot
                        ? <><div className="schedule-subject">{slot.subject_name}</div><div className="schedule-class">{slot.grade_name}-{slot.section_name}</div></>
                        : <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Free</div>
                      }
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
