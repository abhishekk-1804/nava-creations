import React from 'react';

export function AnnouncementBar() {
  return (
    <aside aria-label="Store Announcement" className="bg-brand-deepMaroon text-brand-lightGold text-xs py-2 px-4 text-center tracking-wider font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
        <span>Handcrafted in Bengaluru &bull; Bespoke Bridal Bangles &amp; Kundan Heirlooms</span>
        <span className="text-stone-400 hidden md:inline-block">&bull;</span>
        <span className="hidden md:inline-block text-stone-300">
          WhatsApp Inquiries: +91 98860 00000
        </span>
      </div>
    </aside>
  );
}
