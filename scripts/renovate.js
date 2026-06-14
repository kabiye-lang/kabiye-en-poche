import fs from 'fs'
import https from 'https'

import ncuCfg from '../mobile/.ncurc.json' with { type: 'json' }
import pkg from '../mobile/package.json' with { type: 'json' }

/** Parse ncu cooldown string (e.g. "7d", "2w") → milliseconds. */
function parseCooldownMs(str = '7d') {
  console.log(`Using cooldown: ${str}`)
  const m = /^(\d+)(h|d|w)$/.exec(String(str).trim())
  if (!m) return 7 * 86_400_000
  return parseInt(m[1], 10) * { h: 3_600_000, d: 86_400_000, w: 604_800_000 }[m[2]]
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJson(res.headers.location).then(resolve, reject)
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(chunks.join('')))
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', reject)
  })
}

const cooldownMs = parseCooldownMs(ncuCfg.cooldown)
const cutoff = new Date(Date.now() - cooldownMs)

// Fetch expo packument — includes `time` field with publish dates per version
process.stdout.write('Fetching expo registry metadata… ')
const packument = await fetchJson('https://registry.npmjs.org/expo')
console.log('done.')

const publishTimes = packument.time // { '56.0.0': '2024-01-01T...', ... }
const latest = packument['dist-tags'].latest

// Lock to the current SDK major (e.g. "^56.0.0" → 56) to avoid accidental SDK upgrades
const currentSdkMajor = parseInt(pkg.dependencies.expo.match(/\d+/)[0], 10)

// Find the newest expo version that:
//   • is within the current SDK major
//   • is a stable release (no pre-release suffix like -beta, -rc, -alpha)
//   • satisfies the cooldown period
const eligible = Object.keys(packument.versions)
  .filter((v) => {
    const major = parseInt(v.split('.')[0], 10)
    return major === currentSdkMajor && !v.includes('-') && publishTimes[v] && new Date(publishTimes[v]) < cutoff
  })
  .sort((a, b) => {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i]
    return 0
  })

if (eligible.length === 0) {
  console.error(`No stable expo@${currentSdkMajor}.x version found older than ${ncuCfg.cooldown}. Retry later.`)
  process.exit(1)
}

const expoVersion = eligible[0]
const publishedAt = new Date(publishTimes[expoVersion]).toLocaleDateString()
console.log(
  `Using expo@${expoVersion} (published ${publishedAt}${expoVersion !== latest ? `, latest is ${latest}` : ''})`
)

// Fetch bundledNativeModules.json from that version
const expoJsonData = await fetchJson(`https://unpkg.com/expo@${expoVersion}/bundledNativeModules.json`)

const bundledPackages = Object.keys(expoJsonData)

ncuCfg.reject = [...bundledPackages]
if (pkg.dependencies['expo']) pkg.dependencies['expo'] = expoVersion
Object.keys(expoJsonData).forEach((dep) => {
  if (pkg.dependencies[dep]) pkg.dependencies[dep] = expoJsonData[dep]
  if (pkg.devDependencies[dep]) pkg.devDependencies[dep] = expoJsonData[dep]
})

// Sync renovate.json ignoreDeps so it stays in lockstep with bundledNativeModules.
// 'expo' itself is not in bundledNativeModules but must always be ignored (SDK upgrades
// are intentional and handled by this script, not by Renovate).
const renovateCfg = JSON.parse(fs.readFileSync('renovate.json', 'utf8'))
renovateCfg.ignoreDeps = ['expo', ...bundledPackages]
fs.writeFileSync('renovate.json', JSON.stringify(renovateCfg, null, 2) + '\n')
console.log(`Updated renovate.json ignoreDeps (${renovateCfg.ignoreDeps.length} packages).`)

fs.writeFileSync('mobile/package.json', JSON.stringify(pkg, null, 2) + '\n')
fs.writeFileSync('mobile/.ncurc.json', JSON.stringify(ncuCfg, null, 2))
console.log('Done.')
