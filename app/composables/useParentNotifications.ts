export function useParentNotifications() {
  return useFetch<{ unreadCount: number; items: InAppNotification[] }>('/api/parent/notifications', {
    key: 'parent-notifications',
  })
}
