import { z } from 'zod';

// Routes under /v1/admin are only for CMS operators. Operators are kept apart from the
// learners: a valid token whose user is not an active operator gets 403 NOT_ADMIN.

// GET /v1/admin/me — the operator signed in to the CMS.
export const AdminMeResponse = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.email(),
});
export type AdminMeResponse = z.infer<typeof AdminMeResponse>;

// Operators (/v1/admin/operators). Only one role exists: every active operator may do
// everything, including managing the other operators. Operators are deactivated, never
// deleted, and nobody can deactivate themselves, so there is always one active operator.

const OperatorName = z.string().trim().min(1).max(60);

export const AdminOperator = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: OperatorName,
  active: z.boolean(),
});
export type AdminOperator = z.infer<typeof AdminOperator>;

// GET /v1/admin/operators — every operator, active or not, by name.
export const AdminOperatorsResponse = z.object({ operators: z.array(AdminOperator) });
export type AdminOperatorsResponse = z.infer<typeof AdminOperatorsResponse>;

// POST /v1/admin/operators — creates a new account, separate from any learner account: an
// e-mail that already has an account gets 409 EMAIL_HAS_ACCOUNT (an alias such as
// name+cms@gmail.com works).
export const CreateOperatorRequest = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  name: OperatorName,
});
export type CreateOperatorRequest = z.infer<typeof CreateOperatorRequest>;

// A password made by the BFF, shown to the operator who asked for it only once: it is not
// stored anywhere it could be read again. Answer of the create and of
// POST /v1/admin/operators/:userId/password, which replaces a forgotten password.
export const TemporaryPasswordResponse = z.object({
  userId: z.uuid(),
  temporaryPassword: z.string().min(12),
});
export type TemporaryPasswordResponse = z.infer<typeof TemporaryPasswordResponse>;

// PATCH /v1/admin/operators/:userId — renames, deactivates or reactivates. Deactivating
// yourself gets 422 CANNOT_DEACTIVATE_SELF. A deactivated operator loses access at once.
export const UpdateOperatorRequest = z.object({
  name: OperatorName,
  active: z.boolean(),
});
export type UpdateOperatorRequest = z.infer<typeof UpdateOperatorRequest>;
