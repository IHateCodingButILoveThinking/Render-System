import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  PackageCheck,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import InventoryLotQualityPage from './InventoryLotQualityPage';
import InventoryLotSalesPage from './InventoryLotSalesPage';
import InventoryLotReturnPage from './InventoryLotReturnPage';
import InventoryLotReturnRecordsPage from './InventoryLotReturnRecordsPage';

function ActionCard({ icon, title, subtitle, onClick, tone = 'sky' }) {
  const tones = {
    sky: 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50/90',
    emerald: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50/90',
    orange: 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50/90',
    zinc: 'border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-slate-50/90',
  };
  const iconTones = {
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[1.2rem] border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-[1.35rem] sm:p-3.5 ${tones[tone] || tones.sky}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.95rem] sm:h-9 sm:w-9 sm:rounded-[1rem] ${iconTones[tone] || iconTones.sky}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-black tracking-tight text-zinc-900 sm:text-sm">{title}</h3>
            <p className="mt-0.5 hidden text-[11px] leading-5 text-zinc-500 sm:block sm:text-xs">{subtitle}</p>
          </div>
        </div>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/85 text-zinc-500 shadow-sm transition group-hover:translate-x-0.5 sm:h-8 sm:w-8">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function SummaryCard({ label, value, tone = 'zinc' }) {
  const tones = {
    zinc: 'border-zinc-100 bg-white text-zinc-900',
    orange: 'border-orange-100 bg-orange-50/90 text-orange-800',
    emerald: 'border-emerald-100 bg-emerald-50/90 text-emerald-800',
  };

  const labelTones = {
    zinc: 'text-zinc-400',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
  };

  return (
    <div className={`rounded-[1rem] border px-3 py-2.5 shadow-sm sm:rounded-[1.15rem] sm:py-3 ${tones[tone] || tones.zinc}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${labelTones[tone] || labelTones.zinc}`}>
        {label}
      </p>
      <p className="mt-1 text-[13px] font-black sm:mt-1.5 sm:text-[15px]">{value}</p>
    </div>
  );
}

export default function InventoryLotDetailPage({ ctx }) {
  const {
    lot,
    t,
    text,
    lang,
    formatCurrency,
    formatWeightDisplay,
    formatDateDisplay,
    Select,
    Input,
    Button,
    QUALITY_OPTIONS,
    lotQualityValue,
    setLotQualityDrafts,
    handleUpdateLotQuality,
    submittingKey,
    saleForm,
    setSaleForms,
    hasCompanyProfiles,
    setActiveTab,
    setShowCompanyModal,
    handleCreateSale,
    dashboard,
    lotReturnForm,
    setLotReturnForms,
    handleLotReturn,
    lotReturnEstimatedAmount,
    lotReturns,
    onBack,
    handleDeleteLot,
  } = ctx;

  const [activeSubPage, setActiveSubPage] = useState(null);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  let content = null;

  if (activeSubPage === 'quality') {
    content = (
      <InventoryLotQualityPage
        ctx={{
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
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'sales') {
    content = (
      <InventoryLotSalesPage
        ctx={{
          lot,
          t,
          text,
          lang,
          formatCurrency,
          formatWeightDisplay,
          formatDateDisplay,
          Input,
          Button,
          saleForm,
          setSaleForms,
          hasCompanyProfiles,
          setActiveTab,
          setShowCompanyModal,
          handleCreateSale,
          dashboard,
          submittingKey,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'return') {
    content = (
      <InventoryLotReturnPage
        ctx={{
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
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'return-records') {
    content = (
      <InventoryLotReturnRecordsPage
        ctx={{
          text,
          lang,
          lot,
          lotReturns,
          formatDateDisplay,
          formatWeightDisplay,
          formatCurrency,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else {
    content = (
      <section className="space-y-4 sm:space-y-6">
        <div className="rounded-[1.45rem] border border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/85 p-3.5 shadow-sm sm:rounded-[1.7rem] sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                {text.detailBack || (lang === 'zh' ? '返回库存页' : 'Back to Inventory')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLot(lot.id)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-100 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>{text.deleteLot || (lang === 'zh' ? '删除批次' : 'Delete Lot')}</span>
              </button>
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tight text-zinc-900 sm:text-[22px]">{lot.product_name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm">
                  <span className="truncate">{lot.seller_name || text.noSellerLinked}</span>
                </span>
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 shadow-sm">
                  {formatDateDisplay(lot.purchase_date)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
            <SummaryCard
              label={text.bought}
              value={formatWeightDisplay(lot.bought_weight_tons)}
            />
            <SummaryCard
              label={text.sold}
              value={formatWeightDisplay(lot.sold_weight_tons)}
            />
            <SummaryCard
              label={text.remaining}
              value={formatWeightDisplay(lot.remaining_weight_tons)}
              tone="orange"
            />
            <SummaryCard
              label={t.totalCost}
              value={formatCurrency(lot.total_cost)}
              tone="emerald"
            />
          </div>
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          <ActionCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title={text.updateQuality || (lang === 'zh' ? '更新品质' : 'Update Quality')}
            subtitle={lang === 'zh' ? '进入下一页修改这批货的品质状态。' : 'Open a separate page to change the quality status.'}
            onClick={() => setActiveSubPage('quality')}
            tone="sky"
          />
          <ActionCard
            icon={<PackageCheck className="h-5 w-5" />}
            title={text.sellThisLot}
            subtitle={lang === 'zh' ? '进入销售页面，添加销售并查看销售记录。' : 'Open the sales page to add sales and review sales records.'}
            onClick={() => setActiveSubPage('sales')}
            tone="emerald"
          />
          <ActionCard
            icon={<ArrowRightLeft className="h-5 w-5" />}
            title={text.recordSellerReturn}
            subtitle={lang === 'zh' ? '进入退货页面，登记这批货的退货资料。' : 'Open the return page to record a product return.'}
            onClick={() => setActiveSubPage('return')}
            tone="orange"
          />
          <ActionCard
            icon={<PackageCheck className="h-5 w-5" />}
            title={lang === 'zh' ? '退货记录' : 'Return Records'}
            subtitle={lang === 'zh' ? '查看这批货全部退货记录。' : 'See all return records for this product lot.'}
            onClick={() => setActiveSubPage('return-records')}
            tone="zinc"
          />
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] isolate overflow-y-auto bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.55),transparent_34%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.45),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#f0fdf4_100%)]" />
      <div className="relative mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        {content}
      </div>
    </div>
  );
}
