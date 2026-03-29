import React from 'react';
import { AlertCircle, ArrowLeft, Loader2, ShieldAlert, Trash2 } from 'lucide-react';

export default function CompanyStatusPage({ ctx }) {
  const {
    company,
    text,
    lang,
    Button,
    submittingKey,
    handleToggleCompanyCredit,
    handleDeleteCompany,
    onBack,
  } = ctx;

  return (
    <section className="space-y-5">
      <div className="rounded-[1.6rem] border border-zinc-100 bg-gradient-to-br from-orange-50 via-white to-white p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回公司详情' : 'Back to Company Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900">{lang === 'zh' ? '公司状态管理' : 'Company Status Management'}</h2>
            <p className="mt-1 text-xs text-zinc-500">{company.name}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-zinc-500">
          {lang === 'zh' ? '在这里管理坏账状态，或删除这家公司资料。' : 'Manage bad-credit status or delete this company here.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant={company.bad_credit ? 'secondary' : 'outline'}
            onClick={() => handleToggleCompanyCredit(company)}
            disabled={submittingKey === `company-credit-${company.id}`}
            className="w-full sm:w-auto"
          >
            {submittingKey === `company-credit-${company.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            {company.bad_credit ? text.clearBadCredit : text.markBadCredit}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleDeleteCompany(company)}
            disabled={submittingKey === `company-delete-${company.id}`}
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
          >
            {submittingKey === `company-delete-${company.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {text.deleteCompany}
          </Button>
        </div>
      </div>
    </section>
  );
}
