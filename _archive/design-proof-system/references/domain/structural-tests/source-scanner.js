import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DOMAIN_DIR = resolve(import.meta.dirname, '..');

export function readSource(relPath) { return readFileSync(resolve(DOMAIN_DIR, relPath), 'utf-8'); }
export function linesOf(src) { return src.split('\n'); }
export function countNonBlankNonComment(src) {
  return linesOf(src).filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*')).length;
}
export function grep(src, pattern) { return [...src.matchAll(pattern)]; }
export function countMatches(src, pattern) { return grep(src, pattern).length; }
export function assertNoMatch(src, pattern, message) {
  const m = grep(src, pattern);
  if (m.length > 0) throw new Error(`${message}: matched ${m.length} times`);
}
export function assertMatchCount(src, pattern, n, message) {
  const m = grep(src, pattern);
  if (m.length !== n) throw new Error(`${message}: expected ${n} matches, got ${m.length}`);
}
