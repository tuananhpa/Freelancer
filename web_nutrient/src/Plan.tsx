import { useState } from "react";
import {
  Sparkles,
  Check,
  ArrowRight,
  Clock,
  Dumbbell,
  RefreshCw,
} from "lucide-react";
import { PageTitle, Note, Busy, FoodArt, Meter } from "./components";
import { api } from "./api";
import { recipes, slots } from "./catalog";
import { RecipeDetail } from "./Explore";
import type { Recipe } from "./types";
import type { ViewProps } from "./view-types";
export default function Plan(props: ViewProps) {
  const { data } = props;
  const [day, setDay] = useState(1),
    [busy, setBusy] = useState(false),
    [recipe, setRecipe] = useState<Recipe | null>(null);
  const plan = data.plan.days.find((d) => d.day === day)!,
    done = data.progress.some(
      (p) => p.kind === "plan" && p.item_id === String(day),
    ),
    count = data.progress.filter((p) => p.kind === "plan").length;
  async function complete() {
    setBusy(true);
    try {
      const r = await api("/progress", "POST", {
        kind: "plan",
        itemId: String(day),
      });
      await props.refresh();
      props.notify(
        r.awarded
          ? "Hoàn thành một ngày, +15 XP!"
          : "Ngày này đã được ghi nhận.",
      );
    } catch (e) {
      props.notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    try {
      await api("/ai/plan", "POST", {});
      await props.refresh();
      props.notify("Đã cập nhật lộ trình cá nhân hóa.");
    } catch (e) {
      props.notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="30 ngày cùng NuTri"
        description="Một lộ trình nhỏ, những thay đổi bền vững."
        action={
          <button
            className="btn primary"
            disabled={busy || !data.aiConfigured}
            onClick={generate}
          >
            {busy ? (
              <Busy />
            ) : (
              <>
                <Sparkles size={18} />
                Cá nhân hóa bằng AI
              </>
            )}
          </button>
        }
      />
      <Note>
        {data.plan.note}{" "}
        {data.plan.source === "library" && !data.aiConfigured
          ? "Gemini chưa cấu hình; hiện dùng gợi ý từ thư viện."
          : ""}
      </Note>
      {data.profile?.analysis && (
        <section className="panel analysis-panel">
          <h2>Gợi ý từ hồ sơ của bạn</h2>
          <p>{data.profile.analysis.summary}</p>
          <div className="split">
            <ul>
              {data.profile.analysis.nutrition.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <ul>
              {data.profile.analysis.movement.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <div className="plan-summary">
        <div>
          <strong>{count}</strong>
          <span> / 30 ngày hoàn thành</span>
        </div>
        <Meter value={count} target={30} />
      </div>
      <div className="day-picker" aria-label="Chọn ngày lộ trình">
        {data.plan.days.map((d) => (
          <button
            key={d.day}
            className={day === d.day ? "active" : ""}
            onClick={() => setDay(d.day)}
          >
            <small>Ngày</small>
            <strong>{d.day}</strong>
            {data.progress.some(
              (p) => p.kind === "plan" && p.item_id === String(d.day),
            ) && <Check size={13} />}
          </button>
        ))}
      </div>
      <div className="section-head">
        <h2>Thực đơn ngày {day}</h2>
        <button
          className={"btn " + (done ? "soft" : "primary")}
          disabled={busy || done}
          onClick={complete}
        >
          <Check size={18} />
          {done ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
        </button>
      </div>
      <div className="plan-meals">
        {slots.map((s) => {
          const m = plan.meals.find((x) => x.slot === s.id),
            r = recipes.find((r) => r.id === m?.recipeId);
          return (
            <article className="panel plan-meal" key={s.id}>
              <span className="pill">{s.label}</span>
              {r && <FoodArt recipe={r} />}
              <h3>{r?.title ?? m?.name ?? "Chưa có gợi ý"}</h3>
              <p>
                {r
                  ? "Khoảng " + r.kcal + " kcal · " + r.minutes + " phút"
                  : m?.description}
              </p>
              {r ? (
                <button className="text-btn" onClick={() => setRecipe(r)}>
                  Xem công thức <ArrowRight size={16} />
                </button>
              ) : (
                m && (
                  <button
                    className="text-btn"
                    onClick={() =>
                      props.openMeal({ name: m.name, slot: s.id, time: s.time })
                    }
                  >
                    Ghi vào nhật ký <ArrowRight size={16} />
                  </button>
                )
              )}
            </article>
          );
        })}
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>
            <Dumbbell size={21} />
            Vận động nhẹ trong ngày
          </h2>
        </div>
        {data.profile?.mobility && (
          <Note tone="warning">
            Lưu ý vận động: {data.profile.mobility}. Các bài từ thư viện chưa
            được cá nhân hóa; hãy điều chỉnh theo hướng dẫn chuyên môn.
          </Note>
        )}
        <div className="split">
          {plan.exercises.map((e, i) => (
            <article className="exercise" key={i}>
              <span className="exercise-number">{i + 1}</span>
              <div>
                <h3>{e.name}</h3>
                <span className="pill">
                  <Clock size={13} />
                  {e.minutes} phút
                </span>
                <p>{e.description}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="muted small-text">
          Ưu tiên sự thoải mái. Dừng khi đau, chóng mặt hoặc khó thở; hỏi chuyên
          gia nếu có giới hạn vận động.
        </p>
      </section>
      {recipe && (
        <RecipeDetail
          recipe={recipe}
          onClose={() => setRecipe(null)}
          onLog={(r) => {
            setRecipe(null);
            props.openMeal({
              name: r.title,
              kcal: r.kcal,
              protein: r.protein,
              carbs: r.carbs,
              fat: r.fat,
              portion: r.portion,
            });
          }}
        />
      )}
    </>
  );
}
