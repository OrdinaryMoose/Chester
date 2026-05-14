import { PHASES, assertExhaustive } from './tags.js';

/** @param {{query: any, facts: any}} ports */
export function getRound(ports) {
  const rows = ports.query.query(['round', [{ var: 'N' }]]);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map(b => b.N));
}

/** @param {{query: any, facts: any}} ports */
export function getPhase(ports) {
  const rows = ports.query.query(['phase', [{ var: 'P' }]]);
  if (rows.length === 0) return PHASES.ESTABLISHMENT;
  const p = rows[0].P;
  return assertExhaustive(p, PHASES, 'PHASES');
}

/** @param {{query: any, facts: any}} ports */
export function advance(ports) {
  const current = getRound(ports);
  ports.facts.retractFact('round', [current]);
  ports.facts.assertFact('round', [current + 1]);
}
