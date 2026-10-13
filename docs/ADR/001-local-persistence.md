# ADR 001: local persistence and world ownership

The local MVP uses Node's built-in SQLite driver with WAL and transactional snapshot/event commits. PostgreSQL remains the production target. WorldStore isolates storage from simulation and networking; production deployment must provide a PostgreSQL implementation, migrations, and backups.

The authoritative simulation is owned by the server process, not a room connection. Colyseus projects public state. A compare-and-swap snapshot version fences stale writers. Confirmed events and the snapshot commit together before publication.

Recovery replays at most five minutes using fixed 250ms steps. Longer downtime is explicitly recorded and remaining time skipped without inventing actions. This is bounded local recovery, not a guarantee of continuous simulation while the process is stopped. The world continues with zero viewers while the server is running.

Private needs, relationships, inventories, plans, and memories stay in the server store. Only the public projection is synchronized. Public history is paginated from the durable event log.
