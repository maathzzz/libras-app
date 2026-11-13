// "Olá, Matheus" with the first name only, so it fits beside the home's streak and XP.
// Just "Olá!" while the profile has not loaded.
export function greetingLabel(name: string | null): string {
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName ? `Olá, ${firstName}` : 'Olá!';
}
