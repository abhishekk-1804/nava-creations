/**
 * Base Application and Domain Errors for NAVA CREATIONS
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly timestamp: Date;

  constructor(message: string, readonly details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND_ERROR';
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT_ERROR';
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED_ERROR';
}

export class InvalidStateTransitionError extends DomainError {
  readonly code = 'INVALID_STATE_TRANSITION';
}

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
}
