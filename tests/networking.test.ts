import { expect, it, vi } from 'vitest';
import { latestJson } from '../packages/networking/json-cache';

it('parses a record once across movement patches and replaces it when confirmed data changes', () => {
  const parse = vi.spyOn(JSON, 'parse');
  try {
    const events = latestJson<{ id: string }[]>([]),
      otherConnection = latestJson<{ id: string }[]>([]);
    const initial = events('[{"id":"event-1"}]');
    for (let patch = 0; patch < 100; patch++) expect(events('[{"id":"event-1"}]')).toBe(initial);
    expect(parse).toHaveBeenCalledTimes(1);
    const updated = events('[{"id":"event-1"},{"id":"event-2"}]');
    expect(updated).not.toBe(initial);
    expect(updated.map((event) => event.id)).toEqual(['event-1', 'event-2']);
    expect(otherConnection('')).toEqual([]);
    expect(events('[{"id":"event-1"},{"id":"event-2"}]')).toBe(updated);
    expect(parse).toHaveBeenCalledTimes(3);
    expect(() => events('{broken')).toThrow();
    expect(events('[{"id":"event-1"},{"id":"event-2"}]')).toBe(updated);
  } finally {
    parse.mockRestore();
  }
});
