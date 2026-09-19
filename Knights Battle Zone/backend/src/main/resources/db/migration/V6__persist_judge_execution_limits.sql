-- Persist per-submission execution constraints so async judge respects
-- backend-provided limits instead of falling back to service defaults.

SET @judge_has_time_limit_seconds := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'judge_submissions'
      AND column_name = 'time_limit_seconds'
);
SET @judge_add_time_limit_seconds := IF(
    @judge_has_time_limit_seconds = 0,
    'ALTER TABLE judge_submissions ADD COLUMN time_limit_seconds INT NULL',
    'SELECT 1'
);
PREPARE stmt_add_time_limit_seconds FROM @judge_add_time_limit_seconds;
EXECUTE stmt_add_time_limit_seconds;
DEALLOCATE PREPARE stmt_add_time_limit_seconds;

SET @judge_has_memory_mb := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'judge_submissions'
      AND column_name = 'memory_mb'
);
SET @judge_add_memory_mb := IF(
    @judge_has_memory_mb = 0,
    'ALTER TABLE judge_submissions ADD COLUMN memory_mb INT NULL',
    'SELECT 1'
);
PREPARE stmt_add_memory_mb FROM @judge_add_memory_mb;
EXECUTE stmt_add_memory_mb;
DEALLOCATE PREPARE stmt_add_memory_mb;

SET @judge_has_cpus := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'judge_submissions'
      AND column_name = 'cpus'
);
SET @judge_add_cpus := IF(
    @judge_has_cpus = 0,
    'ALTER TABLE judge_submissions ADD COLUMN cpus DOUBLE NULL',
    'SELECT 1'
);
PREPARE stmt_add_cpus FROM @judge_add_cpus;
EXECUTE stmt_add_cpus;
DEALLOCATE PREPARE stmt_add_cpus;
