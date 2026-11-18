'use client';

import React, { useState } from 'react';
import { BangleSizeGuideModal } from './bangle-size-guide-modal';

export function BangleSizeGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-brand-darkGold hover:text-brand-maroon underline font-semibold transition-colors"
      >
        Find Your Bangle Size (2.2&ndash;2.10)
      </button>

      <BangleSizeGuideModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialSize="2.6"
      />
    </>
  );
}

