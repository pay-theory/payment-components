# Local SDK + Hosted Services Setup

## Quick Setup

Create a fresh folder and clone the required repos:

```bash
mkdir LocalSDKTest
cd LocalSDKTest
git clone https://github.com/pay-theory/secure-tags-lib.git
git clone https://github.com/pay-theory/payment-components.git
git clone https://github.com/pay-theory/books-app-checkout.git
```

This guide covers local development for `payment-components` with optional local overrides for:

- hosted fields (`secure-tags-lib`)
- hosted checkout (`books-app-checkout`)

It supports four routing modes:

1. SDK local + deployed fields + deployed checkout
2. SDK local + local fields + deployed checkout
3. SDK local + deployed fields + local checkout
4. SDK local + local fields + local checkout

## Expected Folder Layout

If all repos are in one parent folder:

```text
<root>/
  payment-components/
  secure-tags-lib/
  books-app-checkout/
```

## Prerequisites

Install dependencies in each repo you plan to run:

```bash
cd payment-components && npm install
cd ../books-app-checkout && npm install
cd ../secure-tags-lib && npm install
```

The local stack script now auto-installs missing dependencies for selected services.
You can still run manual installs if you want to pre-warm all repos.

If `books-app-checkout` uses `@paytheory/pay-theory-ui` from a local file dependency
(`file:../pay-theory-ui`), ensure `../pay-theory-ui` exists relative to
`books-app-checkout` (a symlink is fine).

If `../pay-theory-ui` is missing, `npm run local:stack` will try to clone it from
`github.com/pay-theory/pay-theory-ui` and prepare it automatically.
Set `GITHUB_ACCESS_TOKEN` if your local git auth cannot clone private repos.

## Environment Variables

Set these in `payment-components/.env` (or `.env.local`):

```bash
# Deployed environment identity
ENV=your-name
STAGE=paytheorylab
TARGET_MODE=

# SDK local dev server behavior
LOCAL_DEV=true

# Endpoint toggles
LOCAL_HOSTED_FIELDS=false
LOCAL_HOSTED_CHECKOUT=false

# Local endpoint values used when the corresponding LOCAL_HOSTED_* toggle is true
LOCAL_HOSTED_FIELDS_ENDPOINT=https://localhost:3001
LOCAL_HOSTED_CHECKOUT_ENDPOINT=http://localhost:3002
```

Use base service URLs (no trailing `/hosted` path). The SDK appends route paths like `/checkout_button`,
`/checkout_qr`, and `/hosted` automatically.

## Local Test Runtime Config (`window.ENV_CONFIG`)

`local-test/index.html` loads values from `local-test/env-config.local.js` in the browser.
Create it from the template and set real local-test values:

```bash
cp local-test/env-config.js local-test/env-config.local.js
```

```js
window.ENV_CONFIG = {
  PAYTHEORY_API_KEY: '...',
  GOOGLE_MERCHANT_ID: '...',
  GOOGLE_GATEWAY_MERCHANT_ID: '...',
  TEST_AMOUNT: '1000',
};
```

Without this file, local test pages will throw:
`PAYTHEORY_API_KEY must be set in window.ENV_CONFIG`.

## Endpoint Routing

- Hosted fields:
  `LOCAL_HOSTED_FIELDS=true` uses `LOCAL_HOSTED_FIELDS_ENDPOINT` (or default `https://localhost:3001`).
  Otherwise it uses the deployed hosted-fields URL.
- Hosted checkout:
  `LOCAL_HOSTED_CHECKOUT=true` uses `LOCAL_HOSTED_CHECKOUT_ENDPOINT` (or default `http://localhost:3002`).
  Otherwise it uses the deployed hosted-checkout URL.

## Common Modes

Mode 1: SDK local + deployed fields + deployed checkout

```bash
LOCAL_DEV=true
LOCAL_HOSTED_FIELDS=false
LOCAL_HOSTED_CHECKOUT=false
```

Mode 2: SDK local + local fields + deployed checkout

```bash
LOCAL_DEV=true
LOCAL_HOSTED_FIELDS=true
LOCAL_HOSTED_CHECKOUT=false
```

Mode 3: SDK local + deployed fields + local checkout

```bash
LOCAL_DEV=true
LOCAL_HOSTED_FIELDS=false
LOCAL_HOSTED_CHECKOUT=true
LOCAL_HOSTED_CHECKOUT_ENDPOINT=http://localhost:3002
```

Mode 4: SDK local + local fields + local checkout

```bash
LOCAL_DEV=true
LOCAL_HOSTED_FIELDS=true
LOCAL_HOSTED_CHECKOUT=true
LOCAL_HOSTED_FIELDS_ENDPOINT=https://localhost:3001
LOCAL_HOSTED_CHECKOUT_ENDPOINT=http://localhost:3002
```

## Run Locally

From `payment-components`:

```bash
npm run dev:local
```

Open:

```text
http://localhost:3000/local-test/
```

## Multi-Repo Runner Script

Use:

```bash
npm run local:stack
```

This script reads `payment-components/.env` and `.env.local`, then starts selected repos based on flags:

- `START_PAYMENT_COMPONENTS` (default `true`)
- `START_SECURE_TAGS_LIB` (default follows `LOCAL_HOSTED_FIELDS`)
- `START_CHECKOUT` (default follows `LOCAL_HOSTED_CHECKOUT`)
- `START_BOOKS_APP` (default `false`)

Before each selected service starts, the script checks for `node_modules`:

- if present, it skips `npm install`
- if missing, it runs `npm install` in that repo

Repo path overrides:

- `PAYMENT_COMPONENTS_REPO_PATH`
- `SECURE_TAGS_LIB_REPO_PATH`
- `CHECKOUT_REPO_PATH` (default: `books-app-checkout`)
- `BOOKS_APP_REPO_PATH`

Command overrides:

- `PAYMENT_COMPONENTS_COMMAND` (default `npm run dev:local`)
- `SECURE_TAGS_LIB_COMMAND` (default `npm run dev:local`)
- `CHECKOUT_COMMAND` (default auto-detected:
  `npm run dev` if present, otherwise `PORT=3002 npm start` if `start` exists)
- `BOOKS_APP_COMMAND` (default `npm run dev`)

Global root override:

- `STACK_ROOT` (defaults to the parent folder of `payment-components`)

Checkout bootstrap behavior:

- For `books-app-checkout` with `file:../pay-theory-ui`, the script ensures
  `../pay-theory-ui` exists.
- If missing, it clones `pay-theory-ui` using `GITHUB_ACCESS_TOKEN` (or SSH auth fallback).
- It installs/builds `pay-theory-ui` when needed.
- It removes duplicate React packages in `pay-theory-ui/node_modules` to match CI buildspec behavior.

## Troubleshooting

- `PAYTHEORY_API_KEY must be set in window.ENV_CONFIG`:
  ensure `local-test/env-config.local.js` exists and includes required keys.
- `npm error Missing script: "dev"` when starting checkout:
  set `CHECKOUT_COMMAND` in `.env`, or rely on script auto-detection.
- `Can't resolve '@paytheory/pay-theory-ui'` in checkout:
  ensure `books-app-checkout` local file dependency `../pay-theory-ui` exists.
