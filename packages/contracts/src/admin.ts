import { z } from 'zod';

// Routes under /v1/admin are only for CMS operators. Operators are kept apart from the
// learners: a valid token whose user is not an active operator gets 403 NOT_ADMIN.

// GET /v1/admin/me — the operator signed in to the CMS.
export const AdminMeResponse = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.email(),
});
export type AdminMeResponse = z.infer<typeof AdminMeResponse>;
