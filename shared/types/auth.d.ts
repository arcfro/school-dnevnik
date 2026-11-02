declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    role: 'admin' | 'teacher' | 'parent'
    name: string
  }
}

declare module '#app' {
  interface PageMeta {
    roles?: Array<'admin' | 'teacher' | 'parent'>
  }
}

export {}
