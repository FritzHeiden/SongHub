import { getDb } from './db'

export interface GroupRecord {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface GroupMembershipSummary {
  id: number
  group_id: number
  user_id: number
  role: 'member' | 'manager'
  username: string
  created_at: string
  updated_at: string
}

function slugifyGroupName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function findGroupById(id: number): Promise<GroupRecord | null> {
  const db = await getDb()
  const group = await db.get<GroupRecord>(
    `
    SELECT id, name, slug, created_at, updated_at
    FROM groups
    WHERE id = ?
    LIMIT 1
    `,
    id,
  )

  return group || null
}

export async function createGroup(name: string): Promise<GroupRecord> {
  const db = await getDb()
  const trimmedName = name.trim()
  const slug = slugifyGroupName(trimmedName)
  const now = new Date().toISOString()

  await db.run(
    `
    INSERT INTO groups (name, slug, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    `,
    trimmedName,
    slug,
    now,
    now,
  )

  const group = await db.get<GroupRecord>(
    `
    SELECT id, name, slug, created_at, updated_at
    FROM groups
    WHERE slug = ?
    LIMIT 1
    `,
    slug,
  )

  if (!group) throw new Error('Failed to create group')
  return group
}

export async function listGroupsForUser(userId: number): Promise<GroupRecord[]> {
  const db = await getDb()
  return db.all<GroupRecord[]>(
    `
    SELECT g.id, g.name, g.slug, g.created_at, g.updated_at
    FROM groups g
    INNER JOIN group_memberships gm ON gm.group_id = g.id
    WHERE gm.user_id = ?
    ORDER BY g.name COLLATE NOCASE ASC
    `,
    userId,
  ) as unknown as GroupRecord[]
}

export async function listAllGroups(): Promise<GroupRecord[]> {
  const db = await getDb()
  return db.all<GroupRecord[]>(
    `
    SELECT id, name, slug, created_at, updated_at
    FROM groups
    ORDER BY name COLLATE NOCASE ASC
    `,
  ) as unknown as GroupRecord[]
}

export async function listGroupMemberships(groupId: number): Promise<GroupMembershipSummary[]> {
  const db = await getDb()
  return db.all<GroupMembershipSummary[]>(
    `
    SELECT gm.id, gm.group_id, gm.user_id, gm.role, u.username, gm.created_at, gm.updated_at
    FROM group_memberships gm
    INNER JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY CASE gm.role WHEN 'manager' THEN 0 ELSE 1 END, u.username COLLATE NOCASE ASC
    `,
    groupId,
  ) as unknown as GroupMembershipSummary[]
}

export async function removeGroupMembership(groupId: number, userId: number): Promise<void> {
  const db = await getDb()
  await db.run(
    `
    DELETE FROM group_memberships
    WHERE group_id = ? AND user_id = ?
    `,
    groupId,
    userId,
  )
}
