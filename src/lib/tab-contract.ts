import path from 'path'
import { SavedTabDocument, TabWritePayload } from '../types/tabs'

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }
export const SAVED_TAB_FILE_SUFFIX = '.ultimatetab.json'

const INVALID_FILENAME_CHARS = /[/\\?%*:|"<>]/g

export function sanitizeSavedFilenameToken(input: string): string {
  return path.basename(input)
}

export function buildSavedTabFilename(
  artist: string,
  name: string,
  type: string,
): string {
  return `${artist} - ${name} (${type})`.replace(INVALID_FILENAME_CHARS, '-').trim() + SAVED_TAB_FILE_SUFFIX
}

export function normalizeTabForCreate(input: unknown): ValidationResult<TabWritePayload> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'tab payload required' }
  }

  const candidate = input as Record<string, unknown>
  const artist = asTrimmedString(candidate.artist)
  const name = asTrimmedString(candidate.name)
  const type = asTrimmedString(candidate.type)
  const url = asTrimmedString(candidate.url)
  const slug = asTrimmedString(candidate.slug)
  const htmlTab = asStringOrUndefined(candidate.htmlTab)
  const raw_tabs = asStringOrUndefined(candidate.raw_tabs)

  if (!artist || !name || !type || !url) {
    return { ok: false, error: 'tab.artist, tab.name, tab.type and tab.url are required' }
  }

  if (!htmlTab && !raw_tabs) {
    return { ok: false, error: 'tab.htmlTab or tab.raw_tabs is required' }
  }

  return {
    ok: true,
    value: {
      ...candidate,
      artist,
      name,
      type,
      url,
      slug,
      htmlTab,
      raw_tabs,
    },
  }
}

export function normalizeRenamePayload(input: unknown): ValidationResult<{
  filename: string
  artist: string
  name: string
}> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'payload required' }
  }

  const candidate = input as Record<string, unknown>
  const filename = asTrimmedString(candidate.filename)
  const artist = asTrimmedString(candidate.artist)
  const name = asTrimmedString(candidate.name)

  if (!filename || !artist || !name) {
    return { ok: false, error: 'filename, artist and name are required' }
  }

  return {
    ok: true,
    value: {
      filename: sanitizeSavedFilenameToken(filename),
      artist,
      name,
    },
  }
}

export function buildSavedTabDocument(tab: TabWritePayload): SavedTabDocument {
  return {
    savedAt: new Date().toISOString(),
    version: '1.0',
    marks: { A: false, F: false },
    tab,
  }
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function asStringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return value
}