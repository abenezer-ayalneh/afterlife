CREATE TABLE admin_chapter_requests (
  request_id TEXT PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id)
);
