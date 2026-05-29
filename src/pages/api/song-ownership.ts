import type { NextApiRequest, NextApiResponse } from 'next'
import { appendChangeLog, getClientIp } from '../../lib/audit'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { findGroupById } from '../../lib/groups'
import { assignSongToGroup, canManageSongShares, findSongByFilename, isGroupManager } from '../../lib/songs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { filename, groupId } = req.body || {}
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename required' })
  }

  const parsedGroupId = Number(groupId)
  if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
    return res.status(400).json({ error: 'valid groupId required' })
  }

  const [song, group] = await Promise.all([
    findSongByFilename(filename),
    findGroupById(parsedGroupId),
  ])

  if (!song || !group) {
    return res.status(404).json({ error: 'Song or group not found' })
  }

  if (!(await canManageSongShares(song, {
    userId: auth.userId,
    username: auth.username,
    role: auth.role,
  }))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (auth.role !== 'admin' && !(await isGroupManager(parsedGroupId, auth.userId))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  await assignSongToGroup(filename, parsedGroupId)

  appendChangeLog({
    timestamp: new Date().toISOString(),
    username: auth.username || 'unknown',
    role: auth.role,
    ip: getClientIp(req),
    action: 'song_owner_changed',
    details: {
      filename,
      ownerType: 'group',
      ownerGroupId: group.id,
      ownerGroupName: group.name,
    },
  })

  return res.status(200).json({ success: true })
}