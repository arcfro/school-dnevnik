import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

function ffmpegInDir(dir) {
  const name = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  const direct = join(dir, name)
  if (existsSync(direct)) return direct
  const nested = join(dir, 'ffmpeg', name)
  if (existsSync(nested)) return nested
  return null
}

/** Playwright качает ffmpeg в ms-playwright; иначе — ffmpeg из PATH. */
export function resolveFfmpeg() {
  if (process.env.PLAYWRIGHT_FFMPEG_EXECUTABLE) {
    return process.env.PLAYWRIGHT_FFMPEG_EXECUTABLE
  }

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(homedir(), 'Library', 'Caches', 'ms-playwright'),
    join(homedir(), '.cache', 'ms-playwright'),
  ].filter(Boolean)

  for (const root of roots) {
    let entries = []
    try {
      entries = readdirSync(root)
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.startsWith('ffmpeg-')) continue
      const bin = ffmpegInDir(join(root, entry))
      if (bin) return bin
    }
  }

  return 'ffmpeg'
}
