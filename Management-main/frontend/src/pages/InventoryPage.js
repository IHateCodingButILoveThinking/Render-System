import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Package,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import InventoryLotDetailPage from './InventoryLotDetailPage';
import InventoryOverviewPage from './InventoryOverviewPage';

function getCurrentDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function LotDetailButton({ lang, onClick, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center rounded-[1rem] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md ${
        compact ? 'gap-2 px-3.5 py-2' : 'w-full gap-3 px-4 py-3.5'
      }`}
    >
      {compact ? (
        <>
          <span className="text-[12px] font-black text-zinc-900 sm:text-[13px]">
            {lang === 'zh' ? '查看详情' : 'View Details'}
          </span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm transition group-hover:translate-x-0.5">
            <ArrowRight className="h-3 w-3" />
          </span>
        </>
      ) : (
        <>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
            <Package className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-zinc-900">
              {lang === 'zh' ? '查看详情' : 'View Details'}
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              {lang === 'zh' ? '进入产品独立页面' : 'Open the product page'}
            </span>
          </span>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </>
      )}
    </button>
  );
}

function LotSellerMeta({ lot, sellerHasQualityIssue, text, formatDateDisplay }) {
  const sellerName = lot.seller_name || text.noSellerLinked;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400 sm:text-sm">
      {sellerHasQualityIssue ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          {sellerName}
        </span>
      ) : (
        <span className="break-words">{sellerName}</span>
      )}
      <span className="text-zinc-300">•</span>
      <span>{formatDateDisplay(lot.purchase_date)}</span>
    </div>
  );
}

function LotMetricBox({ label, value, tone = 'zinc' }) {
  const tones = {
    zinc: 'border-zinc-100 bg-zinc-50/85 text-zinc-900 label:text-zinc-400',
    sky: 'border-sky-100 bg-sky-50/80 text-sky-900 label:text-sky-500',
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-900 label:text-emerald-500',
    amber: 'border-amber-100 bg-amber-50/85 text-amber-900 label:text-amber-500',
  };

  return (
    <div className={`rounded-[1rem] border px-2.5 py-2 ${tones[tone] || tones.zinc}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-0.5 text-[12px] font-black leading-4">{value}</p>
    </div>
  );
}

export default function InventoryPage({ ctx }) {
  const {
    t,
    text,
    lang,
    overview,
    formatCurrency,
    formatWeightDisplay,
    searchQuery,
    setSearchQuery,
    hasSellerProfiles,
    handleOpenLotModal,
    Button,
    filteredLots,
    saleForms,
    setSaleForms,
    lotReturnForms,
    setLotReturnForms,
    lotQualityDrafts,
    setLotQualityDrafts,
    handleDeleteLot,
    formatDateDisplay,
    QUALITY_OPTIONS,
    handleUpdateLotQuality,
    submittingKey,
    hasCompanyProfiles,
    setActiveTab,
    setShowCompanyModal,
    Input,
    handleCreateSale,
    dashboard,
    handleLotReturn,
    EmptyState,
  } = ctx;

  const [selectedLotId, setSelectedLotId] = useState(null);
  const [showOverviewPage, setShowOverviewPage] = useState(false);

  const selectedLot = useMemo(
    () => (dashboard.lots || []).find((lot) => lot.id === selectedLotId) || null,
    [dashboard.lots, selectedLotId]
  );

  const sellerQualityLookup = useMemo(() => {
    const byId = new Map();
    const byName = new Map();

    (dashboard.sellers || []).forEach((seller) => {
      byId.set(seller.id, Boolean(seller.bad_quality));
      byName.set(String(seller.name || '').trim().toLowerCase(), Boolean(seller.bad_quality));
    });

    return { byId, byName };
  }, [dashboard.sellers]);

  const selectedLotSaleForm = selectedLot
    ? saleForms[selectedLot.id] || {
        companyName: '',
        sale_date: getCurrentDateInputValue(),
        sold_weight_tons: '',
        price_per_ton: '',
        location: '',
      }
    : null;

  const selectedLotReturnForm = selectedLot
    ? lotReturnForms[selectedLot.id] || {
        return_weight_tons: '',
        return_date: getCurrentDateInputValue(),
        return_reason: '',
      }
    : null;

  const selectedLotReturns = selectedLot
    ? [...(selectedLot.seller_returns || [])].sort((a, b) => new Date(b.return_date) - new Date(a.return_date))
    : [];

  const selectedLotReturnEstimatedAmount = selectedLot
    ? Number(selectedLotReturnForm.return_weight_tons || 0) * Number(selectedLot.cost_per_ton || 0)
    : 0;

  const selectedLotQualityValue = selectedLot
    ? lotQualityDrafts[selectedLot.id] ?? selectedLot.quality ?? 'Good'
    : 'Good';

  if (showOverviewPage) {
    return (
      <InventoryOverviewPage
        ctx={{
          t,
          text,
          lang,
          overview,
          formatCurrency,
          formatWeightDisplay,
          onBack: () => setShowOverviewPage(false),
        }}
      />
    );
  }

  return (
    <>
      <section className="space-y-6">
        <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenLotModal}
              disabled={!hasSellerProfiles}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black shadow-sm transition ${
                hasSellerProfiles
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
                  : 'cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {t.addProduct}
            </button>
            <button
              type="button"
              onClick={() => setShowOverviewPage(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            >
              <Boxes className="h-3.5 w-3.5" />
              {lang === 'zh' ? '库存总览' : 'Overview'}
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={text.searchLots}
              className="h-10 w-full rounded-[1rem] border border-zinc-200 bg-zinc-50/70 pl-9 pr-9 text-[13px] font-medium focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                aria-label={lang === 'zh' ? '清空搜索' : 'Clear search'}
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          {!hasSellerProfiles ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">
                {text.createSellerFirst || (lang === 'zh' ? '请先创建卖家，再添加产品。' : 'Please create a seller first before adding a product.')}
              </p>
            </div>
          ) : null}
        </div>

        {filteredLots.length === 0 ? (
          <EmptyState title={text.noLotsYet} message={text.createFirstLot} />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredLots.map((lot) => {
              const sellerHasQualityIssue =
                sellerQualityLookup.byId.get(lot.seller_id) ||
                sellerQualityLookup.byName.get(String(lot.seller_name || '').trim().toLowerCase()) ||
                false;

              return (
                <div
                  key={lot.id}
                  className="max-w-full overflow-hidden rounded-[1.55rem] border border-zinc-100 bg-gradient-to-br from-white via-white to-sky-50/35 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="border-b border-zinc-100 p-3.5 sm:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="min-w-0 break-words text-[15px] font-black text-zinc-900">{lot.product_name}</h3>
                        <LotSellerMeta
                          lot={lot}
                          sellerHasQualityIssue={sellerHasQualityIssue}
                          text={text}
                          formatDateDisplay={formatDateDisplay}
                        />
                      </div>
                      <LotDetailButton lang={lang} onClick={() => setSelectedLotId(lot.id)} compact />
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                      <LotMetricBox
                        label={text.remaining}
                        value={formatWeightDisplay(lot.remaining_weight_tons)}
                        tone="emerald"
                      />
                      <LotMetricBox
                        label={t.totalCost}
                        value={formatCurrency(lot.total_cost)}
                        tone="amber"
                      />
                    </div>
                  </div>

                  <div className="hidden flex-col gap-3 border-b border-zinc-100 p-4 sm:flex">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-sky-100 via-white to-emerald-100 shadow-sm">
                      <Package className="h-5 w-5 text-sky-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="min-w-0 break-words text-[16px] font-black text-zinc-900">{lot.product_name}</h3>
                          <LotSellerMeta
                            lot={lot}
                            sellerHasQualityIssue={sellerHasQualityIssue}
                            text={text}
                            formatDateDisplay={formatDateDisplay}
                          />
                        </div>
                        <LotDetailButton lang={lang} onClick={() => setSelectedLotId(lot.id)} compact />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-1.5 md:grid-cols-4">
                        <LotMetricBox
                          label={text.bought}
                          value={formatWeightDisplay(lot.bought_weight_tons)}
                          tone="sky"
                        />
                        <LotMetricBox
                          label={text.sold}
                          value={formatWeightDisplay(lot.sold_weight_tons)}
                          tone="zinc"
                        />
                        <LotMetricBox
                          label={text.remaining}
                          value={formatWeightDisplay(lot.remaining_weight_tons)}
                          tone="emerald"
                        />
                        <LotMetricBox
                          label={t.totalCost}
                          value={formatCurrency(lot.total_cost)}
                          tone="amber"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedLot ? (
        <InventoryLotDetailPage
          ctx={{
            lot: selectedLot,
            t,
            text,
            lang,
            formatCurrency,
            formatWeightDisplay,
            formatDateDisplay,
            Select: ctx.Select,
            Input,
            Button,
            QUALITY_OPTIONS,
            lotQualityValue: selectedLotQualityValue,
            setLotQualityDrafts,
            handleUpdateLotQuality,
            submittingKey,
            saleForm: selectedLotSaleForm,
            setSaleForms,
            hasCompanyProfiles,
            setActiveTab,
            setShowCompanyModal,
            handleCreateSale,
            dashboard,
            lotReturnForm: selectedLotReturnForm,
            setLotReturnForms,
            handleLotReturn,
            lotReturnEstimatedAmount: selectedLotReturnEstimatedAmount,
            lotReturns: selectedLotReturns,
            onBack: () => setSelectedLotId(null),
            handleDeleteLot: (lotId) => {
              setSelectedLotId(null);
              handleDeleteLot(lotId);
            },
          }}
        />
      ) : null}
    </>
  );
}
