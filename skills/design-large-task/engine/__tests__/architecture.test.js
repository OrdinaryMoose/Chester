import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Engine } from '../Engine.js';

describe('engine architecture compliance', () => {
  it('package.json declares no runtime dependencies', () => {
    const pkgPath = join(import.meta.dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies).toBeUndefined();
  });

  it('package.json declares ES module type', () => {
    const pkgPath = join(import.meta.dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.type).toBe('module');
  });
});

describe('Architectural compliance', () => {
  it('Engine exposes the six substrate ports', () => {
    const e = new Engine();
    // IFactStore
    expect(typeof e.assertFact).toBe('function');
    expect(typeof e.retractFact).toBe('function');
    expect(typeof e.factExists).toBe('function');
    // IRuleStore
    expect(typeof e.defineRule).toBe('function');
    expect(typeof e.undefineRule).toBe('function');
    expect(typeof e.getRule).toBe('function');
    // IQueryEngine
    expect(typeof e.derive).toBe('function');
    expect(typeof e.query).toBe('function');
    expect(typeof e.count).toBe('function');
    expect(typeof e.exists).toBe('function');
    expect(typeof e.isDerived).toBe('function');
    // ISnapshotRestore
    expect(typeof e.snapshot).toBe('function');
    expect(typeof e.restore).toBe('function');
    // IExplain
    expect(typeof e.explain).toBe('function');
    // ITransaction
    expect(typeof e.begin).toBe('function');
    expect(typeof e.commit).toBe('function');
    expect(typeof e.rollback).toBe('function');
  });
});
