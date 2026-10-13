# Optional narrative gateway

Status: accepted for the local MVP.

The gateway is a server-only annotation boundary. It accepts at most eight public confirmed events, truncates each source text to 220 characters, and validates an exact output shape containing a source event ID and a caption of at most 320 characters. Source IDs must belong to the request. No action, inventory mutation, executable code, or private memory is accepted. Output is an administrator preview and is never committed as a canonical world event.

Modes are `off` and `mock`. Off does not reserve or invoke anything. Mock uses a local template and incurs no provider cost. Unsupported modes fail startup rather than silently enabling a service. A future paid adapter requires explicit authorization, verified pricing, a demonstrable per-request upper cost bound including retries and reasoning, and provider transport/output limits. No real API adapter or model API key is included in this milestone. The [official structured-output documentation](https://developers.openai.com/api/docs/guides/structured-outputs) informs the exact schema boundary; local validation remains mandatory and does not prove semantic truth.

SQLite reserves daily/monthly calls and micro-USD upper bounds in an immediate transaction before dispatch. This ledger uses separate tables in the world database, survives restart, and serializes reservations from separate connections. Failed, timed-out, and process-interrupted attempts retain their entire reservation. Reservations measure worst-case authorized spend, not provider invoice totals. UTC periods reset naturally; the local process clock is trusted. Zero spend limits prevent any nonzero-cost adapter request.

The gateway caches at most 64 validated responses for five minutes, dispatches at most one provider request at a time, uses a two-second default timeout, and opens a one-minute circuit after three failures. A provider that ignores cancellation retains its concurrency slot until it settles. Late output cannot become a preview or world effect. Cache entries and circuit state are process-local; spending reservations are durable. Storage failures refuse new work. Simulation ticks never await this gateway.

The administrator endpoint builds context itself, accepts only an empty object, and uses the existing bearer-token protection. It provides the confirmed source beside the annotation for review. Generative dialogue, automated director proposals, semantic evaluation, and paid-provider operation remain separate work.
