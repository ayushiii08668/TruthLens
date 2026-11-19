/**
 * Cleans and formats OCR text extracted from news thumbnails or media graphics.
 */
export function cleanOcrHeadline(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const lines = rawText.split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length < 3) return false;
      if (/crictoday|lifeline|aircel|gulf|subscribe|follow us|youtube/i.test(line)) return false;
      const letters = (line.match(/[a-zA-Z]{2,}/g) || []).length;
      return letters >= 1;
    });

  let headline = lines
    .map(l => l.replace(/^[^\w\d]+|[^\w\d]+$/g, ''))
    .filter(l => l.length >= 2)
    .join(' ');

  headline = headline
    .replace(/\bvs\s*GSK\b/gi, 'vs CSK')
    .replace(/\bT?IPL\b/g, 'IPL')
    .replace(/\b2025\s*4[oO0]\b/g, 'IPL 2025')
    .replace(/\|\s*\{[^}]*\}?/g, '')
    .replace(/[|\\]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return headline;
}

export default cleanOcrHeadline;
