import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequest } from '../../lib/auth'
import { appendChangeLog, getClientIp, moveSongToTrash } from '../../lib/audit'
import {
  buildSavedTabDocument,
  buildSavedTabFilename,
  normalizeTabForCreate,
  SAVED_TAB_FILE_SUFFIX,
  sanitizeSavedFilenameToken,
} from '../../lib/tab-contract'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

if (!fs.existsSync(SAVED_DIR)) {
  fs.mkdirSync(SAVED_DIR, { recursive: true })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthFromRequest(req)
  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method === 'POST') {
    // Save tab to server
    const { tab } = req.body
    const validated = normalizeTabForCreate(tab)
    if (!validated.ok) {
      const message = 'error' in validated ? validated.error : 'Invalid tab data'
      return res.status(400).json({ error: message })
    }
    const normalizedTab = validated.value
    const filename = buildSavedTabFilename(
      normalizedTab.artist,
      normalizedTab.name,
      normalizedTab.type,
    )

    const filepath = path.join(SAVED_DIR, filename)
    const existedBefore = fs.existsSync(filepath)

    fs.writeFileSync(
      filepath,
      JSON.stringify(buildSavedTabDocument(normalizedTab), null, 2),
    )

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
          artist: normalizedTab.artist,
          name: normalizedTab.name,
          type: normalizedTab.type,
          source: 'ultimate-guitar',
        },
      })
    }

    return res.status(200).json({ success: true, filename })

  } else if (req.method === 'GET') {
    // List all saved tabs
    const files = fs.readdirSync(SAVED_DIR).filter(f => f.endsWith(SAVED_TAB_FILE_SUFFIX))
    const tabs = files.map(filename => {
      try {
        const raw = fs.readFileSync(path.join(SAVED_DIR, filename), 'utf-8')
        const parsed = JSON.parse(raw)
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
        }
      } catch {
        return { filename, error: true }
      }
    })
    return res.status(200).json({ tabs })

  } else if (req.method === 'DELETE') {
    const { filename } = req.query
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename required' })
    }
    const safeFilename = sanitizeSavedFilenameToken(filename)
    const filepath = path.join(SAVED_DIR, safeFilename)
    if (fs.existsSync(filepath)) {
      const trashEntry = moveSongToTrash({
        filePath: filepath,
        originalFilename: safeFilename,
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
          filename: safeFilename,
          trashId: trashEntry.id,
        },
      })

      return res.status(200).json({ success: true, trashId: trashEntry.id })
    }
    return res.status(404).json({ error: 'File not found' })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
