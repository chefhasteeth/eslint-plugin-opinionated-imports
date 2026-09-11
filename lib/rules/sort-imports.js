'use strict';

function isUppercase(name) {
  if (!name) {
    return false;
  }

  const first = Array.from(name)[0];

  return first !== first.toLowerCase() && first === first.toUpperCase();
}

function compareNames(a, b) {
  const caseOrder = Number(isUppercase(b)) - Number(isUppercase(a));

  return caseOrder || (a < b ? -1 : a > b ? 1 : 0);
}

function group(node, named) {
  if (node.importKind === 'type') {
    return 0;
  }

  if (named) {
    return isUppercase(named.local.name) ? 1 : 2;
  }

  // A namespace declaration stays in the namespace group even with a default binding.
  if (node.specifiers.some((specifier) => specifier.type === 'ImportNamespaceSpecifier')) {
    return 5;
  }

  const defaultImport = node.specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');

  if (defaultImport) {
    return isUppercase(defaultImport.local.name) ? 3 : 4;
  }

  return 6;
}

function isDirective(comment) {
  return /(?:eslint(?:\s|$|-)|@ts-(?:ignore|expect-error|nocheck|check)\b)/u.test(comment.value.trim());
}

module.exports = {
  meta: {
    type: 'layout',
    docs: { description: 'Keep imports together, ordered by declaration kind, local identifier case, and name.' },
    fixable: 'code',
    schema: [],
    messages: {
      sort: 'Order imports by type, uppercase named, lowercase named, uppercase default, lowercase default, namespace, then side effect; sort symbols alphabetically within groups and named lists, without blank lines.',
      contiguous: 'Keep all imports in one contiguous block, without intervening statements.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const text = sourceCode.text;
    const newline = text.includes('\r\n') ? '\r\n' : '\n';

    function checkRun(nodes) {
      if (nodes.length === 0) {
        return;
      }

      const first = nodes[0];
      const last = nodes.at(-1);
      const comments = sourceCode.getAllComments().filter((comment) =>
        comment.range[0] >= first.range[0] && comment.range[0] < last.range[1]);

      function compactGap(start, end) {
        let cursor = start;
        let result = '';
        const compact = (value) => value.replace(/(\r?\n)(?:[^\S\r\n]*\r?\n)+/gu, '$1');

        for (const comment of comments) {
          if (comment.range[0] < start || comment.range[1] > end) {
            continue;
          }

          result += compact(text.slice(cursor, comment.range[0]));
          result += text.slice(comment.range[0], comment.range[1]);
          cursor = comment.range[1];
        }

        return result + compact(text.slice(cursor, end));
      }

      const records = nodes.map((node) => {
        const named = node.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');
        const sortedNamed = [...named].sort((a, b) => compareNames(a.local.name, b.local.name));
        const membersOutOfOrder = named.some((specifier, i) => specifier !== sortedNamed[i]);
        const binding = sortedNamed[0] ??
          node.specifiers.find((specifier) => specifier.type === 'ImportNamespaceSpecifier') ??
          node.specifiers[0];
        let declaration = '';
        let cursor = node.range[0];

        // Replace specifier slots, preserving commas, whitespace, and syntax.
        for (let i = 0; i < named.length; i += 1) {
          declaration += text.slice(cursor, named[i].range[0]) + sourceCode.getText(sortedNamed[i]);
          cursor = named[i].range[1];
        }

        declaration += text.slice(cursor, node.range[1]);

        // Comments inside a named list may describe a particular symbol. Do not
        // reorder that list automatically when their attachment is ambiguous.
        const hasMemberComments = membersOutOfOrder && comments.some((comment) =>
          comment.range[0] >= node.range[0] && comment.range[1] <= node.range[1]);

        return {
          node,
          start: node.range[0],
          end: node.range[1],
          group: group(node, sortedNamed[0]),
          name: binding?.local.name ?? '',
          declaration,
          membersOutOfOrder,
          hasMemberComments,
        };
      });

      // Same-line comments belong to the preceding import; other comments between
      // declarations belong to the following import. File headers stay in place.
      for (let i = 0; i < records.length; i += 1) {
        const record = records[i];
        const nextStart = records[i + 1]?.node.range[0] ?? Infinity;

        for (const comment of sourceCode.getCommentsAfter(record.node)) {
          if (comment.range[0] >= nextStart || comment.loc.start.line !== record.node.loc.end.line) {
            break;
          }

          record.end = comment.range[1];
        }

        if (i > 0) {
          const leading = comments.find((comment) =>
            comment.range[0] >= records[i - 1].end && comment.range[1] <= record.node.range[0]);

          if (leading) {
            record.start = leading.range[0];
          }
        }
      }

      const sorted = [...records].sort((a, b) => a.group - b.group || compareNames(a.name, b.name));
      const outOfOrder = sorted.some((record, i) => record !== records[i]);
      const blankLines = records.some((record, i) => i > 0 &&
      compactGap(records[i - 1].end, record.node.range[0]) !==
      text.slice(records[i - 1].end, record.node.range[0]));

      if (!outOfOrder && !blankLines && !records.some((record) => record.membersOutOfOrder)) {
        return;
      }

      const range = [records[0].start, records.at(-1).end];

      // Moving suppression directives can change which code is checked. Report
      // these cases, leaving the user to relocate the directive intentionally.
      const nearbyComments = sourceCode.getAllComments().filter((comment) =>
        comment.range[0] >= range[0] && comment.range[0] < range[1]);

      const preceding = sourceCode.getCommentsBefore(first);
      const hasDirective = [...nearbyComments, ...preceding].some(isDirective);

      const replacement = sorted.map((record) => {
        const leading = compactGap(record.start, record.node.range[0]);

        return leading + record.declaration + text.slice(record.node.range[1], record.end);
      }).join(newline);

      context.report({
        node: first,
        messageId: 'sort',
        fix: hasDirective || records.some((record) => record.hasMemberComments)
          ? null : (fixer) => fixer.replaceTextRange(range, replacement),
      });
    }

    return {
      Program(program) {
        let run = [];
        let seenImport = false;

        for (const node of program.body) {
          if (node.type === 'ImportDeclaration') {
            if (seenImport && run.length === 0) {
              context.report({ node, messageId: 'contiguous' });
            }

            seenImport = true;
            run.push(node);
          } else {
            checkRun(run);
            run = [];
          }
        }

        checkRun(run);
      },
    };
  },
};
