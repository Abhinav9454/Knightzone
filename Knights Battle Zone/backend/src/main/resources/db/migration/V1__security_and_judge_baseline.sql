-- Baseline hardening migration:
-- 1) ensure judge tables exist for validate-mode startup
-- 2) enforce quiz attempt uniqueness at DB layer

CREATE TABLE IF NOT EXISTS judge_submissions (
    id VARCHAR(255) NOT NULL,
    language VARCHAR(255) NULL,
    problem_id BIGINT NULL,
    code LONGTEXT NULL,
    status VARCHAR(255) NULL,
    exit_code INT NULL,
    stdout LONGTEXT NULL,
    stderr LONGTEXT NULL,
    details LONGTEXT NULL,
    runtime_seconds DOUBLE NULL,
    peak_memory_bytes BIGINT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS testcases (
    id BIGINT NOT NULL AUTO_INCREMENT,
    problem_id VARCHAR(255) NULL,
    input_data LONGTEXT NULL,
    expected_output LONGTEXT NULL,
    hidden BIT(1) NOT NULL DEFAULT b'0',
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS plagiarism_reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    problem_id BIGINT NULL,
    submission_a VARCHAR(255) NULL,
    submission_b VARCHAR(255) NULL,
    similarity DOUBLE NOT NULL DEFAULT 0,
    flagged BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME(6) NULL,
    PRIMARY KEY (id)
);

SET @idx_submission_problem_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'judge_submissions'
      AND index_name = 'idx_judge_submissions_problem_id'
);
SET @ddl_submission_problem := IF(
    @idx_submission_problem_exists = 0,
    'CREATE INDEX idx_judge_submissions_problem_id ON judge_submissions(problem_id)',
    'SELECT 1'
);
PREPARE stmt_submission_problem FROM @ddl_submission_problem;
EXECUTE stmt_submission_problem;
DEALLOCATE PREPARE stmt_submission_problem;

SET @idx_testcases_problem_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'testcases'
      AND index_name = 'idx_testcases_problem_id'
);
SET @ddl_testcases_problem := IF(
    @idx_testcases_problem_exists = 0,
    'CREATE INDEX idx_testcases_problem_id ON testcases(problem_id)',
    'SELECT 1'
);
PREPARE stmt_testcases_problem FROM @ddl_testcases_problem;
EXECUTE stmt_testcases_problem;
DEALLOCATE PREPARE stmt_testcases_problem;

SET @quiz_attempt_table_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'quiz_attempts'
);
SET @quiz_attempt_unique_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'quiz_attempts'
      AND index_name = 'uk_quiz_attempt_user_quiz'
);
SET @ddl_quiz_attempt_unique := IF(
    @quiz_attempt_table_exists = 1 AND @quiz_attempt_unique_exists = 0,
    'ALTER TABLE quiz_attempts ADD CONSTRAINT uk_quiz_attempt_user_quiz UNIQUE (user_id, quiz_id)',
    'SELECT 1'
);
PREPARE stmt_quiz_attempt_unique FROM @ddl_quiz_attempt_unique;
EXECUTE stmt_quiz_attempt_unique;
DEALLOCATE PREPARE stmt_quiz_attempt_unique;
