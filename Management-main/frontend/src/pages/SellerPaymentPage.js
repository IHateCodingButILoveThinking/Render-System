import React from 'react';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';

export default function SellerPaymentPage({ ctx }) {
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
    formatCurrency,
    onBack,
  } = ctx;

  return (
    <section className="space-y-5">
      <div className="rounded-[1.6rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回客户详情' : 'Back to Customer Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900">{text.recordSellerPayment}</h2>
            <p className="mt-1 text-xs text-zinc-500">{seller.name} • {t.paid} {formatCurrency(seller.total_paid)}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t.amount}
            type="number"
            step="0.01"
            value={paymentForm.amount}
            onChange={(event) =>
              setSellerPaymentForms((current) => ({
                ...current,
                [seller.id]: { ...paymentForm, amount: event.target.value },
              }))
            }
          />
          <Select
            label={text.method}
            value={paymentForm.payment_method}
            onChange={(event) =>
              setSellerPaymentForms((current) => ({
                ...current,
                [seller.id]: { ...paymentForm, payment_method: event.target.value },
              }))
            }
            options={paymentMethodOptions}
          />
          <Input
            label={t.paymentDate}
            type="date"
            value={paymentForm.payment_date}
            onChange={(event) =>
              setSellerPaymentForms((current) => ({
                ...current,
                [seller.id]: { ...paymentForm, payment_date: event.target.value },
              }))
            }
          />
          <div className="flex items-end sm:col-span-2">
            <Button
              className="h-[48px] w-full sm:w-auto sm:px-6"
              variant="success"
              onClick={() => handleSellerPayment(seller)}
              disabled={submittingKey === `seller-payment-${seller.id}`}
            >
              {submittingKey === `seller-payment-${seller.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {text.savePayment}
            </Button>
          </div>
        </div>
        {paymentForm.payment_method === 'usd' ? (
          <p className="mt-3 text-xs text-zinc-500">{text.usdAutoConvertHint}</p>
        ) : null}
      </div>
    </section>
  );
}
