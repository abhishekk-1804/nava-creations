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
  WhatsAppIcon,
  UserIcon,
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
      <header className="sticky top-0 z-40 bg-brand-ivory/95 backdrop-blur-md border-b border-brand-sand/80 shadow-sm transition-all print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu trigger */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-stone-700 hover:text-brand-maroon hover:bg-brand-cream/80 focus:outline-none transition-colors"
                aria-label="Open mobile menu"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo / Wordmark (Full page reload always) */}
            <div className="flex-1 lg:flex-none text-center lg:text-left">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.assign('/');
                }}
                className="inline-block group focus:outline-none cursor-pointer"
                aria-label="NAVA CREATIONS Bengaluru Home"
              >
                <span className="font-serif text-2xl sm:text-3xl tracking-[0.18em] font-medium text-brand-maroon block group-hover:text-stone-800 transition-colors">
                  NAVA CREATIONS
                </span>
                <span className="text-[10px] tracking-[0.32em] uppercase text-brand-darkGold font-medium block -mt-1">
                  Bengaluru &bull; Atelier
                </span>
              </a>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm tracking-wide transition-all py-1 ${
                      isActive
                        ? 'text-brand-maroon font-semibold border-b-2 border-brand-gold'
                        : 'text-stone-700 hover:text-brand-maroon font-normal'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-stone-700 hover:text-brand-maroon hover:bg-brand-cream/80 transition-colors focus:outline-none"
                aria-label="Search accessories"
                title="Search accessories"
              >
                <SearchIcon className="w-5 h-5" />
              </button>

              {/* Customer Account */}
              <Link
                href="/account"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-stone-700 hover:text-brand-maroon hover:bg-brand-cream/80 transition-colors focus:outline-none"
                aria-label="My Account"
                title="My Account"
              >
                <UserIcon className="w-5 h-5" />
              </Link>

              {/* Shopping Bag Trigger */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-stone-800 hover:text-brand-maroon hover:bg-brand-cream/80 transition-colors focus:outline-none"
                aria-label="View shopping cart"
                title="View shopping cart"
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
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.assign('/');
                  }}
                  className="block focus:outline-none cursor-pointer"
                >
                  <span className="font-serif text-xl tracking-[0.18em] font-semibold text-brand-maroon block">
                    NAVA CREATIONS
                  </span>
                  <span className="text-[9px] tracking-widest uppercase text-brand-darkGold block">
                    Bengaluru Atelier
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-stone-500 hover:text-stone-800"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <nav className="mt-6 space-y-2">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-3 rounded bg-brand-cream/50 hover:bg-brand-cream text-brand-maroon font-medium text-base transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4 text-brand-maroon" />
                    <span>My Account / Login</span>
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-brand-maroon" />
                </Link>
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
                href={buildWhatsAppLink('Hello NAVA Creations Bengaluru, I would like to enquire about your handcrafted accessories')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp Bridal Concierge</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
