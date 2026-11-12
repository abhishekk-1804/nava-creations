import { describe, it, expect } from 'vitest';
import { ok, err } from '../src/result.js';

describe('Result Pattern', () => {
  it('creates a Success instance with ok()', () => {
    const res = ok(42);
    expect(res.isSuccess).toBe(true);
    expect(res.isFailure).toBe(false);
    if (res.isSuccess) {
      expect(res.value).toBe(42);
    }
  });

  it('creates a Failure instance with err()', () => {
    const res = err('Sample error');
    expect(res.isSuccess).toBe(false);
    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect(res.error).toBe('Sample error');
    }
  });

  it('chains transformations with map() and flatMap()', () => {
    const success = ok(10)
      .map((x) => x * 2)
      .flatMap((x) => ok(x + 5));

    expect(success.isSuccess).toBe(true);
    if (success.isSuccess) {
      expect(success.value).toBe(25);
    }

    const failure = err('Initial fail')
      .map((x) => (x as number) * 2);

    expect(failure.isFailure).toBe(true);
    if (failure.isFailure) {
      expect(failure.error).toBe('Initial fail');
    }
  });
});
