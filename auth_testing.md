# Negotio — Auth & Gated Testing Notes

## Confirmed working auth methods (verified via curl + browser)
Backend accepts EITHER:
1. Cookie `session_token=<token>` (httpOnly, set by `/api/auth/session`)
2. Header `Authorization: Bearer <token>`

Frontend attaches `Authorization: Bearer` automatically if `localStorage['negotio_token']` is set
(fallback for browsers/harnesses that block SameSite=None cookies).

### Static test identity (already seeded in MongoDB `test_database`)
- user_id: `test-user-negotio`
- email: `qa.negotio@example.com`
- session_token / bearer: `negotio_test_token_static`

### Recommended browser-test bootstrap (most reliable)
The app supports a one-time token bootstrap via query param `?bt=<token>` (it stores the
token then strips the param). This is the SIMPLEST way to authenticate in a fresh browser:
```
await page.goto(f"{BASE}/dashboard?bt=negotio_test_token_static")
# wait ~6-8s for auth round-trip + data fetch, then assert
```
Alternatively set localStorage BEFORE mount:
```python
await page.add_init_script("window.localStorage.setItem('negotio_token','negotio_test_token_static');")
await page.goto(f"{BASE}/dashboard")
```

### Re-seed command
```
mongosh test_database --quiet --eval '
db.users.updateOne({user_id:"test-user-negotio"},{$set:{user_id:"test-user-negotio",email:"qa.negotio@example.com",name:"QA Tester",picture:"",created_at:new Date()}},{upsert:true});
db.user_sessions.updateOne({session_token:"negotio_test_token_static"},{$set:{user_id:"test-user-negotio",session_token:"negotio_test_token_static",expires_at:new Date(Date.now()+7*24*60*60*1000),created_at:new Date()}},{upsert:true});
'
```

## Backend API surface (all under /api, require auth except noted)
- GET  /api/scenarios (public)            -> 8 scenarios
- GET  /api/scenarios/{id} (public)
- POST /api/auth/session  (X-Session-ID)  -> {user, session_token}
- GET  /api/auth/me
- POST /api/auth/logout
- POST /api/sessions {scenario_id}        -> creates session w/ opening opponent msg
- GET  /api/sessions                       -> list
- GET  /api/sessions/{id}
- POST /api/sessions/{id}/message {content} -> {message, state, concessions_opponent}  (Claude Sonnet 4.6, ~3-8s)
- POST /api/sessions/{id}/report            -> structured coaching report (marks completed)
- GET  /api/stats                           -> aggregate progress

Note: LLM turns take a few seconds; allow generous timeouts.
