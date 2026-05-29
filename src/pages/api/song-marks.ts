import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { canModifySong, findSongByFilename } from '../../lib/songs'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

function normalizeMarks(input: any) {
  return {
    A: Boolean(input?.A),
    F: Boolean(input?.F),
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return (async () => {
    const auth = await getAuthFromRequestAsync(req)
    if (!auth.isAuthed || !auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { filename, marks } = req.body || {}
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename required' })
    }

    const song = await findSongByFilename(path.basename(filename))
    if (!song || !(await canModifySong(song, {
      userId: auth.userId,
      username: auth.username,
      role: auth.role,
    }))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const filepath = path.join(SAVED_DIR, path.basename(filename))
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      const nextMarks = normalizeMarks(marks)

      parsed.marks = nextMarks
      if (parsed.tab) {
        parsed.tab.marks = nextMarks
      }

      fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2))
      return res.status(200).json({ success: true, marks: nextMarks })
    } catch {
      return res.status(500).json({ error: 'Could not update marks' })
    }
  })()
}
