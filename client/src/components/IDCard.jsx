import { useRef } from 'react';
import { X, Printer } from 'lucide-react';

/**
 * IDCard — printable ID card modal for staff and students.
 *
 * Props:
 *   person  — { name, avatar, role/designation, grade_name, section_name,
 *               roll_number, id, email, phone, blood_group, dob }
 *   type    — 'student' | 'staff'
 *   school  — { name, subdomain, city, state }
 *   onClose — () => void
 */
export default function IDCard({ person, type, school, onClose }) {
  const cardRef = useRef(null);

  const handlePrint = () => {
    const content = cardRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(`
      <html>
        <head>
          <title>ID Card — ${person.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; display: flex; justify-content: center; align-items: flex-start; padding: 20px; }
            .id-card { width: 340px; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 32px rgba(99,102,241,0.18); }
            .id-card-header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 22px 20px 30px; text-align: center; color: #fff; }
            .school-name { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
            .school-sub { font-size: 10px; opacity: 0.85; margin-top: 2px; }
            .id-type { display: inline-block; margin-top: 8px; background: rgba(255,255,255,0.22); border-radius: 20px; padding: 3px 14px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
            .id-card-photo-wrap { display: flex; justify-content: center; margin-top: -36px; margin-bottom: 0; }
            .id-card-photo { width: 76px; height: 76px; border-radius: 50%; border: 3px solid #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #fff; overflow: hidden; box-shadow: 0 4px 16px rgba(99,102,241,0.25); }
            .id-card-photo img { width: 100%; height: 100%; object-fit: cover; }
            .id-card-body { padding: 10px 20px 20px; }
            .id-name { text-align: center; font-size: 16px; font-weight: 800; color: #1e1b4b; margin-bottom: 2px; }
            .id-role { text-align: center; font-size: 11px; color: #6366f1; font-weight: 600; margin-bottom: 14px; }
            .id-divider { height: 1px; background: linear-gradient(90deg, transparent, #e0e7ff, transparent); margin: 12px 0; }
            .id-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px; }
            .id-label { color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-size: 9px; }
            .id-value { color: #1f2937; font-weight: 700; font-size: 12px; }
            .id-card-footer { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 10px 20px; text-align: center; }
            .id-card-id { font-family: monospace; font-size: 11px; color: rgba(255,255,255,0.9); letter-spacing: 1.5px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  const initials = person.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = type === 'student'
    ? `${person.grade_name || ''} ${person.section_name ? '- ' + person.section_name : ''}`.trim()
    : person.designation || 'Staff';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} onClick={e => e.stopPropagation()}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={14} /> Print / Save PDF
          </button>
          <button className="btn btn-secondary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <X size={14} /> Close
          </button>
        </div>

        {/* Card preview */}
        <div ref={cardRef}>
          <div className="id-card" style={{
            width: '340px',
            background: '#fff',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
            fontFamily: "'Segoe UI', Arial, sans-serif",
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '22px 20px 34px',
              textAlign: 'center',
              color: '#fff',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                {school?.name || 'School ERP'}
              </div>
              {school?.city && (
                <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
                  {school.city}{school.state ? ', ' + school.state : ''}
                </div>
              )}
              <div style={{
                display: 'inline-block',
                marginTop: '10px',
                background: 'rgba(255,255,255,0.22)',
                borderRadius: '20px',
                padding: '3px 16px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>
                {type === 'student' ? 'Student ID Card' : 'Staff ID Card'}
              </div>
            </div>

            {/* Photo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-38px', marginBottom: '0' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '3px solid #fff',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                flexShrink: 0,
              }}>
                {person.avatar
                  ? <img src={person.avatar} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '12px 22px 20px' }}>
              <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: 800, color: '#1e1b4b', marginBottom: '2px' }}>
                {person.name}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#6366f1', fontWeight: 600, marginBottom: '14px' }}>
                {roleLabel}
              </div>

              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e0e7ff, transparent)', margin: '0 0 12px' }} />

              {type === 'student' && person.roll_number && (
                <Row label="Roll No." value={person.roll_number} />
              )}
              {type === 'student' && person.dob && (
                <Row label="Date of Birth" value={person.dob} />
              )}
              {type === 'student' && person.blood_group && (
                <Row label="Blood Group" value={person.blood_group} />
              )}
              {type === 'student' && person.father_name && (
                <Row label="Father" value={person.father_name} />
              )}
              {type === 'student' && person.father_phone && (
                <Row label="Contact" value={person.father_phone} />
              )}

              {type === 'staff' && person.department && (
                <Row label="Department" value={person.department} />
              )}
              {type === 'staff' && person.phone && (
                <Row label="Phone" value={person.phone} />
              )}
              {type === 'staff' && person.email && (
                <Row label="Email" value={person.email} />
              )}
              {type === 'staff' && person.joining_date && (
                <Row label="Joined" value={person.joining_date} />
              )}

              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e0e7ff, transparent)', margin: '12px 0 0' }} />
            </div>

            {/* Footer */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '10px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1.5px' }}>
                ID: {person.id?.substring(0, 12)?.toUpperCase() || '—'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: '12px', color: '#1f2937', fontWeight: 700 }}>{value}</span>
    </div>
  );
}
