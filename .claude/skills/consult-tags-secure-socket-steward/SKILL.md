---
name: consult-tags-secure-socket-steward
description: "Frame and route a bounded end-to-end payment or tokenization semantics question to the Tags Secure Socket steward when consultation is provisioned."
---

# Consult the Tags Secure Socket steward

Use when Payment Components work depends on backend-owned payment or tokenization semantics that propagate through secure-tags-lib to tags-secure-socket: transaction inputs, token lifecycle, idempotency, fees, errors, retries, authentication expectations, or outcomes.

Payment Components does not gain backend ownership merely because the public SDK exposes related behavior.

## Preconditions

Direct consultation requires an actually provisioned mailbox or consultation tool, exact contactable recipient identity, and sender/receiver policy allowing the exchange. Tool visibility alone is not authority.

If any condition is missing, prepare a principal-routed consultation packet and do not invent an address or send.

## Procedure

1. Ground in the local issue, authoritative local contracts, redacted evidence, and the precise backend-owned unknown.
2. Confirm the question cannot be answered safely from local and secure-tags-lib contracts without guessing.
3. Remove payment data, decrypted or production payloads, credentials, tokens, secrets, merchant identifiers, and unnecessary customer details.
4. Frame:
   - current SDK behavior or proposed contract change;
   - affected transaction, tokenization, idempotency, fee, error, retry, or outcome semantics;
   - redacted evidence and reproduction;
   - exact backend question or requested validation;
   - backward and forward compatibility impact;
   - three-repository rollout and rollback concern;
   - explicit statement that this steward will not edit tags-secure-socket.
5. Verify the consultation surface and authorization immediately before sending.
6. Send only through the provisioned route, or present the packet to the principal.
7. Treat the response as peer evidence, not permission to edit the peer, deploy, merge, publish, or bypass local validation.
8. Apply the answer only within confirmed local scope and record the durable non-sensitive contract decision.
9. Feed shared-contract conclusions into coordinate-payment-contract-change.

## Output

A sent consultation reference or principal-routed packet, followed by a bounded application note when a response arrives.

## Red flags

- Invented mailbox, recipient, or authority.
- Raw payment, decrypted, or production payload data.
- Asking the peer to approve an incompatible public SDK change.
- Treating consultation as backend write or release authority.
- Using peer silence as approval.
