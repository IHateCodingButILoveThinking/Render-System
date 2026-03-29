import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Building2,
  Phone,
  ScrollText,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import CompanyDetailPage from './CompanyDetailPage';

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
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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
      className="group inline-flex w-full items-center gap-3 rounded-[1.25rem] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
        <Building2 className="h-4 w-4" />
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
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </span>
    </button>
  );
}

export default function CompaniesPage({ ctx }) {
  const {
    text,
    lang,
    t,
    dashboard,
    companyPaymentForms,
    setCompanyPaymentForms,
    formatCurrency,
    setShowCompanyModal,
    SetupActionCard,
    Input,
    Select,
    Button,
    PaymentRecordRow,
    paymentMethodOptions,
    submittingKey,
    handleCompanyPayment,
    handleToggleCompanyCredit,
    handleDeleteCompany,
    formatWeightDisplay,
    formatDateDisplay,
  } = ctx;

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const companies = dashboard.companies || [];

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  const selectedPaymentForm = selectedCompany
    ? companyPaymentForms[selectedCompany.id] || {
        amount: '',
        payment_method: 'wechat_pay',
        payment_date: getCurrentDateInputValue(),
        note: '',
      }
    : null;

  return (
    <>
      <section className="space-y-4 sm:space-y-6">
        <SetupActionCard
          icon={<Building2 className="h-5 w-5" />}
          buttonLabel={text.addCompanyInfo || (lang === 'zh' ? '添加公司资料' : 'Add Company Info')}
          buttonIcon={<Building2 className="h-3.5 w-3.5" />}
          badgeLabel={lang === 'zh' ? '快捷操作' : 'Quick Setup'}
          onClick={() => setShowCompanyModal(true)}
          tone="blue"
          compact
        />

        {companies.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-black text-zinc-900">{text.noCompaniesYet || (lang === 'zh' ? '还没有公司资料' : 'No companies yet')}</h3>
            <p className="mt-2 text-sm text-zinc-500">{text.addCompanyInfo || (lang === 'zh' ? '先添加公司资料，再开始记录销售与收款。' : 'Add company info first, then record sales and payments.')}</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {companies.map((company) => {
              const companySales = company.sales || [];
              const balanceOwed = Number(company.balance_owed || 0);
              const salesCount = companySales.length;

              return (
                <article
                  key={company.id}
                  className={`rounded-[2rem] border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                    company.bad_credit
                      ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                      : 'border-zinc-100 bg-gradient-to-br from-white via-white to-sky-50/60'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-sky-100 via-white to-emerald-100 shadow-sm">
                    <Building2 className="h-5 w-5 text-sky-700" />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-black tracking-tight text-zinc-900">{company.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MetaPill
                          icon={<UserRound className="h-3.5 w-3.5" />}
                          label={company.contact_person || text.noContactPerson}
                        />
                        <MetaPill
                          icon={<Phone className="h-3.5 w-3.5" />}
                          label={company.phone || text.noPhone}
                          tone="blue"
                        />
                      </div>
                      {company.address ? (
                        <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{company.address}</p>
                      ) : null}
                    </div>
                    {company.bad_credit ? (
                      <MetaPill
                        icon={<ShieldAlert className="h-3.5 w-3.5" />}
                        label={text.companyHasBadCredit}
                        tone="red"
                      />
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MetricCard
                      label={t.balanceOwed}
                      value={formatCurrency(company.balance_owed)}
                      tone={balanceOwed > 0 ? 'orange' : 'zinc'}
                    />
                    <MetricCard
                      label={text.soldValue}
                      value={formatCurrency(company.total_sold_value)}
                      tone="sky"
                    />
                    <MetricCard
                      label={text.received}
                      value={formatCurrency(company.total_received)}
                      tone="emerald"
                    />
                    <MetricCard
                      label={text.sales}
                      value={`${salesCount} ${text.recordCountUnit || (lang === 'zh' ? '笔' : '')}`.trim()}
                      tone="zinc"
                    />
                  </div>

                  <div className="mt-4">
                    <DetailButton
                      lang={lang}
                      onClick={() => setSelectedCompanyId(company.id)}
                      count={salesCount}
                      label={lang === 'zh' ? '公司' : 'company'}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedCompany ? (
        <CompanyDetailPage
          ctx={{
            company: selectedCompany,
            text,
            lang,
            t,
            paymentForm: selectedPaymentForm,
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
            onBack: () => setSelectedCompanyId(null),
          }}
        />
      ) : null}
    </>
  );
}
