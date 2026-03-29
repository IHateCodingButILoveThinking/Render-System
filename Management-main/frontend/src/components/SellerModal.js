import React from "react";
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const backdropTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

const panelTransition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 0.95,
};

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 44,
    scale: 0.94,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...panelTransition,
      delayChildren: 0.05,
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: 28,
    scale: 0.975,
    filter: "blur(6px)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function SellerModal({ ctx }) {
  const {
    showSellerModal,
    setShowSellerModal,
    lang,
    t,
    text,
    handleCreateSeller,
    sellerForm,
    setSellerForm,
    Input,
    Button,
    submittingKey,
  } = ctx;

  return (
    <AnimatePresence mode="wait">
      {showSellerModal ? (
        <>
          <motion.button
            type="button"
            onClick={() => setShowSellerModal(false)}
            className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.16),transparent_40%),rgba(24,24,27,0.38)] backdrop-blur-md"
            aria-label={lang === "zh" ? "关闭客户弹窗" : "Close seller modal"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />
          <div className="fixed inset-0 z-[60] flex items-end justify-center px-0 sm:items-center sm:px-6">
            <motion.div
              className="relative w-full max-h-[88dvh] overflow-y-auto rounded-t-[1.85rem] border border-emerald-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.95))] p-3 shadow-[0_32px_100px_rgba(15,23,42,0.2)] sm:max-w-2xl sm:rounded-[2.2rem] sm:p-6"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-[2rem] bg-gradient-to-b from-white/80 to-transparent" />
              <motion.div
                variants={itemVariants}
                className="relative mb-2 h-1.5 w-16 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-400 shadow-[0_8px_30px_rgba(52,211,153,0.35)] sm:hidden"
              />
              <motion.div
                variants={itemVariants}
                className="relative mb-4 flex items-start justify-between gap-3 sm:mb-5"
              >
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {lang === "zh" ? "快速设置" : "Quick Setup"}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    {t.sellers}
                  </p>
                  <h3 className="mt-1 text-base font-black tracking-tight sm:text-lg">
                    {text.addSellerInfo ||
                      (lang === "zh" ? "添加客户资料" : "Add Seller Info")}
                  </h3>
                  <p className="mt-1 hidden text-sm text-zinc-500 sm:block">
                    {text.setupSellerHint ||
                      (lang === "zh"
                        ? "请先保存客户资料，之后才能新增进货批次。"
                        : "Save seller details first, then add product lots.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSellerModal(false)}
                  className="rounded-full border border-white/80 bg-white/80 p-2 text-zinc-400 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-zinc-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </motion.div>
              <motion.form
                onSubmit={handleCreateSeller}
                className="grid gap-2.5 sm:grid-cols-2 sm:gap-3"
                variants={itemVariants}
              >
                <motion.div variants={itemVariants} className="sm:col-span-2">
                  <Input
                    size="compact"
                    label={t.seller}
                    value={sellerForm.name}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Input
                    size="compact"
                    label={t.phone}
                    value={sellerForm.phone}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Input
                    size="compact"
                    label={text.address}
                    value={sellerForm.address}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="mt-1 flex gap-2 sm:col-span-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowSellerModal(false)}
                    className="min-h-[40px] w-full rounded-xl border border-white/80 bg-white/80 shadow-sm sm:min-h-[46px] sm:w-auto sm:rounded-2xl"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingKey === "seller"}
                    className="min-h-[40px] w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 shadow-[0_16px_32px_rgba(16,185,129,0.22)] hover:shadow-[0_20px_40px_rgba(34,197,94,0.24)] sm:min-h-[46px] sm:w-auto sm:rounded-2xl"
                  >
                    {submittingKey === "seller" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {text.addSellerInfo ||
                      (lang === "zh" ? "添加客户资料" : "Add Seller Info")}
                  </Button>
                </motion.div>
              </motion.form>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
