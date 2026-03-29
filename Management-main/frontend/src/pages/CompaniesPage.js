import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  MapPin,
  Phone,
  Search,
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
  };

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.zinc}`}>
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function DetailButton({ lang, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-3.5 py-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
    >
      <span className="text-[12px] font-black text-zinc-900 sm:text-[13px]">
        {lang === 'zh' ? '查看详情' : 'View Details'}
      </span>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm transition group-hover:translate-x-0.5">
        <ArrowRight className="h-3 w-3" />
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
  const [searchQuery, setSearchQuery] = useState('');
  const companies = dashboard.companies || [];
  const filteredCompanies = useMemo(() => {
    const query = String(searchQuery || '').trim().toLowerCase();
    if (!query) return companies;

    return companies.filter((company) =>
      [company.name, company.contact_person, company.phone, company.address]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [companies, searchQuery]);

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
        <div className="flex items-center gap-2 overflow-hidden rounded-[1.15rem] border border-zinc-100 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setShowCompanyModal(true)}
            className="shrink-0 rounded-[0.95rem] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-3 py-2 text-[11px] font-black text-sky-900 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm sm:text-[12px]"
          >
            {text.addCompanyInfo || (lang === 'zh' ? '添加公司资料' : 'Add Company Info')}
          </button>
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={lang === 'zh' ? '搜索公司' : 'Search companies'}
              className="h-9 w-full rounded-[0.95rem] border border-zinc-200 bg-zinc-50/80 pl-9 pr-3 text-[12px] font-medium text-zinc-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100/60"
            />
          </label>
        </div>

        {companies.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-black text-zinc-900">
              {text.noCompaniesYet || (lang === 'zh' ? '还没有公司资料' : 'No companies yet')}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {text.addCompanyInfo || (lang === 'zh' ? '先添加公司资料，再开始记录销售与收款。' : 'Add company info first, then record sales and payments.')}
            </p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="rounded-[1.6rem] border border-zinc-100 bg-white px-5 py-10 text-center shadow-sm">
            <p className="text-base font-black text-zinc-900">
              {lang === 'zh' ? '没有找到匹配的公司' : 'No matching companies'}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {lang === 'zh' ? '试试公司名、联系人、电话或地点关键词。' : 'Try a company, contact, phone, or location keyword.'}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-3.5">
            {filteredCompanies.map((company) => (
              <article
                key={company.id}
                className={`rounded-[1.75rem] border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  company.bad_credit
                    ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                    : 'border-zinc-100 bg-gradient-to-br from-white via-white to-sky-50/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] bg-gradient-to-br from-sky-100 via-white to-emerald-100 shadow-sm">
                        <Building2 className="h-5 w-5 text-sky-700" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-black tracking-tight text-zinc-900 sm:text-[17px]">
                          {company.name}
                        </h3>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <DetailButton
                        lang={lang}
                        onClick={() => setSelectedCompanyId(company.id)}
                      />
                    </div>
                  </div>

                  <div>
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
                      <MetaPill
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        label={company.address || text.noAddress}
                        tone="blue"
                      />
                      {company.bad_credit ? (
                        <MetaPill
                          icon={<ShieldAlert className="h-3.5 w-3.5" />}
                          label={text.companyHasBadCredit}
                          tone="red"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
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
