'use client';

import React, { useState, useEffect } from 'react';
import { TagIcon, ExternalLinkIcon } from '@/components/admin-icons';
import { CheckIcon } from '@/components/icons';

interface Enquiry {
  id: string;
  enquiryNumber: string;
  name: string;
  phone: string;
  email?: string | null;
  eventType: string;
  eventDate?: string | null;
  bangleSize?: string | null;
  notes: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  whatsappUrl?: string | null;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchEnquiries = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'ALL' ? `/api/admin/enquiries?status=${status}` : '/api/admin/enquiries';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries || []);
      }
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(statusFilter);
  }, [statusFilter]);

  const handleUpdateStatus = async (enquiryNumber: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionMessage(`Enquiry ${enquiryNumber} status updated to ${newStatus}`);
        fetchEnquiries(statusFilter);
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (_e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Customer Consultations &amp; Enquiries
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Bespoke bridal sets, return gift inquiries, and custom sizing requests submitted via storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-brand-maroon text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-brand-maroon" />
            <h2 className="font-serif text-base font-medium text-stone-900">
              Active Inquiries ({enquiries.length})
            </h2>
          </div>
          <span className="text-xs text-stone-500">Live Client Consultation Registry</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading inquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No inquiries found matching selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <th className="p-3.5">Ref ID</th>
                  <th className="p-3.5">Client Contact</th>
                  <th className="p-3.5">Event &amp; Size</th>
                  <th className="p-3.5">Requirements / Notes</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {enquiries.map((enq) => (
                  <tr key={enq.enquiryNumber} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-brand-maroon">
                      {enq.enquiryNumber}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-stone-900 block">{enq.name}</span>
                      <span className="text-[11px] text-stone-500 block">{enq.phone}</span>
                      {enq.email && <span className="text-[10px] text-stone-400 block">{enq.email}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-stone-800 block">{enq.eventType}</span>
                      <span className="text-[10px] text-stone-500 block">
                        Size: {enq.bangleSize || 'Standard'} {enq.eventDate ? `• Date: ${enq.eventDate}` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs text-stone-600 truncate" title={enq.notes}>
                      {enq.notes}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          enq.status === 'NEW'
                            ? 'bg-blue-100 text-blue-800'
                            : enq.status === 'CONTACTED'
                            ? 'bg-amber-100 text-amber-800'
                            : enq.status === 'CONVERTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {enq.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500 whitespace-nowrap">
                      {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {enq.whatsappUrl && (
                          <a
                            href={enq.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-emerald-700 text-white rounded text-[11px] font-medium hover:bg-emerald-800 transition-colors inline-flex items-center gap-1"
                            title="Chat on WhatsApp"
                          >
                            <span>WhatsApp</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        )}

                        {enq.status === 'NEW' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.enquiryNumber, 'CONTACTED')}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-medium transition-colors"
                          >
                            Mark Contacted
                          </button>
                        )}

                        {enq.status !== 'CONVERTED' && enq.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.enquiryNumber, 'CONVERTED')}
                            className="px-2 py-1 bg-brand-cream hover:bg-brand-sand text-brand-maroon rounded text-[11px] font-semibold transition-colors"
                          >
                            Convert to Order
                          </button>
                        )}

                        {enq.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.enquiryNumber, 'CLOSED')}
                            className="px-2 py-1 text-stone-400 hover:text-stone-600 rounded text-[11px]"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
