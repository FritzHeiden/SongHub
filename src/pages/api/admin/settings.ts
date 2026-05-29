import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthFromRequestAsync } from '../../../lib/auth'
import {
  getMusicianMarkingEnabled,
  setMusicianMarkingEnabled,
} from '../../../lib/settings'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      musicianMarkingEnabled: getMusicianMarkingEnabled(),
    })
  }

  if (req.method === 'POST') {
    const nextValue = req.body?.musicianMarkingEnabled
    if (typeof nextValue !== 'boolean') {
      return res.status(400).json({ error: 'musicianMarkingEnabled must be boolean' })
    }

    return res.status(200).json({
      musicianMarkingEnabled: setMusicianMarkingEnabled(nextValue),
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
