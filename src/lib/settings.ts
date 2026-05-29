import fs from 'fs'
import path from 'path'
import { resolveSavedTabsDir } from './paths'

interface RuntimeSettings {
  musicianMarkingEnabled?: boolean
}

const truthy = new Set(['1', 'true', 'yes', 'on'])

const SAVED_TABS_DIR = resolveSavedTabsDir()
const ADMIN_DATA_DIR = path.join(SAVED_TABS_DIR, 'admin')
const SETTINGS_FILE = path.join(ADMIN_DATA_DIR, 'runtime-settings.json')
const LEGACY_SETTINGS_FILE = path.join(process.cwd(), 'config', 'runtime-settings.json')

function ensureConfigDir() {
  if (!fs.existsSync(ADMIN_DATA_DIR)) {
    fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true })
  }

  if (!fs.existsSync(SETTINGS_FILE) && fs.existsSync(LEGACY_SETTINGS_FILE)) {
    try {
      fs.copyFileSync(LEGACY_SETTINGS_FILE, SETTINGS_FILE)
    } catch {
      // ignore migration errors; we can still continue with defaults
    }
  }
}

function readRuntimeSettings(): RuntimeSettings {
  ensureConfigDir()
  if (!fs.existsSync(SETTINGS_FILE)) return {}

  try {
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeRuntimeSettings(next: RuntimeSettings) {
  ensureConfigDir()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf-8')
}

function envDefaultMusicianMarkingEnabled(): boolean {
  const raw = process.env.SONGHUB_FEATURE_MUSICIAN_MARKING
  if (typeof raw === 'undefined') return false
  return truthy.has(String(raw).trim().toLowerCase())
}

export function getMusicianMarkingEnabled(): boolean {
  const settings = readRuntimeSettings()
  if (typeof settings.musicianMarkingEnabled === 'boolean') {
    return settings.musicianMarkingEnabled
  }
  return envDefaultMusicianMarkingEnabled()
}

export function setMusicianMarkingEnabled(enabled: boolean): boolean {
  const current = readRuntimeSettings()
  current.musicianMarkingEnabled = Boolean(enabled)
  writeRuntimeSettings(current)
  return current.musicianMarkingEnabled
}
