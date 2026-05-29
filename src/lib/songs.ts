import fs from 'fs'
import path from 'path'
import { getDb } from './db'
import { resolveSavedTabsDir } from './paths'
import type { UserRole } from './auth'

export interface SongRecord {
  id: number
  owner_user_id: number
  filename: string
  visibility: 'private' | 'public'
  ownership_mode: 'user' | 'group'
  migrated_legacy: number
  created_at: string
  updated_at: string
}

export interface RequestActor {
  userId: number
  username: string
  role: UserRole
}

function savedDir(): string {
  const dir = resolveSavedTabsDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function songFilePath(filename: string): string {
  return path.join(savedDir(), path.basename(filename))
}

export async function findSongByFilename(filename: string): Promise<SongRecord | null> {
  const db = await getDb()
  const song = await db.get<SongRecord>(
    `
    SELECT id, owner_user_id, filename, visibility, ownership_mode, migrated_legacy, created_at, updated_at
    FROM songs
    WHERE filename = ?
    LIMIT 1
    `,
    path.basename(filename),
  )
  return song || null
}

export async function upsertSongOwnership(
  filename: string,
  ownerUserId: number,
  migratedLegacy = false,
): Promise<SongRecord> {
  const db = await getDb()
  const normalized = path.basename(filename)
  const now = new Date().toISOString()

  await db.run(
    `
    INSERT INTO songs (owner_user_id, filename, visibility, ownership_mode, migrated_legacy, created_at, updated_at)
    VALUES (?, ?, 'private', 'user', ?, ?, ?)
    ON CONFLICT(filename) DO UPDATE SET
      owner_user_id = excluded.owner_user_id,
      visibility = excluded.visibility,
      ownership_mode = excluded.ownership_mode,
      migrated_legacy = songs.migrated_legacy,
      updated_at = excluded.updated_at
    `,
    ownerUserId,
    normalized,
    migratedLegacy ? 1 : 0,
    now,
    now,
  )

  const song = await findSongByFilename(normalized)
  if (!song) throw new Error('Failed to upsert song ownership')
  return song
}

export function canAccessSong(song: SongRecord, actor: RequestActor): boolean {
  if (actor.role === 'admin') return true
  if (song.owner_user_id === actor.userId) return true
  return song.visibility === 'public'
}

export function canModifySong(song: SongRecord, actor: RequestActor): boolean {
  if (actor.role === 'admin') return true
  return song.owner_user_id === actor.userId
}

export async function listAccessibleSongs(actor: RequestActor): Promise<SongRecord[]> {
  const db = await getDb()
  if (actor.role === 'admin') {
    return db.all<SongRecord[]>(
      `
      SELECT id, owner_user_id, filename, visibility, ownership_mode, migrated_legacy, created_at, updated_at
      FROM songs
      ORDER BY updated_at DESC
      `,
    ) as unknown as SongRecord[]
  }

  return db.all<SongRecord[]>(
    `
    SELECT id, owner_user_id, filename, visibility, ownership_mode, migrated_legacy, created_at, updated_at
    FROM songs
    WHERE owner_user_id = ? OR visibility = 'public'
    ORDER BY updated_at DESC
    `,
    actor.userId,
  ) as unknown as SongRecord[]
}

export async function migrateLegacySongs(defaultOwnerUserId: number): Promise<void> {
  const db = await getDb()
  const dir = savedDir()
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.ultimatetab.json'))

  const now = new Date().toISOString()
  await db.exec('BEGIN')
  try {
    for (const filename of files) {
      await db.run(
        `
        INSERT INTO songs (owner_user_id, filename, visibility, ownership_mode, migrated_legacy, created_at, updated_at)
        VALUES (?, ?, 'private', 'user', 1, ?, ?)
        ON CONFLICT(filename) DO NOTHING
        `,
        defaultOwnerUserId,
        filename,
        now,
        now,
      )
    }
    await db.exec('COMMIT')
  } catch (error) {
    await db.exec('ROLLBACK')
    throw error
  }
}
