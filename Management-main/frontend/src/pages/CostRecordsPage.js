import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Funnel,
  Loader2,
  ReceiptText,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CostRecordsPage({ ctx }) {
  const {
    text,
    lang,
    dashboard,
    formatDateDisplay,
    formatCurrency,
    handleDeleteOperationalCost,
    refreshDashboard,
    Button,
  } = ctx;

  const [activeType, setActiveType] = useState('__all__');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const records = dashboard.operationalCosts || [];

  const categories = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(
        records
          .map((cost) => String(cost.cost_type || '').trim())
          .filter(Boolean)
      )
    );

    return [
      {
        key: '__all__',
        label: lang === 'zh' ? '全部' : 'All',
      },
      ...uniqueTypes.map((type) => ({
        key: type,
        label: type,
      })),
    ];
  }, [lang, records]);

  const filteredRecords = useMemo(() => {
    return records.filter((cost) => {
      if (activeType === '__all__') return true;
      return String(cost.cost_type || '').trim() === activeType;
    });
  }, [activeType, records]);

  const selectedCount = selectedIds.length;
  const deletingMultiple = deleteTargetIds.length > 1;

  function toggleRecordSelection(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleExitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  async function confirmDelete() {
    if (deleteTargetIds.length === 0) return;
    setDeleteBusy(true);

    try {
      for (const id of deleteTargetIds) {
        // Keep deletion flow predictable and avoid overloading the UI with parallel requests.
        // eslint-disable-next-line no-await-in-loop
        await handleDeleteOperationalCost(id, {
          silent: true,
          skipRefresh: true,
        });
      }
      await refreshDashboard();
      toast.success(text.operationalCostDeleted, {
        id: 'operational-cost-delete',
      });
      setSelectedIds((current) => current.filter((id) => !deleteTargetIds.includes(id)));
      setDeleteTargetIds([]);
      setSelectionMode(false);
    } catch (error) {
      toast.error(error.message, {
        id: 'operational-cost-delete-error',
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_34%,#f0fdf4_100%)]">
      <section className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={ctx.onBack}
                disabled={deleteBusy}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                {lang === 'zh' ? '返回日常开销' : 'Back to Daily Costs'}
              </button>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-900">
                {text.operationalCostRecordsTitle || (lang === 'zh' ? '花销记录' : 'Cost Records')}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {lang === 'zh'
                  ? '按项目分类查看全部记录，页面更清楚，也更方便查找。'
                  : 'Browse all cost records by category in one cleaner page.'}
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {lang === 'zh' ? '总记录' : 'Total Records'}
                </p>
                <p className="mt-1 text-xl font-black text-zinc-900">
                  {records.length}
                  <span className="ml-1 text-sm font-bold text-zinc-500">
                    {text.recordCountUnit || (lang === 'zh' ? '笔' : 'records')}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                {selectionMode ? (
                  <button
                    type="button"
                    onClick={handleExitSelectionMode}
                    disabled={deleteBusy}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    <X className="h-4 w-4" />
                    {lang === 'zh' ? '取消选择' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    disabled={deleteBusy}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {lang === 'zh' ? '选择删除' : 'Select'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <Funnel className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
                  {lang === 'zh' ? '分类筛选' : 'Category Filter'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {lang === 'zh' ? '点击项目名称快速筛选记录' : 'Tap a category to filter the records'}
                </p>
              </div>
            </div>
            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-bold text-zinc-500">
              {filteredRecords.length}
              <span className="ml-1">{lang === 'zh' ? '条' : 'items'}</span>
            </span>
          </div>

          <div className="mt-4 no-scrollbar overflow-x-auto rounded-[1.35rem] border border-zinc-200/80 bg-zinc-100/80 p-1.5">
            <div className="flex w-max gap-1.5">
              {categories.map((category) => {
                const active = category.key === activeType;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveType(category.key)}
                    disabled={deleteBusy}
                    className={`shrink-0 rounded-[1rem] px-4 py-2.5 text-sm font-bold transition ${
                      active
                        ? 'bg-white text-zinc-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
                        : 'text-zinc-600 hover:bg-white/75 hover:text-zinc-900'
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-28 sm:pb-24">
          {filteredRecords.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-black text-zinc-800">
                {lang === 'zh' ? '这个分类还没有记录' : 'No records in this category yet'}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {lang === 'zh' ? '换一个分类看看，或者先新增一笔日常开销。' : 'Try another category or add a new daily cost first.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((cost) => {
              const checked = selectedIds.includes(cost.id);
              return (
                <div
                  key={cost.id}
                  className={`rounded-[1.75rem] border bg-white p-4 shadow-sm transition sm:p-5 ${
                    checked ? 'border-red-200 ring-2 ring-red-100' : 'border-zinc-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {selectionMode ? (
                          <button
                            type="button"
                            onClick={() => toggleRecordSelection(cost.id)}
                            disabled={deleteBusy}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                              checked
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {lang === 'zh' ? (checked ? '已选择' : '选择') : checked ? 'Selected' : 'Select'}
                          </button>
                        ) : null}
                        <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700">
                          {cost.cost_type || text.categoryOther || (lang === 'zh' ? '其他' : 'Other')}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400">
                          <ReceiptText className="h-3.5 w-3.5" />
                          {formatDateDisplay(cost.cost_date || cost.date)}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-black tracking-tight text-zinc-900">
                        {formatCurrency(cost.amount)}
                      </p>
                      {Number(cost.quantity || 0) > 0 && Number(cost.unit_cost || 0) > 0 ? (
                        <p className="mt-1 text-sm font-medium text-zinc-500">
                          {Number(cost.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} × {formatCurrency(cost.unit_cost)}
                        </p>
                      ) : null}
                      {cost.note ? (
                        <p className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                          {cost.note}
                        </p>
                      ) : null}
                    </div>

                    {!selectionMode ? (
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteTargetIds([cost.id])}
                        disabled={deleteBusy}
                        className="min-h-[40px] rounded-2xl px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {selectionMode && selectedCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-[130] border-t border-zinc-200 bg-white/96 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-zinc-900">
                {lang === 'zh'
                  ? `已选择 ${selectedCount} 笔记录`
                  : `${selectedCount} record${selectedCount === 1 ? '' : 's'} selected`}
              </p>
              <p className="text-xs text-zinc-500">
                {lang === 'zh' ? '可以一次删除多笔资料。' : 'You can delete multiple records at once.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteTargetIds(selectedIds)}
              disabled={deleteBusy}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {lang === 'zh' ? '删除所选' : 'Delete Selected'}
            </button>
          </div>
        </div>
      ) : null}

      {deleteTargetIds.length > 0 ? (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/35 px-4 py-4 backdrop-blur-sm sm:items-center sm:px-6">
          <div className="w-full max-w-md rounded-[1.75rem] border border-red-100 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  {lang === 'zh' ? '确认删除？' : 'Confirm deletion?'}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {deletingMultiple
                    ? (lang === 'zh'
                        ? `确定要删除这 ${deleteTargetIds.length} 笔记录吗？删除后无法恢复。`
                        : `Delete these ${deleteTargetIds.length} records? This cannot be undone.`)
                    : (lang === 'zh'
                        ? '确定要删除这笔记录吗？删除后无法恢复。'
                        : 'Delete this record? This cannot be undone.')}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetIds([])}
                disabled={deleteBusy}
                className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {lang === 'zh' ? '确认删除' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteBusy ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-white/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-zinc-200 bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <h3 className="mt-4 text-lg font-black text-zinc-900">
              {lang === 'zh' ? '正在删除，请稍候' : 'Deleting, please wait'}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {deletingMultiple
                ? (lang === 'zh'
                    ? '系统正在处理多笔删除，请先不要进行其他操作。'
                    : 'We are deleting multiple records now, so please wait before doing anything else.')
                : (lang === 'zh'
                    ? '系统正在处理这笔删除，请先不要进行其他操作。'
                    : 'We are deleting this record now, so please wait before doing anything else.')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
