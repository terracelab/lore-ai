import { describe, expect, it } from 'vitest';
import { parseFile } from './parser.js';

describe('parser — Python', () => {
  it('extracts required tags from a docstring', () => {
    const src = `
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False
    @History:
      - 2024-03-15: trial 7일 → 14일
      - 2024-11-02: valid_until NOT NULL 강제
    """
    pass
`;
    const out = parseFile('models.py', src, 'python');
    expect(out).toHaveLength(1);
    const ann = out[0]!;
    expect(ann.domains).toEqual(['subscription/master']);
    expect(ann.businessLogic).toContain('valid_until');
    expect(ann.history).toHaveLength(2);
    expect(ann.history?.[0]?.date).toBe('2024-03-15');
  });

  it('returns empty when no @Domain or @BusinessLogic present', () => {
    const src = `class Foo:\n    """just a docstring"""\n    pass\n`;
    expect(parseFile('foo.py', src, 'python')).toHaveLength(0);
  });
});

describe('parser — TypeScript', () => {
  it('extracts required tags from a JSDoc block', () => {
    const src = `
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 표기
 * @Flow profile-display
 */
export default function ProfileCard(props) { return null }
`;
    const out = parseFile('ProfileCard.tsx', src, 'typescript');
    expect(out).toHaveLength(1);
    const ann = out[0]!;
    expect(ann.domains).toEqual(['auth/profile']);
    expect(ann.flows).toEqual(['profile-display']);
  });
});
