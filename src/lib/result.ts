export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T = never>(error: Error): Result<T> => ({
  ok: false,
  error,
});
