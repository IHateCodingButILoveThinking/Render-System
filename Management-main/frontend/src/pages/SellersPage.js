import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleDollarSign,
  MapPin,
  RotateCcw,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react';
import SellerDetailPage from './SellerDetailPage';

function getCurrentDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function MetaPill({ icon, label, tone = 'zinc' }) {
  const tones = {
    zinc: 'border-zinc-200 bg-zinc-50 text-zinc-600',
    red: 'border-red-200 bg-red-50 text-red-600',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.zinc}`}>
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function MetricCard({ label, value, tone = 'zinc' }) {
  const tones = {
    zinc: 'border-zinc-100 bg-zinc-50/80 text-zinc-900',
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

function DetailButton({ lang, onClick, count, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex w-full items-center gap-3 rounded-[1.25rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
        <Users className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-zinc-900">
          {lang === 'zh' ? '查看详情' : 'View Details'}
        </span>
        <span className="mt-0.5 block text-xs text-zinc-500">
          {lang === 'zh' ? `进入${label}独立页面` : `Open the ${label} page`}
        </span>
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-zinc-500 shadow-sm">
          {count}
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </span>
    </button>
  );
}

export default function SellersPage({ ctx }) {
  const {
    text,
    lang,
    t,
    dashboard,
    sellerPaymentForms,
    setSellerPaymentForms,
    formatCurrency,
    setShowSellerModal,
    SetupActionCard,
    Input,
    Select,
    Button,
    paymentMethodOptions,
    submittingKey,
    handleSellerPayment,
    handleToggleSellerQuality,
    handleDeleteSeller,
    formatWeightDisplay,
    formatDateDisplay,
  } = ctx;

  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const sellers = dashboard.sellers || [];

  const selectedSeller = useMemo(
    () => sellers.find((seller) => seller.id === selectedSellerId) || null,
    [sellers, selectedSellerId]
  );

  const selectedPaymentForm = selectedSeller
    ? sellerPaymentForms[selectedSeller.id] || {
        amount: '',
        payment_method: 'cash',
        payment_date: getCurrentDateInputValue(),
        note: '',
      }
    : null;

  return (
    <>
      <section className="space-y-4 sm:space-y-6">
        <SetupActionCard
          icon={<Users className="h-5 w-5" />}
          buttonLabel={text.addSellerInfo || (lang === 'zh' ? '添加客户资料' : 'Add Customer Info')}
          buttonIcon={<Users className="h-3.5 w-3.5" />}
          badgeLabel={lang === 'zh' ? '快捷操作' : 'Quick Setup'}
          onClick={() => setShowSellerModal(true)}
          tone="emerald"
          compact
        />

        {sellers.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-black text-zinc-900">{text.noSellersYet || (lang === 'zh' ? '还没有客户资料' : 'No customers yet')}</h3>
            <p className="mt-2 text-sm text-zinc-500">{text.addSellerInfo || (lang === 'zh' ? '先添加客户资料，再开始新增进货批次。' : 'Add customer info first, then create purchase lots.')}</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {sellers.map((seller) => {
              const sellerLots = seller.lots || [];
              const balanceOwed = Number(seller.balance_owed || 0);
              const returnCount = Number(seller.return_count || 0);

              return (
                <article
                  key={seller.id}
                  className={`rounded-[2rem] border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                    seller.bad_quality
                      ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                      : 'border-zinc-100 bg-gradient-to-br from-white via-white to-emerald-50/60'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-100 via-white to-sky-100 shadow-sm">
                    <Users className="h-5 w-5 text-emerald-700" />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-black tracking-tight text-zinc-900">{seller.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MetaPill
                          icon={<Wallet className="h-3.5 w-3.5" />}
                          label={seller.phone || text.noPhone}
                        />
                        <MetaPill
                          icon={<MapPin className="h-3.5 w-3.5" />}
                          label={seller.address || text.noAddress}
                          tone="sky"
                        />
                      </div>
                    </div>
                    {seller.bad_quality ? (
                      <MetaPill
                        icon={<ShieldAlert className="h-3.5 w-3.5" />}
                        label={text.qualityRisk}
                        tone="red"
                      />
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MetricCard
                      label={text.oweSeller || text.balance}
                      value={formatCurrency(seller.balance_owed)}
                      tone={balanceOwed > 0 ? 'orange' : 'zinc'}
                    />
                    <MetricCard
                      label={t.paid}
                      value={formatCurrency(seller.total_paid)}
                      tone="emerald"
                    />
                    <MetricCard
                      label={text.returnCount}
                      value={`${returnCount} ${text.recordCountUnit || (lang === 'zh' ? '笔' : '')}`.trim()}
                      tone="sky"
                    />
                    <MetricCard
                      label={text.analyticsLots}
                      value={`${sellerLots.length} ${text.recordCountUnit || (lang === 'zh' ? '笔' : '')}`.trim()}
                      tone="zinc"
                    />
                  </div>

                  <div className="mt-4">
                    <DetailButton
                      lang={lang}
                      onClick={() => setSelectedSellerId(seller.id)}
                      count={sellerLots.length}
                      label={lang === 'zh' ? '客户' : 'customer'}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedSeller ? (
        <SellerDetailPage
          ctx={{
            seller: selectedSeller,
            text,
            lang,
            t,
            paymentForm: selectedPaymentForm,
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
            onBack: () => setSelectedSellerId(null),
          }}
        />
      ) : null}
    </>
  );
}
