import { describe, expect, it } from 'vitest';
import { groupByCategory } from './extractor.js';
import { isDomainKnown, parseDomainToken, resolveDomainSlug } from './config.js';
import type { LoreConfig } from './config.js';
import type { Annotation } from './types.js';

const domains: LoreConfig['domains'] = {
  auth: { label: '인증', subdomains: ['profile', '프로필 메뉴'] },
  signal: { label: '시그널', subdomains: ['talk', 'pick'] },
};

const ann = (domain: string): Annotation => ({
  file: 'x.ts',
  line: 1,
  domains: [domain],
  businessLogic: 'x',
});

describe('parseDomainToken', () => {
  it('plain English token', () => {
    expect(parseDomainToken('auth')).toEqual({ head: 'auth', sub: undefined });
    expect(parseDomainToken('auth/profile')).toEqual({ head: 'auth', sub: 'profile' });
  });

  it('trims whitespace around slash', () => {
    expect(parseDomainToken('인증 / 프로필')).toEqual({ head: '인증', sub: '프로필' });
    expect(parseDomainToken('auth / profile ')).toEqual({ head: 'auth', sub: 'profile' });
  });

  it('strips trailing parenthesized hint', () => {
    expect(parseDomainToken('인증 / 프로필 메뉴 (Client Component)')).toEqual({
      head: '인증',
      sub: '프로필 메뉴',
    });
    expect(parseDomainToken('auth (Server)')).toEqual({ head: 'auth', sub: undefined });
  });

  it('empty / undefined inputs', () => {
    expect(parseDomainToken('')).toEqual({ head: '', sub: undefined });
    expect(parseDomainToken('  ')).toEqual({ head: '', sub: undefined });
  });
});

describe('resolveDomainSlug', () => {
  it('returns slug for direct English key', () => {
    expect(resolveDomainSlug('auth', domains)).toBe('auth');
  });

  it('returns slug when matched by Korean label', () => {
    expect(resolveDomainSlug('인증', domains)).toBe('auth');
    expect(resolveDomainSlug('시그널', domains)).toBe('signal');
  });

  it('returns undefined for unknown', () => {
    expect(resolveDomainSlug('unknown', domains)).toBeUndefined();
    expect(resolveDomainSlug('', domains)).toBeUndefined();
  });
});

describe('isDomainKnown', () => {
  it('English slug', () => {
    expect(isDomainKnown('auth', domains)).toBe(true);
    expect(isDomainKnown('auth/profile', domains)).toBe(true);
    expect(isDomainKnown('auth/unknown', domains)).toBe(false);
  });

  it('Korean label as head', () => {
    expect(isDomainKnown('인증', domains)).toBe(true);
    expect(isDomainKnown('인증/프로필 메뉴', domains)).toBe(true);
    expect(isDomainKnown('인증/없음', domains)).toBe(false);
  });

  it('whitespace around slash + trailing parens', () => {
    expect(isDomainKnown('인증 / 프로필 메뉴 (Client Component)', domains)).toBe(true);
    expect(isDomainKnown('auth / profile (Server)', domains)).toBe(true);
  });

  it('rejects unknown head', () => {
    expect(isDomainKnown('billing', domains)).toBe(false);
    expect(isDomainKnown('알수없음/x', domains)).toBe(false);
  });

  it('empty subdomains list = head-only namespace (sub validation OFF)', () => {
    const open: LoreConfig['domains'] = {
      auth: { label: '인증', subdomains: [] },
      free: { label: '자유', subdomains: [] },
    };
    // sub 가 무엇이든 통과 (head 만 검증)
    expect(isDomainKnown('auth/profile', open)).toBe(true);
    expect(isDomainKnown('auth/임의의 한국어 라벨', open)).toBe(true);
    expect(isDomainKnown('인증 / 프로필 메뉴 (Client Component)', open)).toBe(true);
    expect(isDomainKnown('자유/anything goes', open)).toBe(true);
    // head 가 unknown 이면 여전히 false
    expect(isDomainKnown('unknown/x', open)).toBe(false);
  });
});

describe('groupByCategory with domains', () => {
  it('canonicalizes Korean labels into English slug buckets', () => {
    const all = [ann('인증 / 프로필 (Client Component)'), ann('auth/profile'), ann('signal/talk')];
    const grouped = groupByCategory(all, domains);
    expect(grouped.get('auth')?.length).toBe(2);
    expect(grouped.get('signal')?.length).toBe(1);
    expect(grouped.has('인증')).toBe(false);
  });

  it('legacy mode (no domains) keeps raw head, trimmed', () => {
    const all = [ann('auth/profile'), ann('signal / talk')];
    const grouped = groupByCategory(all);
    expect(grouped.has('auth')).toBe(true);
    expect(grouped.has('signal')).toBe(true);
  });

  it('falls through unknown head as a slug fallback', () => {
    const all = [ann('mystery/x')];
    const grouped = groupByCategory(all, domains);
    expect(grouped.has('mystery')).toBe(true);
  });
});
