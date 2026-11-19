/**
 * Cleans and formats OCR text extracted from news thumbnails, banners, and media graphics.
 */
export function cleanOcrHeadline(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const lines = rawText.split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length < 3) return false;
      // Filter out publisher badges/logos/watermarks
      if (/crictoday|lifeline|aircel|gulf|subscribe|follow us|youtube/i.test(line)) return false;
      // Must contain at least one word or number
      const tokens = line.match(/[a-zA-Z0-9]+/g) || [];
      return tokens.length >= 1;
    });

  let headline = lines
    .map(line => {
      // Remove trailing noise symbols like |, \, }, ], >, etc.
      return line.replace(/[\\|\]\}\>]+$/g, '').trim();
    })
    .filter(l => l.length >= 2)
    .join(' ');

  // Standardize common sports/news OCR artifacts
  headline = headline
    .replace(/\bvs\s*GSK\b/gi, 'vs CSK')
    .replace(/\bvs\s*CSK\s*T?IPL\b/gi, 'vs CSK | IPL')
    .replace(/\bT?IPL\b/g, 'IPL')
    .replace(/\b2025\s*4[oO0]\b/g, '2025')
    .replace(/\|\s*\{[^}]*\}?/g, '')
    .replace(/[|\\]{2,}/g, '|')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Strip leading non-alphanumeric noise (e.g. stray bracket or quote)
  headline = headline.replace(/^[^a-zA-Z0-9]+/, '');

  return headline;
}

export default cleanOcrHeadline;
