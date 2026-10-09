import { exigirAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = await exigirAdmin(event)
  return { ok: true, email: admin.email }
})
