import { test } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateProduct, validateRecycledAudit, validateDueDiligence, validateTextile, gtinCheckDigit } from './index.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const example = JSON.parse(readFileSync(join(__dirname, '..', 'examples', 'voltcore-vc-75e.json'), 'utf8'))

test('voltcore example validates cleanly', () => {
  const r = validateProduct(example)
  assert.equal(r.valid, true, JSON.stringify(r.errors, null, 2))
})

test('missing gtin fails', () => {
  const r = validateProduct({ product_name: { en: 'x' } })
  assert.equal(r.valid, false)
})

test('battery sector without battery_category fails', () => {
  const r = validateProduct({ gtin: '08523456790018', sector: 'battery' })
  assert.equal(r.valid, false)
})

test('GTIN check-digit recognises real GTIN', () => {
  assert.equal(gtinCheckDigit('08523456790018'), true)
})

test('GTIN check-digit catches wrong digit', () => {
  assert.equal(gtinCheckDigit('08523456790017'), false)
})

test('recycled-audit accepts a minimum valid record', () => {
  const r = validateRecycledAudit({
    substance: 'cobalt',
    verifier_name: 'Bureau Veritas',
    issued_date: '2026-03-15',
    recycled_pct: 12.0,
    scope: 'mine-to-refiner',
  })
  assert.equal(r.valid, true, JSON.stringify(r.errors, null, 2))
})

test('recycled-audit rejects unknown substance', () => {
  const r = validateRecycledAudit({
    substance: 'platinum',
    verifier_name: 'X',
    issued_date: '2026-03-15',
  })
  assert.equal(r.valid, false)
})

test('due-diligence accepts a minimum valid record', () => {
  const r = validateDueDiligence({
    substance: 'cobalt',
    verifier_name: 'RCS Global',
    issued_date: '2026-03-15',
    scope: 'mine-to-refiner',
    oecd_compliant: true,
    cahras_red_flags: ['CD', 'MM'],
    risk_areas_assessed: ['child_labour', 'corruption'],
  })
  assert.equal(r.valid, true, JSON.stringify(r.errors, null, 2))
})

test('due-diligence rejects non-ISO-alpha2 country code', () => {
  const r = validateDueDiligence({
    substance: 'cobalt',
    verifier_name: 'X',
    issued_date: '2026-03-15',
    cahras_red_flags: ['Congo'],
  })
  assert.equal(r.valid, false)
})

test('due-diligence rejects unknown risk-area enum', () => {
  const r = validateDueDiligence({
    substance: 'cobalt',
    verifier_name: 'X',
    issued_date: '2026-03-15',
    risk_areas_assessed: ['ufo_abduction'],
  })
  assert.equal(r.valid, false)
})

test('textile accepts a minimum valid record', () => {
  const r = validateTextile({
    fibre_composition: [
      { name: 'Merino wool', pct: 85, recycled_pct: 0, origin_country: 'AU', is_organic: true },
      { name: 'Recycled polyester', pct: 15, recycled_pct: 100, origin_country: 'TW' },
    ],
    fabric_weight_gsm: 280,
    weave_type: 'knitted',
  })
  assert.equal(r.valid, true, JSON.stringify(r.errors, null, 2))
})

test('textile rejects non-ISO-alpha2 fibre origin', () => {
  const r = validateTextile({
    fibre_composition: [{ name: 'Wool', origin_country: 'Australia' }],
  })
  assert.equal(r.valid, false)
})

test('textile rejects share % over 100', () => {
  const r = validateTextile({
    fibre_composition: [{ name: 'Wool', pct: 120 }],
  })
  assert.equal(r.valid, false)
})

test('textile rejects unknown weave type', () => {
  const r = validateTextile({ weave_type: 'glued-together' })
  assert.equal(r.valid, false)
})
