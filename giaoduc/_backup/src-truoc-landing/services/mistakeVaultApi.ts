import api from './api';

export interface MistakeVaultItem {
  id: string;
  itemType: string;
  content: string;
  correctAnswer: string;
  wrongAnswer?: string;
  skillTag?: string;
  sourceTitle?: string;
  wrongCount: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate: string;
}

export interface MistakeVaultStats {
  totalItems: number;
  dueToday: number;
  dueItems: MistakeVaultItem[];
}

export const mistakeVaultApi = {
  getVault: () => api.get<MistakeVaultStats>('/mistake-vault'),
  addVocabMistake: (data: {
    flashcardId: string;
    frontContent: string;
    backContent: string;
    sourceTitle?: string;
  }) => api.post('/mistake-vault/vocab', data),
  review: (id: string, remembered: boolean) =>
    api.post<MistakeVaultItem>(`/mistake-vault/${id}/review`, { remembered }),
};
