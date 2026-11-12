'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { buildWhatsAppLink } from '@/lib/config';
import {
  ShoppingBagIcon,
  SearchIcon,
  MenuIcon,
  CloseIcon,
  ChevronRightIcon,
  LockIcon,
  WhatsAppIcon,
} from './icons';

export function Header() {
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Shop All', href: '/shop' },
    { label: 'Handmade Bangles', href: '/categories/handmade-bangles' },
    { label: 'Bridal Sets', href: '/categories/bridal-jewellery' },
    { label: 'Kundan Artistry', href: '/categories/kundan-artistry' },
    { label: 'Return Gifts', href: '/categories/return-gifts' },
    { label: 'Contact & Studio', href: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-sand transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu trigger */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-stone-700 hover:text-brand-maroon focus:outline-none"
                aria-label="Open mobile menu"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo / Wordmark */}
            <div className="flex-1 lg:flex-none text-center lg:text-left">
              <Link href="/" className="inline-block group focus:outline-none">
                <span className="font-serif text-2xl sm:text-3xl tracking-[0.2em] font-medium text-brand-maroon block group-hover:text-stone-800 transition-colors">
                  NAVA
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-brand-darkGold font-medium block -mt-1">
                  Creations &bull; Bengaluru
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm tracking-wide transition-colors py-1 ${
                      isActive
                        ? 'text-brand-maroon font-medium border-b-2 border-brand-maroon'
                        : 'text-stone-700 hover:text-brand-maroon font-normal'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-stone-700 hover:text-brand-maroon transition-colors"
                aria-label="Search accessories"
              >
                <SearchIcon className="w-5 h-5" />
              </button>

              {/* Shopping Bag Trigger */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2 text-stone-800 hover:text-brand-maroon transition-colors focus:outline-none"
                aria-label="View shopping cart"
              >
                <ShoppingBagIcon className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-maroon rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Search Dropdown */}
          {searchOpen && (
            <div className="py-4 border-t border-brand-sand animate-fadeIn">
              <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bangles, bridal sets, Kundan kadas..."
                  aria-label="Search bangles, bridal sets, and accessories"
                  className="flex-1 px-4 py-2 text-sm border border-stone-300 rounded focus:border-brand-maroon focus:outline-none bg-stone-50"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-brand-maroon text-white rounded hover:bg-brand-deepMaroon transition-colors font-medium"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 text-stone-500 hover:text-stone-800"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-brand-ivory shadow-xl z-50 flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-brand-sand">
                <div>
                  <span className="font-serif text-xl tracking-[0.2em] font-semibold text-brand-maroon block">
                    NAVA
                  </span>
                  <span className="text-[9px] tracking-widest uppercase text-brand-darkGold block">
                    Bengaluru
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-stone-500 hover:text-stone-800"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <nav className="mt-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3 px-3 rounded hover:bg-brand-cream text-stone-800 hover:text-brand-maroon text-base font-medium transition-colors"
                  >
                    <span>{link.label}</span>
                    <ChevronRightIcon className="w-4 h-4 text-stone-400" />
                  </Link>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-brand-sand space-y-3">
                <span className="text-xs uppercase tracking-wider text-stone-500 block">
                  Curated Collections
                </span>
                <Link
                  href="/collections/bridal-edit-2026"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-stone-700 hover:text-brand-maroon py-1.5"
                >
                  &bull; Bridal Edit 2026
                </Link>
                <Link
                  href="/collections/bestsellers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-stone-700 hover:text-brand-maroon py-1.5"
                >
                  &bull; Bengaluru Bestsellers
                </Link>
                <Link
                  href="/collections/festive-return-gifts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-stone-700 hover:text-brand-maroon py-1.5"
                >
                  &bull; Festive Return Gifts
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-sand space-y-3">
              <a
                href={buildWhatsAppLink('Hello NAVA Creations, I would like to enquire about your handcrafted accessories')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 text-white rounded text-sm font-medium hover:bg-emerald-800 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp Enquiry</span>
              </a>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-stone-300 text-stone-700 rounded text-xs font-medium hover:bg-white"
              >
                <LockIcon className="w-3.5 h-3.5" />
                <span>Studio Admin Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
