// Utility functions for normalizing and canonicalizing names.
// Removes accents, converts to lowercase and strips leading articles
// so comparisons against API data are reliable.
export const canonicalize = (str) => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};
