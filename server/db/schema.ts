import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())

export const users = sqliteTable(
  'users',
  {
    id: id(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'teacher', 'parent'] }).notNull(),
    name: text('name').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
)

export const classes = sqliteTable('classes', {
  id: id(),
  name: text('name').notNull(),
  gradeLevel: text('grade_level'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const students = sqliteTable(
  'students',
  {
    id: id(),
    name: text('name').notNull(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('students_class_id_idx').on(t.classId)],
)

export const subjects = sqliteTable('subjects', {
  id: id(),
  name: text('name').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const classSubjects = sqliteTable(
  'class_subjects',
  {
    id: id(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    teacherUserId: text('teacher_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('class_subjects_class_id_idx').on(t.classId),
    index('class_subjects_subject_id_idx').on(t.subjectId),
    index('class_subjects_teacher_user_id_idx').on(t.teacherUserId),
    uniqueIndex('class_subjects_class_subject_idx').on(t.classId, t.subjectId),
  ],
)

export const parentStudents = sqliteTable(
  'parent_students',
  {
    id: id(),
    parentUserId: text('parent_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('parent_students_parent_user_id_idx').on(t.parentUserId),
    index('parent_students_student_id_idx').on(t.studentId),
    uniqueIndex('parent_students_parent_student_idx').on(t.parentUserId, t.studentId),
  ],
)

export const scheduleSlots = sqliteTable(
  'schedule_slots',
  {
    id: id(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    lessonIndex: integer('lesson_index').notNull(),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'restrict' }),
    teacherUserId: text('teacher_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    room: text('room'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('schedule_slots_class_id_idx').on(t.classId),
    index('schedule_slots_subject_id_idx').on(t.subjectId),
    index('schedule_slots_teacher_user_id_idx').on(t.teacherUserId),
  ],
)

export const gradeEntries = sqliteTable(
  'grade_entries',
  {
    id: id(),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'restrict' }),
    date: text('date').notNull(),
    value: text('value').notNull(),
    type: text('type'),
    teacherUserId: text('teacher_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    comment: text('comment'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('grade_entries_student_id_idx').on(t.studentId),
    index('grade_entries_subject_id_idx').on(t.subjectId),
    index('grade_entries_teacher_user_id_idx').on(t.teacherUserId),
    index('grade_entries_date_idx').on(t.date),
  ],
)

export const attendance = sqliteTable(
  'attendance',
  {
    id: id(),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    scheduleSlotId: text('schedule_slot_id').references(() => scheduleSlots.id, {
      onDelete: 'set null',
    }),
    status: text('status', {
      enum: ['present', 'absent', 'late', 'excused'],
    }).notNull(),
    teacherUserId: text('teacher_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('attendance_student_id_idx').on(t.studentId),
    index('attendance_subject_id_idx').on(t.subjectId),
    index('attendance_schedule_slot_id_idx').on(t.scheduleSlotId),
    index('attendance_teacher_user_id_idx').on(t.teacherUserId),
    index('attendance_date_idx').on(t.date),
  ],
)

export const homework = sqliteTable(
  'homework',
  {
    id: id(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    dueAt: integer('due_at', { mode: 'timestamp' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('homework_class_id_idx').on(t.classId),
    index('homework_subject_id_idx').on(t.subjectId),
    index('homework_created_by_idx').on(t.createdBy),
  ],
)

export const notifications = sqliteTable(
  'notifications',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    readAt: integer('read_at', { mode: 'timestamp' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('notifications_user_id_idx').on(t.userId),
    index('notifications_read_at_idx').on(t.readAt),
  ],
)

export const pushSubscriptions = sqliteTable(
  'push_subscriptions',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('push_subscriptions_user_id_idx').on(t.userId),
    uniqueIndex('push_subscriptions_endpoint_idx').on(t.endpoint),
  ],
)

export const jobs = sqliteTable(
  'jobs',
  {
    id: id(),
    type: text('type').notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    status: text('status', { enum: ['pending', 'processing', 'done', 'failed'] })
      .notNull()
      .default('pending'),
    attempts: integer('attempts').notNull().default(0),
    runAt: integer('run_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastError: text('last_error'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('jobs_status_idx').on(t.status),
    index('jobs_run_at_idx').on(t.runAt),
    index('jobs_type_idx').on(t.type),
  ],
)

export const bitrixLinks = sqliteTable(
  'bitrix_links',
  {
    id: id(),
    localEntity: text('local_entity').notNull(),
    localId: text('local_id').notNull(),
    b24Entity: text('b24_entity').notNull(),
    b24Id: text('b24_id'),
    syncState: text('sync_state', { enum: ['pending', 'synced', 'failed'] })
      .notNull()
      .default('pending'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('bitrix_links_local_idx').on(t.localEntity, t.localId),
    index('bitrix_links_b24_idx').on(t.b24Entity, t.b24Id),
  ],
)
