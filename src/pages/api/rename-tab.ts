import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequest } from '../../lib/auth'
import { getClientIp } from '../../lib/audit'
import {
  buildSavedTabId,
  buildSavedTabFilename,
  normalizeRenamePayload,
  sanitizeSavedFilenameToken,
} from '../../lib/tab-contract'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthFromRequest(req)
  void auth
  void getClientIp(req)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const validated = normalizeRenamePayload(req.body)
  if (!validated.ok) {
    const message = 'error' in validated ? validated.error : 'Invalid payload'
    return res.status(400).json({ error: message, code: 'INVALID_RENAME_PAYLOAD' })
  }
  const { filename, artist, name } = validated.value
  const previousFilename = sanitizeSavedFilenameToken(filename)

  const filepath = path.join(SAVED_DIR, previousFilename)
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Datei nicht gefunden', code: 'NOT_FOUND' })
  }

  const raw = fs.readFileSync(filepath, 'utf-8')
  const parsed = JSON.parse(raw)

  // Update artist + name in the tab object
  parsed.tab.artist = artist
  parsed.tab.name = name

  // Build new filename
  const newFilename = buildSavedTabFilename(artist, name, parsed.tab.type || 'Chords')
  const newFilepath = path.join(SAVED_DIR, newFilename)

  fs.writeFileSync(newFilepath, JSON.stringify(parsed, null, 2))
  if (newFilename !== previousFilename) {
    fs.unlinkSync(filepath)
  }

  // Rename bewusst nicht im Change-Log erfassen,
  // damit der Log auf echte Song-Adds/Deletes fokussiert bleibt.

  return res.status(200).json({
    success: true,
    filename: newFilename,
    id: buildSavedTabId(newFilename),
    previousFilename,
    previousId: buildSavedTabId(previousFilename),
  })
}
