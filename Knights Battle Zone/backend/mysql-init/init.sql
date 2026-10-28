-- Initialize database and user for the contest platform
CREATE DATABASE IF NOT EXISTS `Unified_database` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `judgedb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- unified_code_db is created by MYSQL_USER/MYSQL_PASSWORD in docker-compose.
GRANT ALL PRIVILEGES ON `Unified_database`.* TO 'unified_code_db'@'%';
GRANT ALL PRIVILEGES ON `judgedb`.* TO 'unified_code_db'@'%';
FLUSH PRIVILEGES;

-- Placement module scaffold tables
USE `Unified_database`;

CREATE TABLE IF NOT EXISTS placement_students (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  enrollment_no VARCHAR(128) NULL UNIQUE,
  branch VARCHAR(128) NULL,
  cgpa DECIMAL(4,2) NULL,
  passing_year INT NULL,
  resume_url VARCHAR(512) NULL,
  parsed_data_json LONGTEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_companies (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255) NULL,
  website VARCHAR(255) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_tpo (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  department VARCHAR(255) NULL,
  designation VARCHAR(255) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_jobs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  eligibility_criteria TEXT NULL,
  location VARCHAR(255) NULL,
  salary VARCHAR(255) NULL,
  posted_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS placement_applications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'APPLIED',
  applied_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  comments TEXT NULL,
  UNIQUE KEY uq_placement_application_job_student (job_id, student_id)
);

CREATE TABLE IF NOT EXISTS placement_tests (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  scheduled_date TIMESTAMP NULL,
  duration INT NULL,
  total_marks INT NULL,
  passing_marks INT NULL,
  instructions TEXT NULL
);

CREATE TABLE IF NOT EXISTS placement_questions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  test_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(512) NULL,
  option_b VARCHAR(512) NULL,
  option_c VARCHAR(512) NULL,
  option_d VARCHAR(512) NULL,
  correct_option VARCHAR(8) NULL,
  marks INT NULL
);

CREATE TABLE IF NOT EXISTS placement_notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(128) NULL,
  is_read BIT(1) NOT NULL DEFAULT b'0',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_resumes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  resume_url VARCHAR(512) NULL,
  parsed_data_json LONGTEXT NULL,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_placement_jobs_status_deadline ON placement_jobs(status, deadline);
CREATE INDEX idx_placement_applications_job ON placement_applications(job_id);
CREATE INDEX idx_placement_applications_student ON placement_applications(student_id);
CREATE INDEX idx_placement_notifications_user_read ON placement_notifications(user_id, is_read);

-- Clubs / Guilds module tables
CREATE TABLE IF NOT EXISTS clubs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(2000) NULL,
  visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC',
  owner_id BIGINT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_members (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  club_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
  muted_until TIMESTAMP NULL,
  joined_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_club_members_club FOREIGN KEY (club_id) REFERENCES clubs(id),
  CONSTRAINT uk_club_member UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_challenges (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  club_id BIGINT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(2000) NULL,
  frequency VARCHAR(16) NOT NULL DEFAULT 'WEEKLY',
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  created_by BIGINT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_club_challenges_club FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS club_challenge_attempts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  club_challenge_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  wpm DOUBLE NOT NULL,
  accuracy DOUBLE NOT NULL,
  points DOUBLE NOT NULL,
  attempted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_club_attempt_challenge FOREIGN KEY (club_challenge_id) REFERENCES club_challenges(id)
);

CREATE TABLE IF NOT EXISTS club_posts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  club_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  title VARCHAR(160) NOT NULL,
  content VARCHAR(4000) NOT NULL,
  deleted BIT(1) NOT NULL DEFAULT b'0',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_club_posts_club FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS club_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  club_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  message VARCHAR(2000) NOT NULL,
  deleted BIT(1) NOT NULL DEFAULT b'0',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_club_messages_club FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE INDEX idx_clubs_visibility ON clubs(visibility);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_challenges_club ON club_challenges(club_id);
CREATE INDEX idx_club_attempt_challenge ON club_challenge_attempts(club_challenge_id);
CREATE INDEX idx_club_posts_club ON club_posts(club_id);
CREATE INDEX idx_club_messages_club ON club_messages(club_id);

-- Multi-platform tracker tables
CREATE TABLE IF NOT EXISTS user_platforms (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform VARCHAR(32) NOT NULL,
  username VARCHAR(255) NOT NULL,
  access_token LONGTEXT NULL,
  last_fetched TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_user_platform UNIQUE (user_id, platform)
);

CREATE TABLE IF NOT EXISTS user_solved_problems (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform VARCHAR(32) NOT NULL,
  problem_id VARCHAR(255) NOT NULL,
  problem_name VARCHAR(500) NOT NULL,
  problem_url VARCHAR(1000) NULL,
  difficulty VARCHAR(20) NULL,
  topic_tags TEXT NULL,
  solved_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_user_platform_problem UNIQUE (user_id, platform, problem_id)
);

CREATE TABLE IF NOT EXISTS github_contributions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  commits INT NOT NULL DEFAULT 0,
  languages_json TEXT NULL,
  stars INT NOT NULL DEFAULT 0,
  forks INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_github_repo_per_user UNIQUE (user_id, repo_name)
);

CREATE INDEX idx_user_platforms_user ON user_platforms(user_id);
CREATE INDEX idx_user_platforms_platform ON user_platforms(platform);
CREATE INDEX idx_user_platforms_last_fetched ON user_platforms(last_fetched);
CREATE INDEX idx_solved_user ON user_solved_problems(user_id);
CREATE INDEX idx_solved_platform ON user_solved_problems(platform);
CREATE INDEX idx_solved_difficulty ON user_solved_problems(difficulty);
CREATE INDEX idx_solved_solved_at ON user_solved_problems(solved_at);
CREATE INDEX idx_github_contrib_user ON github_contributions(user_id);
CREATE INDEX idx_github_contrib_updated ON github_contributions(last_updated);

-- Mock interview mastery progress
CREATE TABLE IF NOT EXISTS interview_mastery_progress (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  track_id VARCHAR(80) NOT NULL,
  track_title VARCHAR(180) NULL,
  interview_type VARCHAR(32) NULL,
  difficulty VARCHAR(32) NULL,
  question_format VARCHAR(32) NULL,
  topics TEXT NULL,
  target_company VARCHAR(120) NULL,
  weekly_goal TEXT NULL,
  planned_sprints_per_week INT NULL DEFAULT 5,
  completed_sprints INT NULL DEFAULT 0,
  total_sessions_completed INT NULL DEFAULT 0,
  current_week INT NULL DEFAULT 1,
  readiness_score DOUBLE NULL,
  last_session_score DOUBLE NULL,
  strict_mode BIT(1) NOT NULL DEFAULT b'1',
  negative_marking BIT(1) NOT NULL DEFAULT b'1',
  status VARCHAR(32) NOT NULL DEFAULT 'ON_TRACK',
  last_synced_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_mastery_user_track UNIQUE (user_id, track_id)
);

CREATE INDEX idx_mastery_user ON interview_mastery_progress(user_id);
CREATE INDEX idx_mastery_status ON interview_mastery_progress(status);


