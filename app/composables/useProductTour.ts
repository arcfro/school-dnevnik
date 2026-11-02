import { driver, type DriveStep } from 'driver.js'
import { stepsForRole } from '~/tours/steps'
import {
  clearTourCompleted,
  isTourCompleted,
  markTourCompleted,
  type TourRole,
} from '~/utils/tour-storage'

function resolveSteps(role: TourRole): DriveStep[] {
  return stepsForRole(role)
    .filter((step) => {
      if (!import.meta.client) return false
      return Boolean(document.querySelector(step.element))
    })
    .map((step) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side,
      },
    }))
}

export function useProductTour() {
  const { user } = useUserSession()
  let active: ReturnType<typeof driver> | null = null

  function destroyActive() {
    active?.destroy()
    active = null
  }

  function startTour(options?: { force?: boolean }) {
    if (!import.meta.client) return
    const u = user.value
    if (!u) return

    const role = u.role as TourRole
    if (!options?.force && isTourCompleted(role, u.id)) return

    const steps = resolveSteps(role)
    if (!steps.length) return

    destroyActive()

    active = driver({
      showProgress: true,
      progressText: '{{current}} из {{total}}',
      nextBtnText: 'Далее',
      prevBtnText: 'Назад',
      doneBtnText: 'Готово',
      showButtons: ['next', 'previous', 'close'],
      steps,
      onDestroyed: () => {
        markTourCompleted(role, u.id)
        active = null
      },
    })

    active.drive()
  }

  function maybeAutoStart(path: string) {
    const u = user.value
    if (!u) return
    const home = roleHome[u.role as TourRole]
    if (path !== home) return
    if (isTourCompleted(u.role as TourRole, u.id)) return

    window.setTimeout(() => startTour(), 400)
  }

  function resetAndStart() {
    const u = user.value
    if (!u) return
    clearTourCompleted(u.role as TourRole, u.id)
    startTour({ force: true })
  }

  onBeforeUnmount(() => destroyActive())

  return { startTour, maybeAutoStart, resetAndStart }
}
