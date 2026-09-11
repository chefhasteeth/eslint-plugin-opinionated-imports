# eslint-plugin-opinionated-imports

One import block. No blank lines. Sort by import kind and identifier case, never by module path.

```typescript
import type { Abc, Xyz } from 'types';
import { Component } from 'components';
import { helper } from 'helpers';
import App from 'app';
import config from 'config';
import * as utilities from 'utilities';
import 'setup';
```

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

- Order within each group is stable. Neither module paths nor names are alphabetized.
- Named specifiers stay in their original order. The **first** named specifier determines the group.
- Aliases use the local name: `import { foo as Foo }` belongs to the uppercase named group. The namespace group means `import * as name`, not named aliases.
- Mixed default/named declarations use the first named binding. Mixed default/namespace declarations use the namespace group.
- Inline `type` specifiers (`import { type Foo }`) remain in the named groups. Only declaration-level `import type` gets priority 1; the rule does not infer types or rewrite import syntax.
- Unicode uppercase letters are recognized. Names beginning with `_`, `$`, or an uncased character use the lowercase group.
- Quotes, semicolons, multiline declarations, import attributes, and line endings are preserved. Blank lines between declarations and their comments are removed; text inside comments and declarations is preserved.
- Leading comments between imports move with the following import; same-line trailing comments move with the preceding import. Comments before the first import stay at the top as file headers.
- All static imports must form one block. Intervening statements are reported without an automatic fix; move those imports together manually. Imports need not precede every other statement in the file. Dynamic imports, `require`, re-exports, and TypeScript `import =` are outside this rule's scope.
- Blocks containing ESLint or TypeScript suppression directives are reported without reordering automatically, so fixes do not change what the directives suppress.

The fixer moves side-effect imports after binding imports, as required by the ordering above. This can change module evaluation order; relative order within the side-effect group is preserved.

Disable other import ordering or grouping rules when enabling this rule to avoid conflicting fixes. The rule has no options.

## Development

```sh
npm install
npm test
npm run lint
```

The package has no runtime dependencies and requires no build step.
