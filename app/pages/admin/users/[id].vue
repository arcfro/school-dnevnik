<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type AdminUser = {
  id: string
  email: string
  role: 'admin' | 'teacher' | 'parent'
  name: string
}

type Student = { id: string; name: string; classId: string; className: string }

type ParentLink = {
  id: string
  parentUserId: string
  studentId: string
  studentName: string
  classId: string
  className: string
}

const route = useRoute()
const toast = useToast()
const userId = computed(() => String(route.params.id))

const { data: account, error: userError } = await useFetch<AdminUser>(
  () => `/api/admin/users/${userId.value}`,
)
const { data: links, refresh: refreshLinks } = await useFetch<ParentLink[]>(
  () => '/api/admin/parent-students',
  { query: { parentUserId: userId } },
)
const { data: studentList } = await useFetch<Student[]>('/api/admin/students')

const studentId = ref('')
const saving = ref(false)

const linkedIds = computed(() => new Set((links.value ?? []).map((row) => row.studentId)))
const availableStudents = computed(() =>
  (studentList.value ?? []).filter((student) => !linkedIds.value.has(student.id)),
)

watch(
  availableStudents,
  (list) => {
    if (!list.some((s) => s.id === studentId.value)) {
      studentId.value = list[0]?.id ?? ''
    }
  },
  { immediate: true },
)

async function onLink() {
  if (!studentId.value) {
    toast.error('Выберите ученика')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/parent-students', {
      method: 'POST',
      body: { parentUserId: userId.value, studentId: studentId.value },
    })
    await refreshLinks()
    toast.success('Ученик привязан')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось привязать ученика'))
  } finally {
    saving.value = false
  }
}

async function onUnlink(id: string, name: string) {
  if (!confirm(`Отвязать ученика «${name}»?`)) return
  try {
    await $fetch(`/api/admin/parent-students/${id}`, { method: 'DELETE' })
    await refreshLinks()
    toast.success('Связь снята')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось отвязать ученика'))
  }
}
</script>

<template>
  <div class="stack">
    <p v-if="userError" class="page-card form-error">
      {{ apiErrorMessage(userError, 'Пользователь не найден') }}
    </p>
    <template v-else-if="account">
      <section class="page-card">
        <div class="page-head">
          <div>
            <p class="muted">
              <NuxtLink to="/admin/users">← Пользователи</NuxtLink>
            </p>
            <h1>{{ account.name }}</h1>
            <p class="muted">{{ account.email }} · {{ roleLabel[account.role] }}</p>
          </div>
        </div>
      </section>

      <section v-if="account.role === 'parent'" class="page-card stack">
        <h2>Дети</h2>
        <p v-if="!studentList?.length" class="muted">
          Нет учеников. Сначала добавьте их в классе.
        </p>
        <p v-else-if="!availableStudents.length" class="muted">Все ученики уже привязаны.</p>
        <form v-else class="inline-form" @submit.prevent="onLink">
          <label class="field">
            Ученик
            <select v-model="studentId" required>
              <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                {{ student.name }} ({{ student.className }})
              </option>
            </select>
          </label>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ saving ? 'Сохраняем…' : 'Привязать' }}
          </button>
        </form>
        <p v-if="!links?.length" class="muted">Детей пока нет.</p>
        <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ученик</th>
              <th>Класс</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in links" :key="row.id">
              <td>{{ row.studentName }}</td>
              <td>
                <NuxtLink :to="`/admin/classes/${row.classId}`">{{ row.className }}</NuxtLink>
              </td>
              <td>
                <button class="btn btn-danger" type="button" @click="onUnlink(row.id, row.studentName)">
                  Отвязать
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </section>
    </template>
  </div>
</template>
