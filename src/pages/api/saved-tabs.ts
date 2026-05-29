import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequestAsync } from '../../lib/auth'
import { appendChangeLog, getClientIp, moveSongToTrash } from '../../lib/audit'
import {
  canModifySong,
  findSongByFilename,
  getSongContextByFilename,
  listAccessibleSongs,
  migrateLegacySongs,
  songFilePath,
  upsertSongOwnership,
} from '../../lib/songs'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

if (!fs.existsSync(SAVED_DIR)) {
  fs.mkdirSync(SAVED_DIR, { recursive: true })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await getAuthFromRequestAsync(req)
  if (!auth.isAuthed || !auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  await migrateLegacySongs(auth.userId)

  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method === 'POST') {
    // Save tab to server
    const { tab } = req.body
    if (!tab || !tab.url || !tab.htmlTab) {
      return res.status(400).json({ error: 'Invalid tab data' })
    }
    const filename = `${tab.artist} - ${tab.name} (${tab.type})`
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() + '.ultimatetab.json'

    const filepath = path.join(SAVED_DIR, filename)
    const existedBefore = fs.existsSync(filepath)

    fs.writeFileSync(
      filepath,
      JSON.stringify(
        {
          savedAt: new Date().toISOString(),
          version: '1.0',
          marks: { A: false, F: false },
          tab,
        },
        null,
        2,
      ),
    )

    await upsertSongOwnership(filename, auth.userId)

    // Nur echte Neuanlagen im Change-Log erfassen.
    if (!existedBefore) {
      appendChangeLog({
        timestamp: new Date().toISOString(),
        username: actor,
        role,
        ip,
        action: 'song_created',
        details: {
          filename,
          artist: tab.artist,
          name: tab.name,
          type: tab.type,
          source: 'ultimate-guitar',
        },
      })
    }

    return res.status(200).json({ success: true, filename })

  } else if (req.method === 'GET') {
    // List all saved tabs
    const files = fs.readdirSync(SAVED_DIR).filter(f => f.endsWith('.ultimatetab.json'))
    const accessibleSongs = await listAccessibleSongs({
      userId: auth.userId,
      username: auth.username,
      role: auth.role,
    })
    const allowed = new Set(accessibleSongs.map((song) => song.filename))

    const tabs = await Promise.all(files
      .filter((filename) => allowed.has(filename))
      .map(async (filename) => {
      try {
        const raw = fs.readFileSync(path.join(SAVED_DIR, filename), 'utf-8')
        const parsed = JSON.parse(raw)
        const songContext = await getSongContextByFilename(filename, {
          userId: auth.userId,
          username: auth.username,
          role: auth.role,
        })

        return {
          filename,
          savedAt: parsed.savedAt,
          artist: parsed.tab?.artist,
          name: parsed.tab?.name,
          type: parsed.tab?.type,
          slug: parsed.tab?.slug,
          url: parsed.tab?.url,
          marks: {
            A: Boolean(parsed?.marks?.A),
            F: Boolean(parsed?.marks?.F),
          },
          songContext,
        }
      } catch {
        return { filename, error: true }
      }
    }))

    return res.status(200).json({ tabs })

  } else if (req.method === 'DELETE') {
    const { filename } = req.query
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename required' })
    }
    const filepath = path.join(SAVED_DIR, path.basename(filename))
    if (fs.existsSync(filepath)) {
      const song = await findSongByFilename(path.basename(filename))
      if (!song || !(await canModifySong(song, {
        userId: auth.userId,
        username: auth.username,
        role: auth.role,
      }))) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const trashEntry = moveSongToTrash({
        filePath: filepath,
        originalFilename: path.basename(filename),
        deletedBy: actor,
        deletedByRole: role,
        ip,
      })

      appendChangeLog({
        timestamp: new Date().toISOString(),
        username: actor,
        role,
        ip,
        action: 'song_deleted',
        details: {
          filename: path.basename(filename),
          trashId: trashEntry.id,
        },
      })

      return res.status(200).json({ success: true, trashId: trashEntry.id })
    }
    return res.status(404).json({ error: 'File not found' })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
