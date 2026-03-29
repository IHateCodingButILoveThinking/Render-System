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
      <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {text.detailBack || (lang === 'zh' ? '返回库存页' : 'Back to Inventory')}
        </button>
        <div className="mt-4">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">
            {t.inventorySummaryTitle || (lang === 'zh' ? '库存总览' : 'Inventory Overview')}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t.inventorySummarySubtitle || (lang === 'zh' ? '实时查看库存成本、剩余重量、销售金额与已收金额。' : 'Real-time view of inventory cost, stock weight, sold value, and received amount.')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-sm ${card.tone}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {card.title}
                </p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-5 text-2xl font-black tracking-tight text-zinc-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
