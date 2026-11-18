'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TagIcon, ExternalLinkIcon, PlusIcon, RefreshCwIcon, AlertCircleIcon } from '@/components/admin-icons';
import { CheckIcon } from '@/components/icons';
import { CollectionDto, CollectionStatus } from '@nava/domain';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Collection Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCoverImageUrl, setNewCoverImageUrl] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState('1');
  const [newStatus, setNewStatus] = useState<CollectionStatus>('PUBLISHED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/catalog/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      } else {
        setErrorMessage('Failed to load collections.');
      }
    } catch (_e) {
      setErrorMessage('Network error loading collections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleToggleStatus = async (col: CollectionDto) => {
    setErrorMessage(null);
    const nextStatus: CollectionStatus = col.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/admin/catalog/collections/${col.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Collection "${col.name}" is now ${nextStatus}.`);
        fetchCollections();
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        setErrorMessage(data.error || 'Failed to update collection status.');
      }
    } catch (_e) {
      setErrorMessage('Network error updating collection status.');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newName.trim()) {
      setErrorMessage('Please provide a collection title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/catalog/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          description: newDescription.trim() || undefined,
          coverImageUrl: newCoverImageUrl.trim() || undefined,
          displayOrder: parseInt(newDisplayOrder, 10) || 1,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Collection "${newName}" created successfully.`);
        setIsCreating(false);
        setNewName('');
        setNewSlug('');
        setNewDescription('');
        setNewCoverImageUrl('');
        setNewDisplayOrder('1');
        setNewStatus('PUBLISHED');
        fetchCollections();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to create collection.');
      }
    } catch (_e) {
      setErrorMessage('Network error creating collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Merchandising Collections
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Curate wedding edits, festive return gift showcases, and editorial homepage banners.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCollections}
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
            title="Refresh collections"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-maroon text-white text-xs font-medium rounded-lg hover:bg-brand-burgundy transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2 shadow-sm">
          <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 shadow-sm">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-maroon mx-auto mb-2"></div>
          Loading merchandising collections...
        </div>
      ) : collections.length === 0 ? (
        <div className="p-12 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200">
          No collections created yet. Click &quot;New Collection&quot; to curate an editorial edit.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-40 bg-stone-100 overflow-hidden relative">
                  {col.coverImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={col.coverImageUrl}
                      alt={col.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/branding/nava-product-placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <TagIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        col.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {col.status}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-semibold text-brand-darkGold block">
                      Display Order #{col.displayOrder}
                    </span>
                    {col.productCount !== undefined && (
                      <span className="text-[11px] text-stone-400">
                        {col.productCount} products
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-medium text-stone-900">{col.name}</h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {col.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(col)}
                  className={`text-xs font-semibold px-2 py-1 rounded border transition-colors ${
                    col.status === 'PUBLISHED'
                      ? 'text-stone-600 border-stone-300 hover:bg-stone-50'
                      : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {col.status === 'PUBLISHED' ? 'Set to Draft' : 'Publish'}
                </button>
                <Link
                  href={`/collections/${col.slug}`}
                  target="_blank"
                  className="text-xs font-semibold text-brand-maroon hover:underline flex items-center gap-1"
                >
                  <span>Live View</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Curate Merchandising Collection
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Royal Bridal Chuda Edit"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    URL Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="royal-bridal-chuda"
                    className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDisplayOrder}
                    onChange={(e) => setNewDisplayOrder(e.target.value)}
                    placeholder="1"
                    className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={newCoverImageUrl}
                  onChange={(e) => setNewCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Traditional handmade bangles selected for grand South Indian ceremonies..."
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CollectionStatus)}
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none bg-white"
                >
                  <option value="PUBLISHED">Published (Visible on storefront)</option>
                  <option value="DRAFT">Draft (Hidden from storefront)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-medium text-white bg-brand-maroon hover:bg-brand-burgundy rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                  <span>Create Collection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
