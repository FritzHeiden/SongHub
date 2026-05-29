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

export interface SongOwnershipRecord {
  song_filename: string
  owner_type: 'user' | 'group'
  owner_user_id: number | null
  owner_group_id: number | null
  created_at: string
  updated_at: string
}

export interface SongShareGrantRecord {
  id: number
  song_filename: string
  user_id: number
  permission: 'viewer' | 'editor'
  created_at: string
  updated_at: string
}

export interface GroupMembershipRecord {
  id: number
  group_id: number
  user_id: number
  role: 'member' | 'manager'
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

async function findSongOwnershipByFilename(
  filename: string,
): Promise<SongOwnershipRecord | null> {
  const db = await getDb()
  const normalized = path.basename(filename)
  const ownership = await db.get<SongOwnershipRecord>(
    `
    SELECT song_filename, owner_type, owner_user_id, owner_group_id, created_at, updated_at
    FROM song_ownerships
    WHERE song_filename = ?
    LIMIT 1
    `,
    normalized,
  )

  if (ownership) return ownership

  const song = await findSongByFilename(normalized)
  if (!song) return null

  return {
    song_filename: song.filename,
    owner_type: 'user',
    owner_user_id: song.owner_user_id,
    owner_group_id: null,
    created_at: song.created_at,
    updated_at: song.updated_at,
  }
}

async function findSongShareGrant(
  filename: string,
  userId: number,
): Promise<SongShareGrantRecord | null> {
  const db = await getDb()
  const normalized = path.basename(filename)
  const grant = await db.get<SongShareGrantRecord>(
    `
    SELECT id, song_filename, user_id, permission, created_at, updated_at
    FROM song_share_grants
    WHERE song_filename = ? AND user_id = ?
    LIMIT 1
    `,
    normalized,
    userId,
  )

  return grant || null
}

async function isUserInGroup(groupId: number, userId: number): Promise<boolean> {
  const db = await getDb()
  const membership = await db.get<GroupMembershipRecord>(
    `
    SELECT id, group_id, user_id, role, created_at, updated_at
    FROM group_memberships
    WHERE group_id = ? AND user_id = ?
    LIMIT 1
    `,
    groupId,
    userId,
  )

  return Boolean(membership)
}

async function resolveSongPermission(
  song: SongRecord,
  actor: RequestActor,
): Promise<'none' | 'viewer' | 'editor' | 'owner'> {
  if (actor.role === 'admin') return 'owner'

  const ownership = await findSongOwnershipByFilename(song.filename)
  if (ownership?.owner_type === 'user' && ownership.owner_user_id === actor.userId) {
    return 'owner'
  }

  if (ownership?.owner_type === 'group' && ownership.owner_group_id) {
    if (await isUserInGroup(ownership.owner_group_id, actor.userId)) {
      return 'editor'
    }
  }

  const grant = await findSongShareGrant(song.filename, actor.userId)
  if (grant?.permission === 'editor') return 'editor'
  if (grant?.permission === 'viewer') return 'viewer'

  return song.visibility === 'public' ? 'viewer' : 'none'
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

  await db.run(
    `
    INSERT INTO song_ownerships (song_filename, owner_type, owner_user_id, owner_group_id, created_at, updated_at)
    VALUES (?, 'user', ?, NULL, ?, ?)
    ON CONFLICT(song_filename) DO UPDATE SET
      owner_type = excluded.owner_type,
      owner_user_id = excluded.owner_user_id,
      owner_group_id = excluded.owner_group_id,
      updated_at = excluded.updated_at
    `,
    normalized,
    ownerUserId,
    now,
    now,
  )

  const song = await findSongByFilename(normalized)
  if (!song) throw new Error('Failed to upsert song ownership')
  return song
}

export async function grantSongAccess(
  filename: string,
  userId: number,
  permission: 'viewer' | 'editor',
): Promise<void> {
  const db = await getDb()
  const normalized = path.basename(filename)
  const now = new Date().toISOString()

  await db.run(
    `
    INSERT INTO song_share_grants (song_filename, user_id, permission, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(song_filename, user_id) DO UPDATE SET
      permission = excluded.permission,
      updated_at = excluded.updated_at
    `,
    normalized,
    userId,
    permission,
    now,
    now,
  )
}

export async function revokeSongAccess(filename: string, userId: number): Promise<void> {
  const db = await getDb()
  const normalized = path.basename(filename)
  await db.run(
    `
    DELETE FROM song_share_grants
    WHERE song_filename = ? AND user_id = ?
    `,
    normalized,
    userId,
  )
}

export async function upsertGroupMembership(params: {
  groupId: number
  userId: number
  role: 'member' | 'manager'
}): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()

  await db.run(
    `
    INSERT INTO group_memberships (group_id, user_id, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(group_id, user_id) DO UPDATE SET
      role = excluded.role,
      updated_at = excluded.updated_at
    `,
    params.groupId,
    params.userId,
    params.role,
    now,
    now,
  )
}

export async function canAccessSong(song: SongRecord, actor: RequestActor): Promise<boolean> {
  const permission = await resolveSongPermission(song, actor)
  return permission !== 'none'
}

export async function canModifySong(song: SongRecord, actor: RequestActor): Promise<boolean> {
  const permission = await resolveSongPermission(song, actor)
  return permission === 'owner' || permission === 'editor'
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
    SELECT DISTINCT s.id, s.owner_user_id, s.filename, s.visibility, s.ownership_mode, s.migrated_legacy, s.created_at, s.updated_at
    FROM songs s
    LEFT JOIN song_ownerships so ON so.song_filename = s.filename
    LEFT JOIN song_share_grants sg ON sg.song_filename = s.filename AND sg.user_id = ?
    LEFT JOIN group_memberships gm ON so.owner_type = 'group' AND so.owner_group_id = gm.group_id AND gm.user_id = ?
    WHERE s.owner_user_id = ?
      OR s.visibility = 'public'
      OR (so.owner_type = 'user' AND so.owner_user_id = ?)
      OR (so.owner_type = 'group' AND gm.id IS NOT NULL)
      OR sg.id IS NOT NULL
    ORDER BY updated_at DESC
    `,
    actor.userId,
    actor.userId,
    actor.userId,
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

      await db.run(
        `
        INSERT INTO song_ownerships (song_filename, owner_type, owner_user_id, owner_group_id, created_at, updated_at)
        VALUES (?, 'user', ?, NULL, ?, ?)
        ON CONFLICT(song_filename) DO UPDATE SET
          owner_type = excluded.owner_type,
          owner_user_id = excluded.owner_user_id,
          owner_group_id = excluded.owner_group_id,
          updated_at = excluded.updated_at
        `,
        filename,
        defaultOwnerUserId,
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
