import fs from 'fs'
import path from 'path'
import { ensureUser } from '../src/lib/users'
import {
  assignSongToGroup,
  canAccessSong,
  canManageSongShares,
  canModifySong,
  findSongByFilename,
  grantSongAccess,
  revokeSongAccess,
  upsertGroupMembership,
  upsertSongOwnership,
} from '../src/lib/songs'
import { createGroup } from '../src/lib/groups'
import { getDb } from '../src/lib/db'

interface Actor {
  userId: number
  username: string
  role: 'user' | 'admin'
}

function assertTrue(value: boolean, message: string): void {
  if (!value) throw new Error(`Assertion failed: ${message}`)
}

function assertFalse(value: boolean, message: string): void {
  if (value) throw new Error(`Assertion failed: ${message}`)
}

async function removeMembership(groupId: number, userId: number): Promise<void> {
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

async function setupSongFile(filename: string): Promise<void> {
  const savedDir = path.join(process.cwd(), 'saved-tabs')
  fs.mkdirSync(savedDir, { recursive: true })
  const filePath = path.join(savedDir, filename)
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        savedAt: new Date().toISOString(),
        version: '1.0',
        marks: { A: false, F: false },
        tab: {
          artist: 'ACL Artist',
          name: 'ACL Song',
          type: 'Chords',
          slug: 'acl-song',
          url: 'local://image-tab/acl-song',
          htmlTab: '<div>acl</div>',
        },
      },
      null,
      2,
    ),
  )
}

async function run(): Promise<void> {
  const owner = await ensureUser('acl_owner', 'user')
  const viewer = await ensureUser('acl_viewer', 'user')
  const editor = await ensureUser('acl_editor', 'user')
  const groupMember = await ensureUser('acl_group_member', 'user')
  const groupManager = await ensureUser('acl_group_manager', 'user')
  const outsider = await ensureUser('acl_outsider', 'user')
  const adminUser = await ensureUser('acl_admin', 'admin')

  const ownerActor: Actor = { userId: owner.id, username: owner.username, role: 'user' }
  const viewerActor: Actor = { userId: viewer.id, username: viewer.username, role: 'user' }
  const editorActor: Actor = { userId: editor.id, username: editor.username, role: 'user' }
  const memberActor: Actor = { userId: groupMember.id, username: groupMember.username, role: 'user' }
  const managerActor: Actor = { userId: groupManager.id, username: groupManager.username, role: 'user' }
  const outsiderActor: Actor = { userId: outsider.id, username: outsider.username, role: 'user' }
  const adminActor: Actor = { userId: adminUser.id, username: adminUser.username, role: 'admin' }

  const filename = 'ACL Artist - ACL Song (Chords).ultimatetab.json'
  await setupSongFile(filename)
  await upsertSongOwnership(filename, owner.id)

  const songPrivate = await findSongByFilename(filename)
  if (!songPrivate) throw new Error('Expected private song record')

  assertTrue(await canAccessSong(songPrivate, ownerActor), 'owner can read private song')
  assertTrue(await canModifySong(songPrivate, ownerActor), 'owner can modify private song')
  assertTrue(await canManageSongShares(songPrivate, ownerActor), 'owner can manage shares')

  assertFalse(await canAccessSong(songPrivate, viewerActor), 'viewer cannot read before grant')
  assertFalse(await canModifySong(songPrivate, viewerActor), 'viewer cannot modify before grant')

  await grantSongAccess(filename, viewer.id, 'viewer')
  await grantSongAccess(filename, editor.id, 'editor')

  assertTrue(await canAccessSong(songPrivate, viewerActor), 'viewer can read after grant')
  assertFalse(await canModifySong(songPrivate, viewerActor), 'viewer still cannot modify')

  assertTrue(await canAccessSong(songPrivate, editorActor), 'editor can read after grant')
  assertTrue(await canModifySong(songPrivate, editorActor), 'editor can modify after grant')
  assertFalse(await canManageSongShares(songPrivate, editorActor), 'editor cannot manage shares')

  await revokeSongAccess(filename, viewer.id)
  assertFalse(await canAccessSong(songPrivate, viewerActor), 'viewer loses read after revoke')

  assertTrue(await canAccessSong(songPrivate, adminActor), 'admin can read any song')
  assertTrue(await canModifySong(songPrivate, adminActor), 'admin can modify any song')
  assertTrue(await canManageSongShares(songPrivate, adminActor), 'admin can manage shares')

  const group = await createGroup('ACL Test Group')
  await upsertGroupMembership({ groupId: group.id, userId: groupManager.id, role: 'manager' })
  await upsertGroupMembership({ groupId: group.id, userId: groupMember.id, role: 'member' })

  await assignSongToGroup(filename, group.id)

  const songGroupOwned = await findSongByFilename(filename)
  if (!songGroupOwned) throw new Error('Expected group-owned song record')

  assertTrue(await canAccessSong(songGroupOwned, memberActor), 'group member can read group-owned song')
  assertTrue(await canModifySong(songGroupOwned, memberActor), 'group member can modify group-owned song')
  assertFalse(await canManageSongShares(songGroupOwned, memberActor), 'group member cannot manage shares')

  assertTrue(await canAccessSong(songGroupOwned, managerActor), 'group manager can read group-owned song')
  assertTrue(await canModifySong(songGroupOwned, managerActor), 'group manager can modify group-owned song')
  assertTrue(await canManageSongShares(songGroupOwned, managerActor), 'group manager can manage shares')

  assertFalse(await canAccessSong(songGroupOwned, outsiderActor), 'outsider cannot read group-owned song')

  await removeMembership(group.id, groupMember.id)
  assertFalse(await canAccessSong(songGroupOwned, memberActor), 'removed member loses group-derived read access')
  assertFalse(await canModifySong(songGroupOwned, memberActor), 'removed member loses group-derived modify access')

  console.log('ACL matrix check: OK')
}

run().catch((error) => {
  console.error('ACL matrix check: FAILED')
  console.error(error)
  process.exit(1)
})
