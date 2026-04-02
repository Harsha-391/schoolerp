import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { QrCode, CheckCircle, Clock } from 'lucide-react';

export default function QRAttendance() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff/qr-attendance');
      setQrData(res.data);
    } catch (err) {
      alert('Failed to generate QR');
    }
    setLoading(false);
  };

  return (
    <Layout title="QR Attendance" subtitle="Daily attendance via QR code">
      <div className="page-header">
        <h1 className="page-title">QR Attendance</h1>
      </div>

      <div className="card" style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div className="card-body">
          <div className="qr-container">
            {qrData ? (
              <>
                <img src={qrData.qr_image} alt="Attendance QR" className="qr-code-img" />
                <div className="qr-date">
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {qrData.date}
                </div>
                <div className="qr-status" style={{ color: qrData.already_marked ? 'var(--warning)' : 'var(--success)' }}>
                  {qrData.already_marked ? (
                    <><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Already marked for today</>
                  ) : (
                    <><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Attendance marked successfully!</>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <QrCode size={36} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Generate Your QR Code</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Click below to generate your daily attendance QR code
                </p>
              </div>
            )}
            <button className="btn btn-primary btn-lg" onClick={generateQR} disabled={loading} style={{ marginTop: '20px', width: '100%' }}>
              <QrCode size={18} />
              {loading ? 'Generating...' : qrData ? 'Regenerate QR' : 'Generate QR Code'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Calendar({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
