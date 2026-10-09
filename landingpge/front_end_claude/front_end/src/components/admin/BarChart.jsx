/** Biểu đồ cột đơn giản bằng CSS (không cần thư viện). */
export function BarChart({ data, label = (d) => d.date, value = (d) => d.count, height = 160 }) {
  const max = Math.max(1, ...data.map(value));
  return (
    <div>
      <div className="bars" style={{ height }} role="img" aria-label="Biểu đồ lượt quét theo ngày">
        {data.map((d, i) => (
          <div key={i} className="bars__col" style={{ height: `${(value(d) / max) * 100}%`, minHeight: value(d) ? 4 : 1, opacity: value(d) ? 1 : 0.25 }} title={`${label(d)}: ${value(d)}`} />
        ))}
      </div>
      {data.length > 1 && <div className="bars__axis"><span>{label(data[0])}</span><span>{label(data[data.length - 1])}</span></div>}
    </div>
  );
}

export function HBarList({ rows, empty = 'Chưa có dữ liệu' }) {
  if (!rows?.length) return <p className="empty">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <div className="hbar__row"><span>{r.label}</span><strong>{r.count}</strong></div>
          <div className="hbar__track"><div className="hbar__fill" style={{ width: `${(r.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
