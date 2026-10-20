# gen-city provenance

- Source: https://github.com/neki-dev/gen-city (author: Nikita Galadiy)
- Version: 1.4.6, commit 8e16289766aef9dfd02dcfa5a95c6b0977fb939a (2025-06-08)
- Licence: MIT (see LICENSE in this directory, copied verbatim from upstream)
- Vendored on: 20 Oct 2026

## What was done

The upstream package ships TypeScript sources plus a bundled dist. For this
repository the TypeScript sources were compiled to plain ESM JavaScript
(TypeScript 5.3.3, target ES2020, module ES2020) and import specifiers were
rewritten to explicit `.mjs` paths so the modules run directly in the browser
and in Node without a build step. No algorithmic changes were made.

## Modifications

- Compiled `src/*.ts` to `.mjs` (type annotations stripped by the compiler).
- Relative imports rewritten to include the `.mjs` extension.
- No changes to generation logic, seeds, or data structures.
