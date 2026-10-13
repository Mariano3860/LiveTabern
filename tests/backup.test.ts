import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { WorldStore } from '../packages/persistence/store';
import { backupWorld, restoreBackup, verifyWorldFile } from '../packages/persistence/backup';
import { createWorld, tickWorld } from '../packages/simulation/engine';
import { AiLedger } from '../packages/ai/ledger';

const folders: string[] = [];
afterEach(() => {
  folders.splice(0).forEach((folder) => {
    if (!resolve(folder).startsWith(join(tmpdir(), 'livetabern-backup-')))
      throw new Error('Unexpected cleanup path');
    rmSync(folder, { recursive: true, force: true });
  });
});
function paths() {
  const folder = mkdtempSync(join(tmpdir(), 'livetabern-backup-'));
  folders.push(folder);
  return {
    source: join(folder, 'world.sqlite'),
    backup: join(folder, 'backup.sqlite'),
    restored: join(folder, 'restored.sqlite'),
  };
}
it('backs up an open WAL world and restores state, durable history, and charged AI reservations', async () => {
  const files = paths(),
    writer = new WorldStore(files.source),
    ledger = new AiLedger(files.source),
    world = createWorld(0);
  try {
    writer.save(world, world.events);
    ledger.reserve(Date.UTC(2026, 9, 13), 10, {
      dailyCalls: 2,
      monthlyCalls: 2,
      dailyMicroUsd: 20,
      monthlyMicroUsd: 20,
    });
    const report = await backupWorld(files.source, files.backup);
    expect(report.events).toBe(world.sequence);
    expect(report.aiReservations).toBe(1);
    expect(report.aiReservedMicroUsd).toBe(10);
    expect(report.sha256).toMatch(/^[a-f0-9]{64}$/);
    await expect(verifyWorldFile(files.source)).rejects.toThrow('pending WAL');
    tickWorld(world, 250, { path: (_from, to) => [to] });
    writer.save(world, []);
    expect((await verifyWorldFile(files.backup)).version).toBe(0);
    const restored = await restoreBackup(files.backup, files.restored);
    expect(restored.sha256).toBe(report.sha256);
    const recovered = new WorldStore(files.restored),
      restoredLedger = new AiLedger(files.restored);
    try {
      expect(recovered.load()?.inhabitants).toEqual(createWorld(0).inhabitants);
      expect(recovered.history()).toHaveLength(report.events);
      expect(restoredLedger.usage(Date.UTC(2026, 9, 13)).daily.reservedMicroUsd).toBe(10);
    } finally {
      recovered.close();
      restoredLedger.close();
    }
  } finally {
    writer.close();
    ledger.close();
  }
});
it('refuses overwrite, self-copy, missing sources, and partial corrupted backups', async () => {
  const files = paths(),
    store = new WorldStore(files.source),
    world = createWorld(0);
  store.save(world, world.events);
  store.close();
  await backupWorld(files.source, files.backup);
  const original = readFileSync(files.backup);
  await expect(backupWorld(files.source, files.source)).rejects.toThrow('separate destination');
  await expect(backupWorld(files.source, files.backup)).rejects.toThrow();
  expect(readFileSync(files.backup)).toEqual(original);
  await expect(restoreBackup(files.backup, files.source)).rejects.toThrow();
  await expect(backupWorld(`${files.source}.missing`, files.restored)).rejects.toThrow();
  expect(existsSync(files.restored)).toBe(false);
  const corrupt = new DatabaseSync(files.source);
  corrupt.prepare('DELETE FROM events WHERE sequence = 1').run();
  corrupt.close();
  await expect(backupWorld(files.source, files.restored)).rejects.toThrow('History does not match');
  expect(existsSync(files.restored)).toBe(false);
});
it('refuses a snapshot identity that the world loader would not restore', async () => {
  const files = paths(),
    store = new WorldStore(files.source),
    world = createWorld(0);
  store.save(world, world.events);
  store.close();
  const altered = new DatabaseSync(files.source);
  world.id = 'another-tavern';
  altered.prepare('UPDATE snapshots SET state = ?').run(JSON.stringify(world));
  altered.close();
  await expect(backupWorld(files.source, files.backup)).rejects.toThrow('identity is incompatible');
  expect(existsSync(files.backup)).toBe(false);
});
