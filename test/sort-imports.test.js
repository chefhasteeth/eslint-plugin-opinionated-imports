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
  "import { Alpha } from 'a';",
  "import { Zebra } from 'z';",
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
    "import { Foo, Foo as foo } from 'a';",
    "import { X as Same, Z } from 'z';\nimport { Y as Same2, z } from 'a';",
    "import 'z';\nimport {} from 'a';\nimport 'b';",
    "import { A, /* B documentation */ B } from 'comments';",
    "import { A } from 'z';\nimport { Z } from 'a';",
    "import { lowercase as Uppercase } from 'a';\nimport { Uppercase as lowercase } from 'b';",
    "import { Z as Other, a } from 'a';\nimport { Z, a as b } from 'z';",
    "import type Foo from 'foo';\nimport type * as Types from 'types';\nimport { Value } from 'value';",
    "import { type Z } from 'z';\nimport { a } from 'a';",
    "import { A } from 'a';\n/* preserve\n\n * comment */\nimport { b } from 'b';",
    "import { A } from 'a'; // comment\nimport { b } from 'b';",
    "import { $B } from 'dollar';\nimport { _A } from 'underscore';\nimport { a } from 'a';",
    "import { Éclair } from 'e';\nimport { éclair } from 'e';",
  ],
  invalid: [
    invalid("import type { X, A } from 'types';", "import type { A, X } from 'types';"),
    invalid("import { z, Z, a, A } from 'values';", "import { A, Z, a, z } from 'values';"),
    invalid("import { Z } from 'a';\nimport { A } from 'z';", "import { A } from 'z';\nimport { Z } from 'a';"),
    invalid("import { z } from 'a';\nimport { a } from 'z';", "import { a } from 'z';\nimport { z } from 'a';"),
    invalid("import Z from 'a';\nimport A from 'z';", "import A from 'z';\nimport Z from 'a';"),
    invalid("import z from 'a';\nimport a from 'z';", "import a from 'z';\nimport z from 'a';"),
    invalid("import * as z from 'a';\nimport * as a from 'z';\nimport * as Z from 'b';",
      "import * as Z from 'b';\nimport * as a from 'z';\nimport * as z from 'a';"),
    invalid("import type z from 'z';\nimport type * as Z from 'ns';\nimport type { A } from 'a';",
      "import type { A } from 'a';\nimport type * as Z from 'ns';\nimport type z from 'z';"),
    invalid("import { a } from 'a';\nimport { z, A } from 'mixed';", "import { A, z } from 'mixed';\nimport { a } from 'a';"),
    invalid("import { A as z, Z as a } from 'aliases';", "import { Z as a, A as z } from 'aliases';"),
    invalid("import { type Z, A, type B } from 'mixed';", "import { A, type B, type Z } from 'mixed';"),
    invalid("import Default, { Z, A } from 'mixed';", "import Default, { A, Z } from 'mixed';"),
    invalid("import type {\n  Z,\n  A,\n} from 'types'\n", "import type {\n  A,\n  Z,\n} from 'types'\n"),
    invalid("import {\r\n  Z,\r\n  A\r\n} from 'values';", "import {\r\n  A,\r\n  Z\r\n} from 'values';"),
    invalid("import { Z, /* describes A */ A } from 'comments';", null),
    invalid("import { /* describes Z */ Z, A } from 'comments';", null),
    invalid("import { Z, A /* describes A */ } from 'comments';", null),
    invalid("// @ts-expect-error missing module\nimport type { Z, A } from 'types';", null),
    invalid("import { Z, A } from 'a' with { type: 'json' };", "import { A, Z } from 'a' with { type: 'json' };"),
    invalid([...ordered].reverse().join('\n\n'),
      ordered.join('\n')),
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


test('member sorting and declaration regrouping converge in one pass', () => {
  const linter = new Linter();
  const config = { ...plugin.configs.recommended, languageOptions: { parser } };
  const code = "import { b } from 'first';\nimport type { Z, A } from 'types';\nimport { z, A as C } from 'last';";
  const result = linter.verifyAndFix(code, config);
  assert.equal(result.output, "import type { A, Z } from 'types';\nimport { A as C, z } from 'last';\nimport { b } from 'first';");
  assert.deepEqual(result.messages, []);
  assert.equal(linter.verifyAndFix(result.output, config).fixed, false);
});
