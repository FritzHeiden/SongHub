import type { NextApiRequest, NextApiResponse } from 'next'
import { appendChangeLog, getClientIp } from '../../lib/audit'
import { getAuthFromRequestAsync } from '../../lib/auth'
import {
  canManageSongShares,
  findSongByFilename,
  grantSongAccess,
  listSongShareGrants,
  revokeSongAccess,
} from '../../lib/songs'
import { findUserByUsername } from '../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const filenameParam = req.method === 'GET' || req.method === 'DELETE'
    ? req.query.filename
    : req.body?.filename
  const filename = typeof filenameParam === 'string' ? filenameParam : ''
  if (!filename) {
    return res.status(400).json({ error: 'filename required' })
  }

  const song = await findSongByFilename(filename)
  if (!song) {
    return res.status(404).json({ error: 'Song not found' })
  }

  if (!(await canManageSongShares(song, {
    userId: auth.userId,
    username: auth.username,
    role: auth.role,
  }))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'GET') {
    const shares = await listSongShareGrants(filename)
    return res.status(200).json({ shares })
  }

  if (req.method === 'POST') {
    const { username, permission } = req.body || {}
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username required' })
    }

    if (permission !== 'viewer' && permission !== 'editor') {
      return res.status(400).json({ error: 'permission must be viewer or editor' })
    }

    const user = await findUserByUsername(username)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await grantSongAccess(filename, user.id, permission)

    appendChangeLog({
      timestamp: new Date().toISOString(),
      username: auth.username || 'unknown',
      role: auth.role,
      ip: getClientIp(req),
      action: 'song_share_granted',
      details: {
        filename,
        targetUserId: user.id,
        targetUsername: user.username,
        permission,
      },
    })

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const usernameParam = req.query.username
    const username = typeof usernameParam === 'string' ? usernameParam : ''
    if (!username) {
      return res.status(400).json({ error: 'username required' })
    }

    const user = await findUserByUsername(username)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await revokeSongAccess(filename, user.id)

    appendChangeLog({
      timestamp: new Date().toISOString(),
      username: auth.username || 'unknown',
      role: auth.role,
      ip: getClientIp(req),
      action: 'song_share_revoked',
      details: {
        filename,
        targetUserId: user.id,
        targetUsername: user.username,
      },
    })

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}