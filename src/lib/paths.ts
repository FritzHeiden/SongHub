import fs from 'fs'
import path from 'path'

function hasSongHubData(dir: string): boolean {
  if (!fs.existsSync(dir)) return false
  try {
    const entries = fs.readdirSync(dir)
    return entries.some(
      (name) =>
        name === 'setlists.json' ||
        name === 'admin' ||
        name.endsWith('.ultimatetab.json'),
    )
  } catch {
    return false
  }
}

function hasRuntimeSettingsFile(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'admin', 'runtime-settings.json'))
}

export function resolveSavedTabsDir(): string {
  const configured = process.env.SONGHUB_SAVED_TABS_DIR?.trim()
  const candidates = [
    configured,
    path.join(process.cwd(), 'saved-tabs'),
    path.join(process.cwd(), 'songhub', 'saved-tabs'),
  ].filter((value): value is string => Boolean(value))

  const withRuntimeSettings = candidates.find((dir) => hasRuntimeSettingsFile(dir))
  if (withRuntimeSettings) return withRuntimeSettings

  const existingWithData = candidates.find((dir) => hasSongHubData(dir))
  if (existingWithData) return existingWithData

  const existing = candidates.find((dir) => fs.existsSync(dir))
  if (existing) return existing

  return candidates[0]
}
