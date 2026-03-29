import React from 'react';
import { ArrowLeft, Boxes, CircleDollarSign, PackageCheck, Scale } from 'lucide-react';

export default function InventoryOverviewPage({ ctx }) {
  const {
    t,
    text,
    lang,
    overview,
    formatCurrency,
    formatWeightDisplay,
    onBack,
  } = ctx;

  const cards = [
    {
      key: 'inventory-cost',
      title: text.inventoryCost,
      value: formatCurrency(overview.totalInventoryCost),
      icon: CircleDollarSign,
      tone: 'from-sky-50 to-cyan-50 border-sky-100 text-sky-700',
    },
    {
      key: 'remaining-weight',
      title: text.remainingWeight,
      value: formatWeightDisplay(overview.totalRemainingWeight),
      icon: Scale,
      tone: 'from-emerald-50 to-lime-50 border-emerald-100 text-emerald-700',
    },
    {
      key: 'sold-value',
      title: text.soldValue,
      value: formatCurrency(overview.totalSoldValue),
      icon: PackageCheck,
      tone: 'from-amber-50 to-orange-50 border-amber-100 text-amber-700',
    },
    {
      key: 'received',
      title: text.received,
      value: formatCurrency(overview.totalReceived),
      icon: Boxes,
      tone: 'from-zinc-50 to-slate-50 border-zinc-200 text-zinc-700',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.2rem] border border-sky-200/20 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.25),_transparent_30%),linear-gradient(145deg,_#031320,_#0b2238_46%,_#123b49_100%)] p-4 text-white shadow-[0_30px_90px_-48px_rgba(2,6,23,0.95)] sm:p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/12 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <ArrowLeft className="h-4 w-4" />
              {text.detailBack || (lang === 'zh' ? '返回库存页' : 'Back to Inventory')}
            </button>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                {lang === 'zh' ? '库存驾驶舱' : 'Stock Overview'}
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {t.inventorySummaryTitle || (lang === 'zh' ? '库存总览' : 'Inventory Overview')}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/68">
                {t.inventorySummarySubtitle || (lang === 'zh' ? '实时查看库存成本、剩余重量、销售金额与已收金额。' : 'Real-time view of inventory cost, stock weight, sold value, and received amount.')}
              </p>
            </div>
          </div>
          <div className="relative flex h-44 w-full max-w-[240px] items-center justify-center self-center lg:self-auto">
            <div className="absolute h-40 w-40 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm" />
            <div className="absolute h-28 w-28 rounded-full border border-cyan-200/30 bg-cyan-300/10" />
            <div className="relative text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                {text.remainingWeight}
              </p>
              <p className="mt-2 text-xl font-black text-white">
                {formatWeightDisplay(overview.totalRemainingWeight)}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {lang === 'zh' ? '当前库存核心数据' : 'Live inventory focus'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.4)] ${card.tone}`}
            >
              <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/30 blur-2xl" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  {card.title}
                </p>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-white/82 shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-6 text-2xl font-black tracking-tight text-zinc-900">
                {card.value}
              </p>
              <div className="mt-4 h-1.5 w-16 rounded-full bg-white/70" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
