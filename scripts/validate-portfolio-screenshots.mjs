import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.cwd(), 'videos', 'portfolio-screenshots')
const MAX_BYTES = 10 * 1024 * 1024
const MIN_W = 1920
const MIN_H = 1280
const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

function pngSize(file) {
  const buf = readFileSync(file)
  if (buf.length < 24 || buf[0] !== 0x89) return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

let files
try {
  files = readdirSync(dir).filter((f) => {
    const ext = f.slice(f.lastIndexOf('.')).toLowerCase()
    return allowed.has(ext) && /^0[1-7]-.+\.(png|jpe?g|gif|webp)$/i.test(f)
  })
} catch {
  console.error(`Нет папки ${dir} — сначала pnpm screenshots:portfolio`)
  process.exit(1)
}

if (files.length < 7) {
  console.error(`Ожидалось ≥7 файлов, найдено ${files.length}`)
  process.exit(1)
}

for (const name of files.sort()) {
  const path = join(dir, name)
  const size = statSync(path).size
  if (size > MAX_BYTES) {
    console.error(`${name}: ${(size / 1024 / 1024).toFixed(1)} МБ — лимит 10 МБ`)
    process.exit(1)
  }
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  if (ext === '.png') {
    const dim = pngSize(path)
    if (!dim || dim.width < MIN_W || dim.height < MIN_H) {
      console.error(
        `${name}: ${dim ? `${dim.width}×${dim.height}` : '?'} — рекомендуется ≥ ${MIN_W}×${MIN_H}`,
      )
      process.exit(1)
    }
  }
  console.log(`OK ${name} (${(size / 1024).toFixed(0)} КБ)`)
}
