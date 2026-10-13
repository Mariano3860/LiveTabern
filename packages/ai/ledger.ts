import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface Limits {
  dailyCalls: number;
  monthlyCalls: number;
  dailyMicroUsd: number;
  monthlyMicroUsd: number;
}
export interface Usage {
  calls: number;
  reservedMicroUsd: number;
}
function periods(now: number) {
  const date = new Date(now).toISOString();
  return { day: date.slice(0, 10), month: date.slice(0, 7) };
}
export class AiLedger {
  private db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS ai_requests (
        id TEXT PRIMARY KEY, day TEXT NOT NULL, month TEXT NOT NULL,
        reserved_micro_usd INTEGER NOT NULL, status TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ai_requests_day ON ai_requests(day);
      CREATE INDEX IF NOT EXISTS ai_requests_month ON ai_requests(month);`);
  }
  usage(now: number): { daily: Usage; monthly: Usage } {
    const { day, month } = periods(now);
    const read = (period: 'day' | 'month', value: string): Usage => {
      const row = this.db
        .prepare(
          `SELECT COUNT(*) AS calls, COALESCE(SUM(reserved_micro_usd), 0) AS cost FROM ai_requests WHERE ${period} = ?`,
        )
        .get(value)!;
      return { calls: Number(row.calls), reservedMicroUsd: Number(row.cost) };
    };
    return { daily: read('day', day), monthly: read('month', month) };
  }
  reserve(now: number, cost: number, limits: Limits): string | null {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const { daily, monthly } = this.usage(now);
      if (
        daily.calls >= limits.dailyCalls ||
        monthly.calls >= limits.monthlyCalls ||
        daily.reservedMicroUsd + cost > limits.dailyMicroUsd ||
        monthly.reservedMicroUsd + cost > limits.monthlyMicroUsd
      ) {
        this.db.exec('ROLLBACK');
        return null;
      }
      const id = randomUUID(),
        { day, month } = periods(now);
      this.db.prepare('INSERT INTO ai_requests VALUES (?, ?, ?, ?, ?)').run(id, day, month, cost, 'pending');
      this.db.exec('COMMIT');
      return id;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  finish(id: string, status: string) {
    this.db.prepare('UPDATE ai_requests SET status = ? WHERE id = ?').run(status, id);
  }
  close() {
    this.db.close();
  }
}
