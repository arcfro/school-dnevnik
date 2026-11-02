<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type Klass = { id: string; name: string; gradeLevel: string | null }
type Student = { id: string; name: string; classId: string }
type Subject = { id: string; name: string }
type Teacher = { id: string; name: string; email: string }
type ClassSubject = {
  id: string
  subjectId: string
  teacherUserId: string
  subjectName: string
  teacherName: string
}

const route = useRoute()
const toast = useToast()
const classId = computed(() => String(route.params.id))

const { data: klass, error: classError, refresh: refreshClass } = await useFetch<Klass>(
  () => `/api/admin/classes/${classId.value}`,
)
const { data: studentList, refresh: refreshStudents } = await useFetch<Student[]>(
  () => '/api/admin/students',
  { query: { classId } },
)
const { data: assignments, refresh: refreshAssignments } = await useFetch<ClassSubject[]>(
  () => '/api/admin/class-subjects',
  { query: { classId } },
)
const { data: subjectList } = await useFetch<Subject[]>('/api/admin/subjects')
const { data: teacherList } = await useFetch<Teacher[]>('/api/admin/teachers')

const studentName = ref('')
const savingStudent = ref(false)
const subjectId = ref('')
const teacherUserId = ref('')
const savingAssign = ref(false)
const deleting = ref(false)

watch(
  subjectList,
  (list) => {
    if (!subjectId.value && list?.[0]) subjectId.value = list[0].id
  },
  { immediate: true },
)
watch(
  teacherList,
  (list) => {
    if (!teacherUserId.value && list?.[0]) teacherUserId.value = list[0].id
  },
  { immediate: true },
)

async function onAddStudent() {
  const trimmed = studentName.value.trim()
  if (!trimmed) {
    toast.error('Укажите имя ученика')
    return
  }
  savingStudent.value = true
  try {
    await $fetch('/api/admin/students', {
      method: 'POST',
      body: { classId: classId.value, name: trimmed },
    })
    studentName.value = ''
    await Promise.all([refreshStudents(), refreshClass()])
    toast.success('Ученик добавлен')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось добавить ученика'))
  } finally {
    savingStudent.value = false
  }
}

async function onDeleteStudent(id: string, name: string) {
  if (!confirm(`Удалить ученика «${name}»?`)) return
  try {
    await $fetch(`/api/admin/students/${id}`, { method: 'DELETE' })
    await Promise.all([refreshStudents(), refreshClass()])
    toast.success('Ученик удалён')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось удалить ученика'))
  }
}

async function onAssign() {
  if (!subjectId.value) {
    toast.error('Выберите предмет')
    return
  }
  if (!teacherUserId.value) {
    toast.error('Выберите учителя')
    return
  }
  savingAssign.value = true
  try {
    await $fetch('/api/admin/class-subjects', {
      method: 'POST',
      body: {
        classId: classId.value,
        subjectId: subjectId.value,
        teacherUserId: teacherUserId.value,
      },
    })
    await refreshAssignments()
    toast.success('Предмет назначен')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось назначить предмет'))
  } finally {
    savingAssign.value = false
  }
}

async function onUnassign(id: string, name: string) {
  if (!confirm(`Снять предмет «${name}» с класса?`)) return
  try {
    await $fetch(`/api/admin/class-subjects/${id}`, { method: 'DELETE' })
    await refreshAssignments()
    toast.success('Назначение снято')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось снять предмет'))
  }
}

async function onDeleteClass() {
  if (!klass.value) return
  if (!confirm(`Удалить класс «${klass.value.name}» и всех его учеников?`)) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/classes/${classId.value}`, { method: 'DELETE' })
    toast.success('Класс удалён')
    await navigateTo('/admin/classes')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось удалить класс'))
    deleting.value = false
  }
}
</script>

<template>
  <div class="stack">
    <p v-if="classError" class="page-card form-error">{{ apiErrorMessage(classError, 'Класс не найден') }}</p>
    <template v-else-if="klass">
      <section class="page-card">
        <div class="page-head">
          <div>
            <p class="muted">
              <NuxtLink to="/admin/classes">← Классы</NuxtLink>
            </p>
            <h1>{{ klass.name }}</h1>
            <p v-if="klass.gradeLevel" class="muted">Параллель {{ klass.gradeLevel }}</p>
          </div>
          <button class="btn btn-danger" type="button" :disabled="deleting" @click="onDeleteClass">
            Удалить класс
          </button>
        </div>
      </section>

      <section class="page-card stack">
        <h2>Ученики</h2>
        <form class="inline-form" @submit.prevent="onAddStudent">
          <label class="field">
            Имя
            <input v-model="studentName" required maxlength="120" placeholder="Иванов Иван">
          </label>
          <button class="btn btn-primary" type="submit" :disabled="savingStudent">
            {{ savingStudent ? 'Сохраняем…' : 'Добавить' }}
          </button>
        </form>
        <p v-if="!studentList?.length" class="muted">Учеников пока нет.</p>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in studentList" :key="student.id">
              <td>{{ student.name }}</td>
              <td>
                <button class="btn btn-danger" type="button" @click="onDeleteStudent(student.id, student.name)">
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="page-card stack">
        <h2>Предметы класса</h2>
        <p v-if="!teacherList?.length" class="muted">
          Нет учителей. Сначала заведите пользователя с ролью учителя.
        </p>
        <p v-else-if="!subjectList?.length" class="muted">
          Нет предметов. Добавьте их в разделе «Предметы».
        </p>
        <form v-else class="inline-form" @submit.prevent="onAssign">
          <label class="field">
            Предмет
            <select v-model="subjectId" required>
              <option v-for="subject in subjectList" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </label>
          <label class="field">
            Учитель
            <select v-model="teacherUserId" required>
              <option v-for="teacher in teacherList" :key="teacher.id" :value="teacher.id">
                {{ teacher.name }}
              </option>
            </select>
          </label>
          <button class="btn btn-primary" type="submit" :disabled="savingAssign">
            {{ savingAssign ? 'Сохраняем…' : 'Назначить' }}
          </button>
        </form>
        <p v-if="!assignments?.length" class="muted">Предметы ещё не назначены.</p>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Учитель</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in assignments" :key="row.id">
              <td>{{ row.subjectName }}</td>
              <td>{{ row.teacherName }}</td>
              <td>
                <button class="btn btn-danger" type="button" @click="onUnassign(row.id, row.subjectName)">
                  Снять
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
