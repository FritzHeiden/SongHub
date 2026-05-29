import { getDb } from './db'
import type { UserRole } from './auth'

export interface UserRecord {
  id: number
  username: string
  role: UserRole
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const db = await getDb()
  const user = await db.get<UserRecord>(
    'SELECT id, username, role FROM users WHERE username = ? LIMIT 1',
    username,
  )
  return user || null
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const db = await getDb()
  const user = await db.get<UserRecord>(
    'SELECT id, username, role FROM users WHERE id = ? LIMIT 1',
    id,
  )
  return user || null
}

export async function ensureUser(username: string, role: UserRole): Promise<UserRecord> {
  const db = await getDb()
  const now = new Date().toISOString()
  await db.run(
    `
    INSERT INTO users (username, role, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET role = excluded.role, updated_at = excluded.updated_at
    `,
    username,
    role,
    now,
    now,
  )

  const user = await findUserByUsername(username)
  if (!user) throw new Error('Failed to ensure user')
  return user
}
