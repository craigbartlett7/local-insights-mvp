
# Sprint 2.9 Patch — EPC Auth Flexibility

Drop-in replacement for `src/services/epc.js`.

**What it does**
- Accepts `EPC_API_TOKEN` as:
  1) Base64(email:key), or
  2) Plain `email:key`, or
  3) Raw `key` (if you also set `EPC_EMAIL`).
- Always sends: `Authorization: Basic <token>` and `Accept: text/csv`.

**Env examples (any one works)**
```
# A) Base64 token
EPC_API_TOKEN=Y3JhaWdAY3JhaWdiYXJ0bGV0dC5jb206NWQ2NTZl...

# B) Plain email:key
EPC_API_TOKEN=craig@craigbartlett.com:5d656e53dcbdbdbb0efa...

# C) Split email + key
EPC_API_TOKEN=5d656e53dcbdbdbb0efa203c40ae03e965dbebb4
EPC_EMAIL=craig@craigbartlett.com
```
