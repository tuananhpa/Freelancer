ALTER TABLE flashcard_decks ADD COLUMN deck_type VARCHAR(20) DEFAULT 'FLASHCARD';
UPDATE flashcard_decks SET deck_type = 'FLASHCARD' WHERE deck_type IS NULL;
