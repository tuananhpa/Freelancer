import api, { PageResponse } from './api';
import { Flashcard, FlashcardDeck } from '../types/flashcard';

export const flashcardApi = {
  getPublicDecks: (page: number = 0, size: number = 10, search?: string, folderId?: string | null, deckType?: string) => api.get<PageResponse<FlashcardDeck>>(`/flashcards/public`, { params: { page, size, search: search || undefined, folderId: folderId || undefined, deckType } }),
  getMyDecks: (page: number = 0, size: number = 10, search?: string, folderId?: string | null, deckType?: string) => api.get<PageResponse<FlashcardDeck>>(`/flashcards/my-decks`, { params: { page, size, search: search || undefined, folderId: folderId || undefined, deckType } }),
  getDeckById: (id: string, accessCode?: string) => api.get<FlashcardDeck>(`/flashcards/decks/${id}`, { params: { accessCode } }),
  getDueCards: (id: string) => api.get<Flashcard[]>(`/flashcards/decks/${id}/due`),
  createDeck: (deck: {
    title: string;
    description?: string;
    visibility: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM';
    accessCode?: string;
    folderId?: string;
    tags?: string[];
    imageUrl?: string;
    deckType?: string;
    subject?: string;
    cards: Omit<Flashcard, 'id'>[];
  }) => api.post<FlashcardDeck>('/flashcards/decks', deck),
  updateDeck: (id: string, deck: {
    title: string;
    description?: string;
    visibility: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM';
    accessCode?: string;
    folderId?: string;
    tags?: string[];
    imageUrl?: string;
    deckType?: string;
    subject?: string;
    cards: Omit<Flashcard, 'id'>[];
  }) => api.put<FlashcardDeck>(`/flashcards/decks/${id}`, deck),
  deleteDeck: (id: string) => api.delete(`/flashcards/decks/${id}`),
  updateProgress: (cardId: string, isCorrect: boolean) =>
    api.put(`/flashcards/progress/${cardId}`, { isCorrect }),
  toggleFavorite: (deckId: string) =>
    api.post<{ favorited: boolean }>(`/flashcards/decks/${deckId}/favorite`),
  isFavorited: (deckId: string) =>
    api.get<{ favorited: boolean }>(`/flashcards/decks/${deckId}/favorite`),
  getFavoriteDecks: (page: number = 0, size: number = 10, search?: string, deckType?: string) =>
    api.get<PageResponse<FlashcardDeck>>(`/flashcards/favorites`, { params: { page, size, search: search || undefined, deckType } }),
  getStatistics: (id: string) => {
    return api.get(`/flashcards/decks/${id}/statistics`);
  },
  incrementViewCount: (id: string) => api.post(`/flashcards/decks/${id}/view`),
  incrementShareCount: (id: string) => api.post(`/flashcards/decks/${id}/share`),
  getSuggestedDecks: (id: string) => api.get<FlashcardDeck[]>(`/flashcards/decks/${id}/suggested`),
  rateDeck: (deckId: string, rating: number) => api.put(`/flashcards/decks/${deckId}/rating`, { rating }),
};
