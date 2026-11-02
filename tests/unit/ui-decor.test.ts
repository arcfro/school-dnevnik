import { describe, expect, it } from 'vitest'
import { gradeTone } from '../../app/utils/grade-tone'
import { homeworkDueTone } from '../../app/utils/homework'
import { subjectColorVars } from '../../app/utils/subject-color'

describe('ui decor utils', () => {
  it('maps numeric grades to tones', () => {
    expect(gradeTone('5')).toBe('excellent')
    expect(gradeTone('4')).toBe('good')
    expect(gradeTone('3')).toBe('mid')
    expect(gradeTone('2')).toBe('low')
  })

  it('returns stable subject colors', () => {
    const a = subjectColorVars('math-id')
    const b = subjectColorVars('math-id')
    expect(a['--subject-color']).toBe(b['--subject-color'])
    expect(a['--subject-color']).toMatch(/^hsl\(/)
  })

  it('classifies homework due tones', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    expect(homeworkDueTone(`${y}-${m}-${d}`)).toBe('today')
    expect(homeworkDueTone(null)).toBe('open')
  })
})
