-- Persist async judge reference for non-blocking submission flow

-- First, ensure submissions table exists (in case JPA hasn't created it yet)
CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    problem_id BIGINT NULL,
    language VARCHAR(255) NULL,
    code LONGTEXT NULL,
    verdict VARCHAR(255) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id)
);

SET @col_submissions_judge_submission_ref_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'submissions'
      AND column_name = 'judge_submission_id'
);
SET @ddl_submissions_judge_submission_ref_col := IF(
    @col_submissions_judge_submission_ref_exists = 0,
    'ALTER TABLE submissions ADD COLUMN judge_submission_id VARCHAR(80) NULL',
    'SELECT 1'
);
PREPARE stmt_submissions_judge_submission_ref_col FROM @ddl_submissions_judge_submission_ref_col;
EXECUTE stmt_submissions_judge_submission_ref_col;
DEALLOCATE PREPARE stmt_submissions_judge_submission_ref_col;

SET @idx_submissions_judge_submission_ref_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'submissions'
      AND index_name = 'idx_submissions_judge_submission_id'
);
SET @ddl_submissions_judge_submission_ref := IF(
    @idx_submissions_judge_submission_ref_exists = 0,
    'CREATE INDEX idx_submissions_judge_submission_id ON submissions(judge_submission_id)',
    'SELECT 1'
);
PREPARE stmt_submissions_judge_submission_ref FROM @ddl_submissions_judge_submission_ref;
EXECUTE stmt_submissions_judge_submission_ref;
DEALLOCATE PREPARE stmt_submissions_judge_submission_ref;
