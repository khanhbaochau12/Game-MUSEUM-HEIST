import { parseAst } from 'rollup/parseAst'
import fs from 'node:fs'
import path from 'node:path'

function walk(d) {
  const out = []
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith('.js')) out.push(p)
  }
  return out
}

let bad = 0
for (const f of walk('src')) {
  try {
    parseAst(fs.readFileSync(f, 'utf8'))
  } catch (e) {
    console.log(f + ': ' + e.message)
    bad++
  }
}
console.log(bad === 0 ? 'ALL OK' : 'ERRORS: ' + bad)
