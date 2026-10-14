import { useState } from "react";
import {
  Search,
  FlaskConical,
  ChefHat,
  Beaker,
  Sparkles,
  Clock,
  Check,
  Plus,
  Camera,
  Trophy,
  Upload,
  ArrowRight,
  Globe,
  BookOpen,
} from "lucide-react";
import { PageTitle, Modal, FoodArt, Note, Busy, Empty } from "./components";
import { api, uploadImage } from "./api";
import {
  recipes,
  experiments,
  cosmetics,
  phSamples,
  molecules,
} from "./catalog";
import type { Recipe, Experiment } from "./types";
import type { ViewProps } from "./view-types";
export function RecipeDetail({
  recipe,
  onClose,
  onLog,
  onChallenge,
}: {
  recipe: Recipe;
  onClose: () => void;
  onLog: (r: Recipe) => void;
  onChallenge?: (r: Recipe) => void;
}) {
  const [variant, setVariant] = useState(false);
  return (
    <Modal title={recipe.title} onClose={onClose} wide>
      <div className="recipe-detail-top">
        <FoodArt recipe={recipe} />
        <div>
          <span className="pill">{recipe.category}</span>
          <p>
            <Clock size={15} />
            {recipe.minutes} phút · 1 khẩu phần
          </p>
          <strong>{recipe.kcal} kcal</strong>
          <p>
            Đạm {recipe.protein}g · Tinh bột {recipe.carbs}g · Chất béo{" "}
            {recipe.fat}g
          </p>
        </div>
      </div>
      <Note>
        {recipe.note} Dị nguyên: {recipe.allergens}.
      </Note>
      {["Việt Nam", "Nhật Bản", "Italia"].includes(recipe.category) && (
        <div className="tabs">
          <button
            className={!variant ? "active" : ""}
            onClick={() => setVariant(false)}
          >
            Công thức tham khảo
          </button>
          <button
            className={variant ? "active" : ""}
            onClick={() => setVariant(true)}
          >
            Điều chỉnh Việt hóa
          </button>
        </div>
      )}
      {variant && <Note>{recipe.localized}</Note>}
      <div className="split">
        <section>
          <h3>Nguyên liệu</h3>
          <ul className="check-list">
            {recipe.ingredients.map((x) => (
              <li key={x}>
                <Check size={15} />
                {x}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Cách thực hiện</h3>
          <ol className="steps">
            {recipe.steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </section>
      </div>
      <div className="actions">
        <button className="btn primary" onClick={() => onLog(recipe)}>
          <Plus size={17} />
          Ghi vào nhật ký
        </button>
        {onChallenge && (
          <button className="btn" onClick={() => onChallenge(recipe)}>
            <Camera size={17} />
            Nộp thành tích
          </button>
        )}
      </div>
    </Modal>
  );
}
export function Challenge({
  recipe,
  onClose,
  ...props
}: { recipe: Recipe; onClose: () => void } & ViewProps) {
  const [imageId, setImage] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(f: File) {
    setBusy(true);
    try {
      setImage(await uploadImage(f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const r = await api("/progress", "POST", {
        kind: "challenge",
        itemId: recipe.id,
        imageId,
        note,
      });
      await props.refresh();
      props.notify(
        r.awarded
          ? "Đã ghi thành tích, +30 XP!"
          : "Thành tích món này đã được ghi trước đó.",
      );
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={"Thành tích · " + recipe.title} onClose={onClose}>
      <Note>
        Đây là nhật ký tự ghi nhận, không phải AI thẩm định an toàn hoặc chất
        lượng món ăn. Mỗi món nhận XP một lần.
      </Note>
      {imageId && (
        <img
          className="challenge-image"
          src={"/api/media/" + imageId}
          alt="Món ăn bạn thực hiện"
        />
      )}
      <label className="file-label">
        <Upload size={18} />
        Thêm ảnh thành phẩm (tùy chọn)
        <input
          disabled={busy}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files?.[0]) upload(e.target.files[0]);
          }}
        />
      </label>
      <label>
        Bạn đã học được gì?
        <textarea
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Một điều thú vị từ lần nấu này…"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary full" disabled={busy} onClick={submit}>
        {busy ? (
          <Busy />
        ) : (
          <>
            <Trophy size={18} />
            Ghi nhận thành tích
          </>
        )}
      </button>
    </Modal>
  );
}
export function Simulations() {
  const [ph, setPh] = useState(0),
    [temp, setTemp] = useState(40),
    [stir, setStir] = useState(1),
    [grain, setGrain] = useState(1),
    [mol, setMol] = useState(0);
  const speed = (temp / 20) * (1 + stir * 0.7) * [0.5, 1, 2][grain],
    sample = phSamples[ph],
    m = molecules[mol];
  return (
    <div className="simulations">
      <section className="panel sim-ph">
        <div className="section-head">
          <h2>Chỉ thị pH bắp cải tím</h2>
          <Beaker size={23} />
        </div>
        <p>Chọn môi trường và quan sát màu chỉ thị.</p>
        <div className="ph-layout">
          <div className="ph-choices">
            {phSamples.map((s, i) => (
              <button
                key={s.name}
                className={ph === i ? "selected" : ""}
                onClick={() => setPh(i)}
              >
                <span>{s.name}</span>
                <small>pH ≈ {s.ph}</small>
              </button>
            ))}
          </div>
          <div className="beaker">
            <div style={{ background: sample.color }} />
            <span>100 ml</span>
          </div>
        </div>
        <div className="ph-scale">
          {phSamples.map((s, i) => (
            <span key={i} style={{ background: s.color }} />
          ))}
        </div>
        <Note>
          Màu và pH mang tính mô phỏng, thay đổi theo nồng độ và nguyên liệu.
          Không trộn hoặc nếm hóa chất gia dụng.
        </Note>
      </section>
      <section className="panel">
        <h2>Khám phá tốc độ hòa tan</h2>
        <label>
          Nhiệt độ nước: <strong>{temp}°C</strong>
          <input
            type="range"
            min="10"
            max="80"
            value={temp}
            onChange={(e) => setTemp(+e.target.value)}
          />
        </label>
        <label>
          Mức khuấy:{" "}
          <strong>{["Không khuấy", "Chậm", "Vừa", "Nhanh"][stir]}</strong>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={stir}
            onChange={(e) => setStir(+e.target.value)}
          />
        </label>
        <div className="chips">
          {["Đường cục", "Đường cát", "Đường mịn"].map((g, i) => (
            <button
              className={grain === i ? "selected" : ""}
              key={g}
              onClick={() => setGrain(i)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="simulation-result">
          <span>
            Chỉ số tốc độ tương đối<strong>{speed.toFixed(1)}</strong>
          </span>
          <span>
            Thời gian minh họa<strong>{Math.round(100 / speed)} giây</strong>
          </span>
        </div>
        <p className="muted small-text">
          Mô hình học tập đơn giản, không phải số đo thực nghiệm. Nhiệt độ,
          khuấy và diện tích bề mặt ảnh hưởng tốc độ hòa tan.
        </p>
      </section>
      <section className="panel molecule-panel">
        <h2>Hành trình của chất dinh dưỡng</h2>
        <div className="chips">
          {molecules.map((m, i) => (
            <button
              key={m.name}
              className={mol === i ? "selected" : ""}
              onClick={() => setMol(i)}
            >
              {m.name}
            </button>
          ))}
        </div>
        <div className="molecule-grid">
          <article>
            <span className="pill">Cấu trúc</span>
            <h3>{m.name}</h3>
            <p>{m.structure}</p>
          </article>
          <article>
            <span className="pill">Tiêu hóa</span>
            <p>{m.digestion}</p>
          </article>
          <article>
            <span className="pill">Vai trò</span>
            <p>{m.role}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
export default function Explore(props: ViewProps) {
  const [tab, setTab] = useState("experiments"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Tất cả"),
    [recipe, setRecipe] = useState<Recipe | null>(null),
    [exp, setExp] = useState<Experiment | null>(null),
    [cosmetic, setCosmetic] = useState<(typeof cosmetics)[number] | null>(null),
    [busy, setBusy] = useState(false);
  const filter = (s: string) =>
    s
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(
        query
          .toLocaleLowerCase("vi")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      );
  async function complete() {
    if (!exp) return;
    setBusy(true);
    try {
      const r = await api("/progress", "POST", {
        kind: "experiment",
        itemId: exp.id,
      });
      await props.refresh();
      props.notify(
        r.awarded
          ? "Đã ghi nhận khám phá, +15 XP!"
          : "Bạn đã hoàn thành khám phá này.",
      );
      setExp(null);
    } catch (e) {
      props.notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const list =
    tab === "experiments"
      ? experiments.filter((e) => filter(e.title))
      : recipes.filter(
          (r) =>
            ["Ăn nhẹ", "Đồ uống"].includes(r.category) &&
            filter(r.title) &&
            (category === "Tất cả" || category === r.category),
        );
  return (
    <>
      <PageTitle
        title="Tò mò một chút, khám phá thật nhiều"
        description="Khoa học và những điều thú vị ngay trong gian bếp."
      />
      <div className="discovery-hero">
        <FlaskConical size={58} />
        <div>
          <span className="pill">Không gian khám phá</span>
          <h2>Hiểu món ăn theo một cách mới</h2>
          <p>
            Thử, quan sát, đặt câu hỏi. Luôn có người lớn đồng hành khi thực
            hành.
          </p>
        </div>
        <div className="hero-orbits" />
      </div>
      <div className="tabs explore-tabs">
        {[
          ["experiments", "Thí nghiệm", FlaskConical],
          ["recipes", "Món lành mạnh", ChefHat],
          ["cosmetics", "Chăm sóc cá nhân", Sparkles],
          ["tools", "Công cụ ảo", Beaker],
        ].map(([id, label, Icon]) => {
          const I = Icon as typeof FlaskConical;
          return (
            <button
              key={String(id)}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(String(id));
                setQuery("");
              }}
            >
              <I size={17} />
              {String(label)}
            </button>
          );
        })}
      </div>
      {tab === "tools" ? (
        <Simulations />
      ) : (
        <>
          <div className="toolbar">
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Tìm kiếm nội dung"
                placeholder="Bạn muốn khám phá điều gì?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {tab === "recipes" && (
              <div className="chips">
                {["Tất cả", "Ăn nhẹ", "Đồ uống"].map((c) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <span className="muted small-text">
              {tab === "experiments"
                ? list.length + " thí nghiệm"
                : tab === "recipes"
                  ? list.length + " công thức"
                  : "4 hướng dẫn"}
            </span>
          </div>
          <div className="content-grid">
            {tab === "experiments"
              ? (list as Experiment[]).map((e, i) => (
                  <button
                    className="content-card experiment-card"
                    key={e.id}
                    onClick={() => setExp(e)}
                  >
                    <div className={"experiment-art art-" + (i % 5)}>
                      <FlaskConical size={48} />
                      <span className="experiment-bubble" />
                      <span className="experiment-bubble second" />
                    </div>
                    <div className="content-body">
                      <span className="pill">
                        Từ {e.age} tuổi · Có người lớn hướng dẫn
                      </span>
                      <h3>{e.title}</h3>
                      <p>{e.science}</p>
                      <span className="card-link">
                        Xem cách thực hiện <ArrowRight size={16} />
                      </span>
                      {props.data.progress.some(
                        (p) => p.kind === "experiment" && p.item_id === e.id,
                      ) && (
                        <span className="completed-label">
                          <Check size={15} />
                          Đã khám phá
                        </span>
                      )}
                    </div>
                  </button>
                ))
              : tab === "recipes"
                ? (list as Recipe[]).map((r) => (
                    <button
                      className="content-card"
                      key={r.id}
                      onClick={() => setRecipe(r)}
                    >
                      <FoodArt recipe={r} />
                      <div className="content-body">
                        <span className="pill">{r.category}</span>
                        <h3>{r.title}</h3>
                        <p>
                          {r.minutes} phút · khoảng {r.kcal} kcal
                        </p>
                        <span className="card-link">
                          Xem công thức <ArrowRight size={16} />
                        </span>
                      </div>
                    </button>
                  ))
                : cosmetics
                    .filter((c) => filter(c.title))
                    .map((c) => (
                      <button
                        className="content-card cosmetic-card"
                        key={c.id}
                        onClick={() => setCosmetic(c)}
                      >
                        <div className="cosmetic-art">
                          <Sparkles size={50} />
                        </div>
                        <div className="content-body">
                          <span className="pill">{c.area}</span>
                          <h3>{c.title}</h3>
                          <p>{c.note}</p>
                          <span className="card-link">
                            Xem hướng dẫn <ArrowRight size={16} />
                          </span>
                        </div>
                      </button>
                    ))}
          </div>
          {list.length === 0 && tab !== "cosmetics" && (
            <Empty title="Chưa tìm thấy nội dung">
              Thử từ khóa ngắn hơn nhé.
            </Empty>
          )}
        </>
      )}
      {exp && (
        <Modal title={exp.title} onClose={() => setExp(null)} wide>
          <Note tone="warning">{exp.safety}</Note>
          <div className="split">
            <section>
              <h3>Chuẩn bị</h3>
              <ul>
                {exp.materials.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Thực hiện</h3>
              <ol className="steps">
                {exp.steps.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </section>
          </div>
          <div className="science-explanation">
            <h3>Điều gì đang xảy ra?</h3>
            <p>{exp.science}</p>
            <p className="muted small-text">
              Ghi lại quan sát, thử so sánh với mẫu đối chứng. Nội dung giáo
              dục, không dùng làm kiểm nghiệm an toàn thực phẩm.
            </p>
          </div>
          <button className="btn primary" disabled={busy} onClick={complete}>
            {busy ? (
              <Busy />
            ) : (
              <>
                <Check size={17} />
                Đã khám phá
              </>
            )}
          </button>
        </Modal>
      )}
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
      {cosmetic && (
        <Modal title={cosmetic.title} onClose={() => setCosmetic(null)}>
          <Note tone="warning">{cosmetic.note}</Note>
          <h3>Chuẩn bị</h3>
          <ul>
            {cosmetic.ingredients.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3>Các bước</h3>
          <ol className="steps">
            {cosmetic.steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <p className="muted">
            Nếu có bệnh da hoặc từng dị ứng, hãy hỏi chuyên gia trước khi thử
            sản phẩm mới.
          </p>
        </Modal>
      )}
    </>
  );
}
export function WorldCuisine(props: ViewProps) {
  const [country, setCountry] = useState("Việt Nam"),
    [recipe, setRecipe] = useState<Recipe | null>(null),
    [challenge, setChallenge] = useState<Recipe | null>(null);
  const list = recipes.filter((r) => r.category === country);
  return (
    <>
      <PageTitle
        title="Một căn bếp, nhiều hành trình"
        description="Khám phá món ăn Việt Nam, Nhật Bản và Italia."
      />
      <div className="world-hero">
        <Globe size={58} />
        <div>
          <span className="pill">Ẩm thực thế giới</span>
          <h2>
            Nấu một món mới.
            <br />
            Học thêm một điều hay.
          </h2>
          <p>Thử công thức, ghi lại thành quả và nhận huy hiệu đầu bếp.</p>
        </div>
      </div>
      <div className="tabs">
        {["Việt Nam", "Nhật Bản", "Italia"].map((c) => (
          <button
            key={c}
            className={country === c ? "active" : ""}
            onClick={() => setCountry(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="content-grid">
        {list.map((r) => {
          const done = props.data.progress.some(
            (p) => p.kind === "challenge" && p.item_id === r.id,
          );
          return (
            <article className="content-card" key={r.id}>
              <FoodArt recipe={r} />
              <div className="content-body">
                <span className="pill">{r.minutes} phút</span>
                <h3>{r.title}</h3>
                <p>{r.ingredients.slice(0, 3).join(", ")}</p>
                <div className="actions">
                  <button className="btn" onClick={() => setRecipe(r)}>
                    Xem công thức
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={"Nộp thành tích " + r.title}
                    onClick={() => setChallenge(r)}
                  >
                    <Trophy size={20} />
                  </button>
                </div>
                {done && (
                  <span className="completed-label">
                    <Check size={15} />
                    Đã ghi nhận thành tích
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <Note>
        Mỗi món hoàn thành nhận 30 XP một lần. Thành tích do bạn tự ghi nhận,
        ảnh minh chứng là tùy chọn.
      </Note>
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
          onChallenge={(r) => {
            setRecipe(null);
            setChallenge(r);
          }}
        />
      )}
      {challenge && (
        <Challenge
          {...props}
          recipe={challenge}
          onClose={() => setChallenge(null)}
        />
      )}
    </>
  );
}
