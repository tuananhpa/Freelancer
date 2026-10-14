import type { AppState, Meal } from "./types";
export type ViewProps = {
  data: AppState;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  openMeal: (initial?: Partial<Meal>) => void;
  go: (page: string) => void;
  chat: () => void;
};
