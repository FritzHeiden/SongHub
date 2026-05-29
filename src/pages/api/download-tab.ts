import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { canAccessSong, findSongByFilename, getSongContextByFilename } from '../../lib/songs'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { filename } = req.query
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename required' })
  }

  const filepath = path.join(SAVED_DIR, path.basename(filename))
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  const song = await findSongByFilename(path.basename(filename))
  if (!song || !(await canAccessSong(song, {
    userId: auth.userId,
    username: auth.username,
    role: auth.role,
  }))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const content = fs.readFileSync(filepath, 'utf-8')
  const parsed = JSON.parse(content)
  const songContext = await getSongContextByFilename(path.basename(filename), {
    userId: auth.userId,
    username: auth.username,
    role: auth.role,
  })
  
  // Copy metadata into tab object so it's available in the UI
  if (parsed.tab) {
    if (parsed.savedAt) parsed.tab.savedAt = parsed.savedAt
    parsed.tab.savedFilename = path.basename(filename)
    parsed.tab.marks = {
      A: Boolean(parsed?.marks?.A),
      F: Boolean(parsed?.marks?.F),
    }
    parsed.tab.songContext = songContext
  }
  
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json(parsed)
}
