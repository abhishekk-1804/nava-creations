'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from '@/components/admin-icons';
import { CheckIcon } from '@/components/icons';
import { StudioSettingsDto } from '@/lib/settings-service';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StudioSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields State
  const [studioName, setStudioName] = useState('');
  const [studioCity, setStudioCity] = useState('');
  const [studioState, setStudioState] = useState('');
  const [originStateCode, setOriginStateCode] = useState('');

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappDisplay, setWhatsappDisplay] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');

  const [upiVpa, setUpiVpa] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantQrUrl, setMerchantQrUrl] = useState('');
  const [isMerchantConfirmed, setIsMerchantConfirmed] = useState(false);

  const [codEnabled, setCodEnabled] = useState(false);
  const [codMaxRupees, setCodMaxRupees] = useState('');
  const [codCourierChargeRupees, setCodCourierChargeRupees] = useState('');
  const [freeShippingThresholdRupees, setFreeShippingThresholdRupees] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const s: StudioSettingsDto = data.settings;
        setSettings(s);
        setStudioName(s.studioName || '');
        setStudioCity(s.studioCity || '');
        setStudioState(s.studioState || '');
        setOriginStateCode(s.originStateCode || '29');
        setWhatsappNumber(s.whatsappNumber || '');
        setWhatsappDisplay(s.whatsappDisplay || '');
        setInstagramHandle(s.instagramHandle || '');
        setUpiVpa(s.upiVpa || '');
        setMerchantName(s.merchantName || '');
        setMerchantQrUrl(s.merchantQrUrl || '');
        setIsMerchantConfirmed(Boolean(s.isMerchantConfirmed));
        setCodEnabled(Boolean(s.codEnabled));
        setCodMaxRupees((s.codMaxPaise / 100).toString());
        setCodCourierChargeRupees((s.codCourierChargePaise / 100).toString());
        setFreeShippingThresholdRupees((s.freeShippingThresholdPaise / 100).toString());
      } else {
        setErrorMessage('Failed to load studio settings.');
      }
    } catch (_e) {
      setErrorMessage('Network error loading studio settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setActionMessage(null);
    setSaving(true);

    try {
      const payload: Partial<StudioSettingsDto> = {
        studioName: studioName.trim(),
        studioCity: studioCity.trim(),
        studioState: studioState.trim(),
        originStateCode: originStateCode.trim(),
        whatsappNumber: whatsappNumber.trim(),
        whatsappDisplay: whatsappDisplay.trim(),
        instagramHandle: instagramHandle.trim(),
        upiVpa: upiVpa.trim(),
        merchantName: merchantName.trim(),
        merchantQrUrl: merchantQrUrl.trim(),
        isMerchantConfirmed,
        codEnabled,
        codMaxPaise: Math.round((parseFloat(codMaxRupees) || 0) * 100),
        codCourierChargePaise: Math.round((parseFloat(codCourierChargeRupees) || 0) * 100),
        freeShippingThresholdPaise: Math.round((parseFloat(freeShippingThresholdRupees) || 0) * 100),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setActionMessage('Studio configuration updated successfully.');
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setErrorMessage(data.message || data.error || 'Failed to save settings.');
      }
    } catch (_e) {
      setErrorMessage('Network error while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-maroon mx-auto"></div>
          <p className="mt-4 text-xs font-medium text-stone-500 uppercase tracking-widest">
            Loading Studio Configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Studio Settings & Policies
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure atelier branding, UPI payment credentials, customer communication channels, and shipping thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {settings?.updatedAt && (
            <span className="text-[11px] text-stone-400">
              Last saved: {new Date(settings.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={fetchSettings}
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
            title="Reload settings"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2 shadow-sm">
          <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 shadow-sm">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Sovereign UPI & BharatPe Payment Gateway */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-brand-maroon" />
                Sovereign Direct UPI Gateway
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Zero-fee instant settlement directly into the studio&apos;s current account via NPCI UPI rails.
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
              Owner Sign-off Protected
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  UPI VPA / Virtual ID *
                </label>
                <input
                  type="text"
                  required
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="nava.creations@bharatpe"
                  className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Must match the verified UPI ID on your BharatPe QR sticker.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Merchant Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="NAVA CREATIONS"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Legal recipient name that customers see in GPay/PhonePe/Paytm.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Static QR Image Asset URL
              </label>
              <input
                type="text"
                value={merchantQrUrl}
                onChange={(e) => setMerchantQrUrl(e.target.value)}
                placeholder="/qr/bharatpe-qr.png"
                className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Relative path in public directory or hosted CDN image for the customer payment modal.
              </span>
            </div>

            {/* Merchant Confirmation Toggle */}
            <div className="mt-4 p-4 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="isMerchantConfirmed"
                checked={isMerchantConfirmed}
                onChange={(e) => setIsMerchantConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-maroon focus:ring-brand-maroon cursor-pointer"
              />
              <div className="text-xs">
                <label htmlFor="isMerchantConfirmed" className="font-semibold text-stone-900 cursor-pointer block">
                  Live Production Merchant Account Confirmation
                </label>
                <p className="text-stone-500 mt-0.5 leading-relaxed">
                  Checking this confirms the business owner has completed ₹1 test transfers, verified transaction reflections in the studio bank statement, and authorized live customers to pay directly to this VPA.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Studio Identity & GST Logistics */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
            <h2 className="font-serif text-base font-semibold text-stone-900">
              Atelier Identity & Dispatch Origin
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Legal studio details displayed on packing slips, invoices, and shipment manifests.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Studio Brand Name *
              </label>
              <input
                type="text"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="NAVA CREATIONS"
                className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Origin City
              </label>
              <input
                type="text"
                value={studioCity}
                onChange={(e) => setStudioCity(e.target.value)}
                placeholder="Bengaluru"
                className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                State & Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studioState}
                  onChange={(e) => setStudioState(e.target.value)}
                  placeholder="Karnataka"
                  className="w-2/3 text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
                <input
                  type="text"
                  value={originStateCode}
                  onChange={(e) => setOriginStateCode(e.target.value)}
                  placeholder="29"
                  title="GST State Code"
                  className="w-1/3 text-xs font-mono text-center border border-stone-300 rounded px-2 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Concierge & Social Channels */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
            <h2 className="font-serif text-base font-semibold text-stone-900">
              Customer Concierge & Social Channels
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Contact numbers used by the customer WhatsApp enquiry button and order confirmation messages.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                WhatsApp Digits (with country code) *
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="919876543210"
                className="w-full text-xs font-mono border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Digits only, e.g. 919876543210 for +91 98765 43210.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                WhatsApp Display Format
              </label>
              <input
                type="text"
                value={whatsappDisplay}
                onChange={(e) => setWhatsappDisplay(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Formatted text shown in header and footer.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Instagram Handle
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@navacreations"
                className="w-full text-xs border border-stone-300 rounded px-3 py-2 focus:ring-1 focus:ring-brand-maroon outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Handle for Instagram studio profile.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Shipping, Thresholds & Cash On Delivery */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
            <h2 className="font-serif text-base font-semibold text-stone-900">
              Shipping Rates & Cash on Delivery (COD) Rules
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Control free courier delivery qualification and COD risk limits.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Free Shipping Threshold (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={freeShippingThresholdRupees}
                    onChange={(e) => setFreeShippingThresholdRupees(e.target.value)}
                    placeholder="1999"
                    className="w-full text-xs pl-7 pr-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Cart subtotals above this amount receive free standard shipping.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  COD Courier Surcharge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={codCourierChargeRupees}
                    onChange={(e) => setCodCourierChargeRupees(e.target.value)}
                    placeholder="90"
                    className="w-full text-xs pl-7 pr-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Handling charge added when customer selects Cash on Delivery.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  COD Maximum Order Ceiling (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={codMaxRupees}
                    onChange={(e) => setCodMaxRupees(e.target.value)}
                    placeholder="5000"
                    className="w-full text-xs pl-7 pr-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon outline-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Orders above this value must be prepaid via UPI or Net Banking.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-900 block">
                  Enable Cash on Delivery (COD) Checkout Option
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  When enabled, buyers can choose COD up to the ceiling limit with an additional courier fee.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={fetchSettings}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-xs font-medium text-white bg-brand-maroon rounded-lg hover:bg-brand-burgundy transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {saving && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
            <span>{saving ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
