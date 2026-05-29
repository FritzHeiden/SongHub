import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { getSongContextByFilename } from '../../lib/songs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const filename = typeof req.query.filename === 'string' ? req.query.filename : ''
  if (!filename) {
    return res.status(400).json({ error: 'filename required' })
  }

  const songContext = await getSongContextByFilename(filename, {
    userId: auth.userId,
    username: auth.username,
    role: auth.role,
  })

  if (!songContext || songContext.userPermission === 'none') {
    return res.status(404).json({ error: 'Song not found' })
  }

  return res.status(200).json({ songContext })
}
