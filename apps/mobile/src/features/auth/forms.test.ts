import { fieldErrors, SignInForm, SignUpForm } from './forms';

describe('SignInForm', () => {
  it('accepts a valid e-mail and password, trimming the e-mail', () => {
    expect(SignInForm.parse({ email: ' ana@exemplo.com ', password: 'segredo1' })).toEqual({
      email: 'ana@exemplo.com',
      password: 'segredo1',
    });
  });

  it('explains each invalid field in Portuguese', () => {
    const result = SignInForm.safeParse({ email: 'ana', password: '123' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrors(result.error)).toEqual({
      email: 'Digite um e-mail válido.',
      password: 'A senha precisa ter pelo menos 6 caracteres.',
    });
  });
});

describe('SignUpForm', () => {
  it('requires a name', () => {
    const result = SignUpForm.safeParse({
      name: '  ',
      email: 'ana@exemplo.com',
      password: 'segredo1',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrors(result.error)).toEqual({ name: 'Digite seu nome.' });
  });
});
