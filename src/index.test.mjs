import { test } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateProduct, validateRecycledAudit, validateDueDiligence, validateTextile, validateTyre, validateFurniture, gtinCheckDigit } from './index.mjs'

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

test('tyre accepts a minimum valid EU Tyre Label payload', () => {
  const r = validateTyre({
    vehicle_class: 'C1',
    fuel_efficiency_class: 'B',
    wet_grip_class: 'A',
    external_noise_db: 68,
    external_noise_class: 'A',
    snow_grip_3pmsf: false,
    ev_optimised: true,
    size_designation: '205/55 R16 91V',
    eprel_database_id: 'EPREL/2024/T0123456',
    rubber_blend_composition: [
      { polymer: 'Natural rubber (NR)', pct: 40 },
      { polymer: 'SBR', pct: 35 },
      { polymer: 'BR', pct: 25 },
    ],
  })
  assert.equal(r.valid, true, JSON.stringify(r.errors, null, 2))
})

test('tyre rejects fuel-efficiency class F (removed from 2021 label)', () => {
  const r = validateTyre({ fuel_efficiency_class: 'F' })
  assert.equal(r.valid, false)
})

test('tyre rejects bad vehicle class', () => {
  const r = validateTyre({ vehicle_class: 'C4' })
  assert.equal(r.valid, false)
})

test('tyre rejects 3-letter country of manufacture', () => {
  const r = validateTyre({ country_of_manufacture: 'FRA' })
  assert.equal(r.valid, false)
})

test('tyre rejects DOT week/year that is not 4 digits', () => {
  const r = validateTyre({ manufacture_week_year: '25/26' })
  assert.equal(r.valid, false)
})

test('furniture accepts a minimum valid record (Vitra-style chair)', () => {
  const r = validateFurniture({
    furniture_category: 'seating',
    intended_use: 'contract',
    flat_pack: false,
    modular_design: true,
    wood_composition: [
      { species: 'European beech (Fagus sylvatica)', pct: 100, country_of_origin: 'DE', fsc_certified: true, fsc_id: 'FSC-C012345' },
    ],
    panel_type: 'solid',
    formaldehyde_class: 'E0.5',
    voc_emission_class: 'A+',
    repairability_score: 8.5,
    warranty_years: 10,
    eu_ecolabel_licence: 'DE/050/001',
  })
  assert.equal(r.valid, true, JSON.stringify(r.errors, null, 2))
})

test('furniture rejects unknown furniture_category', () => {
  const r = validateFurniture({ furniture_category: 'spaceship' })
  assert.equal(r.valid, false)
})

test('furniture rejects formaldehyde_class out of enum', () => {
  const r = validateFurniture({ formaldehyde_class: 'E3' })
  assert.equal(r.valid, false)
})

test('furniture rejects repairability_score > 10', () => {
  const r = validateFurniture({ repairability_score: 11 })
  assert.equal(r.valid, false)
})

test('furniture rejects 3-letter wood origin country', () => {
  const r = validateFurniture({
    wood_composition: [{ species: 'Oak', country_of_origin: 'DEU' }],
  })
  assert.equal(r.valid, false)
})
