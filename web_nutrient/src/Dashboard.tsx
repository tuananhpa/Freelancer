import { useState } from "react";
import {
  Camera,
  Plus,
  ArrowUpRight,
  Droplets,
  Flame,
  Utensils,
  MessageCircle,
  Minus,
  Pencil,
  Trash2,
  CalendarDays,
  Leaf,
  TrendingUp,
} from "lucide-react";
import { PageTitle, Meter, FoodImage, Empty, Note } from "./components";
import { api, today, n } from "./api";
import { slots } from "./catalog";
import type { ViewProps } from "./view-types";
import type { Meal } from "./types";
export function Totals({
  data,
  date = today(),
}: {
  data: ViewProps["data"];
  date?: string;
}) {
  const p = data.profile!,
    meals = data.meals.filter((m) => m.date === date),
    sum = (k: keyof Meal) => meals.reduce((s, m) => s + Number(m[k] ?? 0), 0);
  return (
    <div className="summary-strip">
      <div className="energy-summary">
        <span className="metric-label">
          <Flame size={21} />
          Năng lượng hôm nay
        </span>
        <div>
          <strong>{n(sum("kcal"))}</strong>
          <span> / {n(p.calorieTarget)} kcal</span>
        </div>
        <Meter value={sum("kcal")} target={p.calorieTarget} />
      </div>
      {[
        ["protein", "Đạm", p.proteinTarget, "teal"],
        ["carbs", "Tinh bột", p.carbsTarget, "gold"],
        ["fat", "Chất béo", p.fatTarget, "orange"],
      ].map(([key, label, target, color]) => (
        <div className="macro" key={key}>
          <span>{label}</span>
          <div>
            <strong>{n(sum(key as keyof Meal))}g</strong>
            <span> / {target}g</span>
          </div>
          <Meter
            value={sum(key as keyof Meal)}
            target={Number(target)}
            color={String(color)}
          />
        </div>
      ))}
    </div>
  );
}
export function WeeklyChart({
  data,
  end = today(),
  mode = "week",
}: {
  data: ViewProps["data"];
  end?: string;
  mode?: string;
}) {
  const days = Array.from({ length: mode === "day" ? 4 : 7 }, (_, i) => {
    if (mode === "day") {
      const slot = slots[i];
      return {
        key: slot.id,
        label: slot.label,
        value: data.meals
          .filter((m) => m.date === end && m.slot === slot.id)
          .reduce((s, m) => s + m.kcal, 0),
      };
    }
    const date = new Date(end + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() - (6 - i));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("vi-VN", {
        weekday: "short",
        timeZone: "Asia/Saigon",
      }),
      value: data.meals
        .filter((m) => m.date === key)
        .reduce((s, m) => s + m.kcal, 0),
    };
  });
  const max = Math.max(
    data.profile!.calorieTarget,
    ...days.map((d) => d.value),
    1,
  );
  return (
    <div className="weekly-chart">
      <div className="chart-plot">
        {[0, 1, 2, 3].map((i) => (
          <div
            className="gridline"
            style={{ bottom: (i / 3) * 100 + "%" }}
            key={i}
          >
            <span>{n((max * i) / 3)}</span>
          </div>
        ))}
        <div className="bars">
          {days.map((d, i) => (
            <div className="bar-cell" key={d.key}>
              <span className="bar-value">{d.value ? n(d.value) : "—"}</span>
              <div
                className={"bar " + (i === days.length - 1 ? "current" : "")}
                style={{
                  height:
                    Math.max(d.value ? 3 : 0, (d.value / max) * 100) + "%",
                }}
                title={d.label + ": " + n(d.value) + " kcal"}
              />
              <span className="bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      {!days.some((d) => d.value > 0) && (
        <p className="chart-empty">
          Ghi bữa ăn đầu tiên để bắt đầu biểu đồ của bạn.
        </p>
      )}
    </div>
  );
}
export function WaterCard({
  data,
  refresh,
  notify,
}: {
  data: ViewProps["data"];
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    water = data.water.find((w) => w.date === today())?.ml ?? 0,
    target = data.profile!.waterTarget;
  async function change(delta: number) {
    setBusy(true);
    try {
      await api("/water", "POST", { delta, date: today() });
      await refresh();
      if (data.settings.sound && delta > 0) {
        try {
          const a = new AudioContext(),
            o = a.createOscillator(),
            g = a.createGain();
          o.connect(g);
          g.connect(a.destination);
          g.gain.value = 0.04;
          o.frequency.value = 620;
          o.start();
          o.stop(a.currentTime + 0.12);
        } catch {}
      }
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel water-card">
      <div className="section-head">
        <h2>Nước hôm nay</h2>
        <Droplets size={20} />
      </div>
      <div className="water-value">
        <span className="droplet">
          <Droplets size={26} />
        </span>
        <strong>{n(water)}</strong>
        <span>/ {n(target)} ml</span>
      </div>
      <Meter value={water} target={target} />
      <div className="water-actions">
        <div className="glasses" aria-label={water + " ml đã uống"}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              className={"glass " + (water / target > i / 5 ? "filled" : "")}
              key={i}
            />
          ))}
        </div>
        <button
          className="btn soft"
          disabled={busy}
          onClick={() => change(250)}
        >
          +250 ml
        </button>
        <button
          className="icon-btn"
          disabled={busy || water === 0}
          aria-label="Bớt 250 ml"
          onClick={() => change(-250)}
        >
          <Minus size={16} />
        </button>
      </div>
      <p className="muted small-text">
        Từng ngụm nhỏ trong ngày, theo nhu cầu của bạn.
      </p>
    </section>
  );
}
export function MealJournal({
  data,
  date,
  openMeal,
  refresh,
  notify,
}: {
  data: ViewProps["data"];
  date: string;
  openMeal: ViewProps["openMeal"];
  refresh: ViewProps["refresh"];
  notify: ViewProps["notify"];
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  async function remove(id: string) {
    try {
      await api("/meals/" + id, "DELETE");
      setDeleting(null);
      await refresh();
      notify("Đã xóa bữa ăn.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <div className="journal">
      <div className="journal-table-head">
        <span>Bữa ăn</span>
        <span>Thời gian</span>
        <span>Món ăn</span>
        <span>kcal</span>
        <span />
      </div>
      {slots.map((slot) => {
        const meals = data.meals
          .filter((m) => m.date === date && m.slot === slot.id)
          .sort((a, b) => a.time.localeCompare(b.time));
        return (
          <div className="journal-slot" key={slot.id}>
            {meals.length ? (
              meals.map((m, i) => (
                <div className="journal-row" key={m.id}>
                  <strong className="slot-name">
                    {i === 0 ? slot.label : ""}
                  </strong>
                  <span className="meal-time">{m.time}</span>
                  <div className="meal-description">
                    <FoodImage imageId={m.imageId} small />
                    <div>
                      <strong>{m.name}</strong>
                      <p>{m.portion}</p>
                    </div>
                  </div>
                  <strong className="meal-kcal">
                    {n(m.kcal)}
                    <span> kcal</span>
                  </strong>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      aria-label={"Sửa " + m.name}
                      onClick={() => openMeal(m)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-btn danger-text"
                      aria-label={"Xóa " + m.name}
                      onClick={() => setDeleting(m.id!)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {deleting === m.id && (
                    <div className="delete-confirm">
                      <span>Xóa bữa ăn này?</span>
                      <button className="btn" onClick={() => setDeleting(null)}>
                        Giữ lại
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => remove(m.id!)}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <button
                className="journal-row empty-row"
                onClick={() =>
                  openMeal({ date, slot: slot.id, time: slot.time })
                }
              >
                <strong className="slot-name">{slot.label}</strong>
                <span className="meal-time">{slot.time}</span>
                <span className="meal-description">
                  <span className="add-tile">
                    <Plus size={20} />
                  </span>
                  <span>
                    <strong>Thêm món</strong>
                    <small>Ghi lại {slot.label.toLowerCase()}</small>
                  </span>
                </span>
                <span className="meal-kcal">—</span>
                <span className="row-actions">
                  <Plus size={17} />
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
export default function Dashboard(props: ViewProps) {
  const { data, go, openMeal, chat } = props,
    p = data.profile!;
  const completed = data.progress.filter((x) => x.kind === "plan").length;
  return (
    <>
      <PageTitle
        title={"Chào " + p.name + "!"}
        description={new Intl.DateTimeFormat("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Asia/Saigon",
        }).format(new Date())}
        action={
          <button className="btn primary scan-cta" onClick={() => openMeal()}>
            <Camera size={22} />
            <span>
              Quét món AI<small>Chụp món ăn để ghi nhanh</small>
            </span>
          </button>
        }
      />
      <p className="welcome-note">
        Hôm nay cũng là một ngày tuyệt vời để chăm sóc bản thân.
      </p>
      <Totals data={data} />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel">
            <div className="section-head">
              <h2>Năng lượng 7 ngày qua</h2>
              <button className="text-btn" onClick={() => go("stats")}>
                Xem thống kê <ArrowUpRight size={15} />
              </button>
            </div>
            <p className="muted small-text">
              Mục tiêu tham khảo: {n(p.calorieTarget)} kcal/ngày
            </p>
            <WeeklyChart data={data} />
          </section>
          <section className="panel diary-panel">
            <div className="section-head">
              <h2>Nhật ký ăn uống hôm nay</h2>
              <button className="btn soft compact" onClick={() => openMeal()}>
                <Plus size={16} />
                Thêm nhanh
              </button>
            </div>
            <MealJournal {...props} date={today()} />
          </section>
        </div>
        <aside className="dashboard-side">
          <WaterCard {...props} />
          <section className="panel roadmap-card">
            <div className="section-head">
              <h2>Lộ trình 30 ngày</h2>
              <button
                className="text-btn"
                onClick={() => go("plan")}
                aria-label="Xem lộ trình"
              >
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="roadmap-visual">
              <Leaf size={74} />
              <span className="roadmap-path" />
            </div>
            <h3>Xây dựng thói quen ăn uống cân bằng</h3>
            <p>
              Những thay đổi nhỏ tạo nên một phiên bản khỏe mạnh hơn của bạn.
            </p>
            <div className="section-head">
              <span>{completed} / 30 ngày hoàn thành</span>
              <strong>{Math.round((completed / 30) * 100)}%</strong>
            </div>
            <Meter value={completed} target={30} />
            <button className="text-btn" onClick={() => go("plan")}>
              Khám phá hôm nay <ArrowUpRight size={16} />
            </button>
          </section>
          <section className="panel assistant-card">
            <h2>
              <MessageCircle size={21} />
              Hỏi NuTri AI
            </h2>
            <p>
              Đặt câu hỏi về dinh dưỡng, món ăn hay thói quen hằng ngày của bạn.
            </p>
            <button className="chat-entry" onClick={chat}>
              <span>Bạn đang quan tâm điều gì?</span>
              <ArrowUpRight size={18} />
            </button>
            <div className="suggestion-chips">
              <button onClick={chat}>Bữa phụ lành mạnh</button>
              <button onClick={chat}>Ăn đủ chất mỗi ngày</button>
            </div>
          </section>
          <button className="explore-banner" onClick={() => go("science")}>
            <span>
              <strong>Một chút tò mò mỗi ngày</strong>
              <small>33 thí nghiệm từ gian bếp</small>
            </span>
            <Leaf size={27} />
          </button>
        </aside>
      </div>
    </>
  );
}
export function Diary(props: ViewProps) {
  const [date, setDate] = useState(today());
  return (
    <>
      <PageTitle
        title="Nhật ký dinh dưỡng"
        description="Từng bữa ăn, từng thói quen nhỏ."
        action={
          <button
            className="btn primary"
            onClick={() => props.openMeal({ date })}
          >
            <Plus size={18} />
            Thêm bữa ăn
          </button>
        }
      />
      <div className="toolbar">
        <label className="inline-field">
          <CalendarDays size={18} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button className="btn" onClick={() => setDate(today())}>
          Hôm nay
        </button>
        <button className="text-btn" onClick={() => props.go("stats")}>
          Xem thống kê <TrendingUp size={16} />
        </button>
      </div>
      <Totals data={props.data} date={date} />
      <section className="panel">
        <MealJournal {...props} date={date} />
      </section>
    </>
  );
}
export function Statistics(props: ViewProps) {
  const [mode, setMode] = useState("week"),
    [date, setDate] = useState(today()),
    data = props.data;
  return (
    <>
      <PageTitle
        title="Nhìn lại hành trình"
        description="Dữ liệu từ những bữa ăn bạn đã ghi nhận."
      />
      <div className="toolbar">
        <div className="tabs">
          <button
            className={mode === "week" ? "active" : ""}
            onClick={() => setMode("week")}
          >
            7 ngày gần nhất
          </button>
          <button
            className={mode === "day" ? "active" : ""}
            onClick={() => setMode("day")}
          >
            Theo bữa trong ngày
          </button>
        </div>
        <input
          aria-label="Ngày thống kê"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <Totals data={data} date={date} />
      <div className="split">
        <section className="panel">
          <h2>
            {mode === "week" ? "Năng lượng trong tuần" : "Năng lượng theo bữa"}
          </h2>
          <WeeklyChart data={data} end={date} mode={mode} />
        </section>
        <section className="panel">
          <h2>Nước uống 7 ngày</h2>
          <div className="water-history">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(date + "T12:00:00Z");
              d.setUTCDate(d.getUTCDate() - (6 - i));
              const key = d.toISOString().slice(0, 10),
                ml = data.water.find((w) => w.date === key)?.ml ?? 0;
              return (
                <div key={key}>
                  <span>
                    {d.getUTCDate()}/{d.getUTCMonth() + 1}
                  </span>
                  <Meter value={ml} target={data.profile!.waterTarget} />
                  <strong>{n(ml)} ml</strong>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <section className="panel">
        <h2>Theo dõi cân nặng</h2>
        {data.weights.length ? (
          <div className="weight-history">
            {data.weights.map((w) => (
              <div key={w.id}>
                <span>{w.date}</span>
                <strong>{w.kg} kg</strong>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Chưa có lần ghi nhận nào">
            Cập nhật cân nặng trong Hồ sơ khi bạn muốn theo dõi thay đổi.
          </Empty>
        )}
      </section>
    </>
  );
}
