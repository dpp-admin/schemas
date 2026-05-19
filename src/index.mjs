// Public API for @dpp-gs/schemas — load JSON schemas and validate payloads.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemasDir = join(__dirname, '..', 'schemas')

function loadSchema(name) {
  return JSON.parse(readFileSync(join(schemasDir, name), 'utf8'))
}

const schemas = {
  product:                  loadSchema('product.schema.json'),
  materials:                loadSchema('materials.schema.json'),
  substances:               loadSchema('substances.schema.json'),
  battery:                  loadSchema('battery.schema.json'),
  'battery-disassembly':    loadSchema('battery-disassembly.schema.json'),
  'battery-recycled-audit': loadSchema('battery-recycled-audit.schema.json'),
  'battery-due-diligence':  loadSchema('battery-due-diligence.schema.json'),
}

const ajv = new Ajv({ allErrors: true, strict: false, $data: true })
addFormats.default ? addFormats.default(ajv) : addFormats(ajv)
for (const [, schema] of Object.entries(schemas)) ajv.addSchema(schema)

function makeValidator(rootId) {
  const validate = ajv.getSchema(rootId)
  return (payload) => {
    const ok = validate(payload)
    return {
      valid: !!ok,
      errors: validate.errors || [],
    }
  }
}

export const validateProduct        = makeValidator('https://dpp.gs/schemas/v2026.05/product.schema.json')
export const validateMaterial       = makeValidator('https://dpp.gs/schemas/v2026.05/materials.schema.json')
export const validateSubstance      = makeValidator('https://dpp.gs/schemas/v2026.05/substances.schema.json')
export const validateBattery        = makeValidator('https://dpp.gs/schemas/v2026.05/battery.schema.json')
export const validateRecycledAudit  = makeValidator('https://dpp.gs/schemas/v2026.05/battery-recycled-audit.schema.json')
export const validateDueDiligence   = makeValidator('https://dpp.gs/schemas/v2026.05/battery-due-diligence.schema.json')

// GS1 check-digit validation for GTIN-8/12/13/14. Returned alongside
// schema validation as a warning when GTIN is otherwise structurally valid
// but its check digit is wrong.
export function gtinCheckDigit(gtin) {
  if (!gtin || !/^\d{8}|\d{12,14}$/.test(gtin)) return null
  const digits = gtin.split('').map(Number)
  const check = digits.pop()
  digits.reverse()
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0)
  const expected = (10 - (sum % 10)) % 10
  return expected === check
}

export { schemas }
