/** Stable accent per subject for schedule stripes and chips. */
export function subjectColorVars(subjectId: string): Record<string, string> {
  let hash = 0
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return {
    '--subject-color': `hsl(${hue} 52% 42%)`,
    '--subject-tint': `hsl(${hue} 55% 94%)`,
  }
}
