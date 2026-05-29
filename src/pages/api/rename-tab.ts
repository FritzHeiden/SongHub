import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { getClientIp } from '../../lib/audit'
import { canModifySong, findSongByFilename, upsertSongOwnership } from '../../lib/songs'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { filename, artist, name } = req.body
  if (!filename || !artist || !name) {
    return res.status(400).json({ error: 'filename, artist und name erforderlich' })
  }

  const filepath = path.join(SAVED_DIR, path.basename(filename))
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Datei nicht gefunden' })

  const song = await findSongByFilename(path.basename(filename))
  if (!song || !canModifySong(song, {
    userId: auth.userId,
    username: auth.username,
    role: auth.role,
  })) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const raw = fs.readFileSync(filepath, 'utf-8')
  const parsed = JSON.parse(raw)

  // Update artist + name in the tab object
  parsed.tab.artist = artist
  parsed.tab.name = name

  // Build new filename
  const newFilename = `${artist} - ${name} (${parsed.tab.type || 'Chords'})`
    .replace(/[/\\?%*:|"<>]/g, '-').trim() + '.ultimatetab.json'
  const newFilepath = path.join(SAVED_DIR, newFilename)

  fs.writeFileSync(newFilepath, JSON.stringify(parsed, null, 2))
  if (newFilename !== path.basename(filename)) {
    fs.unlinkSync(filepath)
  }

  await upsertSongOwnership(newFilename, auth.userId)

  // Rename bewusst nicht im Change-Log erfassen,
  // damit der Log auf echte Song-Adds/Deletes fokussiert bleibt.

  return res.status(200).json({ success: true, filename: newFilename })
}
