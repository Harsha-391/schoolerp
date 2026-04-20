import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { QrCode, CheckCircle, LogOut, AlertCircle, Camera, CameraOff } from 'lucide-react';

export default function QRScanner() {
  const [school,       setSchool]       = useState(null);
  const [scanning,     setScanning]     = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [recentScans,  setRecentScans]  = useState([]);
  const [error,        setError]        = useState('');
  const [countdown,    setCountdown]    = useState(0);

  const scannerRef     = useRef(null);
  const processingRef  = useRef(false);
  const countdownTimer = useRef(null);
  const countdownVal   = useRef(0);

  useEffect(() => {
    api.get('/admin/school').then(res => setSchool(res.data)).catch(() => {});
    return () => { doStop(); clearInterval(countdownTimer.current); };
  }, []);

  const doStop = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
      } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setError('');
    try {
      // Dynamic import avoids top-level crash
      const { Html5Qrcode } = await import('html5-qrcode');
      await doStop();
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {}  // ignore per-frame errors
      );
      setScanning(true);
    } catch (err) {
      console.error(err);
      setError('Could not start camera. Please allow camera access and try again.');
    }
  };

  const stopScanner = async () => {
    await doStop();
    setScanning(false);
  };

  const startCountdown = (seconds) => {
    clearInterval(countdownTimer.current);
    countdownVal.current = seconds;
    setCountdown(seconds);
    countdownTimer.current = setInterval(() => {
      countdownVal.current -= 1;
      setCountdown(countdownVal.current);
      if (countdownVal.current <= 0) {
        clearInterval(countdownTimer.current);
        setAnnouncement(null);
        processingRef.current = false;
      }
    }, 1000);
  };

  const onScanSuccess = useCallback((token) => {
    if (processingRef.current) return;
    processingRef.current = true;

    api.post('/admin/qr/scan', { token })
      .then(res => {
        const data = res.data;
        setAnnouncement(data);
        setRecentScans(prev => [{ ...data, scannedAt: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
        startCountdown(4);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Scan failed';
        setError(msg);
        setTimeout(() => { setError(''); processingRef.current = false; }, 3000);
      });
  }, []);

  const dismissAnnouncement = () => {
    clearInterval(countdownTimer.current);
    setAnnouncement(null);
    setCountdown(0);
    processingRef.current = false;
  };

  const actionColor = (action) =>
    action === 'in' ? '#22c55e' : action === 'out' ? '#f59e0b' : '#94a3b8';

  const actionLabel = (action) =>
    action === 'in' ? 'CHECKED IN' : action === 'out' ? 'CHECKED OUT' : 'ALREADY MARKED';

  return (
    <Layout title="QR Scanner" subtitle="Scan QR codes to mark attendance">

      <div className="page-header">
        <div>
          <h1 className="page-title">QR Attendance Scanner</h1>
          <p className="page-subtitle">
            {school ? `${school.name}` : 'Loading…'}
          </p>
        </div>
        <button
          className={`btn ${scanning ? 'btn-secondary' : 'btn-primary'}`}
          onClick={scanning ? stopScanner : startScanner}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {scanning ? <CameraOff size={16} /> : <Camera size={16} />}
          {scanning ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>

      {/* Camera card */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

          {/* Scanner container — always in DOM so html5-qrcode can attach */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <div
              id="qr-reader"
              style={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                minHeight: '300px',
              }}
            />
            {/* Placeholder overlay when not scanning */}
            {!scanning && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'var(--bg-input)',
                borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '12px',
              }}>
                <QrCode size={52} style={{ opacity: 0.25 }} />
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '0 20px' }}>
                  Click <strong>Start Camera</strong> to begin scanning
                </div>
              </div>
            )}
            {/* Scanning frame overlay */}
            {scanning && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '12px',
                pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '200px', height: '200px',
                  border: '2px solid rgba(99,102,241,0.8)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)',
                }} />
              </div>
            )}
          </div>

          {scanning && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Point the QR code at the purple frame
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '10px 16px',
              color: 'var(--error)', fontSize: '13px', textAlign: 'center', width: '100%',
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Announcement overlay */}
      {announcement && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px',
          }}
          onClick={dismissAnnouncement}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '32px 28px',
              maxWidth: '380px', width: '100%',
              textAlign: 'center',
              border: `2px solid ${actionColor(announcement.action)}`,
              boxShadow: `0 0 60px ${actionColor(announcement.action)}50`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Avatar */}
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: 'var(--accent-soft)',
              border: `3px solid ${actionColor(announcement.action)}`,
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 700, color: 'var(--accent-primary)',
              overflow: 'hidden',
            }}>
              {announcement.avatar
                ? <img src={announcement.avatar} alt={announcement.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : announcement.name?.charAt(0)
              }
            </div>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: `${actionColor(announcement.action)}20`,
              border: `1px solid ${actionColor(announcement.action)}50`,
              borderRadius: '20px', padding: '4px 14px',
              fontSize: '11px', fontWeight: 800, letterSpacing: '1px',
              color: actionColor(announcement.action), marginBottom: '12px',
            }}>
              {announcement.action === 'in'
                ? <CheckCircle size={13} />
                : announcement.action === 'out'
                ? <LogOut size={13} />
                : <AlertCircle size={13} />
              }
              {actionLabel(announcement.action)}
            </div>

            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
              {announcement.name}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {announcement.class}
            </div>

            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '12px', padding: '12px 16px',
              fontSize: '13px', color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}>
              {announcement.announcement}
            </div>

            {/* Countdown + dismiss */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                flex: 1, height: '4px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: actionColor(announcement.action),
                  width: `${(countdown / 4) * 100}%`,
                  transition: 'width 1s linear',
                  borderRadius: '4px',
                }} />
              </div>
              <button
                onClick={dismissAnnouncement}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                Next scan
              </button>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Auto-ready in {countdown}s · tap anywhere or click Next scan
            </div>
          </div>
        </div>
      )}

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Today's Scans</div>
            <span className="badge badge-purple">{recentScans.length}</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentScans.map((scan, i) => (
              <div key={i} className="list-item" style={{ padding: '11px 16px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, overflow: 'hidden',
                }}>
                  {scan.avatar
                    ? <img src={scan.avatar} alt={scan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : scan.name?.charAt(0)
                  }
                </div>
                <div className="list-item-content">
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{scan.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{scan.class}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
                    color: actionColor(scan.action),
                  }}>
                    {scan.action === 'in' ? '▶ IN' : scan.action === 'out' ? '◀ OUT' : '✓ DONE'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{scan.scannedAt || scan.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
