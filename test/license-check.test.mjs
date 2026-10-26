import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sample = (n) => readFileSync(new URL(`../samples/${n}`, import.meta.url), 'utf8')
const mod = (n) => import(`../src/${n}.mjs`)
const run = (n, args = []) => spawnSync(process.execPath, [fileURLToPath(new URL(`../src/${n}.mjs`, import.meta.url)), ...args], { encoding: 'utf8' })
const samplePath = (n) => fileURLToPath(new URL(`../samples/${n}`, import.meta.url))

test('23 licences : classement SPDX, OR/AND, lecture de node_modules', async () => {
  const { classify, readPackages, report } = await mod('license-check')
  assert.equal(classify('MIT'), 'permissive'); assert.equal(classify('(MIT OR GPL-3.0)'), 'permissive'); assert.equal(classify('MIT AND GPL-3.0'), 'strong'); assert.equal(classify('LGPL-2.1'), 'weak'); assert.equal(classify('AGPL-3.0-or-later'), 'strong'); assert.equal(classify(''), 'unknown'); assert.equal(classify('Propriétaire'), 'unknown')
  const nm = mkdtempSync(join(tmpdir(), 'nm-'))
  const pkg = (dir, json) => { mkdirSync(join(nm, dir), { recursive: true }); writeFileSync(join(nm, dir, 'package.json'), JSON.stringify(json)) }
  pkg('a', { name: 'a', version: '1.0.0', license: 'MIT' }); pkg('@s/b', { name: '@s/b', version: '2.0.0', license: 'GPL-3.0' }); pkg('c', { name: 'c', version: '1.0.0' }); pkg('.bin', { name: 'ignoré' })
  const rep = report(readPackages(nm))
  assert.equal(rep.rows.length, 3); assert.deepEqual(rep.flagged.map((p) => p.name).sort(), ['@s/b', 'c'])
  assert.equal(run('license-check', [nm]).status, 2); assert.equal(run('license-check', [nm, '--allow-unknown']).status, 2)
})
