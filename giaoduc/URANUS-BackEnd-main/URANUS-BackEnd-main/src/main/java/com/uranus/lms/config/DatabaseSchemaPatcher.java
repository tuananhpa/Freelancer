package com.uranus.lms.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures flashcard media columns can store base64 image data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaPatcher implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        alterColumnToText("flashcards", "image_url");
        alterColumnToText("flashcards", "audio_url");
    }

    private void alterColumnToText(String table, String column) {
        try {
            jdbcTemplate.execute(
                String.format("ALTER TABLE %s ALTER COLUMN %s TYPE TEXT", table, column)
            );
            log.info("Patched column {}.{} to TEXT", table, column);
        } catch (Exception ex) {
            log.debug("Column {}.{} patch skipped: {}", table, column, ex.getMessage());
        }
    }
}
