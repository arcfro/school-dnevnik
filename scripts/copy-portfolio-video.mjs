import { cpSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const searchRoots = [
  join(root, 'videos', '.playwright-output'),
  join(root, 'test-results'),
]

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

const videos = searchRoots.flatMap((d) => walk(d))
if (!videos.length) {
  console.error('video.webm не найден — сначала запусти pnpm record:portfolio')
  process.exit(1)
}

videos.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
const latest = videos[0]
const outDir = join(root, 'videos')
const outFile = join(outDir, 'teacher-portfolio-30s.webm')

mkdirSync(outDir, { recursive: true })
cpSync(latest, outFile)
console.log(`Готово: ${outFile}`)
