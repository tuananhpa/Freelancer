export type Profile = {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  avatar: string;
  goal: string;
  conditions: string;
  allergies: string;
  mobility: string;
  habits: string;
  calorieTarget: number;
  waterTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  theme: string;
  analysis?: {
    summary: string;
    habits: string[];
    nutrition: string[];
    movement: string[];
    cautions: string[];
  };
};
export type Meal = {
  id?: string;
  name: string;
  slot: string;
  date: string;
  time: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  imageId: string;
  source?: string;
};
export type Recipe = {
  id: string;
  title: string;
  category: string;
  minutes: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
  allergens: string;
  art: string;
  portion: string;
  note: string;
  localized: string;
};
export type Experiment = {
  id: string;
  title: string;
  age: number;
  minutes: number;
  materials: string[];
  steps: string[];
  science: string;
  safety: string;
};
export type PlanDay = {
  day: number;
  meals: {
    slot: string;
    recipeId?: string;
    name?: string;
    description?: string;
  }[];
  exercises: { name: string; minutes: number; description: string }[];
};
export type AppState = {
  user: { id: string; username: string; role: string };
  profile: Profile | null;
  meals: Meal[];
  water: { date: string; ml: number }[];
  weights: { id: string; date: string; kg: number }[];
  progress: {
    kind: string;
    item_id: string;
    data: { imageId?: string; note?: string };
  }[];
  rewards: { xp: number; streak: number; last_day: string | null };
  settings: {
    sound: boolean;
    pushEnabled: boolean;
    autoBackup: boolean;
    disabled: string[];
  };
  plan: { source: string; note: string; days: PlanDay[] };
  aiConfigured: boolean;
  backup: { id: string; created_at: string } | null;
  date: string;
  pushConfigured: boolean;
  pushPublicKey: string | null;
};
export const defaultProfile: Profile = {
  name: "",
  age: 14,
  height: 155,
  weight: 46,
  gender: "other",
  avatar: "🥑",
  goal: "Xây dựng thói quen ăn uống cân bằng",
  conditions: "",
  allergies: "",
  mobility: "",
  habits: "",
  calorieTarget: 2000,
  waterTarget: 2000,
  proteinTarget: 75,
  carbsTarget: 250,
  fatTarget: 65,
  theme: "balance",
};
