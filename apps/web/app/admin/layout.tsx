'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PackageIcon,
  LayersIcon,
  TagIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  LogOutIcon,
  ExternalLinkIcon,
  PlusIcon,
} from '@/components/admin-icons';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on login page, render clean full-screen layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: ShieldCheckIcon },
    { label: 'Products', href: '/admin/products', icon: PackageIcon },
    { label: 'Add Product', href: '/admin/products/new', icon: PlusIcon },
    { label: 'Categories', href: '/admin/categories', icon: LayersIcon },
    { label: 'Collections', href: '/admin/collections', icon: TagIcon },
    { label: 'Inventory Stock', href: '/admin/inventory', icon: RefreshCwIcon },
    { label: 'Orders Queue', href: '/admin/orders', icon: ShoppingBagIcon },
    { label: 'Promotions', href: '/admin/promotions', icon: TagIcon },
    { label: 'Enquiries', href: '/admin/enquiries', icon: TagIcon },
    { label: 'Studio Settings', href: '/admin/settings', icon: RefreshCwIcon },
    { label: 'System Health', href: '/admin/system', icon: ExternalLinkIcon },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch (_e) {
      // Ignore network errors on logout
    }
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-200 flex-shrink-0 flex flex-col justify-between border-r border-stone-800">
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-stone-800">
            <Link href="/admin" className="block">
              <span className="font-serif text-xl tracking-[0.2em] font-semibold text-white block">
                NAVA
              </span>
              <span className="text-[10px] tracking-widest uppercase text-brand-lightGold block">
                Studio Administration
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-maroon text-white shadow'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOutIcon className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-medium text-stone-800">Bengaluru Studio</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
              Active Session
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-stone-500 hidden sm:inline-block">Role: STORE_MANAGER</span>
            <Link
              href="/"
              className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 hover:bg-stone-50 font-medium"
            >
              Customer Storefront &rarr;
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
