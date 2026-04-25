# @lore-ai-automation/core

> Core engine for [Lore AI](https://lore-ai.vercel.app) — annotation parser, config loader, markdown synthesizer, checker.

## Install

```bash
npm i @lore-ai-automation/core
```

## Use

```ts
import { loadConfig, parseFile, checkAnnotations } from '@lore-ai-automation/core';

const { config } = await loadConfig(process.cwd());
const ann = parseFile('models.py', src, 'python');
const issues = checkAnnotations(ann, config);
```

This package has no CLI of its own. For commands, install [`lore-ai`](https://www.npmjs.com/package/lore-ai).

## License

MIT
