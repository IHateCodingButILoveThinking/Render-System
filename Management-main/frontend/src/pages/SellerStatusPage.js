import React from 'react';
import { AlertCircle, ArrowLeft, Loader2, ShieldAlert, Trash2 } from 'lucide-react';

export default function SellerStatusPage({ ctx }) {
  const {
    seller,
    text,
    lang,
    Button,
    submittingKey,
    handleToggleSellerQuality,
    handleDeleteSeller,
    onBack,
  } = ctx;

  return (
    <section className="space-y-5">
      <div className="rounded-[1.6rem] border border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-white p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === 'zh' ? '返回客户详情' : 'Back to Customer Detail'}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900">{lang === 'zh' ? '客户状态管理' : 'Customer Status Management'}</h2>
            <p className="mt-1 text-xs text-zinc-500">{seller.name}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-zinc-500">
          {lang === 'zh' ? '在这里管理品质状态，或删除这位客户资料。' : 'Manage quality status or delete this customer here.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant={seller.bad_quality ? 'secondary' : 'outline'}
            onClick={() => handleToggleSellerQuality(seller)}
            disabled={submittingKey === `seller-quality-${seller.id}`}
            className="w-full sm:w-auto"
          >
            {submittingKey === `seller-quality-${seller.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            {seller.bad_quality ? text.clearBadSeller : text.markBadSeller}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleDeleteSeller(seller)}
            disabled={submittingKey === `seller-delete-${seller.id}`}
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
          >
            {submittingKey === `seller-delete-${seller.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {text.deleteSeller}
          </Button>
        </div>
      </div>
    </section>
  );
}
