# dpp-gs-schemas

Open JSON Schemas + CLI validator for EU Digital Product Passport (DPP) data. MIT licensed. Maintained by [dpp.gs](https://dpp.gs).

Validate your DPP payloads against EU **ESPR 2024/1781**, **Battery Regulation 2023/1542** and **REACH SVHC** rules *before* you push them to any DPP backend (ours or anybody else's).

## Why this exists

- The EU DPP regulation set is sprawling. The actual machine-readable shape your data must take is not in the regulation text — only in delegated acts and partner implementation guides.
- We extract our internal shape into JSON Schema and publish it under MIT, so you can build CSV importers, ERP integrations and label printers without committing to any single DPP vendor.
- Schemas track the latest delegated-act drafts (CIRPASS, JRC, CEN/CENELEC JTC 24). PR welcome.

## Install

```bash
npm install --save-dev @dpp-gs/schemas
```

## Validate a product JSON

```js
import { validateProduct } from '@dpp-gs/schemas'

const product = {
  gtin: '08523456790018',
  product_name: { en: 'VoltCore VC-75E' },
  sector: 'battery',
  manufacturer_name: 'VoltCore GmbH',
  manufacturer_country: 'DE',
  battery_category: 'ev',
  weight_kg: 380,
  // ...
}

const result = validateProduct(product)
if (!result.valid) {
  console.error(result.errors)
  process.exit(1)
}
```

## CLI

```bash
npx @dpp-gs/schemas validate my-product.json
npx @dpp-gs/schemas validate-csv my-batch.csv
```

`validate-csv` accepts the standard dpp.gs CSV template (columns documented in `schemas/product.schema.json`) and prints per-row diagnostics.

## Schemas included

| Schema | Source regulation |
|---|---|
| `product.schema.json` | ESPR Art. 7, Annex I |
| `materials.schema.json` | ESPR Art. 7(5), CRMA 2024/1252 |
| `substances.schema.json` | REACH 1907/2006 Art. 33 (SVHC) |
| `battery.schema.json` | Battery Reg. 2023/1542 Annex XIII |
| `battery-disassembly.schema.json` | Battery Reg. Annex XIII §2 |
| `carbon-footprint.schema.json` | Battery Reg. Art. 7 + ESPR Art. 7(2)(b) |

Each schema cites the exact regulation paragraph for every mandatory field. Look at `notes` annotations.

## Tolerance / threshold values

The schemas include `tolerance` keywords that document **what values the regulator considers compliant** (e.g. Battery Reg. recycled cobalt ≥16% by 2031). The validator emits warnings (not errors) when payloads fall outside tolerance — you stay free to ship "in-progress" data and tighten it as you go.

## Versioning

`$id`s carry the spec date so schemas can evolve without breaking older clients:

```
https://dpp.gs/schemas/v2026.05/product.schema.json
```

When the EU adopts a new delegated act, we publish a new dated version. Older versions stay available indefinitely.

## License

MIT — use it commercially, fork it, redistribute it. We just ask you to keep the LICENSE notice and contribute back if you fix anything material.

## Contributing

PRs welcome. CI runs `npm test` which validates every schema against AJV draft 2020-12 + a corpus of real-world example payloads in `examples/`. New schemas need a corresponding example.

## Related projects

- [`@dpp-gs/openapi`](https://github.com/smartdrs/dpp-gs-openapi) — REST API spec we expose at `https://dpp.gs/api/v1`
- [`dpp.gs`](https://dpp.gs) — hosted SaaS that uses these schemas internally

---

*Maintained by Smart DRS Limited · contact@dpp.gs*
