import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ReceiptText,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import CompanyPaymentPage from './CompanyPaymentPage';
import CompanyPaymentRecordsPage from './CompanyPaymentRecordsPage';
import CompanySalesRecordsPage from './CompanySalesRecordsPage';
import CompanyStatusPage from './CompanyStatusPage';

function ActionButton({ icon, title, subtitle, onClick, tone = 'sky' }) {
  const tones = {
    sky: 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50/90',
    emerald: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50/90',
    zinc: 'border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-slate-50/90',
    orange: 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50/90',
  };
  const iconTones = {
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    zinc: 'bg-zinc-100 text-zinc-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[1.35rem] border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${tones[tone] || tones.sky}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] ${iconTones[tone] || iconTones.sky}`}>
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

export default function CompanyDetailPage({ ctx }) {
  const {
    company,
    text,
    lang,
    t,
    paymentForm,
    setCompanyPaymentForms,
    Input,
    Select,
    Button,
    paymentMethodOptions,
    submittingKey,
    handleCompanyPayment,
    handleToggleCompanyCredit,
    handleDeleteCompany,
    formatCurrency,
    formatWeightDisplay,
    formatDateDisplay,
    PaymentRecordRow,
    onBack,
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

  const companySales = useMemo(() => company.sales || [], [company.sales]);
  const companyPayments = useMemo(
    () =>
      companySales
        .flatMap((sale) =>
          (sale.payments || []).map((payment) => ({
            ...payment,
            sale_label: sale.lot_product_name,
          }))
        )
        .sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at)),
    [companySales]
  );

  let content = null;

  if (activeSubPage === 'payment-form') {
    content = (
      <CompanyPaymentPage
        ctx={{
          company,
          text,
          lang,
          t,
          paymentForm,
          setCompanyPaymentForms,
          Input,
          Select,
          Button,
          paymentMethodOptions,
          submittingKey,
          handleCompanyPayment,
          formatCurrency,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'payment-records') {
    content = (
      <CompanyPaymentRecordsPage
        ctx={{
          text,
          lang,
          company,
          companyPayments,
          PaymentRecordRow,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'sales-records') {
    content = (
      <CompanySalesRecordsPage
        ctx={{
          text,
          lang,
          company,
          companySales,
          formatDateDisplay,
          formatWeightDisplay,
          formatCurrency,
          t,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else if (activeSubPage === 'status') {
    content = (
      <CompanyStatusPage
        ctx={{
          company,
          text,
          lang,
          Button,
          submittingKey,
          handleToggleCompanyCredit,
          handleDeleteCompany,
          onBack: () => setActiveSubPage(null),
        }}
      />
    );
  } else {
    content = (
      <section className="space-y-5">
        <div
          className={`rounded-[1.7rem] border p-4 shadow-sm sm:p-5 ${
            company.bad_credit
              ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
              : 'border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-white'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                {lang === 'zh' ? '返回公司页' : 'Back to Companies'}
              </button>
              <h2 className="mt-3 break-words text-lg font-black tracking-tight text-zinc-900 sm:text-[22px]">
                {company.name}
              </h2>
              <p className="mt-1 break-words text-[11px] text-zinc-500 sm:text-xs">
                {company.contact_person || text.noContactPerson} • {company.phone || text.noPhone}
              </p>
              {company.address ? (
                <p className="mt-1 break-words text-[11px] text-zinc-400 sm:text-xs">{company.address}</p>
              ) : null}
            </div>
            {company.bad_credit ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                {text.companyHasBadCredit}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <SummaryCard
              label={text.companyProcessingCost || (lang === 'zh' ? '原料+加工成本' : 'Material + Process Cost')}
              value={formatCurrency(company.total_bought_cost)}
              tone="sky"
            />
            <SummaryCard
              label={text.soldValue}
              value={formatCurrency(company.total_sold_value)}
            />
            <SummaryCard
              label={text.received}
              value={formatCurrency(company.total_received)}
              tone="emerald"
            />
            <SummaryCard
              label={t.balanceOwed}
              value={formatCurrency(company.balance_owed)}
              tone={Number(company.balance_owed) > 0 ? 'orange' : 'zinc'}
            />
          </div>
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          <ActionButton
            icon={<Banknote className="h-5 w-5" />}
            title={text.recordReceivedPayment}
            subtitle={lang === 'zh' ? '进入独立页面登记收款。' : 'Open a dedicated page to record payment.'}
            onClick={() => setActiveSubPage('payment-form')}
            tone="emerald"
          />
          <ActionButton
            icon={<ReceiptText className="h-5 w-5" />}
            title={lang === 'zh' ? '收款记录' : 'Payment Records'}
            subtitle={
              lang === 'zh'
                ? `查看 ${companyPayments.length} 条收款记录。`
                : `Review ${companyPayments.length} payment records.`
            }
            onClick={() => setActiveSubPage('payment-records')}
            tone="sky"
          />
          <ActionButton
            icon={<ScrollText className="h-5 w-5" />}
            title={text.salesHistoryTitle}
            subtitle={
              lang === 'zh'
                ? `查看 ${companySales.length} 条销售记录。`
                : `Open ${companySales.length} sales records.`
            }
            onClick={() => setActiveSubPage('sales-records')}
            tone="zinc"
          />
          <ActionButton
            icon={<ShieldAlert className="h-5 w-5" />}
            title={lang === 'zh' ? '公司状态' : 'Company Status'}
            subtitle={lang === 'zh' ? '进入状态页面管理风险与删除操作。' : 'Open status tools and delete actions.'}
            onClick={() => setActiveSubPage('status')}
            tone="orange"
          />
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-[220] isolate overflow-y-auto bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.55),transparent_34%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.42),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#eff6ff_100%)]" />
      <section className="relative mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        {content}
      </section>
    </div>
  );
}
