'use client';

import React, { useState, useEffect } from 'react';
import { LayersIcon, PlusIcon, RefreshCwIcon, AlertCircleIcon } from '@/components/admin-icons';
import { CheckIcon } from '@/components/icons';
import { CategoryDto } from '@nava/domain';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Category Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newHsnCode, setNewHsnCode] = useState('7117');
  const [newParentId, setNewParentId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/catalog/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        setErrorMessage('Failed to load categories.');
      }
    } catch (_e) {
      setErrorMessage('Network error loading categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleStatus = async (cat: CategoryDto) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/catalog/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Disabled'}.`);
        fetchCategories();
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        setErrorMessage(data.error || 'Failed to update category status.');
      }
    } catch (_e) {
      setErrorMessage('Network error updating category status.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newName.trim()) {
      setErrorMessage('Please provide a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/catalog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          hsnCode: newHsnCode.trim() || '7117',
          parentId: newParentId || null,
          description: newDescription.trim() || undefined,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Category "${newName}" created successfully.`);
        setIsCreating(false);
        setNewName('');
        setNewSlug('');
        setNewHsnCode('7117');
        setNewParentId('');
        setNewDescription('');
        fetchCategories();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to create category.');
      }
    } catch (_e) {
      setErrorMessage('Network error creating category.');
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
            Categories &amp; Taxonomy
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage product classifications, parent-child hierarchies, and statutory HSN tax codes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCategories}
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
            title="Refresh categories"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-maroon text-white text-xs font-medium rounded-lg hover:bg-brand-burgundy transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Category</span>
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

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-5 h-5 text-brand-darkGold" />
            <h2 className="font-serif text-base font-medium text-stone-900">
              Taxonomy Hierarchy ({categories.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-maroon mx-auto mb-2"></div>
            Loading taxonomy categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No categories registered yet. Click &quot;Add Category&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">URL Slug</th>
                  <th className="p-3.5">HSN Code</th>
                  <th className="p-3.5">Parent / Hierarchy</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {categories.map((c) => {
                  const parent = categories.find((p) => p.id === c.parentId);
                  return (
                    <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5 font-semibold text-stone-900">
                        <div>{c.name}</div>
                        {c.description && (
                          <div className="text-[11px] text-stone-400 line-clamp-1">{c.description}</div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-stone-500">/{c.slug}</td>
                      <td className="p-3.5 font-mono text-stone-500">{c.hsnCode || '7117'}</td>
                      <td className="p-3.5">
                        {parent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700">
                            Sub of: {parent.name}
                          </span>
                        ) : (
                          <span className="text-stone-400">Root Category</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                            c.isActive
                              ? 'text-stone-600 border-stone-300 hover:bg-stone-100'
                              : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Add New Product Category
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Temple Chuda Bangles"
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
                    placeholder="temple-chuda-bangles"
                    className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={newHsnCode}
                    onChange={(e) => setNewHsnCode(e.target.value)}
                    placeholder="7117"
                    className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none bg-white"
                >
                  <option value="">None (Top-level Root Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Artisanal glass bangles embedded with temple motifs..."
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
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
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
