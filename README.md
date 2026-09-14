# Pay Theory Web SDK

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components?utm_source=github.com&utm_medium=referral&utm_content=pay-theory/payment-components&utm_campaign=Badge_Grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components/dashboard?utm_source=github.com&utm_medium=referral&utm_content=pay-theory/payment-components&utm_campaign=Badge_Coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/pay-theory/payment-components/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pay-theory/payment-components?targetFile=package.json)
[![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components)

The Pay Theory Web SDK is a set of fields and components that can be used to collect payment information to tokenize and create payment methods or payments.

For documentation on the SDK, visit [docs.paytheory.com](https://docs.paytheory.com).

## TypeScript types

`src/paytheory-sdk.ts` is the canonical public contract. `npm run build-types` emits two standalone
declaration files from it:

- `dist/paytheory-sdk.d.ts` is the partner-facing declaration. Declarations tagged `@internal` are
  stripped, so the checkout-portal-only surface (`checkoutContext`, `resendInvoiceEmail`) never
  appears in it. The CDN publication workflows upload this file next to `index.js`.
- `dist-internal/paytheory-sdk.d.ts` keeps the `@internal` declarations. It exists for the Pay
  Theory checkout portal, is never uploaded to the CDN, and is copied into that project from a
  local build.

Partners who load the SDK as a browser script can download the partner declaration into a
TypeScript project (for example, `types/paytheory-sdk.d.ts`) and make sure the directory is
included by `tsconfig.json`:

```json
{
  "include": ["src", "types"]
}
```

The declaration then provides type safety for the existing browser globals:

```typescript
await window.paytheory.transact({
  amount: 2500,
});
```

Partner code may also import individual types from the downloaded file. This is a type-only
import; the SDK implementation must still be loaded through the normal browser script.

```typescript
import type { TransactProps, TransactResult } from './types/paytheory-sdk';
```

SDK implementation modules also import partner-facing types from this canonical contract. Types
used only for internal transport or state remain next to their implementations.

## License

MIT © [pay theory](https://github.com/pay-theory)
