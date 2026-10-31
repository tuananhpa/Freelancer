-- Add subject on flashcard/vocab decks for enrollment-based access control
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
