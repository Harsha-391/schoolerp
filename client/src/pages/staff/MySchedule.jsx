import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MySchedule() {
  const [schedule, setSchedule] = useState({});
  useEffect(() => { api.get('/staff/schedule').then(res => setSchedule(res.data)); }, []);

  const allPeriods = [];
  Object.values(schedule).forEach(daySchedule => {
    daySchedule.forEach(s => {
      if (!allPeriods.find(p => p.period === s.period)) {
        allPeriods.push({ period: s.period, start_time: s.start_time, end_time: s.end_time });
      }
    });
  });
  allPeriods.sort((a, b) => a.period - b.period);

  return (
    <Layout title="My Schedule" subtitle="Weekly timetable">
      <div className="page-header">
        <h1 className="page-title">Weekly Schedule</h1>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflow: 'auto' }}>
          <div className="schedule-grid" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)` }}>
            <div className="schedule-cell schedule-header">Period</div>
            {DAYS.map(d => <div key={d} className="schedule-cell schedule-header">{d}</div>)}

            {allPeriods.map(p => (
              <>
                <div key={`period-${p.period}`} className="schedule-cell schedule-period">
                  <div>
                    <div>P{p.period}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{p.start_time}-{p.end_time}</div>
                  </div>
                </div>
                {DAYS.map(day => {
                  const slot = schedule[day]?.find(s => s.period === p.period);
                  return (
                    <div key={`${day}-${p.period}`} className="schedule-cell">
                      {slot ? (
                        <>
                          <div className="schedule-subject">{slot.subject_name}</div>
                          <div className="schedule-class">{slot.grade_name}-{slot.section_name}</div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Free</div>
                      )}
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
