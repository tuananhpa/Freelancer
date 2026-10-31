ALTER TABLE flashcard_decks ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE flashcard_decks ADD COLUMN rating_count INT DEFAULT 0;

CREATE TABLE deck_ratings (
    id UUID PRIMARY KEY,
    deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deck_id, student_id)
);

CREATE INDEX idx_deck_ratings_deck ON deck_ratings(deck_id);
CREATE INDEX idx_deck_ratings_student ON deck_ratings(student_id);
