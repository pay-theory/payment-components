# Local SDK + Hosted Services Setup

This guide covers local development for `payment-components` with optional local overrides for:

- hosted fields (`secure-tags-lib`)
- hosted checkout (`checkout`)

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
  checkout/
  books-app/
```

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

Repo path overrides:

- `PAYMENT_COMPONENTS_REPO_PATH`
- `SECURE_TAGS_LIB_REPO_PATH`
- `CHECKOUT_REPO_PATH`
- `BOOKS_APP_REPO_PATH`

Command overrides:

- `PAYMENT_COMPONENTS_COMMAND` (default `npm run dev:local`)
- `SECURE_TAGS_LIB_COMMAND` (default `npm run dev:local`)
- `CHECKOUT_COMMAND` (default `npm run dev`)
- `BOOKS_APP_COMMAND` (default `npm run dev`)

Global root override:

- `STACK_ROOT` (defaults to the parent folder of `payment-components`)
