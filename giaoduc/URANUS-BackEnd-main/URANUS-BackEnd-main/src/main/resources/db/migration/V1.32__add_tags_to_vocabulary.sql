-- Add tags column to flashcard_decks table for vocabulary categorization
ALTER TABLE public.flashcard_decks ADD COLUMN IF NOT EXISTS tags VARCHAR(500);
