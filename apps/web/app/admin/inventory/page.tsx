'use client';

import React, { useState } from 'react';
import { SAMPLE_PRODUCTS } from '@/lib/sample-data';
import { RefreshCwIcon, CheckIcon, AlertCircleIcon } from '@/components/admin-icons';

export default function AdminInventoryPage() {
  const [items, setItems] = useState(() => {
    const list: {
      id: string;
      productName: string;
      size: string | null;
      sku: string;
      availableQty: number;
      reservedQty: number;
      safetyStock: number;
    }[] = [];

    SAMPLE_PRODUCTS.forEach((p) => {
      p.variants?.forEach((v) => {
        list.push({
          id: v.id,
          productName: p.name,
          size: v.size,
          sku: v.sku,
          availableQty: v.availableStock ?? 10,
          reservedQty: 0,
          safetyStock: 2,
        });
      });
    });

    return list;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = async (id: string) => {
    setErrorMessage(null);
    setUpdateMessage(null);

    try {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableQty: newStock }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in at /admin/login.');
        }
        if (res.status === 403) {
          throw new Error('Forbidden: Insufficient inventory operator permissions.');
        }
        if (res.status === 404) {
          throw new Error('Variant not found in inventory.');
        }
        if (res.status === 422 || res.status === 400) {
          throw new Error(data.error || 'Validation error: Invalid stock quantity.');
        }
        if (res.status === 503) {
          throw new Error('Database service unavailable: Inventory update cannot be persisted.');
        }
        throw new Error(data.error || `Update failed (${res.status})`);
      }

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, availableQty: newStock } : item))
      );

      setEditingId(null);
      setUpdateMessage(`Inventory updated for variant ${id}`);
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Inventory update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Workshop Inventory &amp; Stock
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time sellable inventory tracking across Bangalore atelier variants and bangle sizes.
          </p>
        </div>

        <div className="p-3 bg-brand-cream/80 border border-brand-sand rounded-lg text-xs text-stone-700">
          <span className="font-semibold text-brand-maroon block">Server-Authoritative Stock</span>
          <span>Reservations &amp; safety buffers are automatically enforced to prevent overselling.</span>
        </div>
      </div>

      {updateMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckIcon className="w-4 h-4 flex-shrink-0" />
          <span>{updateMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <th className="p-3.5">Piece Name</th>
                <th className="p-3.5">Bangle Size</th>
                <th className="p-3.5">Variant SKU</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Reserved</th>
                <th className="p-3.5">Safety Buffer</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Quick Stock Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {items.map((item) => {
                const sellable = Math.max(0, item.availableQty - item.reservedQty - item.safetyStock);
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-3.5 font-medium text-stone-900">{item.productName}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-brand-cream text-stone-800 font-semibold">
                        {item.size ? `Size ${item.size}` : 'Standard'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-stone-500">{item.sku}</td>

                    <td className="p-3.5 font-semibold text-stone-900">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={newStock}
                          onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                          className="w-20 px-2 py-1 text-xs border border-brand-maroon rounded"
                          autoFocus
                        />
                      ) : (
                        <span>{item.availableQty} units</span>
                      )}
                    </td>

                    <td className="p-3.5 text-stone-500">{item.reservedQty}</td>
                    <td className="p-3.5 text-stone-500">{item.safetyStock}</td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sellable === 0
                            ? 'bg-red-100 text-red-800'
                            : sellable <= 3
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sellable === 0 ? 'Sold Out' : sellable <= 3 ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(item.id)}
                            className="px-2.5 py-1 bg-brand-maroon text-white rounded text-[11px] font-semibold hover:bg-brand-deepMaroon"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 border border-stone-300 rounded text-[11px] hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setNewStock(item.availableQty);
                          }}
                          className="text-brand-maroon hover:underline font-semibold flex items-center gap-1 ml-auto"
                        >
                          <RefreshCwIcon className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
