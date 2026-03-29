import React from 'react';
import { ArrowLeft, Archive } from 'lucide-react';

export default function InventoryLotReturnRecordsPage({ ctx }) {
  const { text, lang, lot, lotReturns, formatDateDisplay, formatWeightDisplay, formatCurrency, onBack } = ctx;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回产品详情' : 'Back to Product Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
            <Archive className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">{lang === 'zh' ? '退货记录' : 'Return Records'}</h2>
            <p className="mt-1 text-sm text-zinc-500">{lot.product_name}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
        {lotReturns.length === 0 ? (
          <p className="text-sm text-zinc-400">{text.noReturnRecords}</p>
        ) : (
          <div className="space-y-2">
            {lotReturns.map((returned) => (
              <div key={returned.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-zinc-900">{formatDateDisplay(returned.return_date)}</p>
                    <p className="mt-1 text-xs text-zinc-500">{returned.return_reason || '-'}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-black text-zinc-900">{formatWeightDisplay(returned.return_weight_tons)}</p>
                    <p className="mt-1 text-xs text-zinc-500">{formatCurrency(returned.return_amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
