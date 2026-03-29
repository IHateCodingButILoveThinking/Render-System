import React from 'react';
import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react';

export default function InventoryLotQualityPage({ ctx }) {
  const {
    lot,
    t,
    text,
    lang,
    Select,
    Button,
    QUALITY_OPTIONS,
    lotQualityValue,
    setLotQualityDrafts,
    handleUpdateLotQuality,
    submittingKey,
    onBack,
  } = ctx;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回产品详情' : 'Back to Product Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">{text.updateQuality || t.save}</h2>
            <p className="mt-1 text-sm text-zinc-500">{lot.product_name}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Select
            label={t.quality}
            value={lotQualityValue}
            onChange={(event) =>
              setLotQualityDrafts((current) => ({
                ...current,
                [lot.id]: event.target.value,
              }))
            }
            options={QUALITY_OPTIONS.map((quality) => ({
              value: quality,
              label: t[quality.toLowerCase()] || quality,
            }))}
          />
          <div className="flex items-end">
            <Button
              className="h-[46px] w-full sm:w-auto sm:px-6"
              variant="secondary"
              onClick={() => handleUpdateLotQuality(lot)}
              disabled={submittingKey === `lot-quality-${lot.id}`}
            >
              {submittingKey === `lot-quality-${lot.id}` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {text.updateQuality || t.save}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
