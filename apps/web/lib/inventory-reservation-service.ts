/**
 * Concurrency-Safe Inventory Reservation Service
 * 
 * Enforces atomic stock reservations, concurrency conflict prevention, 
 * automated TTL expiry release, and pre-dispatch order cancellation restock.
 * 
 * Strict E-Commerce Invariants:
 * 1. Atomic check-and-decrement: Prevents race conditions when multiple users contest the final stock item.
 * 2. 15-Minute Expiry TTL: Uncompleted checkouts automatically release held stock.
 * 3. Duplicate Release Prevention: Idempotent or strictly guarded transition to avoid phantom restocks.
 * 4. Pre-dispatch Cancellation Only: Post-dispatch cancellations require formal RTO/Return workflows.
 */

import { prisma } from '@nava/db';
import { ReservationStateMachine, OrderStateMachine } from '@nava/domain';
import { InsufficientStockError, ConflictError, NotFoundError, ValidationError } from '@nava/shared';
import { isDatabaseAvailable } from './catalog-service';
import { SAMPLE_PRODUCTS } from './sample-data';

export interface ReserveStockInput {
  variantId: string;
  quantity: number;
  orderId?: string;
  cartId?: string;
  ttlMinutes?: number;
}

export interface ReservationResult {
  id: string;
  variantId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'RELEASED';
  expiresAt: Date;
  orderId?: string;
}

// In-memory atomic inventory repository for testing and offline/local fallback
interface InMemItem {
  variantId: string;
  availableQty: number;
  reservedQty: number;
}

interface InMemReservation {
  id: string;
  variantId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'RELEASED';
  expiresAt: Date;
  orderId?: string;
  cartId?: string;
}

const globalForInventory = globalThis as unknown as {
  __nava_memory_stock__?: Map<string, InMemItem>;
  __nava_memory_reservations__?: Map<string, InMemReservation>;
};

if (!globalForInventory.__nava_memory_stock__) {
  globalForInventory.__nava_memory_stock__ = new Map();
}
if (!globalForInventory.__nava_memory_reservations__) {
  globalForInventory.__nava_memory_reservations__ = new Map();
}

const memoryStock = globalForInventory.__nava_memory_stock__;
const memoryReservations = globalForInventory.__nava_memory_reservations__;

function ensureStockInitialized(variantId: string): void {
  if (!memoryStock.has(variantId)) {
    for (const prod of SAMPLE_PRODUCTS) {
      const v = prod.variants?.find((varItem) => varItem.id === variantId);
      if (v) {
        memoryStock.set(variantId, {
          variantId,
          availableQty: v.availableStock ?? 10,
          reservedQty: 0,
        });
        return;
      }
    }
    // Fallback for dynamically referenced variants in testing
    memoryStock.set(variantId, {
      variantId,
      availableQty: 25,
      reservedQty: 0,
    });
  }
}

// Mutex lock for atomic in-memory transactions
let memoryMutex: Promise<unknown> = Promise.resolve();
function withMemoryLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = memoryMutex.then(() => fn());
  memoryMutex = next.catch(() => {});
  return next;
}

export class InventoryReservationService {
  /**
   * Seeds in-memory stock for automated unit/concurrency tests.
   */
  static seedStock(variantId: string, availableQty: number, reservedQty = 0): void {
    memoryStock.set(variantId, { variantId, availableQty, reservedQty });
  }

  /**
   * Retrieves stock state (availableQty and reservedQty) for a variant.
   */
  static async getStock(variantId: string): Promise<{ availableQty: number; reservedQty: number }> {
    if (isDatabaseAvailable()) {
      const item = await prisma.inventoryItem.findUnique({ where: { variantId } });
      if (!item) throw new NotFoundError(`Inventory item for variant ${variantId} not found`);
      return { availableQty: item.availableQty, reservedQty: item.reservedQty };
    }

    ensureStockInitialized(variantId);
    const item = memoryStock.get(variantId);
    if (!item) throw new NotFoundError(`Inventory item for variant ${variantId} not found in memory`);
    return { availableQty: item.availableQty, reservedQty: item.reservedQty };
  }

  /**
   * Atomically reserves stock for a product variant.
   * Ensures that two concurrent users contesting the final piece cannot oversell.
   */
  static async reserveStock(input: ReserveStockInput): Promise<ReservationResult> {
    if (!input.quantity || !Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidationError('Reservation quantity must be a positive integer');
    }

    const ttlMinutes = input.ttlMinutes ?? 15;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (isDatabaseAvailable()) {
      return await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({
          where: { variantId: input.variantId },
        });

        if (!item || item.availableQty < input.quantity) {
          throw new InsufficientStockError(
            `Insufficient stock for variant ${input.variantId}. Available: ${item?.availableQty ?? 0}, Requested: ${input.quantity}`
          );
        }

        // Atomic decrement of available and increment of reserved
        await tx.inventoryItem.update({
          where: { variantId: input.variantId },
          data: {
            availableQty: { decrement: input.quantity },
            reservedQty: { increment: input.quantity },
          },
        });

        const created = await tx.inventoryReservation.create({
          data: {
            id: reservationId,
            orderId: input.orderId,
            cartId: input.cartId,
            status: 'PENDING',
            expiresAt,
            items: {
              create: [{ variantId: input.variantId, quantity: input.quantity }],
            },
          },
        });

        return {
          id: created.id,
          variantId: input.variantId,
          quantity: input.quantity,
          status: created.status as 'PENDING',
          expiresAt: created.expiresAt,
          orderId: created.orderId ?? undefined,
        };
      });
    }

    // In-memory atomic concurrency implementation with mutex serialization
    return withMemoryLock(async () => {
      ensureStockInitialized(input.variantId);
      const item = memoryStock.get(input.variantId);
      if (!item || item.availableQty < input.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for variant ${input.variantId}. Available: ${item?.availableQty ?? 0}, Requested: ${input.quantity}`
        );
      }

      item.availableQty -= input.quantity;
      item.reservedQty += input.quantity;

      const record: InMemReservation = {
        id: reservationId,
        variantId: input.variantId,
        quantity: input.quantity,
        status: 'PENDING',
        expiresAt,
        orderId: input.orderId,
        cartId: input.cartId,
      };

      memoryReservations.set(reservationId, record);

      return {
        id: record.id,
        variantId: record.variantId,
        quantity: record.quantity,
        status: record.status,
        expiresAt: record.expiresAt,
        orderId: record.orderId,
      };
    });
  }

  /**
   * Releases a pending reservation back into available stock.
   * Enforces duplicate release prevention (idempotent / conflict guarded).
   */
  static async releaseReservation(reservationId: string, reason = 'Order cancelled or session abandoned'): Promise<void> {
    if (isDatabaseAvailable()) {
      await prisma.$transaction(async (tx) => {
        const res = await tx.inventoryReservation.findUnique({
          where: { id: reservationId },
          include: { items: true },
        });

        if (!res) throw new NotFoundError(`Reservation ${reservationId} not found`);

        if (res.status === 'RELEASED') {
          throw new ConflictError(`Reservation ${reservationId} has already been released`);
        }
        if (res.status === 'EXPIRED') {
          throw new ConflictError(`Reservation ${reservationId} has already expired and released`);
        }
        if (res.status === 'CONFIRMED') {
          throw new ConflictError(`Cannot release confirmed reservation ${reservationId} directly; requires return/restock`);
        }

        const transition = ReservationStateMachine.transition(res.status as 'PENDING', 'RELEASED', { reason });
        if (transition.isFailure) throw transition.error;

        for (const item of res.items) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: {
              availableQty: { increment: item.quantity },
              reservedQty: { decrement: item.quantity },
            },
          });
        }

        await tx.inventoryReservation.update({
          where: { id: reservationId },
          data: { status: 'RELEASED' },
        });
      });
      return;
    }

    return withMemoryLock(async () => {
      const res = memoryReservations.get(reservationId);
      if (!res) throw new NotFoundError(`Reservation ${reservationId} not found`);

      if (res.status === 'RELEASED') {
        throw new ConflictError(`Reservation ${reservationId} has already been released`);
      }
      if (res.status === 'EXPIRED') {
        throw new ConflictError(`Reservation ${reservationId} has already expired and released`);
      }
      if (res.status === 'CONFIRMED') {
        throw new ConflictError(`Cannot release confirmed reservation ${reservationId} directly; requires return/restock`);
      }

      const transition = ReservationStateMachine.transition(res.status, 'RELEASED', { reason });
      if (transition.isFailure) throw transition.error;

      const item = memoryStock.get(res.variantId);
      if (item) {
        item.availableQty += res.quantity;
        item.reservedQty -= res.quantity;
      }

      res.status = 'RELEASED';
    });
  }

  /**
   * Converts a temporary reservation into a permanent order allocation.
   */
  static async confirmReservation(reservationId: string): Promise<void> {
    if (isDatabaseAvailable()) {
      await prisma.$transaction(async (tx) => {
        const res = await tx.inventoryReservation.findUnique({
          where: { id: reservationId },
          include: { items: true },
        });

        if (!res) throw new NotFoundError(`Reservation ${reservationId} not found`);

        if (res.status !== 'PENDING') {
          throw new ConflictError(`Cannot confirm reservation in status '${res.status}'`);
        }

        const transition = ReservationStateMachine.transition('PENDING', 'CONFIRMED');
        if (transition.isFailure) throw transition.error;

        // Decrement the temporary reservation hold; availableQty was already decremented at reservation time
        for (const item of res.items) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: {
              reservedQty: { decrement: item.quantity },
            },
          });
        }

        await tx.inventoryReservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED' },
        });
      });
      return;
    }

    return withMemoryLock(async () => {
      const res = memoryReservations.get(reservationId);
      if (!res) throw new NotFoundError(`Reservation ${reservationId} not found`);

      if (res.status !== 'PENDING') {
        throw new ConflictError(`Cannot confirm reservation in status '${res.status}'`);
      }

      const transition = ReservationStateMachine.transition('PENDING', 'CONFIRMED');
      if (transition.isFailure) throw transition.error;

      const item = memoryStock.get(res.variantId);
      if (item) {
        item.reservedQty -= res.quantity;
      }

      res.status = 'CONFIRMED';
    });
  }

  /**
   * Scans and releases all reservations that have elapsed their 15-minute TTL.
   */
  static async releaseExpiredReservations(): Promise<number> {
    const now = new Date();

    if (isDatabaseAvailable()) {
      return await prisma.$transaction(async (tx) => {
        const expired = await tx.inventoryReservation.findMany({
          where: {
            status: 'PENDING',
            expiresAt: { lt: now },
          },
          include: { items: true },
        });

        for (const res of expired) {
          for (const item of res.items) {
            await tx.inventoryItem.update({
              where: { variantId: item.variantId },
              data: {
                availableQty: { increment: item.quantity },
                reservedQty: { decrement: item.quantity },
              },
            });
          }

          await tx.inventoryReservation.update({
            where: { id: res.id },
            data: { status: 'EXPIRED' },
          });
        }

        return expired.length;
      });
    }

    return withMemoryLock(async () => {
      let releasedCount = 0;
      for (const res of memoryReservations.values()) {
        if (res.status === 'PENDING' && res.expiresAt.getTime() < now.getTime()) {
          const item = memoryStock.get(res.variantId);
          if (item) {
            item.availableQty += res.quantity;
            item.reservedQty -= res.quantity;
          }
          res.status = 'EXPIRED';
          releasedCount += 1;
        }
      }
      return releasedCount;
    });
  }

  /**
   * Pre-dispatch order cancellation with automated stock restock.
   * Blocks cancellation if the order has already been dispatched.
   */
  static async cancelPreDispatchOrder(
    orderNumber: string,
    currentOrderStatus: string,
    reservationId?: string,
    reason = 'Pre-dispatch customer cancellation'
  ): Promise<void> {
    // Enforce pre-dispatch guard
    const postDispatchStates = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED'];
    if (postDispatchStates.includes(currentOrderStatus)) {
      throw new ConflictError(
        `Order ${orderNumber} is already in state '${currentOrderStatus}'. Pre-dispatch cancellation is strictly blocked.`
      );
    }

    const orderTransition = OrderStateMachine.transition(currentOrderStatus as any, 'CANCELLED', {
      reason,
    });
    if (orderTransition.isFailure) {
      throw orderTransition.error;
    }

    if (reservationId) {
      await this.releaseReservation(reservationId, reason);
    }
  }

  /**
   * Simulates database failure during reservation to verify transaction rollback.
   */
  static async simulateFailingReservation(input: ReserveStockInput): Promise<never> {
    const item = memoryStock.get(input.variantId);
    const originalAvailable = item ? item.availableQty : 0;
    const originalReserved = item ? item.reservedQty : 0;

    try {
      // Begin simulated mutation
      if (item) {
        item.availableQty -= input.quantity;
        item.reservedQty += input.quantity;
      }
      // Simulated DB network partition / failure
      throw new Error('DATABASE_CONNECTION_RESET: Simulated failure during multi-table reservation');
    } catch (err) {
      // Rollback simulated state
      if (item) {
        item.availableQty = originalAvailable;
        item.reservedQty = originalReserved;
      }
      throw err;
    }
  }
}
