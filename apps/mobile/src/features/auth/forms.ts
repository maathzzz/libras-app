import { z } from 'zod';

// Same minimum as Supabase Auth's default password policy.
const minPasswordLength = 6;

const email = z.string().trim().pipe(z.email('Digite um e-mail válido.'));
const password = z
  .string()
  .min(minPasswordLength, `A senha precisa ter pelo menos ${minPasswordLength} caracteres.`);

export const SignInForm = z.object({ email, password });
export type SignInValues = z.infer<typeof SignInForm>;

export const SignUpForm = SignInForm.extend({
  name: z.string().trim().min(1, 'Digite seu nome.').max(60, 'Use até 60 caracteres.'),
});
export type SignUpValues = z.infer<typeof SignUpForm>;

export const EmailForm = z.object({ email });
export type EmailValues = z.infer<typeof EmailForm>;

export const NewPasswordForm = z.object({ password });
export type NewPasswordValues = z.infer<typeof NewPasswordForm>;

// The code Supabase sends by e-mail to reset the password.
export const codeLength = 6;
export const CodeForm = z.object({
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${codeLength}}$`), `Digite os ${codeLength} números do código.`),
});
export type CodeValues = z.infer<typeof CodeForm>;

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
