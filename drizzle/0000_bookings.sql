CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  guests INTEGER NOT NULL,
  service TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  owner_sent INTEGER NOT NULL DEFAULT 0,
  confirmed_at INTEGER,
  customer_sent INTEGER NOT NULL DEFAULT 0,
  sending_at INTEGER
);
--> statement-breakpoint
CREATE INDEX bookings_email_created ON bookings(email, created_at);
--> statement-breakpoint
