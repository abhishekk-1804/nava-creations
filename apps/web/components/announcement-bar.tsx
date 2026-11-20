import React from 'react';
import { buildWhatsAppLink } from '@/lib/config';

export function AnnouncementBar() {
  const whatsappUrl = buildWhatsAppLink(
    'Hello NAVA Creations Bengaluru, I would like to consult with your Bridal Concierge regarding bespoke bangles.'
  );

  const renderAnnouncementSegment = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center gap-6 sm:gap-8 px-4 flex-shrink-0">
      <span className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse flex-shrink-0" />
        <span className="text-stone-100">India&apos;s Premier Handcrafted Bangle Atelier</span>
      </span>

      <span className="text-brand-gold/60 select-none">&bull;</span>

      <span className="text-stone-100">Bespoke Bridal &amp; Custom Sizes (2.2 - 2.10)</span>

      <span className="text-brand-gold/60 select-none">&bull;</span>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-gold hover:text-white transition-colors underline-offset-2 hover:underline inline-flex items-center gap-1 font-semibold"
        title="Direct WhatsApp Concierge & Studio Support"
      >
        <span>Contact &amp; WhatsApp Studio: +91 72046 28513 | +91 63612 00493</span>
      </a>

      <span className="text-brand-gold/60 select-none">&bull;</span>
    </div>
  );

  return (
    <aside
      aria-label="Store Announcement"
      className="bg-brand-burgundy text-brand-cream text-[11px] sm:text-xs py-2 tracking-wider font-medium border-b border-brand-gold/30 print:hidden overflow-hidden"
    >
      <div className="relative w-full overflow-hidden group">
        <div className="flex animate-marquee hover:[animation-play-state:paused] cursor-default">
          {renderAnnouncementSegment('seg-1')}
          {renderAnnouncementSegment('seg-2')}
        </div>
      </div>
    </aside>
  );
}
