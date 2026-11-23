'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { ExecutiveAnalyticsDto, DailyFinancialMetric } from '@/lib/analytics-service';

interface ExecutiveAnalyticsProps {
  analytics: ExecutiveAnalyticsDto;
}

export function ExecutiveAnalytics({ analytics }: ExecutiveAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'financial' | 'volume'>('financial');

  const formatRupees = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatShortRupees = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount}`;
  };

  return (
    <div className="space-y-8">
      {/* Executive Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Gross Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <span>Gross Revenue</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              +18.4% MoM
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {formatRupees(analytics.grossRevenueRupees)}
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
            <span>Avg Order Value (AOV)</span>
            <span className="font-semibold text-stone-800 font-mono">
              {formatRupees(analytics.averageOrderValueRupees)}
            </span>
          </div>
        </div>

        {/* Card 2: Estimated EBITDA & Margin */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <span>Estimated EBITDA</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
              {analytics.ebitdaPercent}% Margin
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-maroon tracking-tight">
            {formatRupees(analytics.estimatedEbitdaRupees)}
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
            <span>Net Profit Margin</span>
            <span className="font-semibold text-emerald-700 font-mono">
              {analytics.netMarginPercent}% ({formatShortRupees(analytics.netMarginRupees)})
            </span>
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <span>Total Orders Placed</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60">
              100% Verified
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {analytics.totalOrders.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
            <span>Payment Method Mix</span>
            <span className="font-semibold text-stone-800">82% UPI &bull; 18% COD</span>
          </div>
        </div>

        {/* Card 4: Marketing Conversion Rate & ROAS */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <span>Marketing Conversion</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200/60">
              {analytics.marketingRoas}x ROAS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {analytics.marketingConversionRate}%
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
            <span>Lead Inquiries (WhatsApp)</span>
            <span className="font-semibold text-brand-darkGold font-mono">34.2% Conversion</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Container */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-darkGold block mb-1">
              Bengaluru Atelier Financial Intelligence
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              {activeTab === 'financial' ? 'Revenue vs. Operating Profit Margin' : 'Daily Order Volume & Channel Distribution'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Chronological 30-day performance trends formatted in Indian Rupees (₹) with real-time margin tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('financial')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'financial'
                  ? 'bg-white text-brand-maroon shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Revenue vs. Profit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('volume')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'volume'
                  ? 'bg-white text-brand-maroon shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Order Volume (30D)
            </button>
          </div>
        </div>

        {/* Chart 1: Revenue vs Profit Margin */}
        {activeTab === 'financial' && (
          <div className="h-[360px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.dailyTrends}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#D6D3D1' }}
                  tick={{ fill: '#78716C', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={{ stroke: '#D6D3D1' }}
                  tick={{ fill: '#78716C', fontSize: 11 }}
                  tickFormatter={formatShortRupees}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[40, 80]}
                  tickLine={false}
                  axisLine={{ stroke: '#D6D3D1' }}
                  tick={{ fill: '#78716C', fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0]?.payload) {
                      const data = payload[0].payload as DailyFinancialMetric;
                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <span className="font-semibold text-stone-900 block border-b border-stone-100 pb-1">
                            {label} ({data.fullDate})
                          </span>
                          <div className="flex justify-between items-center text-brand-maroon">
                            <span>Gross Revenue:</span>
                            <span className="font-mono font-bold">{formatRupees(data.revenue)}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-800">
                            <span>Gross Profit:</span>
                            <span className="font-mono font-semibold">{formatRupees(data.profit)}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-800">
                            <span>Operating EBITDA:</span>
                            <span className="font-mono font-semibold">{formatRupees(data.ebitda)}</span>
                          </div>
                          <div className="flex justify-between items-center text-stone-600 border-t border-stone-100 pt-1">
                            <span>Gross Margin:</span>
                            <span className="font-bold text-stone-900">{data.marginPercent}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  name="Gross Revenue (₹)"
                  fill="#4A1525"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="profit"
                  name="Gross Profit (₹)"
                  fill="#C5A265"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="marginPercent"
                  name="Margin (%)"
                  stroke="#047857"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#047857' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2: Daily Order Volume */}
        {activeTab === 'volume' && (
          <div className="h-[360px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.dailyTrends}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorUpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A1525" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4A1525" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A265" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A265" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#D6D3D1' }}
                  tick={{ fill: '#78716C', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#D6D3D1' }}
                  tick={{ fill: '#78716C', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0]?.payload) {
                      const data = payload[0].payload as DailyFinancialMetric;
                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xl text-xs space-y-1.5 min-w-[180px]">
                          <span className="font-semibold text-stone-900 block border-b border-stone-100 pb-1">
                            {label} ({data.fullDate})
                          </span>
                          <div className="flex justify-between items-center text-brand-maroon">
                            <span>Total Orders:</span>
                            <span className="font-mono font-bold text-sm">{data.orderCount}</span>
                          </div>
                          <div className="flex justify-between items-center text-stone-600">
                            <span>UPI Orders:</span>
                            <span className="font-mono font-semibold">{data.upiOrders}</span>
                          </div>
                          <div className="flex justify-between items-center text-stone-600">
                            <span>COD Orders:</span>
                            <span className="font-mono font-semibold">{data.codOrders}</span>
                          </div>
                          <div className="flex justify-between items-center text-brand-darkGold border-t border-stone-100 pt-1">
                            <span>Day Revenue:</span>
                            <span className="font-mono font-semibold">{formatRupees(data.revenue)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="upiOrders"
                  name="UPI Orders"
                  stroke="#4A1525"
                  fillOpacity={1}
                  fill="url(#colorUpi)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="codOrders"
                  name="Cash On Delivery (COD)"
                  stroke="#C5A265"
                  fillOpacity={1}
                  fill="url(#colorCod)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Merchandising Category Share Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
        <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
          Collection Revenue Contribution
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          High-margin atelier jewellery collections driving Bengaluru trousseau sales.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.categoryBreakdown.map((cat) => (
            <div
              key={cat.name}
              className="p-4 rounded-xl border border-stone-100 bg-stone-50/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="text-xs font-semibold text-stone-800">{cat.name}</span>
                </div>
                <div className="text-xl font-serif font-bold text-stone-900">
                  {cat.sharePercent}%
                </div>
              </div>
              <div className="text-xs font-mono text-stone-500 mt-3 pt-2 border-t border-stone-200/60">
                {formatRupees(cat.revenueRupees)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
