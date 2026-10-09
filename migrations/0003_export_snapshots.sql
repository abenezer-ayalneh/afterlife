CREATE TABLE export_rows (
  job_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(job_id,position)
);
