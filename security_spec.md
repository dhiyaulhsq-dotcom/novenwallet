# Security Specification & Test Matrix for Noven Wallet

## 1. Data Invariants

1. **User Data Isolation (Zero-Trust Multi-Tenancy)**:
   All financial records (wallets, categories, transactions, budgets, goals, debts, assets, bills, settings) exist strictly as sub-resources of `/users/{userId}`. A client can only read, write, or query documents if `request.auth != null && request.auth.uid == userId`.
2. **Immutable Identity**:
   A user profile document `/users/{userId}` cannot have its `uid` modified or set to another user's ID.
3. **Strict Path ID Guarding**:
   All path IDs `{userId}`, `{walletId}`, `{transactionId}`, etc., must satisfy `id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`.
4. **Boundary Limits**:
   String fields have strict size bounds (e.g., notes <= 1024 chars, names <= 128 chars, tags array <= 20 items).
5. **No Cross-User Leakage**:
   No operation allows any user to inspect, aggregate, or mutate another user's sub-collection data.
6. **Default-Deny Catch-All**:
   Any document path not explicitly authorized is closed by `match /{document=**} { allow read, write: if false; }`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Cross-User Read Attack)**:
   Unauthenticated or User B reads `/users/UserA/transactions/tx_1`.
   *Expected*: PERMISSION_DENIED.
2. **Payload 2 (Cross-User Write Attack)**:
   User B creates `/users/UserA/transactions/tx_hacked` with forged amount.
   *Expected*: PERMISSION_DENIED.
3. **Payload 3 (Unauthenticated Write Attack)**:
   Unauthenticated request writes `/users/UserA/wallets/w_1`.
   *Expected*: PERMISSION_DENIED.
4. **Payload 4 (Identity Spoofing in Document Body)**:
   User A creates `/users/UserB` claiming `uid: "UserB"`.
   *Expected*: PERMISSION_DENIED.
5. **Payload 5 (ID Injection / Poisoning Attack)**:
   User A attempts to create `/users/UserA/wallets/{junk_payload_2kb_long}`.
   *Expected*: PERMISSION_DENIED (path ID length exceeded).
6. **Payload 6 (Shadow Field Injection Attack)**:
   User A attempts to inject arbitrary administrative fields into their profile or transactions.
   *Expected*: PERMISSION_DENIED (validation helper enforces schema properties).
7. **Payload 7 (Massive String Resource Exhaustion / Denial of Wallet)**:
   User A attempts to write a note of 1MB into `/users/UserA/transactions/tx_1`.
   *Expected*: PERMISSION_DENIED (`note.size() <= 1024`).
8. **Payload 8 (Negative or Non-Numeric Financial Value Attack)**:
   User A writes `{ amount: "one million rupiah" }` instead of a numeric value.
   *Expected*: PERMISSION_DENIED (`amount is number`).
9. **Payload 9 (Array Bomb Attack)**:
   User A writes a transaction with an array of 5,000 tags.
   *Expected*: PERMISSION_DENIED (`tags.size() <= 20`).
10. **Payload 10 (Root Collection Scraping Attack)**:
    User A queries collection group or attempts `list` on `/users`.
    *Expected*: PERMISSION_DENIED (no blanket list allowed).
11. **Payload 11 (Cross-User Wallet Modification)**:
    User A tries to update the balance of `/users/UserB/wallets/w_b`.
    *Expected*: PERMISSION_DENIED.
12. **Payload 12 (Foreign Debt Tampering Attack)**:
    User A tries to mark User B's debt as `paid`.
    *Expected*: PERMISSION_DENIED.

---

## 3. Test Runner Coverage

A complete test matrix ensures:
- Verification of unauthenticated rejections for all paths.
- Verification of cross-tenant user access rejections.
- Verification of successful CRUD by the genuine tenant owner.
- Verification that all 12 dirty payloads result in PERMISSION_DENIED.
