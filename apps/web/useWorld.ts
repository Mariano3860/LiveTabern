import { Client, type Room } from '@colyseus/sdk';
import { useEffect, useState } from 'react';
import type { Action, PublicWorld, Snapshot } from '../../packages/shared/world';
import type { TavernState } from '../../packages/networking/schema';

declare global {
  interface Window {
    __TAVERN__?: {
      snapshot(): Snapshot | null;
      rendering?: { drawCalls: number; triangles: number; frames: number; lastFrameMs: number };
    };
  }
}
export function useWorld() {
  const [world, setWorld] = useState<PublicWorld | null>(null),
    [online, setOnline] = useState(false),
    [viewers, setViewers] = useState(0);
  useEffect(() => {
    let stopped = false,
      retry: ReturnType<typeof setTimeout> | undefined,
      room: Room<unknown, TavernState> | undefined;
    let latest: Snapshot | null = null;
    if (import.meta.env.DEV)
      window.__TAVERN__ = { snapshot: () => (latest ? structuredClone(latest) : null) };
    const endpoint =
      import.meta.env.VITE_WORLD_URL ??
      (import.meta.env.DEV ? `${location.protocol}//${location.hostname}:3001` : location.origin);
    const client = new Client(endpoint);
    function update(state: TavernState) {
      if (stopped || !state.id) return;
      const inhabitants = [...state.inhabitants.values()].map((n) => ({
        id: n.id,
        name: n.name,
        role: n.role,
        description: n.description,
        color: n.color,
        position: [n.x, n.z] as [number, number],
        target: [n.tx, n.tz] as [number, number],
        action: n.action as Action,
        phase: n.phase as 'walking' | 'performing' | 'idle',
        coins: n.coins,
        energy: n.energy,
        mood: n.mood,
        instrument: n.instrument as 'voice' | 'lute' | 'none',
        partnerId: n.partnerId || undefined,
        until: n.until,
      }));
      const next: PublicWorld = {
        id: state.id,
        version: state.version,
        time: state.time,
        startedAt: state.startedAt,
        stock: state.stock,
        inhabitants,
        events: JSON.parse(state.events || '[]'),
        opportunities: JSON.parse(state.opportunities || '[]'),
        demands: JSON.parse(state.demands || '[]'),
      };
      latest = { world: next, viewers: state.viewers };
      setWorld(next);
      setViewers(state.viewers);
      setOnline(true);
    }
    async function connect() {
      try {
        const response = await fetch(`${endpoint}/api/room`);
        if (!response.ok) throw new Error('World is not ready');
        const { roomId } = await response.json();
        if (stopped) return;
        room = await client.joinById<TavernState>(roomId);
        if (stopped) {
          await room.leave();
          return;
        }
        room.onStateChange(update);
        update(room.state);
        room.onDrop(() => setOnline(false));
        room.onReconnect(() => {
          if (room) update(room.state);
        });
        room.onLeave(() => {
          setOnline(false);
          if (!stopped) retry = setTimeout(connect, 1500);
        });
      } catch {
        if (!stopped) {
          setOnline(false);
          retry = setTimeout(connect, 1500);
        }
      }
    }
    void connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      void room?.leave();
      if (import.meta.env.DEV) delete window.__TAVERN__;
    };
  }, []);
  return { world, online, viewers };
}
