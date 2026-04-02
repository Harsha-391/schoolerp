import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { User, GraduationCap, Phone, MapPin, Calendar, Droplets } from 'lucide-react';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => { api.get('/student/profile').then(res => setProfile(res.data)); }, []);

  if (!profile) return <Layout title="My Profile"><div className="empty-state">Loading...</div></Layout>;

  return (
    <Layout title="My Profile" subtitle="Student information">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <div className="profile-card" style={{ marginBottom: '20px' }}>
          <div className="profile-cover">
            <div className="profile-avatar-lg">{profile.name?.charAt(0)}</div>
          </div>
          <div className="profile-info">
            <div className="profile-name">{profile.name}</div>
            <div className="profile-detail">
              <GraduationCap size={14} /> {profile.grade_name} - {profile.section_name} · {profile.school_name}
            </div>
            <div className="profile-detail">
              <span className="badge badge-purple" style={{ marginTop: '4px' }}>Roll: {profile.roll_number}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Personal Details</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: Calendar, label: 'Date of Birth', value: profile.dob },
                { icon: User, label: 'Gender', value: profile.gender },
                { icon: Droplets, label: 'Blood Group', value: profile.blood_group },
                { icon: Calendar, label: 'Admission Date', value: profile.admission_date },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <item.icon size={12} /> {item.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.value || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header"><div className="card-title">Parent Details</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '14px', background: 'rgba(59,130,246,0.04)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Father</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{profile.father_name}</div>
                <a href={`tel:${profile.father_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '12px', marginTop: '4px' }}>
                  <Phone size={12} /> {profile.father_phone}
                </a>
              </div>
              <div style={{ padding: '14px', background: 'rgba(139,92,246,0.04)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Mother</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{profile.mother_name}</div>
                <a href={`tel:${profile.mother_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  <Phone size={12} /> {profile.mother_phone}
                </a>
              </div>
            </div>
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <MapPin size={12} /> Address
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{profile.address}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
