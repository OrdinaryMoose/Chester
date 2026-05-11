/**
 * Shared utility for fact-key derivation. Used by Evaluator, Engine, and Explain
 * to address the IDB Map consistently. Centralizing here ensures any future change
 * to the key format propagates everywhere.
 */
export const factKey = (pred, args) => `${pred}/${args.length}:${JSON.stringify(args)}`;
