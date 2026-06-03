# Security Specification (TDD SPEC)

## 1. Data Invariants
- **Anime Titles:** Any user can read the anime collection. Only administrative users (users mapped in the `/admins/` path or explicitly matching authorized emails) can create, update, or delete anime entries.
- **User Accounts:** Users can read and write only their own user profiles mapped to `users/{userId}` where `userId == request.auth.uid`. No user can modify other users' roles or set their own role to 'admin' (privilege escalation protection).
- **Watch History:** A user can query, create, and update their own watch history items in `history/{historyId}`. A write is only valid if `incoming().userId == request.auth.uid` and they match their credentials.

---

## 2. The "Dirty Dozen" Payloads (Exploit Vector Payloads)

Here are the 12 malicious payloads targeted for rejection (`PERMISSION_DENIED`):

1. **Self-Admin Elevate (PIE-001):**
   * Path: `/users/hacker123`
   * Action: `create` or `update`
   * Exploit Payload: `{ "id": "hacker123", "email": "hacker@test.com", "username": "Hacker", "role": "admin" }`
   * Target Status: **REJECTED** (Non-admin elevates themselves)

2. **Poisonous Anime ID Injection (RES-002):**
   * Path: `/anime/very-long-garbage-id-unicode-denial-of-wallet-attack-vector`
   * Action: `create`
   * Target Status: **REJECTED** (ID too large or non-match pattern)

3. **Substituted Author Spoofing (AUT-003):**
   * Path: `/history/user2_ep1`
   * Action: `create`
   * Exploit Payload: `{ "id": "user2_ep1", "userId": "victim_uid", "episodeId": "naruto-ep-1", "progressSeconds": 100 }`
   * Target Status: **REJECTED** (userId doesn't match active request.auth.uid)

4. **Shadow Field Injection on Anime Profile (GHO-004):**
   * Path: `/anime/naruto`
   * Action: `update`
   * Exploit payload: User adds `{ "secretShadowField": "junk-data" }`
   * Target Status: **REJECTED** (Ghost field validation rejects the shadow property)

5. **Blanket Query Attempt (BLA-005):**
   * Path: `/history/*`
   * Action: `list` (Querying all watch history items without a user-scoped filter)
   * Target Status: **REJECTED** (blanket reads disallowed unless filtered by userId)

6. **Status Step Bypass / Shortcutting (STA-006):**
   * Path: `/history/hacker_naruto`
   * Action: `update` (Marking finished directly with arbitrary completed flags without satisfying progress conditions)
   * Target Status: **REJECTED** (Requires valid verification matching schema updates/bounds)

7. **Immortal CreatedAt Field Tampering (IMM-007):**
   * Path: `/users/user123`
   * Action: `update`
   * Exploit payload: `{ "createdAt": "2000-01-01T00:00:00Z" }`
   * Target Status: **REJECTED** (Immutability check requires remaining existing().createdAt)

8. **Future Timestamp Forgery (TEM-008):**
   * Path: `/history/user_ep_1`
   * Action: `create`
   * Exploit payload: `{ "watchedAt": "2050-12-30T00:00:00Z" }` (Using client forged far-future stamp instead of server request.time)
   * Target Status: **REJECTED**

9. **PII Collection Scraping (PII-009):**
   * Path: `/users/victim_user`
   * Action: `get` (Hacker trying to fetch victim's email or account information)
   * Target Status: **REJECTED** (Only owner `request.auth.uid == victim_user` can read)

10. **Malicious Long String Query Exhaustion (DOB-010):**
    * Path: `/anime/naruto`
    * Action: `update` (Updating field with a 10MB string to explode bandwidth fees)
    * Target Status: **REJECTED** (String size limits enforced check)

11. **Orphaned Watch History reference (ORP-011):**
    * Path: `/history/hacker_fake-anime-id`
    * Action: `create` (Adding progress logic pointing to non-existent anime titles)
    * Target Status: **REJECTED** (Validated against parent database doc exits condition)

12. **Anonymous Access Bypass (ANY-012):**
    * Path: `/history/anonymous_progress`
    * Action: `create` while `request.auth.token.email_verified == false`
    * Target Status: **REJECTED** (Requires authenticated and verified logins)

---

## 3. Test Cases (TDD Suite Concepts)
Verifications will be performed on rules before publishing to ensure zero access leakage.
