export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Saigon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function validDate(s) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function num(value, min, max, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max)
    throw new Error(label + " không hợp lệ");
  return n;
}
export function text(value, max = 300) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}
export function validateProfile(p) {
  const name = text(p.name, 50);
  if (!name) throw new Error("Nhập biệt danh");
  return {
    name,
    gender: ["male", "female", "other"].includes(p.gender) ? p.gender : "other",
    age: num(p.age, 10, 24, "Tuổi"),
    height: num(p.height, 80, 230, "Chiều cao"),
    weight: num(p.weight, 15, 220, "Cân nặng"),
    waterTarget: num(p.waterTarget ?? 2000, 500, 5000, "Mục tiêu nước"),
    calorieTarget: num(
      p.calorieTarget ?? 2000,
      1200,
      4500,
      "Mục tiêu năng lượng",
    ),
    proteinTarget: num(p.proteinTarget ?? 75, 20, 250, "Mục tiêu đạm"),
    carbsTarget: num(p.carbsTarget ?? 250, 50, 600, "Mục tiêu tinh bột"),
    fatTarget: num(p.fatTarget ?? 65, 20, 180, "Mục tiêu chất béo"),
    conditions: text(p.conditions, 1000),
    allergies: text(p.allergies, 1000),
    mobility: text(p.mobility, 1000),
    habits: text(p.habits, 1000),
    goal: text(p.goal, 500),
    avatar: text(p.avatar ?? "🥑", 150),
    theme: ["balance", "garden", "berry"].includes(p.theme)
      ? p.theme
      : "balance",
  };
}
export function validateMeal(m) {
  if (!text(m.name, 150)) throw new Error("Nhập tên món ăn");
  if (!validDate(m.date)) throw new Error("Ngày không hợp lệ");
  if (!["breakfast", "lunch", "snack", "dinner"].includes(m.slot))
    throw new Error("Bữa ăn không hợp lệ");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time))
    throw new Error("Giờ không hợp lệ");
  return {
    name: text(m.name, 150),
    date: m.date,
    time: m.time,
    slot: m.slot,
    kcal: num(m.kcal, 0, 5000, "Năng lượng"),
    protein: num(m.protein ?? 0, 0, 500, "Đạm"),
    carbs: num(m.carbs ?? 0, 0, 1000, "Tinh bột"),
    fat: num(m.fat ?? 0, 0, 500, "Chất béo"),
    portion: text(m.portion, 150),
    imageId: text(m.imageId, 100),
    source: m.source === "ai" ? "ai" : "manual",
  };
}
export function summarize(meals, water = 0) {
  return meals.reduce(
    (a, m) => ({
      kcal: a.kcal + Number(m.kcal),
      protein: a.protein + Number(m.protein),
      carbs: a.carbs + Number(m.carbs),
      fat: a.fat + Number(m.fat),
      water,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, water },
  );
}
export function advanceStreak(previous, today, streak) {
  if (previous === today) return streak;
  return previous && Date.parse(today) - Date.parse(previous) === 86400000
    ? streak + 1
    : 1;
}
export function safeAiNutrition(data) {
  const m = validateMeal({
    ...data,
    date: dayKey(),
    time: "12:00",
    slot: "lunch",
  });
  return {
    ...m,
    note: text(data.note, 1200),
    confidence: ["low", "medium", "high"].includes(data.confidence)
      ? data.confidence
      : "low",
  };
}

export function mergeProfile(existing, incoming) {
  const p = validateProfile(incoming);
  const keys = [
    "age",
    "height",
    "weight",
    "gender",
    "goal",
    "conditions",
    "allergies",
    "mobility",
    "habits",
    "calorieTarget",
    "waterTarget",
    "proteinTarget",
    "carbsTarget",
    "fatTarget",
  ];
  if (existing?.analysis && keys.every((k) => existing[k] === p[k]))
    p.analysis = existing.analysis;
  return p;
}
