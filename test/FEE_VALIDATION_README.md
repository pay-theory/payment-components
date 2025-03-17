# Fee Validation Tests

This directory contains tests for validating the fee behavior in PR 400, which changed the fee validation logic to accept `undefined` values.

## Files

1. `fee-validation.test.js` - Tests that document the current behavior after the PR changes
2. `improved-fee-validation.js` - An improved implementation that maintains type safety
3. `improved-fee-validation.test.js` - Tests for the improved implementation

## Issues Identified

The current implementation in PR 400 changed the validation from:
```typescript
if (typeof fee === 'number' && fee >= 0) {
    return null;
}
```

to:
```typescript
if (fee === undefined || Number(fee) >= 0) {
    return null;
}
```

This introduces a type safety issue, as it will now accept any value that converts to a non-negative number via `Number()`, including:
- String values like "123"
- Boolean values (true converts to 1, false converts to 0)

## Improved Implementation

The improved implementation allows for undefined values while maintaining type safety:

```typescript
if (fee === undefined) {
    return null;
}

if (typeof fee === 'number' && fee >= 0) {
    return null;
}
```

This ensures that we only accept:
1. undefined values (to allow zero dollar fees)
2. actual number types that are non-negative

## Running the Tests

To run these tests:

```bash
npm test
```

The tests demonstrate the differences in behavior between the current implementation and the improved implementation.

## Recommendation

We recommend replacing the current implementation with the improved version to maintain type safety while supporting the undefined fees feature. 