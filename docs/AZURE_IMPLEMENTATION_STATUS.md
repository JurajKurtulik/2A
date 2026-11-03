# Azure pilot deployment status — 3 November 2026

## Backend deployed; public frontend release approved

The standalone backend implements API v1 creation, owner status, synchronous upload/OCR, readiness and Timer cleanup. It includes purpose-separated HMAC capabilities, immutable assignments/digests, conditional Blob state transitions, combined global quota, conservative distributed throttling, bounded JPEG decoding, metadata stripping, and strict model-result validation. Model HTTP calls have no automatic retry/fallback and do not receive expected answers.

Infrastructure uses pinned AVMs and parameterized Bicep, system identities, private Blob containers, RBAC, TLS, no Always Ready, and no new paid telemetry/queue/database stack. Approved resources were provisioned in Microsoft Hybrid Cloud CoE (`0cbe0134-8723-4358-b1a7-c92972b92974`), UK South. The requested model deployment `gpt-6.1-sol` version `2026-09-29`, `GlobalStandard`, capacity 1 is in `Succeeded` state. The Function App is `Running` and its five Node functions are registered. The Linux x64 ready-to-run backend package containing the latest literal-transcription prompt was deployed after Oryx remote build failed. The user approved publishing the feature. The static Pages workflow publishes the frontend; Azure backend code/infrastructure are tracked separately and are not deployed by that workflow.

## Live deployment checkpoint

- Subscription deployment `skolahrou-pilot-20261102` succeeded, including RG, storage and private containers, Key Vault, Foundry account/project, model, Linux Flex plan/app and the three Function managed-identity roles.
- Key Vault VM deployment, disk-encryption and template-deployment integrations are explicitly disabled; no AzureServices network bypass was added. This corrected provider validation errors while keeping this app's secrets-only vault scope.
- Model ARM state verified `Succeeded`, exact requested name/version/SKU, capacity 1. This is the successfully accepted pilot capacity; no minimum-capacity claim is made.
- Function ARM state verified `Running`, HTTPS-only; five Node HTTP/Timer functions are registered. Package deployment succeeded (`build-remote=false`) after the remote Oryx build ended with status 3 without a concrete build diagnostic. Package contains Linux x64 `sharp` native binaries, not Windows modules, secrets or local settings.
- Earlier health endpoint check returned **503 `dependency_unavailable`** before bootstrap. The live health endpoint subsequently returned **200 `ready`**. OCR accuracy is not established or claimed.
- A scoped, temporary operator data-plane permission was used for bootstrap of the storage quota and Key Vault secret before the successful ready health check. Do not leave or recreate temporary assignments without explicit approval. Runtime MI has its intended Storage Blob Data Owner, Key Vault Secrets User and Cognitive Services OpenAI User roles.
- QR was not tested; an earlier upload used a direct API call, not a phone/QR flow. Platform CORS is restricted to the Pages origin. Independent Blob existence/deletion verification could not be established because the operator identity lacks Storage Blob data-plane read permission; the service's deletion path runs before committing `completed`/returning 204, but deletion must not be described as independently verified.

## Verification actually executed

- Frontend: **26 tests passed**, production build passed (existing large-bundle warning).
- Backend: **18 unit tests passed**, TypeScript build passed after the local MPO primary-frame selection adjustment. Includes token swaps, Czech canonicalization, concurrent upload, quota contention/rollover/corruption/ambiguous commit, restart/stale processing, deletion failure, expiry, JPEG limits, CORS and mocked model refusal/incomplete/429 handling.
- Real local Blob integration: **1 test passed**, four independent SDK clients, create-only/stale-ETag CAS, 24 sessions, exactly 20 mocked model calls and four quota rejections, no remaining photos. Azurite runs on literal loopback with `--skipApiVersionCheck` because the SDK service version is newer than the emulator. This is not a production setting or an Azure identity test.
- Production dependency audit: **zero known vulnerabilities** at verification. Patched sharp 0.35.5 is used. Full development audit still reports four moderate findings through Azurite's transitive uuid dependencies; emulator is loopback-only and excluded from production dependencies.
- Bicep/parameters compile; infrastructure safety regression checks pass.
- Azure live `validate` succeeded for the deployed model-enabled parameters (`deployModel=true`, capacity 1), with nested module expansion warnings. The actual ARM deployment succeeded, so the prior incomplete what-if did not prevent the user-approved pilot.
- Azure what-if remains incomplete and was not treated as a full inventory; this is accepted for this pilot.

## Remaining rollout limitations

1. Exact requested model deployment **minimum capacity/step/units remains unresolved**. Reported default 10 and available quota 7000 are not proof of minimum. Preserve exact model/version/GlobalStandard/UK South; obtain authoritative capacity and rerun validation/what-if with approved model parameters.
2. Obtain full what-if diagnostics and an expanded inventory covering Function plan/app and three roles; review policies and effective deployment/RBAC permissions. Revalidate final concurrency/memory values and Flex regional quota.
3. **Verified platform client-IP extraction is not yet implemented.** No caller-supplied forwarding header is trusted. The conservative shared create bucket currently applies 5/minute and 100/day across everyone, plus 500/day globally; upload/status throttles are per session. This is intentionally fail-closed but not the requested independent per-IP behavior. Resolve platform-owned header provenance or explicitly approve this stricter temporary behavior before public enablement.
4. Verify actual model Responses API/image/strict-schema/MI/`store:false` compatibility, allowed detail/reasoning/output settings and provider-side retention. The single previous paid inference does not validate literal transcription quality or a billing ceiling.
5. After approved provisioning, run the explicit operator-only bootstrap for create-only quota and signing-secret initialization, deploy a **Linux-compatible** Node 24 package using supported Flex remote build/OneDeploy, and verify host/Timer identity and storage access. Do not package Windows sharp native binaries for Linux. Bootstrap scripts are excluded from the runtime package. Never reset existing quota or expose keys.
6. Measure 512 MB and four HTTP slots with JPEG decoding, cold start, polling and cleanup. Bound HTTP/dependency work; validate actual worst-case wall-clock behavior under contention. Increase memory only after approval of cost impact.
7. Test actual CORS at the platform edge, cleanup failure visibility, private retention settings, key rotation continuity, body/dependency deadlines, and outage remediation. The Timer retention target is not an absolute guarantee during a stopped/unavailable host or storage outage.
8. Local MPO primary-frame support selects one page and passes unit coverage, but has not been redeployed. Independently verify Blob cleanup with an authorized data-plane identity. QR was not tested. No accuracy assurance is claimed; the current UI does not show the raw recognized transcript and parents should verify the result against the page.

## Costs and approval

Selected subscription: **Microsoft Hybrid Cloud CoE**, `0cbe0134-8723-4358-b1a7-c92972b92974`; tenant `2281a10d-617d-4692-a87c-7d4e5a420f35`; RG `p-rg-skolahrou-jk`; region `uksouth`.

Read-only discovery reported exact model/version/SKU available and names available at check time; neither is reserved. User chose **estimate first**, no fixed budget approved.

Verified public USD retail assumptions: short-context model input **$2/million**, output **$10/million**; Flex execution **$0.000037/GB-second**, **$0.40/million executions**; Hot LRS **$0.0192/GB-month**, writes **$0.059/10k**, reads **$0.0047/10k**; Key Vault **$0.03/10k**. 100 attempts at 120 seconds cost about **$0.222** upload compute at 512 MB, before startup/polling/Timer costs and grants. Illustrative model usage of 5k input+2k output or 10k+4k per attempt costs **$3 or $6/month**. With modest storage/cleanup, roughly **$4–$8/month** is a planning illustration, not a quote or spending cap. Image/reasoning accounting, negotiated rates, grant availability, currency/tax, egress and attack traffic remain variables. Budget alerts do not stop billing.

**Release state at the time of this document update:** the backend with the latest literal-transcription prompt is deployed and readiness had returned ready. The user approved public enablement. Azure feature setting and local frontend configuration were enabled for release; GitHub Pages publication and the final public check are tracked in the release conversation. OCR accuracy and independent Blob deletion are not verified. Local MPO primary-frame handling passes all 18 backend tests but has not been redeployed.

## Emergency controls

Set `PHOTO_REVIEW_ENABLED=false` on the Function App to prevent new create/upload/model work while retaining cleanup/status; disable the public frontend configuration as well. If HTTP abuse continues, stopping the Function App stops cleanup too: perform approved private transient-data cleanup and verify retention. Do not delete quota or platform containers. Existing in-flight model charges may still occur; disabling is not retroactive cancellation.

See [backend operator guide](../backend/README.md) and [Azure deployment runbook](AZURE_DEPLOYMENT.md) for bootstrap and rollout details.