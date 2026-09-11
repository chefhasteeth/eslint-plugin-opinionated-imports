'use strict';

const assert = require('node:assert/strict');
const { describe, it, test } = require('node:test');
const { Linter, RuleTester } = require('eslint');
const parser = require('@typescript-eslint/parser');
const plugin = require('../index.js');

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module' },
});
const ordered = [
  "import type { Abc, Xyz } from 'types';",
  "import { Zebra } from 'z';",
  "import { Alpha } from 'a';",
  "import { abc } from 'named';",
  "import Component from 'component';",
  "import helper from 'helper';",
  "import * as namespace from 'namespace';",
  "import 'setup';",
];
const invalid = (code, output) => ({ code, output, errors: [{ messageId: 'sort' }] });

tester.run('sort-imports', plugin.rules['sort-imports'], {
  valid: [
    '',
    "const value = import('dynamic');",
    "const value = require('commonjs');",
    "import 'only';",
    ordered.join('\n'),
    "import { Z } from 'a';\nimport { A } from 'z';",
    "import { lowercase as Uppercase } from 'a';\nimport { Uppercase as lowercase } from 'b';",
    "import { Z, a } from 'z';\nimport { a, Z as Other } from 'a';",
    "import type Foo from 'foo';\nimport type * as Types from 'types';\nimport { Value } from 'value';",
    "import { type Z } from 'z';\nimport { a } from 'a';",
    "import { A } from 'a';\n/* preserve\n\n * comment */\nimport { b } from 'b';",
    "import { A } from 'a'; // comment\nimport { b } from 'b';",
    "import { a } from 'a';\nimport { _A } from 'underscore';\nimport { $B } from 'dollar';",
    "import { Éclair } from 'e';\nimport { éclair } from 'e';",
  ],
  invalid: [
    invalid([...ordered].reverse().join('\n\n'),
      [ordered[0], ordered[2], ordered[1], ...ordered.slice(3)].join('\n')),
    invalid("import B from 'b';\n\nimport a from 'a';", "import B from 'b';\nimport a from 'a';"),
    invalid("import b from 'b';\nimport A from 'a';", "import A from 'a';\nimport b from 'b';"),
    invalid("import * as Upper from 'u';\nimport lower from 'l';", "import lower from 'l';\nimport * as Upper from 'u';"),
    invalid("import 'z';\nimport 'a';\nimport Foo from 'foo';", "import Foo from 'foo';\nimport 'z';\nimport 'a';"),
    invalid("import a from 'a';\nimport Default, { Named } from 'mixed';", "import Default, { Named } from 'mixed';\nimport a from 'a';"),
    invalid("import Default, * as All from 'mixed';\nimport a from 'a';", "import a from 'a';\nimport Default, * as All from 'mixed';"),
    invalid("import { a } from 'a';\nimport { lower as Upper } from 'b';", "import { lower as Upper } from 'b';\nimport { a } from 'a';"),
    invalid("import a from 'a';\nimport { type Z } from 'z';", "import { type Z } from 'z';\nimport a from 'a';"),
    invalid("// License\nimport b from 'b'; // b\n// A documentation\nimport { A } from 'a'; // a\nrun();",
      "// License\n// A documentation\nimport { A } from 'a'; // a\nimport b from 'b'; // b\nrun();"),
    invalid("import b from 'b';\n\n/* A\n\n * description */\n\nimport { A } from 'a';",
      "/* A\n\n * description */\nimport { A } from 'a';\nimport b from 'b';"),
    invalid("import b from 'b'\r\n\r\nimport { A } from 'a'\r\n", "import { A } from 'a'\r\nimport b from 'b'\r\n"),
    invalid("import b from 'b'\nimport {\n  A,\n  Z,\n} from 'a'\n", "import {\n  A,\n  Z,\n} from 'a'\nimport b from 'b'\n"),
    invalid("import data from 'data' with { type: 'json' };\nimport { A } from 'a';", "import { A } from 'a';\nimport data from 'data' with { type: 'json' };"),
    invalid("import b from 'b'; import { A } from 'a';", "import { A } from 'a';\nimport b from 'b';"),
    invalid("import b from 'b'; /* b */\nimport { A } from 'a';", "import { A } from 'a';\nimport b from 'b'; /* b */"),
    invalid("import b from 'b';\n// @ts-expect-error external module\nimport { A } from 'a';", null),
    invalid("// eslint-disable-next-line no-unused-vars\nimport b from 'b';\nimport { A } from 'a';", null),
    {
      code: "import { A } from 'a';\nconst x = 1;\nimport b from 'b';",
      output: null,
      errors: [{ messageId: 'contiguous' }],
    },
  ],
});

test('recommended config works with the default JavaScript parser and fixes converge', () => {
  const linter = new Linter();
  const code = "import 'setup';\n\nimport b from 'b';\nimport { A } from 'a';\nconsole.log(A, b);\n";
  const result = linter.verifyAndFix(code, plugin.configs.recommended);
  assert.equal(result.output, "import { A } from 'a';\nimport b from 'b';\nimport 'setup';\nconsole.log(A, b);\n");
  assert.deepEqual(result.messages, []);
  assert.equal(linter.verifyAndFix(result.output, plugin.configs.recommended).fixed, false);
});

test('supports ESM default import', async () => {
  const imported = await import('../index.js');
  assert.equal(imported.default, plugin);
});
