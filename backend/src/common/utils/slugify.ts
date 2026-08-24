/**
 * Converts an arbitrary string into a URL-safe slug.
 * e.g. "Men's Running Shoes!" -> "mens-running-shoes"
 */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '') // drop apostrophes/quotes so "men's" -> "mens"
    .replace(/[^a-z0-9]+/g, '-') // remaining non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .replace(/-{2,}/g, '-'); // collapse repeats
}
