import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { QrCode, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export default function QRAttendance() {
  const [qrData,  setQrData]  = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff/qr-attendance');
      setQrData(res.data);
    } catch {
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="QR Attendance" subtitle="Daily attendance via QR">
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '32px 24px', textAlign: 'center' }}>

            {!qrData ? (
              <>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <QrCode size={36} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Generate QR Code</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
                  Generate your daily attendance QR code. Students scan it to mark your attendance.
                </p>
              </>
            ) : (
              <>
                {/* Status banner */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: 'var(--radius-full)',
                  background: qrData.already_marked ? 'var(--warning-light)' : 'var(--success-light)',
                  border: `1px solid ${qrData.already_marked ? 'var(--warning-border)' : 'var(--success-border)'}`,
                  color: qrData.already_marked ? 'var(--warning)' : 'var(--success)',
                  fontSize: '13px', fontWeight: 600, marginBottom: '24px',
                }}>
                  {qrData.already_marked
                    ? <><Clock size={14} /> Already marked today</>
                    : <><CheckCircle size={14} /> Attendance marked!</>
                  }
                </div>

                {/* QR image */}
                <div style={{
                  width: '220px', height: '220px', margin: '0 auto 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '3px solid var(--border-primary)',
                  background: 'white', padding: '12px',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                }}>
                  <img src={qrData.qr_image} alt="Attendance QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '24px' }}>
                  {qrData.date}
                </div>
              </>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={generate}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading
                ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : qrData
                  ? <><RefreshCw size={16} /> Refresh QR</>
                  : <><QrCode size={18} /> Generate QR Code</>
              }
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '16px', padding: '14px 18px',
          background: 'var(--info-light)', border: '1px solid var(--info-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px', color: '#1e40af', lineHeight: 1.6,
        }}>
          💡 Show this QR code to be scanned — it logs your attendance for today. QR refreshes daily.
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
