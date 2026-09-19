CREATE INDEX IF NOT EXISTS idx_contests_title_lookup ON contests (title);
CREATE INDEX IF NOT EXISTS idx_problems_contest_difficulty_id ON problems (contest_id, difficulty, id);
CREATE INDEX IF NOT EXISTS idx_problems_contest_title_lookup ON problems (contest_id, title);

