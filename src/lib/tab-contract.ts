import path from 'path'
import { SavedTabDocument, TabWritePayload } from '../types/tabs'

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

type SavedTabPatch = Partial<TabWritePayload>

export const SAVED_TAB_FILE_SUFFIX = '.ultimatetab.json'

const INVALID_FILENAME_CHARS = /[/\\?%*:|"<>]/g
const IDENTITY_FIELDS = new Set(['artist', 'name', 'type'])

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

export function buildSavedTabId(filename: string): string {
  return Buffer.from(sanitizeSavedFilenameToken(filename), 'utf-8').toString('base64url')
}

export function filenameFromSavedTabId(id: string): ValidationResult<string> {
  if (!id || typeof id !== 'string') {
    return { ok: false, error: 'id required' }
  }

  try {
    const decoded = Buffer.from(id, 'base64url').toString('utf-8')
    const filename = sanitizeSavedFilenameToken(decoded)
    if (!filename.endsWith(SAVED_TAB_FILE_SUFFIX)) {
      return { ok: false, error: 'invalid id' }
    }
    return { ok: true, value: filename }
  } catch {
    return { ok: false, error: 'invalid id' }
  }
}

export function resolveSavedTabFilename(input: unknown): ValidationResult<string> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'identifier required' }
  }

  const candidate = input as Record<string, unknown>
  const filename = asTrimmedString(candidate.filename)
  if (filename) {
    return { ok: true, value: sanitizeSavedFilenameToken(filename) }
  }

  const id = asTrimmedString(candidate.id)
  if (!id) {
    return { ok: false, error: 'id or filename required' }
  }

  return filenameFromSavedTabId(id)
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

export function normalizeTabPatchPayload(input: unknown): ValidationResult<{
  filename: string
  patch: SavedTabPatch
}> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'payload required' }
  }

  const candidate = input as Record<string, unknown>
  const resolvedFilename = resolveSavedTabFilename(candidate)
  if (!resolvedFilename.ok) {
    const message = 'error' in resolvedFilename ? resolvedFilename.error : 'invalid identifier'
    return { ok: false, error: message }
  }

  const patchValue = candidate.patch
  if (!patchValue || typeof patchValue !== 'object' || Array.isArray(patchValue)) {
    return { ok: false, error: 'patch object required' }
  }

  const patchCandidate = patchValue as Record<string, unknown>
  const patchKeys = Object.keys(patchCandidate)
  if (patchKeys.length === 0) {
    return { ok: false, error: 'patch must include at least one field' }
  }

  const forbiddenField = patchKeys.find((key) => IDENTITY_FIELDS.has(key))
  if (forbiddenField) {
    return { ok: false, error: `${forbiddenField} cannot be updated via PATCH` }
  }

  const normalizedPatch = normalizePartialTabPatch(patchCandidate)
  return {
    ok: true,
    value: {
      filename: resolvedFilename.value,
      patch: normalizedPatch,
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

function normalizePartialTabPatch(candidate: Record<string, unknown>): SavedTabPatch {
  const normalizedPatch: Record<string, unknown> = { ...candidate }

  for (const [key, value] of Object.entries(candidate)) {
    if (typeof value === 'string') {
      if (key === 'htmlTab' || key === 'raw_tabs') {
        normalizedPatch[key] = value
        continue
      }

      const trimmed = value.trim()
      normalizedPatch[key] = trimmed.length > 0 ? trimmed : undefined
      continue
    }

    normalizedPatch[key] = value
  }

  return normalizedPatch as SavedTabPatch
}