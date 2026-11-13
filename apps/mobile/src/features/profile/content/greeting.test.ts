import { greetingLabel } from './greeting';

describe('greetingLabel', () => {
  it('greets by the first name', () => {
    expect(greetingLabel('Matheus de Amorim')).toBe('Olá, Matheus');
    expect(greetingLabel('  Ana  ')).toBe('Olá, Ana');
  });

  it('greets without a name while the profile is not loaded', () => {
    expect(greetingLabel(null)).toBe('Olá!');
  });
});
