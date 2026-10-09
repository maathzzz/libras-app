import { z } from 'zod';

// Same minimum as Supabase Auth's default password policy.
const minPasswordLength = 6;

export const SignInForm = z.object({
  email: z.string().trim().pipe(z.email('Digite um e-mail válido.')),
  password: z
    .string()
    .min(minPasswordLength, `A senha precisa ter pelo menos ${minPasswordLength} caracteres.`),
});
export type SignInValues = z.infer<typeof SignInForm>;

export const SignUpForm = SignInForm.extend({
  name: z.string().trim().min(1, 'Digite seu nome.').max(60, 'Use até 60 caracteres.'),
});
export type SignUpValues = z.infer<typeof SignUpForm>;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** The first message of each invalid field, ready to show under it. */
export function fieldErrors<T>(error: z.ZodError<T>): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T | undefined;
    if (field !== undefined && errors[field] === undefined) errors[field] = issue.message;
  }
  return errors;
}
