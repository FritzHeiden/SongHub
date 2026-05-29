import type { NextApiRequest, NextApiResponse } from 'next'
import { appendChangeLog, getClientIp } from '../../lib/audit'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { createGroup, listAllGroups, listGroupsForUser } from '../../lib/groups'
import { upsertGroupMembership } from '../../lib/songs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const groups = auth.role === 'admin'
      ? await listAllGroups()
      : await listGroupsForUser(auth.userId)
    return res.status(200).json({ groups })
  }

  if (req.method === 'POST') {
    const { name } = req.body || {}
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name required' })
    }

    try {
      const group = await createGroup(name)
      await upsertGroupMembership({
        groupId: group.id,
        userId: auth.userId,
        role: 'manager',
      })

      appendChangeLog({
        timestamp: new Date().toISOString(),
        username: auth.username || 'unknown',
        role: auth.role,
        ip: getClientIp(req),
        action: 'group_created',
        details: {
          groupId: group.id,
          groupName: group.name,
          groupSlug: group.slug,
        },
      })

      return res.status(201).json({ group })
    } catch (error) {
      return res.status(409).json({ error: 'Could not create group' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}