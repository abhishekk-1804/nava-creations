/**
 * NAVA CREATIONS — Centralized Application Configuration
 *
 * All business contact details, social links, and runtime flags are centralized here.
 * Notice: Production business contact details require final business owner sign-off.
 */

export const CONFIG = {
  // Business WhatsApp Concierge for direct artisan enquiry & order placement.
  // Primary WhatsApp Concierge: +91 72046 28513
  whatsapp: {
    number: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP_NUMBER || '917204628513',
    displayNumber: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP_DISPLAY || '+91 72046 28513',
    isOwnerConfirmed: Boolean(process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP_NUMBER),
  },

  // Secondary Studio / Bridal Desk Consultation: +91 63612 00493
  studioDesk: {
    number: process.env.NEXT_PUBLIC_STUDIO_PHONE_NUMBER || '916361200493',
    displayNumber: process.env.NEXT_PUBLIC_STUDIO_PHONE_DISPLAY || '+91 63612 00493',
    isOwnerConfirmed: Boolean(process.env.NEXT_PUBLIC_STUDIO_PHONE_NUMBER),
  },

  // Social media handles
  social: {
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'nava__creationsss',
    instagramUrl: `https://www.instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'nava__creationsss'}/`,
  },

  // Studio physical atelier details
  studio: {
    name: 'NAVA CREATIONS Atelier',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    originStateCode: '29', // Karnataka GST code
  },

  // Session & Security configuration
  auth: {
    sessionCookieName: process.env.SESSION_COOKIE_NAME || 'nava_admin_session',
    sessionDurationSeconds: 7 * 24 * 60 * 60, // 7 days
  },

  // Sovereign India-First Payment Configuration (Zero-MDR Merchant UPI & COD)
  payment: {
    upiVpa: process.env.MERCHANT_UPI_VPA || '',
    merchantName: process.env.MERCHANT_DISPLAY_NAME || 'NAVA CREATIONS',
    merchantQrUrl: process.env.MERCHANT_QR_IMAGE_URL || '/branding/merchant-upi-qr.png',
    isMerchantConfirmed: Boolean(
      process.env.MERCHANT_UPI_VPA &&
      process.env.MERCHANT_UPI_VPA.trim() !== '' &&
      process.env.MERCHANT_ONBOARDING_APPROVED === 'true'
    ),
    codEnabled: process.env.COD_ENABLED !== 'false',
    codMaxPaise: process.env.COD_MAX_PAISE ? parseInt(process.env.COD_MAX_PAISE, 10) : 500000, // ₹5,000 provisional ceiling
    codPolicyApproved: process.env.COD_POLICY_APPROVED === 'true',
    codCourierChargePaise: process.env.COD_COURIER_CHARGE_PAISE ? parseInt(process.env.COD_COURIER_CHARGE_PAISE, 10) : 0,
    checkoutReservationTtlMinutes: process.env.CHECKOUT_RESERVATION_TTL_MINUTES ? parseInt(process.env.CHECKOUT_RESERVATION_TTL_MINUTES, 10) : 15,
    verificationWindowHours: process.env.PAYMENT_VERIFICATION_WINDOW_HOURS ? parseInt(process.env.PAYMENT_VERIFICATION_WINDOW_HOURS, 10) : 24,
  },
} as const;

/**
 * Generates a validated WhatsApp direct link with pre-filled message text.
 */
export function buildWhatsAppLink(messageText: string, targetNumber?: string): string {
  const rawNumber = targetNumber || CONFIG.whatsapp.number;
  const cleanNumber = rawNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Generates a clean tel: protocol link for direct telephone calling.
 */
export function buildPhoneCallLink(targetNumber?: string): string {
  const rawNumber = targetNumber || CONFIG.studioDesk.displayNumber;
  return `tel:${rawNumber.replace(/\s+/g, '')}`;
}
