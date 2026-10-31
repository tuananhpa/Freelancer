-- Favorite decks feature (legacy Hibernate DB missing this table)
CREATE TABLE IF NOT EXISTS student_favorite_decks (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id),
    deck_id UUID NOT NULL REFERENCES flashcard_decks(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_favorite_deck UNIQUE (student_id, deck_id)
);
