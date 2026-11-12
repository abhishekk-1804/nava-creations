import { CONFIG } from './config';
import { ValidationError } from '@nava/shared';

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
  studioName: string;
  studioCity: string;
  studioState: string;
  originStateCode: string;
  updatedAt: string;
}

// Global singleton for in-memory settings persistence across route reloads
const globalForSettings = globalThis as unknown as {
  __nava_studio_settings__?: StudioSettingsDto;
};

if (!globalForSettings.__nava_studio_settings__) {
  globalForSettings.__nava_studio_settings__ = {
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
    studioName: CONFIG.studio.name,
    studioCity: CONFIG.studio.city,
    studioState: CONFIG.studio.state,
    originStateCode: CONFIG.studio.originStateCode,
    updatedAt: new Date().toISOString(),
  };
}

const currentSettings = globalForSettings.__nava_studio_settings__;

export class SettingsService {
  static async getSettings(): Promise<StudioSettingsDto> {
    return { ...currentSettings };
  }

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
      currentSettings.codCourierChargePaise = Math.max(0, updates.codCourierChargePaise);
    }

    if (updates.freeShippingThresholdPaise !== undefined) {
      currentSettings.freeShippingThresholdPaise = Math.max(0, updates.freeShippingThresholdPaise);
    }

    if (updates.studioName !== undefined) {
      currentSettings.studioName = updates.studioName.trim();
    }

    if (updates.studioCity !== undefined) {
      currentSettings.studioCity = updates.studioCity.trim();
    }

    if (updates.studioState !== undefined) {
      currentSettings.studioState = updates.studioState.trim();
    }

    currentSettings.updatedAt = new Date().toISOString();
    return { ...currentSettings };
  }
}
