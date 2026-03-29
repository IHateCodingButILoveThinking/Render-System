import React, { useState } from 'react';
import {
  BusFront,
  Calculator,
  ChevronRight,
  CircleDollarSign,
  Droplets,
  Loader2,
  ReceiptText,
  Save,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
  Zap,
  Palmtree,
} from 'lucide-react';
import CostRecordsPage from './CostRecordsPage';

export default function CostsPage({ ctx }) {
  const {
    text,
    t,
    lang,
    operationalCostForm,
    setOperationalCostForm,
    handleCreateOperationalCost,
    operationalCostTypeSuggestions,
    isOperationalCostQuantityMode,
    operationalCostComputedAmount,
    formatCurrency,
    submittingKey,
    dashboard,
    Input,
    Button,
    QuickChoicePills,
    formatDateDisplay,
  } = ctx;
  const [showRecordsPage, setShowRecordsPage] = useState(false);

  const quickPickItems = [
    {
      value: lang === 'zh' ? '运费' : 'Delivery fee',
      label: lang === 'zh' ? '运费' : 'Delivery fee',
      icon: <Truck className="h-3 w-3" />,
      className: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100',
      activeClassName: 'border-sky-600 bg-sky-600 text-white',
    },
    {
      value: t?.categoryLabour || 'Labour',
      label: t?.categoryLabour || 'Labour',
      icon: <Users className="h-3 w-3" />,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',
      activeClassName: 'border-emerald-600 bg-emerald-600 text-white',
    },
    {
      value: lang === 'zh' ? '装卸费' : 'Loading fee',
      label: lang === 'zh' ? '装卸费' : 'Loading fee',
      icon: <Wrench className="h-3 w-3" />,
      className: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100',
      activeClassName: 'border-amber-600 bg-amber-600 text-white',
    },
    {
      value: lang === 'zh' ? '水费' : 'Water bill',
      label: lang === 'zh' ? '水费' : 'Water bill',
      icon: <Droplets className="h-3 w-3" />,
      className: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100',
      activeClassName: 'border-cyan-600 bg-cyan-600 text-white',
    },
    {
      value: lang === 'zh' ? '电费' : 'Electricity bill',
      label: lang === 'zh' ? '电费' : 'Electricity bill',
      icon: <Zap className="h-3 w-3" />,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-yellow-300 hover:bg-yellow-100',
      activeClassName: 'border-yellow-500 bg-yellow-500 text-white',
    },
    {
      value: lang === 'zh' ? '公共交通' : 'Public transport',
      label: lang === 'zh' ? '公共交通' : 'Public transport',
      icon: <BusFront className="h-3 w-3" />,
      className: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100',
      activeClassName: 'border-indigo-600 bg-indigo-600 text-white',
    },
    {
      value: lang === 'zh' ? '旅游' : 'Leisure outing',
      label: lang === 'zh' ? '旅游' : 'Leisure outing',
      icon: <Palmtree className="h-3 w-3" />,
      className: 'border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300 hover:bg-pink-100',
      activeClassName: 'border-pink-600 bg-pink-600 text-white',
    },
    {
      value: lang === 'zh' ? '购物' : 'Shopping',
      label: lang === 'zh' ? '购物' : 'Shopping',
      icon: <ShoppingBag className="h-3 w-3" />,
      className: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100',
      activeClassName: 'border-violet-600 bg-violet-600 text-white',
    },
  ];

  if (showRecordsPage) {
    return (
      <CostRecordsPage
        ctx={{
          ...ctx,
          onBack: () => setShowRecordsPage(false),
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight">{text.operationalCosts}</h2>
            <p className="mt-1 text-sm text-zinc-400">{text.operationalCostSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowRecordsPage(true)}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm">
              <ReceiptText className="h-3.5 w-3.5" />
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span>
                {text.operationalCostRecordsTitle || (lang === 'zh' ? '花销记录' : 'Cost Records')}
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] text-zinc-600 shadow-sm">
                {(dashboard.operationalCosts || []).length}
              </span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
        </div>

        <form onSubmit={handleCreateOperationalCost} className="mt-5 space-y-4">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-sky-50/40 p-4 shadow-sm">
            <div className="space-y-3">
              <Input
                label={text.costType}
                value={operationalCostForm.cost_type}
                placeholder={text.costTypePlaceholder}
                onChange={(event) => setOperationalCostForm((current) => ({ ...current, cost_type: event.target.value }))}
              />
              <QuickChoicePills
                title={lang === 'zh' ? '快速选择' : 'Quick pick'}
                items={quickPickItems}
                activeValue={operationalCostForm.cost_type}
                onSelect={(value) => setOperationalCostForm((current) => ({ ...current, cost_type: value }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {text.calcMode}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOperationalCostForm((current) => ({
                      ...current,
                      calc_mode: 'amount',
                    }))
                  }
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    operationalCostForm.calc_mode === 'amount'
                      ? 'border-sky-300 bg-white shadow-sm'
                      : 'border-zinc-200 bg-white/70 hover:border-zinc-300 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                      operationalCostForm.calc_mode === 'amount'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      <CircleDollarSign className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-zinc-900">
                        {t.calcByAmount || 'Direct amount'}
                      </span>
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOperationalCostForm((current) => ({
                      ...current,
                      calc_mode: 'quantity',
                    }))
                  }
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    operationalCostForm.calc_mode === 'quantity'
                      ? 'border-emerald-300 bg-white shadow-sm'
                      : 'border-zinc-200 bg-white/70 hover:border-zinc-300 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                      operationalCostForm.calc_mode === 'quantity'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      <Calculator className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-zinc-900">
                        {t.calcByQuantity || 'Quantity × unit cost'}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {lang === 'zh' ? '用数量和单价自动计算' : 'Auto-calculate from quantity and unit cost'}
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
            <Input
              label={text.costDate}
              type="date"
              value={operationalCostForm.cost_date}
              onChange={(event) => setOperationalCostForm((current) => ({ ...current, cost_date: event.target.value }))}
            />
          </div>

          {isOperationalCostQuantityMode ? (
            <div className="space-y-3">
              <Input
                label={text.quantityLabel}
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                value={operationalCostForm.quantity}
                onChange={(event) => setOperationalCostForm((current) => ({ ...current, quantity: event.target.value }))}
              />
              <Input
                label={text.unitCostLabel}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={operationalCostForm.unit_cost}
                onChange={(event) => setOperationalCostForm((current) => ({ ...current, unit_cost: event.target.value }))}
              />
              <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{text.calculatedAmount}</p>
                <p className="mt-1 text-sm font-black text-emerald-800">{formatCurrency(operationalCostComputedAmount)}</p>
              </div>
            </div>
          ) : (
            <Input
              label={t.amount}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={operationalCostForm.amount}
              onChange={(event) => setOperationalCostForm((current) => ({ ...current, amount: event.target.value }))}
            />
          )}

          <Input
            label={text.costNote}
            value={operationalCostForm.note}
            onChange={(event) => setOperationalCostForm((current) => ({ ...current, note: event.target.value }))}
          />

          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto sm:px-6" disabled={submittingKey === 'operational-cost'}>
              {submittingKey === 'operational-cost' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {text.saveOperationalCost}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
