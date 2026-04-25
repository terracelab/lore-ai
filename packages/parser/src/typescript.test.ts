import { describe, expect, it } from 'vitest';
import { typescriptSubstantive } from './typescript.js';

describe('typescriptSubstantive', () => {
  it('skips imports and type-only lines', () => {
    const src = `import { foo } from './foo';
type Props = { x: number };
interface Bar { y: string }

export function Component(props: Props) {
  const v = props.x + 1;
  return v;
}
`;
    const r = typescriptSubstantive(src, 3);
    expect(r.isSubstantive).toBe(true);
    expect(r.substantiveLines).toBeGreaterThanOrEqual(3);
  });

  it('handles block comments', () => {
    const src = `/*\n * doc\n */\nexport const x = 1;\n`;
    expect(typescriptSubstantive(src, 1).substantiveLines).toBe(1);
  });
});
