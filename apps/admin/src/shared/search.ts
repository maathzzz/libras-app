// Accents and case do not matter when searching: "cao" finds "Cão".
export const normalized = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
