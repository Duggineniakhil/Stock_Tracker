-- Migration: 002 - Alert Rules
-- Adds alert_rules table for advanced alert system
-- Created: 2026-02-19

CREATE TABLE IF NOT EXISTS alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK(template_type IN ('PERCENTAGE_CHANGE', 'TARGET_PRICE', 'VOLUME_SPIKE')),
  condition_operator TEXT NOT NULL CHECK(condition_operator IN ('ABOVE', 'BELOW')),
  condition_value REAL NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_active INTEGER NOT NULL DEFAULT 1,
  last_triggered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_symbol ON alert_rules(symbol);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);

-- Add priority to user_alerts if not exists
-- Safe to run multiple times
ALTER TABLE user_alerts ADD COLUMN priority TEXT DEFAULT 'MEDIUM';
ALTER TABLE user_alerts ADD COLUMN alertType TEXT DEFAULT 'SYSTEM';

-- Migration: 003 - Auth Security
-- Adds refresh_tokens and login_attempts tables

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- Migration: 004 - Security Audit Log
-- Adds security_audit_log table for tracking auth and security events

CREATE TABLE IF NOT EXISTS security_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  path TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON security_audit_log(created_at DESC);

-- Migration: 005 - User Full Name
-- Adds name column to users table for high-fidelity UI
-- Created: 2026-04-22

ALTER TABLE users ADD COLUMN name TEXT;

-- Migration: 006 - AI Features & SaaS Prep
-- Adds ai_chats, ai_reports, news_sentiment tables and plan column
-- Created: 2026-04-24

CREATE TABLE IF NOT EXISTS ai_chats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  role       TEXT    NOT NULL CHECK(role IN ('user','assistant')),
  content    TEXT    NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  report_type  TEXT    NOT NULL CHECK(report_type IN ('weekly','monthly','health')),
  content_html TEXT    NOT NULL,
  summary      TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS news_sentiment (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol      TEXT    NOT NULL,
  headline    TEXT    NOT NULL,
  url         TEXT,
  sentiment   TEXT    CHECK(sentiment IN ('bullish','bearish','neutral')),
  score       REAL,
  source      TEXT,
  published_at DATETIME,
  cached_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_reports_user ON ai_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_news_sentiment_symbol ON news_sentiment(symbol);

-- Add plan column to users if not exists (SaaS prep)
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'student', 'pro'));
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;

-- Migration: 007 - Alert Read Status
-- Adds is_read column to user_alerts table
ALTER TABLE user_alerts ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0;
