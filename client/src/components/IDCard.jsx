import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

function fmtDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function IDCard({ person, type, school, onClose }) {
  const qrRef = useRef(null);

  const qrToken = `${type === 'student' ? 'student' : 'staff'}:${person.id}`;

  const handlePrint = () => {
    // Extract QR as PNG data URL from the canvas element
    const canvas = qrRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    const avatarHtml = person.avatar
      ? `<img src="${person.avatar}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : `<span style="font-size:22px;font-weight:700;color:#fff;">${person.name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>`;

    const roleLabel = type === 'student'
      ? `${person.grade_name || ''}${person.section_name ? ' - ' + person.section_name : ''}`.trim()
      : person.designation || 'Staff';

    const rows = type === 'student' ? [
      person.roll_number  && ['Roll No.',  person.roll_number],
      person.dob          && ['DOB',        fmtDate(person.dob)],
      person.blood_group  && ['Blood',      person.blood_group],
      person.father_name  && ['Father',     person.father_name],
      person.father_phone && ['Contact',    person.father_phone],
    ].filter(Boolean) : [
      person.department   && ['Dept',    person.department],
      person.phone        && ['Phone',   person.phone],
      person.email        && ['Email',   person.email],
      person.joining_date && ['Joined',  fmtDate(person.joining_date)],
    ].filter(Boolean);

    const rowsHtml = rows.map(([label, value]) => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;gap:4px;">
        <span style="font-size:8px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;flex-shrink:0;">${label}</span>
        <span style="font-size:10px;color:#1f2937;font-weight:700;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:115px;">${value}</span>
      </div>`).join('');

    const html = `<!DOCTYPE html><html><head>
      <title>ID Card — ${person.name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        @page{size:4in 4in;margin:0;}
        html,body{width:4in;height:4in;background:#fff;}
      </style>
    </head><body>
      <div style="width:4in;height:4in;display:flex;flex-direction:column;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;background:#fff;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:10px 14px 18px;text-align:center;color:#fff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.5px;">${school?.name || 'School ERP'}</div>
          ${school?.city ? `<div style="font-size:9px;opacity:0.85;margin-top:2px;">${school.city}${school.state ? ', ' + school.state : ''}</div>` : ''}
          <div style="display:inline-block;margin-top:6px;background:rgba(255,255,255,0.22);border-radius:20px;padding:2px 12px;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
            ${type === 'student' ? 'Student ID Card' : 'Staff ID Card'}
          </div>
        </div>
        <!-- Body -->
        <div style="display:flex;flex:1;padding:10px 14px 8px;gap:12px;align-items:center;overflow:hidden;">
          <!-- Photo + QR -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
            <div style="width:72px;height:72px;border-radius:10px;border:2px solid #e0e7ff;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${avatarHtml}
            </div>
            <div style="border:2px solid #e0e7ff;border-radius:6px;padding:3px;background:#fff;">
              ${qrDataUrl ? `<img src="${qrDataUrl}" width="72" height="72" />` : ''}
            </div>
          </div>
          <!-- Info -->
          <div style="flex:1;min-width:0;overflow:hidden;">
            <div style="font-size:13px;font-weight:800;color:#1e1b4b;margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${person.name}</div>
            <div style="font-size:10px;color:#6366f1;font-weight:600;margin-bottom:8px;">${roleLabel}</div>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e0e7ff,transparent);margin:0 0 7px;"></div>
            ${rowsHtml}
          </div>
        </div>
        <!-- Footer -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:6px 14px;text-align:center;">
          <div style="font-family:monospace;font-size:9px;color:rgba(255,255,255,0.9);letter-spacing:1.5px;">
            ID: ${person.id?.substring(0,12)?.toUpperCase() || '—'}
          </div>
        </div>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=500,height=530');
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const initials = person.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = type === 'student'
    ? `${person.grade_name || ''}${person.section_name ? ' - ' + person.section_name : ''}`.trim()
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
        <div style={{
          width: '320px', height: '320px', background: '#fff',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(99,102,241,0.25)', borderRadius: '14px',
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '10px 14px 18px', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>{school?.name || 'School ERP'}</div>
            {school?.city && <div style={{ fontSize: '9px', opacity: 0.85, marginTop: '2px' }}>{school.city}{school.state ? ', ' + school.state : ''}</div>}
            <div style={{ display: 'inline-block', marginTop: '6px', background: 'rgba(255,255,255,0.22)', borderRadius: '20px', padding: '2px 12px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {type === 'student' ? 'Student ID Card' : 'Staff ID Card'}
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', flex: 1, padding: '10px 14px 8px', gap: '12px', alignItems: 'center' }}>
            {/* Photo + QR column */}
            <div ref={qrRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '10px', border: '2px solid #e0e7ff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#fff', overflow: 'hidden' }}>
                {person.avatar
                  ? <img src={person.avatar} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : initials
                }
              </div>
              <div style={{ border: '2px solid #e0e7ff', borderRadius: '6px', padding: '3px', background: '#fff' }}>
                <QRCodeCanvas value={qrToken} size={72} level="M" />
              </div>
            </div>

            {/* Info column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e1b4b', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}</div>
              <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600, marginBottom: '8px' }}>{roleLabel}</div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,#e0e7ff,transparent)', margin: '0 0 7px' }} />

              {type === 'student' && person.roll_number  && <InfoRow label="Roll No." value={person.roll_number} />}
              {type === 'student' && person.dob          && <InfoRow label="DOB"       value={fmtDate(person.dob)} />}
              {type === 'student' && person.blood_group  && <InfoRow label="Blood"     value={person.blood_group} />}
              {type === 'student' && person.father_name  && <InfoRow label="Father"    value={person.father_name} />}
              {type === 'student' && person.father_phone && <InfoRow label="Contact"   value={person.father_phone} />}

              {type === 'staff' && person.department   && <InfoRow label="Dept"   value={person.department} />}
              {type === 'staff' && person.phone        && <InfoRow label="Phone"  value={person.phone} />}
              {type === 'staff' && person.email        && <InfoRow label="Email"  value={person.email} truncate />}
              {type === 'staff' && person.joining_date && <InfoRow label="Joined" value={fmtDate(person.joining_date)} />}
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1.5px' }}>
              ID: {person.id?.substring(0, 12)?.toUpperCase() || '—'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value, truncate }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: '4px' }}>
      <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#1f2937', fontWeight: 700, ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' } : {}) }}>{value}</span>
    </div>
  );
}
