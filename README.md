# eslint-plugin-opinionated-imports

![Example imports sorted by type, uppercase before lowercase, and alphabetically within each group](https://raw.githubusercontent.com/chefhasteeth/eslint-plugin-opinionated-imports/master/example.png)

I made this plugin because I'm very particular about how imports are formatted in my code (self proclaimed bikeshed enjoyer). I've never been a fan of sorting imports based on origin, but based on symbol instead. A few ground rules apply to every group:

1. Symbols are sorted alphabetically.
2. Uppercase is before lowercase.
3. There are never blank lines between different groups of imports.

## Ordering

| Priority | Declaration |
| --- | --- |
| 1 | Explicit `import type`, including default and namespace type imports |
| 2 | Named imports whose first local binding starts uppercase |
| 3 | Named imports whose first local binding starts lowercase |
| 4 | Uppercase default import |
| 5 | Lowercase default import |
| 6 | Namespace import (`import * as name`) |
| 7 | Side-effect import (`import 'file'`) or empty `import {} from 'file'` |

## Options

There are none. It's very opinionated!

## Setup

This directory is a working local package; it has not been published to npm. From your consuming project:

```sh
npm install --save-dev eslint /path/to/eslint-opinionated-imports
```

In `eslint.config.mjs`:

```js
import opinionatedImports from 'eslint-plugin-opinionated-imports';

export default [opinionatedImports.configs.recommended];
```

Or enable the rule explicitly:

```js
import opinionatedImports from 'eslint-plugin-opinionated-imports';

export default [{
  plugins: { 'opinionated-imports': opinionatedImports },
  rules: { 'opinionated-imports/sort-imports': 'error' },
}];
```

For TypeScript, install `@typescript-eslint/parser` and configure it for your TypeScript files:

```js
import tsParser from '@typescript-eslint/parser';
import opinionatedImports from 'eslint-plugin-opinionated-imports';

export default [{
  ...opinionatedImports.configs.recommended,
  files: ['**/*.{ts,tsx,mts,cts}'],
  languageOptions: { parser: tsParser },
}];
```

Run `npx eslint . --fix`. Requires ESLint 9 or 10 and a Node version supported by your ESLint release (at least Node 20.19). Both CommonJS `require` and ESM default imports work. Configuration follows ESLint's [flat config plugin format](https://eslint.org/docs/latest/use/configure/plugins).

Disable other import ordering or grouping rules when enabling this rule to avoid conflicting fixes. The rule has no options.

## Development

```sh
npm install
npm test
npm run lint
```

The package has no runtime dependencies and requires no build step.
