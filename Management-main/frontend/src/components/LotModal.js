import React from "react";
import { Loader2, Save, XCircle } from "lucide-react";

export default function LotModal({ ctx }) {
  const {
    showLotModal,
    setShowLotModal,
    t,
    text,
    handleCreateLot,
    lotForm,
    setLotForm,
    Input,
    Select,
    Button,
    QUALITY_OPTIONS,
    formatWeightDisplay,
    formatCurrency,
    dashboard,
    submittingKey,
  } = ctx;

  if (!showLotModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowLotModal(false)}
      />
      <div className="relative z-10 flex h-[100dvh] w-screen max-w-screen flex-col overflow-x-hidden overflow-y-hidden bg-white shadow-2xl shadow-black/20 sm:h-auto sm:max-h-[calc(100vh-3rem)] sm:max-w-5xl sm:rounded-[2rem] sm:border sm:border-zinc-100">
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white px-4 py-3 sm:px-6 sm:py-5"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="mx-auto flex w-full max-w-[430px] items-start justify-between gap-4 sm:max-w-none">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                {t.addProduct}
              </p>
              <h3 className="mt-1 text-lg font-black tracking-tight sm:text-xl">
                {text.lotWorkflowTitle}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                {text.lotWorkflowSubtitle}
              </p>
            </div>
            <button
              onClick={() => setShowLotModal(false)}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleCreateLot}
          className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden"
        >
          <div
            className="min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 sm:p-6"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            }}
          >
            <div className="mx-auto w-full max-w-[430px] space-y-2 sm:max-w-none sm:space-y-6">
              <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-zinc-900">
                      {lotForm.product_name || t.addProduct}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {lotForm.sellerName || t.seller}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white px-2.5 py-2 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {text.boughtWeight}
                    </p>
                    <p className="mt-0.5 text-xs font-black text-zinc-900">
                      {formatWeightDisplay(lotForm.bought_weight_tons || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid max-w-full gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="min-w-0 space-y-3 sm:space-y-4">
                  <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:rounded-[1.35rem] sm:p-5 sm:shadow-sm">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {text.lotBasics}
                    </p>
                    <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                      <Input
                        label={t.productName}
                        size="compact"
                        value={lotForm.product_name}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            product_name: event.target.value,
                          }))
                        }
                      />
                      <Input
                        label={t.seller}
                        size="compact"
                        list="seller-name-options"
                        value={lotForm.sellerName}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            sellerName: event.target.value,
                          }))
                        }
                        placeholder={t.seller}
                      />
                      <Input
                        label={t.phone}
                        size="compact"
                        value={lotForm.sellerPhone}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            sellerPhone: event.target.value,
                          }))
                        }
                        inputMode="tel"
                      />
                      <Input
                        label={t.date}
                        size="compact"
                        type="date"
                        value={lotForm.purchase_date}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            purchase_date: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:rounded-[1.35rem] sm:border-amber-100 sm:p-5 sm:shadow-sm">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                      {text.purchaseDetails}
                    </p>
                    <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                      <Input
                        label={text.boughtWeight}
                        size="compact"
                        type="number"
                        inputMode="decimal"
                        step="0.001"
                        value={lotForm.bought_weight_tons}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            bought_weight_tons: event.target.value,
                          }))
                        }
                      />
                      <Input
                        label={text.costPerTon}
                        size="compact"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={lotForm.cost_per_ton}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            cost_per_ton: event.target.value,
                          }))
                        }
                      />
                      <Input
                        label={t.color}
                        size="compact"
                        value={lotForm.color}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            color: event.target.value,
                          }))
                        }
                      />
                      <Select
                        label={t.quality}
                        size="compact"
                        value={lotForm.quality}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            quality: event.target.value,
                          }))
                        }
                        options={QUALITY_OPTIONS.map((quality) => ({
                          value: quality,
                          label: t[quality.toLowerCase()] || quality,
                        }))}
                      />
                      <Input
                        label={t.location}
                        size="compact"
                        value={lotForm.location}
                        onChange={(event) =>
                          setLotForm((current) => ({
                            ...current,
                            location: event.target.value,
                          }))
                        }
                        className="sm:col-span-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden rounded-[1.75rem] border border-zinc-100 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white lg:block">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {text.visualRecord}
                  </p>
                  <div className="flex min-h-[260px] flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <div>
                      <p className="text-2xl font-black tracking-tight">
                        {lotForm.product_name || t.addProduct}
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {lotForm.sellerName || t.seller}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {text.boughtWeight}
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {formatWeightDisplay(lotForm.bought_weight_tons || 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {text.costPerTon}
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {lotForm.cost_per_ton
                            ? formatCurrency(lotForm.cost_per_ton)
                            : formatCurrency(0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {t.quality}
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {lotForm.quality}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {t.color}
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {lotForm.color || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="sticky bottom-0 z-10 border-t border-zinc-100 bg-white px-3 py-3 sm:px-6"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="mx-auto flex w-full max-w-[430px] flex-col-reverse gap-2 sm:max-w-none sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLotModal(false)}
                className="w-full sm:w-auto"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={submittingKey === "lot"}
                className="w-full sm:w-auto"
              >
                {submittingKey === "lot" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t.addProduct}
              </Button>
            </div>
          </div>

          <datalist id="seller-name-options">
            {dashboard.sellers.map((seller) => (
              <option key={seller.id} value={seller.name} />
            ))}
          </datalist>
        </form>
      </div>
    </div>
  );
}
