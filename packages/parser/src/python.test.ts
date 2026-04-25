import { describe, expect, it } from 'vitest';
import { pythonSubstantive } from './python.js';

describe('pythonSubstantive', () => {
  it('counts non-import non-comment non-pass lines', () => {
    const src = `# comment
import os
from typing import Any

class Foo:
    """docstring"""
    bar = 1
    def __init__(self):
        self.x = 2
`;
    const r = pythonSubstantive(src, 5);
    expect(r.substantiveLines).toBeGreaterThanOrEqual(3);
    expect(r.totalLines).toBeGreaterThan(8);
  });

  it('flags pass-only stubs as not substantive', () => {
    const src = `class Foo:\n    pass\n`;
    expect(pythonSubstantive(src, 5).isSubstantive).toBe(false);
  });
});
