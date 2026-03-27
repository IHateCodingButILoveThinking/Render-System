import React, { useMemo } from 'react';
import { AlertTriangle, BarChart3, CircleDollarSign, Clock3, TrendingUp } from 'lucide-react';

function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatWeight(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} T`;
}

function formatDays(value, daySuffix) {
  if (!Number.isFinite(value) || value <= 0) return `0${daySuffix}`;
  return `${Math.round(value)}${daySuffix}`;
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
          const firstPaymentDate = [...sale.payments].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date))[0]?.payment_date;
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

function buildMarketPricing(companies) {
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
      };
    })
    .filter((item) => item.totalWeight > 0)
    .sort((a, b) => b.avgPricePerTon - a.avgPricePerTon);
}

function MetricTile({ icon, title, value, hint, tone = 'default' }) {
  const tones = {
    default: 'border-zinc-100 bg-white text-zinc-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    sky: 'border-sky-100 bg-sky-50 text-sky-900',
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${tones[tone] || tones.default}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
        <div className="rounded-2xl bg-white/80 p-2 text-zinc-700">{icon}</div>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function MiniBarChart({ title, subtitle, data, soldLabel, receivedLabel, profitLabel }) {
  const maxValue = Math.max(...data.flatMap((item) => [item.sold, item.received, item.profit]), 1);

  return (
    <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-6 grid grid-cols-6 gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex min-h-[220px] flex-col justify-end gap-2">
            <div className="flex h-[180px] items-end justify-center gap-1 rounded-3xl bg-zinc-50 px-2 py-3">
              <div className="w-3 rounded-full bg-zinc-900" style={{ height: `${(item.sold / maxValue) * 100}%` }} />
              <div className="w-3 rounded-full bg-emerald-500" style={{ height: `${(item.received / maxValue) * 100}%` }} />
              <div className="w-3 rounded-full bg-sky-400" style={{ height: `${(item.profit / maxValue) * 100}%` }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-zinc-700">{item.label}</p>
              <p className="mt-1 text-[11px] text-zinc-400">{formatCurrency(item.received)}</p>
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

function CompanyDisciplineTable({ title, subtitle, companies, emptyLabel, daySuffix }) {
  return (
    <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {companies.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          companies.slice(0, 6).map((company) => (
            <div key={company.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-zinc-900">{company.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {company.bad_credit ? company.badCreditFlaggedLabel : company.creditStatusNormalLabel} • {company.sales.length} {company.salesLabel}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-black text-orange-700">{formatCurrency(company.balance_owed)}</p>
                  <p className="text-xs text-zinc-400">{company.outstandingBalanceLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{company.oldestUnpaidLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatDays(company.oldestUnpaidDays, daySuffix)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{company.avgPayDelayLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatDays(company.avgPaymentDelay, daySuffix)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
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

function QualityPricingGrid({ title, subtitle, rows, emptyLabel, soldLabel }) {
  return (
    <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          rows.map((row) => (
            <div key={row.quality} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-black text-zinc-900">{row.quality}</p>
                  <p className="mt-1 text-sm text-zinc-400">{formatWeight(row.soldWeight)} {soldLabel}</p>
                </div>
                <div className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-600">
                  {formatWeight(row.boughtWeight)}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{row.buyPerTonLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.avgBuyPerTon)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{row.sellPerTonLabel}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(row.avgSellPerTon)}</p>
                </div>
                <div className={`rounded-2xl px-3 py-3 ${row.marginPerTon >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${row.marginPerTon >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{row.marginPerTonLabel}</p>
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

function MarketPricePanel({ title, subtitle, rows, emptyLabel, soldLabel }) {
  const maxPrice = Math.max(...rows.map((row) => row.avgPricePerTon), 1);

  return (
    <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-sm text-zinc-400">{emptyLabel}</div>
        ) : (
          rows.slice(0, 6).map((row) => (
            <div key={row.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-zinc-900">{row.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">{formatWeight(row.totalWeight)} {soldLabel}</p>
                </div>
                <p className="text-sm font-black text-zinc-900">{formatCurrency(row.avgPricePerTon)}/T</p>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-zinc-900 via-sky-500 to-emerald-500"
                  style={{ width: `${Math.max(12, (row.avgPricePerTon / maxPrice) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({ dashboard, text, lang }) {
  const today = new Date().toISOString().split('T')[0];
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const daySuffix = text.dayShort || 'd';

  const analytics = useMemo(() => {
    const monthly = buildMonthlySeries(dashboard.sales || [], locale);
    const companies = buildCompanyDiscipline(dashboard.companies || [], today);
    const qualityPricing = buildQualityPricing(dashboard.lots || [], dashboard.sales || []);
    const marketPricing = buildMarketPricing(dashboard.companies || []);

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
        buyPerTonLabel: text.buyPerTonShort || 'Buy/T',
        sellPerTonLabel: text.sellPerTonShort || 'Sell/T',
        marginPerTonLabel: text.marginPerTonShort || 'Margin/T',
      })),
      marketPricing,
      collectionRate,
      avgUnpaidDays: average(unpaidDays),
    };
  }, [dashboard, today, locale, text]);

  const totalSoldValue = dashboard.sales.reduce((sum, sale) => sum + Number(sale.sale_value || 0), 0);
  const totalReceived = dashboard.sales.reduce((sum, sale) => sum + Number(sale.received_amount || 0), 0);
  const highestMarket = analytics.marketPricing[0];
  const highestQualityMargin = [...analytics.qualityPricing].sort((a, b) => b.marginPerTon - a.marginPerTon)[0];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<BarChart3 className="h-5 w-5" />}
          title={text.collectionRate || 'Collection Rate'}
          value={`${Math.round(analytics.collectionRate)}%`}
          hint={`${formatCurrency(totalReceived)} ${text.receivedFromSold || 'received from sold'} ${formatCurrency(totalSoldValue)}`}
          tone="sky"
        />
        <MetricTile
          icon={<Clock3 className="h-5 w-5" />}
          title={text.avgUnpaidAge || 'Average Unpaid Age'}
          value={formatDays(analytics.avgUnpaidDays, daySuffix)}
          hint={text.unpaidBalanceAgeHint || 'How long unpaid company balances have been open'}
          tone="amber"
        />
        <MetricTile
          icon={<CircleDollarSign className="h-5 w-5" />}
          title={text.bestMarketPrice || 'Best Market Price'}
          value={highestMarket ? `${formatCurrency(highestMarket.avgPricePerTon)}/T` : formatCurrency(0)}
          hint={highestMarket ? `${highestMarket.name} ${text.bestPriceCompanyHint || 'is paying the highest average price'}` : (text.noCompanyMarketPricing || 'No company market pricing yet')}
          tone="emerald"
        />
        <MetricTile
          icon={<TrendingUp className="h-5 w-5" />}
          title={text.bestQualityMargin || 'Best Quality Margin'}
          value={highestQualityMargin ? `${formatCurrency(highestQualityMargin.marginPerTon)}/T` : formatCurrency(0)}
          hint={highestQualityMargin ? `${highestQualityMargin.quality} ${text.bestQualityMarginHint || 'quality gives the strongest average margin'}` : (text.noQualityMarginData || 'No quality margin data yet')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MiniBarChart
          title={text.sellingVsReceiving || 'Selling vs Receiving'}
          subtitle={text.monthlyFlowSubtitle || 'Recent monthly view of sold value, received money, and profit movement.'}
          data={analytics.monthly}
          soldLabel={text.soldShort || 'Sold'}
          receivedLabel={text.received || 'Received'}
          profitLabel={text.profitShort || 'Profit'}
        />
        <CompanyDisciplineTable
          title={text.companyPaymentDiscipline || 'Company Payment Discipline'}
          subtitle={text.paymentDisciplineSubtitle || 'See who pays late, who still owes money, and which accounts need attention first.'}
          companies={analytics.companies}
          emptyLabel={text.noCompanySalesYet || 'No company sales yet.'}
          daySuffix={daySuffix}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <QualityPricingGrid
          title={text.qualityPriceLadder || 'Quality Price Ladder'}
          subtitle={text.qualityPriceSubtitle || 'Track how different qualities affect buy price, sell price, and margin per ton.'}
          rows={analytics.qualityPricing}
          emptyLabel={text.noQualityPricingYet || 'No quality pricing data yet.'}
          soldLabel={text.soldShort || 'Sold'}
        />
        <MarketPricePanel
          title={text.companyMarketPricing || 'Company Market Pricing'}
          subtitle={text.marketPricingSubtitle || 'Compare which companies or markets are paying more per ton right now.'}
          rows={analytics.marketPricing}
          emptyLabel={text.noMarketPricingYet || 'No market pricing yet.'}
          soldLabel={text.soldShort || 'Sold'}
        />
      </div>

      <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/10 p-3">
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">{text.pricingInsight || 'Pricing Insight'}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              {text.pricingInsightBody || 'Product price should not stay flat. This dashboard now helps us see that different companies pay different market prices, and each quality band carries a different average value per ton. Use the quality and company charts together before setting your next sale price.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
