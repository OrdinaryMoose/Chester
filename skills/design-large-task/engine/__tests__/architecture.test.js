import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

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
