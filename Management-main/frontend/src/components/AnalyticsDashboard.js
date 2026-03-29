import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Package,
  Sparkles,
  Trophy,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import AnalyticsDetailPage from './AnalyticsDetailPage';

const COST_PIE_COLORS = [
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#22c55e',
  '#64748b',
  '#ef4444',
];
const ANALYTICS_PREVIEW_COUNT = 4;

function getLocalDateKey(value = new Date()) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKeyFromValue(value) {
  const raw = String(value || '').trim();
  const dashed = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashed) return `${dashed[1]}-${String(dashed[2]).padStart(2, '0')}-${String(dashed[3]).padStart(2, '0')}`;

  const slashed = raw.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashed) return `${slashed[1]}-${String(slashed[2]).padStart(2, '0')}-${String(slashed[3]).padStart(2, '0')}`;

  const parsed = value instanceof Date ? value : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  return getLocalDateKey(parsed);
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatWeight(value, lang = 'en') {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${lang === 'zh' ? '吨' : 'tons'}`;
}

function formatDays(value, lang = 'en', dayUnit = 'day') {
  const normalized = Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  if (lang === 'zh') return `${normalized}${dayUnit}`;
  return `${normalized} ${normalized === 1 ? dayUnit : `${dayUnit}s`}`;
}

function diffDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
}

function monthKey(dateValue, locale) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildMonthlySeries(sales, locale) {
  const bucketMap = new Map();

  sales.forEach((sale) => {
    const key = monthKey(sale.sale_date, locale);
    const bucket = bucketMap.get(key) || { label: key, sold: 0, received: 0, profit: 0 };
    bucket.sold += Number(sale.sale_value || 0);
    bucket.received += Number(sale.received_amount || 0);
    bucket.profit += Number(sale.profit || 0);
    bucketMap.set(key, bucket);
  });

  return Array.from(bucketMap.values()).slice(-6);
}

function buildCompanyDiscipline(companies, today) {
  return companies
    .map((company) => {
      const unpaidSales = (company.sales || []).filter((sale) => Number(sale.outstanding_amount || 0) > 0);
      const oldestUnpaidDays = unpaidSales.length
        ? Math.max(...unpaidSales.map((sale) => diffDays(sale.sale_date, today)))
        : 0;

      const paymentDelays = (company.sales || [])
        .filter((sale) => sale.payments?.length)
        .map((sale) => {
          const firstPaymentDate = [...sale.payments].sort(
            (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
          )[0]?.payment_date;
          return diffDays(sale.sale_date, firstPaymentDate);
        });

      const avgPaymentDelay = average(paymentDelays);
      const onTimeCount = paymentDelays.filter((delay) => delay <= 14).length;
      const onTimeRate = paymentDelays.length ? (onTimeCount / paymentDelays.length) * 100 : 0;

      return {
        ...company,
        oldestUnpaidDays,
        avgPaymentDelay,
        onTimeRate,
      };
    })
    .sort((a, b) => {
      if (b.oldestUnpaidDays !== a.oldestUnpaidDays) return b.oldestUnpaidDays - a.oldestUnpaidDays;
      return Number(b.balance_owed || 0) - Number(a.balance_owed || 0);
    });
}

function buildQualityPricing(lots, sales) {
  return ['Best', 'Good', 'Normal', 'Bad', 'Worst']
    .map((quality) => {
      const qualityLots = lots.filter((lot) => lot.quality === quality);
      const lotIds = new Set(qualityLots.map((lot) => lot.id));
      const qualitySales = sales.filter((sale) => lotIds.has(sale.lot_id));

      const boughtWeight = qualityLots.reduce((sum, lot) => sum + Number(lot.bought_weight_tons || 0), 0);
      const soldWeight = qualitySales.reduce((sum, sale) => sum + Number(sale.sold_weight_tons || 0), 0);
      const avgBuyPerTon = qualityLots.length
        ? average(qualityLots.map((lot) => Number(lot.cost_per_ton || 0)))
        : 0;
      const avgSellPerTon = qualitySales.length
        ? average(qualitySales.map((sale) => Number(sale.price_per_ton || 0)))
        : 0;

      return {
        quality,
        boughtWeight,
        soldWeight,
        avgBuyPerTon,
        avgSellPerTon,
        marginPerTon: avgSellPerTon - avgBuyPerTon,
      };
    })
    .filter((item) => item.boughtWeight > 0 || item.soldWeight > 0);
}

function buildCompanyPerformance(companies) {
  return companies
    .map((company) => {
      const sales = company.sales || [];
      const totalWeight = sales.reduce((sum, sale) => sum + Number(sale.sold_weight_tons || 0), 0);
      const avgPricePerTon = sales.length
        ? average(sales.map((sale) => Number(sale.price_per_ton || 0)))
        : 0;

      return {
        id: company.id,
        name: company.name,
        totalWeight,
        avgPricePerTon,
        totalSoldValue: Number(company.total_sold_value || 0),
        totalReceived: Number(company.total_received || 0),
        balanceOwed: Number(company.balance_owed || 0),
        profit: Number(company.profit || 0),
        collectionRate: Number(company.total_sold_value || 0) > 0
          ? (Number(company.total_received || 0) / Math.max(Number(company.total_sold_value || 0), 1)) * 100
          : 0,
      };
    })
    .filter((item) => item.totalWeight > 0 || item.totalSoldValue > 0)
    .sort((a, b) => {
      if (b.profit !== a.profit) return b.profit - a.profit;
      return b.avgPricePerTon - a.avgPricePerTon;
    });
}

function buildOperationalCostSummary(costs, today) {
  return buildOperationalCostSummaryByRange(costs, today, 'month');
}

function matchesCostRange(cost, todayKey, range) {
  const rawCandidates = [cost?.cost_date, cost?.created_at]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const normalizedKeys = rawCandidates
    .map((value) => getDateKeyFromValue(value))
    .filter(Boolean);

  if (range === 'all') return normalizedKeys.length > 0 || rawCandidates.length > 0;

  const monthPrefix = todayKey.slice(0, 7);
  const yearPrefix = todayKey.slice(0, 4);

  return normalizedKeys.some((key) => {
    if (range === 'day') return key === todayKey;
    if (range === 'year') return key.startsWith(yearPrefix);
    return key.startsWith(monthPrefix);
  }) || rawCandidates.some((value) => {
    if (range === 'day') return value.startsWith(todayKey);
    if (range === 'year') return value.startsWith(yearPrefix);
    return value.startsWith(monthPrefix);
  });
}

function buildOperationalCostSummaryByRange(costs, today, range = 'month') {
  const thisMonthByType = new Map();
  let filteredTotal = 0;
  let lifetimeTotal = 0;
  const thisDay = getDateKeyFromValue(today) || getLocalDateKey();

  (costs || []).forEach((cost) => {
    const amount = Number(cost.amount || 0);
    const costType = String(cost.cost_type || cost.category || 'other').trim() || 'other';
    lifetimeTotal += amount;

    if (matchesCostRange(cost, thisDay, range)) {
      filteredTotal += amount;
      thisMonthByType.set(costType, (thisMonthByType.get(costType) || 0) + amount);
    }
  });

  const rows = Array.from(thisMonthByType.entries())
    .map(([key, amount]) => ({ key, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    lifetimeTotal,
    thisMonthTotal: filteredTotal,
    rows,
  };
}

function formatCostTypeLabel(key, text) {
  if (key === 'driver') return text.categoryDriver || 'Driver';
  if (key === 'labour') return text.categoryLabour || 'Labour';
  if (key === 'other') return text.categoryOther || 'Other';
  return String(key || '-').replaceAll('_', ' ');
}

function buildSellerPerformance(sellers) {
  return (sellers || [])
    .map((seller) => ({
      id: seller.id,
      name: seller.name,
      totalBought: Number(seller.total_bought_cost || 0),
      totalPaid: Number(seller.total_paid || 0),
      returnedAmount: Number(seller.total_returned_amount || 0),
      balanceOwed: Number(seller.balance_owed || 0),
      returnCount: Number(seller.return_count || 0),
      badQuality: Boolean(seller.bad_quality),
    }))
    .filter((seller) => seller.totalBought > 0 || seller.totalPaid > 0 || seller.balanceOwed > 0 || seller.returnCount > 0)
    .sort((a, b) => {
      if (b.balanceOwed !== a.balanceOwed) return b.balanceOwed - a.balanceOwed;
      if (b.returnCount !== a.returnCount) return b.returnCount - a.returnCount;
      return b.totalBought - a.totalBought;
    });
}

function buildInventorySnapshot(lots) {
  return (lots || [])
    .map((lot) => ({
      id: lot.id,
      productName: lot.product_name,
      quality: lot.quality,
      remainingWeight: Number(lot.remaining_weight_tons || 0),
      costPerTon: Number(lot.cost_per_ton || 0),
      totalCost: Number(lot.total_cost || 0),
      sellerName: lot.seller_name,
    }))
    .filter((lot) => lot.remainingWeight > 0)
    .sort((a, b) => b.remainingWeight - a.remainingWeight);
}

function AnalyticsSectionTabs({ activeSection, onChange, text }) {
  const tabs = [
    {
      key: 'overview',
      label: text.analysisOverview || 'Overview',
      icon: BarChart3,
      iconClass: 'text-sky-600',
    },
    {
      key: 'companies',
      label: text.analysisCompanies || 'Companies',
      icon: Building2,
      iconClass: 'text-emerald-600',
    },
    {
      key: 'sellers',
      label: text.analysisSellers || 'Sellers',
      icon: Users,
      iconClass: 'text-amber-600',
    },
    {
      key: 'inventory',
      label: text.analysisInventory || 'Inventory',
      icon: Package,
      iconClass: 'text-rose-600',
    },
    {
      key: 'costs',
      label: text.analysisCosts || 'Costs',
      icon: Banknote,
      iconClass: 'text-teal-600',
    },
  ];

  return (
    <div className="no-scrollbar overflow-x-auto rounded-[1.15rem] border border-zinc-200/80 bg-zinc-100/80 p-1.5 backdrop-blur-xl">
      <div className="flex w-max min-w-full items-center gap-1.5">
        <div className="hidden shrink-0 rounded-xl bg-white/80 p-2 text-zinc-500 sm:block">
          <Sparkles className="h-4 w-4" />
        </div>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`shrink-0 min-w-[124px] rounded-xl border px-3 py-2 text-left text-sm font-semibold transition sm:min-w-[138px] ${
                active
                  ? 'border-zinc-200 bg-white text-zinc-900'
                  : 'border-transparent bg-transparent text-zinc-500 hover:bg-white/70 hover:text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${active ? 'bg-zinc-100' : 'bg-zinc-200/60'} ${tab.iconClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-xs">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SellerHealthBoard({ title, subtitle, rows, emptyLabel, text }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, ANALYTICS_PREVIEW_COUNT);
  const canToggle = rows.length > ANALYTICS_PREVIEW_COUNT;

  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          visibleRows.map((row) => (
            <div key={row.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-base font-black text-zinc-900">{row.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {row.badQuality ? (text.qualityRisk || 'Quality Risk') : (text.creditStatusNormal || 'Normal')} • {row.returnCount} {text.returnCount || 'returns'}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className={`text-base font-black ${row.balanceOwed > 0 ? 'text-orange-700' : 'text-zinc-900'}`}>{formatCurrency(row.balanceOwed)}</p>
                  <p className="text-xs text-zinc-400">{text.oweSeller || text.balance || 'Balance'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.bought || 'Bought'}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.totalBought)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.paid || 'Paid'}</p>
                  <p className="mt-1 text-sm font-black text-emerald-700">{formatCurrency(row.totalPaid)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.returnAmount || 'Return Amount'}</p>
                  <p className="mt-1 text-sm font-black text-sky-700">{formatCurrency(row.returnedAmount)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {canToggle ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {expanded ? (text.collapseDetails || 'Collapse details') : (text.expandDetails || 'Expand details')}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InventorySnapshotBoard({ title, subtitle, rows, emptyLabel, text, lang, onViewAll }) {
  const visibleRows = rows.slice(0, ANALYTICS_PREVIEW_COUNT);
  const hasMore = rows.length > ANALYTICS_PREVIEW_COUNT;

  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          visibleRows.map((row) => (
            <div key={row.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-base font-black text-zinc-900">{row.productName}</p>
                  <p className="mt-1 text-xs text-zinc-400">{row.sellerName || '-'} • {text?.[String(row.quality || '').toLowerCase()] || row.quality}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-base font-black text-zinc-900">{formatWeight(row.remainingWeight, lang)}</p>
                  <p className="text-xs text-zinc-400">{text.remaining || 'Remaining'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.costPerTon || 'Cost Per Ton'}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.costPerTon)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.totalCost || 'Total Cost'}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.totalCost)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {hasMore ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {text.viewAllInventoryData || (lang === 'zh' ? '查看全部产品数据' : 'View Full Product Data')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CostRangeTabs({ activeRange, onChange, text }) {
  const tabs = [
    { key: 'day', label: text.today || 'Today' },
    { key: 'month', label: text.thisMonth || 'This Month' },
    { key: 'year', label: text.thisYear || 'This Year' },
    { key: 'all', label: text.allTime || 'All Time' },
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
            activeRange === tab.key
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MetricTile({ icon, title, value, hint, tone = 'default' }) {
  const tones = {
    default: 'border-zinc-100 bg-white text-zinc-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    sky: 'border-sky-100 bg-sky-50 text-sky-900',
    slate: 'border-slate-100 bg-slate-50 text-slate-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
    teal: 'border-teal-100 bg-teal-50 text-teal-900',
  };

  return (
    <div className={`max-w-full rounded-[1.75rem] border p-4 shadow-sm sm:p-5 ${tones[tone] || tones.default}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
        <div className="rounded-2xl bg-white/80 p-2 text-zinc-700">{icon}</div>
      </div>
      <p className="mt-4 break-words text-xl font-black tracking-tight sm:text-2xl">{value}</p>
      {hint ? <p className="mt-2 break-words text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function MiniBarChart({ title, subtitle, data, soldLabel, receivedLabel, profitLabel }) {
  const maxValue = Math.max(...data.flatMap((item) => [item.sold, item.received, item.profit]), 1);

  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((item) => (
          <div key={item.label} className="flex min-h-[170px] flex-col justify-end gap-2 sm:min-h-[220px]">
            <div className="flex h-[140px] items-end justify-center gap-1 rounded-3xl bg-zinc-50 px-2 py-3 sm:h-[180px]">
              <div className="w-2.5 rounded-full bg-zinc-900 sm:w-3" style={{ height: `${(item.sold / maxValue) * 100}%` }} />
              <div className="w-2.5 rounded-full bg-emerald-500 sm:w-3" style={{ height: `${(item.received / maxValue) * 100}%` }} />
              <div className="w-2.5 rounded-full bg-sky-400 sm:w-3" style={{ height: `${(item.profit / maxValue) * 100}%` }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-zinc-700">{item.label}</p>
              <p className="mt-1 text-[11px] text-zinc-400">{formatCurrency(item.profit)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-zinc-500">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-zinc-900" /> {soldLabel}</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {receivedLabel}</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> {profitLabel}</span>
      </div>
    </div>
  );
}

function CompanyDisciplineTable({ title, subtitle, companies, emptyLabel, lang, dayUnit, text }) {
  const visibleCompanies = companies.slice(0, ANALYTICS_PREVIEW_COUNT);

  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {companies.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          visibleCompanies.map((company) => (
            <div key={company.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-base font-black text-zinc-900">{company.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {company.bad_credit ? company.badCreditFlaggedLabel : company.creditStatusNormalLabel} • {company.sales.length} {company.salesLabel}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-base font-black text-orange-700">{formatCurrency(company.balance_owed)}</p>
                  <p className="text-xs text-zinc-400">{company.outstandingBalanceLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{company.oldestUnpaidLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatDays(company.oldestUnpaidDays, lang, dayUnit)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{company.avgPayDelayLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatDays(company.avgPaymentDelay, lang, dayUnit)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{company.onTimeRateLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{Math.round(company.onTimeRate)}%</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfitPanel({ title, subtitle, totalProfit, totalSoldValue, totalReceived, bestCompany, emptyLabel, text, tonUnit }) {
  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
          <WalletCards className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.totalProfit || 'Total Profit'}</p>
          <p className={`mt-2 text-2xl font-black tracking-tight ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(totalProfit)}</p>
        </div>
        <div className="rounded-3xl bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.soldValue || 'Sold Value'}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(totalSoldValue)}</p>
        </div>
        <div className="rounded-3xl bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.received || 'Received'}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(totalReceived)}</p>
        </div>
      </div>
      <div className="mt-4 rounded-3xl border border-emerald-100 bg-white/90 p-4">
        {bestCompany ? (
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.topProfitCompany || 'Top Profit Company'}</p>
              <p className="mt-1 break-words text-base font-black text-zinc-900">{bestCompany.name}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {formatCurrency(bestCompany.profit)} {text.profitShort || 'Profit'} • {formatCurrency(bestCompany.avgPricePerTon)}/{tonUnit}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function QualityPricingGrid({ title, subtitle, rows, emptyLabel, soldLabel, boughtLabel, lang }) {
  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          rows.map((row) => (
            <div key={row.quality} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex flex-col gap-2">
                <p className="break-words text-base font-black text-zinc-900">{row.qualityLabel || row.quality}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-zinc-700">
                    {boughtLabel}: {formatWeight(row.boughtWeight, lang)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-zinc-700">
                    {soldLabel}: {formatWeight(row.soldWeight, lang)}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{row.buyPerTonLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.avgBuyPerTon)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{row.sellPerTonLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.avgSellPerTon)}</p>
                </div>
                <div className={`rounded-2xl px-3 py-2.5 ${row.marginPerTon >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${row.marginPerTon >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{row.marginPerTonLabel}</p>
                  <p className={`mt-1 text-sm font-black ${row.marginPerTon >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>{formatCurrency(row.marginPerTon)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CompanyPerformanceBoard({ title, subtitle, rows, emptyLabel, soldLabel, text, lang, tonUnit }) {
  const visibleRows = rows.slice(0, ANALYTICS_PREVIEW_COUNT);
  const maxPrice = Math.max(...rows.map((row) => row.avgPricePerTon), 1);

  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          visibleRows.map((row, index) => (
            <div key={row.id} className="rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-sky-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <p className="break-words text-base font-black text-zinc-900">{row.name}</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">{soldLabel}: {formatWeight(row.totalWeight, lang)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-black text-zinc-900">{formatCurrency(row.avgPricePerTon)}/{tonUnit}</p>
                  <p className="text-xs text-zinc-400">{Math.round(row.collectionRate)}% {text.collectionRate || 'Collection Rate'}</p>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-zinc-900 via-sky-500 to-emerald-500"
                  style={{ width: `${Math.max(12, (row.avgPricePerTon / maxPrice) * 100)}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.totalProfit || 'Total Profit'}</p>
                  <p className={`mt-1 text-sm font-black ${row.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(row.profit)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.received || 'Received'}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.totalReceived)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.outstandingBalance || 'Outstanding balance'}</p>
                  <p className={`mt-1 text-sm font-black ${row.balanceOwed > 0 ? 'text-orange-700' : 'text-zinc-900'}`}>{formatCurrency(row.balanceOwed)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OperationalCostChart({ title, subtitle, rows, total, emptyLabel, totalLabel }) {
  const pieRows = rows.map((row, index) => {
    const percentage = total > 0 ? (row.amount / total) * 100 : 0;
    return {
      ...row,
      percentage,
      color: COST_PIE_COLORS[index % COST_PIE_COLORS.length],
    };
  });

  const gradientStops = pieRows.reduce(
    (acc, row) => {
      const start = acc.current;
      const end = start + row.percentage;
      acc.parts.push(`${row.color} ${start}% ${end}%`);
      acc.current = end;
      return acc;
    },
    { parts: [], current: 0 }
  );

  const pieGradient = gradientStops.parts.length
    ? `conic-gradient(${gradientStops.parts.join(', ')})`
    : 'conic-gradient(#e4e4e7 0 100%)';

  return (
    <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>

      {total <= 0 ? (
        <div className="mt-5 rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-zinc-100 bg-zinc-50/70 p-4">
            <div
              className="h-52 w-52 rounded-full border border-white shadow-inner shadow-black/5"
              style={{ backgroundImage: pieGradient }}
            />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{totalLabel}</p>
              <p className="mt-1 text-lg font-black text-zinc-900">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {pieRows.map((row) => (
              <div key={row.key} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <p className="truncate text-sm font-black text-zinc-900">{row.label}</p>
                  </div>
                  <p className="text-sm font-black text-zinc-900">{formatCurrency(row.amount)}</p>
                </div>
                <p className="mt-1 text-xs font-semibold text-zinc-500">{row.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getOperationalCostRangeCopy(range, text, lang) {
  if (range === 'day') {
    return {
      title: lang === 'zh' ? '今日花销结构' : 'Today Cost Mix',
      subtitle: lang === 'zh' ? '按类别查看今天的花销占比。' : 'Compare spending by category for today.',
    };
  }

  if (range === 'year') {
    return {
      title: lang === 'zh' ? '今年花销结构' : 'This Year Cost Mix',
      subtitle: lang === 'zh' ? '按类别查看今年的花销占比。' : 'Compare spending by category for this year.',
    };
  }

  if (range === 'all') {
    return {
      title: lang === 'zh' ? '全部花销结构' : 'Overall Cost Mix',
      subtitle: lang === 'zh' ? '按类别查看全部花销占比。' : 'Compare spending by category across all records.',
    };
  }

  return {
    title: text.thisMonthCostChartTitle || 'This Month Cost Mix',
    subtitle: text.thisMonthCostChartSubtitle || 'Compare spending by category for this month.',
  };
}

export default function AnalyticsDashboard({ dashboard, text, lang }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [costRange, setCostRange] = useState('month');
  const [detailMode, setDetailMode] = useState(null);
  const today = getLocalDateKey();
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const dayUnit = text.dayUnit || (lang === 'zh' ? '天' : 'day');
  const tonUnit = text.tonUnit || (lang === 'zh' ? '吨' : 'ton');
  const operationalCostRangeCopy = getOperationalCostRangeCopy(costRange, text, lang);

  const analytics = useMemo(() => {
    const monthly = buildMonthlySeries(dashboard.sales || [], locale);
    const companies = buildCompanyDiscipline(dashboard.companies || [], today);
    const sellers = buildSellerPerformance(dashboard.sellers || []);
    const inventorySnapshot = buildInventorySnapshot(dashboard.lots || []);
    const qualityPricing = buildQualityPricing(dashboard.lots || [], dashboard.sales || []);
    const companyPerformance = buildCompanyPerformance(dashboard.companies || []);
    const operationalCost = buildOperationalCostSummaryByRange(dashboard.operationalCosts || [], today, costRange);

    const collectionRate = dashboard.sales?.length
      ? (dashboard.sales.reduce((sum, sale) => sum + Number(sale.received_amount || 0), 0) /
          Math.max(dashboard.sales.reduce((sum, sale) => sum + Number(sale.sale_value || 0), 0), 1)) * 100
      : 0;

    const unpaidDays = companies
      .filter((company) => Number(company.balance_owed || 0) > 0)
      .map((company) => company.oldestUnpaidDays);

    return {
      monthly,
      companies: companies.map((company) => ({
        ...company,
        badCreditFlaggedLabel: text.badCreditFlagged || 'Bad credit flagged',
        creditStatusNormalLabel: text.creditStatusNormal || 'Credit status normal',
        outstandingBalanceLabel: text.outstandingBalance || 'Outstanding balance',
        oldestUnpaidLabel: text.oldestUnpaid || 'Oldest unpaid',
        avgPayDelayLabel: text.avgPayDelay || 'Avg pay delay',
        onTimeRateLabel: text.onTimeRate || 'On-time rate',
        salesLabel: text.sales || 'sales',
      })),
      qualityPricing: qualityPricing.map((row) => ({
        ...row,
        qualityLabel: text?.[String(row.quality || '').toLowerCase()] || row.quality,
        buyPerTonLabel: text.buyPerTonShort || 'Buy/ton',
        sellPerTonLabel: text.sellPerTonShort || 'Sell/ton',
        marginPerTonLabel: text.marginPerTonShort || 'Margin/ton',
      })),
      sellers,
      inventorySnapshot,
      companyPerformance,
      operationalCost: {
        ...operationalCost,
        rows: operationalCost.rows.map((row) => ({
          ...row,
          label: formatCostTypeLabel(row.key, text),
        })),
      },
      collectionRate,
      avgUnpaidDays: average(unpaidDays),
    };
  }, [dashboard, today, locale, text, costRange]);

  const totalSoldValue = dashboard.sales.reduce((sum, sale) => sum + Number(sale.sale_value || 0), 0);
  const totalReceived = dashboard.sales.reduce((sum, sale) => sum + Number(sale.received_amount || 0), 0);
  const totalProfit = dashboard.sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
  const highestMarket = [...analytics.companyPerformance].sort((a, b) => b.avgPricePerTon - a.avgPricePerTon)[0];
  const highestQualityMargin = [...analytics.qualityPricing].sort((a, b) => b.marginPerTon - a.marginPerTon)[0];
  const highestProfitCompany = analytics.companyPerformance[0];

  if (detailMode) {
    return (
      <AnalyticsDetailPage
        mode={detailMode}
        onBack={() => setDetailMode(null)}
        text={text}
        lang={lang}
        companyPerformanceRows={analytics.companyPerformance}
        companyDisciplineRows={analytics.companies}
        inventoryRows={analytics.inventorySnapshot}
      />
    );
  }

  return (
    <section className="space-y-6">
      <AnalyticsSectionTabs activeSection={activeSection} onChange={setActiveSection} text={text} />

      {activeSection === 'overview' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricTile
              icon={<BarChart3 className="h-5 w-5" />}
              title={text.collectionRate || 'Collection Rate'}
              value={`${Math.round(analytics.collectionRate)}%`}
              hint={`${formatCurrency(totalReceived)} ${text.receivedFromSold || 'received from sold'} ${formatCurrency(totalSoldValue)}`}
              tone="sky"
            />
            <MetricTile
              icon={<Clock3 className="h-5 w-5" />}
              title={text.avgUnpaidAge || 'Average Outstanding Age'}
              value={formatDays(analytics.avgUnpaidDays, lang, dayUnit)}
              hint={text.unpaidBalanceAgeHint || 'How long unpaid company balances have been open'}
              tone="amber"
            />
            <MetricTile
              icon={<WalletCards className="h-5 w-5" />}
              title={text.totalProfit || 'Total Profit'}
              value={formatCurrency(totalProfit)}
              hint={text.totalProfitHint || 'Profit across all recorded sales'}
              tone="emerald"
            />
            <MetricTile
              icon={<CircleDollarSign className="h-5 w-5" />}
              title={text.bestMarketPrice || 'Best Market Price'}
              value={highestMarket ? `${formatCurrency(highestMarket.avgPricePerTon)}/${tonUnit}` : formatCurrency(0)}
              hint={highestMarket ? `${highestMarket.name} ${text.bestPriceCompanyHint || 'is paying the highest average price'}` : (text.noCompanyMarketPricing || 'No company market pricing yet')}
              tone="slate"
            />
            <MetricTile
              icon={<TrendingUp className="h-5 w-5" />}
              title={text.bestQualityMargin || 'Best Quality Margin'}
              value={highestQualityMargin ? `${formatCurrency(highestQualityMargin.marginPerTon)}/${tonUnit}` : formatCurrency(0)}
              hint={highestQualityMargin ? `${highestQualityMargin.qualityLabel || highestQualityMargin.quality} ${text.bestQualityMarginHint || 'quality gives the strongest average margin'}` : (text.noQualityMarginData || 'No quality margin data yet')}
              tone="rose"
            />
            <MetricTile
              icon={<WalletCards className="h-5 w-5" />}
              title={text.thisMonthOtherCost || 'This Month Other Costs'}
              value={formatCurrency(analytics.operationalCost.thisMonthTotal)}
              hint={text.thisMonthOtherCostHint || 'Driver, labour, and other daily costs recorded this month'}
              tone="teal"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <MiniBarChart
              title={text.sellingVsReceiving || 'Selling vs Receiving'}
              subtitle={text.monthlyFlowSubtitle || 'Recent monthly view of sold value, received money, and profit movement.'}
              data={analytics.monthly}
              soldLabel={text.soldShort || 'Sold'}
              receivedLabel={text.received || 'Received'}
              profitLabel={text.profitShort || 'Profit'}
            />
            <ProfitPanel
              title={text.totalProfitPanel || 'Profit Overview'}
              subtitle={text.totalProfitPanelSubtitle || 'Track overall profit and see which company is creating the strongest return.'}
              totalProfit={totalProfit}
              totalSoldValue={totalSoldValue}
              totalReceived={totalReceived}
              bestCompany={highestProfitCompany}
              emptyLabel={text.noCompanyMarketPricing || 'No company market pricing yet'}
              text={text}
              tonUnit={tonUnit}
            />
          </div>
        </>
      ) : null}

      {activeSection === 'companies' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDetailMode('companies')}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              {text.viewAllCompanyData || (lang === 'zh' ? '查看全部公司数据' : 'View Full Company Data')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <CompanyDisciplineTable
              title={text.companyPaymentDiscipline || 'Company Payment Discipline'}
              subtitle={text.paymentDisciplineSubtitle || 'See who pays late, who still owes money, and which accounts need attention first.'}
              companies={analytics.companies}
              emptyLabel={text.noCompanySalesYet || 'No company sales yet.'}
              lang={lang}
              dayUnit={dayUnit}
              text={text}
            />
            <CompanyPerformanceBoard
              title={text.companyMarketPricing || 'Company Performance'}
              subtitle={text.marketPricingSubtitle || 'Compare company pricing, profit, collection, and outstanding balances in one clearer view.'}
              rows={analytics.companyPerformance}
              emptyLabel={text.noMarketPricingYet || 'No market pricing yet.'}
              soldLabel={text.soldShort || 'Sold'}
              text={text}
              lang={lang}
              tonUnit={tonUnit}
            />
          </div>
        </div>
      ) : null}

      {activeSection === 'sellers' ? (
        <SellerHealthBoard
          title={text.analysisSellers || 'Sellers'}
          subtitle={lang === 'zh' ? '集中看欠款、退货次数和品质风险。' : 'See seller balances, returns, and quality risk in one place.'}
          rows={analytics.sellers}
          emptyLabel={lang === 'zh' ? '还没有卖家分析数据。' : 'No seller insights yet.'}
          text={text}
        />
      ) : null}

      {activeSection === 'inventory' ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <InventorySnapshotBoard
            title={lang === 'zh' ? '库存快照' : 'Inventory Snapshot'}
            subtitle={lang === 'zh' ? '优先查看当前还剩最多重量的批次。' : 'See which lots still hold the most remaining stock.'}
            rows={analytics.inventorySnapshot}
            emptyLabel={lang === 'zh' ? '还没有可分析的库存。' : 'No inventory insights yet.'}
            text={text}
            lang={lang}
            onViewAll={() => setDetailMode('inventory')}
          />
          <QualityPricingGrid
            title={text.qualityPriceLadder || 'Quality Price Ladder'}
            subtitle={text.qualityPriceSubtitle || 'Track how different qualities affect buy price, sell price, and margin per ton.'}
            rows={analytics.qualityPricing}
            emptyLabel={text.noQualityPricingYet || 'No quality pricing data yet.'}
            soldLabel={text.soldShort || 'Sold'}
            boughtLabel={text.bought || 'Bought'}
            lang={lang}
          />
        </div>
      ) : null}

      {activeSection === 'costs' ? (
        <>
          <CostRangeTabs activeRange={costRange} onChange={setCostRange} text={text} />
          <OperationalCostChart
            title={operationalCostRangeCopy.title}
            subtitle={operationalCostRangeCopy.subtitle}
            rows={analytics.operationalCost.rows}
            total={analytics.operationalCost.thisMonthTotal}
            emptyLabel={text.noOperationalCostsYet || 'No operational costs yet.'}
            totalLabel={text.costByCategory || 'Cost by category'}
          />
        </>
      ) : null}

    </section>
  );
}
