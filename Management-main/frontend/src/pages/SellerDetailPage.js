import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ReceiptText,
  ScrollText,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import SellerPaymentPage from './SellerPaymentPage';
import SellerPurchaseRecordsPage from './SellerPurchaseRecordsPage';
import SellerStatusPage from './SellerStatusPage';

function ActionButton({ icon, title, subtitle, onClick, tone = 'emerald' }) {
  const tones = {
    emerald: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50/90',
    sky: 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50/90',
    zinc: 'border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-slate-50/90',
  };
  const iconTones = {
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[1.35rem] border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${tones[tone] || tones.emerald}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] ${iconTones[tone] || iconTones.emerald}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-black tracking-tight text-zinc-900 sm:text-sm">{title}</h3>
            <p className="mt-0.5 text-[11px] leading-5 text-zinc-500 sm:text-xs">{subtitle}</p>
          </div>
        </div>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/85 text-zinc-500 shadow-sm transition group-hover:translate-x-0.5">
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
    sky: 'border-sky-100 bg-sky-50/90 text-sky-800',
  };
  const labelTones = {
    zinc: 'text-zinc-400',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
    sky: 'text-sky-600',
  };

  return (
    <div className={`rounded-[1.15rem] border px-3 py-3 shadow-sm ${tones[tone] || tones.zinc}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${labelTones[tone] || labelTones.zinc}`}>
        {label}
      </p>
      <p className="mt-1.5 text-sm font-black sm:text-[15px]">{value}</p>
    </div>
  );
}

export default function SellerDetailPage({ ctx }) {
  const {
    seller,
    text,
    lang,
    t,
    paymentForm,
    setSellerPaymentForms,
    Input,
    Select,
    Button,
    paymentMethodOptions,
    submittingKey,
    handleSellerPayment,
    handleToggleSellerQuality,
    handleDeleteSeller,
    formatCurrency,
    formatWeightDisplay,
    formatDateDisplay,
    onBack,
  } = ctx;

  const [activeSubPage, setActiveSubPage] = useState(null);
  const sellerLots = useMemo(() => seller.lots || [], [seller.lots]);

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

  if (activeSubPage === 'payment-form') {
    content = (
      <SellerPaymentPage
        ctx={{
          seller,
          text,
          lang,
          t,
          paymentForm,
          setSellerPaymentForms,
          Input,
          Select,
          Button,
          paymentMethodOptions,
          submittingKey,
          handleSellerPayment,
          formatCurrency,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'purchase-records') {
    content = (
      <SellerPurchaseRecordsPage
        ctx={{
          seller,
          text,
          lang,
          sellerLots,
          formatDateDisplay,
          formatWeightDisplay,
          formatCurrency,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'status') {
    content = (
      <SellerStatusPage
        ctx={{
          seller,
          text,
          lang,
          Button,
          submittingKey,
          handleToggleSellerQuality,
          handleDeleteSeller,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else {
    content = (
      <section className="space-y-5">
        <div className="rounded-[1.7rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                {lang === 'zh' ? '返回客户页' : 'Back to Customers'}
              </button>
              <h2 className="mt-3 break-words text-lg font-black tracking-tight text-zinc-900 sm:text-[22px]">
                {seller.name}
              </h2>
              <p className="mt-1 break-words text-[11px] text-zinc-500 sm:text-xs">
                {seller.phone || text.noPhone} • {seller.address || text.noAddress}
              </p>
            </div>
            {seller.bad_quality ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                {text.qualityRisk}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <SummaryCard
              label={text.bought}
              value={formatCurrency(seller.total_bought_cost)}
              tone="sky"
            />
            <SummaryCard
              label={t.paid}
              value={formatCurrency(seller.total_paid)}
              tone="emerald"
            />
            <SummaryCard
              label={text.returnAmount}
              value={formatCurrency(seller.total_returned_amount)}
              tone="sky"
            />
            <SummaryCard
              label={text.oweSeller || text.balance}
              value={formatCurrency(seller.balance_owed)}
              tone={Number(seller.balance_owed) > 0 ? 'orange' : 'zinc'}
            />
          </div>
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          <ActionButton
            icon={<Wallet className="h-5 w-5" />}
            title={text.recordSellerPayment}
            subtitle={lang === 'zh' ? '进入独立页面登记付款。' : 'Open a dedicated page to record payment.'}
            onClick={() => setActiveSubPage('payment-form')}
            tone="emerald"
          />
          <ActionButton
            icon={<ScrollText className="h-5 w-5" />}
            title={text.purchaseRecords}
            subtitle={
              lang === 'zh'
                ? `查看 ${sellerLots.length} 个关联批次。`
                : `Open ${sellerLots.length} linked purchase lots.`
            }
            onClick={() => setActiveSubPage('purchase-records')}
            tone="sky"
          />
          <ActionButton
            icon={<ReceiptText className="h-5 w-5" />}
            title={lang === 'zh' ? '客户状态' : 'Customer Status'}
            subtitle={lang === 'zh' ? '进入状态页面管理品质与删除操作。' : 'Open status tools and delete actions.'}
            onClick={() => setActiveSubPage('status')}
            tone="zinc"
          />
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-[220] isolate overflow-y-auto bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.45),transparent_32%),radial-gradient(circle_at_top_right,rgba(186,230,253,0.45),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ecfdf5_100%)]" />
      <section className="relative mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        {content}
      </section>
    </div>
  );
}
