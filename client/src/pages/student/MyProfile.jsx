import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { User, GraduationCap, Phone, MapPin, Calendar, Droplets } from 'lucide-react';
import { SkBox, SkLine, SkCircle } from '../../components/Skeleton';

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div style={{
      padding: '14px',
      background: 'var(--bg-primary)',
      borderRadius: '10px',
      border: '1px solid var(--border-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  );
}

export default function MyProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => { api.get('/student/profile').then(res => setProfile(res.data)); }, []);

  if (!profile) return (
    <Layout title="Profile">
      <div style={{ maxWidth: '640px' }}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <SkBox w="100%" h={90} />
          <div style={{ padding: '20px', display: 'flex', gap: '14px' }}>
            <SkCircle size={64} />
            <div style={{ flex: 1 }}><SkLine size="lg" style={{ marginBottom: '8px' }} /><SkLine w="60%" /></div>
          </div>
        </div>
        {[1, 2].map(i => (
          <div className="card" key={i} style={{ marginBottom: '14px', padding: '20px' }}>
            {[1,2,3,4].map(j => <SkLine key={j} style={{ marginBottom: '10px' }} />)}
          </div>
        ))}
      </div>
    </Layout>
  );

  return (
    <Layout title="Profile" subtitle="Student information">
      <div style={{ maxWidth: '640px' }}>

        {/* ── Profile card ── */}
        <div className="profile-card" style={{ marginBottom: '16px' }}>
          <div className="profile-cover" />
          <div className="profile-avatar-lg">{profile.name?.charAt(0)}</div>
          <div className="profile-info">
            <div className="profile-name">{profile.name}</div>
            <div className="profile-detail">
              <GraduationCap size={13} />
              {profile.grade_name} – {profile.section_name}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple">Roll {profile.roll_number}</span>
              <span className="badge badge-info">{profile.school_name}</span>
            </div>
          </div>
        </div>

        {/* ── Personal details ── */}
        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="card-header"><div className="card-title">Personal Details</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InfoTile icon={Calendar}  label="Date of Birth"  value={profile.dob} />
              <InfoTile icon={User}      label="Gender"         value={profile.gender} />
              <InfoTile icon={Droplets}  label="Blood Group"    value={profile.blood_group} />
              <InfoTile icon={Calendar}  label="Admission Date" value={profile.admission_date} />
            </div>
          </div>
        </div>

        {/* ── Parent details ── */}
        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="card-header"><div className="card-title">Parent Details</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              {[
                { label: 'Father', name: profile.father_name, phone: profile.father_phone, color: '#3b82f6' },
                { label: 'Mother', name: profile.mother_name, phone: profile.mother_phone, color: '#8b5cf6' },
              ].map(({ label, name, phone, color }) => (
                <div key={label} style={{
                  padding: '14px', borderRadius: '10px',
                  background: `${color}08`, border: `1px solid ${color}20`,
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{name || '—'}</div>
                  {phone && (
                    <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color, fontSize: '12px', marginTop: '5px', fontWeight: 500 }}>
                      <Phone size={11} /> {phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
            {profile.address && (
              <div style={{ padding: '14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <MapPin size={11} /> Address
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{profile.address}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
