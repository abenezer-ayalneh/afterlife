PRAGMA foreign_keys = ON;
CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TRIGGER chapter_id_immutable BEFORE UPDATE OF id ON chapters
BEGIN SELECT RAISE(ABORT, 'Chapter identifiers cannot change'); END;
CREATE TRIGGER chapter_delete_prohibited BEFORE DELETE ON chapters
BEGIN SELECT RAISE(ABORT, 'Published chapters cannot be deleted'); END;
CREATE TABLE ratings (
  chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  owner_hash TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(typeof(score) = 'integer' AND score BETWEEN 0 AND 10),
  version INTEGER NOT NULL CHECK(version > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (chapter_id, owner_hash)
);
CREATE INDEX ratings_chapter_score ON ratings(chapter_id,score);
CREATE TABLE rating_requests (
  request_id TEXT PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  owner_hash TEXT NOT NULL,
  score INTEGER NOT NULL,
  base_version INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  owner_hash TEXT NOT NULL,
  author TEXT CHECK(author IS NULL OR length(author) <= 60),
  body TEXT NOT NULL CHECK(length(body) <= 2000),
  version INTEGER NOT NULL DEFAULT 1,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK(hidden IN (0,1)),
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX comments_public ON comments(chapter_id,hidden,deleted_at,created_at DESC,id DESC);
CREATE TABLE reports (
  id INTEGER PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id),
  owner_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 500),
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(comment_id,owner_hash)
);
CREATE TABLE rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
INSERT INTO chapters(title) VALUES ('Chapter 1'),('Chapter 2'),('Chapter 3'),('Chapter 4'),('Chapter 5'),('Chapter 6'),('Chapter 7'),('Chapter 8'),('Chapter 9');
