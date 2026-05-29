import { getDb } from './db'
import { randomSessionId } from './crypto'

const SESSION_TTL_DAYS = Number(process.env.SONGHUB_SESSION_TTL_DAYS || 7)

export interface SessionRecord {
  id: string
  user_id: number
  created_at: string
  expires_at: string
}

function futureIsoDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export async function createSession(userId: number): Promise<SessionRecord> {
  const db = await getDb()
  const id = randomSessionId()
  const now = new Date().toISOString()
  const expiresAt = futureIsoDays(SESSION_TTL_DAYS)

  await db.run(
    `INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    id,
    userId,
    now,
    expiresAt,
  )

  return {
    id,
    user_id: userId,
    created_at: now,
    expires_at: expiresAt,
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM sessions WHERE id = ?', sessionId)
}

export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  const db = await getDb()
  const row = await db.get<SessionRecord>(
    'SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ? LIMIT 1',
    sessionId,
  )

  if (!row) return null
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteSession(row.id)
    return null
  }
  return row
}

export async function cleanupExpiredSessions(): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM sessions WHERE expires_at <= ?', new Date().toISOString())
}
