#!/usr/bin/env node
// dpp-validate <file.json>
// dpp-validate-csv <file.csv>
import { readFileSync } from 'node:fs'
import { validateProduct, validateRecycledAudit, validateDueDiligence, validateTextile, gtinCheckDigit } from './index.mjs'

const args = process.argv.slice(2)
if (args.length < 2 && args[0] !== '--help') {
  console.error([
    'Usage:',
    '  dpp-validate validate <product.json>',
    '  dpp-validate validate-csv <batch.csv>',
    '  dpp-validate validate-recycled-audit <audit.json>',
    '  dpp-validate validate-due-diligence <due-diligence.json>',
    '  dpp-validate validate-textile <textile.json>',
  ].join('\n'))
  process.exit(2)
}

const [cmd, file] = args

if (cmd === 'validate') {
  const payload = JSON.parse(readFileSync(file, 'utf8'))
  const r = validateProduct(payload)
  if (payload.gtin && gtinCheckDigit(payload.gtin) === false) {
    r.warnings = [...(r.warnings || []), {
      message: `GTIN ${payload.gtin} has an invalid GS1 check digit. Verify against the product packaging.`,
    }]
  }
  if (r.valid) {
    console.log('✓ valid against', r.warnings ? '(with warnings)' : '')
    for (const w of r.warnings || []) console.warn('  ⚠', w.message)
    process.exit(r.warnings ? 0 : 0)
  } else {
    console.error('✗ validation failed')
    for (const e of r.errors) {
      console.error(`  ${e.instancePath || '(root)'} ${e.message}`)
    }
    process.exit(1)
  }
} else if (cmd === 'validate-csv') {
  const text = readFileSync(file, 'utf8')
  const [header, ...rows] = text.split(/\r?\n/).filter(Boolean)
  const cols = header.split(',').map(s => s.trim())
  let okCount = 0, failCount = 0
  rows.forEach((line, i) => {
    const values = line.split(',').map(s => s.trim())
    const obj = {}
    cols.forEach((c, idx) => {
      const v = values[idx]
      if (v === '' || v === undefined) return
      // try number
      const n = Number(v)
      obj[c] = !isNaN(n) && /^-?\d+(\.\d+)?$/.test(v) ? n : v
    })
    const r = validateProduct(obj)
    if (r.valid) { okCount++; return }
    failCount++
    console.error(`Row ${i + 2}: ${r.errors.map(e => (e.instancePath || '(root)') + ' ' + e.message).join('; ')}`)
  })
  console.log(`\n${okCount} valid, ${failCount} invalid out of ${rows.length} rows.`)
  process.exit(failCount === 0 ? 0 : 1)
} else if (cmd === 'validate-recycled-audit' || cmd === 'validate-due-diligence' || cmd === 'validate-textile') {
  const fn = cmd === 'validate-recycled-audit' ? validateRecycledAudit
           : cmd === 'validate-due-diligence'  ? validateDueDiligence
           : validateTextile
  const payload = JSON.parse(readFileSync(file, 'utf8'))
  const r = fn(payload)
  if (r.valid) {
    console.log('✓ valid')
    process.exit(0)
  } else {
    console.error('✗ validation failed')
    for (const e of r.errors) {
      console.error(`  ${e.instancePath || '(root)'} ${e.message}`)
    }
    process.exit(1)
  }
} else {
  console.error('Unknown command:', cmd)
  process.exit(2)
}
