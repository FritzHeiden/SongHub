import type { NextApiRequest, NextApiResponse } from 'next'
import { appendChangeLog, getClientIp } from '../../lib/audit'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { findGroupById, listGroupMemberships, removeGroupMembership } from '../../lib/groups'
import { isGroupManager, upsertGroupMembership } from '../../lib/songs'
import { findUserByUsername } from '../../lib/users'

async function canManageMemberships(groupId: number, actor: { role: 'user' | 'admin', userId: number }) {
  if (actor.role === 'admin') return true
  return isGroupManager(groupId, actor.userId)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const groupId = Number(req.query.groupId)
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({ error: 'groupId required' })
    }

    if (!(await canManageMemberships(groupId, { role: auth.role, userId: auth.userId }))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const memberships = await listGroupMemberships(groupId)
    return res.status(200).json({ memberships })
  }

  if (req.method === 'POST') {
    const { groupId, username, role } = req.body || {}
    const parsedGroupId = Number(groupId)
    if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
      return res.status(400).json({ error: 'valid groupId required' })
    }

    if (role !== 'member' && role !== 'manager') {
      return res.status(400).json({ error: 'role must be member or manager' })
    }

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username required' })
    }

    if (!(await canManageMemberships(parsedGroupId, { role: auth.role, userId: auth.userId }))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const group = await findGroupById(parsedGroupId)
    const user = await findUserByUsername(username)
    if (!group || !user) {
      return res.status(404).json({ error: 'Group or user not found' })
    }

    await upsertGroupMembership({ groupId: parsedGroupId, userId: user.id, role })

    appendChangeLog({
      timestamp: new Date().toISOString(),
      username: auth.username || 'unknown',
      role: auth.role,
      ip: getClientIp(req),
      action: 'group_membership_updated',
      details: {
        groupId: group.id,
        groupName: group.name,
        targetUserId: user.id,
        targetUsername: user.username,
        membershipRole: role,
      },
    })

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const groupId = Number(req.query.groupId)
    const username = typeof req.query.username === 'string' ? req.query.username : ''
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({ error: 'groupId required' })
    }

    if (!username) {
      return res.status(400).json({ error: 'username required' })
    }

    if (!(await canManageMemberships(groupId, { role: auth.role, userId: auth.userId }))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const [group, user] = await Promise.all([
      findGroupById(groupId),
      findUserByUsername(username),
    ])
    if (!group || !user) {
      return res.status(404).json({ error: 'Group or user not found' })
    }

    await removeGroupMembership(groupId, user.id)

    appendChangeLog({
      timestamp: new Date().toISOString(),
      username: auth.username || 'unknown',
      role: auth.role,
      ip: getClientIp(req),
      action: 'group_membership_removed',
      details: {
        groupId: group.id,
        groupName: group.name,
        targetUserId: user.id,
        targetUsername: user.username,
      },
    })

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}