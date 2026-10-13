import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiLedger } from '../packages/ai/ledger';
import { NarrativeGateway, gatewayConfigSchema, configFromEnvironment } from '../packages/ai/gateway';
import { mockProvider, narrativeContext, type NarrativeProvider } from '../packages/ai/contracts';
import { createWorld, tickWorld } from '../packages/simulation/engine';
import { publicWorld } from '../packages/shared/world';

const context = { worldId: 'wandering-ember', events: [{ id: 'event-1', text: 'Borin lights the hearth.' }] };
const next = { ...context, events: [{ id: 'event-2', text: 'Elena begins to sing.' }] };
const opened: AiLedger[] = [];
afterEach(() => {
  opened.splice(0).forEach((ledger) => ledger.close());
  vi.useRealTimers();
});
function ledger(path = ':memory:') {
  const store = new AiLedger(path);
  opened.push(store);
  return store;
}
function gateway(
  overrides = {},
  provider: NarrativeProvider = mockProvider,
  store = ledger(),
  now = () => Date.UTC(2026, 9, 13),
) {
  return new NarrativeGateway(
    gatewayConfigSchema.parse({ mode: 'mock', ...overrides }),
    store,
    provider,
    now,
  );
}
describe('optional narrative gateway', () => {
  it('refuses invalid context and storage failure before dispatch', async () => {
    const generate = vi.fn(mockProvider.generate),
      store = ledger();
    const ai = gateway({}, { ...mockProvider, generate }, store);
    expect((await ai.annotate({ ...context, events: [] })).status).toBe('invalid-context');
    expect(
      (await ai.annotate({ ...context, events: [{ id: 'event-1', text: 'x'.repeat(221) }] })).status,
    ).toBe('invalid-context');
    vi.spyOn(store, 'reserve').mockImplementation(() => {
      throw new Error('Unavailable database');
    });
    expect((await ai.annotate(context)).status).toBe('ledger-unavailable');
    expect(generate).not.toHaveBeenCalled();
  });
  it('does not reserve or invoke a provider while off and rejects unsupported modes at startup', async () => {
    const generate = vi.fn(mockProvider.generate),
      store = ledger();
    const ai = gateway({ mode: 'off' }, { ...mockProvider, generate }, store);
    expect(await ai.annotate(context)).toEqual({ status: 'off' });
    expect(generate).not.toHaveBeenCalled();
    expect(ai.metrics().daily.calls).toBe(0);
    expect(() => configFromEnvironment({ AI_MODE: 'openai' })).toThrow();
    expect(() => configFromEnvironment({ AI_DAILY_CALLS: '-1' })).toThrow();
  });
  it('uses bounded public context and caches validated annotations without changing canonical state', async () => {
    const world = createWorld(Date.UTC(2026, 9, 13));
    const before = structuredClone(world),
      input = narrativeContext(publicWorld(world))!;
    expect(JSON.stringify(input)).not.toMatch(/memories|inventory|relationships|ADMIN_TOKEN/);
    expect(input.events.length).toBeLessThanOrEqual(8);
    const generate = vi.fn(mockProvider.generate),
      ai = gateway({}, { ...mockProvider, generate });
    const first = await ai.annotate(input);
    expect(first.status).toBe('ok');
    expect((await ai.annotate(input)).status).toBe('cached');
    expect(generate).toHaveBeenCalledTimes(1);
    expect(ai.metrics().daily.calls).toBe(1);
    expect(world).toEqual(before);
  });
  it.each([
    { sourceEventId: 'invented', caption: 'Invented source' },
    { sourceEventId: 'event-1', caption: '<script>execute()</script>' },
    { sourceEventId: 'event-1', caption: 'Valid text', execute: 'trade' },
    { sourceEventId: 'event-1', caption: 'x'.repeat(321) },
    { refusal: 'No output' },
  ])('rejects malformed, ungrounded, or executable output: %j', async (output) => {
    const ai = gateway({}, { ...mockProvider, generate: async () => output });
    expect(await ai.annotate(context)).toEqual({ status: 'invalid-response' });
    expect(ai.metrics().daily.calls).toBe(1);
  });
  it('reserves daily and monthly request and spend quotas atomically across restart and ledger connections', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'livetabern-ai-')),
      path = join(folder, 'world.sqlite');
    const provider = { ...mockProvider, maxRequestMicroUsd: 10 };
    let now = Date.UTC(2026, 9, 13);
    try {
      const first = ledger(path),
        second = ledger(path);
      const options = { dailyCalls: 1, monthlyCalls: 2, dailyMicroUsd: 10, monthlyMicroUsd: 20 };
      expect((await gateway(options, provider, first, () => now).annotate(context)).status).toBe('ok');
      expect((await gateway(options, provider, second, () => now).annotate(next)).status).toBe(
        'budget-exhausted',
      );
      now += 86400000;
      expect((await gateway(options, provider, second, () => now).annotate(next)).status).toBe('ok');
      now += 86400000;
      const restarted = gateway(options, provider, ledger(path), () => now);
      expect((await restarted.annotate(context)).status).toBe('budget-exhausted');
      expect(restarted.metrics().monthly.reservedMicroUsd).toBe(20);
      now = Date.UTC(2026, 10, 1);
      expect((await restarted.annotate(context)).status).toBe('ok');
    } finally {
      opened.splice(0).forEach((store) => store.close());
      rmSync(folder, { recursive: true, force: true });
    }
  });
  it('refuses a cost reservation above either spend cap even when calls remain', async () => {
    const provider = { ...mockProvider, maxRequestMicroUsd: 10 };
    expect(
      (await gateway({ dailyMicroUsd: 9, monthlyMicroUsd: 100 }, provider).annotate(context)).status,
    ).toBe('budget-exhausted');
    expect(
      (await gateway({ dailyMicroUsd: 100, monthlyMicroUsd: 9 }, provider).annotate(context)).status,
    ).toBe('budget-exhausted');
  });
  it('aborts timeouts and retains the slot for a provider that ignores cancellation', async () => {
    vi.useFakeTimers();
    let settle!: (value: unknown) => void;
    let signal!: AbortSignal;
    const generate = vi.fn((_context, cancellation: AbortSignal) => {
      signal = cancellation;
      return new Promise((resolve) => {
        settle = resolve;
      });
    });
    const ai = gateway({ timeoutMs: 10 }, { ...mockProvider, generate });
    const pending = ai.annotate(context);
    await vi.advanceTimersByTimeAsync(11);
    expect(await pending).toEqual({ status: 'timeout' });
    expect(signal.aborted).toBe(true);
    expect((await ai.annotate(next)).status).toBe('busy');
    expect(ai.metrics().daily.calls).toBe(1);
    settle({ sourceEventId: 'event-1', caption: 'Late output' });
    await Promise.resolve();
    await Promise.resolve();
    expect(ai.metrics().active).toBe(false);
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it('opens a circuit after failures and the ordinary simulation keeps progressing', async () => {
    let now = Date.UTC(2026, 9, 13);
    const generate = vi.fn(async () => {
      throw new Error('Provider failed');
    });
    const ai = gateway(
      { failureThreshold: 2, circuitMs: 20 },
      { ...mockProvider, generate },
      ledger(),
      () => now,
    );
    expect((await ai.annotate(context)).status).toBe('provider-failed');
    expect((await ai.annotate(context)).status).toBe('provider-failed');
    expect((await ai.annotate(context)).status).toBe('circuit-open');
    expect(generate).toHaveBeenCalledTimes(2);
    const world = createWorld(now),
      version = world.version;
    tickWorld(world, now + 250, { path: (_from, to) => [to] });
    expect(world.version).toBeGreaterThan(version);
    now += 21;
    expect((await ai.annotate(context)).status).toBe('provider-failed');
    expect(ai.metrics().daily.calls).toBe(3);
  });
  it('expires its cache and reserves a fresh attempt', async () => {
    let now = Date.UTC(2026, 9, 13);
    const ai = gateway({ cacheTtlMs: 10 }, mockProvider, ledger(), () => now);
    expect((await ai.annotate(context)).status).toBe('ok');
    now += 11;
    expect((await ai.annotate(context)).status).toBe('ok');
    expect(ai.metrics().daily.calls).toBe(2);
  });
});
