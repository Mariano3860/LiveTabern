import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  annotationSchema,
  contextSchema,
  type Annotation,
  type NarrativeContext,
  type NarrativeProvider,
} from './contracts';
import { AiLedger, type Limits } from './ledger';

const integer = z.number().int().min(0).max(1_000_000_000);
export const gatewayConfigSchema = z
  .object({
    mode: z.enum(['off', 'mock']).default('off'),
    dailyCalls: integer.default(20),
    monthlyCalls: integer.default(200),
    dailyMicroUsd: integer.default(0),
    monthlyMicroUsd: integer.default(0),
    timeoutMs: z.number().int().min(10).max(10_000).default(2000),
    cacheTtlMs: z.number().int().min(0).max(600_000).default(300_000),
    failureThreshold: z.number().int().min(1).max(10).default(3),
    circuitMs: z.number().int().min(10).max(600_000).default(60_000),
  })
  .strict();
export type GatewayConfig = z.infer<typeof gatewayConfigSchema>;
type Rejection =
  | 'off'
  | 'invalid-context'
  | 'busy'
  | 'budget-exhausted'
  | 'circuit-open'
  | 'invalid-response'
  | 'timeout'
  | 'provider-failed'
  | 'ledger-unavailable';
export type GatewayResult = { status: 'ok' | 'cached'; annotation: Annotation } | { status: Rejection };
export function configFromEnvironment(env: NodeJS.ProcessEnv): GatewayConfig {
  const read = (name: string) => (env[name] === undefined ? undefined : Number(env[name]));
  return gatewayConfigSchema.parse({
    mode: env.AI_MODE,
    dailyCalls: read('AI_DAILY_CALLS'),
    monthlyCalls: read('AI_MONTHLY_CALLS'),
    dailyMicroUsd: read('AI_DAILY_MICRO_USD'),
    monthlyMicroUsd: read('AI_MONTHLY_MICRO_USD'),
    timeoutMs: read('AI_TIMEOUT_MS'),
  });
}
export class NarrativeGateway {
  readonly config: GatewayConfig;
  private active = false;
  private failures = 0;
  private circuitUntil = 0;
  private cache = new Map<string, { expires: number; annotation: Annotation }>();
  private lastStatus: GatewayResult['status'] = 'off';
  constructor(
    config: GatewayConfig,
    private ledger: AiLedger,
    private provider: NarrativeProvider,
    private now = Date.now,
  ) {
    this.config = gatewayConfigSchema.parse(config);
    integer.parse(provider.maxRequestMicroUsd);
  }
  metrics() {
    return {
      mode: this.config.mode,
      ...this.ledger.usage(this.now()),
      active: this.active,
      circuitOpen: this.now() < this.circuitUntil,
      lastStatus: this.lastStatus,
      limits: this.config,
    };
  }
  async annotate(input: NarrativeContext): Promise<GatewayResult> {
    const result = await this.request(input);
    this.lastStatus = result.status;
    return result;
  }
  private async request(input: NarrativeContext): Promise<GatewayResult> {
    if (this.config.mode === 'off') return { status: 'off' };
    const parsed = contextSchema.safeParse(input);
    if (!parsed.success) return { status: 'invalid-context' };
    const context = parsed.data;
    const key = createHash('sha256').update(this.provider.id).update(JSON.stringify(context)).digest('hex');
    const cached = this.cache.get(key);
    if (cached && cached.expires > this.now())
      return { status: 'cached', annotation: structuredClone(cached.annotation) };
    if (this.active) return { status: 'busy' };
    if (this.now() < this.circuitUntil) return { status: 'circuit-open' };
    let reservation: string | null;
    try {
      reservation = this.ledger.reserve(this.now(), this.provider.maxRequestMicroUsd, this.config as Limits);
    } catch {
      return { status: 'ledger-unavailable' };
    }
    if (!reservation) return { status: 'budget-exhausted' };
    this.active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Keep the concurrency slot until the provider settles, even if it ignores cancellation.
    const providerWork = Promise.resolve().then(() => this.provider.generate(context, controller.signal));
    void providerWork.then(
      () => {
        this.active = false;
      },
      () => {
        this.active = false;
      },
    );
    let status: GatewayResult['status'] = 'provider-failed';
    try {
      const raw = await Promise.race([
        providerWork,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('timeout'));
          }, this.config.timeoutMs);
        }),
      ]);
      const output = annotationSchema.safeParse(raw);
      if (!output.success || !context.events.some((event) => event.id === output.data.sourceEventId)) {
        status = 'invalid-response';
        this.fail();
        return { status };
      }
      this.failures = 0;
      status = 'ok';
      for (const [id, entry] of this.cache) if (entry.expires <= this.now()) this.cache.delete(id);
      if (this.cache.size >= 64) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, {
        expires: this.now() + this.config.cacheTtlMs,
        annotation: structuredClone(output.data),
      });
      return { status, annotation: output.data };
    } catch {
      status = controller.signal.aborted ? 'timeout' : 'provider-failed';
      this.fail();
      return { status };
    } finally {
      clearTimeout(timer);
      // A failed or timed-out call keeps its reservation: the provider may have incurred cost.
      try {
        this.ledger.finish(reservation, status);
      } catch {
        /* Reservation remains durable and charged. */
      }
    }
  }
  private fail() {
    if (++this.failures >= this.config.failureThreshold)
      this.circuitUntil = this.now() + this.config.circuitMs;
  }
}
