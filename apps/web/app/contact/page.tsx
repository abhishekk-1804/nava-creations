'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  WhatsAppIcon,
  InstagramIcon,
  ChevronRightIcon,
  CheckIcon,
  AlertCircleIcon,
} from '@/components/icons';
import { CONFIG, buildWhatsAppLink } from '@/lib/config';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string | null>(null);
  const [submissionOutcome, setSubmissionOutcome] = useState<'RECORDED' | 'UNPERSISTED_FALLBACK' | null>(null);
  const [clientTimestamp, setClientTimestamp] = useState<number>(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'Bridal Wedding Set',
    eventDate: '',
    bangleSize: '2.6',
    notes: '',
    honeypot: '', // Hidden spam trap
  });

  useEffect(() => {
    setClientTimestamp(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clientTimestamp,
        }),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      setEnquiryId(data.enquiryId);
      setWhatsappDirectUrl(data.whatsappDirectUrl);
      setSubmissionOutcome(data.outcome || (data.persistedToDb ? 'RECORDED' : 'UNPERSISTED_FALLBACK'));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">Contact &amp; Studio</span>
      </nav>

      {/* Header */}
      <div className="border-b border-brand-sand pb-6">
        <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-1">
          Bengaluru Atelier
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-stone-900">
          Connect With Our Studio
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Whether you need bespoke bridal bangle sizing, customized Kundan jewellery ensembles, or bulk festive return gift boxes, our Bengaluru artisans are delighted to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-lg font-medium text-stone-900">
              Studio Location
            </h2>
            <div className="space-y-2 text-xs text-stone-600">
              <p className="font-semibold text-stone-800">{CONFIG.studio.name}</p>
              <p>{CONFIG.studio.city}, {CONFIG.studio.state}, {CONFIG.studio.country}</p>
              <p className="pt-2 text-[11px] text-stone-500">
                Studio visits by prior appointment for bespoke bridal consultations.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-lg font-medium text-stone-900">
              Direct Inquiries
            </h2>
            <div className="space-y-3">
              <a
                href={buildWhatsAppLink('Hello NAVA Creations! I would like to enquire about your jewellery collections.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium"
              >
                <WhatsAppIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="block font-semibold">WhatsApp Studio</span>
                  <span className="text-[11px] text-emerald-700">{CONFIG.whatsapp.displayNumber}</span>
                </div>
              </a>

              <a
                href={CONFIG.social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-stone-50 text-stone-800 rounded-lg hover:bg-stone-100 transition-colors text-xs font-medium"
              >
                <InstagramIcon className="w-5 h-5 text-brand-maroon flex-shrink-0" />
                <div>
                  <span className="block font-semibold">Instagram DM</span>
                  <span className="text-[11px] text-stone-600">@{CONFIG.social.instagramHandle}</span>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-brand-cream/60 rounded-xl border border-brand-sand p-6 text-xs text-stone-700 space-y-2">
            <span className="font-semibold uppercase tracking-wider text-brand-darkGold block">
              Consultation Hours
            </span>
            <p>Monday &ndash; Saturday: 10:00 AM &ndash; 7:30 PM IST</p>
            <p>Sunday: By Special Bridal Appointment</p>
          </div>
        </div>

        {/* Custom Bridal Order Enquiry Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-stone-900 mb-2">
              Bespoke Bridal &amp; Bulk Return Gifts
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Fill in your celebration details below and our lead accessory designer will prepare sizing and pricing options for you.
            </p>

            {error && (
              <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {submitted ? (
              <div className="p-8 bg-brand-cream rounded-xl border border-brand-sand text-center space-y-4 animate-fadeIn">
                {submissionOutcome === 'RECORDED' ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <CheckIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-stone-900">
                      Enquiry Recorded Successfully
                    </h3>
                    <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                      Thank you, <strong>{formData.name}</strong>. Your consultation reference is <strong className="font-mono text-brand-maroon">{enquiryId}</strong>. Our atelier team will review your requirements.
                    </p>
                    {whatsappDirectUrl && (
                      <div className="pt-2">
                        <a
                          href={whatsappDirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                          <span>Open in WhatsApp for Instant Discussion</span>
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <AlertCircleIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-stone-900">
                      Direct WhatsApp Connection Required
                    </h3>
                    <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                      Thank you, <strong>{formData.name}</strong>. Our database is currently in offline mode and could not record your request automatically. Your draft reference is <strong className="font-mono text-brand-maroon">{enquiryId}</strong>.
                    </p>
                    <p className="text-xs text-stone-700 font-medium">
                      To ensure your enquiry is received immediately, please tap below to send your pre-filled message directly to our Bengaluru studio team:
                    </p>
                    {whatsappDirectUrl && (
                      <div className="pt-2">
                        <a
                          href={whatsappDirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-md"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                          <span>Send Details via WhatsApp Atelier Now</span>
                        </a>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setSubmissionOutcome(null);
                      setFormData({
                        name: '',
                        phone: '',
                        eventType: 'Bridal Wedding Set',
                        eventDate: '',
                        bangleSize: '2.6',
                        notes: '',
                        honeypot: '',
                      });
                    }}
                    className="px-6 py-2 border border-stone-300 text-stone-800 rounded text-xs font-medium hover:bg-white"
                  >
                    Send Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field for anti-spam (invisible to normal users) */}
                <input
                  type="text"
                  name="website_url"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-stone-800 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ananya Rao"
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-stone-800 mb-1">
                      WhatsApp / Phone Number *
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98860 00000"
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="contact-event-type" className="block text-xs font-semibold text-stone-800 mb-1">
                      Event Type
                    </label>
                    <select
                      id="contact-event-type"
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded bg-white focus:border-brand-maroon focus:outline-none"
                    >
                      <option>Bridal Wedding Set</option>
                      <option>Sangeet &amp; Mehendi Favours</option>
                      <option>Baby Shower / Seemantha Bangles</option>
                      <option>Bulk Return Gifts</option>
                      <option>Other Custom Jewellery</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-event-date" className="block text-xs font-semibold text-stone-800 mb-1">
                      Approximate Event Date
                    </label>
                    <input
                      id="contact-event-date"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded bg-white focus:border-brand-maroon focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-bangle-size" className="block text-xs font-semibold text-stone-800 mb-1">
                      Bangle Size (If known)
                    </label>
                    <select
                      id="contact-bangle-size"
                      value={formData.bangleSize}
                      onChange={(e) => setFormData({ ...formData, bangleSize: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded bg-white focus:border-brand-maroon focus:outline-none"
                    >
                      <option value="2.2">2.2 (Small)</option>
                      <option value="2.4">2.4 (Medium-Small)</option>
                      <option value="2.6">2.6 (Standard Most Common)</option>
                      <option value="2.8">2.8 (Medium-Large)</option>
                      <option value="2.10">2.10 (Large / Openable)</option>
                      <option value="Mixed">Mixed Sizes (Bulk Gifts)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-notes" className="block text-xs font-semibold text-stone-800 mb-1">
                    Design Notes &amp; Outfit Colour Preferences *
                  </label>
                  <textarea
                    id="contact-notes"
                    rows={4}
                    required
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Tell us about your bridal lehenga/saree colors, required quantities, or preferred Kundan stone combinations..."
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-brand-maroon text-white text-xs font-semibold rounded-lg hover:bg-brand-deepMaroon transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Submitting Enquiry...' : 'Submit Bridal Consultation Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
