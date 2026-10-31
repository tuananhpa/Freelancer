UPDATE flashcard_decks
SET deck_type = 'VOCABULARY'
WHERE id IN (
    SELECT DISTINCT deck_id
    FROM flashcards
    WHERE word_type IS NOT NULL 
       OR definition_vi IS NOT NULL 
       OR phonetic IS NOT NULL 
       OR example IS NOT NULL
);
