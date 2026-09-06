-- Run once on MySQL 8.0.16+ in the database selected by your administrator.
-- Local default: CREATE DATABASE padi_go CHARACTER SET utf8mb4;
-- Then select padi_go before running this migration.
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    study_medium ENUM('ta', 'en') NOT NULL DEFAULT 'ta',
    ui_language ENUM('ta-Latn', 'ta', 'en') NOT NULL DEFAULT 'ta-Latn',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT chk_users_name CHECK (CHAR_LENGTH(TRIM(display_name)) > 0),
    CONSTRAINT chk_users_hash CHECK (password_hash LIKE '$argon2id$%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE PROCEDURE sp_create_user (
    IN p_email VARCHAR(254),
    IN p_display_name VARCHAR(80),
    IN p_password_hash VARCHAR(255),
    IN p_study_medium VARCHAR(8),
    IN p_ui_language VARCHAR(16)
)
SQL SECURITY INVOKER
MODIFIES SQL DATA
BEGIN
    IF p_email IS NULL OR CHAR_LENGTH(TRIM(p_email)) = 0
       OR p_display_name IS NULL OR CHAR_LENGTH(TRIM(p_display_name)) = 0
       OR p_password_hash IS NULL OR p_password_hash NOT LIKE '$argon2id$%'
       OR p_study_medium IS NULL OR p_study_medium NOT IN ('ta', 'en')
       OR p_ui_language IS NULL OR p_ui_language NOT IN ('ta-Latn', 'ta', 'en') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user fields';
    END IF;

    INSERT INTO users(email, display_name, password_hash, study_medium, ui_language)
    VALUES(LOWER(TRIM(p_email)), TRIM(p_display_name), p_password_hash, p_study_medium, p_ui_language);

    SELECT id, email, display_name, study_medium, ui_language, created_at
    FROM users WHERE id = LAST_INSERT_ID();
END$$
DELIMITER ;
