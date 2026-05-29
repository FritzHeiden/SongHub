import fs from 'fs'
import path from 'path'
import { open, Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import { resolveSavedTabsDir } from './paths'

let dbPromise: Promise<Database> | null = null

function resolveDbFilePath(): string {
  const configured = process.env.SONGHUB_DB_PATH?.trim()
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured)
  }

  return path.join(resolveSavedTabsDir(), 'songhub.db')
}

async function migrate(db: Database) {
  await db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
      password_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL,
      filename TEXT NOT NULL UNIQUE,
      visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
      ownership_mode TEXT NOT NULL DEFAULT 'user' CHECK (ownership_mode IN ('user', 'group')),
      migrated_legacy INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('member', 'manager')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS song_ownerships (
      song_filename TEXT PRIMARY KEY,
      owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'group')),
      owner_user_id INTEGER,
      owner_group_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (song_filename) REFERENCES songs(filename) ON DELETE CASCADE,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (owner_group_id) REFERENCES groups(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS song_share_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_filename TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      permission TEXT NOT NULL CHECK (permission IN ('viewer', 'editor')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(song_filename, user_id),
      FOREIGN KEY (song_filename) REFERENCES songs(filename) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_songs_owner_user_id ON songs(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
    CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_song_ownerships_owner_user_id ON song_ownerships(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_song_ownerships_owner_group_id ON song_ownerships(owner_group_id);
    CREATE INDEX IF NOT EXISTS idx_song_share_grants_user_id ON song_share_grants(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `)
}

async function seedInitialUsers(db: Database) {
  const now = new Date().toISOString()
  const loginUsername = (process.env.SONGHUB_LOGIN_USERNAME || '').trim()
  const adminUsername = (process.env.SONGHUB_ADMIN_USERNAME || '').trim()

  if (loginUsername) {
    await db.run(
      `
      INSERT INTO users (username, role, created_at, updated_at)
      VALUES (?, 'user', ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        role = excluded.role,
        updated_at = excluded.updated_at
      `,
      loginUsername,
      now,
      now,
    )
  }

  if (adminUsername) {
    await db.run(
      `
      INSERT INTO users (username, role, created_at, updated_at)
      VALUES (?, 'admin', ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        role = excluded.role,
        updated_at = excluded.updated_at
      `,
      adminUsername,
      now,
      now,
    )
  }
}

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const dbFile = resolveDbFilePath()
      fs.mkdirSync(path.dirname(dbFile), { recursive: true })

      const db = await open({
        filename: dbFile,
        driver: sqlite3.Database,
      })

      await db.exec('PRAGMA foreign_keys = ON;')
      await migrate(db)
      await seedInitialUsers(db)
      return db
    })()
  }

  return dbPromise
}
