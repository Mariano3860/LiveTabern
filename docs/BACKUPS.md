# Local world backups

Run from the project directory with the same `.env` / `WORLD_DB` as the server. No administrator token or model API key is required for a local filesystem command.

```sh
npm run backup
```

This creates a uniquely named file in `.local/backups/` and prints a verification report. You can also supply a new destination:

```sh
npm run backup -- .local/backups/my-evening.sqlite
npm run backup -- --verify .local/backups/my-evening.sqlite
```

The server can remain running. The command uses [Node's native SQLite backup API](https://github.com/nodejs/node/blob/v22.19.0/doc/api/sqlite.md#sqlitebackupsourceDb-destination-options), with a pinned WAL read snapshot rather than copying a database file that may have uncommitted sidecar data. It reserves the destination exclusively and refuses to overwrite any existing file. If copying or verification fails, the newly created partial destination is removed.

Verification checks SQLite integrity, the current snapshot schema and version, every archived event's sequence and duplicated columns, complete history through the snapshot's event sequence, and AI reservation records when present. The report includes identity/version/time, counts, total coins, bytes, and a streaming SHA-256 checksum. It does not print private memories or API secrets. The database itself contains private world data and is excluded from Git.

## Restore a separate candidate

```sh
npm run backup -- --restore .local/backups/my-evening.sqlite .local/restored-world.sqlite
```

This first verifies the backup, creates the destination only if it does not exist, and rechecks the copy against the original checksum. It does not switch the running server or replace the current world. Verification/restore refuses nonempty pending WAL files; create an online backup first when the source is an active database.

To run the restored candidate, stop the development server, set `WORLD_DB=.local/restored-world.sqlite` in `.env`, and restart with `npm run dev`. Keep the original `.local/world.sqlite` and the backup. Restart catch-up still follows the documented five-minute bound. AI usage reservations in the backup are preserved; a restore is not a quota reset.

## Diagnostics

Protected administration now includes `snapshotAgeMs` and `publicSnapshotBytes`. Snapshot age is the elapsed wall time since the latest committed simulation time. Public snapshot bytes measure the full HTTP world projection, including its bounded event history; this is not WebSocket delta bandwidth or GPU frame time.

The command is manual, does not upload data, and does not schedule retention or backups. Production operations still need independent/off-device storage, access policy, restore drills, supervision, and PostgreSQL work.
