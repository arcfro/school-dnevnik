self.addEventListener('push', (event) => {
  let data = {
    title: 'Уведомление',
    body: 'Новое уведомление в дневнике',
    url: '/parent/notifications',
  }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // keep defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url || '/parent/notifications' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/parent/notifications'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client && url) client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
