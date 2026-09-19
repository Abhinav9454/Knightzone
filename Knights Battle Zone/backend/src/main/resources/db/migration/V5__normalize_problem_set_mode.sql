-- Ensure coding problem-set contests are always marked as practice mode.
-- This prevents contest timer rules from being applied on problem-set runs/submits.
UPDATE contests
SET mode = 'PROBLEM_SET'
WHERE UPPER(TRIM(title)) = 'CODING CORE PROBLEM SET (100)'
  AND (mode IS NULL OR UPPER(TRIM(mode)) <> 'PROBLEM_SET');
