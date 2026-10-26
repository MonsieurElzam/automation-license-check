#!/usr/bin/env node
/* Inventaire des licences des dépendances installées (node_modules) : repère le copyleft fort et les licences inconnues. */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { isMain, parseArgs, usage, fail } from '../lib/cli.mjs'

const PERMISSIVE = /^(MIT|MIT-0|ISC|BSD-2-Clause|BSD-3-Clause|0BSD|Apache-2\.0|Unlicense|CC0-1\.0|BlueOak-1\.0\.0|Python-2\.0|Zlib|WTFPL|CC-BY-4\.0|CC-BY-3\.0)$/i
const WEAK = /^(LGPL-[\d.]+(-only|-or-later)?|MPL-[\d.]+|EPL-[\d.]+|CDDL-[\d.]+)$/i
const STRONG = /^(A?GPL-[\d.]+(-only|-or-later)?|SSPL-[\d.]+|EUPL-[\d.]+|OSL-[\d.]+)$/i
const RANK = { permissive: 0, weak: 1, unknown: 2, strong: 3 }

export function classifyId(id) {
  const s = id.replace(/\+$/, '').trim()
  return PERMISSIVE.test(s) ? 'permissive' : WEAK.test(s) ? 'weak' : STRONG.test(s) ? 'strong' : 'unknown'
}

/** Expression SPDX simple : « OR » = on choisit la meilleure ; « AND » = on subit la pire. */
export function classify(expr) {
  if (!expr) return 'unknown'
  const text = String(expr).replace(/[()]/g, ' ').trim()
  if (/\sOR\s/i.test(text)) return text.split(/\sOR\s/i).map(classify).reduce((a, b) => (RANK[a] <= RANK[b] ? a : b))
  if (/\sAND\s/i.test(text)) return text.split(/\sAND\s/i).map(classify).reduce((a, b) => (RANK[a] >= RANK[b] ? a : b))
  return classifyId(text)
}

export function readPackages(nodeModules) {
  const pkgs = []
  const read = (dir) => {
    const file = join(dir, 'package.json')
    if (!existsSync(file)) return
    try {
      const j = JSON.parse(readFileSync(file, 'utf8'))
      const lic = typeof j.license === 'string' ? j.license : j.license?.type ?? (Array.isArray(j.licenses) ? j.licenses.map((l) => l.type).join(' OR ') : '')
      pkgs.push({ name: j.name ?? dir, version: j.version ?? '?', license: lic || '(aucune)' })
    } catch { /* package.json illisible : ignoré */ }
  }
  for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    if (entry.name.startsWith('@')) for (const sub of readdirSync(join(nodeModules, entry.name), { withFileTypes: true })) { if (sub.isDirectory()) read(join(nodeModules, entry.name, sub.name)) }
    else read(join(nodeModules, entry.name))
  }
  return pkgs
}

export function report(pkgs) {
  const rows = pkgs.map((p) => ({ ...p, level: classify(p.license) }))
  const byLicense = new Map()
  for (const r of rows) byLicense.set(r.license, (byLicense.get(r.license) ?? 0) + 1)
  return { rows, byLicense: [...byLicense].sort((a, b) => b[1] - a[1]), flagged: rows.filter((r) => r.level === 'strong' || r.level === 'unknown'), weak: rows.filter((r) => r.level === 'weak') }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), ['help', 'allow-unknown'])
  usage(`
Usage : node src/license-check.mjs [chemin/vers/node_modules] [--allow-unknown]
Classe chaque licence : permissive, copyleft faible (LGPL, MPL…), copyleft fort (GPL, AGPL…) ou inconnue.
Code de sortie 2 s'il y a du copyleft fort ou (sans --allow-unknown) une licence inconnue.
Information, pas un avis juridique : faites relire les cas limites.`, { ...args, _: ['x'] })
  const dir = args._[0] === 'x' ? 'node_modules' : args._[0]
  if (!existsSync(dir)) fail(`${dir} introuvable : installez d'abord les dépendances.`)
  const r = report(readPackages(dir))
  console.log(`${r.rows.length} paquets.\n`)
  r.byLicense.slice(0, 12).forEach(([l, n]) => console.log(`  ${String(n).padStart(5)}  ${l}`))
  if (r.weak.length) { console.log(`\n! copyleft faible (${r.weak.length}) :`); r.weak.slice(0, 15).forEach((p) => console.log(`  ${p.name}@${p.version}  ${p.license}`)) }
  const blocking = r.flagged.filter((p) => p.level === 'strong' || !args['allow-unknown'])
  if (r.flagged.length) { console.log(`\n✗ à examiner (${r.flagged.length}) :`); r.flagged.slice(0, 25).forEach((p) => console.log(`  ${p.name}@${p.version}  ${p.license}  [${p.level}]`)) }
  else console.log('\n✓ Aucune licence problématique.')
  process.exit(blocking.length ? 2 : 0)
}
