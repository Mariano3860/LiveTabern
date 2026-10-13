import { backup, DatabaseSync } from 'node:sqlite';
import { closeSync, createReadStream, mkdirSync, openSync, statSync, unlinkSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { eventSchema, worldSchema } from './schema';

const reservationSchema = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    reserved_micro_usd: z.number().int().nonnegative(),
    status: z.string().min(1).max(64),
  })
  .refine((row) => row.month === row.day.slice(0, 7));
function requireStandalone(path: string) {
  try {
    if (statSync(`${path}-wal`).size > 0)
      throw new Error(
        'Create an online backup before verifying or restoring a database with pending WAL writes',
      );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
export async function verifyWorldFile(path: string) {
  const filename = resolve(path);
  requireStandalone(filename);
  const database = new DatabaseSync(filename, { readOnly: true });
  try {
    database.exec('BEGIN');
    const integrity = database.prepare('PRAGMA quick_check').all();
    if (integrity.length !== 1 || Object.values(integrity[0])[0] !== 'ok')
      throw new Error('SQLite integrity check failed');
    const snapshots = database.prepare('SELECT id, version, state FROM snapshots').all();
    if (snapshots.length !== 1) throw new Error('Expected exactly one world snapshot');
    const world = worldSchema.parse(JSON.parse(String(snapshots[0].state)));
    if (world.id !== 'wandering-ember' || world.id !== snapshots[0].id)
      throw new Error('Snapshot identity is incompatible with this tavern');
    if (world.version !== Number(snapshots[0].version))
      throw new Error('Snapshot version does not match stored state');
    let events = 0;
    for (const row of database
      .prepare('SELECT id, sequence, category, actors, data FROM events ORDER BY sequence')
      .iterate()) {
      const event = eventSchema.parse(JSON.parse(String(row.data)));
      if (
        event.sequence !== ++events ||
        event.sequence !== Number(row.sequence) ||
        event.id !== row.id ||
        event.category !== row.category ||
        JSON.stringify(event.actors) !== JSON.stringify(JSON.parse(String(row.actors)))
      )
        throw new Error('History contains inconsistent event records');
    }
    if (events !== world.sequence) throw new Error('History does not match the confirmed snapshot');
    let aiReservations = 0,
      aiReservedMicroUsd = 0;
    if (
      database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ai_requests'").get()
    ) {
      for (const row of database
        .prepare('SELECT day, month, reserved_micro_usd, status FROM ai_requests')
        .iterate()) {
        const request = reservationSchema.parse(row);
        aiReservations++;
        aiReservedMicroUsd += request.reserved_micro_usd;
      }
    }
    database.exec('COMMIT');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(filename)) hash.update(chunk);
    requireStandalone(filename);
    return {
      path: filename,
      worldId: world.id,
      version: world.version,
      worldTime: world.time,
      events,
      inhabitants: world.inhabitants.length,
      totalCoins: world.inhabitants.reduce((sum, npc) => sum + npc.coins, 0),
      aiReservations,
      aiReservedMicroUsd,
      bytes: statSync(filename).size,
      sha256: hash.digest('hex'),
    };
  } finally {
    database.close();
  }
}
export async function backupWorld(source: string, destination: string) {
  const from = resolve(source),
    to = resolve(destination);
  if (from === to) throw new Error('Backup must use a separate destination');
  const database = new DatabaseSync(from, { readOnly: true });
  let owned = false;
  try {
    mkdirSync(dirname(to), { recursive: true });
    closeSync(openSync(to, 'wx', 0o600));
    owned = true;
    // Pin one WAL read snapshot while the independent world writer continues committing.
    database.exec('BEGIN');
    database.prepare('SELECT version FROM snapshots').get();
    await backup(database, to);
    database.exec('COMMIT');
    return await verifyWorldFile(to);
  } catch (error) {
    if (owned) unlinkSync(to);
    throw error;
  } finally {
    database.close();
  }
}
export async function restoreBackup(source: string, destination: string) {
  const from = resolve(source),
    to = resolve(destination);
  if (from === to) throw new Error('Restore must use a separate destination');
  const verified = await verifyWorldFile(from);
  mkdirSync(dirname(to), { recursive: true });
  await copyFile(from, to, constants.COPYFILE_EXCL);
  try {
    const restored = await verifyWorldFile(to);
    if (restored.sha256 !== verified.sha256)
      throw new Error('Restored file does not match the verified backup');
    return restored;
  } catch (error) {
    unlinkSync(to);
    throw error;
  }
}
