import React from 'react';
import { CONFIG, buildWhatsAppLink } from '@/lib/config';

export function AnnouncementBar() {
  const whatsappDisplay = CONFIG.whatsapp.displayNumber || '+91 72046 28513';
  const whatsappUrl = buildWhatsAppLink(
    'Hello NAVA Creations Bengaluru, I would like to consult with your Bridal Concierge regarding bespoke bangles.'
  );

  return (
    <aside
      aria-label="Store Announcement"
      className="bg-brand-burgundy text-brand-cream text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center tracking-wider font-medium border-b border-brand-gold/30 print:hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
        <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
        <span className="text-stone-100">
          Bengaluru Bridal Atelier &bull; Custom-Sized Kundan &amp; Handcrafted Bangles
        </span>
        <span className="text-brand-gold/60 hidden sm:inline-block">&bull;</span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-gold hover:text-white transition-colors underline-offset-2 hover:underline inline-flex items-center gap-1 font-semibold"
          title="Direct WhatsApp Concierge"
        >
          <span>WhatsApp Concierge: {whatsappDisplay}</span>
        </a>
      </div>
    </aside>
  );
}

