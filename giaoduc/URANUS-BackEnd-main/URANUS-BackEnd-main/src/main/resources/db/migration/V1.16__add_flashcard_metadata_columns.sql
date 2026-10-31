-- Add vocabulary/metadata columns expected by Flashcard entity
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS word_type VARCHAR(255);
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS definition_en TEXT;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS definition_vi TEXT;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS example TEXT;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS phonetic VARCHAR(255);
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS example_translation TEXT;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
