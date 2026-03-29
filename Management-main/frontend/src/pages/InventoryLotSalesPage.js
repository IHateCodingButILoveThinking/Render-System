import React from 'react';
import { AlertCircle, ArrowLeft, Building2, Loader2 } from 'lucide-react';

export default function InventoryLotSalesPage({ ctx }) {
  const {
    lot,
    t,
    text,
    lang,
    formatCurrency,
    formatWeightDisplay,
    formatDateDisplay,
    Input,
    Button,
    saleForm,
    setSaleForms,
    hasCompanyProfiles,
    setActiveTab,
    setShowCompanyModal,
    handleCreateSale,
    dashboard,
    submittingKey,
    onBack,
  } = ctx;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回产品详情' : 'Back to Product Detail'}
        </button>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-900">{text.sellThisLot}</h2>
        <p className="mt-1 text-sm text-zinc-500">{lot.product_name} • {text.oneLotManySales}</p>
      </div>

      <div className="rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
        {!hasCompanyProfiles ? (
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">{text.createCompanyFirst}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setActiveTab('companies');
                setShowCompanyModal(true);
              }}
              className="w-full sm:w-auto"
            >
              <Building2 className="w-4 h-4" />
              {text.addCompanyInfo || (lang === 'zh' ? '添加公司资料' : 'Add Company Info')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Input
              label={t.company}
              list={`company-options-${lot.id}`}
              value={saleForm.companyName}
              onChange={(event) =>
                setSaleForms((current) => ({
                  ...current,
                  [lot.id]: { ...saleForm, companyName: event.target.value },
                }))
              }
              placeholder={t.company}
            />
            <Input
              label={text.saleDate}
              type="date"
              value={saleForm.sale_date}
              onChange={(event) =>
                setSaleForms((current) => ({
                  ...current,
                  [lot.id]: { ...saleForm, sale_date: event.target.value },
                }))
              }
            />
            <Input
              label={text.weightSoldShort}
              type="number"
              step="0.001"
              value={saleForm.sold_weight_tons}
              onChange={(event) =>
                setSaleForms((current) => ({
                  ...current,
                  [lot.id]: { ...saleForm, sold_weight_tons: event.target.value },
                }))
              }
            />
            <Input
              label={t.pricePerTon}
              type="number"
              step="0.01"
              value={saleForm.price_per_ton}
              onChange={(event) =>
                setSaleForms((current) => ({
                  ...current,
                  [lot.id]: { ...saleForm, price_per_ton: event.target.value },
                }))
              }
            />
            <Input
              label={t.location}
              value={saleForm.location}
              onChange={(event) =>
                setSaleForms((current) => ({
                  ...current,
                  [lot.id]: { ...saleForm, location: event.target.value },
                }))
              }
            />
            <div className="flex items-end">
              <Button
                className="w-full h-[50px]"
                onClick={() => handleCreateSale(lot)}
                disabled={submittingKey === `sale-${lot.id}`}
              >
                {submittingKey === `sale-${lot.id}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {text.addSale}
              </Button>
            </div>
            <datalist id={`company-options-${lot.id}`}>
              {dashboard.companies.map((company) => (
                <option key={company.id} value={company.name} />
              ))}
            </datalist>
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.sales}</h3>
        <div className="mt-4 space-y-3">
          {lot.sales.length === 0 ? (
            <p className="text-sm text-zinc-400">{text.noSalesForLot}</p>
          ) : (
            lot.sales.map((sale) => (
              <div key={sale.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-bold text-zinc-900">{sale.company_name}</p>
                    <p className="break-words text-sm text-zinc-400">
                      {formatDateDisplay(sale.sale_date)} • {formatWeightDisplay(sale.sold_weight_tons)} • {t.pricePerTon} {formatCurrency(sale.price_per_ton)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-black text-zinc-900">{formatCurrency(sale.sale_value)}</p>
                    <p className={`text-xs font-bold ${sale.outstanding_amount > 0 ? 'text-orange-500' : 'text-emerald-600'}`}>
                      {text.outstanding} {formatCurrency(sale.outstanding_amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
