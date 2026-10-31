export interface Flashcard {
  id?: string;
  frontContent: string;
  backContent: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  wordType?: string | null;
  definitionEn?: string | null;
  definitionVi?: string | null;
  example?: string | null;
  phonetic?: string | null;
  exampleTranslation?: string | null;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM';
  accessCode?: string;
  folderId?: string | null;
  folderName?: string | null;
  cards?: Flashcard[];
  createdAt?: string;
  tags?: string;         // comma-separated, e.g. "IELTS,Vocabulary,Grammar"
  imageUrl?: string;     // Cover image for the deck
  deckType?: string;
  learnerCount?: number; // số học viên đã học/yêu thích
  viewsCount?: number;
  savesCount?: number;
  sharesCount?: number;
  ownerId?: string;
  ownerName?: string;
  ownerAvatar?: string;
  averageRating?: number;
  ratingCount?: number;
  myRating?: number;
  subject?: string;
  accessLevel?: 'FULL' | 'PREVIEW';
  locked?: boolean;
  previewRank?: number;
  unlockHint?: string;
}

export interface CardDraft {
  id: string;
  frontContent: string;
  backContent: string;
  imageUrl?: string | null;
}

export type TermSeparator = 'tab' | 'comma' | 'colon' | 'custom';
export type CardSeparator = 'newline' | 'semicolon' | 'custom';
