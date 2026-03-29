import React from 'react';
import { ArrowLeft, ArrowRightLeft, Loader2 } from 'lucide-react';

export default function InventoryLotReturnPage({ ctx }) {
  const {
    lot,
    text,
    lang,
    formatCurrency,
    formatWeightDisplay,
    Input,
    Button,
    lotReturnForm,
    setLotReturnForms,
    handleLotReturn,
    lotReturnEstimatedAmount,
    submittingKey,
    onBack,
  } = ctx;

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
        <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-900">{text.recordSellerReturn}</h2>
        <p className="mt-1 text-sm text-zinc-500">{lot.product_name}</p>
      </div>

      <div className="rounded-[2rem] border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
        {!lot.seller_id ? (
          <p className="text-sm text-zinc-500">{text.noSellerLinked}</p>
        ) : Number(lot.remaining_weight_tons || 0) <= 0 ? (
          <p className="text-sm text-zinc-500">{text.noLotsForSeller}</p>
        ) : (
          <div className="max-w-xl space-y-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
              {formatWeightDisplay(lot.remaining_weight_tons)} {text.remaining}
            </div>
            <Input
              label={text.returnWeight}
              type="number"
              step="0.001"
              value={lotReturnForm.return_weight_tons}
              onChange={(event) =>
                setLotReturnForms((current) => ({
                  ...current,
                  [lot.id]: { ...lotReturnForm, return_weight_tons: event.target.value },
                }))
              }
            />
            <Input
              label={text.returnDate}
              type="date"
              value={lotReturnForm.return_date}
              onChange={(event) =>
                setLotReturnForms((current) => ({
                  ...current,
                  [lot.id]: { ...lotReturnForm, return_date: event.target.value },
                }))
              }
            />
            <Input
              label={text.returnReason}
              value={lotReturnForm.return_reason}
              onChange={(event) =>
                setLotReturnForms((current) => ({
                  ...current,
                  [lot.id]: { ...lotReturnForm, return_reason: event.target.value },
                }))
              }
            />
            <p className="text-xs text-zinc-500">
              {text.returnAmountAutoHint} {formatCurrency(lotReturnEstimatedAmount)}
            </p>
            <div className="pt-1">
              <Button
                className="h-[50px] w-full"
                variant="outline"
                onClick={() => handleLotReturn(lot)}
                disabled={submittingKey === `lot-return-${lot.id}`}
              >
                {submittingKey === `lot-return-${lot.id}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRightLeft className="w-4 h-4" />
                )}
                {text.saveReturn}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
