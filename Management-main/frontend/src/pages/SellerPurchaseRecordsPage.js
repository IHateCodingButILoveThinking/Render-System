import React from 'react';
import { ArrowLeft, ScrollText } from 'lucide-react';

export default function SellerPurchaseRecordsPage({ ctx }) {
  const {
    seller,
    text,
    lang,
    sellerLots,
    formatDateDisplay,
    formatWeightDisplay,
    formatCurrency,
    onBack,
  } = ctx;

  return (
    <section className="space-y-5">
      <div className="rounded-[1.6rem] border border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回客户详情' : 'Back to Customer Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <ScrollText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900">{text.purchaseRecords}</h2>
            <p className="mt-1 text-xs text-zinc-500">{seller.name} • {sellerLots.length} {text.analyticsLots}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-2.5">
          {sellerLots.length === 0 ? (
            <p className="text-sm text-zinc-400">{text.noLotsForSeller}</p>
          ) : (
            sellerLots.map((lot) => (
              <div key={lot.id} className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50/80 p-3.5">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-zinc-900">{lot.product_name}</p>
                    <p className="mt-1 break-words text-xs text-zinc-500">
                      {formatDateDisplay(lot.purchase_date)} • {formatWeightDisplay(lot.bought_weight_tons)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-base font-black text-zinc-900">{formatCurrency(lot.total_cost)}</p>
                    <p className="text-[11px] text-zinc-400">{text.remaining} {formatWeightDisplay(lot.remaining_weight_tons)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
