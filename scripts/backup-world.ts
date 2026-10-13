import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { backupWorld, restoreBackup, verifyWorldFile } from '../packages/persistence/backup';

const [first, second, third, ...extra] = process.argv.slice(2);
try {
  if (
    extra.length ||
    (first === '--verify' && (!second || third)) ||
    (first === '--restore' && (!second || !third)) ||
    (first !== '--verify' && first !== '--restore' && (second || first?.startsWith('--')))
  )
    throw new Error('Usage: npm run backup -- [destination] | --verify file | --restore backup new-path');
  const report =
    first === '--verify'
      ? await verifyWorldFile(second)
      : first === '--restore'
        ? await restoreBackup(second, third)
        : await backupWorld(
            process.env.WORLD_DB ?? '.local/world.sqlite',
            first ??
              join(
                '.local/backups',
                `world-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.sqlite`,
              ),
          );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error('Backup operation failed:', error instanceof Error ? error.message : 'Unknown failure');
  process.exitCode = 1;
}
