import Icon from '@/components/common/Icon';

/** Danh sách lặp (timeline, video, FAQ…) với thêm / xóa / đổi thứ tự. */
export default function Repeater({ items, onChange, render, makeItem, addLabel, itemLabel }) {
  const update = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="repeater">
      {items.map((it, i) => (
        <div key={it.id || i} className="repeater__item">
          <div className="repeater__head">
            <span>{itemLabel} {i + 1}</span>
            <span style={{ display: 'flex', gap: 4 }}>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => move(i, -1)} aria-label="Lên">↑</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => move(i, 1)} aria-label="Xuống">↓</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => remove(i)} aria-label="Xóa"><Icon name="trash" size={15} /></button>
            </span>
          </div>
          {render(it, (patch) => update(i, patch))}
        </div>
      ))}
      <button type="button" className="btn btn--outline" style={{ justifySelf: 'start' }} onClick={() => onChange([...items, makeItem()])}><Icon name="plus" size={16} /> {addLabel}</button>
    </div>
  );
}
