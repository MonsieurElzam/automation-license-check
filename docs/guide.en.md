## What it's for

Every dependency you install comes with a license. Most are permissive (MIT, ISC…), but a strong-copyleft license (GPL, AGPL) may require you to publish your own code. This script inventories the licenses in `node_modules` and flags what deserves a closer look.

## Before you start

- A project with dependencies installed (`npm install`).

## Step by step

1. Run the inventory:
   ```bash
   node src/license-check.mjs ./node_modules
   ```
2. Read the breakdown by license, then the "to review" list: **strong** copyleft and **unknown** licenses (missing or non-standard).
3. For each case, decide: replace the dependency, or get advice on compatibility with your use.

## Reading the output

Classes: `permissive` (free use), `weak` (LGPL, MPL: obligations limited to the component), `strong` (GPL, AGPL), `unknown`. An expression `(MIT OR GPL-3.0)` is classified by the best choice; `MIT AND GPL-3.0` by the worst.

## Automating it

In CI: exit code 2 if there is strong copyleft or an unknown license (`--allow-unknown` tolerates the latter).

## Pitfalls

- This is **information**, not legal advice: have edge cases reviewed.
- The script reads licenses declared in `package.json`; it does not check packages' `LICENSE` files.
