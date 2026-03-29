import React from 'react';
import { ArrowLeft, BarChart3, Clock3, Package2 } from 'lucide-react';

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

export default function AnalyticsDetailPage({
  mode,
  onBack,
  text,
  lang,
  companyPerformanceRows = [],
  companyDisciplineRows = [],
  inventoryRows = [],
}) {
  const dayUnit = text.dayUnit || (lang === 'zh' ? '天' : 'day');
  const tonUnit = text.tonUnit || (lang === 'zh' ? '吨' : 'ton');

  if (mode === 'companies') {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {text.detailBack || (lang === 'zh' ? '返回分析页' : 'Back to Analysis')}
          </button>
          <div className="mt-4">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              {text.companyDataCenterTitle || (lang === 'zh' ? '公司完整数据中心' : 'Full Company Data Center')}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {text.companyDataCenterSubtitle || (lang === 'zh' ? '查看所有公司数据，避免在主分析页过度滚动。' : 'See all company records in one dedicated view.')}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
            {text.companyMarketPricing || 'Company Performance'}
          </h3>
          {companyPerformanceRows.length === 0 ? (
            <p className="text-sm text-zinc-400">{text.noMarketPricingYet || 'No market pricing yet.'}</p>
          ) : (
            companyPerformanceRows.map((row, index) => (
              <div key={row.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-zinc-900">{index + 1}. {row.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {text.soldShort || 'Sold'}: {formatWeight(row.totalWeight, lang)} • {formatCurrency(row.avgPricePerTon)}/{tonUnit}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className={`text-base font-black ${row.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(row.profit)}</p>
                    <p className="text-xs text-zinc-500">{Math.round(row.collectionRate)}% {text.collectionRate || 'Collection Rate'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
            {text.companyPaymentDiscipline || 'Company Payment Discipline'}
          </h3>
          {companyDisciplineRows.length === 0 ? (
            <p className="text-sm text-zinc-400">{text.noCompanySalesYet || 'No company sales yet.'}</p>
          ) : (
            companyDisciplineRows.map((company) => (
              <div key={company.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-zinc-900">{company.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                      {text.oldestUnpaid || 'Oldest unpaid'}: {formatDays(company.oldestUnpaidDays, lang, dayUnit)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className={`text-base font-black ${Number(company.balance_owed || 0) > 0 ? 'text-orange-700' : 'text-zinc-900'}`}>
                      {formatCurrency(company.balance_owed)}
                    </p>
                    <p className="text-xs text-zinc-500">{text.outstandingBalance || 'Outstanding balance'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {text.detailBack || (lang === 'zh' ? '返回分析页' : 'Back to Analysis')}
        </button>
        <div className="mt-4">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">
            {text.inventoryDataCenterTitle || (lang === 'zh' ? '产品完整数据中心' : 'Full Product Data Center')}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {text.inventoryDataCenterSubtitle || (lang === 'zh' ? '查看全部库存批次详情，页面更清爽。' : 'Open all inventory rows in a dedicated clean page.')}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
          <Package2 className="mr-2 inline h-4 w-4" />
          {text.analysisInventory || (lang === 'zh' ? '库存分析' : 'Inventory')}
        </h3>
        {inventoryRows.length === 0 ? (
          <p className="text-sm text-zinc-400">{lang === 'zh' ? '还没有可分析的库存。' : 'No inventory insights yet.'}</p>
        ) : (
          inventoryRows.map((row) => (
            <div key={row.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-base font-black text-zinc-900">{row.productName}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.sellerName || '-'} • {text?.[String(row.quality || '').toLowerCase()] || row.quality}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-base font-black text-zinc-900">{formatWeight(row.remainingWeight, lang)}</p>
                  <p className="text-xs text-zinc-500">{text.remaining || 'Remaining'}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {text.detailBack || (lang === 'zh' ? '返回分析页' : 'Back to Analysis')}
        </button>
      </div>
    </section>
  );
}
