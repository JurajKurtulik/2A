# Photo review backend — operator notes

TypeScript Azure Functions v4 implementation and operator guidance. This source package does not itself prove the live deployment, model availability, handwriting accuracy, platform client-IP provenance or retention configuration. The user has approved enabling the feature for the current release; the live switch and public frontend config are managed separately. Do not present handwriting accuracy or independent photo deletion as verified.

## Runtime and commands

Use **Node.js 24.x**, as required by [package.json](package.json), with this backend as the working directory. Commands below are operator instructions, not commands executed while authoring these files.

```powershell
Set-Location C:\Development\Skolahrou\backend
npm ci
npm test
npm run build
npm run test:integration
```

- `npm test` runs only the current unit tests matching `tests/*.test.ts`: canonical frontend/backend Czech digest compatibility, create idempotency, purpose-separated tokens, duplicate uploads, failure accounting, missing quota, quota concurrency, UTC rollover, cleanup scope, JPEG limits and mocked model request/refusal/incomplete/429 handling. See [tests/review.test.ts](tests/review.test.ts). Passing mocked tests does not establish real OCR quality or deployed behavior.
- `npm run build` compiles production source only. The operator script and integration test run through `tsx`; they are not emitted by this build.
- `npm run test:integration` explicitly skips when `AZURITE_CONNECTION_STRING` is absent. An empty or unsafe value fails instead of silently skipping or falling back.
- `npm start` starts an already installed Azure Functions Core Tools host; build first. It is not needed for the integration test. Do not start it against cloud dependencies without approval: even with review disabled, the timer and health route can access dependencies, and cleanup can delete transient records.

## Local Blob integration

Use a **dedicated disposable local Azurite instance**, not cloud storage, shared development data or a production tunnel. The workspace provides the **photo-review: azurite compatible** task. Current Azurite lags the SDK service version; its local-only `--skipApiVersionCheck` option is necessary for this test and is not production configuration. Alternatively:

```powershell
npx --no-install azurite-blob --blobHost 127.0.0.1 --location "$env:TEMP/skolahrou-azurite" --skipApiVersionCheck
```

Leave that process running; in a separate terminal with the backend working directory:

```powershell
$env:AZURITE_CONNECTION_STRING = 'UseDevelopmentStorage=true'
npm run test:integration
Remove-Item Env:AZURITE_CONNECTION_STRING
```

Alternatively supply a local test connection string with explicit `BlobEndpoint`, `AccountName` and `AccountKey`. Only literal `127.0.0.1` or `[::1]` HTTP(S) endpoints are accepted; optional queue/table endpoints must also be loopback. `localhost`, implicit Azure endpoints, endpoint suffixes, SAS strings, development-storage proxy overrides, duplicate/unknown fields and non-loopback hosts are rejected before I/O. Only the exact shortcut `UseDevelopmentStorage=true` is accepted. The test never consults `AzureWebJobsStorage` or production settings and uses no Azure identity. Do not enable SDK HTTP/body diagnostics when running tests or bootstrap.

[tests/blob.integration.ts](tests/blob.integration.ts) uses four independent SDK clients and real `BlobStore` instances, not `MemoryStore` and not imports from the unit-test suite. It creates a random private container, checks create-only and stale-ETag CAS races, then uploads 24 distinct service sessions in concurrent four-client waves under the 20/day and 100/month limits. The expected shared record is `daily=20, monthly=20`, with 20 mock OCR calls, four quota rejections and no photos remaining. The OCR fixture is test-only; the HTTP JPEG decoder, Functions host, Key Vault and live model are not exercised. A `finally` block deletes only this invocation's created container. If the emulator stops or the process is killed, deletion can fail; inspect only this test's random container on the dedicated instance before removing leftovers. Never delete an unrelated container.

## Settings and identity

[local.settings.example.json](local.settings.example.json) contains placeholders and stays disabled. Copy it locally into the Functions local settings file using the standard Core Tools workflow; keep the real file untracked. Its `Values` are loaded by the Functions host, **not** by `tsx` bootstrap or the integration test. `AzureWebJobsStorage=UseDevelopmentStorage=true` is host-emulator configuration only: production `BlobStore` uses `PHOTO_STORAGE_ACCOUNT_URL` and token credentials, not this connection string. There is no local Key Vault/model substitute wired into the production host.

Required application settings: `PHOTO_STORAGE_ACCOUNT_URL` (HTTPS service root), `PHOTO_STORAGE_CONTAINER` (existing private app-data container), `PHOTO_KEY_VAULT_URL`, `PHOTO_SIGNING_SECRET_NAME`, `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT`. Optional values in the example match current defaults: exact allowed origin, 20 attempts/day, 100/month, 120000 ms model timeout, 4096 maximum output tokens. Limits are configurable, not immutable platform cost caps. The backend enables create/upload only for the exact string `true`.

The host uses managed identity when `WEBSITE_INSTANCE_ID` is present, otherwise `DefaultAzureCredential`. The operator bootstrap always uses `DefaultAzureCredential`; establish the intended tenant/account using approved local authentication separately. The app needs blob read/write/delete/list and secret read access; the initializing operator additionally needs secret set access. Host/timer storage permissions are separate deployment prerequisites. No model API key or signing key belongs in frontend settings, source, command-line arguments or logs.

## Explicit operator bootstrap (cloud access; approval required)

[scripts/bootstrap.ts](scripts/bootstrap.ts) is executable through `tsx`. It does not create resources, containers, role assignments, deployments or feature enablement. Export these four **non-secret** environment variables for the existing approved resources in the same process environment:

- `PHOTO_STORAGE_ACCOUNT_URL`
- `PHOTO_STORAGE_CONTAINER`
- `PHOTO_KEY_VAULT_URL`
- `PHOTO_SIGNING_SECRET_NAME`

Read-only inspection and approved initialization commands, respectively:

```powershell
npx --no-install tsx scripts/bootstrap.ts
npx --no-install tsx scripts/bootstrap.ts --initialize-quota --initialize-secret
```

Use either initialization flag independently when only that state is missing. Both resources are read and validated before any mutation; missing state without its flag is a failure. `--help` performs no network calls. Initialization flags permit creation of absent state, **not repair, reset, rotation or replacement**.

- The quota blob is `quota/model.json`. Existing JSON must contain exactly `day`, `month`, `daily`, `monthly`: real UTC calendar day, corresponding month, neither in the future, safe nonnegative integer counts and monthly count at least daily count. Historical valid state is preserved without resetting periods. A malformed/unreadable record is an incident.
- Initial quota dates are taken from the **live current UTC time immediately before creation**, with both counters zero. `BlobStore.write(..., null)` sends `If-None-Match: *`; it never overwrites an existing record. A lost race stops, without trying an update. A persisted record is read back and validated. Blob SDK retries are disabled for this script.
- A present secret must be a canonical base64 value decoding to at least 32 bytes, have a version and be currently usable. An absent secret is recognized only by Key Vault `404 SecretNotFound`, not by generic errors. Creation generates **32 cryptographically random bytes**, encoded as base64, only after absence checks. Values are never logged or written locally. Existing secrets are never intentionally rotated. Secret SDK retries are disabled.
- **Key Vault set-secret has no conditional-create primitive. One exclusive operator is mandatory: no concurrent bootstrap, manual set-secret, rotation job or other writer.** The extra pre-write read cannot eliminate the race. A concurrent writer can cause a new secret version despite the absence check. These instructions are an operational exclusion requirement, not an atomic guarantee.
- Authentication/authorization failures, storage uncertainty, unexpected 404s and ambiguous writes stop with a sanitized error. Never automatically retry initialization after an uncertain result. Inspect the existing quota/secret read-only and investigate before deciding what happened; do not delete quota or rotate the signing key to make the script pass. The two services do not share a transaction: quota can be created before secret creation fails. Rerunning read-only is safe, but can report missing state. Do not purge/recover a soft-deleted secret as an implicit bootstrap action.

## Current behavior and limitations

- API v1 routes are described in [the API contract](../docs/PHOTO_REVIEW_API.md); implementation is [src/functions.ts](src/functions.ts). Create uses UUID idempotency; upload authenticates a separate token and waits synchronously for OCR; owner status uses `Authorization: Review …`. No login or application work queue. CORS is not authentication.
- **Client IP is not verified.** The HTTP handler ignores forwarding headers and supplies the conservative shared `unverified-shared` identity. Thus the intended per-IP create limits (5/minute, 100/day) currently apply to all callers together, alongside the 500/day global bucket. These are elapsed windows, not UTC-day buckets. Do not advertise independent family/IP fairness until trusted platform IP provenance is verified and implemented. Upload/status limits are per session (5 uploads/minute, 30 status reads/minute), not independent verified-IP controls. Anonymous users can exhaust capacity.
- Combined daily/monthly model reservations are Blob ETag/CAS updates, UTC rollover, fail closed on missing/corrupt state or bounded contention. Attempts are reserved before the model call, never refunded. Lost writes, crashes, timeouts and ambiguous model responses can consume quota without a usable result; retries do not resume a claimed session or repeat its model call. Bounds on model attempts are not a cap on HTTP/storage/Key Vault costs. Budget alerts are not a kill switch.
- Sessions expire after 30 minutes. Photos are normally removed after the attempt; a five-minute timer removes expired session/create/rate records and stale photos, while preserving quota. Status/timer fence stale processing attempts to failed, never restart OCR. **Retention is an operational target, not an outage-proof guarantee**: stopped host, timer/storage/permission outages or failed deletion can leave data longer than 60 minutes. Monitor cleanup and arrange approved manual remediation. Feature disable leaves status/health and cleanup active; stopping the whole host stops cleanup too. Storage soft-delete/versioning/snapshots/replication and provider-side retention require separate verification; application deletion does not prove provider erasure.
- Production has **no fake OCR, alternate model or endpoint fallback**. Mock results exist only in tests. Expected sentence text is excluded from model requests. The client automatically compares OCR text with the assignment and shows only whether a sentence matches or lists its differences; the transcript itself is not displayed. OCR can be wrong, so a mismatch is not proof that the child made an error. The model does not grade handwriting or motor skills.

## Live-model and rollout gates — not yet established here

For ongoing operations, independently verify the approved exact model/version/deployment/region/SKU and quota; managed-identity scope and RBAC; endpoint support for `openai/v1/responses`, image input, strict JSON schema, `store:false`, output-token settings and configured deadline. The adapter's request shape in [src/model.ts](src/model.ts) is **live unverified**, not proof that the requested model supports it. Refusal, incomplete output, 429, network/timeout and schema failures fail closed without a replacement model. Aborting a request does not prove no charge occurred.

Also verify Functions Node 24 hosting support/configuration, CORS/token boundaries, cross-worker Blob concurrency, persistent quota, actual private-container retention settings, timer operation, sanitized diagnostics and provider data handling. Health checks read Blob/quota existence and signing key only; they neither call the model nor prove model compatibility, full quota-schema validity, accuracy or complete readiness. Public enablement is not an accuracy guarantee.