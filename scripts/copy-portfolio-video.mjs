import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { resolveFfmpeg } from './ffmpeg-bin.mjs'

const root = process.cwd()
const searchRoots = [
  join(root, 'videos', '.playwright-output'),
  join(root, 'test-results'),
]

const MAX_BYTES = 50 * 1024 * 1024
const MAX_SEC = 75
const MIN_W = 660
const MIN_H = 165

function walk(dir, acc = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name === 'video.webm') acc.push(p)
  }
  return acc
}

function probeDurationSec(ffmpeg, file) {
  try {
    const out = execFileSync(ffmpeg, ['-hide_banner', '-i', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    void out
  } catch (err) {
    const text = `${err.stdout ?? ''}${err.stderr ?? ''}`
    const m = text.match(/Duration:\s(\d+):(\d+):(\d+(?:\.\d+)?)/)
    if (!m) return null
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
  }
  return null
}

function probeSize(ffmpeg, file) {
  try {
    const out = execFileSync(
      ffmpeg,
      ['-hide_banner', '-i', file, '-f', 'null', '-'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    void out
  } catch (err) {
    const text = `${err.stderr ?? ''}`
    const m = text.match(/,\s(\d+)x(\d+)/)
    if (!m) return null
    return { width: Number(m[1]), height: Number(m[2]) }
  }
  return null
}

function encodeMp4(ffmpeg, webm, mp4, crf) {
  execFileSync(
    ffmpeg,
    [
      '-y',
      '-i',
      webm,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      String(crf),
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      mp4,
    ],
    { stdio: 'inherit' },
  )
}

const videos = searchRoots.flatMap((d) => walk(d))
if (!videos.length) {
  console.error('video.webm не найден — сначала запусти pnpm record:portfolio')
  process.exit(1)
}

videos.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
const latest = videos[0]
const outDir = join(root, 'videos')
const mp4Out = join(outDir, 'teacher-portfolio-45s.mp4')

mkdirSync(outDir, { recursive: true })

const ffmpeg = resolveFfmpeg()
let crf = 23
encodeMp4(ffmpeg, latest, mp4Out, crf)
while (statSync(mp4Out).size > MAX_BYTES && crf < 32) {
  crf += 2
  encodeMp4(ffmpeg, latest, mp4Out, crf)
}

const size = statSync(mp4Out).size
const duration = probeDurationSec(ffmpeg, mp4Out)
const dimensions = probeSize(ffmpeg, mp4Out)

if (size > MAX_BYTES) {
  console.error(`MP4 ${(size / 1024 / 1024).toFixed(1)} МБ — лимит 50 МБ`)
  process.exit(1)
}
if (duration != null && duration > MAX_SEC) {
  console.error(`Длительность ${duration.toFixed(1)} с — лимит ${MAX_SEC} с`)
  process.exit(1)
}
if (dimensions && (dimensions.width < MIN_W || dimensions.height < MIN_H)) {
  console.error(`Размер ${dimensions.width}×${dimensions.height} — минимум ${MIN_W}×${MIN_H}`)
  process.exit(1)
}

for (const legacy of ['teacher-portfolio-30s.webm', 'teacher-portfolio-30s.mp4']) {
  try {
    unlinkSync(join(outDir, legacy))
  } catch {
    /* старый артефакт */
  }
}

console.log(
  `Готово: ${mp4Out} (${(size / 1024 / 1024).toFixed(2)} МБ` +
    (duration != null ? `, ${duration.toFixed(1)} с` : '') +
    (dimensions ? `, ${dimensions.width}×${dimensions.height}` : '') +
    ')',
)
