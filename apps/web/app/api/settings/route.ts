import { NextResponse } from 'next/server';
import { SettingsService } from '@/lib/settings-service';

/**
 * Public Storefront Settings Endpoint
 *
 * Exposes non-sensitive studio settings (shipping thresholds, atelier details,
 * payment availability) for public cart and checkout calculation.
 */
export async function GET() {
  try {
    const settings = await SettingsService.getSettings();
    return NextResponse.json(
      {
        success: true,
        settings: {
          freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
          standardShippingFeePaise: settings.standardShippingFeePaise,
          studioName: settings.studioName,
          studioCity: settings.studioCity,
          studioState: settings.studioState,
          whatsappDisplay: settings.whatsappDisplay,
          instagramHandle: settings.instagramHandle,
          codEnabled: settings.codEnabled,
          codMaxPaise: settings.codMaxPaise,
          isMerchantConfirmed: settings.isMerchantConfirmed,
          upiVpa: settings.upiVpa,
          merchantName: settings.merchantName,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
