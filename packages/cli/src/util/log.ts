import kleur from 'kleur';

export const log = {
  info: (msg: string) => console.log(kleur.cyan('ℹ'), msg),
  success: (msg: string) => console.log(kleur.green('✓'), msg),
  warn: (msg: string) => console.log(kleur.yellow('⚠'), msg),
  error: (msg: string) => console.error(kleur.red('✗'), msg),
  hint: (msg: string) => console.log(kleur.gray('  '), kleur.gray(msg)),
  divider: () => console.log(kleur.gray('—'.repeat(60))),
};
