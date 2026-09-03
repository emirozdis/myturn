/*
  Successful transcoding performance report (PostgreSQL)

  Change params.from_ts / params.to_ts to select the reporting window.

  Definitions:
    - successful job: transcoder_missions.status = 'SUCCEEDED'
    - cold start: the mission was registered before its assigned instance became ready
    - hot start: the assigned instance was already ready when the mission was registered
    - start latency: mission registeredAt -> dispatchedAt
    - per-GiB duration (weighted): total duration / total bytes; this is the most
      representative fleet-wide value because larger transfers receive proportionate weight
    - average normalized per-GiB: normalize every job to 1 GiB, then average the jobs equally

  The result is a tidy report: section, metric, unit, sample_count, value.
  Durations are returned in seconds. GiB means 1,073,741,824 bytes.

  Current telemetry limitation:
    Worker logs persist downloadedBytes, but do not persist the number of bytes uploaded.
    Upload durations and upload stage durations are therefore reported, while upload/GiB
    metrics are deliberately returned as NULL. Add uploadedBytes to an upload-completion log
    context to enable those metrics (the query already looks for it).
*/
WITH RECURSIVE
params AS (
  SELECT
    '-infinity'::timestamptz AS from_ts,
    'infinity'::timestamptz AS to_ts,
    1073741824.0::numeric AS bytes_per_gib
),
successful_jobs AS (
  SELECT
    m.id AS mission_id,
    m."externalId" AS job_id,
    m."entityType" AS entity_type,
    m."assignedInstanceId" AS instance_id,
    m."registeredAt" AS registered_at,
    m."dispatchedAt" AS dispatched_at,
    m."completedAt" AS completed_at,
    i."createdAt" AS instance_created_at,
    i."startedAt" AS instance_ready_at,
    CASE
      WHEN i."startedAt" IS NULL THEN 'UNKNOWN'
      WHEN m."registeredAt" < i."startedAt" THEN 'COLD'
      ELSE 'HOT'
    END AS start_type,
    EXTRACT(EPOCH FROM (m."dispatchedAt" - m."registeredAt")) AS start_seconds,
    EXTRACT(EPOCH FROM (m."completedAt" - m."registeredAt")) AS end_to_end_seconds,
    EXTRACT(EPOCH FROM (m."completedAt" - m."dispatchedAt")) AS worker_seconds
  FROM transcoder_missions m
  LEFT JOIN transcoder_instances i ON i.id = m."assignedInstanceId"
  CROSS JOIN params p
  WHERE m.status = 'SUCCEEDED'
    AND m."completedAt" IS NOT NULL
    AND m."completedAt" >= p.from_ts
    AND m."completedAt" < p.to_ts
),
cold_instances AS (
  SELECT DISTINCT instance_id, instance_created_at, instance_ready_at
  FROM successful_jobs
  WHERE start_type = 'COLD'
    AND instance_ready_at >= instance_created_at
),
job_logs AS (
  SELECT l.*
  FROM transcoder_worker_logs l
  JOIN successful_jobs j ON j.job_id = l."jobId"
  WHERE (l."instanceId" = j.instance_id OR l."instanceId" IS NULL)
    /* Excludes logs from an earlier failed attempt of the same durable mission. */
    AND l."occurredAt" >= j.dispatched_at - interval '1 minute'
    AND l."occurredAt" <= j.completed_at + interval '1 minute'
),
stage_events AS (
  SELECT
    l."jobId" AS job_id,
    l.context ->> 'stage' AS stage,
    (l.context ->> 'durationMs')::numeric / 1000.0 AS duration_seconds
  FROM job_logs l
  WHERE l.message LIKE 'Pipeline stage completed:%'
    AND l.context ->> 'stage' IS NOT NULL
    AND jsonb_typeof(l.context -> 'durationMs') = 'number'
),
download_bytes AS (
  SELECT DISTINCT ON (l."jobId")
    l."jobId" AS job_id,
    (l.context ->> 'downloadedBytes')::numeric AS bytes
  FROM job_logs l
  WHERE l.message = '[R2] Download completed'
    AND jsonb_typeof(l.context -> 'downloadedBytes') = 'number'
    AND (l.context ->> 'downloadedBytes')::numeric > 0
  ORDER BY l."jobId", l."occurredAt" DESC
),
download_jobs AS (
  SELECT s.job_id, s.duration_seconds, b.bytes
  FROM stage_events s
  JOIN download_bytes b USING (job_id)
  WHERE s.stage = 'r2-download'
),
/* Supports future telemetry such as { uploadedBytes: 123 } on any upload completion log. */
upload_bytes AS (
  SELECT
    l."jobId" AS job_id,
    SUM((l.context ->> 'uploadedBytes')::numeric) AS bytes
  FROM job_logs l
  WHERE jsonb_typeof(l.context -> 'uploadedBytes') = 'number'
    AND (l.context ->> 'uploadedBytes')::numeric > 0
  GROUP BY l."jobId"
),
upload_stage_events AS (
  SELECT *
  FROM stage_events
  WHERE stage LIKE 'r2-upload-%'
),
/* Upload tasks run concurrently, so use first start -> last completion, not SUM(stage duration). */
upload_bounds AS (
  SELECT
    l."jobId" AS job_id,
    MIN(l."occurredAt") FILTER (WHERE l.message LIKE 'Pipeline stage started: r2-upload-%') AS started_at,
    MAX(l."occurredAt") FILTER (WHERE l.message LIKE 'Pipeline stage completed: r2-upload-%') AS completed_at
  FROM job_logs l
  WHERE l.message LIKE 'Pipeline stage started: r2-upload-%'
     OR l.message LIKE 'Pipeline stage completed: r2-upload-%'
  GROUP BY l."jobId"
),
upload_jobs AS (
  SELECT
    b.job_id,
    EXTRACT(EPOCH FROM (b.completed_at - b.started_at)) AS duration_seconds,
    u.bytes
  FROM upload_bounds b
  LEFT JOIN upload_bytes u USING (job_id)
  WHERE b.started_at IS NOT NULL AND b.completed_at IS NOT NULL
),
state_markers AS (
  SELECT
    j.job_id,
    MIN(l."occurredAt") FILTER (
      WHERE l.message = 'Pipeline stage started: r2-download'
    ) AS download_started_at,
    MAX(l."occurredAt") FILTER (
      WHERE l.message = 'Pipeline stage completed: r2-download'
    ) AS download_completed_at,
    MIN(l."occurredAt") FILTER (
      WHERE l.message LIKE 'Pipeline stage started: r2-upload-%'
    ) AS upload_started_at,
    MAX(l."occurredAt") FILTER (
      WHERE l.message = 'Video pipeline completed'
    ) AS pipeline_completed_at
  FROM successful_jobs j
  LEFT JOIN job_logs l ON l."jobId" = j.job_id
  GROUP BY j.job_id
),
state_durations AS (
  SELECT job_id, 'DOWNLOADING'::text AS state,
         EXTRACT(EPOCH FROM (download_completed_at - download_started_at)) AS duration_seconds
  FROM state_markers
  WHERE download_completed_at >= download_started_at

  UNION ALL
  SELECT job_id, 'PROCESSING',
         EXTRACT(EPOCH FROM (upload_started_at - download_completed_at))
  FROM state_markers
  WHERE upload_started_at >= download_completed_at

  UNION ALL
  SELECT job_id, 'UPLOADING',
         EXTRACT(EPOCH FROM (pipeline_completed_at - upload_started_at))
  FROM state_markers
  WHERE pipeline_completed_at >= upload_started_at
),
media_facts AS (
  SELECT DISTINCT ON (l."jobId")
    l."jobId" AS job_id,
    (l.context ->> 'durationMs')::numeric / 1000.0 AS video_seconds,
    (l.context ->> 'inputFileSizeBytes')::numeric AS input_bytes
  FROM job_logs l
  WHERE l.message = 'Input media inspected'
    AND jsonb_typeof(l.context -> 'durationMs') = 'number'
  ORDER BY l."jobId", l."occurredAt" DESC
),
pipeline_facts AS (
  SELECT DISTINCT ON (l."jobId")
    l."jobId" AS job_id,
    (l.context ->> 'totalDurationMs')::numeric / 1000.0 AS pipeline_seconds
  FROM job_logs l
  WHERE l.message = 'Video pipeline completed'
    AND jsonb_typeof(l.context -> 'totalDurationMs') = 'number'
  ORDER BY l."jobId", l."occurredAt" DESC
),
hls_facts AS (
  SELECT s.job_id, s.duration_seconds AS transcode_seconds, m.video_seconds
  FROM stage_events s
  LEFT JOIN media_facts m USING (job_id)
  WHERE s.stage = 'hls-transcode'
),
report AS (
  /* Counts and coverage */
  SELECT 'overview'::text section, 'successful jobs'::text metric, 'jobs'::text unit,
         COUNT(*)::bigint sample_count, COUNT(*)::numeric value
  FROM successful_jobs

  UNION ALL
  SELECT 'overview', 'jobs with complete structured stage telemetry', 'jobs',
         COUNT(DISTINCT job_id), COUNT(DISTINCT job_id)::numeric
  FROM stage_events

  UNION ALL
  SELECT 'overview', 'jobs with measured download bytes', 'jobs',
         COUNT(*), COUNT(*)::numeric
  FROM download_jobs

  UNION ALL
  SELECT 'overview', 'jobs with measured upload bytes', 'jobs',
         COUNT(*), COUNT(*)::numeric
  FROM upload_jobs WHERE bytes > 0

  /* Start latency */
  UNION ALL
  SELECT 'startup', 'average cold start latency', 'seconds', COUNT(*), AVG(start_seconds)
  FROM successful_jobs WHERE start_type = 'COLD' AND start_seconds >= 0

  UNION ALL
  SELECT 'startup', 'p50 cold start latency', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY start_seconds)
  FROM successful_jobs WHERE start_type = 'COLD' AND start_seconds >= 0

  UNION ALL
  SELECT 'startup', 'p95 cold start latency', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY start_seconds)
  FROM successful_jobs WHERE start_type = 'COLD' AND start_seconds >= 0

  UNION ALL
  SELECT 'startup', 'average hot start latency', 'seconds', COUNT(*), AVG(start_seconds)
  FROM successful_jobs WHERE start_type = 'HOT' AND start_seconds >= 0

  UNION ALL
  SELECT 'startup', 'p50 hot start latency', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY start_seconds)
  FROM successful_jobs WHERE start_type = 'HOT' AND start_seconds >= 0

  UNION ALL
  SELECT 'startup', 'p95 hot start latency', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY start_seconds)
  FROM successful_jobs WHERE start_type = 'HOT' AND start_seconds >= 0

  UNION ALL
  SELECT 'startup', 'average instance provisioning to ready', 'seconds', COUNT(*),
         AVG(EXTRACT(EPOCH FROM (instance_ready_at - instance_created_at)))
  FROM cold_instances

  /* Download */
  UNION ALL
  SELECT 'download', 'average download duration', 'seconds', COUNT(*), AVG(duration_seconds)
  FROM download_jobs

  UNION ALL
  SELECT 'download', 'p50 download duration', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_seconds)
  FROM download_jobs

  UNION ALL
  SELECT 'download', 'p95 download duration', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_seconds)
  FROM download_jobs

  UNION ALL
  SELECT 'download', 'weighted duration per GiB', 'seconds/GiB', COUNT(*),
         SUM(duration_seconds) / NULLIF(SUM(bytes), 0) * MAX(p.bytes_per_gib)
  FROM download_jobs CROSS JOIN params p

  UNION ALL
  SELECT 'download', 'average job-normalized duration per GiB', 'seconds/GiB', COUNT(*),
         AVG(duration_seconds / NULLIF(bytes, 0) * p.bytes_per_gib)
  FROM download_jobs CROSS JOIN params p

  UNION ALL
  SELECT 'download', 'weighted throughput', 'MiB/second', COUNT(*),
         SUM(bytes) / NULLIF(SUM(duration_seconds), 0) / 1048576.0
  FROM download_jobs

  /* Upload */
  UNION ALL
  SELECT 'upload', 'average observed upload phase duration', 'seconds', COUNT(*), AVG(duration_seconds)
  FROM upload_jobs

  UNION ALL
  SELECT 'upload', 'p50 observed upload phase duration', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_seconds)
  FROM upload_jobs

  UNION ALL
  SELECT 'upload', 'p95 observed upload phase duration', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_seconds)
  FROM upload_jobs

  UNION ALL
  SELECT 'upload', 'weighted duration per GiB', 'seconds/GiB', COUNT(*) FILTER (WHERE bytes > 0),
         SUM(duration_seconds) FILTER (WHERE bytes > 0)
           / NULLIF(SUM(bytes) FILTER (WHERE bytes > 0), 0) * MAX(p.bytes_per_gib)
  FROM upload_jobs CROSS JOIN params p

  UNION ALL
  SELECT 'upload', 'average job-normalized duration per GiB', 'seconds/GiB', COUNT(*) FILTER (WHERE bytes > 0),
         AVG(duration_seconds / NULLIF(bytes, 0) * p.bytes_per_gib) FILTER (WHERE bytes > 0)
  FROM upload_jobs CROSS JOIN params p

  /* End-to-end and transcoding */
  UNION ALL
  SELECT 'end-to-end', 'average registered to completed', 'seconds', COUNT(*), AVG(end_to_end_seconds)
  FROM successful_jobs WHERE end_to_end_seconds >= 0

  UNION ALL
  SELECT 'end-to-end', 'p95 registered to completed', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY end_to_end_seconds)
  FROM successful_jobs WHERE end_to_end_seconds >= 0

  UNION ALL
  SELECT 'end-to-end', 'average dispatched to completed', 'seconds', COUNT(*), AVG(worker_seconds)
  FROM successful_jobs WHERE worker_seconds >= 0

  UNION ALL
  SELECT 'pipeline', 'average worker pipeline duration', 'seconds', COUNT(*), AVG(pipeline_seconds)
  FROM pipeline_facts

  UNION ALL
  SELECT 'transcode', 'average HLS transcode duration', 'seconds', COUNT(*), AVG(transcode_seconds)
  FROM hls_facts

  UNION ALL
  SELECT 'transcode', 'p50 HLS transcode duration', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY transcode_seconds)
  FROM hls_facts

  UNION ALL
  SELECT 'transcode', 'p95 HLS transcode duration', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY transcode_seconds)
  FROM hls_facts

  UNION ALL
  SELECT 'transcode', 'average processing-to-video ratio', 'x realtime', COUNT(*),
         AVG(transcode_seconds / NULLIF(video_seconds, 0))
  FROM hls_facts WHERE video_seconds > 0

  UNION ALL
  SELECT 'transcode', 'weighted processing-to-video ratio', 'x realtime', COUNT(*),
         SUM(transcode_seconds) / NULLIF(SUM(video_seconds), 0)
  FROM hls_facts WHERE video_seconds > 0

  /* Worker status durations reconstructed from the matching structured boundaries. */
  UNION ALL
  SELECT 'state: ' || state, 'average duration', 'seconds', COUNT(*), AVG(duration_seconds)
  FROM state_durations GROUP BY state

  UNION ALL
  SELECT 'state: ' || state, 'p50 duration', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_seconds)
  FROM state_durations GROUP BY state

  UNION ALL
  SELECT 'state: ' || state, 'p95 duration', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_seconds)
  FROM state_durations GROUP BY state

  /* Every recorded stage, including probe, derivatives, composition, uploads, and webhook. */
  UNION ALL
  SELECT 'stage: ' || stage, 'average duration', 'seconds', COUNT(*), AVG(duration_seconds)
  FROM stage_events GROUP BY stage

  UNION ALL
  SELECT 'stage: ' || stage, 'p50 duration', 'seconds', COUNT(*),
         percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_seconds)
  FROM stage_events GROUP BY stage

  UNION ALL
  SELECT 'stage: ' || stage, 'p95 duration', 'seconds', COUNT(*),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_seconds)
  FROM stage_events GROUP BY stage

  UNION ALL
  SELECT 'stage: ' || stage, 'minimum duration', 'seconds', COUNT(*), MIN(duration_seconds)
  FROM stage_events GROUP BY stage

  UNION ALL
  SELECT 'stage: ' || stage, 'maximum duration', 'seconds', COUNT(*), MAX(duration_seconds)
  FROM stage_events GROUP BY stage

  UNION ALL
  SELECT 'stage: ' || stage, 'duration standard deviation', 'seconds', COUNT(*), STDDEV_SAMP(duration_seconds)
  FROM stage_events GROUP BY stage
)
SELECT
  section,
  metric,
  unit,
  sample_count,
  ROUND(value::numeric, 3) AS value
FROM report
ORDER BY
  CASE section
    WHEN 'overview' THEN 1
    WHEN 'startup' THEN 2
    WHEN 'download' THEN 3
    WHEN 'transcode' THEN 4
    WHEN 'upload' THEN 5
    WHEN 'pipeline' THEN 6
    WHEN 'end-to-end' THEN 7
    ELSE 8
  END,
  section,
  metric;
