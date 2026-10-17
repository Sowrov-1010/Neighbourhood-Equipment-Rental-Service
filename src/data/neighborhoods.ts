export const NEIGHBORHOODS = [
  'Hamlet Tower',
  'Nazrul Palace',
  'Al Imtiaz Residence',
  'Sigma Tower',
  'Aura villa',
] as const;

const LEGACY_NEIGHBORHOODS: Record<string, (typeof NEIGHBORHOODS)[number]> = {
  'District Municipal Center': 'Hamlet Tower',
  'Elmwood Heights': 'Hamlet Tower',
  'Oakridge North': 'Nazrul Palace',
  'West Elm Park': 'Al Imtiaz Residence',
  'Riverdale Commons': 'Sigma Tower',
  'Oakridge South': 'Sigma Tower',
  'Highland Terrace': 'Aura villa',
  'Highland Glen': 'Aura villa',
};

export function normalizeNeighborhoodName(name: string): string {
  return LEGACY_NEIGHBORHOODS[name] || name;
}
