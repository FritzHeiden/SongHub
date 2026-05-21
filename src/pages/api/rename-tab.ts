import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequest } from '../../lib/auth'
import { getClientIp } from '../../lib/audit'
import {
  buildSavedTabFilename,
  normalizeRenamePayload,
  sanitizeSavedFilenameToken,
} from '../../lib/tab-contract'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthFromRequest(req)
  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const validated = normalizeRenamePayload(req.body)
  if (!validated.ok) {
    const message = 'error' in validated ? validated.error : 'Invalid payload'
    return res.status(400).json({ error: message })
  }
  const { filename, artist, name } = validated.value

  const filepath = path.join(SAVED_DIR, filename)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Datei nicht gefunden' })

  const raw = fs.readFileSync(filepath, 'utf-8')
  const parsed = JSON.parse(raw)

  // Update artist + name in the tab object
  parsed.tab.artist = artist
  parsed.tab.name = name

  // Build new filename
  const newFilename = buildSavedTabFilename(artist, name, parsed.tab.type || 'Chords')
  const newFilepath = path.join(SAVED_DIR, newFilename)

  fs.writeFileSync(newFilepath, JSON.stringify(parsed, null, 2))
  if (newFilename !== sanitizeSavedFilenameToken(filename)) {
    fs.unlinkSync(filepath)
  }

  // Rename bewusst nicht im Change-Log erfassen,
  // damit der Log auf echte Song-Adds/Deletes fokussiert bleibt.

  return res.status(200).json({ success: true, filename: newFilename })
}
