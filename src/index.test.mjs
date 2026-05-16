import { test } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateProduct, gtinCheckDigit } from './index.mjs'

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
