import { getJournalForTeacher } from '../../../services/journal.service'
import { toHttpError } from '../../../utils/http'

function one(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const query = getQuery(event)
  try {
    return await getJournalForTeacher(user, {
      classId: one(query.classId),
      subjectId: one(query.subjectId),
      date: one(query.date),
    })
  } catch (e) {
    throw toHttpError(e)
  }
})
