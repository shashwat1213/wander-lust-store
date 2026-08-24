import { slugify } from './slugify';

describe('slugify', () => {
  it.each([
    ["Men's Running Shoes!", 'mens-running-shoes'],
    ['  Hello   World  ', 'hello-world'],
    ['Café Crème', 'cafe-creme'],
    ['Already-Slugged', 'already-slugged'],
    ['Multiple---Hyphens', 'multiple-hyphens'],
    ['UPPER lower 123', 'upper-lower-123'],
  ])('converts %j to %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('produces an empty string for input with no slug-able characters', () => {
    expect(slugify('!!!')).toBe('');
  });
});
