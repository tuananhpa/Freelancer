-- Add image_url column to flashcard_decks table for deck cover images
ALTER TABLE public.flashcard_decks ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);
