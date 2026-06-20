// Les 24 gouvernorats de Tunisie, triés par ordre alphabétique.
const RAW_TUNISIA_GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan',
  'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir', 'Nabeul',
  'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

export const TUNISIA_GOVERNORATES: string[] = [...RAW_TUNISIA_GOVERNORATES].sort((a, b) =>
  a.localeCompare(b, 'fr')
);
