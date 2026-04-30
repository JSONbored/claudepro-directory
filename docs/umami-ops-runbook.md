# Umami Ops Runbook

Umami is non-blocking website analytics. HeyClaude should keep working when
Umami ingestion is slow or unavailable.

## Replay Event Ingestion

```bash
curl -i https://umami.heyclau.de/api/send \
  -H 'content-type: application/json' \
  --data '{"type":"event","payload":{"website":"WEBSITE_ID","hostname":"heyclau.de","language":"en-US","screen":"1440x900","url":"/","title":"HeyClaude","name":"ops-check"}}'
```

If this hangs or returns no body, inspect Railway before changing HeyClaude:

- deployment logs for request timeout or insert failures
- database connection env vars
- migration status
- connection pool limits
- app CPU/memory saturation

Do not change HeyClaude CSP, script URL, or Worker code unless Railway logs show
the request reaches Umami and is rejected because of the caller.
