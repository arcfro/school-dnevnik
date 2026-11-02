export const TOUR_VERSION = '1'

export type TourRole = 'admin' | 'teacher' | 'parent'

export function tourStorageKey(role: TourRole, userId: string) {
  return `dnevnik:tour:v${TOUR_VERSION}:${role}:${userId}`
}

export function isTourCompleted(role: TourRole, userId: string): boolean {
  if (!import.meta.client) return true
  return localStorage.getItem(tourStorageKey(role, userId)) === 'done'
}

export function markTourCompleted(role: TourRole, userId: string) {
  if (!import.meta.client) return
  localStorage.setItem(tourStorageKey(role, userId), 'done')
}

export function clearTourCompleted(role: TourRole, userId: string) {
  if (!import.meta.client) return
  localStorage.removeItem(tourStorageKey(role, userId))
}

export function tourNavAnchor(to: string) {
  return `nav-${to.slice(1).replace(/\//g, '-')}`
}
