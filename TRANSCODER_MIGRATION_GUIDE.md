# MyTurn transcoder migration guide

This runbook moves production from the former direct Coolify transcoder / Vast
Serverless paths to the new always-on supervisor and ordinary Vast.ai instances.
The supervisor stays online, while GPU workers are created, stopped, resumed, or
destroyed only when work requires them.

## Target architecture

1. The client uploads the source video directly to Cloudflare R2.
2. The Vercel backend validates and finalizes the upload.
3. Vercel signs and registers a durable mission with the supervisor.
4. The supervisor immediately wakes its reconciliation loop.
5. It dispatches to a healthy worker or rents an allowed Vast offer.
6. A Vast instance starts the `myturn-transcoder` template and runs the GPU
   worker image.
7. The worker reads the source from R2, transcodes it, uploads the result, sends
   a signed completion webhook to Vercel, and ships structured logs to the
   supervisor.
8. The supervisor stops or destroys idle workers according to the admin policy.

The one-minute external cron call is only recovery insurance. Normal upload
completion wakes the supervisor immediately and does not wait for the cron.

## Components and ownership

| Component | Hosting | Purpose |
| --- | --- | --- |
| `myturn` | Vercel | Upload finalization, mission registration, completion webhook, admin UI, recovery endpoint |
| `supervisor` | Coolify, one always-on replica | Durable orchestration, Vast lifecycle, dispatch, health monitoring, retries, central log ingestion |
| `transcoder` | Ordinary Vast.ai instances | GPU transcoding worker created from the `myturn-transcoder` template |
| PostgreSQL | Existing MyTurn database | Missions, policies, fleet state, events, and durable worker logs |
| Cloudflare R2 | Existing buckets | Source and transcoded media |

## Before starting

- Schedule a short maintenance window or temporarily prevent new uploads.
  Uploads arriving during a supervisor outage remain queued, but a controlled
  cutover makes verification easier.
- Back up the production PostgreSQL database.
- Record the currently deployed Vercel version and the old transcoder image and
  environment values for rollback.
- Confirm Docker Buildx can build `linux/amd64` images.
- Confirm the GHCR package is public, or configure a read-only registry token in
  the private Vast template.
- Reserve the final HTTPS supervisor domain in Coolify before editing the Vast
  template; the worker log sink must use that final domain.
- Create a scoped Vast API key allowed to search offers and create, inspect,
  start, stop, and destroy instances. Store it only on the supervisor.
- Confirm the supervisor will have outbound access to Vast, PostgreSQL, and the
  Vast worker network endpoint.

### Production network security gate

The current supervisor resolves an ordinary Vast port mapping as
`http://<public-ip>:<mapped-port>`. That traffic is not encrypted. Before a
production cutover, place worker traffic behind a TLS tunnel/private network, or
change the worker contract to outbound job claiming. Do not send the worker API
key, signed media URLs, or job payloads over a public plain-HTTP connection in
production.

## Step 1: Create four independent secrets

Generate four different random values. Do not reuse an authentication, cron, or
media secret.

```bash
openssl rand -base64 48  # SUPERVISOR_MISSION_SECRET
openssl rand -base64 48  # TRANSCODER_API_KEY / worker API_KEY
openssl rand -base64 48  # WORKER_LOG_INGEST_SECRET
openssl rand -base64 48  # TRANSCODER_WEBHOOK_SECRET
```

Use this mapping exactly:

| Logical secret | Vercel | Supervisor | Vast worker template |
| --- | --- | --- | --- |
| Mission signing | `SUPERVISOR_MISSION_SECRET` | `SUPERVISOR_MISSION_SECRET` | Not present |
| Worker API authentication | Not present | `TRANSCODER_API_KEY` | `API_KEY` |
| Worker log ingestion | Not present | `WORKER_LOG_INGEST_SECRET` | `WORKER_LOG_INGEST_SECRET` |
| Completion webhook | `TRANSCODER_WEBHOOK_SECRET` | Not present | `TRANSCODER_WEBHOOK_SECRET` |

The names can differ across the boundary where shown, but the value in each row
must match.

## Step 2: Build and publish the new GPU worker image

From the `transcoder` directory:

```bash
cd transcoder
npm ci
npm test

export GHCR_IMAGE=ghcr.io/emirozdis/ffmpeg-api
export IMAGE_TAG="stable-$(git rev-parse --short=12 HEAD)"

docker buildx build \
  --platform linux/amd64 \
  --file Dockerfile.gpu \
  --build-arg VCS_REF="$(git rev-parse HEAD)" \
  --tag "$GHCR_IMAGE:$IMAGE_TAG" \
  --tag "$GHCR_IMAGE:vast-stable" \
  --load \
  .

docker image inspect "$GHCR_IMAGE:$IMAGE_TAG" \
  --format '{{.Os}}/{{.Architecture}} {{json .Config.Entrypoint}} {{json .Config.Cmd}}'

docker push "$GHCR_IMAGE:$IMAGE_TAG"
docker push "$GHCR_IMAGE:vast-stable"
```

Production should use the immutable `stable-<commit>` tag. Do not point the
production template only at a moving tag.

## Step 3: Update the Vast template

Use the existing template display name `myturn-transcoder`.

Set:

- Image: `ghcr.io/emirozdis/ffmpeg-api:<immutable-stable-tag>`
- Launch mode/runtype: `args` / Entrypoint
- Arguments: empty, allowing the image `CMD` to run
- Container port: TCP `3000`
- Disk: start with 20 GB and increase it if the largest source plus all temporary
  renditions can exceed that amount

Add these non-secret template options, replacing the two URLs:

```text
-p 3000:3000
-e PORT=3000
-e HOST=0.0.0.0
-e REQUIRE_RUNTIME_CONFIG=true
-e VIDEO_ENCODER=h264_nvenc
-e NVENC_PRESET=p3
-e NVENC_TUNE=hq
-e REQUIRE_NVENC=true
-e REQUIRE_CUDA_PIPELINE=true
-e CUDA_DEVICE=0
-e CUDA_DECODE_MODE=auto
-e GPU_TELEMETRY_INTERVAL_MS=5000
-e R2_UPLOAD_CONCURRENCY=10
-e R2_UPLOAD_POLL_MS=250
-e R2_DOWNLOAD_TIMEOUT_MS=300000
-e R2_UPLOAD_TIMEOUT_MS=120000
-e R2_DOWNLOAD_PROGRESS_INTERVAL_MS=5000
-e TRANSCODER_LOG_SINK_URL=https://<supervisor-domain>/v1/worker-logs
-e REMOTE_LOG_LEVEL=info
-e REMOTE_LOG_BATCH_SIZE=50
-e REMOTE_LOG_FLUSH_INTERVAL_MS=2000
-e MAX_CONCURRENT_JOBS=1
-e MAX_CONCURRENT_JOBS_CAP=1
-e AUTO_SCALE_CONCURRENCY=false
-e TRANSCODER_ALLOWED_WEBHOOK_ORIGINS=https://<vercel-production-domain>
```

Store these as private template/account variables:

```text
API_KEY=<same value as supervisor TRANSCODER_API_KEY>
WORKER_LOG_INGEST_SECRET=<same value as supervisor>
TRANSCODER_WEBHOOK_SECRET=<same value as Vercel>
CLOUDFLARE_R2_ACCOUNT_ID=<existing value>
CLOUDFLARE_R2_ACCESS_KEY_ID=<existing value>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<existing value>
CLOUDFLARE_R2_BUCKET_NAME=<existing production bucket>
```

Remove old Serverless-only settings if they exist:

```text
ENABLE_VAST_SERVERLESS
REPORT_ADDR
PYWORKER_REPO
WORKER_PORT
WORKER_HTTP_PORT
```

Save the template, then copy its **template hash ID**. The display name
`myturn-transcoder` is not the value expected by the supervisor policy.

## Step 4: Apply the database migrations

At the start of the cutover window, pause new upload finalizations and pause the
legacy dispatcher so it cannot claim records while their state is being reset.
Keep the legacy deployment intact but stopped so rollback remains quick.

Run the migrations once against the production database before deploying code
that uses the new tables:

```bash
cd myturn
npm ci
npm run db:migrate:status
npm run db:migrate:deploy
npm run db:migrate:status
```

The relevant migrations are:

- `20260809000000_add_transcoder_supervisor`
- `20260809010000_add_transcoder_worker_logs`
- `20260809020000_add_transcoder_mission_timeout`
- `20260809030000_add_durable_cron_scheduler`

They add the supervisor policy, mission, instance, event, and durable worker log
tables, including the maximum runtime used to recover missions from workers that
remain healthy while an individual job is stalled. The first migration also resets unfinished legacy video jobs to
`QUEUED`; completed media is not changed. This lets the externally scheduled
recovery request register unfinished work with the new supervisor.

Do not manually edit an already-applied migration. If deployment reports a
checksum mismatch, stop and investigate instead of marking it resolved blindly.

## Step 5: Configure and deploy the Vercel backend

Add these production variables to the `myturn` Vercel project:

```text
TRANSCODER_SUPERVISOR_URL=https://<supervisor-domain>
SUPERVISOR_MISSION_SECRET=<mission-signing-secret>
TRANSCODER_WEBHOOK_SECRET=<completion-webhook-secret>
TRANSCODER_DISPATCH_STALE_MINUTES=45
CRON_SECRET=<independent-secret-also-stored-on-the-external-cron-server>
```

Keep the existing database, R2, application URL, and other normal backend
variables. In particular, `NEXT_PUBLIC_APP_URL` or `APP_BASE_URL` must resolve to
the public backend origin used by the worker callback.

Remove these legacy variables from Vercel after preserving their values in the
rollback record:

```text
TRANSCODER_API_URL
TRANSCODER_API_KEY
VAST_SERVERLESS_ENDPOINT_NAME
VAST_SERVERLESS_ENDPOINT_API_KEY
VAST_API_KEY
```

Vercel must not hold the Vast API key or worker API key in the new design.

Build and verify before deploying:

```bash
cd myturn
npm ci
npm run lint
npm test
npm run build
```

Deploy the new Vercel version. Scheduled maintenance is intentionally invoked
only by the external cron server; there are no Vercel Cron declarations or
process-local `node-cron` timers.

Configure the external cron server to make this request once per minute:

```bash
curl --fail --silent --show-error \
  --max-time 290 \
  --request POST \
  -H "Authorization: Bearer <CRON_SECRET>" \
  https://<vercel-production-domain>/api/cron/tick
```

It is an authenticated `POST` request. A successful response has HTTP 200 and
identifies the jobs claimed by that tick. Most ticks run only transcode recovery;
calendar jobs are selected from their durable schedules. A body resembles:

```json
{"tickId":"...","configuredJobs":9,"claimedJobs":1,"skippedJobs":8,"success":true,"jobs":[{"name":"transcode-mission-recovery","status":"SUCCEEDED"}]}
```

Store `CRON_SECRET` as a protected value on both Vercel and the external cron
server. Do not place it in the URL or query string. Alert on non-2xx responses.
Database leases make overlapping or duplicate external triggers harmless. The
route has a 300-second maximum duration; expired leases and bounded retry
backoff recover work after an interrupted invocation.

Open `/admin/transcoder`, leave **Enable orchestration** unchecked during setup,
enter the `myturn-transcoder` template hash, choose conservative policy values,
and save. The migrations intentionally do not create this policy row; the first
admin save creates it. Suggested first-production values are:

```text
Maximum workers: 1
Concurrent jobs per worker: 1
Queued jobs required per new worker: 1
Idle timeout: 300 seconds
Idle action: DESTROY
Startup timeout: 600 seconds
Health interval: 5 seconds
Failures before replacement: 3
Attempts per mission: 3
Mission runtime timeout: 1800 seconds
Worker log retention: 30 days
Verified hosts only: enabled
Datacenter hosts only: enabled
```

Also set an explicit maximum hourly price, minimum reliability, network limits,
GPU RAM, CPU/RAM requirements, and allowed GPU models appropriate for production.
Enable **Full machine only** only when you intentionally want to exclude partial
CPU/RAM allocations and virtualized offers.

The idle countdown starts only after the instance has no assigned missions and
the global mission queue is empty. Routine worker health checks preserve that
countdown. Dispatching new work, resuming an instance, or a worker refusing the
final drain check resets it. At expiry, the supervisor performs a final
`prepare-shutdown` barrier before applying the configured idle action.

New Vast contracts may temporarily report `actual_status=unknown`, `created`, or
another non-terminal startup state. The supervisor keeps those contracts in
`PROVISIONING` until they become reachable or the configured startup timeout
expires. Only explicit terminal states such as `exited` and `offline` trigger
immediate replacement.

## Step 6: Install the supervisor on Coolify

Create a new Coolify application from the `supervisor` directory:

- Build method: Dockerfile
- Dockerfile: `supervisor/Dockerfile` when building from the package root, or
  `Dockerfile` when the Coolify base directory is `supervisor`
- Internal port: `3010`
- Public domain: HTTPS, for example `https://transcoder-supervisor.example.com`
- Health path: `/health`
- Replicas: exactly one
- Restart policy: always/unless-stopped

The PostgreSQL advisory lock protects against brief overlap during deployments,
but normal operation should still use one replica.

Set these supervisor variables:

```text
PORT=3010
HOST=0.0.0.0
DATABASE_URL=<same production PostgreSQL database used by myturn>
VAST_API_KEY=<scoped Vast API key>
SUPERVISOR_MISSION_SECRET=<same mission secret as Vercel>
WORKER_LOG_INGEST_SECRET=<same log secret as the Vast template>
TRANSCODER_API_KEY=<same value as worker API_KEY>
RECONCILE_INTERVAL_MS=5000
MISSION_AUTH_MAX_SKEW_SECONDS=300
LOG_LEVEL=info
```

Deploy it and verify:

```bash
curl -fsS https://<supervisor-domain>/health
```

Expected result:

```json
{"status":"healthy","database":"connected","policyConfigured":true}
```

If it reports `degraded`, confirm that the admin policy was saved and contains
the template hash. If it reports `unhealthy`, check `DATABASE_URL` and database
network access.

## Step 7: Validate without enabling paid capacity

While orchestration remains disabled:

1. Confirm Coolify shows a stable supervisor process and successful health
   checks.
2. Confirm `/admin/transcoder` loads policy, missions, instances, events, and
   log panels without database errors.
3. Confirm the supervisor can reach Vast's API using its scoped key. Authentication
   failures appear as structured supervisor events/logs.
4. Confirm the template hash saved in Admin is the hash ID, not the display name.
5. Confirm the worker image tag in the template is immutable and matches the
   image just published.
6. Confirm the supervisor domain uses a valid HTTPS certificate; worker log
   shipping deliberately refuses a non-HTTPS sink.

## Step 8: Enable orchestration and run one canary upload

In `/admin/transcoder`, enable orchestration and save. Then submit one small real
video through the normal client upload flow.

Observe this sequence in the admin page:

1. A mission appears as `QUEUED` immediately after finalization.
2. The supervisor records offer selection and creates one Vast instance.
3. The instance moves from `PROVISIONING/STARTING` to `RUNNING/HEALTHY`.
4. The mission is dispatched and becomes active.
5. Worker logs arrive with the Vast instance ID and job ID.
6. R2 receives `master.m3u8`, rendition playlists, segments, thumbnail, and blur
   output as applicable.
7. The signed completion webhook succeeds.
8. The clip becomes ready and the mission becomes completed.
9. After the configured idle timeout, the instance follows the chosen `STOP` or
   `DESTROY` policy.

Confirm that a second upload made while the worker is healthy reuses the worker
within its configured job capacity. Also test that a mission registered while no
worker exists wakes provisioning immediately rather than waiting for the recovery
cron.

## Step 9: Test recovery behavior

Before declaring the migration complete, perform controlled tests:

- Temporarily stop a canary worker during a non-critical job and confirm the
  supervisor requeues the mission and replaces the instance.
- Confirm startup exceeding `startupTimeoutSeconds` results in replacement.
- Confirm repeated health failures reach `maxInstanceFailures` and replace the
  worker.
- Briefly make the supervisor unavailable, finalize a test upload, restore the
  supervisor, and confirm the external one-minute recovery call registers the
  queued job.
- Verify log filtering by severity, job ID, instance ID, and UTC time range.
- Verify that worker logs remain visible after the Vast instance is destroyed.

Do not intentionally interrupt a real user job for these tests.

## Step 10: Retire the legacy infrastructure

Only do this after the canary succeeds and queued legacy work has drained:

1. Disable or stop the old direct Coolify transcoder deployment.
2. Watch the new admin page and application logs for at least one complete idle
   lifecycle.
3. Disable and then delete the old Vast Serverless endpoint/workergroup.
4. Remove old Serverless templates or image tags that are not used by
   `myturn-transcoder`.
5. Remove the legacy environment variables from all environments, including
   preview/staging configurations.
6. Preserve old logs for the normal incident-retention period.
7. Remove old infrastructure only after confirming there are no remaining DNS,
   monitoring, or deployment references to it.

Code for Vast Serverless has already been removed from the `transcoder`
repository, including its worker entrypoint, controller/routes, Dockerfile, and
documentation. External Vast and Coolify resources are not deleted by a code
deployment and must be retired manually.

## Rollback procedure

If the canary fails:

1. Disable **Enable orchestration** in `/admin/transcoder` first. This prevents
   new provisioning and dispatch.
2. Allow active canary work to finish where safe, or stop/destroy only the exact
   test instance from Vast.
3. Restore the previous Vercel deployment and its recorded
   `TRANSCODER_API_URL` / `TRANSCODER_API_KEY` values.
4. Re-enable the old Coolify transcoder or Vast Serverless resource.
5. Confirm only one dispatch system is active before reopening uploads.
6. Keep the new database tables and migrations in place. They are additive and
   contain diagnostic history; do not drop them as part of an operational
   rollback.

Queued records may be retried, so never run the old and new dispatchers together
without reviewing their queue ownership. Completion writes are designed to be
idempotent, but duplicate GPU work still costs money.

## Final acceptance checklist

- [ ] Production database backed up
- [ ] Both new migrations applied successfully
- [ ] Immutable GPU image published
- [ ] `myturn-transcoder` template updated and template hash copied
- [ ] Four independent secrets created and mapped correctly
- [ ] Vercel variables updated and legacy variables removed
- [ ] External cron calls `POST /api/cron/tick` every minute with the Bearer secret
- [ ] Supervisor deployed as one always-on Coolify replica
- [ ] Supervisor `/health` returns HTTP 200 with `policyConfigured: true`
- [ ] Worker network path protected by TLS/private transport
- [ ] Admin policy configured with conservative limits
- [ ] Canary upload completed end to end
- [ ] Central logs visible after worker destruction
- [ ] Startup timeout, replacement, and external recovery schedule tested
- [ ] Idle worker stopped or destroyed at the expected time
- [ ] Old Coolify direct worker and Vast Serverless resources retired

## Related repository documentation

- `supervisor/README.md`
- `supervisor/.env.example`
- `transcoder/docs/vast-ai.md`
- `transcoder/README.MD`
- `myturn/.env.example`
