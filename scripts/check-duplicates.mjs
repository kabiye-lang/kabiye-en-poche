#!/usr/bin/env node
/**
 * Fail when a package that must exist exactly once in the tree has been installed
 * more than once.
 *
 * This replaces the `overrides:` pins that used to sit in pnpm-workspace.yaml. Those
 * pinned exact versions to force deduplication, which fixed two specific incidents but
 * also silently capped every workspace and had to be bumped by hand. The invariant we
 * actually care about is "one copy", so assert that directly and let resolution move.
 *
 * Reads pnpm-lock.yaml rather than node_modules, so it needs no install and does not
 * depend on how CI caches things.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Packages that break in confusing ways when two copies coexist. Each entry is a
 * predicate over the package name plus the reason, so a failure explains itself.
 */
const MUST_BE_SINGLE = [
  {
    label: 'metro',
    match: (name) => name === 'metro' || name.startsWith('metro-'),
    why:
      "Metro's Bundler holds a transformer instance from whichever copy loaded first. " +
      'Two copies made every bundle fail with "Cannot read properties of undefined ' +
      "(reading 'transformFile')\" and the app would not start.",
  },
  {
    label: '@supabase/supabase-js',
    match: (name) => name === '@supabase/supabase-js',
    why:
      'SupabaseClient declares `supabaseUrl` as protected, and TypeScript accepts a ' +
      'protected member across two types only when one derives from the other. Two ' +
      "copies make admin's client fail to compile against ra-supabase's providers, with " +
      'an error naming what looks like the same type on both sides.',
  },
]

const lock = fs.readFileSync(path.join(ROOT, 'pnpm-lock.yaml'), 'utf8')

// pnpm-lock.yaml has more than one `packages:` section (pnpm's own binaries are listed
// separately from the project's), so walk every one of them rather than the first. Keys
// are `name@version`, quoted when scoped, at two-space indent; peer suffixes live in
// `snapshots:`, not here, so these are clean.
const versions = new Map()
let inPackages = false
for (const line of lock.split('\n')) {
  if (/^[A-Za-z][\w-]*:/.test(line)) {
    inPackages = line.startsWith('packages:')
    continue
  }
  if (!inPackages) continue
  const m = /^ {2}'?((?:@[^/@]+\/)?[^@'\s]+)@([^':\s]+)'?:$/.exec(line)
  if (!m) continue
  const [, name, version] = m
  if (!versions.has(name)) versions.set(name, new Set())
  versions.get(name).add(version)
}

if (versions.size === 0) {
  console.error('check-duplicates: parsed no packages from pnpm-lock.yaml — has the format changed?')
  process.exit(1)
}

const failures = []
for (const rule of MUST_BE_SINGLE) {
  for (const [name, vs] of versions) {
    if (rule.match(name) && vs.size > 1) {
      failures.push({ rule, name, versions: [...vs].sort() })
    }
  }
}

if (failures.length === 0) {
  const watched = [...versions.keys()].filter((n) => MUST_BE_SINGLE.some((r) => r.match(n)))
  console.log(`✓ ${watched.length} watched packages, one version each (${versions.size} packages scanned).`)
  process.exit(0)
}

console.error('✗ Packages that must exist exactly once are duplicated:\n')
const seen = new Set()
for (const f of failures) {
  console.error(`  ${f.name}: ${f.versions.join(', ')}`)
  if (!seen.has(f.rule.label)) {
    seen.add(f.rule.label)
    console.error(`    ${f.rule.why}\n`)
  }
}
console.error('Run `pnpm why -r <package>` to find who asks for each version. Fix the range')
console.error('at the source if you can; add an `overrides:` entry in pnpm-workspace.yaml if')
console.error('you cannot, with a comment saying which incident it prevents.')
process.exit(1)
