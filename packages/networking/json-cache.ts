// Each connection keeps only the latest payload; movement patches do not reparse unchanged public records.
export function latestJson<T>(initial: T) {
  let encoded: string | undefined,
    value = initial;
  return (next: string): T => {
    if (next !== encoded) {
      value = JSON.parse(next || '[]') as T;
      encoded = next;
    }
    return value;
  };
}
