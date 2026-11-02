import { describe, expect, it } from 'vitest'
import { tourNavAnchor, tourStorageKey } from '../../app/utils/tour-storage'

describe('tour-storage', () => {
  it('builds versioned storage key', () => {
    expect(tourStorageKey('parent', 'u1')).toBe('dnevnik:tour:v1:parent:u1')
  })

  it('maps nav routes to data-tour anchors', () => {
    expect(tourNavAnchor('/parent/grades')).toBe('nav-parent-grades')
    expect(tourNavAnchor('/admin/classes')).toBe('nav-admin-classes')
  })
})
