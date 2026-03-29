import React from 'react';

export default function SalesPage({ ctx }) {
  const {
    dashboard,
    text,
    t,
    formatCurrency,
    formatWeightDisplay,
    formatDateDisplay,
    formatPaymentAmountDisplay,
    PAYMENT_METHOD_LABELS,
    lang,
    EmptyState,
  } = ctx;

  return (
    <section className="space-y-4">
      <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-black tracking-tight">{text.salesHistoryTitle}</h2>
        <p className="mt-1 text-sm text-zinc-400">{text.salesHistorySubtitle}</p>
      </div>
      {dashboard.sales.length === 0 ? (
        <EmptyState title={text.noSalesYet} message={text.noSalesYetMessage} />
      ) : (
        <div className="space-y-3">
          {dashboard.sales.map((sale) => {
            const salePayments = sale.payments || [];
            return (
              <div key={sale.id} className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-black">{sale.lot_product_name}</h3>
                    <p className="break-words text-sm text-zinc-400">{sale.company_name} • {formatDateDisplay(sale.sale_date)}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-lg font-black">{formatCurrency(sale.sale_value)}</p>
                    <p className="text-xs text-zinc-400">{formatWeightDisplay(sale.sold_weight_tons)} • {t.summary} {formatCurrency(sale.profit)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {salePayments.map((payment) => (
                    <span key={payment.id} className="max-w-full break-words rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                      {formatDateDisplay(payment.payment_date)} • {PAYMENT_METHOD_LABELS[payment.payment_method]?.[lang]} • {formatPaymentAmountDisplay(payment.amount, payment.payment_method)}
                    </span>
                  ))}
                  {salePayments.length === 0 ? (
                    <span className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-xs font-semibold text-orange-500">
                      {text.paymentWaiting}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
