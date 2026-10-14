import * as raw from "../shared/catalog.mjs";
import type { Recipe, Experiment } from "./types";
export const recipes = raw.recipes as unknown as Recipe[];
export const experiments = raw.experiments as unknown as Experiment[];
export const cosmetics = raw.cosmetics as unknown as {
  id: string;
  title: string;
  area: string;
  ingredients: string[];
  steps: string[];
  note: string;
}[];
export const slots = raw.slots as { id: string; label: string; time: string }[];
export const goals = raw.goals as string[];
export const avatars = raw.avatars as string[];
export const questionGroups = raw.questionGroups as Record<string, string[]>;
export const molecules = raw.molecules as {
  name: string;
  structure: string;
  digestion: string;
  role: string;
}[];
export const phSamples = raw.phSamples as {
  name: string;
  ph: number;
  color: string;
}[];
