'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBagIcon, AlertCircleIcon } from '@/components/admin-icons';
import { CheckIcon } from '@/components/icons';
import { OrderDto } from '@/lib/order-service';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Verification Modal State
  const [verifyingOrder, setVerifyingOrder] = useState<OrderDto | null>(null);
  const [bankTxnId, setBankTxnId] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // AWB Fulfillment Modal State
  const [shippingOrder, setShippingOrder] = useState<OrderDto | null>(null);
  const [courierAwb, setCourierAwb] = useState('');
  const [isShipping, setIsShipping] = useState(false);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'ALL' ? `/api/admin/orders?status=${status}` : '/api/admin/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const handleOpenVerifyModal = (order: OrderDto) => {
    setVerifyingOrder(order);
    setBankTxnId(order.payment?.claimedUtr || '');
    setVerifyNotes('Matched against bank current account credit statement');
    setErrorMessage(null);
  };

  const handleConfirmPaymentVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrder) return;

    if (!bankTxnId || bankTxnId.trim().length < 8) {
      setErrorMessage('Please enter a valid bank transaction ID (minimum 8 characters).');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${verifyingOrder.orderNumber}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifiedTransactionId: bankTxnId.trim(),
          amountPaise: verifyingOrder.totalPaise,
          notes: verifyNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to verify payment');
      }

      setActionMessage(`Payment for ${verifyingOrder.orderNumber} successfully verified & confirmed!`);
      setVerifyingOrder(null);
      fetchOrders(statusFilter);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Payment verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateStatus = async (orderNumber: string, nextStatus: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Order ${orderNumber} moved to ${nextStatus}`);
        fetchOrders(statusFilter);
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setErrorMessage(data.message || 'Status transition rejected');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (_e) {}
  };

  const handleConfirmShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrder) return;

    if (!courierAwb || courierAwb.trim().length < 5) {
      setErrorMessage('Please enter a valid Courier AWB / Tracking reference.');
      return;
    }

    setIsShipping(true);
    try {
      const res = await fetch(`/api/admin/orders/${shippingOrder.orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SHIPPED',
          courierAwb: courierAwb.trim(),
          reason: 'Order dispatched via courier partner',
        }),
      });

      if (res.ok) {
        setActionMessage(`Order ${shippingOrder.orderNumber} dispatched! AWB: ${courierAwb.trim()}`);
        setShippingOrder(null);
        setCourierAwb('');
        fetchOrders(statusFilter);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (_e) {
    } finally {
      setIsShipping(false);
    }
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Orders &amp; Payment Reconciliation
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative order processing, UPI QR bank statement matching, and logistics fulfillment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Awaiting Verification', value: 'AWAITING_PAYMENT_VERIFICATION' },
            { label: 'Confirmed', value: 'PAYMENT_CONFIRMED' },
            { label: 'Processing', value: 'PROCESSING' },
            { label: 'Shipped', value: 'SHIPPED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand-maroon text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-brand-maroon" />
            <h2 className="font-serif text-base font-medium text-stone-900">
              Customer Orders ({orders.length})
            </h2>
          </div>
          <span className="text-xs text-stone-500">Zero-Fee BharatPe UPI QR &amp; COD Active</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No customer orders found matching selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer &amp; City</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Payable (₹)</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5">Order Status</th>
                  <th className="p-3.5">Tracking AWB</th>
                  <th className="p-3.5 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {orders.map((ord) => (
                  <tr key={ord.orderNumber} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-brand-maroon whitespace-nowrap">
                      {ord.orderNumber}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-stone-900 block">{ord.shippingAddress.name}</span>
                      <span className="text-[10px] text-stone-400 block">
                        {ord.shippingAddress.city}, {ord.shippingAddress.stateName} &bull; {ord.shippingAddress.phone}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-stone-600" title={ord.items.map((i) => i.title).join(', ')}>
                      {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
                    </td>
                    <td className="p-3.5 font-semibold text-stone-900 whitespace-nowrap">
                      {formatPrice(ord.totalPaise)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          ord.payment?.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.payment?.status === 'AWAITING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {ord.payment?.status || 'PENDING'}
                      </span>
                      {ord.payment?.claimedUtr && (
                        <span className="block text-[10px] font-mono text-stone-500 mt-0.5">
                          UTR: {ord.payment.claimedUtr}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          ord.status === 'PAYMENT_CONFIRMED' || ord.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'SHIPPED'
                            ? 'bg-purple-100 text-purple-800'
                            : ord.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                      {ord.courierAwb ? (
                        <span className="font-semibold text-stone-800">{ord.courierAwb}</span>
                      ) : (
                        <span className="text-stone-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Packing Slip Link */}
                        <Link
                          href={`/admin/orders/${ord.orderNumber}/packing-slip`}
                          target="_blank"
                          className="px-2 py-1 text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 rounded text-[11px] font-medium border border-stone-300 transition-colors"
                          title="Print Atelier Packing Slip"
                        >
                          Packing Slip
                        </Link>

                        {/* Verify Payment Button */}
                        {ord.paymentMethod === 'UPI_MERCHANT_QR' &&
                          ord.payment?.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleOpenVerifyModal(ord)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors"
                            >
                              Verify Bank Credit
                            </button>
                          )}

                        {/* Move to Processing */}
                        {ord.status === 'PAYMENT_CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.orderNumber, 'PROCESSING', 'Atelier packing initiated')}
                            className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Mark Processing
                          </button>
                        )}

                        {/* Ship Order */}
                        {ord.status === 'PROCESSING' && (
                          <button
                            onClick={() => {
                              setShippingOrder(ord);
                              setCourierAwb('');
                            }}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Dispatch &amp; AWB
                          </button>
                        )}

                        {/* Cancel Pre-Dispatch */}
                        {ord.status !== 'SHIPPED' && ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.orderNumber, 'CANCELLED', 'Cancelled by store manager')}
                            className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-[11px]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Verification Modal */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Verify UPI Bank Settlement
              </h3>
              <button
                onClick={() => setVerifyingOrder(null)}
                className="text-stone-400 hover:text-stone-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Order: <span className="font-mono font-bold text-brand-maroon">{verifyingOrder.orderNumber}</span> &bull; Customer: <span className="font-medium text-stone-800">{verifyingOrder.shippingAddress.name}</span>
            </p>

            {verifyingOrder.payment?.claimedUtr && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                Customer Claimed UTR: <span className="font-mono font-bold">{verifyingOrder.payment.claimedUtr}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPaymentVerification} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Authoritative Bank Transaction ID / Credit Ref *
                </label>
                <input
                  type="text"
                  required
                  value={bankTxnId}
                  onChange={(e) => setBankTxnId(e.target.value)}
                  placeholder="e.g. BANK-TXN-998822"
                  className="w-full font-mono text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Must match the exact transaction reference in your BharatPe / Current Account statement.
                </span>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Settlement Amount Confirmed
                </label>
                <span className="font-serif font-bold text-brand-maroon text-base block">
                  {formatPrice(verifyingOrder.totalPaise)}
                </span>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Verification Audit Notes
                </label>
                <input
                  type="text"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setVerifyingOrder(null)}
                  className="px-4 py-2 border border-stone-300 rounded text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-2 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 disabled:opacity-60"
                >
                  {isVerifying ? 'Verifying...' : 'Confirm Bank Credit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping AWB Modal */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Dispatch Order &amp; Assign Courier AWB
              </h3>
              <button
                onClick={() => setShippingOrder(null)}
                className="text-stone-400 hover:text-stone-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Order: <span className="font-mono font-bold text-brand-maroon">{shippingOrder.orderNumber}</span>
            </p>

            <form onSubmit={handleConfirmShipping} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Courier AWB / Tracking Reference *
                </label>
                <input
                  type="text"
                  required
                  value={courierAwb}
                  onChange={(e) => setCourierAwb(e.target.value)}
                  placeholder="e.g. DELHIVERY-BLR-99812"
                  className="w-full font-mono text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="px-4 py-2 border border-stone-300 rounded text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isShipping}
                  className="px-4 py-2 bg-purple-700 text-white rounded text-xs font-semibold hover:bg-purple-800 disabled:opacity-60"
                >
                  {isShipping ? 'Dispatching...' : 'Mark as Dispatched'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
