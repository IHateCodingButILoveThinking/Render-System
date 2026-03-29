import React from 'react';
import { ArrowLeft, ReceiptText } from 'lucide-react';

export default function CompanyPaymentRecordsPage({ ctx }) {
  const {
    text,
    lang,
    company,
    companyPayments,
    PaymentRecordRow,
    onBack,
  } = ctx;

  return (
    <section className="space-y-5">
      <div className="rounded-[1.6rem] border border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回公司详情' : 'Back to Company Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <ReceiptText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900">{lang === 'zh' ? '收款记录' : 'Payment Records'}</h2>
            <p className="mt-1 text-xs text-zinc-500">{company.name} • {companyPayments.length} {text.recordCountUnit || (lang === 'zh' ? '笔' : 'records')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-2">
          {companyPayments.length === 0 ? (
            <p className="text-sm text-zinc-400">{text.noPaymentRecords}</p>
          ) : (
            companyPayments.map((payment) => (
              <PaymentRecordRow
                key={payment.id}
                amount={payment.amount}
                method={payment.payment_method}
                date={payment.created_at || payment.payment_date}
                detail={payment.sale_label}
                lang={lang}
                tone="emerald"
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
