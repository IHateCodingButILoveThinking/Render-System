import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Package,
  Plus,
  Search,
  Trash2,
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
      className={`group inline-flex items-center gap-3 rounded-[1.2rem] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md ${
        compact ? 'px-3.5 py-2.5' : 'w-full px-4 py-3.5'
      }`}
    >
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.searchLots}</p>
                <button
                  type="button"
                  onClick={() => setShowOverviewPage(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  {lang === 'zh' ? '库存总览' : 'Overview'}
                </button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={text.searchLots}
                  className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-10 text-sm focus:border-black focus:outline-none focus:ring-4 focus:ring-black/5"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={lang === 'zh' ? '清空搜索' : 'Clear search'}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.06 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-3 sm:p-4"
            >
              <div className="flex h-full flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700">
                    <Package className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-zinc-900">{t.addProduct}</p>
                    <p className="text-xs text-zinc-500">{lang === 'zh' ? '新建进货批次' : 'Create a new purchase lot'}</p>
                  </div>
                </div>
                <Button className="w-full px-3" onClick={handleOpenLotModal} disabled={!hasSellerProfiles}>
                  <Plus className="h-4 w-4" />
                  {t.addProduct}
                </Button>
              </div>
            </motion.div>
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
                  className="max-w-full overflow-hidden rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-white via-white to-sky-50/40 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="border-b border-zinc-100 p-4 sm:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-black text-zinc-900">{lot.product_name}</h3>
                        <LotSellerMeta
                          lot={lot}
                          sellerHasQualityIssue={sellerHasQualityIssue}
                          text={text}
                          formatDateDisplay={formatDateDisplay}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" onClick={() => handleDeleteLot(lot.id)} className="min-h-[38px] px-2 py-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.remaining}</p>
                        <p className="mt-1 text-sm font-black text-zinc-900">{formatWeightDisplay(lot.remaining_weight_tons)}</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.totalCost}</p>
                        <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(lot.total_cost)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <LotDetailButton lang={lang} onClick={() => setSelectedLotId(lot.id)} />
                    </div>
                  </div>

                  <div className="hidden flex-col gap-4 border-b border-zinc-100 p-5 sm:flex">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-sky-100 via-white to-emerald-100 shadow-sm">
                      <Package className="h-6 w-6 text-sky-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words text-lg font-black text-zinc-900">{lot.product_name}</h3>
                          <LotSellerMeta
                            lot={lot}
                            sellerHasQualityIssue={sellerHasQualityIssue}
                            text={text}
                            formatDateDisplay={formatDateDisplay}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" onClick={() => handleDeleteLot(lot.id)} className="self-start text-red-600 hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.bought}</p>
                          <p className="mt-1 text-sm font-black text-zinc-900">{formatWeightDisplay(lot.bought_weight_tons)}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.sold}</p>
                          <p className="mt-1 text-sm font-black text-zinc-900">{formatWeightDisplay(lot.sold_weight_tons)}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.remaining}</p>
                          <p className="mt-1 text-sm font-black text-zinc-900">{formatWeightDisplay(lot.remaining_weight_tons)}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.totalCost}</p>
                          <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(lot.total_cost)}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <LotDetailButton lang={lang} onClick={() => setSelectedLotId(lot.id)} />
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
