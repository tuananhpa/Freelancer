import { COMPARE_ROWS } from '@/config/content';

export default function CompareTable() {
  return (
    <section className="section" id="khac-biet">
      <div className="container" style={{ maxWidth: 1040 }}>
        <div className="section__head section__head--center">
          <span className="eyebrow">Vì sao HYTale</span>
          <h2 className="section__title">Không chỉ truy xuất — mà là kể chuyện</h2>
        </div>
        <div className="compare">
          <table>
            <thead>
              <tr><th scope="col">Tiêu chí</th><th scope="col">Tem QR truyền thống</th><th scope="col" className="is-us">HYTale Dynamic QR</th></tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([k, a, b]) => (
                <tr key={k}><td>{k}</td><td style={{ color: 'var(--muted)' }}>{a}</td><td className="is-us">{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
