import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import {
  buildSavedTabId,
  resolveSavedTabFilename,
} from '../../lib/tab-contract'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const resolvedFilename = resolveSavedTabFilename(req.query)
  if (!resolvedFilename.ok) {
    const message = 'error' in resolvedFilename ? resolvedFilename.error : 'filename required'
    return res.status(400).json({ error: message, code: 'INVALID_IDENTIFIER' })
  }

  const safeFilename = resolvedFilename.value
  const filepath = path.join(SAVED_DIR, safeFilename)
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' })
  }

  const content = fs.readFileSync(filepath, 'utf-8')
  const parsed = JSON.parse(content)
  
  // Copy metadata into tab object so it's available in the UI
  if (parsed.tab) {
    if (parsed.savedAt) parsed.tab.savedAt = parsed.savedAt
    parsed.tab.savedFilename = safeFilename
    parsed.tab.savedId = buildSavedTabId(safeFilename)
    parsed.tab.marks = {
      A: Boolean(parsed?.marks?.A),
      F: Boolean(parsed?.marks?.F),
    }
  }
  
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json(parsed)
}
