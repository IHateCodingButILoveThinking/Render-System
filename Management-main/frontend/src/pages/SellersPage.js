import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, Users } from 'lucide-react';
import SellerDetailPage from './SellerDetailPage';

function getCurrentDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function InfoRow({ label, value, tone = 'zinc' }) {
  const tones = {
    zinc: 'border-zinc-100 bg-zinc-50/70 text-zinc-700',
    red: 'border-red-100 bg-red-50/70 text-red-700',
    sky: 'border-sky-100 bg-sky-50/70 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
  };
  const labelTones = {
    zinc: 'text-zinc-400',
    red: 'text-red-500',
    sky: 'text-sky-500',
    emerald: 'text-emerald-500',
  };

  return (
    <div className={`rounded-[0.85rem] border px-2.5 py-1.5 ${tones[tone] || tones.zinc}`}>
      <div className="flex items-center gap-2">
        <p className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] ${labelTones[tone] || labelTones.zinc}`}>
          {label}
        </p>
        <p className="min-w-0 truncate text-[11px] font-semibold leading-4">{value}</p>
      </div>
    </div>
  );
}

function DetailButton({ lang, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-3 py-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
    >
      <span className="text-[11px] font-black text-zinc-900 sm:text-[12px]">
        {lang === 'zh' ? '查看详情' : 'View Details'}
      </span>
      <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm transition group-hover:translate-x-0.5">
        <ArrowRight className="h-2.5 w-2.5" />
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
  const [searchQuery, setSearchQuery] = useState('');
  const sellers = dashboard.sellers || [];
  const filteredSellers = useMemo(() => {
    const query = String(searchQuery || '').trim().toLowerCase();
    if (!query) return sellers;

    return sellers.filter((seller) =>
      [seller.name, seller.phone, seller.address]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [searchQuery, sellers]);

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
        <div className="flex items-center gap-2 overflow-hidden rounded-[1.15rem] border border-zinc-100 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setShowSellerModal(true)}
            className="shrink-0 rounded-[0.95rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-3 py-2 text-[11px] font-black text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm sm:text-[12px]"
          >
            {text.addSellerInfo || (lang === 'zh' ? '添加客户资料' : 'Add Customer Info')}
          </button>
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={lang === 'zh' ? '搜索客户' : 'Search customers'}
              className="h-9 w-full rounded-[0.95rem] border border-zinc-200 bg-zinc-50/80 pl-9 pr-3 text-[12px] font-medium text-zinc-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100/60"
            />
          </label>
        </div>

        {sellers.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-black text-zinc-900">
              {text.noSellersYet || (lang === 'zh' ? '还没有客户资料' : 'No customers yet')}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {text.addSellerInfo || (lang === 'zh' ? '先添加客户资料，再开始新增进货批次。' : 'Add customer info first, then create purchase lots.')}
            </p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="rounded-[1.6rem] border border-zinc-100 bg-white px-5 py-10 text-center shadow-sm">
            <p className="text-base font-black text-zinc-900">
              {lang === 'zh' ? '没有找到匹配的客户' : 'No matching customers'}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {lang === 'zh' ? '试试名字、电话或地点关键词。' : 'Try a name, phone, or location keyword.'}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-3.5">
            {filteredSellers.map((seller) => (
              <article
                key={seller.id}
                className={`rounded-[1.25rem] border p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  seller.bad_quality
                    ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                    : 'border-zinc-100 bg-gradient-to-br from-white via-white to-emerald-50/45'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-[14px] font-black tracking-tight text-zinc-900 sm:text-[15px]">
                        {seller.name}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      <DetailButton
                        lang={lang}
                        onClick={() => setSelectedSellerId(seller.id)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <InfoRow
                      label={lang === 'zh' ? '电话' : 'Phone'}
                      value={seller.phone || text.noPhone}
                    />
                    <InfoRow
                      label={lang === 'zh' ? '地点' : 'Location'}
                      value={seller.address || text.noAddress}
                      tone="sky"
                    />
                    <InfoRow
                      label={lang === 'zh' ? '状态' : 'Status'}
                      value={seller.bad_quality ? text.qualityRisk : (lang === 'zh' ? '正常' : 'Normal')}
                      tone={seller.bad_quality ? 'red' : 'emerald'}
                    />
                  </div>
                </div>
              </article>
            ))}
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
