-- Schema for adaptive difficulty
CREATE TABLE IF NOT EXISTS user_skill (
  user_id BIGINT NOT NULL PRIMARY KEY,
  skill_score DOUBLE NOT NULL,
  last_updated TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS problem (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(512) NOT NULL,
  difficulty DOUBLE NOT NULL
);

CREATE INDEX idx_user_skill_user_id ON user_skill(user_id);
CREATE INDEX idx_problem_difficulty ON problem(difficulty);

-- Placement module scaffold tables
USE `contestdb`;

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

-- Live support chat tables
CREATE TABLE IF NOT EXISTS live_chat_conversations (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  requester_user_id BIGINT NOT NULL,
  assigned_agent_id BIGINT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'WAITING',
  priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
  category VARCHAR(64) NULL,
  summary VARCHAR(1200) NULL,
  source_page VARCHAR(255) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  joined_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  last_message_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_chat_requester FOREIGN KEY (requester_user_id) REFERENCES users(id),
  CONSTRAINT fk_live_chat_agent FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_type VARCHAR(16) NOT NULL,
  sender_user_id BIGINT NULL,
  message_text VARCHAR(2000) NOT NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'TEXT',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  CONSTRAINT fk_live_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES live_chat_conversations(id),
  CONSTRAINT fk_live_chat_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS live_chat_feedback (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  submitted_by_user_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(1000) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_chat_feedback_conversation FOREIGN KEY (conversation_id) REFERENCES live_chat_conversations(id),
  CONSTRAINT fk_live_chat_feedback_user FOREIGN KEY (submitted_by_user_id) REFERENCES users(id),
  CONSTRAINT uk_live_chat_feedback_conversation_user UNIQUE (conversation_id, submitted_by_user_id)
);

CREATE INDEX idx_live_chat_conv_status ON live_chat_conversations(status);
CREATE INDEX idx_live_chat_conv_requester ON live_chat_conversations(requester_user_id);
CREATE INDEX idx_live_chat_conv_agent ON live_chat_conversations(assigned_agent_id);
CREATE INDEX idx_live_chat_conv_last_message ON live_chat_conversations(last_message_at);
CREATE INDEX idx_live_chat_messages_conversation ON live_chat_messages(conversation_id);
CREATE INDEX idx_live_chat_messages_created ON live_chat_messages(created_at);
CREATE INDEX idx_live_chat_feedback_conversation ON live_chat_feedback(conversation_id);

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

-- Advanced leaderboard filter indexes
CREATE INDEX idx_users_college ON users(college);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_location ON users(location);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_last_used_at DATETIME NULL;
CREATE INDEX idx_users_ai_last_used_at ON users(ai_last_used_at);
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_at DATETIME NULL;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;
UPDATE quizzes SET created_at = COALESCE(created_at, start_time, NOW()), updated_at = COALESCE(updated_at, created_at, NOW());
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX idx_contests_mode ON contests(mode);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_contest_id ON problems(contest_id);
CREATE INDEX idx_submissions_status_submitted_problem_user ON submissions(status, submitted_at, problem_id, user_id);


