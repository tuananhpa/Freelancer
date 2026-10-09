import { useState } from 'react';

/** Khối 3: Hành trình sản phẩm — trục thời gian dọc, chạm để mở từng mốc. */
export default function JourneyTimeline({ steps = [] }) {
  const [active, setActive] = useState(0);
  if (!steps.length) return null;
  return (
    <section className="pp-section pp-section--dark on-dark" aria-labelledby="journey-title">
      <span className="eyebrow">Hành trình lô hàng</span>
      <h2 id="journey-title" className="pp-section__title">{steps.length} mốc của mùa vụ này</h2>
      <ol className="timeline">
        {steps.map((s, i) => (
          <li key={s.id || i} className={`timeline__item ${i === active ? 'is-active' : ''} ${i < active ? 'is-done' : ''}`}>
            <span className="timeline__dot" aria-hidden="true">{i + 1}</span>
            <button type="button" className="timeline__btn" onClick={() => setActive(i)} aria-expanded={i === active}>
              <span className="timeline__when">{s.when}</span>
              <span className="timeline__title">{s.title}</span>
              <span className="timeline__desc">{s.description}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
