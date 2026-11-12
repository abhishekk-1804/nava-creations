/**
 * Safe Result Monad pattern for domain and infrastructure operations.
 * Replaces unhandled exceptions with explicit success and failure states.
 */

export type Result<T, E> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(readonly value: T) {}

  map<U>(fn: (val: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  flatMap<U, E2>(fn: (val: T) => Result<U, E2>): Result<U, E2> {
    return fn(this.value);
  }
}

export class Failure<E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(readonly error: E) {}

  map<U>(_fn: (val: never) => U): Result<never, E> {
    return this;
  }

  flatMap<U, E2>(_fn: (val: never) => Result<U, E2>): Result<U, E> {
    return this;
  }
}

export function ok<T>(value: T): Result<T, never> {
  return new Success(value);
}

export function err<E>(error: E): Result<never, E> {
  return new Failure(error);
}
