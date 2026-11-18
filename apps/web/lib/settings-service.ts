import { CONFIG } from './config';
import { ValidationError } from '@nava/shared';
import { prisma } from '@nava/db';

export interface StudioSettingsDto {
  whatsappNumber: string;
  whatsappDisplay: string;
  instagramHandle: string;
  upiVpa: string;
  merchantName: string;
  merchantQrUrl: string;
  isMerchantConfirmed: boolean;
  codEnabled: boolean;
  codMaxPaise: number;
  codCourierChargePaise: number;
  freeShippingThresholdPaise: number;
  standardShippingFeePaise: number;
  studioName: string;
  studioCity: string;
  studioState: string;
  originStateCode: string;
  updatedAt: string;
}

function isDatabaseAvailable(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim() !== '' && !url.includes('placeholder') && !url.includes('ep-sample'));
}

// Global singleton for in-memory settings persistence across route reloads / offline fallback
const globalForSettings = globalThis as unknown as {
  __nava_studio_settings__?: StudioSettingsDto;
};

const BASELINE_SETTINGS: StudioSettingsDto = {
  whatsappNumber: CONFIG.whatsapp.number,
  whatsappDisplay: CONFIG.whatsapp.displayNumber,
  instagramHandle: CONFIG.social.instagramHandle,
  upiVpa: CONFIG.payment.upiVpa || 'nava.creations@bharatpe',
  merchantName: CONFIG.payment.merchantName,
  merchantQrUrl: CONFIG.payment.merchantQrUrl,
  isMerchantConfirmed: CONFIG.payment.isMerchantConfirmed,
  codEnabled: CONFIG.payment.codEnabled,
  codMaxPaise: CONFIG.payment.codMaxPaise,
  codCourierChargePaise: CONFIG.payment.codCourierChargePaise,
  freeShippingThresholdPaise: 199900, // ₹1,999
  standardShippingFeePaise: 15000, // ₹150
  studioName: CONFIG.studio.name,
  studioCity: CONFIG.studio.city,
  studioState: CONFIG.studio.state,
  originStateCode: CONFIG.studio.originStateCode,
  updatedAt: new Date().toISOString(),
};

if (!globalForSettings.__nava_studio_settings__) {
  globalForSettings.__nava_studio_settings__ = { ...BASELINE_SETTINGS };
}

const currentSettings = globalForSettings.__nava_studio_settings__;

export class SettingsService {
  /**
   * Retrieves current studio settings.
   * If database is available, queries PostgreSQL store_settings table.
   * Otherwise falls back to in-memory configuration.
   */
  static async getSettings(): Promise<StudioSettingsDto> {
    if (isDatabaseAvailable()) {
      try {
        const record = await prisma.storeSetting.findUnique({
          where: { key: 'studio_settings' },
        });

        if (record && record.value) {
          try {
            const parsed = JSON.parse(record.value) as Partial<StudioSettingsDto>;
            const merged: StudioSettingsDto = {
              ...BASELINE_SETTINGS,
              ...parsed,
              updatedAt: record.updatedAt ? record.updatedAt.toISOString() : new Date().toISOString(),
            };
            // Keep memory cache updated
            Object.assign(currentSettings, merged);
            return merged;
          } catch {
            // If JSON corrupted, return baseline
          }
        } else {
          // Initialize DB row if missing
          try {
            await prisma.storeSetting.create({
              data: {
                key: 'studio_settings',
                value: JSON.stringify(currentSettings),
              },
            });
          } catch (_e) {
            // Ignore race condition on create
          }
        }
      } catch (_dbError) {
        // Fall back to memory on error
      }
    }

    return { ...currentSettings };
  }

  /**
   * Updates studio settings.
   * Persists changes to PostgreSQL store_settings table and local memory cache.
   */
  static async updateSettings(updates: Partial<StudioSettingsDto>): Promise<StudioSettingsDto> {
    if (updates.whatsappNumber !== undefined) {
      const cleanNum = updates.whatsappNumber.replace(/[^\d]/g, '');
      if (cleanNum.length < 10) {
        throw new ValidationError('WhatsApp phone number must be at least 10 digits.');
      }
      currentSettings.whatsappNumber = cleanNum;
    }

    if (updates.whatsappDisplay !== undefined) {
      currentSettings.whatsappDisplay = updates.whatsappDisplay.trim();
    }

    if (updates.upiVpa !== undefined) {
      const cleanVpa = updates.upiVpa.trim();
      if (cleanVpa && !/^[\w.\-]+@[\w.\-]+$/.test(cleanVpa)) {
        throw new ValidationError('Please enter a valid UPI VPA format (e.g. business@bank).');
      }
      currentSettings.upiVpa = cleanVpa;
    }

    if (updates.merchantName !== undefined) {
      currentSettings.merchantName = updates.merchantName.trim() || 'NAVA CREATIONS';
    }

    if (updates.merchantQrUrl !== undefined) {
      currentSettings.merchantQrUrl = updates.merchantQrUrl.trim();
    }

    if (updates.isMerchantConfirmed !== undefined) {
      currentSettings.isMerchantConfirmed = Boolean(updates.isMerchantConfirmed);
    }

    if (updates.codEnabled !== undefined) {
      currentSettings.codEnabled = Boolean(updates.codEnabled);
    }

    if (updates.codMaxPaise !== undefined) {
      if (updates.codMaxPaise < 0) {
        throw new ValidationError('COD maximum order value must be non-negative.');
      }
      currentSettings.codMaxPaise = updates.codMaxPaise;
    }

    if (updates.codCourierChargePaise !== undefined) {
      if (updates.codCourierChargePaise < 0) {
        throw new ValidationError('COD courier charge must be non-negative.');
      }
      currentSettings.codCourierChargePaise = updates.codCourierChargePaise;
    }

    if (updates.freeShippingThresholdPaise !== undefined) {
      if (updates.freeShippingThresholdPaise < 0) {
        throw new ValidationError('Free shipping threshold must be non-negative.');
      }
      currentSettings.freeShippingThresholdPaise = updates.freeShippingThresholdPaise;
    }

    if (updates.standardShippingFeePaise !== undefined) {
      if (updates.standardShippingFeePaise < 0) {
        throw new ValidationError('Standard shipping fee must be non-negative.');
      }
      currentSettings.standardShippingFeePaise = updates.standardShippingFeePaise;
    }

    currentSettings.updatedAt = new Date().toISOString();

    if (isDatabaseAvailable()) {
      try {
        await prisma.storeSetting.upsert({
          where: { key: 'studio_settings' },
          create: {
            key: 'studio_settings',
            value: JSON.stringify(currentSettings),
          },
          update: {
            value: JSON.stringify(currentSettings),
          },
        });
      } catch (dbErr) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Failed to persist studio settings to database in production');
        }
      }
    }

    return { ...currentSettings };
  }

  /**
   * Resets settings back to baseline defaults for automated testing.
   */
  static resetForTesting(): void {
    Object.assign(currentSettings, BASELINE_SETTINGS);
  }

  /**
   * Authoritative dynamic calculation of shipping fee based on net payable and settings.
   */
  static calculateShipping(subtotalPaise: number, settings?: StudioSettingsDto): number {
    const active = settings || currentSettings;
    if (subtotalPaise >= active.freeShippingThresholdPaise) {
      return 0;
    }
    return active.standardShippingFeePaise;
  }
}
