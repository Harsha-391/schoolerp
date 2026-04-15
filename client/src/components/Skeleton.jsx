// Reusable skeleton screen components — drop-in replacements for loading states.

// ─── Primitives ───────────────────────────────────────────────────────────────

export function SkLine({ w = '100%', size = '', style = {} }) {
  return <span className={`skeleton sk-line ${size}`} style={{ width: w, ...style }} />;
}

export function SkBox({ w = '100%', h = 48, radius, style = {} }) {
  return (
    <div className="skeleton sk-box"
      style={{ width: w, height: h, borderRadius: radius, ...style }} />
  );
}

export function SkCircle({ size = 40 }) {
  return <div className="skeleton sk-circle" style={{ width: size, height: size }} />;
}

// ─── Page header (title + optional button) ────────────────────────────────────

export function SkPageHeader({ hasButton = true }) {
  return (
    <div className="page-header" style={{ marginBottom: '24px' }}>
      <div>
        <SkLine w={180} size="xl" style={{ marginBottom: '8px' }} />
        <SkLine w={120} size="sm" />
      </div>
      {hasButton && <SkBox w={120} h={36} radius="10px" />}
    </div>
  );
}

// ─── Row of stat cards ────────────────────────────────────────────────────────

export function SkStatCards({ count = 4 }) {
  return (
    <div className="stats-grid" style={{ marginBottom: '24px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkCircle size={38} />
            <SkLine w={50} size="sm" />
          </div>
          <SkLine w="60%" size="sm" style={{ marginTop: '4px' }} />
          <SkLine w="40%" size="xl" />
        </div>
      ))}
    </div>
  );
}

// ─── Table (header row + n data rows) ────────────────────────────────────────

export function SkTable({ rows = 7, cols = 5, hasSearch = false }) {
  const flex = Array.from({ length: cols }).map(() => 1);
  return (
    <div className="card">
      {hasSearch && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
          <SkBox w={220} h={34} radius="10px" />
          <SkBox w={120} h={34} radius="10px" />
        </div>
      )}
      <div style={{ padding: '0 20px' }}>
        {/* header */}
        <div className="sk-table-row" style={{ borderBottom: '2px solid var(--border-color)' }}>
          {flex.map((_, i) => <SkLine key={i} w={`${55 + (i * 13) % 35}%`} size="sm" style={{ flex: 1 }} />)}
        </div>
        {/* rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="sk-table-row">
            {flex.map((_, c) => (
              c === 0
                ? <div key={c} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SkCircle size={30} />
                    <div style={{ flex: 1 }}>
                      <SkLine w="70%" style={{ marginBottom: '4px' }} />
                      <SkLine w="45%" size="sm" />
                    </div>
                  </div>
                : <SkLine key={c} w={`${40 + (r + c * 3) % 40}%`} style={{ flex: 1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card grid (staff cards, school cards, etc.) ──────────────────────────────

export function SkCards({ count = 6, cols = 3 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '16px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <SkCircle size={44} />
            <div style={{ flex: 1 }}>
              <SkLine w="70%" style={{ marginBottom: '6px' }} />
              <SkLine w="50%" size="sm" />
            </div>
          </div>
          <SkBox w="100%" h={1} style={{ margin: '8px 0', opacity: 0.5 }} />
          <SkLine w="80%" size="sm" style={{ marginBottom: '6px' }} />
          <SkLine w="60%" size="sm" style={{ marginBottom: '6px' }} />
          <SkLine w="40%" size="sm" />
        </div>
      ))}
    </div>
  );
}

// ─── Chart placeholder ────────────────────────────────────────────────────────

export function SkChart({ h = 240 }) {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ padding: '20px' }}>
        <SkLine w={160} style={{ marginBottom: '4px' }} />
        <SkLine w={100} size="sm" style={{ marginBottom: '16px' }} />
        <SkBox w="100%" h={h} radius="8px" />
      </div>
    </div>
  );
}

// ─── Full dashboard layout ────────────────────────────────────────────────────

export function SkDashboard({ statCount = 4, tableRows = 5 }) {
  return (
    <>
      <SkStatCards count={statCount} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <SkChart h={200} />
        <SkChart h={200} />
      </div>
      <SkTable rows={tableRows} cols={5} />
    </>
  );
}

// ─── Management page (header + optional search + table) ──────────────────────

export function SkManagementPage({ cols = 5, rows = 8, hasSearch = true, cards = false, cardCount = 6 }) {
  return (
    <>
      <SkPageHeader />
      {cards ? <SkCards count={cardCount} /> : <SkTable rows={rows} cols={cols} hasSearch={hasSearch} />}
    </>
  );
}

// ─── Analytics / finance page ─────────────────────────────────────────────────

export function SkAnalyticsPage() {
  return (
    <>
      <SkStatCards count={4} />
      <SkChart h={260} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <SkChart h={200} />
        <SkChart h={200} />
      </div>
    </>
  );
}
